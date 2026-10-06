import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { PlusCircle, ShieldCheck, TrendingUp, Tag, Clock, Upload } from 'lucide-react'
import Link from 'next/link'
import { CouponRegistryTable } from '@/components/admin/coupons/CouponRegistryTable'
import { CouponOfTheDayCard, type CouponOfTheDay } from '@/components/admin/coupons/CouponOfTheDayCard'

export default async function AdminCouponsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data: coupons } = await supabase
        .from('coupons')
        .select('*, stores ( name, slug )')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false })

    const totalActive = coupons?.filter((c) => c.is_active).length ?? 0
    const totalVerified = coupons?.filter((c) => c.is_verified).length ?? 0
    const totalClicks = coupons?.reduce((sum, c) => sum + (c.click_count ?? 0), 0) ?? 0
    const expiringSoon = coupons?.filter((c) => {
        if (!c.expires_at) return false
        const inDays = (new Date(c.expires_at).getTime() - Date.now()) / 86400000
        return inDays >= 0 && inDays <= 3
    }).length ?? 0
    const couponOfTheDay = [...(coupons ?? [])].sort((a, b) => {
        const score = (coupon: typeof a) => (coupon.is_verified ? 1_000_000 : 0) + (coupon.is_exclusive ? 100_000 : 0) + (coupon.click_count ?? 0)
        return score(b) - score(a)
    })[0] ?? null

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Coupon operations</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Coupons Registry</h1><p className="mt-2 text-muted-foreground">Manage offers, spotlight the strongest code, and keep the catalogue ready to convert.</p></div>
                <div className="flex flex-wrap items-center gap-2"><Link href={'/' + locale + '/admin/coupons/import'}><Button variant="outline"><Upload aria-hidden="true" />Import Coupons</Button></Link><Link href={`/${locale}/admin/coupons/new`}><Button><PlusCircle aria-hidden="true" />Add Coupon</Button></Link></div>
            </div>

            <CouponOfTheDayCard coupon={couponOfTheDay as CouponOfTheDay | null} locale={locale} />

            <section aria-label="Coupon performance overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {[
                    { icon: <Tag className="w-5 h-5" />, value: totalActive, label: 'Active Coupons', color: '#0A84FF', bg: '#0A84FF1A' },
                    { icon: <ShieldCheck className="w-5 h-5" />, value: totalVerified, label: 'Verified', color: '#00C875', bg: '#00C8751A' },
                    { icon: <TrendingUp className="w-5 h-5" />, value: totalClicks.toLocaleString(), label: 'Total Clicks', color: '#A855F7', bg: '#A855F71A' },
                    { icon: <Clock className="w-5 h-5" />, value: expiringSoon, label: 'Expiring in 3 days', color: '#FF6B00', bg: '#FF6B001A' },
                ].map((stat, i) => (
                    <div key={i} className="group rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30 sm:p-5">
                        <div className="flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: stat.bg, color: stat.color }}>
                            {stat.icon}
                        </div><div>
                            <p className="text-2xl font-black leading-tight" style={{ color: stat.color }}>{stat.value}</p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                        </div></div>
                    </div>
                ))}
            </section>

            <CouponRegistryTable coupons={coupons ?? []} locale={locale} />
        </div>
    )
}
