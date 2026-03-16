'use client'

import React from 'react'
import Image from 'next/image'
import { BlogAdWidget } from '@/types/blog'

interface AdWidgetProps {
  ad?: BlogAdWidget | null
  fallback?: 'newsletter' | 'coupons' | 'none'
}

/**
 * AdWidget Component
 * Renders an advertisement widget or a fallback content (like newsletter signup).
 * Matches the ad-widget styling in UAEDiscountHub-Blog-System.html.
 */
export function AdWidget({ ad, fallback = 'newsletter' }: AdWidgetProps) {
  // If no ad is provided, render the requested fallback
  if (!ad) {
    if (fallback === 'newsletter') {
      return (
        <div className="bg-gradient-to-br from-[#0057FF] to-[#0099FF] rounded-[14px] p-5 text-white shadow-[0_2px_16px_rgba(0,87,255,0.07)]">
          <div className="flex items-center gap-2 text-[14px] font-extrabold mb-3">
            <span className="w-1 h-4 bg-white rounded-full"></span> 📬 Deal Alerts
          </div>
          <p className="text-[12px] text-white/70 mb-3 leading-relaxed">
            Get exclusive promo codes & deals delivered daily to your inbox.
          </p>
          <div className="space-y-2">
            <input 
              type="email" 
              placeholder="your@email.com" 
              className="w-full px-3 py-2.5 rounded-[8px] border-none font-body text-[12px] text-[#0D1117] focus:ring-2 focus:ring-white outline-none"
            />
            <button className="w-full py-2.5 bg-white text-[#0057FF] border-none rounded-[8px] font-bold text-[12px] hover:bg-[#F0F3FA] transition-colors">
              Subscribe Free →
            </button>
          </div>
        </div>
      )
    }

    if (fallback === 'coupons') {
       return (
        <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5">
          <div className="flex items-center gap-2 text-[14px] font-extrabold mb-4 border-l-4 border-[#FF6B00] pl-3">
            🔥 Top Coupons
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-center p-2 rounded-lg hover:bg-[#F6F8FC] transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-md bg-[#F0F3FA] flex items-center justify-center text-xl">🏷️</div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-[#0D1117] line-clamp-1 group-hover:text-[#0057FF]">Amazon UAE</div>
                  <div className="text-[10px] text-[#FF6B00] font-extrabold">15% OFF</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  // If we have an active ad
  if (ad.html_code) {
    return (
      <div className="rounded-[14px] overflow-hidden border-[1.5px] border-[#DDE3EF] bg-white">
        <div className="text-[9px] tracking-[1px] uppercase text-[#8A94A6] text-center py-1 border-b border-[#DDE3EF]">Advertisement</div>
        <div dangerouslySetInnerHTML={{ __html: ad.html_code }} />
      </div>
    )
  }

  return (
    <div className={`rounded-[14px] overflow-hidden p-5 text-center border-[1.5px] ${ad.position === 'sidebar-mid' ? 'bg-gradient-to-br from-[#e8f0ff] to-[#c8d8ff] border-[#aac0ff]' : 'bg-gradient-to-br from-[#fff3eb] to-[#ffddc8] border-[#ffb380] border-dashed'}`}>
      <div className="text-[9px] tracking-[1px] uppercase text-[#8A94A6] mb-2">
        {ad.position === 'sidebar-mid' ? 'Sponsored' : 'Advertisement'}
      </div>
      
      {ad.image_url ? (
        <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
           <Image src={ad.image_url} alt={ad.title || 'Advertisement'} fill className="object-cover" />
        </div>
      ) : (
        <div className="text-4xl mb-2">{ad.position === 'sidebar-mid' ? '📦' : '🛒'}</div>
      )}

      {ad.title && (
        <div className={`text-[16px] font-extrabold mb-1 ${ad.position === 'sidebar-mid' ? 'text-[#0057FF]' : 'text-[#FF6B00]'}`}>
          {ad.title}
        </div>
      )}
      
      {ad.cta_text && (
        <div className="mt-3">
          <a 
            href={ad.link_url || '#'} 
            target="_blank" 
            rel="noopener noreferrer sponsored"
            className={`inline-flex items-center justify-center px-4 py-2 rounded-[8px] font-bold text-[12px] w-full transition-all hover:scale-[1.02] ${ad.position === 'sidebar-mid' ? 'bg-[#0057FF] text-white shadow-[0_4px_12px_rgba(0,87,255,0.2)]' : 'bg-[#FF6B00] text-white shadow-[0_4px_12px_rgba(255,107,0,0.2)]'}`}
          >
            {ad.cta_text} →
          </a>
        </div>
      )}
    </div>
  )
}
