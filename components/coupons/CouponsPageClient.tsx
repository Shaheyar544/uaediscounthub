'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  Settings,
  X,
  ChevronDown,
  Filter,
  Check,
  TrendingUp,
  Tag,
} from 'lucide-react'
import Image from 'next/image'
import { CouponCardV2 } from './CouponCardV2'
import { StoreHeaderBanner } from './StoreHeaderBanner'
import { useId } from 'react'

type Coupon = {
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
  stores: {
    id: string
    slug: string
    name: string
    logo_url?: string | null
    affiliate_base_url?: string | null
    base_url?: string | null
  }
}

type Store = {
  id: string
  slug: string
  name: string
  logo_url?: string | null
}

interface CouponsPageClientProps {
  coupons: Coupon[]
  stores: Store[]
  storeTrustMap: Record<string, number>
  locale: string
  focusedStore?: {
    id: string
    slug: string
    name: string
    logo_url?: string | null
    base_url?: string | null
    affiliate_base_url?: string | null
  } | null
}

type FilterState = {
  search: string
  storeId: string | null
  verified: boolean
  exclusive: boolean
  discountType: 'all' | 'percent' | 'fixed'
  sort: 'popular' | 'newest' | 'discount'
}

const SESSION_ID =
  typeof window !== 'undefined'
    ? (sessionStorage.getItem('uid') ?? (() => {
        const id = Math.random().toString(36).slice(2)
        sessionStorage.setItem('uid', id)
        return id
      })())
    : 'ssr'

export function CouponsPageClient({
  coupons,
  stores,
  storeTrustMap,
  locale,
  focusedStore,
}: CouponsPageClientProps) {
  const filterId = useId()

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    storeId: focusedStore?.id ?? null,
    verified: false,
    exclusive: false,
    discountType: 'all',
    sort: 'popular',
  })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, val: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: val }))
    },
    []
  )

  // ── Filtered & sorted coupon list ───────────────────────
  const filtered = useMemo(() => {
    let list = [...coupons]

    if (filters.storeId) {
      list = list.filter((c) => c.stores?.id === filters.storeId)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (c) =>
          c.title_en.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.stores?.name.toLowerCase().includes(q)
      )
    }
    if (filters.verified) list = list.filter((c) => c.is_verified)
    if (filters.exclusive) list = list.filter((c) => c.is_exclusive)
    if (filters.discountType !== 'all') {
      list = list.filter((c) => c.discount_type === filters.discountType)
    }

    // Sort
    switch (filters.sort) {
      case 'popular':
        list.sort((a, b) => (b.click_count ?? 0) - (a.click_count ?? 0))
        break
      case 'newest':
        list.sort(
          (a, b) =>
            new Date(b.stores?.id ?? 0).getTime() -
            new Date(a.stores?.id ?? 0).getTime()
        )
        break
      case 'discount':
        list.sort((a, b) => {
          const aVal =
            a.discount_type === 'percent' ? a.discount_value : a.discount_value * 0.5
          const bVal =
            b.discount_type === 'percent' ? b.discount_value : b.discount_value * 0.5
          return bVal - aVal
        })
        break
    }

    return list
  }, [coupons, filters])

  // ── Compute trust for focused store or aggregate ────────
  const focusedTrust = focusedStore
    ? storeTrustMap[focusedStore.id] ?? 0
    : null

  const focusedVerifiedCount = focusedStore
    ? coupons.filter(
        (c) => c.stores?.id === focusedStore.id && c.is_verified
      ).length
    : 0

  // ── Active filter chips ──────────────────────────────────
  const activeFilters: { label: string; clear: () => void }[] = []
  if (filters.search)
    activeFilters.push({
      label: `"${filters.search}"`,
      clear: () => updateFilter('search', ''),
    })
  if (filters.verified)
    activeFilters.push({
      label: 'Verified only',
      clear: () => updateFilter('verified', false),
    })
  if (filters.exclusive)
    activeFilters.push({
      label: 'Exclusive',
      clear: () => updateFilter('exclusive', false),
    })
  if (filters.discountType !== 'all')
    activeFilters.push({
      label: filters.discountType === 'percent' ? '% Discount' : 'AED Off',
      clear: () => updateFilter('discountType', 'all'),
    })
  if (filters.storeId && !focusedStore) {
    const storeName = stores.find((s) => s.id === filters.storeId)?.name
    if (storeName)
      activeFilters.push({
        label: storeName,
        clear: () => updateFilter('storeId', null),
      })
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10 space-y-8">

      {/* ── Store Header Banner (only on store-specific pages) ── */}
      {focusedStore && (
        <StoreHeaderBanner
          store={focusedStore}
          trustScore={focusedTrust ?? 0}
          totalCoupons={
            coupons.filter((c) => c.stores?.id === focusedStore.id).length
          }
          verifiedCount={focusedVerifiedCount}
        />
      )}

      {/* ── Page title (all-coupons page) ───────────────────── */}
      {!focusedStore && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FF6B00]/10 rounded-xl">
              <Tag className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-display">
                UAE Coupon Codes & Promo Codes
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {coupons.length} active codes · Verified daily across{' '}
                {stores.length} major stores
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Store filter pills ───────────────────────────────── */}
      {!focusedStore && stores.length > 0 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
          <button
            onClick={() => updateFilter('storeId', null)}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold border transition-all duration-200 ${
              !filters.storeId
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            All Stores
          </button>

          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() =>
                updateFilter(
                  'storeId',
                  filters.storeId === store.id ? null : store.id
                )
              }
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold border transition-all duration-200 ${
                filters.storeId === store.id
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {store.logo_url && (
                <Image
                  src={store.logo_url}
                  alt={store.name}
                  width={16}
                  height={16}
                  className="h-4 w-auto object-contain rounded-sm"
                  unoptimized
                />
              )}
              {store.name}
              {storeTrustMap[store.id] !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    filters.storeId === store.id
                      ? 'bg-white/20 text-white'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {storeTrustMap[store.id]}%
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Search + filter bar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search coupon codes, stores..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl text-[14px] font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex items-center gap-2 h-11 px-4 rounded-xl border font-semibold text-[13px] transition-all ${
            filtersOpen || activeFilters.length > 0
              ? 'bg-primary text-white border-primary'
              : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilters.length > 0 && (
            <span className="w-5 h-5 bg-white/25 rounded-full text-[11px] font-bold flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value as FilterState['sort'])}
          className="h-11 px-3 pr-8 bg-card border border-border rounded-xl text-[13px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest First</option>
          <option value="discount">Highest Discount</option>
        </select>
      </div>

      {/* ── Expanded Filter Panel ──────────────────────────── */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border border-border rounded-xl bg-card/50"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Verified Filter */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                  Verification Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All Coupons', val: false },
                    { label: 'Verified Only', val: true },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => updateFilter('verified', opt.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        filters.verified === opt.val
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Type */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Discount Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All', val: 'all' },
                    { label: 'Percentage', val: 'percent' },
                    { label: 'Fixed Amount', val: 'fixed' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => updateFilter('discountType', opt.val as 'all' | 'percent' | 'fixed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        filters.discountType === opt.val
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exclusive Filter */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Availability
                </label>
                <div className="flex flex-wrap gap-2">
                   {[
                    { label: 'All Offers', val: false },
                    { label: 'Exclusive Only', val: true },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => updateFilter('exclusive', opt.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        filters.exclusive === opt.val
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active filter chips ──────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((f, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold bg-primary/10 text-primary border border-primary/25 px-3 py-1 rounded-full"
            >
              {f.label}
              <button onClick={f.clear}>
                <X className="w-3 h-3 hover:text-primary-dim" />
              </button>
            </motion.span>
          ))}

          <button
            onClick={() =>
              setFilters({
                search: '',
                storeId: focusedStore?.id ?? null,
                verified: false,
                exclusive: false,
                discountType: 'all',
                sort: 'popular',
              })
            }
            className="text-[12px] font-semibold text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Results count ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground font-medium">
          Showing{' '}
          <span className="font-bold text-foreground">{filtered.length}</span>{' '}
          coupon{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Coupon grid ──────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filtered.map((coupon, idx) => (
              <motion.div
                key={coupon.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(idx * 0.04, 0.3),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <CouponCardV2
                  id={coupon.id}
                  code={coupon.code}
                  title_en={coupon.title_en}
                  description_en={coupon.description_en}
                  discount_type={coupon.discount_type}
                  discount_value={coupon.discount_value}
                  min_order_value={coupon.min_order_value}
                  max_uses={coupon.max_uses}
                  current_uses={coupon.current_uses}
                  is_verified={coupon.is_verified}
                  is_exclusive={coupon.is_exclusive}
                  expires_at={coupon.expires_at}
                  click_count={coupon.click_count}
                  store={coupon.stores}
                  sessionId={SESSION_ID}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center text-center gap-4 border border-dashed border-border rounded-2xl bg-muted/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Tag className="w-6 h-6 text-primary/50" />
            </div>
            <div>
              <p className="font-bold text-foreground">No coupons found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or search term
              </p>
            </div>
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  storeId: focusedStore?.id ?? null,
                  verified: false,
                  exclusive: false,
                  discountType: 'all',
                  sort: 'popular',
                })
              }
              className="text-sm font-semibold text-primary hover:underline"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
