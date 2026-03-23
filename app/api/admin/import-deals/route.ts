import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DealPayload {
  asin: string
  // new scraper fields
  name?: string
  deal_price?: number
  final_price?: number
  coupon_text?: string | null
  coupon_value?: string | number | null
  coupon_type?: 'percentage' | 'amount' | 'fixed' | null
  limited_deal_percent?: number | null
  is_limited_time?: boolean
  // legacy scraper fields (backwards compat)
  title?: string
  current_price?: number
  is_lightning?: boolean
  badge?: string | null
  // shared
  image_url?: string | null
  original_price?: number | null
  discount_percent?: number | null
  affiliate_url?: string | null
  expires_at?: string | null
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

  let storeId = amazonStore?.id ?? null
  
  // Robust fallback: if ilike fails, use the known Amazon UAE ID we found in the DB
  if (!storeId) {
    storeId = '63a7593f-9541-4286-8186-8247282a438a'
  }

  const results: { asin: string; success: boolean; error?: string }[] = []

  for (const deal of deals) {
    try {
      // Normalise field names — support both new scraper (name/deal_price) and legacy (title/current_price)
      const productName  = deal.name || deal.title || ''
      const currentPrice = deal.deal_price ?? deal.current_price ?? 0
      const finalPrice   = deal.final_price ?? currentPrice
      // coupon_value may be a number (new) or string (old) — store as string for the DB TEXT column
      const couponValueStr = deal.coupon_value != null ? String(deal.coupon_value) : null
      // Normalise coupon type to match DB CHECK constraint: ('percentage', 'fixed', NULL)
      let couponTypeStr: string | null = null
      if (deal.coupon_type) {
        const ct = String(deal.coupon_type).toLowerCase()
        if (ct.includes('percent')) couponTypeStr = 'percentage'
        else if (ct.includes('fixed') || ct.includes('amount')) couponTypeStr = 'fixed'
      }

      if (!productName || !currentPrice) {
        results.push({ asin: deal.asin, success: false, error: 'Missing name or price' })
        continue
      }

      // 1. Upsert product stub by ASIN
      let productId: string | null = null

      if (deal.asin) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('sku', deal.asin)
          .maybeSingle()

        productId = existing?.id ?? null

        if (!productId) {
          const slug = productName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 6)
            .join('-')

          const { data: newProduct, error: prodError } = await supabase
            .from('products')
            .insert({
              name_en: productName,
              slug: `${slug}-${deal.asin.toLowerCase()}`,
              sku: deal.asin,
              image_url: deal.image_url || null,
              thumbnail_url: deal.image_url || null,
              base_price: currentPrice,
              status: 'draft',
              is_active: false,
              currency: 'AED',
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (prodError) {
            const { data: retryProduct } = await supabase
              .from('products')
              .insert({
                name_en: productName,
                slug: `${slug}-${Date.now()}`,
                sku: deal.asin,
                image_url: deal.image_url || null,
                thumbnail_url: deal.image_url || null,
                base_price: currentPrice,
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
        product_id:       productId,
        store_id:         storeId,
        asin:             deal.asin || null,
        title_en:         productName,
        image_url:        deal.image_url || null,
        deal_price:       Number(currentPrice) || 0,
        final_price:      Number(finalPrice) || Number(currentPrice) || 0,
        original_price:   deal.original_price ? Number(deal.original_price) : null,
        discount_percent: deal.discount_percent ? Math.round(Number(deal.discount_percent)) : null,
        coupon_value:     couponValueStr,
        coupon_type:      couponTypeStr,
        affiliate_url:    deal.affiliate_url || `https://www.amazon.ae/dp/${deal.asin}`, // Fallback for NOT NULL constraint
        expires_at:       deal.expires_at ?? null,
        source:           'amazon_deals',
        is_active:        true,
        updated_at:       new Date().toISOString(),
      }

      const { data: existingDeal } = deal.asin
        ? await supabase
          .from('deals')
          .select('id')
          .eq('asin', deal.asin)
          .maybeSingle()
        : { data: null }

      let dealError
      if (existingDeal) {
        // Update existing
        const { error } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', existingDeal.id)
        dealError = error
      } else {
        // Insert new
        const { error } = await supabase
          .from('deals')
          .insert(dealData)
        dealError = error
      }

      if (dealError) {
        throw new Error(`${dealError.message}${dealError.details ? ' - ' + dealError.details : ''}`)
      }

      // 3. Record price history
      if (productId && storeId) {
        const { error: histError } = await supabase.from('price_history').insert({
          product_id: productId,
          store_id:   storeId,
          price:      currentPrice,
          currency:   'AED',
          source:     'amazon_deals',
        })
        if (histError) {
          console.warn('[import-deals] price_history error (non-fatal):', histError.message)
        }
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
