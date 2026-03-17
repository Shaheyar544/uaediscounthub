import { getDictionary } from '@/i18n/dictionaries'
import { Locale } from '@/i18n/config'
import { DealCard } from '@/components/home/DealCard'
import { CouponCard } from '@/components/home/CouponCard'
import { FeaturedStores } from '@/components/home/FeaturedStores'
import { NewsletterSignup } from '@/components/home/NewsletterSignup'
import { Search, Mic, Zap, Tag, ArrowRight, Ticket } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

// Forces dynamic rendering to ensure fresh data from Supabase
export const dynamic = 'force-dynamic'

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  try {
    const { locale } = await params
    const dict = await getDictionary(locale as Locale)
    const supabase = await createClient()

    // 1. Fetch Featured Stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, slug, logo_url')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('display_order', { ascending: true })

    if (storesError) throw new Error(`Stores Query Error: ${storesError.message}`)

    // 2. Fetch Top Coupons
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select(`
        id, code, title_en, description_en, discount_type, discount_value,
        stores ( name, logo_url )
      `)
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .order('click_count', { ascending: false })
      .limit(4)

    if (couponsError) throw new Error(`Coupons Query Error: ${couponsError.message}`)

    // 3. Fetch products for Today's Deals (featured first)
    const { data: featuredProducts, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, name_en, slug, image_url, base_price,
        average_rating, is_featured,
        product_prices (
          current_price, original_price, discount_percent,
          stores ( name, slug )
        )
      `)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8)

    if (productsError) throw new Error(`Products Query Error: ${productsError.message}`)

    // Separate featured (deals section) from trending
    const dealsProducts = featuredProducts?.slice(0, 4) ?? []
    const trendingProducts = featuredProducts?.slice(4, 8) ?? []

    // Helper to get best price and store for a product
    function getBestPrice(product: any) {
      const prices = product.product_prices ?? []
      if (prices.length === 0) return { price: product.base_price, store: 'Amazon AE', discount: 0, original: 0 }
      const sorted = [...prices].sort((a: any, b: any) => (a.current_price ?? 0) - (b.current_price ?? 0))
      const best = sorted[0]
      return {
        price: best?.current_price ?? product.base_price,
        store: best?.stores?.name ?? 'Amazon AE',
        discount: Math.round(best?.discount_percent ?? 0),
        original: best?.original_price ?? 0,
      }
    }

    return (
      <div className="w-full max-w-7xl mx-auto space-y-16 px-4 py-8">
        {/* ── Hero Section ─────────────────────────────────── */}
        <section className="relative overflow-hidden my-6 rounded-[28px] bg-[#0D1117] px-10 py-[72px] min-h-[420px] flex flex-col items-center justify-center text-center gap-5">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_50%,rgba(10,132,255,0.22)_0%,transparent_70%),radial-gradient(ellipse_60%_60%_at_80%_30%,rgba(255,107,0,0.14)_0%,transparent_70%),radial-gradient(ellipse_50%_50%_at_60%_80%,rgba(0,200,117,0.08)_0%,transparent_70%)] animate-[meshMove_8s_ease-in-out_infinite_alternate]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          <div className="relative z-10 w-full max-w-[720px] space-y-4">
            <div className="hero-eyebrow inline-flex items-center gap-2 bg-[#0A84FF]/18 border border-[#0A84FF]/30 text-[#60AFFF] text-[12px] font-bold tracking-[0.08em] uppercase px-3.5 py-1 rounded-full">
              <div className="hero-eyebrow-dot w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              AI-Powered Price Intelligence · GCC Region
            </div>

            <h1 className="font-display text-[48px] md:text-[56px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              Find the Best Tech Deals<br />in <em className="not-italic bg-gradient-to-br from-[#0A84FF] to-[#60AFFF] bg-clip-text text-transparent">UAE & GCC</em>
            </h1>

            <p className="text-[17px] text-white/60 max-w-[500px] mx-auto leading-relaxed">
              Real-time price comparison across <strong className="text-white/90">Amazon UAE, Noon, Sharaf DG</strong> and more.
            </p>

            <div className="hero-search flex items-center max-w-[580px] mx-auto mt-7 bg-white/8 border-1.5 border-white/12 rounded-full p-1.5 pl-5 backdrop-blur-xl transition-all focus-within:border-primary focus-within:bg-white/12 focus-within:ring-4 focus-within:ring-primary/20 gap-3">
              <Search className="w-[18px] h-[18px] text-white/40 shrink-0" />
              <input
                type="text"
                placeholder="iPhone 15 Pro, Samsung S24 Ultra, MacBook..."
                className="flex-1 bg-transparent border-none outline-none font-body text-[15px] text-white placeholder:text-white/40"
              />
              <button 
                className="h-11 px-6 bg-primary text-white border-none rounded-full font-body text-[14px] font-bold whitespace-nowrap shrink-0 hover:bg-primary-dim transition-all"
              >
                Search Deals →
              </button>
            </div>
          </div>

          <div className="hero-stats absolute bottom-0 left-0 right-0 z-10 flex border-t border-white/6">
            {[
              { num: '50K+', label: 'Products' },
              { num: '5', label: 'Stores' },
              { num: '2hr', label: 'Updates' },
              { num: 'AED', label: 'Prices' },
              { num: '12K+', label: 'Coupons' }
            ].map((s, i) => (
              <div key={i} className="hero-stat flex-1 py-3.5 px-5 text-center border-r border-white/6 last:border-none">
                <span className="font-display text-[20px] font-extrabold text-white block leading-tight">{s.num}</span>
                <span className="text-[11px] text-white/40 tracking-[0.05em] uppercase">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Featured Stores ───────────────────────────────── */}
        <FeaturedStores stores={(stores as any[]) ?? []} />

        {/* ── Today's Best Deals ────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <Tag className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {dict.home?.todays_best_deals || "Today's Best Deals"}
                </h2>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {dealsProducts.map((product: any) => {
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
                  badge="Trending"
                  locale={locale}
                />
              )
            })}
          </div>
        </section>

        {/* ── Top Coupons ─────────────────────────────────── */}
        <section className="coupons-section">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF6B00]/10 rounded-xl">
                <Ticket className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Top Coupons & Promo Codes</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {coupons?.map((c: any, i: number) => (
              <CouponCard
                key={c.id}
                id={c.code}
                storeName={c.stores?.name || 'Store'}
                storeLogo={c.stores?.logo_url || '/placeholder-store.png'}
                discount={c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `AED ${c.discount_value}`}
                code={c.code}
                description={c.description_en || 'Special discount'}
                color={['#FFD100', '#0A84FF', '#00C875', '#EF4444'][i % 4]}
              />
            ))}
          </div>
        </section>

        <NewsletterSignup />
      </div>
    )
  } catch (error: any) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Debug Error</h1>
        <pre className="p-4 bg-gray-100 rounded text-left overflow-auto max-w-4xl mx-auto">
          {error.message}
          {"\n\n"}
          {error.stack}
        </pre>
      </div>
    )
  }
}
