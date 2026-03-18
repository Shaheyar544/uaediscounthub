'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const STATS = [
  { icon: '🔥', value: '2,847', label: 'Active Deals' },
  { icon: '⚡', value: '143',   label: 'Price Drops Today' },
  { icon: '👥', value: '50K+',  label: 'Smart Shoppers' },
  { icon: '💰', value: 'AED 2.3M', label: 'Saved This Month' },
]

const TRENDING = ['iPhone 15 Pro', 'PS5', 'MacBook Air M3', 'Samsung S24', 'AirPods Pro']
const AVATARS  = ['A', 'M', 'S', 'F', 'K']

interface HeroSectionProps {
  locale: string
}

export function HeroSection({ locale }: HeroSectionProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(q: string) {
    const term = q.trim() || query.trim()
    if (term) router.push(`/${locale}/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <section className="relative min-h-[600px] overflow-hidden bg-[#0A0F1E] rounded-[28px]">
      {/* Animated gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse animation-delay-1000 pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] animate-pulse animation-delay-2000 pointer-events-none" />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      {/* Bottom fade — smooth transition to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F7F8FA] to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[600px] px-4 py-16 text-center gap-6">

        {/* Stats ticker */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {STATS.map(stat => (
            <div key={stat.label} className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full">
              <span className="text-sm">{stat.icon}</span>
              <span className="font-bold text-white text-sm">{stat.value}</span>
              <span className="text-white/50 text-xs hidden sm:inline">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Headline */}
        <h1 className="text-[42px] md:text-[68px] font-black text-white leading-none tracking-tight max-w-4xl">
          Find the Best
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient-text">
            Tech Deals
          </span>
          <br />
          <span className="text-white/90 text-[36px] md:text-[56px]">in UAE & GCC</span>
        </h1>

        <p className="text-[16px] text-white/60 max-w-[500px] leading-relaxed">
          Real-time price comparison across <strong className="text-white/85">Amazon UAE, Noon, Sharaf DG</strong> and more.
        </p>

        {/* Search bar */}
        <div className="relative w-full max-w-2xl">
          <div className="flex items-center bg-white rounded-2xl shadow-2xl shadow-blue-500/20 p-2 gap-2 border border-white/20">
            <Search className="ml-3 text-gray-400 shrink-0" size={20} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
              placeholder="iPhone 15 Pro, PS5, MacBook..."
              className="flex-1 py-3 px-2 text-[16px] outline-none text-gray-800 bg-transparent"
            />
            <button
              onClick={() => handleSearch(query)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition-all hover:scale-105 whitespace-nowrap text-[14px]"
            >
              Search Deals →
            </button>
          </div>

          {/* Trending pills */}
          <div className="flex items-center gap-2 mt-3 justify-center flex-wrap">
            <span className="text-white/50 text-sm">Trending:</span>
            {TRENDING.map(term => (
              <button
                key={term}
                onClick={() => handleSearch(term)}
                className="bg-white/10 hover:bg-white/20 text-white/80 text-sm px-3 py-1 rounded-full border border-white/10 transition-all hover:border-white/30"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="flex -space-x-2">
            {AVATARS.map((initial, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
              >
                {initial}
              </div>
            ))}
          </div>
          <div className="text-white/70 text-sm">
            <span className="text-white font-bold">2,847 people</span>
            {' '}found deals in the last 24 hours
          </div>
        </div>
      </div>
    </section>
  )
}
