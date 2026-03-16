'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy,
  Check,
  Shield,
  ShieldCheck,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Zap,
  Star,
  ExternalLink,
  Tag,
} from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow, isPast } from 'date-fns'

interface CouponCardV2Props {
  id: string
  code: string
  title_en: string
  description_en?: string | null
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order_value?: number | null
  max_uses?: number | null
  current_uses?: number
  is_verified: boolean
  is_exclusive: boolean
  expires_at?: string | null
  click_count: number
  store: {
    id: string
    slug: string
    name: string
    logo_url?: string | null
    affiliate_base_url?: string | null
    base_url?: string | null
  }
  // session identifier for tracking
  sessionId?: string
}

export function CouponCardV2({
  id,
  code,
  title_en,
  description_en,
  discount_type,
  discount_value,
  min_order_value,
  max_uses,
  current_uses = 0,
  is_verified,
  is_exclusive,
  expires_at,
  click_count,
  store,
  sessionId,
}: CouponCardV2Props) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState<null | boolean>(null)
  const trackingFired = useRef(false)

  // ── Derived display values ───────────────────────────────
  const discountLabel =
    discount_type === 'percent'
      ? `${discount_value}% OFF`
      : `AED ${discount_value} OFF`

  const isExpired = expires_at ? isPast(new Date(expires_at)) : false
  const expiryLabel = expires_at
    ? isExpired
      ? 'Expired'
      : `Expires ${formatDistanceToNow(new Date(expires_at), { addSuffix: true })}`
    : null

  const useCount = click_count + current_uses
  const usedLabel =
    useCount > 0
      ? useCount > 1000
        ? `${(useCount / 1000).toFixed(1)}k used`
        : `${useCount} used`
      : 'Be the first to use'

  // ── Reveal & Copy interaction ────────────────────────────
  const handleReveal = async () => {
    if (isExpired) return

    // 1. Reveal the code
    setRevealed(true)

    // 2. Copy to clipboard
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Clipboard API blocked in some browsers — user can still see the code
    }

    // 3. Track click & get redirect URL (only once per mount)
    if (!trackingFired.current) {
      trackingFired.current = true
      try {
        const res = await fetch('/api/coupons/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupon_id: id,
            store_id: store.id,
            session_id: sessionId,
          }),
        })
        const data = await res.json()

        // 4. Pop-under: open affiliate URL in new tab
        if (data.redirect_url) {
          const newTab = window.open(data.redirect_url, '_blank', 'noopener,noreferrer')
          // If popup blocked, fallback link is shown in the card
          if (!newTab) {
            console.warn('[coupon] Popup blocked — fallback link visible')
          }
        }
      } catch {
        // Track failure silently — UX not affected
      }
    }
  }

  // ── Community feedback ───────────────────────────────────
  const sendFeedback = async (worked: boolean) => {
    if (feedbackSent !== null) return
    setFeedbackSent(worked)
    try {
      await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_id: id, worked }),
      })
    } catch {
      // silent
    }
  }

  // ── Terms content derived from description ───────────────
  const termLines = description_en
    ? description_en.split('.').filter(Boolean).map((s) => s.trim() + '.')
    : []
  if (min_order_value) termLines.unshift(`Minimum order value: AED ${min_order_value}`)
  if (max_uses) termLines.push(`Limited to ${max_uses} total uses.`)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={`
        coupon-card-v2 group relative bg-white dark:bg-[#111318]
        border rounded-2xl overflow-hidden
        transition-all duration-300
        ${isExpired
          ? 'border-border/50 opacity-60'
          : 'border-border hover:border-primary/30 hover:shadow-[0_8px_40px_-12px_rgba(10,132,255,0.18)]'
        }
      `}
    >
      {/* ── Exclusive badge ribbon ─────────────────────────── */}
      {is_exclusive && !isExpired && (
        <div className="absolute top-3.5 right-3.5 z-10">
          <span className="inline-flex items-center gap-1 bg-[#FF6B00] text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm">
            <Zap className="w-2.5 h-2.5 fill-white" />
            Exclusive
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
        {/* ── Store header ──────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-secondary rounded-xl border border-border flex items-center justify-center shrink-0 overflow-hidden">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={store.name}
                width={36}
                height={36}
                className="object-contain"
                unoptimized
              />
            ) : (
              <Tag className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.07em] truncate">
              {store.name}
            </p>
            <h3 className="text-[14.5px] font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {title_en}
            </h3>
          </div>
        </div>

        {/* ── Discount value + trust badge ──────────────────── */}
        <div className="flex items-center justify-between">
          <div className="text-[28px] font-extrabold tracking-tight text-[#0A84FF] font-display leading-none">
            {discountLabel}
          </div>

          <div className="flex items-center gap-1.5">
            {is_verified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00C875] bg-[#00C875]/10 border border-[#00C875]/25 px-2 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                Unverified
              </span>
            )}
          </div>
        </div>

        {/* ── Reveal / Code area ────────────────────────────── */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {!revealed ? (
              <motion.button
                key="reveal-btn"
                onClick={handleReveal}
                disabled={isExpired}
                whileHover={{ scale: isExpired ? 1 : 1.01 }}
                whileTap={{ scale: isExpired ? 1 : 0.98 }}
                className={`
                  w-full h-[52px] rounded-xl font-body text-[14px] font-extrabold
                  tracking-wide transition-all duration-200 relative overflow-hidden
                  ${isExpired
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : 'bg-[#0A84FF] text-white hover:bg-[#0060CC] shadow-[0_4px_20px_-6px_rgba(10,132,255,0.5)] hover:shadow-[0_6px_24px_-6px_rgba(10,132,255,0.6)]'
                  }
                `}
              >
                {/* shimmer sweep animation */}
                {!isExpired && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {isExpired ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Code Expired
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4" />
                      Show Coupon Code
                    </>
                  )}
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="code-revealed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Code box */}
                <div className="flex items-center gap-2 bg-[#F0F7FF] dark:bg-[#0A84FF]/10 border-2 border-dashed border-[#0A84FF]/40 rounded-xl px-4 py-3">
                  <span className="flex-1 font-mono text-[18px] font-extrabold text-[#0A84FF] tracking-widest select-all">
                    {code}
                  </span>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={async () => {
                      await navigator.clipboard.writeText(code)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 3000)
                    }}
                    className="flex items-center gap-1.5 bg-[#0A84FF] text-white text-[12px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#0060CC] transition-colors shrink-0"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.span
                          key="done"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          className="flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          className="flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>

                {/* Affiliate fallback link */}
                {(store.affiliate_base_url || store.base_url) && (
                  <a
                    href={store.affiliate_base_url ?? store.base_url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Go to {store.name} →
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Terms & Conditions collapsible ────────────────── */}
        {termLines.length > 0 && (
          <div className="border-t border-border/60 pt-3">
            <button
              onClick={() => setTermsOpen(!termsOpen)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {termsOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              Terms & Conditions
            </button>

            <AnimatePresence>
              {termsOpen && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-2 space-y-1"
                >
                  {termLines.map((line, i) => (
                    <li
                      key={i}
                      className="text-[12px] text-muted-foreground leading-relaxed pl-3 border-l-2 border-border"
                    >
                      {line}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Social proof footer ───────────────────────────── */}
        <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5" />
              {usedLabel}
            </span>

            {is_verified && (
              <span className="flex items-center gap-1 font-medium text-[#00C875]">
                <Star className="w-3 h-3 fill-[#00C875]" />
                Verified today
              </span>
            )}
          </div>

          {expiryLabel && (
            <span
              className={`flex items-center gap-1 font-medium ${
                isExpired ? 'text-[#FF3B30]' : 'text-muted-foreground'
              }`}
            >
              <Clock className="w-3 h-3" />
              {expiryLabel}
            </span>
          )}
        </div>

        {/* ── Did it work? feedback (only after reveal) ──────── */}
        <AnimatePresence>
          {revealed && feedbackSent === null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: 0.8 }}
              className="border-t border-border/60 pt-3 flex items-center gap-2"
            >
              <span className="text-[12px] text-muted-foreground flex-1">
                Did it work?
              </span>
              <button
                onClick={() => sendFeedback(true)}
                className="text-[11px] font-bold text-[#00C875] hover:bg-[#00C875]/10 px-2.5 py-1 rounded-md transition-colors"
              >
                👍 Yes
              </button>
              <button
                onClick={() => sendFeedback(false)}
                className="text-[11px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10 px-2.5 py-1 rounded-md transition-colors"
              >
                👎 No
              </button>
            </motion.div>
          )}
          {revealed && feedbackSent !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-t border-border/60 pt-3 text-[12px] text-muted-foreground text-center"
            >
              {feedbackSent ? '✅ Thanks! Marked as working.' : '🔄 Sorry to hear that — we\'ll investigate.'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
