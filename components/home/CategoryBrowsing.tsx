"use client"

import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Category {
  id: string
  name_en: string
  name_ar?: string
  slug: string
  icon_emoji?: string | null
  logo_url?: string | null
  color?: string | null
}

interface CategoryBrowsingProps {
  locale: string
  categories: Category[]
  counts?: Record<string, number>  // slug → count from DB
}

/**
 * CategoryBrowsing component with a premium infinite scrolling marquee.
 * Fetches real categories from the DB and animate them smoothly.
 * Pauses on hover as requested.
 */
export function CategoryBrowsing({ locale, categories, counts = {} }: CategoryBrowsingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current && contentRef.current) {
        setShouldAnimate(contentRef.current.scrollWidth > containerRef.current.offsetWidth)
      }
    }
    
    const timer = setTimeout(checkScroll, 500)
    window.addEventListener('resize', checkScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkScroll)
    }
  }, [categories])

  if (!categories || categories.length === 0) return null

  // Duplicate for seamless loop if animating
  const displayCategories = shouldAnimate ? [...categories, ...categories] : categories
  const duration = Math.max(categories.length * 3, 15)

  return (
    <section className="py-12 bg-gray-50/50 -mx-4 px-4 md:-mx-6 md:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-8 px-4 md:px-0">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Shop by Category
        </h2>
      </div>

      <div ref={containerRef} className="relative w-full overflow-hidden">
        {/* Gradients for smooth fade-in/out at edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

        <motion.div 
          ref={contentRef}
          className={`flex w-max gap-4 md:gap-6 py-4 px-4 ${!shouldAnimate ? 'justify-center mx-auto' : ''}`}
          animate={shouldAnimate && !isPaused ? { x: [0, "-50%"] } : {}}
          transition={{
            duration: duration,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop"
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {displayCategories.map((cat, idx) => {
            const count = counts[cat.slug] ?? counts[cat.name_en?.toLowerCase()] ?? 0
            return (
              <Link
                key={`${cat.id}-${idx}`}
                href={`/${locale}/category/${cat.slug}`}
                className="flex-shrink-0 flex flex-col items-center justify-center gap-3 w-[120px] h-[120px] md:w-[160px] md:h-[160px] bg-white rounded-3xl border border-gray-100/80 shadow-sm hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 transform cursor-pointer group"
              >
                <div 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-4xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-inner"
                  style={{ backgroundColor: `${cat.color || '#F3F4F6'}15` }}
                >
                  {cat.icon_emoji || '📦'}
                </div>
                
                <div className="text-center px-2">
                  <span className="text-[11px] md:text-[13px] font-black text-gray-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight line-clamp-1">
                    {cat.name_en}
                  </span>
                  {count > 0 && (
                    <div className="text-[9px] md:text-[10px] font-bold text-gray-400 mt-0.5 opacity-80">
                      {count}+ DEALS
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
