"use client"

import { motion } from 'framer-motion'
import { TrendingDown, History, Info } from 'lucide-react'

interface PricePoint {
  price: number
  recorded_at: string
}

interface PriceHistoryChartProps {
  history: PricePoint[]
}

// FIX 5D: Shows real price history or a helpful empty state — never fake data
export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  // No data at all
  if (!history || history.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 my-10 flex items-center gap-4 text-muted-foreground">
        <div className="p-2 bg-primary/10 rounded-xl shrink-0">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-foreground">Price History</p>
          <p className="text-[12px] flex items-center gap-1 mt-0.5">
            <Info className="w-3.5 h-3.5" />
            Price history will appear after the first price update
          </p>
        </div>
      </div>
    )
  }

  // Single point — show starting price card
  if (history.length === 1) {
    const fmtDate  = (iso: string) => new Date(iso).toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })
    const fmtPrice = (p: number)   => `AED ${p.toLocaleString()}`
    return (
      <div className="bg-card border border-border rounded-2xl p-6 my-10 flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-xl shrink-0">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-foreground">Price History</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Tracking started {fmtDate(history[0].recorded_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium text-muted-foreground uppercase">Starting Price</p>
          <p className="text-[18px] font-extrabold text-foreground">{fmtPrice(history[0].price)}</p>
        </div>
      </div>
    )
  }

  const prices   = history.map(h => h.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const range    = maxPrice - minPrice || 1
  const latest   = prices[prices.length - 1]
  const oldest   = prices[0]
  const drop     = oldest > latest ? Math.round(((oldest - latest) / oldest) * 100) : 0

  // SVG points (0–100 viewBox)
  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * 100
    const y = 80 - ((h.price - minPrice) / range) * 60
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `0,100 ${points} 100,100`

  // Label formatter
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })
  const fmtPrice = (p: number) => `AED ${p.toLocaleString()}`

  return (
    <div className="price-history-card bg-card border border-border rounded-2xl p-6 my-10 relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-foreground">Price History</h3>
            <p className="text-[12px] text-muted-foreground font-medium">
              {history.length} data points · {fmtDate(history[0].recorded_at)} – {fmtDate(history[history.length - 1].recorded_at)}
            </p>
          </div>
        </div>
        {drop > 0 && (
          <div className="flex items-center gap-2 bg-brand-green/10 text-brand-green text-[11.5px] font-bold px-3 py-1 rounded-full border border-brand-green/20">
            <TrendingDown className="w-3.5 h-3.5" /> Down {drop}% · Lowest {fmtPrice(minPrice)}
          </div>
        )}
      </div>

      <div className="relative h-[200px] w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" className="text-border" strokeWidth="0.1" strokeDasharray="2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-border" strokeWidth="0.1" strokeDasharray="2" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="currentColor" className="text-border" strokeWidth="0.1" strokeDasharray="2" />

          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            d={`M ${areaPoints}`}
            fill="url(#gradient)"
            className="opacity-20"
          />

          <motion.polyline
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="var(--brand-primary)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>

        {/* Min/Max labels */}
        <div className="absolute top-[8%] left-2 bg-card/80 backdrop-blur-sm border border-border px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground shadow-sm">
          {fmtPrice(maxPrice)}
        </div>
        <div className="absolute bottom-[8%] right-2 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-primary shadow-sm">
          {fmtPrice(minPrice)} (low)
        </div>
      </div>

      <div className="flex justify-between mt-6 pt-5 border-t border-border/50">
        <div className="text-center">
          <span className="text-[11px] font-medium text-muted-foreground block uppercase">Lowest</span>
          <span className="text-[15px] font-bold text-brand-green">{fmtPrice(minPrice)}</span>
        </div>
        <div className="text-center">
          <span className="text-[11px] font-medium text-muted-foreground block uppercase">Highest</span>
          <span className="text-[15px] font-bold text-foreground">{fmtPrice(maxPrice)}</span>
        </div>
        <div className="text-center">
          <span className="text-[11px] font-medium text-muted-foreground block uppercase">Current</span>
          <span className="text-[15px] font-bold text-foreground">{fmtPrice(latest)}</span>
        </div>
      </div>
    </div>
  )
}
