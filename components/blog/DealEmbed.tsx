'use client'

import React from 'react'

interface DealEmbedProps {
  title: string
  discount: string
  store?: string
  expiry?: string
  code?: string
}

/**
 * DealEmbed Component
 * In-article styled card for showcasing specific deals or coupons.
 * Matches the deal-embed styling in UAEDiscountHub-Blog-System.html.
 */
export function DealEmbed({ title, discount, store = 'Amazon UAE', expiry = 'Limited Time', code }: DealEmbedProps) {
  return (
    <div className="bg-white border-[1.5px] border-[#DDE3EF] rounded-[14px] p-5 flex flex-col md:flex-row items-center gap-4 my-8 shadow-[0_2px_16px_rgba(0,87,255,0.07)]">
      <div className="w-14 h-14 rounded-[10px] bg-[#F0F3FA] flex items-center justify-center text-2xl flex-shrink-0">
        🛒
      </div>
      <div className="flex-1 text-center md:text-left">
        <div className="text-[14px] font-bold text-[#0D1117] mb-1">{title}</div>
        <div className="text-[12px] text-[#8A94A6] mb-1.5 flex flex-wrap justify-center md:justify-start gap-x-3 gap-y-1">
          <span>📍 {store}</span>
          <span>📅 {expiry}</span>
          <span className="text-[#00C48C] font-semibold">✓ Verified Today</span>
        </div>
        <div className="text-[22px] font-extrabold text-[#FF6B00]">
          {discount}
        </div>
      </div>
      <button className="bg-[#0057FF] text-white px-5 py-2.5 rounded-[8px] font-semibold text-[13px] hover:bg-[#0047dd] transition-all hover:scale-105 shadow-[0_4px_14px_rgba(0,87,255,0.3)] whitespace-nowrap">
        {code ? 'Show Code →' : 'Get Deal →'}
      </button>
    </div>
  )
}
