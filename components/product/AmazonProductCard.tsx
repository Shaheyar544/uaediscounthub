"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Heart, Zap, ShoppingCart, ExternalLink } from 'lucide-react'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { AmazonProduct } from '@/lib/amazon-creators-api'

interface AmazonProductCardProps {
  product: AmazonProduct
  showSavings?: boolean
}

export function AmazonProductCard({
  product,
  showSavings = true
}: AmazonProductCardProps) {
  const hasMounted = useHasMounted()

  // Calculate discount percentage if not provided but savings are
  const discountPercent = product.discountPercent || (product.savings && product.originalPrice 
    ? Math.round((product.savings / product.originalPrice) * 100) 
    : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="amazon-product-card group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover hover:border-primary/30 transition-all duration-300"
    >
      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {discountPercent > 0 && (
          <div className="bg-[#FF6B00] text-white text-[10.5px] font-bold px-2 py-0.5 rounded-sm shadow-deal-badge flex items-center gap-1">
            -{discountPercent}% OFF
          </div>
        )}
        <div className="bg-primary text-white text-[10.5px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 fill-current" /> AMAZON CHOICE
        </div>
      </div>

      <button
        className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/80 backdrop-blur-md border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-white transition-all shadow-sm ${!hasMounted ? 'opacity-0' : 'opacity-100'}`}
      >
        <Heart className="w-4 h-4" />
      </button>

      {/* Product Image */}
      <div className="relative aspect-[4/3] w-full bg-white flex items-center justify-center p-6 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs uppercase font-bold text-center p-4">
            {product.title}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="store-tag flex items-center gap-1.5 px-1.5 py-0.5 bg-secondary border border-border rounded-sm">
            <div className="w-3 h-3 rounded-full bg-[#FF9900]/20 flex items-center justify-center text-[7px] font-bold text-[#FF9900]">
              A
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amazon.ae</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Star className="w-3 h-3 text-brand-gold fill-current" />
            <span className="text-[11px] font-bold text-foreground">4.8</span>
          </div>
        </div>

        <h3 className="text-[14px] font-bold text-foreground leading-[1.4] line-clamp-2 h-10 group-hover:text-primary transition-colors">
          <Link href={product.url} target="_blank" rel="noopener noreferrer">
            {product.title}
          </Link>
        </h3>

        {/* Price Section */}
        <div className="flex items-end justify-between mt-2 pt-2 border-t border-border/50">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[18px] font-extrabold text-foreground">
                {product.currency} {product.price?.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[12px] text-muted-foreground line-through font-medium">
                  {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {showSavings && product.savings && (
              <span className="text-[11px] font-bold text-brand-green">
                Save {product.currency} {product.savings.toLocaleString()}
              </span>
            )}
          </div>

          <Link
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 bg-[#FF9900] text-white rounded-lg flex items-center justify-center hover:bg-[#e68a00] hover:-translate-y-0.5 transition-all shadow-sm"
            title="View on Amazon"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
