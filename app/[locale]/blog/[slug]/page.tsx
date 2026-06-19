import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ReadingProgressBar } from '@/components/blog/ReadingProgressBar'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { ShareBar } from '@/components/blog/ShareBar'
import { AdWidget } from '@/components/blog/AdWidget'
import { sanitizeRichHtml } from '@/lib/sanitize-html'
import { BlogPost } from '@/types/blog'
import { Metadata } from 'next'
import { Clock, Calendar, Eye, MessageCircle, ChevronRight, User } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string, locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!post) return {}

  const title = post.seo_title || `${post.title} | UAEDiscountHub`
  const description = post.seo_description || post.excerpt

  return {
    title,
    description,
    keywords: post.seo_keywords?.join(', '),
    openGraph: {
      title,
      description,
      images: [{ url: post.og_image || post.featured_image }],
      type: 'article',
      publishedTime: post.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [post.og_image || post.featured_image],
    },
    alternates: {
      canonical: post.canonical_url || `https://uaediscounthub.com/${locale}/blog/${slug}`,
    }
  }
}

/**
 * Single Blog Post Page
 * Features a reading progress bar, breadcrumbs, social share bar, and a sticky sidebar.
 * Matches the 'SINGLE BLOG POST' design in UAEDiscountHub-Blog-System.html.
 */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string, locale: string }> }) {
  const { slug, locale } = await params
  const supabase = await createClient()

  // Fetch the post with relations
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*, author:author_id(display_name,bio,avatar_url,social_links,role), category:category_id(*), tags:blog_post_tags(tag:blog_tags(*))')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    notFound()
  }

  // Increment View Count (Fire and forget via server)
  // In a real scenario, this would be a secure RPC call
  await supabase.rpc('increment_view_count', { post_id: post.id })

  // Fetch Related Posts
  const { data: relatedPosts } = await supabase
    .from('blog_posts')
    .select('*, category:category_id(*)')
    .eq('category_id', post.category_id)
    .eq('status', 'published')
    .neq('id', post.id)
    .limit(3)

  // Sidebar Ads
  const { data: ads } = await supabase
    .from('blog_ad_widgets')
    .select('*')
    .eq('is_active', true)
  
  const topAd = ads?.find(a => a.position === 'sidebar-top')
  const bottomAd = ads?.find(a => a.position === 'sidebar-bottom')
  const sanitizedContent = sanitizeRichHtml(post.content)

  // JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': post.schema_type || 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author?.display_name || 'Admin'
    },
    publisher: {
      '@type': 'Organization',
      name: 'UAEDiscountHub',
      logo: {
        '@type': 'ImageObject',
        url: 'https://uaediscounthub.com/logo.png'
      }
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <ReadingProgressBar />

      {/* Breadcrumb Section */}
      <div className="max-w-[1200px] mx-auto px-8 pt-8">
        <nav className="flex items-center gap-2 text-[12px] text-[#8A94A6] mb-6">
          <Link href={`/${locale}`} className="hover:text-[#0057FF]">Home</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/blog`} className="hover:text-[#0057FF]">Blog</Link>
          {post.category && (
            <>
              <ChevronRight size={12} />
              <Link href={`/${locale}/blog?category=${post.category.id}`} className="hover:text-[#0057FF]">
                {post.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-[#0D1117] font-medium truncate max-w-[200px]">{post.title}</span>
        </nav>

        <div className="flex flex-wrap gap-2 mb-4">
          {post.category && (
            <span className="bg-[#FF6B00]/10 text-[#FF6B00] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              {post.category.name}
            </span>
          )}
          {post.is_featured && (
            <span className="bg-[#0057FF] text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              ⚡ EXCLUSIVE
            </span>
          )}
        </div>

        <h1 className="font-display text-[32px] md:text-[42px] font-normal leading-[1.2] mb-6 text-[#0D1117]">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 py-6 border-y border-[#DDE3EF] mb-8">
          <div className="flex items-center gap-3">
            {post.author?.avatar_url ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#DDE3EF]">
                <Image src={post.author.avatar_url} alt={post.author.display_name || 'Author'} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0057FF] text-white flex items-center justify-center font-bold text-[14px]">
                {post.author?.display_name?.[0] || 'A'}
              </div>
            )}
            <div>
              <div className="text-[13px] font-bold text-[#0D1117]">{post.author?.display_name || 'Admin'}</div>
              <div className="text-[11px] text-[#8A94A6]">{post.author?.role || 'Senior Deal Analyst'}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-[12px] text-[#8A94A6]">
            <Calendar size={14} className="text-[#4B5675]" />
            <span>{post.published_at ? new Date(post.published_at).toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-AE', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#e8f0ff] text-[#0057FF] px-3 py-1 rounded-full text-[11px] font-bold">
            <Clock size={14} />
            <span>{post.reading_time_min} min read</span>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-[#8A94A6]">
            <Eye size={14} />
            <strong>{post.view_count.toLocaleString()}</strong> views
          </div>

          <div className="flex items-center gap-2 text-[12px] text-[#8A94A6]">
            <MessageCircle size={14} />
            <strong>24</strong> comments
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-[1200px] mx-auto px-8 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
        
        {/* Article Column */}
        <article className="min-w-0">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative w-full aspect-[16/9] rounded-[14px] overflow-hidden mb-10 group shadow-lg">
              <Image 
                src={post.featured_image} 
                alt={post.title} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[11px] px-4 py-2">
                📷 {post.title} — UAEDiscountHub Exclusive
              </div>
            </div>
          )}

          {/* Post Content */}
          <div 
            className="prose prose-blue max-w-none prose-p:text-[#4B5675] prose-p:leading-[1.85] prose-headings:font-display prose-headings:text-[#0D1117] prose-h2:text-[28px] prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-[20px] prose-h3:mt-8 prose-h3:mb-3 prose-strong:text-[#0D1117] prose-a:text-[#0057FF] prose-a:no-underline hover:prose-a:underline prose-img:rounded-[14px] prose-blockquote:border-l-4 prose-blockquote:border-[#0057FF] prose-blockquote:bg-[#e8f0ff] prose-blockquote:p-6 prose-blockquote:rounded-r-[14px] prose-blockquote:not-italic"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          <ShareBar url={`https://uaediscounthub.com/${locale}/blog/${post.slug}`} title={post.title} />

          {/* Post Tags */}
          <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-[0.8px] mb-4">POST TAGS</div>
          <div className="flex flex-wrap gap-2 mb-10">
            {post.tags?.map((item: any) => (
              <Link 
                key={item.tag.id}
                href={`/${locale}/blog?tag=${item.tag.id}`}
                className="px-4 py-1.5 bg-[#F0F3FA] rounded-full text-[12px] font-semibold text-[#4B5675] hover:bg-[#e8f0ff] hover:text-[#0057FF] transition-all"
              >
                #{item.tag.name}
              </Link>
            ))}
          </div>

          {/* Author Box */}
          <div className="bg-white border-[1.5px] border-[#DDE3EF] rounded-[14px] p-8 flex gap-6 mb-12 shadow-sm">
            {post.author?.avatar_url ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-[1.5px] border-[#DDE3EF] flex-shrink-0">
                <Image src={post.author.avatar_url} alt={post.author.display_name || 'Author'} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#0057FF] text-white flex items-center justify-center text-3xl font-extrabold flex-shrink-0">
                {post.author?.display_name?.[0] || 'A'}
              </div>
            )}
            <div>
              <div className="text-[18px] font-extrabold text-[#0D1117] mb-1">{post.author?.display_name || 'Ahmed Al-Rashid'}</div>
              <div className="text-[13px] font-bold text-[#FF6B00] mb-3">{post.author?.role || 'Senior Deal Analyst @ UAEDiscountHub'}</div>
              <p className="text-[14px] text-[#4B5675] leading-[1.6]">
                {post.author?.bio ||
                  (post.author?.role
                    ? 'Expert in tracking prices across major UAE retailers daily and identifying the strongest coupon and savings opportunities for local shoppers.'
                    : 'Our senior content team focuses on delivering high-quality shopping guides and retail news to help UAE residents save more every day.')}
              </p>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts && relatedPosts.length > 0 && (
            <div className="space-y-6">
              <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-[0.8px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF]"></span> 🔗 RELATED POSTS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedPosts.map((r: BlogPost) => (
                  <Link key={r.id} href={`/${locale}/blog/${r.slug}`} className="group">
                    <div className="bg-white border-[1.5px] border-[#DDE3EF] rounded-[14px] overflow-hidden transition-all group-hover:border-[#0057FF] group-hover:shadow-md">
                      <div className="relative aspect-video bg-[#F0F3FA]">
                         {r.featured_image ? (
                           <Image src={r.featured_image} alt={r.title} fill className="object-cover" />
                         ) : (
                           <div className="flex items-center justify-center h-full text-2xl">📝</div>
                         )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-[13px] font-bold leading-tight group-hover:text-[#0057FF] transition-colors line-clamp-2 mb-2">{r.title}</h4>
                        <span className="inline-flex items-center gap-1 bg-[#e8f0ff] text-[#0057FF] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                          <Clock size={10} /> {r.reading_time_min}m
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar Column */}
        <aside className="space-y-6">
          <TableOfContents content={post.content} />
          
          <AdWidget ad={topAd} fallback="newsletter" />

          {/* Deal Stats Widget */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5 shadow-sm">
            <div className="text-[14px] font-extrabold mb-4 flex items-center gap-2 border-l-4 border-[#0057FF] pl-3">
              📊 Deal Stats
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[#4B5675]">Avg. Savings Mentioned</span>
                <strong className="text-[#00C48C]">AED 340</strong>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[#4B5675]">Active Store Coupons</span>
                <strong className="text-[#0057FF]">17</strong>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[#4B5675]">Readers Saved So Far</span>
                <strong className="text-[#FF6B00]">4,200+</strong>
              </div>
            </div>
          </div>

          <AdWidget ad={bottomAd} fallback="coupons" />
        </aside>

      </div>
    </div>
  )
}
