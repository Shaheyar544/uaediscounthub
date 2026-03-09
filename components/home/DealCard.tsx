"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Star, ShoppingCart, TrendingDown } from 'lucide-react'

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
  locale = 'en'
}: DealCardProps) {

  const savings = originalPrice > base_price ? (originalPrice - base_price).toFixed(0) : null

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-300"
    >
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
        {badge && (
          <Badge className="bg-destructive hover:bg-destructive text-white border-none text-[10px] px-2 py-0.5 shadow-sm">
            {badge}
          </Badge>
        )}
        {discountPercent > 0 && (
          <Badge className="bg-orange-500 hover:bg-orange-500 text-white border-none text-[10px] px-2 py-0.5 shadow-sm flex items-center gap-1">
            <TrendingDown className="w-2.5 h-2.5" />
            -{discountPercent}%
          </Badge>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-white p-6">
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl text-muted-foreground text-xs text-center p-4 font-medium">
            {name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Store + Rating row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
            {store}
          </span>
          <div className="flex items-center gap-1 text-amber-500 shrink-0">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-semibold text-muted-foreground">{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
          <Link href={`/${locale}/product/${slug}`} className="after:absolute after:inset-0">
            {name}
          </Link>
        </h3>

        {/* Price row */}
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-foreground">
              AED {base_price?.toLocaleString()}
            </span>
            {originalPrice > base_price && (
              <span className="text-xs text-muted-foreground line-through">
                AED {originalPrice.toLocaleString()}
              </span>
            )}
            {savings && (
              <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                Save AED {savings}
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            className="buy-btn shrink-0 z-10 flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl transition-all duration-200"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Get Deal
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
