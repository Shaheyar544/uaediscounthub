'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CouponCardProps {
  id: string
  storeName: string
  storeLogo: string
  discount: string
  description: string
  code: string
  expiry?: string
  color?: string
}

export function CouponCard({
  id, storeName, storeLogo, discount,
  description, code, expiry, color = '#0A84FF',
}: CouponCardProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl overflow-hidden hover:shadow-md transition-all">
      {/* Discount badge */}
      <div
        className="absolute top-3 right-3 text-white font-black text-sm px-2 py-1 rounded-lg"
        style={{ backgroundColor: color }}
      >
        {discount}
      </div>

      {/* Store header */}
      <div className="p-4 pb-0 flex items-center gap-2">
        <img
          src={storeLogo || '/placeholder-store.png'}
          alt={storeName}
          className="w-8 h-8 object-contain rounded"
          onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-store.png' }}
        />
        <span className="font-bold text-sm text-gray-700">{storeName}</span>
      </div>

      {/* Description */}
      <div className="px-4 py-2">
        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
      </div>

      {/* Coupon code */}
      <div className="mx-4 mb-3 bg-white border-2 border-dashed border-amber-400 rounded-xl p-3 flex items-center justify-between">
        <span className="font-mono font-black text-lg text-amber-700 tracking-widest">
          {code}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-800 transition-colors"
        >
          {copied
            ? <><Check className="w-3.5 h-3.5 text-green-600" /> COPIED</>
            : <><Copy className="w-3.5 h-3.5" /> COPY</>
          }
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 text-xs text-gray-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        104 used today
        {expiry && <span className="ml-auto">Exp: {expiry}</span>}
      </div>
    </div>
  )
}
