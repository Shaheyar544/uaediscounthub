import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { AmazonCreatorsAPI } from '@/lib/amazon-creators-api';

export const dynamic = 'force-dynamic';

// Helper to check Authorization header matches IMPORT_API_KEY
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const expected = process.env.IMPORT_API_KEY;
  return !!(expected && token === expected);
}

// Utility to chunk array into smaller arrays of size N
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Delay helper to prevent throttling
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Separate asynchronous background sync runner
async function performSync(storeId: string) {
  const startTime = Date.now();
  const supabase = createAdminClient();

  try {
    // 3. Fetch unique ASINs from products (stored in sku and/or asin) and deals
    const [productsResult, dealsResult] = await Promise.all([
      supabase.from('products').select('id, sku, asin'),
      supabase.from('deals').select('id, asin').not('asin', 'is', null)
    ]);

    if (productsResult.error) throw new Error(`Fetch products failed: ${productsResult.error.message}`);
    if (dealsResult.error) throw new Error(`Fetch deals failed: ${dealsResult.error.message}`);

    const productMap = new Map<string, string[]>(); // ASIN -> ProductId[]
    const asinRegex = /^[A-Z0-9]{10}$/i;

    productsResult.data?.forEach(p => {
      if (p.sku && asinRegex.test(p.sku)) {
        const skuUpper = p.sku.toUpperCase();
        const existing = productMap.get(skuUpper) || [];
        existing.push(p.id);
        productMap.set(skuUpper, existing);
      }
      if (p.asin && asinRegex.test(p.asin)) {
        const asinUpper = p.asin.toUpperCase();
        const existing = productMap.get(asinUpper) || [];
        if (!existing.includes(p.id)) {
          existing.push(p.id);
          productMap.set(asinUpper, existing);
        }
      }
    });

    const dealAsins = new Set<string>();
    dealsResult.data?.forEach(d => {
      if (d.asin && asinRegex.test(d.asin)) {
        dealAsins.add(d.asin.toUpperCase());
      }
    });

    // Merge unique, valid Amazon ASINs (exactly 10 alphanumeric characters)
    const allAsins = Array.from(new Set([
      ...productMap.keys(),
      ...dealAsins
    ])).filter(asin => /^[A-Z0-9]{10}$/i.test(asin));

    console.log(`[cron/update-prices] Found ${allAsins.length} unique Amazon ASINs to update.`);

    if (allAsins.length === 0) {
      console.log('[cron/update-prices] No active Amazon products or deals found to update.');
      return;
    }

    // 4. Chunk ASINs into batches of 10 (Amazon API maximum)
    const batches = chunkArray(allAsins, 10);
    let successCount = 0;
    const errors: string[] = [];

    // 5. Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[cron/update-prices] Processing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`);

      try {
        // Fetch product details from Amazon Creators API
        const amazonProducts = await AmazonCreatorsAPI.getProducts(batch);
        console.log(`[cron/update-prices] Batch ${i + 1} returned ${amazonProducts.length} items from Amazon.`);

        for (const item of amazonProducts) {
          const normalizedAsin = item.asin.toUpperCase();
          
          if (!item.price || item.price <= 0) {
            console.log(`[cron/update-prices] Skipping ASIN ${item.asin} due to invalid price: ${item.price}`);
            continue;
          }

          // A. Update products and product_store_prices
          const productIds = productMap.get(normalizedAsin) || [];
          for (const productId of productIds) {
            // Upsert the price comparison record
            const { error: priceError } = await supabase
              .from('product_store_prices')
              .upsert({
                product_id: productId,
                store_id: storeId,
                price: item.price,
                original_price: item.savings ? (item.price + Number(item.savings)) : null,
                affiliate_url: item.url,
                last_checked: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'product_id,store_id' });

            if (priceError) {
              console.error(`[cron/update-prices] Failed to update price for product ${productId}:`, priceError.message);
              errors.push(`Product Price Update Error (${item.asin}): ${priceError.message}`);
            } else {
              // Update the base product price in the products table
              const { error: productUpdateError } = await supabase
                .from('products')
                .update({
                  base_price: item.price,
                  updated_at: new Date().toISOString()
                })
                .eq('id', productId);

              if (productUpdateError) {
                console.error(`[cron/update-prices] Failed to update base_price for product ${productId}:`, productUpdateError.message);
                errors.push(`Product Base Price Update Error (${item.asin}): ${productUpdateError.message}`);
              }

              // Insert into price history
              const { error: historyError } = await supabase
                .from('price_history')
                .insert({
                  product_id: productId,
                  store_id: storeId,
                  asin: item.asin,
                  price: item.price,
                  currency: item.currency || 'AED',
                  source: 'cron_update'
                });

              if (historyError) {
                console.warn(`[cron/update-prices] Failed to log price history for ${productId}:`, historyError.message);
              }
            }
          }

          // B. Update deals table
          const { data: matchingDeals } = await supabase
            .from('deals')
            .select('id')
            .eq('asin', item.asin);

          if (matchingDeals && matchingDeals.length > 0) {
            for (const deal of matchingDeals) {
              const { error: dealError } = await supabase
                .from('deals')
                .update({
                  deal_price: item.price,
                  final_price: item.price,
                  discount_percent: item.discountPercent ? Math.round(Number(item.discountPercent)) : null,
                  original_price: item.savings ? (item.price + Number(item.savings)) : null
                })
                .eq('id', deal.id);

              if (dealError) {
                console.error(`[cron/update-prices] Failed to update deal ${deal.id}:`, dealError.message);
                errors.push(`Deal Update Error (${item.asin}): ${dealError.message}`);
              }
            }
          }

          successCount++;
        }
      } catch (batchErr: any) {
        console.error(`[cron/update-prices] Batch ${i + 1} failed:`, batchErr.message);
        errors.push(`Batch ${i + 1} Error: ${batchErr.message}`);
      }

      // Add a 1.5 second delay between batches to respect API rate limits
      if (i < batches.length - 1) {
        await delay(1500);
      }
    }

    // 6. Log sync status to api_sync_logs
    const durationMs = Date.now() - startTime;
    await supabase.from('api_sync_logs').insert({
      store_id: storeId,
      sync_type: 'price_update',
      status: errors.length === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed'),
      records_updated: successCount,
      error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null,
      duration_ms: durationMs
    });

    console.log(`[cron/update-prices] Successfully completed background sync. Updated ${successCount} items.`);
  } catch (error: any) {
    console.error('[cron/update-prices] Fatal error in background sync:', error.message);
    // Log fatal error to sync logs
    const durationMs = Date.now() - startTime;
    await supabase.from('api_sync_logs').insert({
      store_id: storeId,
      sync_type: 'price_update',
      status: 'failed',
      records_updated: 0,
      error_message: error.message,
      duration_ms: durationMs
    });
  }
}

export async function POST(req: NextRequest) {
  // 1. Auth check
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 2. Find Amazon UAE store ID (limit(1).maybeSingle() protects against cardinality errors)
  const { data: amazonStore } = await supabase
    .from('stores')
    .select('id')
    .ilike('name', '%amazon%')
    .limit(1)
    .maybeSingle();

  const storeId = amazonStore?.id ?? null;
  if (!storeId) {
    return NextResponse.json({ error: 'Amazon store not found in database' }, { status: 404 });
  }

  // Trigger sync asynchronously in the background so HTTP connection returns immediately
  try {
    const { waitUntil } = require('next/server');
    if (typeof waitUntil === 'function') {
      waitUntil(performSync(storeId));
    } else {
      performSync(storeId).catch(err => {
        console.error('[cron/update-prices] Background sync error:', err.message);
      });
    }
  } catch (e) {
    performSync(storeId).catch(err => {
      console.error('[cron/update-prices] Background sync error:', err.message);
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Amazon price sync successfully initiated in background.'
  });
}
