'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RecentProduct {
  id: string
  slug: string
  name: string
  image_url?: string
  price?: number
}

export const RECENTLY_VIEWED_KEY = 'udh_recently_viewed'

export function trackProductView(product: RecentProduct) {
  try {
    const raw   = localStorage.getItem(RECENTLY_VIEWED_KEY)
    const items: RecentProduct[] = raw ? JSON.parse(raw) : []
    // Remove if already exists, add to front, cap at 10
    const updated = [product, ...items.filter(p => p.id !== product.id)].slice(0, 10)
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated))
  } catch {
    // localStorage not available — silently ignore
  }
}

export function RecentlyViewed({ locale = 'en' }: { locale?: string }) {
  const [items, setItems] = useState<RecentProduct[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  if (items.length === 0) return null

  return (
    <section className="py-6">
      <h2 className="text-xl font-black text-gray-900 mb-4">👀 Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {items.map(item => (
          <Link
            key={item.id}
            href={`/${locale}/product/${item.slug}`}
            className="flex-shrink-0 w-[140px] bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
          >
            <div className="w-full h-[110px] bg-gray-50 rounded-t-2xl flex items-center justify-center p-3 overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="text-gray-200 text-xs font-bold text-center">{item.name}</div>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[11px] font-bold text-gray-700 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                {item.name}
              </p>
              {item.price != null && (
                <p className="text-[12px] font-extrabold text-gray-900 mt-1">
                  AED {item.price.toLocaleString()}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
