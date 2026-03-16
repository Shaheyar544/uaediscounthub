'use client'

import React from 'react'

interface GoogleSearchPreviewProps {
  title: string
  description: string
  slug: string
  date?: string
}

/**
 * GoogleSearchPreview Component
 * Mocks the Google SERP appearance for SEO optimization in the admin editor.
 */
export function GoogleSearchPreview({ title, description, slug, date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }: GoogleSearchPreviewProps) {
  const displayTitle = title || 'Post Title — Make it compelling and keyword-rich...'
  const displayDesc = description || 'Meta description will appear here. It should be between 140-160 characters for optimal visibility in search results.'
  const displaySlug = slug || 'your-post-slug-here'

  return (
    <div className="bg-white rounded-lg p-4 border-[1.5px] border-[#DDE3EF] shadow-sm">
      <div className="flex items-center gap-1 text-[12px] text-[#1a8917] mb-1 truncate">
        <span>uaediscounthub.com</span>
        <span>›</span>
        <span>blog</span>
        <span>›</span>
        <span className="font-medium">{displaySlug}</span>
      </div>
      <h3 className="text-[18px] text-[#1a0dab] leading-tight mb-1 hover:underline cursor-pointer">
        {displayTitle.length > 60 ? `${displayTitle.substring(0, 60)}...` : displayTitle}
      </h3>
      <div className="text-[13px] text-[#4d5156] leading-[1.5] line-clamp-2">
        <span className="text-[#70757a]">{date} — </span>
        {displayDesc.length > 160 ? `${displayDesc.substring(0, 160)}...` : displayDesc}
      </div>
    </div>
  )
}
