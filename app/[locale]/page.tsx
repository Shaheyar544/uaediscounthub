import { getDictionary } from '@/i18n/dictionaries'
import { Locale } from '@/i18n/config'
import { DealCard } from '@/components/home/DealCard'
import { FeaturedStores } from '@/components/home/FeaturedStores'
import { NewsletterSignup } from '@/components/home/NewsletterSignup'
import { Search } from 'lucide-react'

import { createClient } from '@/utils/supabase/server'

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)


  return (
    <div className="w-full max-w-7xl mx-auto space-y-16 px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24 space-y-6 relative rounded-3xl overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
          {dict.common.search || "Search Products & Deals"}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          Your one-stop destination for the best electronics, home appliances, and gadgets in the UAE and GCC.
        </p>
        <div className="flex items-center justify-center max-w-2xl mx-auto mt-8 px-4 w-full">
          <div className="relative w-full flex items-center bg-background rounded-full border shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
            <Search className="absolute left-6 text-muted-foreground w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for iPhone 15, MacBooks..."
              className="w-full pl-14 pr-32 py-4 rounded-full bg-transparent focus:outline-none text-base"
            />
            <button className="absolute right-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-semibold transition-colors shadow-sm">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Featured Stores */}
      <FeaturedStores />

      {/* Today's Best Deals */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {dict.home.todays_best_deals || "Today's Best Deals"}
          </h2>
          <button className="text-sm font-medium text-primary hover:underline">
            View all deals
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products && products.slice(0, 4).map(product => (
            <DealCard
              key={product.id}
              id={product.id}
              name={product.name}
              slug={product.slug}
              image_url={product.image_url}
              base_price={product.base_price}
              originalPrice={product.base_price ? product.base_price * 1.15 : 0}
              discountPercent={15}
              store="Noon"
              badge="Trending"
            />
          ))}
          {(!products || products.length === 0) && (
            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground border rounded-xl bg-muted/20 border-dashed">
              No deals populated in the database. Head to the Admin panel to add some!
            </div>
          )}
        </div>
      </section>

      {/* Trending Electronics */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {dict.home.trending_electronics || "Trending Electronics"}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products && products.slice(4, 8).map(product => (
            <DealCard
              key={product.id}
              id={product.id}
              name={product.name}
              slug={product.slug}
              image_url={product.image_url}
              base_price={product.base_price}
              store="Amazon AE"
            />
          ))}
        </div>
      </section>

      {/* Newsletter / Exit Intent */}
      <NewsletterSignup />

    </div>
  )
}
