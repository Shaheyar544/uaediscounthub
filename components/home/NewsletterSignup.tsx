'use client'

import { motion } from 'framer-motion'
import { useState, useTransition } from 'react'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { subscribeToNewsletter } from '@/app/actions/newsletter'
import { useHasMounted } from '@/hooks/use-has-mounted'

const BENEFITS = [
  '✅ Daily Deal Digest',
  '⚡ Instant Price Alerts',
  '🏷️ Exclusive Coupons',
  '🚫 No Spam, Ever',
]

export function NewsletterSignup() {
  const [email, setEmail]       = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const hasMounted = useHasMounted()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('email', email)
    startTransition(async () => {
      const result = await subscribeToNewsletter(formData)
      if (result.success) setSubmitted(true)
      else alert(result.error)
    })
  }

  return (
    <section id="newsletter" className="py-16 px-4 relative overflow-hidden bg-[#0A0F1E] rounded-[28px]">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/30 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <div className="text-6xl mb-4 animate-float">🔔</div>

        {/* Subscriber badge */}
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-blue-300 text-sm font-bold">50,000+ Smart Shoppers Already Subscribed</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
          Never Miss a
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> Price Drop</span>
          {' '}🎯
        </h2>

        <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
          Get the hottest UAE tech deals, exclusive coupon codes, and instant price drop alerts delivered to your inbox.
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {BENEFITS.map(b => (
            <span key={b} className="bg-white/10 text-white/80 text-sm px-3 py-1.5 rounded-full border border-white/10">
              {b}
            </span>
          ))}
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={`flex-1 px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 text-[16px] transition-colors ${!hasMounted ? 'opacity-0' : 'opacity-100'}`}
            />
            <button
              type="submit"
              disabled={isPending}
              className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black px-6 py-4 rounded-xl transition-all hover:scale-105 whitespace-nowrap shadow-lg shadow-blue-500/30 ${!hasMounted ? 'invisible' : 'visible'}`}
            >
              {isPending ? 'Joining...' : 'Get Best Deals 🚀'}
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl inline-flex flex-col items-center gap-2"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400" />
            <h4 className="text-[18px] font-bold text-white">You&apos;re in the loop!</h4>
            <p className="text-[14px] text-white/60 text-center">We&apos;ll notify you when the biggest price drops happen.</p>
          </motion.div>
        )}

        <p className="text-white/30 text-xs mt-4">
          No spam. Unsubscribe anytime. 50,000+ subscribers trust us.
        </p>

        <div className="flex justify-center gap-6 mt-4 opacity-40">
          <div className="flex items-center gap-2 text-[12px] text-white font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> No Spam, ever
          </div>
          <div className="text-[12px] text-white font-medium">1-Click Unsubscribe</div>
        </div>
      </div>
    </section>
  )
}
