'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowUpRight, ChevronRight, Clock3, PackageOpen, Search, SlidersHorizontal, Store, Zap } from 'lucide-react'

export type PublicDeal = {
  id: string
  title: string
  imageUrl: string | null
  currentPrice: number | null
  originalPrice: number | null
  discountPercent: number | null
  affiliateUrl: string | null
  expiresAt: string | null
  createdAt: string | null
  productSlug: string | null
  retailer: { id: string; name: string; logoUrl: string | null } | null
  category: { id: string; name: string; slug: string | null } | null
}

type Sort = 'recommended' | 'saving' | 'newest' | 'ending'
type PriceRange = 'all' | 'under-100' | '100-500' | '500-plus'

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 2 }).format(value)
}

function savings(deal: PublicDeal) {
  return deal.currentPrice !== null && deal.originalPrice !== null && deal.originalPrice > deal.currentPrice ? deal.originalPrice - deal.currentPrice : null
}

function discount(deal: PublicDeal) {
  if (deal.discountPercent !== null && deal.discountPercent > 0) return Math.round(deal.discountPercent)
  const saved = savings(deal)
  return saved !== null && deal.originalPrice ? Math.round((saved / deal.originalPrice) * 100) : null
}

function isEndingSoon(value: string | null) {
  if (!value) return false
  const remaining = new Date(value).getTime() - Date.now()
  return remaining > 0 && remaining <= 72 * 60 * 60 * 1000
}

function expiryText(value: string | null) {
  if (!value) return 'Limited-time offer'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Limited-time offer'
  return `Ends ${new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)}`
}

export function DealsCatalog({ locale, deals, errorMessage }: { locale: string; deals: PublicDeal[]; errorMessage: string | null }) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [retailerId, setRetailerId] = useState('all')
  const [priceRange, setPriceRange] = useState<PriceRange>('all')
  const [sort, setSort] = useState<Sort>('recommended')

  const categories = useMemo(() => Array.from(new Map(deals.filter((deal) => deal.category).map((deal) => [deal.category!.id, deal.category!])).values()), [deals])
  const retailers = useMemo(() => Array.from(new Map(deals.filter((deal) => deal.retailer).map((deal) => [deal.retailer!.id, deal.retailer!])).values()).sort((a, b) => a.name.localeCompare(b.name)), [deals])
  const endingSoonCount = deals.filter((deal) => isEndingSoon(deal.expiresAt)).length

  const visibleDeals = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return deals.filter((deal) => {
      const searchable = [deal.title, deal.retailer?.name, deal.category?.name].filter(Boolean).join(' ').toLocaleLowerCase()
      const price = deal.currentPrice
      const matchesPrice = priceRange === 'all' || (price !== null && ((priceRange === 'under-100' && price < 100) || (priceRange === '100-500' && price >= 100 && price <= 500) || (priceRange === '500-plus' && price > 500)))
      return (!term || searchable.includes(term)) && (categoryId === 'all' || deal.category?.id === categoryId) && (retailerId === 'all' || deal.retailer?.id === retailerId) && matchesPrice
    }).sort((a, b) => {
      if (sort === 'saving') return (savings(b) ?? -1) - (savings(a) ?? -1)
      if (sort === 'newest') return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      if (sort === 'ending') return new Date(a.expiresAt ?? '9999-12-31').getTime() - new Date(b.expiresAt ?? '9999-12-31').getTime()
      return (discount(b) ?? 0) - (discount(a) ?? 0) || (savings(b) ?? 0) - (savings(a) ?? 0)
    })
  }, [categoryId, deals, priceRange, query, retailerId, sort])

  return <main className="min-w-0 bg-[#f5f7fb] py-6 sm:py-8"><div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6"><nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground"><Link href={`/${locale}`} className="hover:text-primary">Home</Link><ChevronRight aria-hidden="true" className="size-3.5" /><span className="font-semibold text-foreground">Deals</span></nav>
    <section className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(120deg,#101b31,#1769ff)] px-6 py-6 text-white shadow-[0_18px_45px_-28px_rgba(23,105,255,0.8)] sm:px-9 sm:py-7"><div aria-hidden="true" className="absolute -right-24 -top-32 size-80 rounded-full bg-white/10" /><div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-2xl"><p className="text-[11px] font-black uppercase tracking-[0.17em] text-blue-100">Smart shopping · UAE</p><h1 className="mt-1.5 text-3xl font-black tracking-tight sm:text-[2.2rem]">Today&apos;s Best Deals</h1><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Discover real product prices, verified savings, and limited-time offers from trusted UAE retailers.</p></div><dl className="grid grid-cols-3 gap-2 sm:gap-3"><HeroStat value={deals.length} label="Deals live" /><HeroStat value={retailers.length} label="Retailers" /><HeroStat value={endingSoonCount} label="Ending soon" /></dl></div></section>
    <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]" aria-label="Deal categories"><button type="button" onClick={() => setCategoryId('all')} className={chipClass(categoryId === 'all')}>All Deals</button>{categories.map((category) => <button type="button" key={category.id} onClick={() => setCategoryId(category.id)} className={chipClass(categoryId === category.id)}>{category.name}</button>)}</div>
    <section aria-label="Filter deals" className="mt-2 grid gap-2 rounded-2xl border border-[#e6eaf0] bg-white p-2 shadow-[0_5px_22px_rgba(16,32,64,0.03)] md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"><label className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e6eaf0] px-3"><Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /><span className="sr-only">Search deals</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, brands or deals..." className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label><Select ariaLabel="Filter by retailer" value={retailerId} onChange={setRetailerId}><option value="all">All Retailers</option>{retailers.map((retailer) => <option key={retailer.id} value={retailer.id}>{retailer.name}</option>)}</Select><Select ariaLabel="Filter by price range" value={priceRange} onChange={(value) => setPriceRange(value as PriceRange)}><option value="all">Price Range</option><option value="under-100">Under AED 100</option><option value="100-500">AED 100–500</option><option value="500-plus">AED 500+</option></Select><Select ariaLabel="Sort deals" value={sort} onChange={(value) => setSort(value as Sort)}><option value="recommended">Recommended</option><option value="saving">Biggest Saving</option><option value="newest">Newest</option><option value="ending">Ending Soon</option></Select></section>
    <section className="mt-5"><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-primary"><Zap aria-hidden="true" className="size-3.5 fill-current" />Live product prices</p><h2 className="mt-0.5 text-xl font-black tracking-tight text-foreground">Latest Deals</h2><p className="mt-0.5 text-sm text-muted-foreground">Product offers with current and previous price information.</p></div><p className="text-sm font-medium text-muted-foreground">{visibleDeals.length} {visibleDeals.length === 1 ? 'deal' : 'deals'}</p></div>
      {errorMessage ? <ErrorState message={errorMessage} /> : visibleDeals.length ? <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{visibleDeals.map((deal) => <DealCard key={deal.id} deal={deal} locale={locale} />)}</div> : <NoResults hasDeals={deals.length > 0} onReset={() => { setQuery(''); setCategoryId('all'); setRetailerId('all'); setPriceRange('all'); setSort('recommended') }} />}
    </section>
    <section className="mt-7 grid divide-y overflow-hidden rounded-2xl border border-[#e6eaf0] bg-white shadow-sm md:grid-cols-3 md:divide-x md:divide-y-0"><TrustItem title="Genuine product deals" detail="Focused on actual price reductions, not coupon listings." /><TrustItem title="Compare before you buy" detail="See live offers from popular UAE retailers." /><TrustItem title="Catch deals before expiry" detail="Find limited-time savings while they are live." /></section>
  </div></main>
}

function HeroStat({ value, label }: { value: number; label: string }) { return <div className="min-w-0 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm sm:min-w-[6.25rem] sm:px-4"><dt className="text-[11px] text-blue-100">{label}</dt><dd className="mt-0.5 text-xl font-black tabular-nums">{value}</dd></div> }
function Select({ ariaLabel, value, onChange, children }: { ariaLabel: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="relative"><SlidersHorizontal aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-3.5 text-muted-foreground" /><span className="sr-only">{ariaLabel}</span><select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-[#e6eaf0] bg-white py-2 pl-8 pr-7 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">{children}</select></label> }
function chipClass(active: boolean) { return `min-h-10 shrink-0 rounded-xl border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-[#e6eaf0] bg-white text-muted-foreground hover:border-primary/40 hover:text-primary'}` }
function TrustItem({ title, detail }: { title: string; detail: string }) { return <div className="p-5"><p className="font-bold text-foreground">{title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{detail}</p></div> }
function ErrorState({ message }: { message: string }) { return <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center"><PackageOpen aria-hidden="true" className="mx-auto size-9 text-destructive" /><h3 className="mt-3 text-lg font-black">Deals could not be loaded</h3><p className="mt-1 text-sm text-muted-foreground">{message}</p></div> }
function NoResults({ hasDeals, onReset }: { hasDeals: boolean; onReset: () => void }) { return <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center"><PackageOpen aria-hidden="true" className="mx-auto size-10 text-muted-foreground" /><h3 className="mt-4 text-xl font-black">{hasDeals ? 'No matching deals' : 'No live deals right now'}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{hasDeals ? 'Try changing your search or filters to see more product offers.' : 'New product offers are added as they become available. Please check back soon.'}</p>{hasDeals && <button type="button" onClick={onReset} className="mt-5 min-h-10 rounded-xl border border-border bg-background px-4 text-sm font-bold hover:bg-muted">Clear filters</button>}</div> }

function DealCard({ deal, locale }: { deal: PublicDeal; locale: string }) {
  const saved = savings(deal)
  const percent = discount(deal)
  const endingSoon = isEndingSoon(deal.expiresAt)
  const productHref = deal.productSlug ? `/${locale}/product/${deal.productSlug}` : null
  const action = <span className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 text-[10px] font-black tracking-wide text-primary-foreground transition group-hover:bg-primary/90 sm:px-3 sm:text-[11px]">SHOP DEAL <ArrowUpRight aria-hidden="true" className="size-3.5" /></span>

  return <article className="group min-w-0 overflow-hidden rounded-xl border border-[#e6eaf0] bg-white shadow-[0_5px_18px_rgba(16,32,64,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_12px_28px_rgba(16,32,64,0.1)]">
    <div className="relative h-[7.75rem] overflow-hidden bg-[#f0f3f7] p-2.5 sm:h-36 lg:h-40 xl:h-[11.25rem] sm:p-3">
      {percent !== null && <span className="absolute left-2 top-2 z-10 rounded-md bg-slate-950 px-1.5 py-0.5 text-[10px] font-black text-white">−{percent}%</span>}
      {endingSoon && <span className="absolute right-2 top-2 z-10 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white">Soon</span>}
      {deal.imageUrl ? <img src={deal.imageUrl} alt={deal.title} className="size-full object-contain transition duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex size-full flex-col items-center justify-center gap-1 text-slate-400"><PackageOpen aria-hidden="true" className="size-8" /><span className="text-[10px] font-medium">Image unavailable</span></div>}
      {deal.retailer && <span className="absolute bottom-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 truncate rounded-md border border-[#e6eaf0] bg-white/95 px-1.5 py-1 text-[9px] font-black text-slate-700 shadow-sm">{deal.retailer.logoUrl ? <img src={deal.retailer.logoUrl} alt="" className="size-3.5 rounded object-contain" /> : <Store aria-hidden="true" className="size-3 text-primary" />}{deal.retailer.name}</span>}
    </div>
    <div className="flex min-h-[8.75rem] flex-col p-2.5 sm:p-3">
      <p className="truncate text-[10px] font-bold text-muted-foreground">{deal.retailer?.name ?? 'Retailer unavailable'}{deal.category ? ` · ${deal.category.name}` : ''}</p>
      <h3 className="mt-1 line-clamp-2 min-h-8 text-[12px] font-extrabold leading-4 text-foreground sm:text-[13px]">{deal.title}</h3>
      <div className="mt-2"><div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">{deal.currentPrice !== null ? <p className="text-[17px] font-black tracking-tight text-foreground sm:text-lg">{formatPrice(deal.currentPrice)}</p> : <p className="text-[11px] font-bold text-muted-foreground">Price unavailable</p>}{deal.originalPrice !== null && deal.currentPrice !== null && deal.originalPrice > deal.currentPrice && <p className="text-[10px] text-muted-foreground line-through">{formatPrice(deal.originalPrice)}</p>}</div>{saved !== null && <p className="mt-0.5 text-[10px] font-black text-emerald-700">Save {formatPrice(saved)}</p>}</div>
      <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-[#edf0f4] pt-2"><span className="inline-flex min-w-0 items-center gap-1 text-[9px] text-muted-foreground"><Clock3 aria-hidden="true" className="size-3 shrink-0" /><span className="truncate">{expiryText(deal.expiresAt)}</span></span>{deal.affiliateUrl ? <a href={deal.affiliateUrl} target="_blank" rel="noopener noreferrer" aria-label={`Shop deal: ${deal.title}`}>{action}</a> : productHref ? <Link href={productHref} aria-label={`View deal: ${deal.title}`}>{action}</Link> : <span className="text-[9px] font-semibold text-muted-foreground">Unavailable</span>}</div>
    </div>
  </article>
}
