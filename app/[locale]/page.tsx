import { getDictionary } from '@/i18n/dictionaries'
import { Locale } from '@/i18n/config'
import { DealCard } from '@/components/home/DealCard'
import { FeaturedStores } from '@/components/home/FeaturedStores'
import { NewsletterSignup } from '@/components/home/NewsletterSignup'
import { Search, Mic, Zap, Tag, ArrowRight } from 'lucide-react'
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
      <section className="relative text-center py-16 md:py-24 space-y-6 rounded-3xl overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border border-primary/10">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative space-y-4 px-4">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-500/20">
            <Zap className="w-3.5 h-3.5" />
            Best Tech Deals in UAE & GCC
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            {dict.common?.search || "Search Products & Deals"}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Compare prices across Amazon UAE, Noon, Sharaf DG and more.
            <span className="text-primary font-semibold"> Never overpay again.</span>
          </p>

          {/* Search Bar */}
          <div className="flex items-center justify-center max-w-2xl mx-auto mt-8 w-full">
            <div className="relative w-full flex items-center bg-background rounded-2xl border-2 border-border shadow-lg focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
              <Search className="absolute left-5 text-muted-foreground w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search for iPhone 15, MacBooks, Samsung TV..."
                className="w-full pl-14 pr-36 py-4 rounded-2xl bg-transparent focus:outline-none text-base"
                suppressHydrationWarning
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button className="p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Voice search">
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  suppressHydrationWarning
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl font-semibold transition-colors shadow-sm text-sm"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Quick search tags */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['iPhone 15 Pro', 'MacBook Air M3', 'Samsung S24', 'Sony XM5', 'Dyson V15'].map(tag => (
              <button key={tag} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-muted-foreground">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Stores ───────────────────────────────── */}
      <FeaturedStores />

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

      {/* ── Newsletter ────────────────────────────────────── */}
      <NewsletterSignup />
    </div>
  )
}
