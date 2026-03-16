import { createClient } from '@/utils/supabase/server'
import { CouponsPageClient } from '@/components/coupons/CouponsPageClient'
import { Metadata } from 'next'

export const revalidate = 900 // 15-min ISR

export const metadata: Metadata = {
  title: 'UAE Coupon Codes & Promo Codes 2025 | UAE Discount Hub',
  description:
    'Find verified coupon codes for Amazon UAE, Noon, Sharaf DG, Carrefour & more. Updated daily. Copy & save instantly.',
  openGraph: {
    title: 'UAE Coupon Codes & Promo Codes 2025',
    description: "Verified promo codes for UAE's top stores — updated daily.",
    type: 'website',
  },
}

export default async function CouponsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  // ── Fetch active coupons with store info ──────────────────
  const { data: coupons } = await supabase
    .from('coupons')
    .select(
      `
      id, code, title_en, title_ar, description_en,
      discount_type, discount_value, min_order_value,
      max_uses, current_uses, is_verified, is_exclusive,
      expires_at, click_count, created_at,
      stores (
        id, slug, name, logo_url, base_url, affiliate_base_url
      )
    `
    )
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .order('click_count', { ascending: false })
    .order('created_at', { ascending: false })

  // ── Fetch stores for filter bar ───────────────────────────
  const { data: stores } = await supabase
    .from('stores')
    .select('id, slug, name, logo_url')
    .eq('is_active', true)
    .order('name')

  // ── Compute trust score per store (% verified) ────────────
  const storeTrustMap: Record<string, number> = {}
  if (coupons) {
    const storeGroups: Record<string, { total: number; verified: number }> = {}
    coupons.forEach((c: any) => {
      const sid = c.stores?.id
      if (!sid) return
      if (!storeGroups[sid]) storeGroups[sid] = { total: 0, verified: 0 }
      storeGroups[sid].total++
      if (c.is_verified) storeGroups[sid].verified++
    })
    Object.entries(storeGroups).forEach(([sid, g]) => {
      storeTrustMap[sid] =
        g.total > 0 ? Math.round((g.verified / g.total) * 100) : 0
    })
  }

  return (
    <CouponsPageClient
      coupons={(coupons as any[]) ?? []}
      stores={(stores as any[]) ?? []}
      storeTrustMap={storeTrustMap}
      locale={locale}
    />
  )
}
