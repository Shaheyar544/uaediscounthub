'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Tag, TrendingUp, Zap } from 'lucide-react'
import Image from 'next/image'

interface StoreHeaderBannerProps {
  store: {
    id: string
    slug: string
    name: string
    logo_url?: string | null
    base_url?: string | null
  }
  trustScore: number
  totalCoupons: number
  verifiedCount: number
}

export function StoreHeaderBanner({
  store,
  trustScore,
  totalCoupons,
  verifiedCount,
}: StoreHeaderBannerProps) {
  const trustColor =
    trustScore >= 80
      ? '#00C875'
      : trustScore >= 60
      ? '#F5A623'
      : '#FF3B30'

  const trustLabel =
    trustScore >= 80
      ? 'Highly Reliable'
      : trustScore >= 60
      ? 'Mostly Works'
      : 'Low Verified Rate'

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl bg-[#0D1117] border border-white/8 px-8 py-8 mb-10"
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 0% 50%, ${trustColor}33, transparent 70%)`,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Logo */}
        <div className="w-16 h-16 bg-white rounded-2xl border border-white/10 flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
          {store.logo_url ? (
            <Image
              src={store.logo_url}
              alt={store.name}
              width={48}
              height={48}
              className="object-contain p-1"
              unoptimized
            />
          ) : (
            <Tag className="w-7 h-7 text-primary" />
          )}
        </div>

        {/* Store info */}
        <div className="flex-1">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.1em] mb-1">
            Official Coupon Hub
          </p>
          <h1 className="text-[26px] font-extrabold text-white font-display tracking-tight leading-tight">
            {store.name} Coupon Codes
          </h1>
          <p className="text-[13px] text-white/50 mt-1">
            {totalCoupons} active promo codes — updated regularly
          </p>
        </div>

        {/* Trust score pill */}
        <div className="shrink-0 flex flex-col items-center gap-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
          {/* Circular trust indicator */}
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="23"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <motion.circle
                cx="28"
                cy="28"
                r="23"
                fill="none"
                stroke={trustColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 23}`}
                strokeDashoffset={`${2 * Math.PI * 23 * (1 - trustScore / 100)}`}
                initial={{ strokeDashoffset: `${2 * Math.PI * 23}` }}
                animate={{
                  strokeDashoffset: `${2 * Math.PI * 23 * (1 - trustScore / 100)}`,
                }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-[13px] font-extrabold"
                style={{ color: trustColor }}
              >
                {trustScore}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide">
              Trust Score
            </p>
            <p
              className="text-[11px] font-bold"
              style={{ color: trustColor }}
            >
              {trustLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 mt-6 pt-5 border-t border-white/8 grid grid-cols-3 gap-4">
        {[
          {
            icon: <Tag className="w-3.5 h-3.5" />,
            value: totalCoupons,
            label: 'Active Codes',
            color: '#0A84FF',
          },
          {
            icon: <ShieldCheck className="w-3.5 h-3.5" />,
            value: verifiedCount,
            label: 'Verified Today',
            color: '#00C875',
          },
          {
            icon: <TrendingUp className="w-3.5 h-3.5" />,
            value: `${trustScore}%`,
            label: 'Success Rate',
            color: trustColor,
          },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${stat.color}1A`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div>
              <p
                className="text-[15px] font-extrabold leading-tight"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
