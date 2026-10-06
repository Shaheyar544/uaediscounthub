import { createClient } from '@/utils/supabase/server'
import type { Metadata } from 'next'
import { DealsCatalog, type PublicDeal } from '@/components/deals/DealsCatalog'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Today\'s Best Deals in UAE | UAEDiscountHub',
    description: 'Discover live UAE product deals, current prices, previous prices, and verified savings from trusted retailers.',
    alternates: { canonical: `/${locale}/deals` },
  }
}

function asNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

export default async function DealsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('deals')
    .select(`
      id, title_en, image_url, deal_price, final_price, original_price, discount_percent,
      affiliate_url, expires_at, starts_at, created_at, is_active,
      products ( name_en, slug, image_url, thumbnail_url, categories ( id, name_en, slug ) ),
      stores ( id, name, logo_url )
    `)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .order('created_at', { ascending: false })
    .limit(120)

  const deals: PublicDeal[] = ((data ?? []) as any[]).map((deal) => {
    const product = first(deal.products)
    const store = first(deal.stores)
    const category = first(product?.categories)
    return {
      id: deal.id,
      title: deal.title_en ?? product?.name_en ?? 'Untitled deal',
      imageUrl: deal.image_url ?? product?.image_url ?? product?.thumbnail_url ?? null,
      currentPrice: asNumber(deal.final_price) ?? asNumber(deal.deal_price),
      originalPrice: asNumber(deal.original_price),
      discountPercent: asNumber(deal.discount_percent),
      affiliateUrl: deal.affiliate_url ?? null,
      expiresAt: deal.expires_at ?? null,
      createdAt: deal.created_at ?? null,
      productSlug: product?.slug ?? null,
      retailer: store ? { id: store.id, name: store.name ?? 'Retailer', logoUrl: store.logo_url ?? null } : null,
      category: category ? { id: category.id, name: category.name_en ?? 'Other', slug: category.slug ?? null } : null,
    }
  })

  return <DealsCatalog locale={locale} deals={deals} errorMessage={error ? 'Deals are temporarily unavailable. Please try again shortly.' : null} />
}
