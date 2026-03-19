import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DealPayload {
  asin: string
  title: string
  image_url: string
  current_price: number
  original_price: number | null
  discount_percent: number | null
  coupon_value: string | null
  coupon_type: 'percentage' | 'fixed' | null
  affiliate_url: string
  expires_at: string | null
  is_lightning: boolean
  badge: string | null
  rating: string | null
  rating_count: string | null
}

// ── Auth helper ───────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  const expected = process.env.IMPORT_API_KEY
  return !!(expected && token === expected)
}

// ── POST /api/admin/import-deals ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let deals: DealPayload[]
  try {
    deals = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(deals) || deals.length === 0) {
    return NextResponse.json({ error: 'Expected non-empty array of deals' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find Amazon UAE store ID
  const { data: amazonStore } = await supabase
    .from('stores')
    .select('id')
    .ilike('name', '%amazon%')
    .single()

  const storeId = amazonStore?.id ?? null

  const results: { asin: string; success: boolean; error?: string }[] = []

  for (const deal of deals) {
    try {
      // 1. Upsert product by ASIN (find existing or create stub)
      let productId: string | null = null

      if (deal.asin) {
        // Try to find existing product by ASIN in specs or slug pattern
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('sku', deal.asin)
          .maybeSingle()

        productId = existing?.id ?? null

        if (!productId) {
          // Create a stub product
          const slug = deal.title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 6)
            .join('-')

          const { data: newProduct, error: prodError } = await supabase
            .from('products')
            .insert({
              name_en: deal.title,
              slug: `${slug}-${deal.asin.toLowerCase()}`,
              sku: deal.asin,
              image_url: deal.image_url || null,
              thumbnail_url: deal.image_url || null,
              base_price: deal.current_price,
              status: 'draft',
              is_active: false,
              currency: 'AED',
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (prodError) {
            // Slug might conflict — try with timestamp
            const { data: retryProduct } = await supabase
              .from('products')
              .insert({
                name_en: deal.title,
                slug: `${slug}-${Date.now()}`,
                sku: deal.asin,
                image_url: deal.image_url || null,
                thumbnail_url: deal.image_url || null,
                base_price: deal.current_price,
                status: 'draft',
                is_active: false,
                currency: 'AED',
                updated_at: new Date().toISOString(),
              })
              .select('id')
              .single()
            productId = retryProduct?.id ?? null
          } else {
            productId = newProduct?.id ?? null
          }
        }
      }

      // 2. Upsert deal record
      const dealData = {
        product_id: productId,
        store_id: storeId,
        asin: deal.asin || null,
        title_en: deal.title,
        image_url: deal.image_url || null,
        deal_price: deal.current_price,
        final_price: deal.current_price,
        original_price: deal.original_price ?? null,
        discount_percent: deal.discount_percent ?? null,
        coupon_value: deal.coupon_value ?? null,
        coupon_type: deal.coupon_type ?? null,
        affiliate_url: deal.affiliate_url || null,
        expires_at: deal.expires_at ?? null,
        source: 'amazon_deals',
        is_active: true,
        updated_at: new Date().toISOString(),
      }

      if (deal.asin) {
        await supabase
          .from('deals')
          .upsert(dealData, { onConflict: 'asin', ignoreDuplicates: false })
      } else {
        await supabase.from('deals').insert(dealData)
      }

      // 3. Record price history
      if (productId && storeId) {
        await supabase.from('price_history').insert({
          product_id: productId,
          store_id: storeId,
          price: deal.current_price,
          currency: 'AED',
          source: 'amazon_deals',
        })
      }

      results.push({ asin: deal.asin, success: true })
    } catch (err) {
      results.push({
        asin: deal.asin,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const successCount = results.filter(r => r.success).length

  return NextResponse.json({
    imported: successCount,
    total: deals.length,
    errors: results.filter(r => !r.success),
  })
}
