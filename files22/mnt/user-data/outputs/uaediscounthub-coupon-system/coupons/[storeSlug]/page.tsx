import { createClient } from '@/utils/supabase/server'
import { CouponsPageClient } from '@/components/coupons/CouponsPageClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 900

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

  return {
    title: `${store?.name ?? storeSlug} Coupon Codes 2025 | UAE Discount Hub`,
    description: `Verified ${store?.name} promo codes. Save on your next order — codes updated daily.`,
  }
}

export default async function StoreCouponsPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>
}) {
  const { locale, storeSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id, slug, name, logo_url, base_url, affiliate_base_url')
    .eq('slug', storeSlug)
    .single()

  if (!store) notFound()

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

  const { data: stores } = await supabase
    .from('stores')
    .select('id, slug, name, logo_url')
    .eq('is_active', true)
    .order('name')

  const verifiedCount = coupons?.filter((c: any) => c.is_verified).length ?? 0
  const total = coupons?.length ?? 0
  const trustScore =
    total > 0 ? Math.round((verifiedCount / total) * 100) : 0

  const storeTrustMap: Record<string, number> = {
    [store.id]: trustScore,
  }

  return (
    <CouponsPageClient
      coupons={(coupons as any[]) ?? []}
      stores={(stores as any[]) ?? []}
      storeTrustMap={storeTrustMap}
      locale={locale}
      focusedStore={store as any}
    />
  )
}
