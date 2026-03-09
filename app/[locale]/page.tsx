import { getDictionary } from '@/i18n/dictionaries'
import { Locale } from '@/i18n/config'
import { DealCard } from '@/components/home/DealCard'
import { CouponCard } from '@/components/home/CouponCard'
import { FeaturedStores } from '@/components/home/FeaturedStores'
import { NewsletterSignup } from '@/components/home/NewsletterSignup'
import { Search, Mic, Zap, Tag, ArrowRight, Ticket } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

// ISR — revalidate every 30 mins
export const revalidate = 1800

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  // Fetch products for Today's Deals (featured first)
  const { data: featuredProducts } = await supabase
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
      price: best.current_price ?? product.base_price,
      store: best.stores?.name ?? 'Amazon AE',
      discount: Math.round(best.discount_percent ?? 0),
      original: best.original_price ?? 0,
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-16 px-4 py-8">

      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="relative overflow-hidden my-6 rounded-[28px] bg-[#0D1117] px-10 py-[72px] min-h-[420px] flex flex-col items-center justify-center text-center gap-5">
        {/* Mesh Gradient Background (Animated via CSS classes in globals.css or inline) */}
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
            AI summaries. WhatsApp price alerts. Exclusive coupon codes.
          </p>

          <div className="hero-search flex items-center max-w-[580px] mx-auto mt-7 bg-white/8 border-1.5 border-white/12 rounded-full p-1.5 pl-5 backdrop-blur-xl transition-all focus-within:border-primary focus-within:bg-white/12 focus-within:ring-4 focus-within:ring-primary/20 gap-3">
            <Search className="w-[18px] h-[18px] text-white/40 shrink-0" />
            <input
              type="text"
              placeholder="iPhone 15 Pro, Samsung S24 Ultra, MacBook..."
              className="flex-1 bg-transparent border-none outline-none font-body text-[15px] text-white placeholder:text-white/40"
            />
            <button className="h-11 px-6 bg-primary text-white border-none rounded-full font-body text-[14px] font-bold whitespace-nowrap shrink-0 hover:bg-primary-dim hover:-translate-y-0.5 transition-all">
              Search Deals →
            </button>
          </div>

          <div className="hero-tags flex flex-wrap justify-center gap-2 mt-4">
            {['📱 iPhone 15 Pro', '💻 MacBook Air M3', '🎧 Sony XM5', '📺 Samsung QLED', '🧹 Dyson V15'].map(tag => (
              <button key={tag} className="bg-white/7 border border-white/10 text-white/65 text-[12.5px] font-medium px-3.5 py-1 rounded-full hover:bg-[#0A84FF]/20 hover:border-[#0A84FF]/40 hover:text-[#60AFFF] transition-all">
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-stats absolute bottom-0 left-0 right-0 z-10 flex border-t border-white/6">
          {[
            { num: '50K+', label: 'Products Tracked' },
            { num: '5', label: 'Major Stores' },
            { num: '2hr', label: 'Price Updates' },
            { num: 'AED', label: 'GCC Currencies' },
            { num: '12K+', label: 'Active Coupons' }
          ].map((s, i) => (
            <div key={i} className="hero-stat flex-1 py-3.5 px-5 text-center border-r border-white/6 last:border-none">
              <span className="font-display text-[20px] font-extrabold text-white block leading-tight">{s.num}</span>
              <span className="text-[11px] text-white/40 tracking-[0.05em] uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Stores ───────────────────────────────── */}
      <FeaturedStores />

      {/* ── Category Chips ────────────────────────────────── */}
      <section className="category-strip relative mb-12">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Shop by Category
          </h3>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-fade-right">
          {[
            { label: 'Smartphones', icon: '📱', color: '#0A84FF' },
            { label: 'Laptops', icon: '💻', color: '#A855F7' },
            { label: 'TV & Audio', icon: '📺', color: '#EF4444' },
            { label: 'Tablets', icon: '平板', icon_raw: '📟', color: '#10B981' },
            { label: 'Gaming', icon: '🎮', color: '#F59E0B' },
            { label: 'Appliances', icon: '🏠', color: '#06B6D4' },
            { label: 'Beauty', icon: '✨', color: '#EC4899' },
            { label: 'Watches', icon: '⌚', color: '#6366F1' }
          ].map((cat, i) => (
            <Link
              key={i}
              href={`/${locale}/category/${cat.label.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
              className="category-chip shrink-0 group flex items-center gap-2.5 px-4 py-2.5 bg-card border border-border rounded-full hover:border-primary/40 hover:shadow-card hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="text-[16px] group-hover:scale-110 transition-transform">{cat.icon_raw || cat.icon}</span>
              <span className="text-[13.5px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

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
              <p className="text-sm text-muted-foreground">Updated every 2 hours</p>
            </div>
          </div>
          <Link href={`/${locale}/deals`} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {dealsProducts.map(product => {
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
          {dealsProducts.length === 0 && (
            <div className="col-span-full h-40 flex flex-col items-center justify-center text-muted-foreground border rounded-2xl bg-muted/20 border-dashed gap-2">
              <Tag className="w-8 h-8 opacity-30" />
              <p className="text-sm">No deals yet — add products in the Admin panel</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Trending Electronics ──────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {dict.home?.trending_electronics || "Trending Electronics"}
              </h2>
              <p className="text-sm text-muted-foreground">Most viewed this week</p>
            </div>
          </div>
          <Link href={`/${locale}/category/smartphones`} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {trendingProducts.map(product => {
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

      {/* ── Top Coupons ─────────────────────────────────── */}
      <section className="coupons-section">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FF6B00]/10 rounded-xl">
              <Ticket className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Top Coupons & Promo Codes</h2>
              <p className="text-sm text-muted-foreground">Extra savings on major UAE stores</p>
            </div>
          </div>
          <Link href={`/${locale}/coupons`} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { store: 'Noon', logo: '/stores/noon.png', disc: '10% OFF', code: 'NOON30', color: '#FFD100', desc: 'On all electronics & fashion' },
            { store: 'Amazon AE', logo: '/stores/amazon-ae.png', disc: 'AED 50', code: 'MC50', color: '#0A84FF', desc: 'When using MasterCard' },
            { store: 'Sharaf DG', logo: '/stores/sharaf-dg.png', disc: '15% OFF', code: 'SHARAF15', color: '#00C875', desc: 'On selected home appliances' },
            { store: 'Carrefour', logo: '/stores/carrefour.png', disc: 'SAVE 20', code: 'SAVE20', color: '#EF4444', desc: 'On your first order above AED 150' }
          ].map((c, i) => (
            <CouponCard
              key={i}
              id={c.code}
              storeName={c.store}
              storeLogo={c.logo}
              discount={c.disc}
              code={c.code}
              description={c.desc}
              color={i === 0 ? '#FFD100' : c.color}
            />
          ))}
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────── */}
      <NewsletterSignup />
    </div>
  )
}
