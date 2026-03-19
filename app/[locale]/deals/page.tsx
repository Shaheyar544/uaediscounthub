import { createAdminClient } from '@/utils/supabase/admin'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Tag, ShoppingBag, ChevronRight } from 'lucide-react'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Best Deals in UAE | UAEDiscountHub',
  description: 'Shop the best deals and discounts in UAE. Lightning deals, coupon offers, and exclusive price drops on top tech products.',
}

interface Deal {
  id: string
  title_en: string | null
  image_url: string | null
  deal_price: number | null
  final_price: number | null
  original_price: number | null
  discount_percent: number | null
  coupon_value: string | null
  coupon_type: string | null
  affiliate_url: string | null
  expires_at: string | null
  source: string | null
  is_active: boolean
  asin: string | null
  products: {
    name_en: string | null
    slug: string | null
    image_url: string | null
    thumbnail_url: string | null
  } | null
  stores: {
    name: string | null
    logo_url: string | null
  } | null
}

// ── Filter config ─────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all',       label: 'All Deals',     icon: null },
  { key: 'coupon',    label: 'With Coupon',   icon: '🏷' },
  { key: 'lightning', label: 'Flash Deals',   icon: '⚡' },
  { key: 'amazon',    label: 'Amazon UAE',    icon: null },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DealsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ filter?: string; sort?: string }>
}) {
  const { locale } = await params
  const { filter = 'all', sort = 'discount' } = await searchParams

  const supabase = createAdminClient()

  let query = supabase
    .from('deals')
    .select(`
      id,
      title_en,
      image_url,
      deal_price,
      final_price,
      original_price,
      discount_percent,
      coupon_value,
      coupon_type,
      affiliate_url,
      expires_at,
      source,
      is_active,
      asin,
      products ( name_en, slug, image_url, thumbnail_url ),
      stores ( name, logo_url )
    `)
    .eq('is_active', true)
    .limit(60)

  // Filters
  if (filter === 'coupon') {
    query = query.not('coupon_value', 'is', null)
  } else if (filter === 'lightning') {
    query = query.not('expires_at', 'is', null)
  } else if (filter === 'amazon') {
    query = query.eq('source', 'amazon_deals')
  }

  // Sort
  if (sort === 'discount') {
    query = query.order('discount_percent', { ascending: false, nullsFirst: false })
  } else if (sort === 'price_asc') {
    query = query.order('deal_price', { ascending: true, nullsFirst: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: deals } = await query
  const dealList = (deals ?? []) as unknown as Deal[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#8A94A6] mb-2">
          <Link href={`/${locale}`} className="hover:text-[#0057FF]">Home</Link>
          <ChevronRight size={14} />
          <span className="text-[#0D1117] font-semibold">Deals</span>
        </div>
        <h1 className="text-[28px] font-black text-[#0D1117] leading-tight">
          Best Deals in UAE 🔥
        </h1>
        <p className="text-[#8A94A6] text-sm mt-1">
          {dealList.length > 0
            ? `${dealList.length} active deal${dealList.length !== 1 ? 's' : ''} — updated daily`
            : 'Check back soon for the best deals in UAE'}
        </p>
      </div>

      {/* Filter + Sort bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <Link
                key={f.key}
                href={`/${locale}/deals?filter=${f.key}${sort !== 'discount' ? `&sort=${sort}` : ''}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold border-[1.5px] transition-colors"
                style={{
                  borderColor: active ? '#0057FF' : '#DDE3EF',
                  background: active ? '#EBF1FF' : '#fff',
                  color: active ? '#0057FF' : '#8A94A6',
                }}
              >
                {f.icon && <span>{f.icon}</span>}
                {f.label}
              </Link>
            )
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[#8A94A6] font-semibold">Sort:</span>
          {[
            { key: 'discount', label: 'Biggest Discount' },
            { key: 'price_asc', label: 'Lowest Price' },
            { key: 'newest', label: 'Newest' },
          ].map((s) => (
            <Link
              key={s.key}
              href={`/${locale}/deals?filter=${filter}&sort=${s.key}`}
              className="px-3 py-1.5 rounded-lg border-[1.5px] font-semibold transition-colors"
              style={{
                borderColor: sort === s.key ? '#0057FF' : '#DDE3EF',
                background: sort === s.key ? '#EBF1FF' : '#fff',
                color: sort === s.key ? '#0057FF' : '#8A94A6',
              }}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Deals Grid */}
      {dealList.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🏷️</div>
          <h2 className="text-xl font-bold text-[#0D1117] mb-2">No deals found</h2>
          <p className="text-[#8A94A6] text-sm">Try a different filter or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {dealList.map((deal) => (
            <DealCard key={deal.id} deal={deal} locale={locale} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Deal Card ─────────────────────────────────────────────────────────────────

function DealCard({ deal, locale }: { deal: Deal; locale: string }) {
  const title = deal.title_en || deal.products?.name_en || 'Deal'
  const image = deal.image_url || deal.products?.thumbnail_url || deal.products?.image_url || null
  const price = deal.final_price ?? deal.deal_price
  const originalPrice = deal.original_price
  const discount = deal.discount_percent
  const slug = deal.products?.slug
  const href = slug
    ? `/${locale}/product/${slug}`
    : (deal.affiliate_url || '#')
  const isExternal = !slug

  const isExpiringSoon = deal.expires_at
    ? new Date(deal.expires_at).getTime() - Date.now() < 6 * 60 * 60 * 1000
    : false

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="group flex flex-col bg-white rounded-2xl border-[1.5px] border-[#DDE3EF] overflow-hidden hover:border-[#0057FF] hover:shadow-[0_4px_20px_rgba(0,87,255,0.12)] transition-all duration-200"
    >
      {/* Discount badge */}
      {discount && discount > 0 && (
        <div className="absolute" style={{ position: 'relative' }}>
          <div
            className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black text-white"
            style={{ background: discount >= 50 ? '#EF4444' : '#FF6B00' }}
          >
            <Tag size={8} />
            -{discount}%
          </div>
        </div>
      )}

      {/* Image */}
      <div className="relative bg-[#F6F8FC] aspect-square flex items-center justify-center p-3 overflow-hidden">
        {discount && discount > 0 && (
          <span
            className="absolute top-2 left-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black text-white"
            style={{ background: discount >= 50 ? '#EF4444' : '#FF6B00' }}
          >
            <Tag size={7} />
            -{discount}%
          </span>
        )}

        {isExpiringSoon && (
          <span className="absolute top-2 right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white">
            <Zap size={7} />
            Ending Soon
          </span>
        )}

        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            width={200}
            height={200}
          />
        ) : (
          <ShoppingBag size={40} className="text-[#DDE3EF]" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <p className="text-[12px] font-semibold text-[#0D1117] leading-tight line-clamp-2 flex-1">
          {title}
        </p>

        {/* Pricing */}
        <div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {price != null && (
              <span className="text-[16px] font-black text-[#0057FF]">
                AED {price.toLocaleString()}
              </span>
            )}
            {originalPrice != null && originalPrice > (price ?? 0) && (
              <span className="text-[11px] text-[#8A94A6] line-through">
                AED {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Coupon badge */}
        {deal.coupon_value && (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#E8F8F0] rounded-lg">
            <span className="text-[9px]">🏷</span>
            <span className="text-[10px] font-bold text-[#00A862]">
              Extra {deal.coupon_value} off with coupon
            </span>
          </div>
        )}

        {/* CTA */}
        <span className="mt-auto w-full py-2 text-center bg-[#0057FF] text-white text-[11px] font-bold rounded-lg group-hover:bg-[#0047DD] transition-colors">
          {isExternal ? 'Avail Offer Now →' : 'View Deal →'}
        </span>
      </div>
    </a>
  )
}
