"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Heart, Zap, Tag, ShoppingCart } from 'lucide-react'

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

  // Mock specs for demo if not provided
  const specs = ['5G', '256GB', 'OLED']

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="deal-card group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover hover:border-primary/30 transition-all duration-300"
    >
      {/* Top Badges & Actions */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {discountPercent > 0 && (
          <div className="bg-[#FF6B00] text-white text-[10.5px] font-bold px-2 py-0.5 rounded-sm shadow-deal-badge flex items-center gap-1">
            -{discountPercent}% OFF
          </div>
        )}
        {badge === 'Flash' && (
          <div className="bg-primary text-white text-[10.5px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 fill-current" /> FLASH
          </div>
        )}
      </div>

      <button
        suppressHydrationWarning
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/80 backdrop-blur-md border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-white transition-all shadow-sm"
      >
        <Heart className="w-4 h-4" />
      </button>

      {/* Product Image */}
      <div className="relative aspect-[4/3] w-full bg-white flex items-center justify-center p-6 overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs uppercase font-bold text-center p-4">
            {name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="store-tag flex items-center gap-1.5 px-1.5 py-0.5 bg-secondary border border-border rounded-sm">
            <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
              {store?.[0] || 'A'}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{store}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Star className="w-3 h-3 text-brand-gold fill-current" />
            <span className="text-[11px] font-bold text-foreground">{rating.toFixed(1)}</span>
          </div>
        </div>

        <h3 className="text-[14px] font-bold text-foreground leading-[1.4] line-clamp-2 h-10 group-hover:text-primary transition-colors">
          <Link href={`/${locale}/product/${slug}`}>
            {name}
          </Link>
        </h3>

        {/* Spec Pills */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {specs.map((s, i) => (
            <span key={i} className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-sm border border-border/50">
              {s}
            </span>
          ))}
        </div>

        {/* Price Section */}
        <div className="flex items-end justify-between mt-2 pt-2 border-t border-border/50">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[18px] font-extrabold text-foreground">
                AED {base_price?.toLocaleString()}
              </span>
              {originalPrice > base_price && (
                <span className="text-[12px] text-muted-foreground line-through font-medium">
                  {originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {originalPrice > base_price && (
              <span className="text-[11px] font-bold text-brand-green">
                Save AED {(originalPrice - base_price).toLocaleString()}
              </span>
            )}
          </div>

          <Link
            href={`/${locale}/product/${slug}`}
            className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-dim hover:-translate-y-0.5 transition-all shadow-sm"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

