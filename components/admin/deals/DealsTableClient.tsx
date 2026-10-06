'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, ImageIcon, Loader2, Search, Trash2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { bulkDeleteDeals, bulkToggleDealsActive, deleteDeal, toggleDealActive } from '@/app/[locale]/admin/deals/actions'
import { EditDealModal } from '@/components/admin/deals/EditDealModal'

type DealStatus = 'active' | 'scheduled' | 'expired' | 'inactive'

interface DealRecord {
  id: string
  title_en: string | null
  deal_price: number | string | null
  original_price: number | string | null
  coupon_value: number | string | null
  coupon_type: string | null
  discount_percent: number | null
  affiliate_url: string | null
  image_url: string | null
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  store_id: string | null
  products: { name_en: string | null; slug: string | null; image_url?: string | null } | null
  stores: { id: string; name: string; slug?: string | null; logo_url?: string | null } | null
}

interface DealsTableClientProps {
  deals: DealRecord[]
  stores: { id: string; name: string }[]
  locale: string
  errorMessage?: string | null
}

const PAGE_SIZE = 25

function dealStatus(deal: DealRecord, now: Date): DealStatus {
  if (deal.expires_at && new Date(deal.expires_at).getTime() <= now.getTime()) return 'expired'
  if (deal.starts_at && new Date(deal.starts_at).getTime() > now.getTime()) return 'scheduled'
  return deal.is_active ? 'active' : 'inactive'
}

function statusStyle(status: DealStatus) {
  if (status === 'active') return 'bg-emerald-500/10 text-emerald-700 ring-emerald-600/15 dark:text-emerald-300'
  if (status === 'scheduled') return 'bg-amber-500/10 text-amber-700 ring-amber-600/15 dark:text-amber-300'
  if (status === 'expired') return 'bg-rose-500/10 text-rose-700 ring-rose-600/15 dark:text-rose-300'
  return 'bg-slate-500/10 text-slate-700 ring-slate-600/15 dark:text-slate-300'
}

function formatPrice(value: number | string | null) {
  if (value === null || value === undefined || value === '') return '—'
  const parsed = Number(value)
  return Number.isFinite(parsed) ? `AED ${parsed.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : String(value)
}

export function DealsTableClient({ deals, stores, locale, errorMessage }: DealsTableClientProps) {
  const [query, setQuery] = useState('')
  const [storeId, setStoreId] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | DealStatus>('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const now = new Date()

  const filteredDeals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return deals.filter((deal) => {
      const matchesSearch = !normalizedQuery || [deal.title_en, deal.products?.name_en, deal.stores?.name, deal.coupon_value]
        .some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery))
      const matchesStore = storeId === 'all' || deal.store_id === storeId || deal.stores?.id === storeId
      const matchesStatus = statusFilter === 'all' || dealStatus(deal, now) === statusFilter
      return matchesSearch && matchesStore && matchesStatus
    })
  }, [deals, now, query, statusFilter, storeId])

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / PAGE_SIZE))
  const activePage = Math.min(page, totalPages)
  const pageDeals = filteredDeals.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)
  const selectedOnPage = pageDeals.filter((deal) => selectedIds.has(deal.id)).length
  const resetPage = () => setPage(1)

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current)
      const everyVisibleSelected = pageDeals.length > 0 && pageDeals.every((deal) => next.has(deal.id))
      pageDeals.forEach((deal) => everyVisibleSelected ? next.delete(deal.id) : next.add(deal.id))
      return next
    })
  }

  function toggleOne(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} selected deal${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`)) return
    setIsProcessing(true)
    const result = await bulkDeleteDeals([...selectedIds], locale)
    if (!result.success) alert(`Could not delete deals: ${result.error}`)
    setSelectedIds(new Set())
    setIsProcessing(false)
  }

  async function handleBulkStatus(active: boolean) {
    if (!selectedIds.size) return
    setIsProcessing(true)
    const result = await bulkToggleDealsActive([...selectedIds], active, locale)
    if (!result.success) alert(`Could not update deals: ${result.error}`)
    setSelectedIds(new Set())
    setIsProcessing(false)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_12px_34px_-24px_rgba(15,23,42,0.35)]" aria-labelledby="deals-table-title">
      <div className="border-b border-border/80 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div><h2 id="deals-table-title" className="text-base font-extrabold tracking-tight">All deals</h2><p className="mt-1 text-sm text-muted-foreground">Search, review, and maintain live offer records.</p></div>
          <p className="text-sm font-medium text-muted-foreground" aria-live="polite">{filteredDeals.length} matching deal{filteredDeals.length === 1 ? '' : 's'}</p>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1 lg:max-w-md"><span className="sr-only">Search deals, stores, or coupons</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage() }} placeholder="Search deal, store or coupon..." className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" /></label>
          <label className="sr-only" htmlFor="deal-store-filter">Filter by store</label><select id="deal-store-filter" value={storeId} onChange={(event) => { setStoreId(event.target.value); resetPage() }} className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"><option value="all">All stores</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select>
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0" aria-label="Filter deals by status">{([['all', 'All'], ['active', 'Active'], ['scheduled', 'Scheduled'], ['expired', 'Expired']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setStatusFilter(value); resetPage() }} aria-pressed={statusFilter === value} className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${statusFilter === value ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>{label}</button>)}</div>
        </div>
      </div>

      {selectedIds.size > 0 && <div className="flex flex-col gap-3 border-b border-blue-200 bg-blue-50/70 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/20 sm:flex-row sm:items-center sm:justify-between sm:px-5" role="status"><p className="text-sm font-bold text-blue-900 dark:text-blue-100"><span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-primary text-xs text-white">{selectedIds.size}</span>deal{selectedIds.size === 1 ? '' : 's'} selected</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => handleBulkStatus(true)} disabled={isProcessing} className="border-emerald-200 bg-background text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300"><CheckCircle2 aria-hidden="true" />Enable</Button><Button size="sm" variant="outline" onClick={() => handleBulkStatus(false)} disabled={isProcessing} className="border-amber-200 bg-background text-amber-700 hover:bg-amber-50 dark:text-amber-300"><XCircle aria-hidden="true" />Disable</Button><Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={isProcessing}>{isProcessing ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Trash2 aria-hidden="true" />}Delete</Button></div></div>}

      {errorMessage ? <div className="m-5 rounded-xl border border-destructive/25 bg-destructive/5 px-5 py-10 text-center"><XCircle aria-hidden="true" className="mx-auto size-8 text-destructive" /><h3 className="mt-3 font-bold">Deals could not be loaded</h3><p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p></div> : <Table className="min-w-[1080px]"><TableHeader className="bg-muted/40"><TableRow className="hover:bg-transparent"><TableHead className="w-12 px-4"><input type="checkbox" aria-label="Select all deals on this page" checked={pageDeals.length > 0 && selectedOnPage === pageDeals.length} onChange={toggleAllVisible} className="size-4 rounded border-border accent-primary" /></TableHead><TableHead className="min-w-[290px]">Deal / Product</TableHead><TableHead>Store</TableHead><TableHead>Pricing</TableHead><TableHead>Coupon</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead><TableHead className="pr-4 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {!deals.length ? <TableRow><TableCell colSpan={8} className="h-72 px-6 text-center"><div className="mx-auto max-w-sm"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><ImageIcon aria-hidden="true" className="size-6" /></div><h3 className="mt-4 font-bold">No deals in the registry yet</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Imported deals will appear here when they are available.</p></div></TableCell></TableRow> : !filteredDeals.length ? <TableRow><TableCell colSpan={8} className="h-72 px-6 text-center"><div className="mx-auto max-w-sm"><Search aria-hidden="true" className="mx-auto size-7 text-muted-foreground" /><h3 className="mt-3 font-bold">No matching deals</h3><p className="mt-1 text-sm text-muted-foreground">Try a different keyword, store, or status filter.</p><Button variant="outline" size="sm" className="mt-4" onClick={() => { setQuery(''); setStoreId('all'); setStatusFilter('all'); resetPage() }}>Clear filters</Button></div></TableCell></TableRow> : pageDeals.map((deal) => {
          const status = dealStatus(deal, now)
          const isSelected = selectedIds.has(deal.id)
          const expiresAt = deal.expires_at ? new Date(deal.expires_at) : null
          const expiresLabel = expiresAt ? status === 'expired' ? `Expired ${format(expiresAt, 'dd MMM yyyy')}` : formatDistanceToNowStrict(expiresAt, { addSuffix: true }) : 'No expiry'
          const productName = deal.products?.name_en || 'No linked product'
          return <TableRow key={deal.id} data-state={isSelected ? 'selected' : undefined} className={status === 'expired' ? 'opacity-75' : ''}><TableCell className="px-4"><input type="checkbox" aria-label={`Select ${deal.title_en || productName}`} checked={isSelected} onChange={() => toggleOne(deal.id)} className="size-4 rounded border-border accent-primary" /></TableCell><TableCell><div className="flex min-w-[270px] items-center gap-3"><div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted">{deal.image_url || deal.products?.image_url ? <img src={deal.image_url || deal.products?.image_url || ''} alt="" className="size-full object-cover" /> : <ImageIcon aria-hidden="true" className="size-4 text-muted-foreground" />}</div><div className="min-w-0"><p className="max-w-[270px] truncate font-bold text-foreground">{deal.title_en || productName}</p><p className="mt-0.5 max-w-[270px] truncate text-xs text-muted-foreground">{deal.products?.slug ? <Link href={`/${locale}/product/${deal.products.slug}`} target="_blank" className="hover:text-primary hover:underline">{productName}</Link> : productName}</p></div></div></TableCell><TableCell><div className="min-w-[120px] font-semibold">{deal.stores?.name || <span className="font-normal italic text-muted-foreground">Unassigned</span>}</div></TableCell><TableCell><div className="min-w-[112px]"><p className="font-bold tabular-nums">{formatPrice(deal.deal_price)}</p>{deal.original_price && Number(deal.original_price) > Number(deal.deal_price) ? <p className="mt-0.5 text-xs text-muted-foreground line-through tabular-nums">{formatPrice(deal.original_price)}</p> : deal.discount_percent ? <p className="mt-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">{deal.discount_percent}% off</p> : null}</div></TableCell><TableCell>{deal.coupon_value ? <span className="inline-flex rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-300">{deal.coupon_type === 'percent' || deal.coupon_type === 'percentage' ? `${deal.coupon_value}% OFF` : `AED ${deal.coupon_value} OFF`}</span> : <span className="text-sm text-muted-foreground">—</span>}</TableCell><TableCell><div className={`min-w-[110px] text-sm ${status === 'expired' ? 'font-medium text-rose-700 dark:text-rose-300' : 'text-muted-foreground'}`}>{expiresLabel}</div></TableCell><TableCell><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusStyle(status)}`}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{status[0].toUpperCase() + status.slice(1)}</span></TableCell><TableCell className="pr-4"><div className="flex justify-end gap-1">{deal.affiliate_url ? <a href={deal.affiliate_url} target="_blank" rel="noreferrer" aria-label={`Open ${deal.title_en || productName}`} className="inline-flex size-7 items-center justify-center rounded-lg text-primary transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><ExternalLink aria-hidden="true" className="size-4" /></a> : <Button variant="ghost" size="icon-sm" disabled title="No deal URL available" aria-label="No deal URL available"><ExternalLink aria-hidden="true" /></Button>}<EditDealModal deal={deal} stores={stores} locale={locale} /><Button variant="ghost" size="sm" title={deal.is_active ? 'Disable deal' : 'Enable deal'} onClick={() => toggleDealActive(deal.id, deal.is_active, locale)} className="px-2 text-xs font-bold">{deal.is_active ? 'Disable' : 'Enable'}</Button><Button variant="ghost" size="icon-sm" title="Delete deal" aria-label={`Delete ${deal.title_en || productName}`} onClick={() => confirm(`Delete ${deal.title_en || 'this deal'}?`) && deleteDeal(deal.id, locale)} className="text-destructive hover:bg-destructive/10"><Trash2 aria-hidden="true" /></Button></div></TableCell></TableRow>
        })}
      </TableBody></Table>}

      {!errorMessage && filteredDeals.length > 0 && <div className="flex flex-col gap-3 border-t border-border/80 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5"><p>Showing {(activePage - 1) * PAGE_SIZE + 1}–{Math.min(activePage * PAGE_SIZE, filteredDeals.length)} of {filteredDeals.length} deals</p><div className="flex items-center gap-2"><Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={activePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" /></Button><span className="min-w-16 text-center text-xs font-bold">Page {activePage} / {totalPages}</span><Button variant="outline" size="icon-sm" aria-label="Next page" disabled={activePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight aria-hidden="true" /></Button></div></div>}
    </section>
  )
}
