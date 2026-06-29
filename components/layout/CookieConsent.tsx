'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

interface CookieConsentProps {
  locale?: string
}

export function CookieConsent({ locale = 'en' }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false)
  const isAr = locale === 'ar'

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('udh_cookie_consent')
    if (!consent) {
      // Show the banner with a slight delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('udh_cookie_consent', 'accepted')
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem('udh_cookie_consent', 'declined')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        dir={isAr ? 'rtl' : 'ltr'}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[100] p-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col gap-4"
      >
        <button
          onClick={handleDecline}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-3 items-start">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
            <Cookie className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">
              {isAr ? '🍪 تفضيلات ملفات تعريف الارتباط' : '🍪 Cookie Consent'}
            </h4>
            <p className="text-[12px] md:text-[13px] leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
              {isAr
                ? 'نحن نستخدم ملفات تعريف الارتباط لتخصيص المحتوى والإعلانات وتحليل حركة المرور لدينا بما يتماشى مع قوانين الخصوصية في الاتحاد الأوروبي ودول الخليج العربي.'
                : 'We use cookies to personalize content, customize advertising, and analyze traffic in compliance with EU GDPR and GCC Privacy Laws.'}{' '}
              <Link
                href={`/${locale}/cookie-policy`}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                {isAr ? 'اقرأ سياسة ملفات الارتباط' : 'Read Cookie Policy'}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 items-center justify-end mt-1">
          <button
            onClick={handleDecline}
            className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
          >
            {isAr ? 'رفض الكل' : 'Decline'}
          </button>
          <button
            onClick={handleAccept}
            className="text-[11px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {isAr ? 'قبول الكل' : 'Accept All'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
