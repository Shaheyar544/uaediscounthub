"use client"

import { motion } from 'framer-motion'
import { TrendingDown, ArrowUpRight, History } from 'lucide-react'

export function PriceHistoryChart() {
    // Mock data for the 30-day chart
    const data = [100, 95, 95, 90, 85, 87, 85, 82, 80, 82, 85, 80, 78, 75, 75, 78, 80, 82, 80, 78, 75, 72, 70, 70, 68, 65, 65, 63, 60, 60]
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min

    // Transform data to SVG points
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 80 - ((d - min) / range) * 60 // Leave space for labels
        return `${x},${y}`
    }).join(' ')

    const areaPoints = `0,100 ${points} 100,100`

    return (
        <div className="price-history-card bg-card border border-border rounded-2xl p-6 my-10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <History className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-[17px] font-bold text-foreground">30-Day Price Trend</h3>
                        <p className="text-[12px] text-muted-foreground font-medium">Tracking daily price fluctuations</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-brand-green/10 text-brand-green text-[11.5px] font-bold px-3 py-1 rounded-full border border-brand-green/20">
                    <TrendingDown className="w-3.5 h-3.5" /> Lowest Recorded AED 4,219
                </div>
            </div>

            <div className="relative h-[200px] w-full">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" className="text-border" strokeWidth="0.1" strokeDasharray="2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-border" strokeWidth="0.1" strokeDasharray="2" />
                    <line x1="0" y1="80" x2="100" y2="80" stroke="currentColor" className="text-border" strokeWidth="0.1" strokeDasharray="2" />

                    {/* Area fill */}
                    <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        d={`M ${areaPoints}`}
                        fill="url(#gradient)"
                        className="opacity-20"
                    />

                    {/* Line */}
                    <motion.polyline
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        fill="none"
                        stroke="var(--brand-primary)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                    />

                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--brand-primary)" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Floating Labels */}
                <div className="absolute top-[12%] left-2 bg-card/80 backdrop-blur-sm border border-border px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground shadow-sm">
                    AED 4,899
                </div>
                <div className="absolute bottom-[12%] right-2 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-primary shadow-sm animate-bounce">
                    AED 4,219 (Today)
                </div>
            </div>

            <div className="flex justify-between mt-6 pt-6 border-t border-border/50">
                <div className="text-center">
                    <span className="text-[11px] font-medium text-muted-foreground block uppercase">Avg Price</span>
                    <span className="text-[15px] font-bold text-foreground">AED 4,512</span>
                </div>
                <div className="text-center">
                    <span className="text-[11px] font-medium text-muted-foreground block uppercase">Price Volatility</span>
                    <span className="text-[15px] font-bold text-brand-red">High (+12%)</span>
                </div>
                <div className="text-center">
                    <span className="text-[11px] font-medium text-muted-foreground block uppercase">Price Prediction</span>
                    <span className="text-[15px] font-bold text-brand-green flex items-center justify-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 transform rotate-45" /> Drop Soon
                    </span>
                </div>
            </div>
        </div>
    )
}
