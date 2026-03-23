import { createClient } from '@/utils/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Zap, TrendingUp, Clock, ExternalLink, Image as ImageIcon, Box } from 'lucide-react'
import Link from 'next/link'
import { deleteDeal, toggleDealActive } from './actions'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminDealsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const supabase = await createClient()

    const { data: deals } = await supabase
        .from('deals')
        .select('*, stores ( name, slug ), products ( name_en, slug )')
        .order('created_at', { ascending: false })

    const totalActive = deals?.filter((d) => d.is_active).length ?? 0
    const totalDiscounts = deals?.length ?? 0
    const totalClicks = deals?.reduce((sum, d) => sum + (d.click_count ?? 0), 0) ?? 0
    const expiringSoon = deals?.filter((d) => {
        if (!d.expires_at) return false
        const inDays = (new Date(d.expires_at).getTime() - Date.now()) / 86400000
        return inDays >= 0 && inDays <= 3
    }).length ?? 0

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Deals Registry</h1>
                    <p className="text-muted-foreground">Manage imported flash deals, discounts, and specific store offers.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: <Zap className="w-5 h-5" />, value: totalActive, label: 'Active Deals', color: '#0A84FF', bg: '#0A84FF1A' },
                    { icon: <Box className="w-5 h-5" />, value: totalDiscounts, label: 'Total Imported', color: '#00C875', bg: '#00C8751A' },
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
                            <TableHead className="w-16">Image</TableHead>
                            <TableHead>Deal Title & Product</TableHead>
                            <TableHead>Store</TableHead>
                            <TableHead>Pricing</TableHead>
                            <TableHead>Coupon Info</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!deals || deals.length === 0) ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No deals found. Use the Product Importer Extension to scoop deals!
                                </TableCell>
                            </TableRow>
                        ) : (
                            deals.map((deal) => {
                                const isExpired = deal.expires_at && new Date(deal.expires_at) < new Date()
                                const expiryText = deal.expires_at
                                    ? isExpired ? 'Expired' : formatDistanceToNow(new Date(deal.expires_at), { addSuffix: true })
                                    : '—'
                                return (
                                    <TableRow key={deal.id} className={isExpired ? 'opacity-50 hover:bg-muted/50' : 'hover:bg-muted/50'}>
                                        <TableCell>
                                            <div className="w-12 h-12 rounded-lg border bg-muted/20 flex flex-shrink-0 items-center justify-center overflow-hidden">
                                                {deal.image_url ? (
                                                    <img src={deal.image_url} alt={deal.title_en} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-sm text-foreground max-w-[250px] line-clamp-2 leading-tight">
                                                {deal.title_en}
                                            </div>
                                            {(deal.products as any)?.slug && (
                                                <div className="mt-1">
                                                    <Link 
                                                        href={`/${locale}/product/${(deal.products as any).slug}`} 
                                                        target="_blank"
                                                        className="inline-flex items-center text-[11px] font-medium text-primary hover:underline"
                                                    >
                                                        View Product <ExternalLink className="w-3 h-3 ml-1" />
                                                    </Link>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">
                                            {(deal.stores as any)?.name ?? <span className="text-muted-foreground italic">Unknown</span>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="font-bold text-sm">AED {deal.deal_price}</div>
                                                {deal.original_price && deal.original_price > deal.deal_price && (
                                                    <div className="text-[11px] text-muted-foreground line-through">
                                                        AED {deal.original_price}
                                                    </div>
                                                )}
                                                {deal.discount_percent && (
                                                    <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 mt-0.5 font-bold text-destructive bg-destructive/10 border-none">
                                                        -{deal.discount_percent}%
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {deal.coupon_value ? (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant="outline" className="font-mono text-[11px] bg-amber-50 text-amber-700 border-amber-200">
                                                        {deal.coupon_type === 'percent' || deal.coupon_type === 'percentage'
                                                            ? `${deal.coupon_value}% OFF`
                                                            : `AED ${deal.coupon_value} OFF`}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className={`text-sm font-medium ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                                            {expiryText}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={deal.is_active ? 'default' : 'destructive'} className={!deal.is_active ? 'bg-muted text-muted-foreground border-muted-foreground/20' : ''}>
                                                {deal.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {deal.affiliate_url && (
                                                    <Link href={deal.affiliate_url} target="_blank">
                                                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-primary">Go to Deal</Button>
                                                    </Link>
                                                )}
                                                <form action={async () => { "use server"; await toggleDealActive(deal.id, deal.is_active, locale) }}>
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold">{deal.is_active ? 'Disable' : 'Enable'}</Button>
                                                </form>
                                                <form action={async () => { "use server"; await deleteDeal(deal.id, locale) }}>
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
