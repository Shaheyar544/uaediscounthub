'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Heart, ShoppingCart } from 'lucide-react'
import { useHasMounted } from '@/hooks/use-has-mounted'

interface DealCardProps {
  id: string
  name: string
  slug: string
  image_url?: string | null
  base_price: number
  originalPrice?: number
  discountPercent?: number
  rating?: number
  store?: string
  badge?: string
  locale?: string
}

export function DealCard({
  id, name, slug, image_url,
  base_price, originalPrice = 0,
  discountPercent = 0, rating = 4.5,
  store = 'Amazon AE', badge,
  locale = 'en',
}: DealCardProps) {
  const hasMounted = useHasMounted()
  const viewingCount = (id.charCodeAt(0) % 16) + 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {discountPercent > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white font-black text-sm px-2 py-1 rounded-lg shadow-lg shadow-red-200">
          -{discountPercent}%
        </div>
      )}

      <button
        className={`absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-md border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm ${!hasMounted ? 'opacity-0' : 'opacity-100'}`}
      >
        <Heart className="w-4 h-4" />
      </button>

      <div className="relative aspect-[4/3] w-full bg-white flex items-center justify-center overflow-hidden">
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-xs font-bold text-center p-4 uppercase">
            {name}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
            {store}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-[11px] font-bold text-gray-700">{rating.toFixed(1)}</span>
          </div>
        </div>

        <h3 className="text-[13px] font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[40px]">
          <Link href={`/${locale}/product/${slug}`}>{name}</Link>
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            {viewingCount} viewing
          </div>
          <div className="text-xs text-green-600 font-bold">↓ Lowest in 30 days</div>
        </div>

        <div className="flex items-end justify-between mt-1 pt-2 border-t border-gray-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[18px] font-extrabold text-gray-900">
                AED {base_price?.toLocaleString()}
              </span>
              {originalPrice > base_price && (
                <span className="text-[12px] text-gray-400 line-through">
                  {originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {originalPrice > base_price && (
              <span className="text-[11px] font-bold text-green-600">
                Save AED {(originalPrice - base_price).toLocaleString()}
              </span>
            )}
          </div>
          <Link
            href={`/${locale}/product/${slug}`}
            className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
