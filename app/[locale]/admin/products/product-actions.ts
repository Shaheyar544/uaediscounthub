'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Shared Types ─────────────────────────────────────────────────────────────

export interface StorePrice {
  id?: string
  store_id: string
  price: number
  original_price: number | null
  affiliate_url: string
  coupon_code: string
  coupon_discount: string
  in_stock: boolean
  is_best_price: boolean
}

export interface SpecEntry {
  key: string
  value: string
}

export interface ProductPayload {
  id?: string
  name_en: string
  name_ar: string
  slug: string
  brand: string
  model: string
  sku: string
  category_id: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  image_url: string
  additional_images: string[]
  description_en: string
  description_ar: string
  specs: SpecEntry[]
  meta_title: string
  meta_description: string
  is_featured: boolean
  is_trending: boolean
  store_prices: StorePrice[]
  removed_price_ids: string[]
}

export interface SaveResult {
  success: boolean
  productId?: string
  slug?: string
  error?: string
  storeErrors?: string[]   // non-fatal: product saved but some store prices failed
}

// ── Save Product ──────────────────────────────────────────────────────────────

export async function saveProduct(payload: ProductPayload): Promise<SaveResult> {
  const supabase = createAdminClient()

  // Convert spec entries array → object
  const specsObj: Record<string, string> = {}
  payload.specs.forEach(s => {
    if (s.key.trim()) specsObj[s.key.trim()] = s.value
  })

  // Find minimum price to use as base_price
  const validPrices = payload.store_prices.filter(sp => sp.store_id && sp.price > 0)
  const minPrice = validPrices.length > 0
    ? Math.min(...validPrices.map(sp => sp.price))
    : null

  const productData: Record<string, unknown> = {
    name_en: payload.name_en,
    name_ar: payload.name_ar || null,
    slug: payload.slug,
    brand: payload.brand || null,
    model: payload.model || null,
    sku: payload.sku || null,
    category_id: payload.category_id || null,
    status: payload.status,
    tags: payload.tags.length > 0 ? payload.tags : null,
    image_url: payload.image_url || null,
    thumbnail_url: payload.image_url || null,
    // Store additional images as JSONB array of URL strings
    images: payload.additional_images.length > 0 ? payload.additional_images : null,
    description_en: payload.description_en || null,
    description_ar: payload.description_ar || null,
    specifications: Object.keys(specsObj).length > 0 ? specsObj : null,
    // Write to both new columns and existing SEO columns for compatibility
    meta_title: payload.meta_title || null,
    meta_description: payload.meta_description || null,
    seo_title_en: payload.meta_title || null,
    seo_description_en: payload.meta_description || null,
    is_featured: payload.is_featured,
    is_trending: payload.is_trending,
    is_active: payload.status === 'published',
    base_price: minPrice,
    updated_at: new Date().toISOString(),
  }

  let productId: string

  if (payload.id) {
    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', payload.id)
    if (error) return { success: false, error: error.message }
    productId = payload.id
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...productData, currency: 'AED' })
      .select('id')
      .single()
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to insert product' }
    productId = (data as { id: string }).id
  }

  // Delete removed store price rows (edit mode)
  if (payload.removed_price_ids.length > 0) {
    await supabase
      .from('product_store_prices')
      .delete()
      .in('id', payload.removed_price_ids)
  }

  // Upsert each store price row — collect errors instead of swallowing them
  const storeErrors: string[] = []
  for (const sp of validPrices) {
    const isBest = sp.price === minPrice
    const { error } = await supabase
      .from('product_store_prices')
      .upsert(
        {
          product_id: productId,
          store_id: sp.store_id,
          price: sp.price,
          original_price: sp.original_price ?? null,
          affiliate_url: sp.affiliate_url,
          coupon_code: sp.coupon_code || null,
          coupon_discount: sp.coupon_discount || null,
          in_stock: sp.in_stock,
          is_best_price: isBest,
          last_checked: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'product_id,store_id' }
      )
    if (error) {
      console.error('[product_store_prices upsert]', sp.store_id, error.message)
      storeErrors.push(`Store ${sp.store_id}: ${error.message}`)
      continue
    }

    // FIX 5C: Record price history on every save/update
    const { error: phError } = await supabase.from('price_history').insert({
      product_id: productId,
      store_id:   sp.store_id,
      price:      sp.price,
      currency:   'AED',
      source:     'admin_save',
    })
    if (phError) {
      console.error('❌ price_history insert failed:', phError.message, phError.details)
    }

    // FIX 7C: Sync coupon to coupons table when a code is present
    if (sp.coupon_code && sp.store_id) {
      await supabase.from('coupons').upsert(
        {
          store_id:       sp.store_id,
          code:           sp.coupon_code,
          title_en:       sp.coupon_discount || `Save with code ${sp.coupon_code}`,
          discount_value: null,
          is_active:      true,
          product_id:     productId,
          source:         'product_import',
        },
        { onConflict: 'code,store_id', ignoreDuplicates: false }
      )
    }
  }

  // Revalidate all affected pages
  revalidatePath(`/en/product/${payload.slug}`)
  revalidatePath(`/ar/product/${payload.slug}`)
  revalidatePath('/en')
  revalidatePath('/ar')
  revalidatePath('/en/admin/products')
  revalidatePath('/ar/admin/products')

  return {
    success: true,
    productId,
    slug: payload.slug,
    ...(storeErrors.length > 0 && { storeErrors }),
  }
}

// ── Delete Product ────────────────────────────────────────────────────────────

export async function deleteProductById(
  id: string,
  slug: string,
  locale: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/${locale}/admin/products`)
  revalidatePath(`/en/product/${slug}`)
  revalidatePath(`/ar/product/${slug}`)

  return { success: true }
}
