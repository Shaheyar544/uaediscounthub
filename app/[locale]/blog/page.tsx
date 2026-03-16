import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { BlogCard } from '@/components/blog/BlogCard'
import { AdWidget } from '@/components/blog/AdWidget'
import { BlogPost, BlogCategory, BlogTag } from '@/types/blog'
import Link from 'next/link'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params
  return {
    title: locale === 'ar' ? 'المدونة - أدلة التسوق ونصائح الصفقات | UAEDiscountHub' : 'Blog — Shopping Guides & Deal Tips | UAEDiscountHub',
    description: locale === 'ar' ? 'أدلة تسوق الخبراء في الإمارات، تفاصيل الصفقات، استراتيجيات الكوبونات ومراجعات المنتجات.' : 'Expert UAE shopping guides, deal breakdowns, coupon strategies and product reviews.',
    openGraph: {
      title: 'UAEDiscountHub Blog',
      type: 'website',
    }
  }
}

export const revalidate = 3600 // Revalidate every hour

/**
 * Blog Listing Page
 * Features a hero section with category filters, a featured post, and a grid of latest posts.
 * Matches the 'BLOG LISTING PAGE' in UAEDiscountHub-Blog-System.html.
 */
export default async function BlogListingPage({ 
  params, 
  searchParams 
}: { 
  params: { locale: string },
  searchParams: Promise<{ category?: string; tag?: string; q?: string; page?: string }>
}) {
  const { locale } = params
  const sp = await searchParams
  const supabase = await createClient()
  
  const page = parseInt(sp.page || '1')
  const limit = 10
  const offset = (page - 1) * limit

  // 1. Fetch Categories
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name')

  // 2. Build Posts Query
  let query = supabase
    .from('blog_posts')
    .select('*, author:author_id(full_name,avatar_url,role), category:category_id(*)', { count: 'exact' })
    .eq('status', 'published')
    .ilike('locale', `%${locale}%`)
    .order('published_at', { ascending: false })

  if (sp.category) {
    query = query.eq('category_id', sp.category)
  }
  
  if (sp.q) {
    query = query.ilike('title', `%${sp.q}%`)
  }

  const { data: posts, count } = await query.range(offset, offset + limit - 1)

  // 3. Fetch Sidebar Data (Popular Posts, Ads, Tags)
  const { data: popularPosts } = await supabase
    .from('blog_posts')
    .select('*, category:category_id(*)')
    .eq('status', 'published')
    .ilike('locale', `%${locale}%`)
    .order('view_count', { ascending: false })
    .limit(5)

  const { data: ads } = await supabase
    .from('blog_ad_widgets')
    .select('*')
    .eq('is_active', true)
    
  const midAd = ads?.find(a => a.position === 'sidebar-mid')

  const { data: tags } = await supabase
    .from('blog_tags')
    .select('*')
    .limit(15)

  const featuredPost = posts?.find(p => p.is_featured) || posts?.[0]
  const latestPosts = posts?.filter(p => p.id !== featuredPost?.id) || []

  return (
    <main className="w-full bg-[#F6F8FC] min-h-screen font-body">
      {/* Blog Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#0D1B3E] via-[#0057FF] to-[#0099FF] pt-14 pb-12 text-white relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              📝 Blog
            </span>
            <span className="text-[12px] text-white/50">
              Shopping Guides · Deals Explained · UAE Retail News
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-normal leading-tight mb-3">
            Smart Shopping <br /><em className="not-italic opacity-90">Starts Here</em>
          </h1>
          <p className="text-[15px] text-white/70 max-w-[500px] mb-6">
            Expert tips, deal breakdowns, product guides and coupon strategies tailored for UAE shoppers.
          </p>
          
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            <Link 
              href={`/${locale}/blog`}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${!sp.category ? 'bg-white text-[#0057FF] border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
            >
              All Posts
            </Link>
            {categories?.map((cat: BlogCategory) => (
              <Link 
                key={cat.id}
                href={`/${locale}/blog?category=${cat.id}`}
                className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${sp.category === cat.id ? 'bg-white text-[#0057FF] border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        
        {/* Left Column: Posts Grid */}
        <div className="min-w-0">
          {!posts || posts.length === 0 ? (
            <div className="py-24 text-gray-500 font-medium text-center border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg">No posts found for this criteria.</p>
              <p className="text-sm text-gray-400 mt-1">Try selecting a different category or clearing your search.</p>
              <Link href={`/${locale}/blog`} className="inline-block mt-6 text-[#0057FF] font-bold hover:underline">
                View All Posts →
              </Link>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <div className="mb-10">
                  <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-[0.8px] mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]"></span> ⭐ FEATURED POST
                  </div>
                  <BlogCard post={featuredPost} variant="featured" locale={locale} />
                </div>
              )}

              {/* Latest Posts Grid */}
              {latestPosts.length > 0 && (
                <>
                  <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-[0.8px] mb-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF]"></span> 🗞 LATEST POSTS
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {latestPosts.map((post: BlogPost) => (
                      <BlogCard key={post.id} post={post} locale={locale} />
                    ))}
                  </div>
                </>
              )}

              {/* Load More Button */}
              {count && count > limit * page && (
                <div className="text-center mt-10">
                  <Link 
                    href={`/${locale}/blog?page=${page + 1}${sp.category ? `&category=${sp.category}` : ''}`}
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-[8px] border-[1.5px] border-[#DDE3EF] bg-transparent text-[#0D1117] font-semibold text-[13px] hover:border-[#0057FF] hover:text-[#0057FF] transition-all"
                  >
                    Load More Posts
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <aside className="space-y-6">
          {/* Top Ad: Noon Flash Sale (Blueprint Style) */}
          <div className="rounded-[14px] overflow-hidden p-5 text-center border-[1.5px] bg-gradient-to-br from-[#fff3eb] to-[#ffddc8] border-[#ffb380] border-dashed">
            <div className="text-[9px] tracking-[1px] uppercase text-[#8A94A6] mb-2">Advertisement</div>
            <div className="text-4xl mb-2">🛒</div>
            <div className="text-[16px] font-extrabold mb-1 text-[#FF6B00]">Noon Flash Sale</div>
            <p className="text-[11px] text-[#4B5675] mb-3">Up to 70% off on electronics this weekend only.</p>
            <div className="bg-white/50 border border-[#FF6B00]/30 rounded-lg py-2 px-3 mb-4 text-[13px] font-mono font-bold text-[#0D1117]">
              Code: NOON70
            </div>
            <a href="#" className="inline-flex items-center justify-center px-4 py-2 rounded-[8px] font-bold text-[12px] w-full transition-all hover:scale-[1.02] bg-[#FF6B00] text-white shadow-[0_4px_12px_rgba(255,107,0,0.2)]">
              Shop Now →
            </a>
          </div>

          <AdWidget fallback="newsletter" />

          {/* Popular Posts */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5 shadow-sm">
            <div className="text-[14px] font-extrabold mb-4 flex items-center gap-2 border-l-4 border-[#0057FF] pl-3">
              🔥 Popular Posts
            </div>
            <div className="space-y-1">
              {popularPosts?.map((post: BlogPost) => (
                <BlogCard key={post.id} post={post} variant="mini" locale={locale} />
              ))}
            </div>
          </div>

          {/* Tags Cloud */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5 shadow-sm">
            <div className="text-[14px] font-extrabold mb-4 flex items-center gap-2 border-l-4 border-[#0057FF] pl-3">
              🏷 Popular Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {tags?.map((tag: BlogTag) => (
                <Link 
                  key={tag.id}
                  href={`/${locale}/blog?tag=${tag.id}`}
                  className="px-3 py-1.5 bg-[#F0F3FA] rounded-full text-[11px] font-semibold text-[#4B5675] hover:bg-[#e8f0ff] hover:text-[#0057FF] transition-all"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mid Ad Widget */}
          <AdWidget ad={midAd} fallback="coupons" />
        </aside>

      </div>
    </main>
  )
}
