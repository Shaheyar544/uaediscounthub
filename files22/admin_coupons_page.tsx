import { createClient } from '@/utils/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlusCircle, Trash2, ShieldCheck, Zap, TrendingUp, Tag, Clock } from 'lucide-react'
import Link from 'next/link'
import { deleteCoupon, toggleCouponActive, verifyCoupon } from './actions'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminCouponsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const supabase = await createClient()

    const { data: coupons } = await supabase
        .from('coupons')
        .select('*, stores ( name, slug )')
        .order('created_at', { ascending: false })

    const totalActive = coupons?.filter((c) => c.is_active).length ?? 0
    const totalVerified = coupons?.filter((c) => c.is_verified).length ?? 0
    const totalClicks = coupons?.reduce((sum, c) => sum + (c.click_count ?? 0), 0) ?? 0
    const expiringSoon = coupons?.filter((c) => {
        if (!c.expires_at) return false
        const inDays = (new Date(c.expires_at).getTime() - Date.now()) / 86400000
        return inDays >= 0 && inDays <= 3
    }).length ?? 0

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Coupons Registry</h1>
                    <p className="text-muted-foreground">Manage promo codes, track performance, and verify submissions.</p>
                </div>
                <Link href={`/${locale}/admin/coupons/new`}>
                    <Button className="flex items-center space-x-2">
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Coupon</span>
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: <Tag className="w-5 h-5" />, value: totalActive, label: 'Active Coupons', color: '#0A84FF', bg: '#0A84FF1A' },
                    { icon: <ShieldCheck className="w-5 h-5" />, value: totalVerified, label: 'Verified', color: '#00C875', bg: '#00C8751A' },
                    { icon: <TrendingUp className="w-5 h-5" />, value: totalClicks.toLocaleString(), label: 'Total Clicks', color: '#A855F7', bg: '#A855F71A' },
                    { icon: <Clock className="w-5 h-5" />, value: expiringSoon, label: 'Expiring in 3 days', color: '#FF6B00', bg: '#FF6B001A' },
                ].map((stat, i) => (
                    <div key={i} className="rounded-xl border bg-card p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: stat.bg, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold leading-tight" style={{ color: stat.color }}>{stat.value}</p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Store</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!coupons || coupons.length === 0) ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No coupons found. Add your first coupon →
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons.map((coupon) => {
                                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
                                const expiryText = coupon.expires_at
                                    ? isExpired ? 'Expired' : formatDistanceToNow(new Date(coupon.expires_at), { addSuffix: true })
                                    : '—'
                                return (
                                    <TableRow key={coupon.id} className={isExpired ? 'opacity-50' : ''}>
                                        <TableCell className="font-mono font-bold text-primary tracking-wider">
                                            {coupon.code}
                                            {coupon.is_exclusive && (
                                                <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.5 rounded-full">
                                                    <Zap className="w-2.5 h-2.5" />EXCL
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">{(coupon.stores as any)?.name ?? 'Unknown'}</TableCell>
                                        <TableCell className="text-sm max-w-[200px] truncate">{coupon.title_en}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-bold">
                                                {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `AED ${coupon.discount_value} OFF`}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-semibold">{(coupon.click_count ?? 0).toLocaleString()}</TableCell>
                                        <TableCell className={`text-sm font-medium ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>{expiryText}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Badge variant={coupon.is_active ? 'default' : 'destructive'}>
                                                    {coupon.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                {coupon.is_verified && (
                                                    <Badge variant="outline" className="text-[#00C875] border-[#00C875]/40">
                                                        <ShieldCheck className="w-3 h-3 mr-1" />Verified
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {!coupon.is_verified && (
                                                    <form action={async () => { "use server"; await verifyCoupon(coupon.id, locale) }}>
                                                        <Button variant="ghost" size="sm" className="h-8 text-[#00C875] hover:bg-[#00C875]/10 text-xs font-bold">Verify</Button>
                                                    </form>
                                                )}
                                                <form action={async () => { "use server"; await toggleCouponActive(coupon.id, !coupon.is_active, locale) }}>
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold">{coupon.is_active ? 'Disable' : 'Enable'}</Button>
                                                </form>
                                                <form action={async () => { "use server"; await deleteCoupon(coupon.id, locale) }}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
