import { createClient } from '@/utils/supabase/server'
import { CouponsPageClient } from '@/components/coupons/CouponsPageClient'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 900 // 15-min ISR

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>
}): Promise<Metadata> {
  const { storeSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('name')
    .eq('slug', storeSlug)
    .single()

  if (!store) return { title: 'Store Not Found' }

  return {
    title: `${store.name} Coupon Codes & Promo Codes 2025 | UAE Discount Hub`,
    description: `Save with verified ${store.name} promo codes and deals. Updated daily. Copy and use instantly in the UAE.`,
  }
}

export default async function StoreCouponsPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>
}) {
  const { locale, storeSlug } = await params
  const supabase = await createClient()

  // ── Fetch the focused store ────────────────────────────────
  const { data: store } = await supabase
    .from('stores')
    .select('id, slug, name, logo_url, base_url, affiliate_base_url')
    .eq('slug', storeSlug)
    .single()

  if (!store) notFound()

  // ── Fetch active coupons for THIS store ────────────────────
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
    .eq('store_id', store.id)
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .order('click_count', { ascending: false })
    .order('created_at', { ascending: false })

  // ── Fetch ALL stores for filter bar (UX consistency) ────────
  const { data: stores } = await supabase
    .from('stores')
    .select('id, slug, name, logo_url')
    .eq('is_active', true)
    .order('name')

  // ── Compute trust score for this store ─────────────────────
  const storeTrustMap: Record<string, number> = {}
  if (coupons && coupons.length > 0) {
    const total = coupons.length
    const verified = coupons.filter((c: any) => c.is_verified).length
    storeTrustMap[store.id] = Math.round((verified / total) * 100)
  } else {
    storeTrustMap[store.id] = 0
  }

  return (
    <CouponsPageClient
      coupons={(coupons as any[]) ?? []}
      stores={(stores as any[]) ?? []}
      storeTrustMap={storeTrustMap}
      locale={locale}
      focusedStore={store}
    />
  )
}
