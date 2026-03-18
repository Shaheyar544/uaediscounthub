'use client'

import { CopyButton } from './CopyButton'

interface PriceEntry {
  store: string
  storeLogoUrl?: string
  price: number
  originalPrice: number
  discount: number
  affiliateUrl: string
  couponCode?: string
  couponDiscount?: string
}

interface CouponSectionProps {
  prices: PriceEntry[]
  teaserOnly?: boolean   // when true, renders only the above-the-fold teaser strip
}

export function CouponSection({ prices, teaserOnly }: CouponSectionProps) {
  const coupons = prices.filter(p => p.couponCode)
  if (coupons.length === 0) return null

  const scrollToCoupons = () => {
    document.getElementById('coupons-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  // FIX 7A: Only the teaser strip (used near the price area)
  if (teaserOnly) {
    return (
      <div
        onClick={scrollToCoupons}
        className="flex items-center gap-3 mt-1 mb-4 p-3 bg-amber-50 border border-dashed border-amber-300 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
      >
        <span className="text-xl shrink-0">🏷️</span>
        <div className="flex-1 min-w-0">
          <span className="text-amber-700 font-bold text-[13px]">Exclusive coupon available!</span>
          <span className="text-amber-600 text-[11px] ml-1.5">Save extra on this product</span>
        </div>
        <span className="text-amber-500 text-[11px] font-bold shrink-0">See code ↓</span>
      </div>
    )
  }

  return (
    <>
      {/* FIX 7B: Full redesigned coupon section */}
      <section id="coupons-section" className="mb-16 scroll-mt-20">
        <h2 className="text-[18px] font-bold text-foreground mb-4 flex items-center gap-2.5">
          🏷️ Exclusive Coupon Codes
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Limited Time
          </span>
        </h2>

        <div className="space-y-3">
          {coupons.map((c, i) => (
            <div
              key={i}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl p-4 hover:shadow-md transition-all"
            >
              {/* Store info row */}
              <div className="flex items-center gap-2.5 mb-3">
                {c.storeLogoUrl ? (
                  <img
                    src={c.storeLogoUrl}
                    alt={c.store}
                    className="w-9 h-9 object-contain rounded-lg border border-[#DDE3EF] bg-white p-1 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg border border-[#DDE3EF] bg-white flex items-center justify-center text-[#0057FF] font-extrabold text-[15px] shrink-0">
                    {c.store[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] text-foreground">{c.store}</div>
                  {c.couponDiscount && (
                    <div className="text-[11px] text-amber-600 font-medium">{c.couponDiscount}</div>
                  )}
                </div>
                {c.discount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shrink-0">
                    -{c.discount}% OFF
                  </span>
                )}
              </div>

              {/* Coupon code box + copy button */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-white border-2 border-dashed border-amber-400 rounded-xl px-4 py-3 text-center">
                  <span className="font-mono font-extrabold text-[20px] text-amber-700 tracking-[0.3em] select-all">
                    {c.couponCode}
                  </span>
                </div>
                <CopyButton code={c.couponCode!} />
              </div>

              {/* Go to store CTA */}
              <a
                href={c.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-[13px] transition-colors"
              >
                Use Code at {c.store} →
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

