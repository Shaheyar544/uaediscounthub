"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

interface DealCardProps {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    base_price: number;
    originalPrice?: number;
    discountPercent?: number;
    rating?: number;
    store?: string;
    badge?: string;
    locale: string;
}

export function DealCard({ id, name, slug, image_url, base_price, originalPrice = 0, discountPercent = 0, rating = 5.0, store = 'Amazon', badge, locale }: DealCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
        >
            {badge && (
                <Badge className="absolute left-3 top-3 z-10 bg-destructive hover:bg-destructive text-white border-none shadow-sm animate-pulse">
                    {badge}
                </Badge>
            )}
            <div className="relative aspect-square w-full overflow-hidden bg-white p-4">
                {image_url ? (
                    <img src={image_url} alt={name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground transition-transform duration-300 group-hover:scale-105 text-sm text-center p-2">
                        {name}
                    </div>
                )}
            </div>
            <div className="flex flex-col flex-1 p-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{store}</span>
                    <div className="flex items-center text-amber-500 text-xs font-medium">
                        <Star className="w-3 h-3 fill-current mr-1" />
                        {rating.toFixed(1)}
                    </div>
                </div>
                <h3 className="font-semibold leading-tight line-clamp-2 mb-4 group-hover:text-primary transition-colors">
                    <Link href={`/${locale}/product/${slug}`}>
                        <span className="absolute inset-0" />
                        {name}
                    </Link>
                </h3>
                <div className="mt-auto flex items-end justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-primary">AED {base_price?.toLocaleString()}</span>
                            {discountPercent > 0 && (
                                <span className="text-sm text-red-500 font-medium bg-red-100 dark:bg-red-900/30 px-1.5 rounded">-{discountPercent}%</span>
                            )}
                        </div>
                        {originalPrice > 0 && (
                            <span className="text-xs text-muted-foreground line-through">AED {originalPrice.toLocaleString()}</span>
                        )}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="z-10 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        Get Deal
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}
