// app/api/admin/import-product/route.ts
// Receives scraped product data from the Chrome extension and creates or updates a product.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { uploadImage } from '@/lib/r2-storage'

// ── Auth ──────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const auth  = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  return !!token && token === process.env.IMPORT_API_KEY
}

// ── FIX 1: Slug (max 6 words) ─────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join('-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function uniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
  base: string
): Promise<string> {
  let slug    = base
  let attempt = 0
  while (true) {
    const { data } = await supabase.from('products').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ── Image Fetcher & R2 Uploader ───────────────────────────────────────────────

async function fetchAndUploadImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UAEDiscountHub/1.0)' },
      signal:  AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer      = Buffer.from(await res.arrayBuffer())
    const fileName    = url.split('/').pop()?.split('?')[0] || 'product.jpg'
    const result      = await uploadImage(buffer, fileName, contentType)
    return result.url
  } catch {
    return null
  }
}

// ── FIX 8: DeepSeek Arabic translation ───────────────────────────────────────

async function translateToArabic(
  name: string,
  description: string
): Promise<{ name_ar: string; description_ar: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return { name_ar: '', description_ar: '' }

  try {
    const prompt = `Translate the following product name and description to Arabic for a UAE e-commerce website. Return ONLY valid JSON with keys "name_ar" and "description_ar". Keep brand names and model numbers in English.

Product Name: ${name}
Description: ${description?.slice(0, 500) || ''}

Return format: {"name_ar": "...", "description_ar": "..."}`

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:      'deepseek-chat',
        messages:   [
          { role: 'system', content: 'You are a professional Arabic translator for UAE e-commerce. Return only valid JSON.' },
          { role: 'user',   content: prompt },
        ],
        temperature: 0.3,
        max_tokens:  400,
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) return { name_ar: '', description_ar: '' }

    const json    = await res.json()
    const content = json.choices?.[0]?.message?.content?.trim() || ''
    // Strip markdown code fences if present
    const cleaned = content.replace(/^```json?\s*/i, '').replace(/\s*```$/, '')
    const parsed  = JSON.parse(cleaned)
    return {
      name_ar:        parsed.name_ar        || '',
      description_ar: parsed.description_ar || '',
    }
  } catch (err) {
    console.warn('[import-product] Arabic translation failed (non-fatal):', err)
    return { name_ar: '', description_ar: '' }
  }
}

// ── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Auth
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse body
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = (body.name as string || '').trim()
  if (!name) {
    return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 3. Find or create category
  let categoryId: string | null = null
  const categoryName = (body.category as string || '').trim()
  if (categoryName) {
    const { data: existingCat } = await supabase
      .from('categories')
      .select('id')
      .ilike('name_en', categoryName)
      .maybeSingle()

    if (existingCat) {
      categoryId = existingCat.id
    } else {
      const catSlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const { data: newCat } = await supabase
        .from('categories')
        .insert({ name_en: categoryName, slug: catSlug, is_active: true })
        .select('id')
        .single()
      if (newCat) categoryId = newCat.id
    }
  }

  // 4. Upload images to R2 (primary + up to 4 additional) — run in parallel
  const sourceImages: string[] = Array.isArray(body.images) ? (body.images as string[]) : []
  const thumbnailSrc: string   = (body.thumbnail_url as string) || sourceImages[0] || ''
  const remaining               = sourceImages.filter(u => u !== thumbnailSrc).slice(0, 4)

  const [primaryImageUrl, ...additionalImageUrls] = await Promise.all([
    thumbnailSrc ? fetchAndUploadImage(thumbnailSrc) : Promise.resolve(null),
    ...remaining.map(fetchAndUploadImage),
  ])
  const filteredAdditional = additionalImageUrls.filter((u): u is string => !!u)

  // 5. FIX 8: Translate to Arabic (run in parallel with image uploads, non-blocking)
  const description = (body.description as string) || ''
  const { name_ar, description_ar } = await translateToArabic(name, description)

  // 6. Build product record & Check for existing by SKU/ASIN
  const asin:        string | null = (body.asin as string) || null
  const rawPrice    = parseFloat(body.price as string) || null
  const rawOriginal = parseFloat(body.original_price as string) || null
  const status      = (body.status as string) === 'published' ? 'published' : 'draft'
  const specs       = (typeof body.specs === 'object' && body.specs !== null)
                        ? body.specs as Record<string, string>
                        : {}
  const tags        = Array.isArray(body.tags) ? (body.tags as string[]) : []

  // Check for existing product by SKU (ASIN)
  let productId: string | null = null
  let finalSlug: string | null = null

  if (asin) {
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, slug')
      .eq('sku', asin)
      .maybeSingle()
    
    if (existingProduct) {
      productId = existingProduct.id
      finalSlug = existingProduct.slug
      console.log(`[import-product] Found existing product ${productId} for ASIN ${asin}`)
    }
  }

  if (!productId) {
    const baseSlug = toSlug(name)
    finalSlug = await uniqueSlug(supabase, baseSlug)

    const productRow = {
      name_en:          name,
      name_ar:          name_ar || null,
      slug:             finalSlug,
      brand:            (body.brand as string) || null,
      category_id:      categoryId,
      status,
      is_active:        status === 'published',
      image_url:        primaryImageUrl || thumbnailSrc || null,
      thumbnail_url:    primaryImageUrl || thumbnailSrc || null,
      images:           filteredAdditional.length > 0 ? filteredAdditional : null,
      description_en:   description || null,
      description_ar:   description_ar || null,
      base_price:       rawPrice,
      currency:         'AED',
      specifications:   Object.keys(specs).length > 0 ? specs : null,
      tags:             tags.length > 0 ? tags : null,
      sku:              asin,
      asin:             asin, // keep both for compat
      updated_at:       new Date().toISOString(),
    }

    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert(productRow)
      .select('id, slug')
      .single()

    if (productError || !newProduct) {
      console.error('[import-product] insert error', productError)
      return NextResponse.json(
        { error: productError?.message || 'Failed to create product' },
        { status: 500 }
      )
    }
    productId = newProduct.id
    finalSlug = newProduct.slug
  } else {
    // Update existing product metadata/timestamp
    await supabase.from('products').update({ 
      updated_at: new Date().toISOString() 
    }).eq('id', productId)
  }

  // 7. Upsert store price row + record price history
  const storeId:    string | null = (body.default_store_id as string) || null
  const affiliateUrl: string      = (body.affiliate_url as string) || (body.source_url as string) || ''

  if (storeId && productId && rawPrice && affiliateUrl) {
    const { error: priceError } = await supabase
      .from('product_store_prices')
      .upsert({
        product_id:     productId,
        store_id:       storeId,
        price:          rawPrice,
        original_price: rawOriginal,
        affiliate_url:  affiliateUrl,
        in_stock:       true,
        is_best_price:  true,
        last_checked:   new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'product_id,store_id' })
    
    if (priceError) {
      console.warn('[import-product] store price upsert (non-fatal):', priceError.message)
    }

    // FIX 5B: Record initial price history point
    const { error: phError } = await supabase.from('price_history').insert({
      product_id: productId,
      store_id:   storeId,
      asin,
      price:      rawPrice,
      currency:   'AED',
      source:     'extension_import',
    })
    if (phError) {
      console.error('❌ price_history insert failed:', phError.message, phError.details)
    }
  }

  // 8. Return success
  return NextResponse.json({
    success:        true,
    productId,
    slug:           finalSlug,
    editUrl:        `/en/admin/products/${productId}/edit`,
    translatedAr:   !!name_ar,
    imagesUploaded: (primaryImageUrl ? 1 : 0) + filteredAdditional.length,
  })
}
