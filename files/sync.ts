/**
 * Amazon Creators API Sync Service
 * Bridges Creators API data → Supabase tables
 * Drop-in replacement for the old paapi-based sync.ts
 */

import { createClient } from '@supabase/supabase-js'
import {
  getItems, searchItems, getVariations,
  type CreatorsConfig, type AmazonProduct,
} from './creators-api'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const CATEGORY_MAP: Record<string, string> = {
  'Smartphones': 'smartphones', 'Cell Phones': 'smartphones', 'Mobile Phones': 'smartphones',
  'Laptops': 'laptops', 'Notebook Computers': 'laptops',
  'Tablets': 'tablets',
  'Smart Watches': 'smartwatches',
  'Headphones': 'accessories', 'Earbuds': 'accessories', 'Speakers': 'accessories',
  'Televisions': 'appliances', 'Home Appliances': 'appliances',
  'Camera': 'cameras', 'Gaming': 'gaming',
}

function inferCategory(product: AmazonProduct): string {
  for (const cat of product.categories) {
    const mapped = CATEGORY_MAP[cat]
    if (mapped) return mapped
  }
  return 'electronics'
}

function makeSlug(title: string, asin: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60).replace(/-+$/, '')
    + '-' + asin.toLowerCase()
}

export async function upsertProductFromAmazon(product: AmazonProduct) {
  const supabase = getAdminClient()

  const categorySlug = inferCategory(product)
  const { data: category } = await supabase.from('categories').select('id').eq('slug', categorySlug).single()

  let brandId: string | null = null
  if (product.brand) {
    const brandSlug = product.brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { data: existingBrand } = await supabase.from('brands').select('id').eq('slug', brandSlug).maybeSingle()
    if (existingBrand) {
      brandId = existingBrand.id
    } else {
      const { data: newBrand } = await supabase.from('brands').insert({ slug: brandSlug, name_en: product.brand }).select('id').single()
      brandId = newBrand?.id ?? null
    }
  }

  const { data: store } = await supabase.from('stores').select('id').eq('slug', 'amazon-ae').single()
  if (!store) return { productId: null, isNew: false, error: 'Amazon AE store not found' }

  const { data: existingProduct } = await supabase.from('products').select('id, base_price').eq('asin', product.asin).maybeSingle()
  const isNew = !existingProduct
  const slug  = isNew ? makeSlug(product.title, product.asin) : undefined

  const productData: Record<string, any> = {
    name_en:        product.title,
    brand_id:       brandId,
    category_id:    category?.id ?? null,
    description_en: product.description,
    base_price:     product.price,
    image_url:      product.imageUrl,
    images:         product.images.map((url, i) => ({ url, is_primary: i === 0, alt_en: product.title })),
    specifications: product.specifications,
    ai_pros:        product.features.slice(0, 5),
    average_rating: product.rating,
    review_count:   product.reviewCount,
    is_active:      true,
    is_featured:    product.badge === "Amazon's Choice" || product.badge === 'Best Seller',
    asin:           product.asin,
    updated_at:     new Date().toISOString(),
  }
  if (slug) productData.slug = slug

  let productId: string
  if (existingProduct) {
    await supabase.from('products').update(productData).eq('id', existingProduct.id)
    productId = existingProduct.id
  } else {
    const { data: newProduct, error: insertErr } = await supabase.from('products').insert(productData).select('id').single()
    if (insertErr || !newProduct) return { productId: null, isNew: false, error: insertErr?.message ?? 'Insert failed' }
    productId = newProduct.id
  }

  const discountPct = product.discountPercent ?? (
    product.originalPrice && product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
  )

  await supabase.from('product_prices').upsert({
    product_id:        productId,
    store_id:          store.id,
    store_product_url: product.url,
    affiliate_url:     product.affiliateUrl,
    current_price:     product.price,
    original_price:    product.originalPrice ?? product.price,
    currency:          product.currency,
    discount_percent:  discountPct,
    in_stock:          product.isInStock,
    is_verified:       true,
    last_synced_at:    new Date().toISOString(),
  }, { onConflict: 'product_id,store_id' })

  if (product.price) {
    await supabase.from('price_history').insert({
      product_id:  productId,
      store_id:    store.id,
      price:       product.price,
      currency:    product.currency,
      recorded_at: new Date().toISOString(),
    })
  }

  // Auto-create deal if discount ≥ 10%
  if (discountPct >= 10 && product.price && product.isInStock) {
    await supabase.from('deals').upsert({
      product_id:     productId,
      store_id:       store.id,
      title_en:       `${product.title} — ${discountPct}% Off`,
      deal_price:     product.price,
      original_price: product.originalPrice ?? product.price,
      currency:       product.currency,
      affiliate_url:  product.affiliateUrl,
      badge_text:     discountPct >= 30 ? 'Hot Deal' : 'Deal',
      is_flash_sale:  discountPct >= 30,
      is_active:      true,
      expires_at:     new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    }, { onConflict: 'product_id,store_id' })
  }

  return { productId, isNew, error: null }
}

export async function syncAsinList(config: CreatorsConfig, asins: string[]) {
  const products = await getItems(config, asins)
  let synced = 0, created = 0, errors = 0

  for (const product of products) {
    const result = await upsertProductFromAmazon(product)
    if (result.error) { errors++; continue }
    if (result.isNew) created++
    synced++
    await new Promise(r => setTimeout(r, 100))
  }

  await logSync('asin_list_sync', asins.length, synced, errors)
  return { synced, created, errors }
}

export async function syncCategory(config: CreatorsConfig, query: string, options: { pages?: number } = {}) {
  let synced = 0, errors = 0
  const pages = options.pages ?? 2

  for (let page = 1; page <= pages; page++) {
    const result = await searchItems(config, query, { sortBy: 'AvgCustomerReviews', itemPage: page, minReviewsRating: 3 })
    for (const product of result.products) {
      const { error } = await upsertProductFromAmazon(product)
      if (error) { errors++; } else synced++
      await new Promise(r => setTimeout(r, 150))
    }
    if (page < pages) await new Promise(r => setTimeout(r, 1100))
  }

  return { synced, errors }
}

export async function refreshPrices(config: CreatorsConfig) {
  const supabase = getAdminClient()

  const { data: products } = await supabase
    .from('products').select('id, asin, base_price, name_en')
    .eq('is_active', true).not('asin', 'is', null).limit(200)

  if (!products?.length) return { updated: 0, priceDrops: 0, errors: 0 }

  const asins     = products.map(p => p.asin).filter(Boolean)
  const freshData = await getItems(config, asins)
  let updated = 0, priceDrops = 0, errors = 0

  for (const fresh of freshData) {
    const existing = products.find(p => p.asin === fresh.asin)
    if (!existing || !fresh.price) continue

    const isPriceDrop = fresh.price < (existing.base_price ?? Infinity)
    if (isPriceDrop) priceDrops++

    const result = await upsertProductFromAmazon(fresh)
    if (result.error) { errors++; continue }
    updated++

    if (isPriceDrop && result.productId) {
      await checkAndFirePriceAlerts(result.productId, fresh.price, fresh.affiliateUrl)
    }
  }

  await logSync('price_refresh', asins.length, updated, errors)
  return { updated, priceDrops, errors }
}

async function checkAndFirePriceAlerts(productId: string, currentPrice: number, affiliateUrl: string) {
  const supabase = getAdminClient()
  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('*, products(name_en), profiles(whatsapp_number)')
    .eq('product_id', productId).eq('is_active', true).eq('is_triggered', false)
    .lte('target_price', currentPrice)

  if (!alerts?.length) return

  for (const alert of alerts) {
    const productName = (alert.products as any)?.name_en ?? 'Product'
    const phone       = (alert.profiles as any)?.whatsapp_number
    if (phone && alert.alert_via === 'whatsapp') {
      await fetch('/api/alerts/trigger-whatsapp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, price: currentPrice, product: productName, url: affiliateUrl }),
      }).catch(console.error)
    }
    await supabase.from('price_alerts')
      .update({ is_triggered: true, triggered_at: new Date().toISOString() })
      .eq('id', alert.id)
  }
}

async function logSync(syncType: string, attempted: number, succeeded: number, failed: number) {
  const supabase = getAdminClient()
  const { data: store } = await supabase.from('stores').select('id').eq('slug', 'amazon-ae').single()
  await supabase.from('api_sync_logs').insert({
    store_id:        store?.id,
    sync_type:       syncType,
    status:          failed === 0 ? 'success' : succeeded > 0 ? 'partial' : 'failed',
    records_updated: succeeded,
    error_message:   failed > 0 ? `${failed}/${attempted} failed` : null,
    synced_at:       new Date().toISOString(),
  })
}
