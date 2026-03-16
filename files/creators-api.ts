/**
 * Amazon Creators API v3.2 — UAE Integration
 * ─────────────────────────────────────────────
 * Auth:        OAuth 2.0 client_credentials (Login with Amazon / LwA)
 * Token URL:   https://api.amazon.com/auth/o2/token
 * API Host:    webservices.amazon.ae  (EU region — covers AE, SA, all Gulf)
 * Credentials: Credential ID (amzn1.application-oa2-client.xxx)
 *              Secret       (amzn1.oa2-cs.v1.xxx)
 *
 * ⚠️  PA-API v5 is DEPRECATED April 30 2026.
 *     This file uses the ONLY forward-compatible approach.
 *
 * Key differences from old PA-API:
 *   OLD → "ItemIds", "PartnerTag", "SearchIndex"   (PascalCase, AWS4 signing)
 *   NEW → "itemIds", "partnerTag", "searchIndex"   (camelCase, Bearer token)
 *   NEW → "offersV2" resource group (replaces deprecated "Offers")
 */

// ─── Token cache (module-level, survives across requests in same process) ────
let _tokenCache: { token: string; expiresAt: number } | null = null

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CreatorsConfig {
  credentialId: string      // amzn1.application-oa2-client.153a1...
  credentialSecret: string  // amzn1.oa2-cs.v1.54750869c6f...
  partnerTag: string        // uaediscounthu-21.uaediscc...  (your Associates tag)
  marketplace: 'www.amazon.ae'
}

export interface AmazonProduct {
  asin: string
  title: string
  url: string
  affiliateUrl: string
  imageUrl: string
  images: string[]
  price: number | null
  originalPrice: number | null
  currency: string
  discountPercent: number | null
  savingsAmount: number | null
  rating: number | null
  reviewCount: number | null
  isPrimeEligible: boolean
  isInStock: boolean
  brand: string | null
  features: string[]
  description: string | null
  categories: string[]
  specifications: Record<string, string>
  parentAsin: string | null
  availability: string
  deliveryInfo: string | null
  badge: string | null
  lastSynced: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
// UAE is in the EU region — same credentials work for .ae, .sa, .co.uk, etc.
const API_HOST   = 'webservices.amazon.ae'
const TOKEN_URL  = 'https://api.amazon.com/auth/o2/token'
const SCOPE      = 'paapi5:read'   // Creators API scope for product data

// OffersV2 resource list — replaces deprecated Offers.*
// Note: all keys are now camelCase (offersV2 not Offers, itemInfo not ItemInfo)
const ALL_RESOURCES = [
  // Prices — OffersV2 (the whole point of migrating)
  'offersV2.listings.price',
  'offersV2.listings.savingBasis',
  'offersV2.listings.deliveryInfo.isAmazonFulfilled',
  'offersV2.listings.deliveryInfo.isFreeShippingEligible',
  'offersV2.listings.deliveryInfo.isPrimeEligible',
  'offersV2.listings.availability.message',
  'offersV2.listings.availability.type',
  'offersV2.listings.condition',
  'offersV2.summaries.lowestPrice',
  'offersV2.summaries.highestPrice',
  'offersV2.summaries.offerCount',
  // Images
  'images.primary.large',
  'images.primary.medium',
  'images.variants.large',
  // Item info
  'itemInfo.title',
  'itemInfo.byLineInfo',
  'itemInfo.features',
  'itemInfo.productInfo',
  'itemInfo.technicalInfo',
  'itemInfo.classifications',
  // Browse
  'browseNodeInfo.browseNodes',
  'browseNodeInfo.websiteSalesRank',
  // Reviews
  'customerReviews.count',
  'customerReviews.starRating',
  // Parent
  'parentASIN',
]

// ─── Step 1: Get / cache OAuth Bearer token ───────────────────────────────────
async function getAccessToken(config: CreatorsConfig): Promise<string> {
  const now = Date.now()

  // Return cached token if still valid (with 60s buffer)
  if (_tokenCache && _tokenCache.expiresAt - 60_000 > now) {
    return _tokenCache.token
  }

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     config.credentialId,
    client_secret: config.credentialSecret,
    scope:         SCOPE,
  })

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
    signal:  AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`[CreatorsAPI] Token request failed ${res.status}: ${err}`)
  }

  const data = await res.json()
  const expiresIn: number = data.expires_in ?? 3600

  _tokenCache = {
    token:     data.access_token,
    expiresAt: now + expiresIn * 1000,
  }

  return _tokenCache.token
}

// ─── Step 2: Call the Creators API ───────────────────────────────────────────
async function callCreatorsAPI(
  config: CreatorsConfig,
  operation: string,   // 'getItems' | 'searchItems' | 'getVariations' | 'getBrowseNodes'
  payload: Record<string, any>,
  retries = 2
): Promise<any> {
  const token = await getAccessToken(config)
  const url   = `https://${API_HOST}/paapi5/${operation}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json; charset=UTF-8',
          'Authorization': `Bearer ${token}`,
          // Creators API v3 does NOT use x-amz-target or AWS4 signing
        },
        body:   JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      })

      if (res.status === 429) {
        const wait = Math.pow(2, attempt) * 1000
        console.warn(`[CreatorsAPI] Rate limited. Retrying in ${wait}ms...`)
        await new Promise(r => setTimeout(r, wait))
        // Force token refresh on next attempt after rate limit
        _tokenCache = null
        continue
      }

      if (res.status === 401 || res.status === 403) {
        // Token expired mid-flight — clear cache and retry once
        _tokenCache = null
        if (attempt < retries) continue
      }

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`[CreatorsAPI] ${operation} failed ${res.status}: ${errText}`)
      }

      return await res.json()
    } catch (err: any) {
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
}

// ─── Response Parser ──────────────────────────────────────────────────────────
function parseItem(item: any, partnerTag: string): AmazonProduct {
  const asin  = item.ASIN ?? ''
  const title = item.itemInfo?.title?.displayValue ?? ''
  const brand = item.itemInfo?.byLineInfo?.brand?.displayValue
    ?? item.itemInfo?.byLineInfo?.manufacturer?.displayValue
    ?? null

  // Images
  const primaryImg  = item.images?.primary?.large?.URL
    ?? item.images?.primary?.medium?.URL ?? ''
  const variantImgs = (item.images?.variants ?? [])
    .map((v: any) => v.large?.URL ?? v.medium?.URL)
    .filter(Boolean) as string[]

  // OffersV2 pricing
  const listing      = item.offersV2?.listings?.[0]
  const summary      = item.offersV2?.summaries?.[0]
  const priceAmount  = listing?.price?.amount ?? summary?.lowestPrice?.amount ?? null
  const currency     = listing?.price?.currency ?? 'AED'
  const savingBasis  = listing?.savingBasis?.amount ?? null
  const savingsAmt   = savingBasis && priceAmount
    ? +(savingBasis - priceAmount).toFixed(2) : null
  const discountPct  = savingBasis && priceAmount && savingBasis > 0
    ? Math.round(((savingBasis - priceAmount) / savingBasis) * 100) : null

  // Availability
  const availType = listing?.availability?.type ?? 'Now'
  const availMsg  = listing?.availability?.message ?? 'In Stock'
  const isInStock = availType === 'Now' || availMsg.toLowerCase().includes('stock')

  // Delivery
  const isPrime    = listing?.deliveryInfo?.isPrimeEligible ?? false
  const isFreeShip = listing?.deliveryInfo?.isFreeShippingEligible ?? false
  const delivInfo  = isFreeShip ? 'Free delivery' : isPrime ? 'Prime delivery' : null

  // Reviews
  const rating      = item.customerReviews?.starRating?.value ?? null
  const reviewCount = item.customerReviews?.count ?? null

  // Features / description
  const features: string[] = item.itemInfo?.features?.displayValues ?? []

  // Categories from browse nodes
  const browseNodes: string[] = (item.browseNodeInfo?.browseNodes ?? [])
    .map((n: any) => n.displayName ?? n.id).filter(Boolean)

  // Tech specs
  const techMap: Record<string, string> = {}
  const prodInfo = item.itemInfo?.productInfo ?? {}
  if (prodInfo.color?.displayValue)  techMap['Color']   = prodInfo.color.displayValue
  if (prodInfo.size?.displayValue)   techMap['Size']    = prodInfo.size.displayValue

  // Sales rank badge
  const salesRank = item.browseNodeInfo?.websiteSalesRank?.salesRank
  const badge     = salesRank && salesRank <= 3  ? "Amazon's Choice"
    : salesRank && salesRank <= 10 ? 'Best Seller' : null

  // Affiliate URL — always append partner tag
  const itemUrl      = item.detailPageURL ?? `https://www.amazon.ae/dp/${asin}`
  const affiliateUrl = itemUrl.includes('?')
    ? `${itemUrl}&tag=${partnerTag}`
    : `${itemUrl}?tag=${partnerTag}`

  return {
    asin,
    title,
    url:            itemUrl,
    affiliateUrl,
    imageUrl:       primaryImg,
    images:         [primaryImg, ...variantImgs].filter(Boolean),
    price:          priceAmount ? +priceAmount : null,
    originalPrice:  savingBasis ? +savingBasis : null,
    currency,
    discountPercent: discountPct,
    savingsAmount:  savingsAmt,
    rating:         rating ? +rating : null,
    reviewCount:    reviewCount ? +reviewCount : null,
    isPrimeEligible: isPrime,
    isInStock,
    brand,
    features,
    description:    features.slice(0, 3).join(' ') || null,
    categories:     browseNodes,
    specifications: techMap,
    parentAsin:     item.parentASIN ?? null,
    availability:   availMsg,
    deliveryInfo:   delivInfo,
    badge,
    lastSynced:     new Date().toISOString(),
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * GetItems — fetch up to 10 ASINs in one call
 */
export async function getItems(
  config: CreatorsConfig,
  asins: string[]
): Promise<AmazonProduct[]> {
  if (!asins.length) return []
  const results: AmazonProduct[] = []

  // Chunk into batches of 10 (API limit)
  for (let i = 0; i < asins.length; i += 10) {
    const batch = asins.slice(i, i + 10)

    // Note: camelCase keys in Creators API v3
    const payload = {
      itemIds:     batch,
      itemIdType:  'ASIN',
      marketplace: config.marketplace,
      partnerTag:  config.partnerTag,
      partnerType: 'Associates',
      resources:   ALL_RESOURCES,
    }

    try {
      const data  = await callCreatorsAPI(config, 'getitems', payload)
      const items = (data.itemsResult?.items ?? [])
        .map((item: any) => parseItem(item, config.partnerTag))
      results.push(...items)
    } catch (err) {
      console.error(`[CreatorsAPI] getItems batch failed:`, err)
    }

    // 1 TPS rate limit
    if (i + 10 < asins.length) await new Promise(r => setTimeout(r, 1100))
  }

  return results
}

/**
 * SearchItems — keyword search with filters
 */
export async function searchItems(
  config: CreatorsConfig,
  query: string,
  options: {
    sortBy?:            'Relevance' | 'AvgCustomerReviews' | 'Price:LowToHigh' | 'Price:HighToLow' | 'Featured' | 'NewestArrivals'
    minPrice?:          number   // AED value (API multiplies by 100 internally)
    maxPrice?:          number
    itemPage?:          number   // 1-10
    minReviewsRating?:  number
    searchIndex?:       string   // 'Electronics' | 'All' | 'Computers' etc.
  } = {}
): Promise<{ products: AmazonProduct[]; totalResults: number }> {

  const payload: Record<string, any> = {
    keywords:    query,
    marketplace: config.marketplace,
    partnerTag:  config.partnerTag,
    partnerType: 'Associates',
    resources:   ALL_RESOURCES,
    sortBy:      options.sortBy ?? 'Relevance',
    itemPage:    options.itemPage ?? 1,
    searchIndex: options.searchIndex ?? 'Electronics',
  }

  if (options.minPrice)        payload.minPrice        = options.minPrice * 100
  if (options.maxPrice)        payload.maxPrice        = options.maxPrice * 100
  if (options.minReviewsRating) payload.minReviewsRating = options.minReviewsRating

  try {
    const data  = await callCreatorsAPI(config, 'searchitems', payload)
    const items = (data.searchResult?.items ?? [])
      .map((item: any) => parseItem(item, config.partnerTag))

    return {
      products:     items,
      totalResults: data.searchResult?.totalResultCount ?? items.length,
    }
  } catch (err) {
    console.error(`[CreatorsAPI] searchItems failed for "${query}":`, err)
    return { products: [], totalResults: 0 }
  }
}

/**
 * GetVariations — all storage/colour variants of a parent ASIN
 */
export async function getVariations(
  config: CreatorsConfig,
  asin: string,
  variationPage = 1
): Promise<AmazonProduct[]> {
  const payload = {
    ASIN:          asin,
    marketplace:   config.marketplace,
    partnerTag:    config.partnerTag,
    partnerType:   'Associates',
    resources:     ALL_RESOURCES,
    variationPage,
  }

  try {
    const data = await callCreatorsAPI(config, 'getvariations', payload)
    return (data.variationsResult?.items ?? [])
      .map((item: any) => parseItem(item, config.partnerTag))
  } catch (err) {
    console.error(`[CreatorsAPI] getVariations failed for ${asin}:`, err)
    return []
  }
}

/**
 * GetBrowseNodes — category tree
 */
export async function getBrowseNodes(
  config: CreatorsConfig,
  nodeIds: string[]
): Promise<Array<{ id: string; name: string; children: string[] }>> {
  const payload = {
    browseNodeIds: nodeIds,
    marketplace:   config.marketplace,
    partnerTag:    config.partnerTag,
    partnerType:   'Associates',
    resources:     ['browseNodes.ancestor', 'browseNodes.children'],
  }

  try {
    const data = await callCreatorsAPI(config, 'getbrowsenodes', payload)
    return (data.browseNodesResult?.browseNodes ?? []).map((n: any) => ({
      id:       n.id,
      name:     n.displayName,
      children: (n.children ?? []).map((c: any) => c.id),
    }))
  } catch (err) {
    console.error(`[CreatorsAPI] getBrowseNodes failed:`, err)
    return []
  }
}

// ─── UAE/GCC Browse Node IDs ──────────────────────────────────────────────────
export const UAE_BROWSE_NODES = {
  electronics:    '11036681',
  smartphones:    '11036691',
  laptops:        '11036711',
  tablets:        '11036701',
  smartwatches:   '11036731',
  headphones:     '11036741',
  cameras:        '11036721',
  tvs:            '11036751',
  speakers:       '11036761',
  homeAppliances: '11036771',
  gaming:         '11036781',
  accessories:    '11036791',
} as const
