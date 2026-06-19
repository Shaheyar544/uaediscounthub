'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BlogPost } from '@/types/blog'
import { Clock, MessageCircle } from 'lucide-react'

interface BlogCardProps {
  post: BlogPost
  variant?: 'default' | 'featured' | 'mini' | 'horizontal'
  locale?: string
}

/**
 * BlogCard Component
 * Renders blog posts in various layouts matching the UAEDiscountHub-Blog-System design.
 */
export function BlogCard({ post, variant = 'default', locale = 'en' }: BlogCardProps) {
  const postUrl = `/${locale}/blog/${post.slug}`
  const authorName = post.author?.display_name || 'Admin'
  const authorInitial = authorName[0] || 'A'

  // Featured Post Layout (Large horizontal card)
  if (variant === 'featured') {
    return (
      <div className="group relative grid grid-cols-1 md:grid-cols-[1.2fr_1fr] overflow-hidden rounded-[14px] border-[1.5px] border-[#DDE3EF] bg-white transition-all duration-200 hover:border-[#0057FF] hover:shadow-[0_8px_40px_rgba(0,87,255,0.12)]">
        <div className="relative h-64 md:h-full min-h-[260px] bg-gradient-to-br from-[#0D1B3E] to-[#0057FF] flex items-center justify-center overflow-hidden">
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-6xl">🛍️</span>
          )}
          {post.is_featured && (
            <span className="absolute top-3 right-3 bg-[#FF6B00] text-white text-[10px] font-bold px-2 py-1 rounded-[4px] tracking-[0.5px] uppercase">
              EXCLUSIVE
            </span>
          )}
        </div>
        <div className="p-8 flex flex-col justify-center">
          <div className="text-[#FF6B00] text-[10px] font-extrabold tracking-[1px] uppercase mb-2">
            FEATURED {post.category?.name ? `— ${post.category.name}` : ''}
          </div>
          <Link href={postUrl}>
            <h2 className="font-display text-[22px] font-normal leading-[1.2] mb-3 text-[#0D1117] hover:text-[#0057FF] transition-colors">
              {post.title}
            </h2>
          </Link>
          <p className="text-[#4B5675] text-[13px] leading-[1.6] mb-4 line-clamp-3">
            {post.excerpt || post.content.substring(0, 160).replace(/<[^>]+>/g, '')}
          </p>
          <div className="flex items-center gap-3 mb-4">
            {post.author?.avatar_url ? (
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#DDE3EF]">
                <Image src={post.author.avatar_url} alt={authorName} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#0057FF] text-white text-[10px] font-bold flex items-center justify-center">
                {authorInitial}
              </div>
            )}
            <div>
              <div className="text-[12px] font-semibold text-[#4B5675]">{authorName}</div>
              <div className="text-[11px] text-[#8A94A6]">
                {post.published_at ? new Date(post.published_at).toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-AE', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
               <span className="flex items-center gap-1 bg-[#e8f0ff] text-[#0057FF] px-3 py-1 rounded-full text-[11px] font-bold">
                <Clock size={12} /> {post.reading_time_min} min read
              </span>
            </div>
          </div>
          <Link href={postUrl} className="inline-flex items-center justify-center gap-2 bg-[#0057FF] text-white px-5 py-2.5 rounded-[8px] font-semibold text-[13px] hover:bg-[#0047dd] transition-all hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(0,87,255,0.3)] w-fit">
            Read Full Guide →
          </Link>
        </div>
      </div>
    )
  }

  // Mini Variant (Sidebar style)
  if (variant === 'mini') {
    return (
      <Link href={postUrl} className="group flex gap-3 py-3 border-b border-[#DDE3EF] last:border-none last:pb-0">
        <div className="w-14 h-14 rounded-[8px] bg-[#e8f0ff] flex-shrink-0 flex items-center justify-center text-2xl overflow-hidden relative">
          {post.featured_image ? (
            <Image src={post.featured_image} alt={post.title} fill className="object-cover" />
          ) : (
            <span>📝</span>
          )}
        </div>
        <div>
          <h4 className="text-[12px] font-semibold text-[#0D1117] leading-[1.4] mb-1 group-hover:text-[#0057FF] transition-colors line-clamp-2">
            {post.title}
          </h4>
          <div className="text-[11px] text-[#8A94A6]">
             {post.published_at ? new Date(post.published_at).toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-AE', { month: 'short', day: 'numeric' }) : 'Draft'} · {post.reading_time_min} min read
          </div>
        </div>
      </Link>
    )
  }

  // Default and Horizontal layouts
  return (
    <div className={`group bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] overflow-hidden transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_40px_rgba(0,87,255,0.12)] hover:border-[#0057FF] ${variant === 'horizontal' ? 'flex flex-col md:flex-row' : ''}`}>
      <Link href={postUrl} className={`relative block overflow-hidden ${variant === 'horizontal' ? 'w-full md:w-48' : 'w-full aspect-video'} bg-[#e8f0ff]`}>
        {post.featured_image ? (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-50">📰</div>
        )}
        {post.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.4px]" style={{ backgroundColor: post.category.color || '#e8f0ff', color: '#0057FF' }}>
            {post.category.name}
          </span>
        )}
        {post.is_featured && variant !== 'horizontal' && (
          <span className="absolute top-3 right-3 bg-[#FF6B00] text-white text-[10px] font-bold px-2 py-1 rounded-[4px] uppercase">HOT</span>
        )}
      </Link>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            {post.author?.avatar_url ? (
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#DDE3EF]">
                <Image src={post.author.avatar_url} alt={authorName} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#0057FF] text-white text-[10px] font-bold flex items-center justify-center">
                {authorInitial}
              </div>
            )}
            <div className="text-[12px] font-semibold text-[#4B5675]">{authorName}</div>
          </div>
          <div className="text-[11px] text-[#8A94A6]">
            {post.published_at ? new Date(post.published_at).toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-AE', { month: 'short', day: 'numeric' }) : 'Draft'}
          </div>
          <span className="ml-auto flex items-center gap-1 bg-[#e8f0ff] text-[#0057FF] px-2 py-0.5 rounded-full text-[10px] font-bold">
            <Clock size={10} /> {post.reading_time_min}m
          </span>
        </div>

        <Link href={postUrl}>
          <h3 className="text-[16px] font-bold leading-[1.4] mb-2 text-[#0D1117] group-hover:text-[#0057FF] transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-[13px] text-[#4B5675] leading-[1.6] mb-4 line-clamp-2 flex-1">
          {post.excerpt || post.content.substring(0, 120).replace(/<[^>]+>/g, '')}
        </p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#DDE3EF]">
          <span className="text-[11px] text-[#8A94A6] flex items-center gap-1">
            <MessageCircle size={12} /> {post.view_count > 0 ? `${(post.view_count / 10).toFixed(0)} comments` : '0 comments'}
          </span>
          <Link href={postUrl} className="text-[12px] font-bold text-[#0057FF] no-underline hover:underline">
            Read more →
          </Link>
        </div>
      </div>
    </div>
  )
}
