'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FlashBannerProps {
  enabled: boolean
  text: string
  color: string
  icon: string
  promoCode: string
  link: string
  countdown: string
}

export function FlashBanner({ enabled, text, color, icon, promoCode, link, countdown }: FlashBannerProps) {
  const getTimeLeft = () => {
    if (!countdown) return null
    const diff = Math.max(0, new Date(countdown).getTime() - Date.now())
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }

  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    if (!countdown) return
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  if (!enabled) return null

  const pad = (n: number) => n.toString().padStart(2, '0')

  const inner = (
    <div
      className="text-white text-[13px] font-semibold py-2.5 px-4 flex items-center justify-center gap-3 overflow-hidden cursor-pointer"
      style={{ backgroundColor: color }}
    >
      <span className="text-base">{icon}</span>
      <span className="font-bold">{text}</span>
      {promoCode && (
        <span className="font-mono bg-white/25 px-2 py-0.5 rounded text-[12px] font-black tracking-wide">
          {promoCode}
        </span>
      )}
      {timeLeft && (
        <span className="hidden sm:flex items-center gap-2 ml-1">
          <span className="text-white/80 font-semibold text-[11px] uppercase tracking-wider">ENDS IN</span>
          <div className="flex items-center gap-1">
            {[timeLeft.h, timeLeft.m, timeLeft.s].map((val, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="bg-black/30 rounded-md px-2 py-0.5 font-mono text-[14px] font-black tabular-nums">
                  {pad(val)}
                </span>
                {i < 2 && <span className="font-black text-white/60">:</span>}
              </span>
            ))}
          </div>
        </span>
      )}
    </div>
  )

  return link ? <Link href={link}>{inner}</Link> : inner
}
