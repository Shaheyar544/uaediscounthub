"use client"

import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

export function FlashBanner() {
    const [timeLeft, setTimeLeft] = useState({ h: 4, m: 27, s: 51 })

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { h, m, s } = prev
                if (s > 0) s--
                else {
                    s = 59
                    if (m > 0) m--
                    else {
                        m = 59
                        if (h > 0) h--
                    }
                }
                return { h, m, s }
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="flash-banner bg-gradient-to-r from-[#0A84FF] via-[#0060CC] to-[#004499] text-white text-[13px] font-semibold py-2 px-5 flex items-center justify-center gap-2.5 overflow-hidden">
            <Zap className="w-4 h-4 text-white fill-current animate-pulse" />
            <span>⚡ Flash Sale — Up to 30% off Samsung S24 Ultra</span>
            <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-[12px]">NOON30</span>
            <span className="opacity-60 text-[11px] ml-1">Ends in</span>
            <div className="flex items-center gap-1">
                <div className="bg-white/20 rounded px-1.5 py-0.5 font-mono text-[13px] font-bold">
                    {timeLeft.h.toString().padStart(2, '0')}
                </div>
                <span className="opacity-70 font-bold">:</span>
                <div className="bg-white/20 rounded px-1.5 py-0.5 font-mono text-[13px] font-bold">
                    {timeLeft.m.toString().padStart(2, '0')}
                </div>
                <span className="opacity-70 font-bold">:</span>
                <div className="bg-white/20 rounded px-1.5 py-0.5 font-mono text-[13px] font-bold">
                    {timeLeft.s.toString().padStart(2, '0')}
                </div>
            </div>
        </div>
    )
}
