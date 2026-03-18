import { getDictionary }       from '@/i18n/dictionaries'
import { Locale }               from '@/i18n/config'
import { DealCard }             from '@/components/home/DealCard'
import { CouponCard }           from '@/components/home/CouponCard'
import { FeaturedStores }       from '@/components/home/FeaturedStores'
import { NewsletterSignup }     from '@/components/home/NewsletterSignup'
import { HeroSection }          from '@/components/home/HeroSection'
import { CategoryBrowsing }     from '@/components/home/CategoryBrowsing'
import { PriceAlertBanner }     from '@/components/home/PriceAlertBanner'
import { TrustBar }             from '@/components/home/TrustBar'
import { RecentlyViewed }       from '@/components/home/RecentlyViewed'
import { createClient }         from '@/utils/supabase/server'
import Image                    from 'next/image'

// ISR: revalidate every 5 minutes — much faster than force-dynamic
export const revalidate = 300

const R2_HOST = 'media.uaediscounthub.com'

function isR2Url(url?: string | null): boolean {
  return !!url && url.includes(R2_HOST)
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  try {
    const { locale } = await params
    const dict       = await getDictionary(locale as Locale)
    const supabase   = await createClient()

    // Run all queries in parallel for speed
    const [
      { data: stores,           error: storesError    },
      { data: coupons,          error: couponsError   },
      { data: featuredProducts, error: productsError  },
      { data: categoryRows,     error: catError       },
    ] = await Promise.all([
      supabase
        .from('stores')
        .select('id, name, slug, logo_url')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('display_order', { ascending: true }),

      supabase
        .from('coupons')
        .select('id, code, title_en, description_en, discount_type, discount_value, stores(name, logo_url)')
        .eq('is_active', true)
        .order('is_verified', { ascending: false })
        .order('click_count',  { ascending: false })
        .limit(4),

      supabase
        .from('products')
        .select('id, name, name_en, slug, image_url, base_price, average_rating, is_featured, product_prices(current_price, original_price, discount_percent, stores(name, slug))')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at',  { ascending: false })
        .limit(8),

      // ISSUE 4: real category counts
      supabase
        .from('products')
        .select('category_id, categories!inner(name_en, slug)')
        .eq('is_active', true),
    ])

    if (storesError)   throw new Error(`Stores: ${storesError.message}`)
    if (couponsError)  throw new Error(`Coupons: ${couponsError.message}`)
    if (productsError) throw new Error(`Products: ${productsError.message}`)

    // Build category counts map: slug → count
    const catCounts: Record<string, number> = {}
    if (categoryRows) {
      for (const row of categoryRows) {
        const cat = (row as any).categories
        if (!cat) continue
        const slug = (cat.slug as string)?.toLowerCase() || (cat.name_en as string)?.toLowerCase()
        if (slug) catCounts[slug] = (catCounts[slug] || 0) + 1
      }
    }

    function getBestPrice(product: any) {
      const prices = product.product_prices ?? []
      if (prices.length === 0) return { price: product.base_price, store: 'Amazon AE', discount: 0, original: 0 }
      const sorted = [...prices].sort((a: any, b: any) => (a.current_price ?? 0) - (b.current_price ?? 0))
      const best = sorted[0]
      return {
        price:    best?.current_price  ?? product.base_price,
        store:    best?.stores?.name   ?? 'Amazon AE',
        discount: Math.round(best?.discount_percent ?? 0),
        original: best?.original_price ?? 0,
      }
    }

    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-12">

        {/* 1 — Hero */}
        <HeroSection locale={locale} />

        {/* 2 — Featured Stores */}
        <FeaturedStores stores={(stores as any[]) ?? []} />

        {/* 3 — Category Browsing (real counts) */}
        <CategoryBrowsing locale={locale} counts={catCounts} />

        {/* 4 — Today's Deals */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                🔥 {dict.home?.todays_best_deals || "Today's Best Deals"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Prices updated every 2 hours</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {(featuredProducts ?? []).map((product: any) => {
              const { price, store, discount, original } = getBestPrice(product)
              return (
                <DealCard
                  key={product.id}
                  id={product.id}
                  name={product.name_en}
                  slug={product.slug}
                  image_url={product.image_url}
                  base_price={price}
                  originalPrice={original}
                  discountPercent={discount}
                  rating={product.average_rating ?? 4.5}
                  store={store}
                  locale={locale}
                />
              )
            })}
          </div>
        </section>

        {/* 7 — Recently Viewed (client, reads localStorage) */}
        <RecentlyViewed locale={locale} />

        {/* 5 — Price Alert Banner */}
        <PriceAlertBanner />

        {/* 6 — Coupons */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                🏷️ Exclusive Coupon Codes
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  LIVE
                </span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">Verified codes — updated daily</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(coupons ?? []).map((c: any, i: number) => (
              <CouponCard
                key={c.id}
                id={c.code}
                storeName={c.stores?.name || 'Store'}
                storeLogo={c.stores?.logo_url || '/placeholder-store.png'}
                discount={c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `AED ${c.discount_value}`}
                code={c.code}
                description={c.description_en || 'Special discount'}
                color={['#0A84FF', '#EF4444', '#00C875', '#F5A623'][i % 4]}
              />
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <NewsletterSignup />

        {/* Trust Bar */}
        <TrustBar />

      </div>
    )
  } catch (error: any) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <pre className="p-4 bg-gray-100 rounded text-left overflow-auto max-w-4xl mx-auto text-sm">
          {error.message}{'\n\n'}{error.stack}
        </pre>
      </div>
    )
  }
}
