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

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. Auth check
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 2. Find Amazon UAE store ID
  const { data: amazonStore } = await supabase
    .from('stores')
    .select('id')
    .ilike('name', '%amazon%')
    .single();

  const storeId = amazonStore?.id ?? null;
  if (!storeId) {
    return NextResponse.json({ error: 'Amazon store not found in database' }, { status: 404 });
  }

  try {
    // 3. Fetch unique ASINs from products (stored in sku) and deals
    const [productsResult, dealsResult] = await Promise.all([
      supabase.from('products').select('id, sku').not('sku', 'is', null),
      supabase.from('deals').select('id, asin').not('asin', 'is', null)
    ]);

    if (productsResult.error) throw new Error(`Fetch products failed: ${productsResult.error.message}`);
    if (dealsResult.error) throw new Error(`Fetch deals failed: ${dealsResult.error.message}`);

    const productMap = new Map<string, string>(); // ASIN -> ProductId
    productsResult.data.forEach(p => {
      if (p.sku) productMap.set(p.sku.toUpperCase(), p.id);
    });

    const dealAsins = new Set<string>();
    dealsResult.data.forEach(d => {
      if (d.asin) dealAsins.add(d.asin.toUpperCase());
    });

    // Merge unique, valid Amazon ASINs (exactly 10 alphanumeric characters)
    const allAsins = Array.from(new Set([
      ...productMap.keys(),
      ...dealAsins
    ])).filter(asin => /^[A-Z0-9]{10}$/i.test(asin));

    console.log(`[cron/update-prices] Found ${allAsins.length} unique Amazon ASINs to update.`);

    if (allAsins.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active Amazon products or deals found to update.',
        updated: 0
      });
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
          const productId = productMap.get(normalizedAsin);
          if (productId) {
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

    return NextResponse.json({
      success: true,
      message: `Completed sync. Updated ${successCount} products/deals.`,
      updated: successCount,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error: any) {
    console.error('[cron/update-prices] Fatal error:', error.message);
    
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

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
