// ═══════════════════════════════════════════════════════════
// app/api/amazon/sync/route.ts  — Creators API version
// ═══════════════════════════════════════════════════════════
import { NextResponse } from 'next/server'
import { syncAsinList, syncCategory, refreshPrices } from '@/lib/amazon/sync'
import type { CreatorsConfig } from '@/lib/amazon/creators-api'

function getConfig(): CreatorsConfig {
  return {
    credentialId:     process.env.AMAZON_CREDENTIAL_ID!,
    credentialSecret: process.env.AMAZON_CREDENTIAL_SECRET!,
    partnerTag:       process.env.AMAZON_PARTNER_TAG!,
    marketplace:      'www.amazon.ae',
  }
}

function validateSecret(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  return secret === process.env.CRON_SECRET
}

export async function POST(req: Request) {
  if (!validateSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const config = getConfig()
  const body   = await req.json().catch(() => ({}))
  const { type = 'refresh', asins, query, pages } = body
  const start  = Date.now()

  try {
    if (type === 'asins' && Array.isArray(asins)) {
      const result = await syncAsinList(config, asins)
      return NextResponse.json({ ...result, duration_ms: Date.now() - start })
    }
    if (type === 'category' && query) {
      const result = await syncCategory(config, query, { pages: pages ?? 2 })
      return NextResponse.json({ ...result, duration_ms: Date.now() - start })
    }
    if (type === 'refresh') {
      const result = await refreshPrices(config)
      return NextResponse.json({ ...result, duration_ms: Date.now() - start })
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  if (!validateSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const start  = Date.now()
  const result = await refreshPrices(getConfig())
  return NextResponse.json({ ...result, duration_ms: Date.now() - start })
}


// ═══════════════════════════════════════════════════════════
// app/api/amazon/search/route.ts  — Creators API version
// ═══════════════════════════════════════════════════════════
// GET /api/amazon/search?q=iphone+15&sort=Relevance&page=1
//
// (Save this as a separate file: app/api/amazon/search/route.ts)

/*
import { NextResponse } from 'next/server'
import { searchItems } from '@/lib/amazon/creators-api'
import { upsertProductFromAmazon } from '@/lib/amazon/sync'
import type { CreatorsConfig } from '@/lib/amazon/creators-api'

function getConfig(): CreatorsConfig {
  return {
    credentialId:     process.env.AMAZON_CREDENTIAL_ID!,
    credentialSecret: process.env.AMAZON_CREDENTIAL_SECRET!,
    partnerTag:       process.env.AMAZON_PARTNER_TAG!,
    marketplace:      'www.amazon.ae',
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query    = searchParams.get('q')?.trim()
  const sortBy   = (searchParams.get('sort') ?? 'Relevance') as any
  const page     = parseInt(searchParams.get('page') ?? '1')
  const minPrice = searchParams.get('min') ? parseInt(searchParams.get('min')!) : undefined
  const maxPrice = searchParams.get('max') ? parseInt(searchParams.get('max')!) : undefined

  if (!query || query.length < 2) return NextResponse.json({ error: 'Query too short' }, { status: 400 })

  const config = getConfig()
  const result = await searchItems(config, query, { sortBy, itemPage: page, minPrice, maxPrice, minReviewsRating: 3 })

  // Background upsert — non-blocking
  Promise.all(result.products.map(p => upsertProductFromAmazon(p))).catch(console.error)

  return NextResponse.json({
    products: result.products.map(p => ({
      asin:            p.asin,
      title:           p.title,
      imageUrl:        p.imageUrl,
      price:           p.price,
      originalPrice:   p.originalPrice,
      discountPercent: p.discountPercent,
      savingsAmount:   p.savingsAmount,
      currency:        p.currency,
      rating:          p.rating,
      reviewCount:     p.reviewCount,
      isPrime:         p.isPrimeEligible,
      isInStock:       p.isInStock,
      brand:           p.brand,
      badge:           p.badge,
      affiliateUrl:    p.affiliateUrl,
      deliveryInfo:    p.deliveryInfo,
    })),
    total: result.totalResults,
    query,
    page,
  })
}
*/
