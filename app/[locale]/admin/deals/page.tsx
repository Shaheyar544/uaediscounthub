import { Box, Clock3, MousePointerClick, Plus, Zap } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { DealsTableClient } from '@/components/admin/deals/DealsTableClient'

export const dynamic = 'force-dynamic'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-AE', { notation: value >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}

export default async function AdminDealsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const now = new Date()

  const [dealsResult, storesResult] = await Promise.all([
    supabase
      .from('deals')
      .select('*, stores ( id, name, slug, logo_url ), products ( name_en, slug, image_url )')
      .order('created_at', { ascending: false }),
    supabase.from('stores').select('id, name').order('name'),
  ])

  const deals = dealsResult.data ?? []
  const isExpired = (deal: { expires_at?: string | null }) => Boolean(deal.expires_at && new Date(deal.expires_at).getTime() <= now.getTime())
  const isScheduled = (deal: { starts_at?: string | null }) => Boolean(deal.starts_at && new Date(deal.starts_at).getTime() > now.getTime())
  const activeDeals = deals.filter((deal) => deal.is_active && !isExpired(deal) && !isScheduled(deal)).length
  const totalClicks = deals.reduce((sum, deal) => sum + (deal.click_count ?? 0), 0)
  const expiringSoon = deals.filter((deal) => {
    if (!deal.expires_at || isExpired(deal)) return false
    const hoursUntilExpiry = (new Date(deal.expires_at).getTime() - now.getTime()) / 3_600_000
    return hoursUntilExpiry <= 72
  }).length

  const stats = [
    { label: 'Active Deals', value: activeDeals, detail: 'Live and available now', icon: Zap, tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { label: 'Total Imported', value: deals.length, detail: 'Current registry records', icon: Box, tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Total Clicks', value: formatNumber(totalClicks), detail: 'Tracked deal visits', icon: MousePointerClick, tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { label: 'Expiring Soon', value: expiringSoon, detail: 'Within the next 72 hours', icon: Clock3, tone: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div className="mx-auto w-full max-w-[1540px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Deal operations</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-[2rem]">Deals Registry</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Manage imported flash deals, product offers, pricing campaigns, and store promotions.</p>
        </div>
        <Button disabled size="lg" title="Manual deal creation is not available in the current workflow" className="w-full font-bold sm:w-auto">
          <Plus aria-hidden="true" /> Add Deal
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Deals registry overview">
        {stats.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className="flex min-h-31 items-start justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.5)]">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.11em] text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-black tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
            <div className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon aria-hidden="true" className="size-5" /></div>
          </article>
        ))}
      </section>

      <DealsTableClient
        deals={deals}
        stores={storesResult.data ?? []}
        locale={locale}
        errorMessage={dealsResult.error?.message ?? storesResult.error?.message ?? null}
      />
    </div>
  )
}
