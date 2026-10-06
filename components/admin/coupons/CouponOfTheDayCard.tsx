import { ArrowRight, BadgePercent, CalendarDays, MousePointerClick, Sparkles, Store } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export type CouponOfTheDay = {
    id: string
    code: string
    title_en: string
    discount_type: string
    discount_value: number
    expires_at: string | null
    is_verified: boolean
    is_exclusive: boolean
    click_count: number | null
    stores: { name: string } | { name: string }[] | null
}

function storeName(stores: CouponOfTheDay['stores']) {
    return Array.isArray(stores) ? stores[0]?.name ?? 'Featured store' : stores?.name ?? 'Featured store'
}

export function CouponOfTheDayCard({ coupon, locale }: { coupon: CouponOfTheDay | null; locale: string }) {
    if (!coupon) return <section className="rounded-3xl border border-dashed bg-card p-6 shadow-sm sm:p-8" aria-labelledby="coupon-of-the-day-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Daily spotlight</p><h2 id="coupon-of-the-day-title" className="mt-2 text-2xl font-black tracking-tight">Coupon of the Day</h2><p className="mt-1 text-sm text-muted-foreground">Add an active coupon to feature your strongest offer here.</p></div><Link href={`/${locale}/admin/coupons/new`}><Button><BadgePercent aria-hidden="true" />Add Coupon</Button></Link></div>
    </section>

    const discount = coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `AED ${coupon.discount_value} OFF`
    const expiry = coupon.expires_at ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(coupon.expires_at)) : 'No expiry date'

    return <section className="relative isolate overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-[#0037b5] via-primary to-[#061b62] p-6 text-primary-foreground shadow-xl shadow-primary/20 sm:p-8" aria-labelledby="coupon-of-the-day-title">
        <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-[#FF8A00]/25 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em]"><Sparkles aria-hidden="true" className="size-3.5 text-[#FFD166]" />Coupon of the Day</span>{coupon.is_verified && <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-100 ring-1 ring-inset ring-emerald-200/25">Verified offer</span>}{coupon.is_exclusive && <span className="rounded-full bg-orange-300/15 px-3 py-1 text-xs font-bold text-orange-100 ring-1 ring-inset ring-orange-200/25">Exclusive code</span>}</div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 font-mono text-xl font-black tracking-[0.14em] shadow-sm backdrop-blur-sm">{coupon.code}</div><div><p className="flex items-center gap-1.5 text-sm font-medium text-blue-100"><Store aria-hidden="true" className="size-4" />{storeName(coupon.stores)}</p><h2 id="coupon-of-the-day-title" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{coupon.title_en}</h2></div></div>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-blue-100"><span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4 text-[#FFD166]" />{expiry}</span><span className="inline-flex items-center gap-2"><MousePointerClick aria-hidden="true" className="size-4 text-[#FFD166]" />{(coupon.click_count ?? 0).toLocaleString()} clicks</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end"><p className="rounded-2xl bg-white px-5 py-3 text-xl font-black text-[#0037b5] shadow-lg">{discount}</p><Link href={`/${locale}/admin/coupons/${coupon.id}/edit`}><Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white">Edit featured coupon<ArrowRight aria-hidden="true" /></Button></Link></div>
        </div>
    </section>
}
