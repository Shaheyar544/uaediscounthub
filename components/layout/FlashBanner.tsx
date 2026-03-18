'use client'

import { useState, useEffect } from 'react'

export function FlashBanner() {
  const [timeLeft, setTimeLeft] = useState({ h: 4, m: 27, s: 51 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev
        if (s > 0) s--
        else { s = 59; if (m > 0) m--; else { m = 59; if (h > 0) h-- } }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white text-[13px] font-semibold py-2.5 px-4 flex items-center justify-center gap-3 overflow-hidden">
      <span className="text-base animate-bounce">🔥</span>
      <span className="font-bold">Flash Sale — Up to 30% off Samsung S24 Ultra</span>
      <span className="font-mono bg-white/25 px-2 py-0.5 rounded text-[12px] font-black tracking-wide">NOON30</span>
      <span className="hidden sm:flex items-center gap-2 ml-1">
        <span className="text-orange-100 font-semibold text-[11px] uppercase tracking-wider">ENDS IN</span>
        <div className="flex items-center gap-1">
          <div className="bg-black/30 rounded-md px-2 py-0.5 font-mono text-[14px] font-black tabular-nums">{pad(timeLeft.h)}</div>
          <span className="font-black text-orange-200">:</span>
          <div className="bg-black/30 rounded-md px-2 py-0.5 font-mono text-[14px] font-black tabular-nums">{pad(timeLeft.m)}</div>
          <span className="font-black text-orange-200">:</span>
          <div className="bg-black/30 rounded-md px-2 py-0.5 font-mono text-[14px] font-black tabular-nums">{pad(timeLeft.s)}</div>
        </div>
      </span>
    </div>
  )
}
