import { AISummaryBlock }     from '@/components/product/AISummaryBlock'
import { PriceComparisonTable } from '@/components/product/PriceComparisonTable'
import { ProsConsGrid }         from '@/components/product/ProsConsGrid'
import { PriceHistoryChart }    from '@/components/product/PriceHistoryChart'
import { ProductGallery }       from '@/components/product/ProductGallery'
import { CouponSection }        from '@/components/product/CouponSection'
import { Badge }                from '@/components/ui/badge'
import {
  Check, Info, ShieldCheck, Share2, Heart,
  MessageCircle, ArrowRight, Zap, Star, TrendingDown, Tag,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { notFound }     from 'next/navigation'
import { PriceAlertTrigger } from '@/components/product/PriceAlertTrigger'
import Link from 'next/link'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug, locale } = await params
  const supabase = await createClient()

  // ── Fetch product ────────────────────────────────────────────────────────
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name_en),
      product_prices(
        current_price, original_price, discount_percent,
        affiliate_url, in_stock,
        stores(name, logo_url)
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !product) notFound()

  // ── Fetch multi-store prices ─────────────────────────────────────────────
  const { data: pspData } = await supabase
    .from('product_store_prices')
    .select(`
      price, original_price, discount_percent,
      affiliate_url, coupon_code, coupon_discount,
      in_stock, is_best_price,
      stores(name, logo_url)
    `)
    .eq('product_id', product.id)
    .order('price', { ascending: true })

  // ── FIX 5D: Fetch real price history ─────────────────────────────────────
  const { data: priceHistoryRaw } = await supabase
    .from('price_history')
    .select('price, recorded_at')
    .eq('product_id', product.id)
    .order('recorded_at', { ascending: true })
    .limit(90)

  const priceHistory = (priceHistoryRaw || []).map(h => ({
    price:       Number(h.price),
    recorded_at: h.recorded_at as string,
  }))

  // ── Build price list ─────────────────────────────────────────────────────
  const categoryName  = (product.categories as any)?.name_en || 'Uncategorized'
  const specsObject   = typeof product.specifications === 'object' && product.specifications !== null
    ? product.specifications as Record<string, string> : {}
  const specsArray    = Object.entries(specsObject).map(([label, value]) => ({ label, value }))

  type FinalPrice = {
    store: string
    storeLogoUrl?: string
    price: number
    originalPrice: number
    discount: number
    inStock: boolean
    hasCOD: boolean
    hasTabby: boolean
    isLowest?: boolean
    affiliateUrl: string
    couponCode?: string
    couponDiscount?: string
  }

  let finalPrices: FinalPrice[] = []

  if (pspData && pspData.length > 0) {
    finalPrices = pspData.map((p, i) => {
      const store        = (p.stores as any)
      const originalPrice = p.original_price ?? p.price
      const discount      = originalPrice > p.price
        ? Math.round(((originalPrice - p.price) / originalPrice) * 100) : 0
      return {
        store:         store?.name ?? 'Unknown Store',
        storeLogoUrl:  store?.logo_url,
        price:         p.price,
        originalPrice,
        discount,
        inStock:       p.in_stock ?? true,
        hasCOD:        true,
        hasTabby:      true,
        isLowest:      p.is_best_price || i === 0,
        affiliateUrl:  p.affiliate_url || '#',
        couponCode:    p.coupon_code   || undefined,
        couponDiscount: p.coupon_discount || undefined,
      }
    })
  } else {
    const dbPrices = ((product.product_prices as any[]) || []).map(p => ({
      store:         p.stores?.name || 'Unknown Store',
      storeLogoUrl:  p.stores?.logo_url,
      price:         p.current_price,
      originalPrice: p.original_price ?? p.current_price,
      discount:      Math.round(p.discount_percent || 0),
      inStock:       p.in_stock,
      hasCOD:        true,
      hasTabby:      true,
      isLowest:      false,
      affiliateUrl:  p.affiliate_url || '#',
    }))

    if (dbPrices.length > 0) {
      dbPrices.sort((a, b) => a.price - b.price)
      dbPrices[0].isLowest = true
      finalPrices = dbPrices
    } else {
      finalPrices = [{
        store: 'Amazon AE', price: product.base_price,
        originalPrice: Math.round(product.base_price * 1.15), discount: 15,
        inStock: true, hasCOD: true, hasTabby: true, isLowest: true, affiliateUrl: '#',
      }]
    }
  }

  // ── Best price entry (first = cheapest) ───────────────────────────────────
  const bestPrice = finalPrices[0]

  // ── All product images ────────────────────────────────────────────────────
  const allImages = [
    product.image_url,
    ...((product.images as string[] | null) || []),
  ].filter(Boolean) as string[]

  // ── Coupons (for CouponSection) ────────────────────────────────────────────
  const hasCoupons = finalPrices.some(p => p.couponCode)

  return (
    <div className="product-page-container w-full max-w-[1200px] mx-auto px-6 py-10">

      {/* Breadcrumbs */}
      <div className="text-[13px] font-medium text-muted-foreground mb-8 flex items-center gap-2">
        <Link href={`/${locale}`} className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3 opacity-40" />
        <Link href={`/${locale}/category/${categoryName.toLowerCase()}`} className="hover:text-primary transition-colors">
          {categoryName}
        </Link>
        <ChevronRight className="w-3 h-3 opacity-40" />
        <span className="text-foreground font-semibold truncate">{product.name_en || product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 mb-16">

        {/* ── FIX 2: Image Gallery with thumbnails + zoom ──────────────────── */}
        <div className="product-gallery">
          <ProductGallery
            images={allImages}
            productName={product.name_en || product.name || 'Product'}
          />
        </div>

        {/* Right: Product Details */}
        <div className="product-info flex flex-col pt-2">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[12px] font-bold text-primary tracking-wider uppercase mb-1">
                <Zap className="w-3.5 h-3.5 fill-current" /> Instant Price Compare
              </div>
              <h1 className="font-display text-[30px] md:text-[36px] font-extrabold tracking-tight text-foreground leading-[1.15]">
                {product.name_en || product.name}
              </h1>
            </div>
            <div className="flex gap-2.5 shrink-0 pt-2">
              <button className="w-10 h-10 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-all">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rating */}
          {(product.rating > 0 || product.rating_count > 0) && (
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-gold/10 border border-brand-gold/20 rounded-sm">
                <Star className="w-3.5 h-3.5 text-brand-gold fill-current" />
                {product.rating > 0 && <span className="text-[13px] font-bold text-foreground">{product.rating}</span>}
                {product.rating_count > 0 && (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {Number(product.rating_count).toLocaleString()} reviews
                  </span>
                )}
              </div>
              <Badge variant="outline" className="font-bold text-[11px] bg-brand-green/10 text-brand-green border-brand-green/20">
                Verified Authorized Retailers
              </Badge>
            </div>
          )}

          {/* Price highlight */}
          <div className="price-highlight mb-4 p-5 bg-secondary/30 border border-border rounded-2xl">
            <div className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Estimated Lowest Price
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[34px] font-extrabold text-foreground leading-none">
                AED {bestPrice.price?.toLocaleString()}
              </span>
              {bestPrice.originalPrice > bestPrice.price && (
                <span className="text-[16px] text-muted-foreground line-through font-medium">
                  AED {bestPrice.originalPrice?.toLocaleString()}
                </span>
              )}
            </div>
            {bestPrice.originalPrice > bestPrice.price && (
              <div className="mt-2 text-[12px] font-bold text-brand-green flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                Save up to AED {(bestPrice.originalPrice - bestPrice.price).toLocaleString()} across stores
              </div>
            )}
          </div>

          {/* FIX 4: Best price store box */}
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
            {bestPrice.storeLogoUrl ? (
              <img src={bestPrice.storeLogoUrl} alt={bestPrice.store} className="w-9 h-9 object-contain rounded-lg border border-border bg-white p-1 shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center text-[#0057FF] font-extrabold text-sm shrink-0">
                {bestPrice.store[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-green-600 font-bold uppercase tracking-wide flex items-center gap-1">
                <Check className="w-3 h-3" /> Lowest Price
              </div>
              <div className="text-[13px] font-bold text-foreground">{bestPrice.store}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[17px] font-extrabold text-green-600">AED {bestPrice.price.toLocaleString()}</div>
              {bestPrice.originalPrice > bestPrice.price && (
                <div className="text-[11px] line-through text-muted-foreground">AED {bestPrice.originalPrice.toLocaleString()}</div>
              )}
            </div>
            <a
              href={bestPrice.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-[13px] transition-colors shrink-0"
            >
              Buy Now →
            </a>
          </div>

          {/* FIX 7A: Coupon teaser — rendered via CouponSection (client) */}
          {hasCoupons && <CouponSection prices={finalPrices} teaserOnly />}

          {/* AI Summary — FIX 3A */}
          <AISummaryBlock text={product.ai_summary_en || product.description_en || product.description || 'Synthesizing global reviews...'} />

          <div className="flex flex-col gap-3">
            <PriceAlertTrigger productId={product.id} productName={product.name} />

            <button className="w-full bg-[#25D366]/10 border border-[#25D366]/20 p-3.5 rounded-xl flex items-center justify-between group hover:bg-[#25D366]/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div className="text-left">
                  <p className="text-[13.5px] font-bold text-foreground">Get WhatsApp Alerts</p>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Price drops for {(product.name_en || product.name || '').split(' ')[0]}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#25D366] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* FIX 5D: Real price history chart */}
      <PriceHistoryChart history={priceHistory} />

      {/* FIX 6: Pros & Cons — hidden when no real data */}
      <ProsConsGrid pros={product.pros ?? undefined} cons={product.cons ?? undefined} />

      {/* Live Pricing Table */}
      <div className="mb-8 scroll-mt-20" id="pricing">
        <PriceComparisonTable prices={finalPrices} />
      </div>

      {/* FIX 7B: Redesigned Coupon Section */}
      {hasCoupons && <CouponSection prices={finalPrices} />}

      {/* Technical Specs */}
      {specsArray.length > 0 && (
        <div className="mb-16">
          <h3 className="text-[20px] font-bold mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> Full Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {specsArray.map((spec, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-border/60">
                <span className="text-[14px] font-medium text-muted-foreground">{spec.label}</span>
                <span className="text-[14px] font-bold text-foreground text-right">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {(product.description_en || product.description) && (
        <div className="mb-16">
          <h3 className="text-[20px] font-bold mb-4">About This Product</h3>
          {(product.description_en || product.description || '').startsWith('<') ? (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: product.description_en || product.description }}
            />
          ) : (
            <p className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description_en || product.description}
            </p>
          )}
        </div>
      )}

      {/* Security Badge */}
      <div className="bg-secondary/30 rounded-[20px] p-6 flex flex-col md:flex-row items-center gap-6 border border-border">
        <div className="p-4 bg-white border border-border rounded-xl shadow-sm shrink-0">
          <ShieldCheck className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center md:text-left">
          <h4 className="text-[17px] font-bold text-foreground mb-1">Safe Shopping Guarantee</h4>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            UAEDISCOUNTHUB only indexes verified authorized GCC retailers. We work directly with brands
            like Amazon and Noon to ensure deal authenticity and delivery safety.
          </p>
        </div>
      </div>

    </div>
  )
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
