'use client'

import { useState, useTransition } from 'react'
import { Pencil, ShieldCheck, Trash2, Zap } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { bulkDeleteCoupons, deleteCoupon, toggleCouponActive, verifyCoupon } from '@/app/[locale]/admin/coupons/actions'

type Coupon = {
    id: string
    code: string
    title_en: string
    discount_type: string
    discount_value: number
    click_count: number | null
    expires_at: string | null
    is_active: boolean
    is_verified: boolean
    is_exclusive: boolean
    stores: { name: string; slug: string } | { name: string; slug: string }[] | null
}

function storeName(stores: Coupon['stores']) {
    if (Array.isArray(stores)) return stores[0]?.name ?? 'Unknown'
    return stores?.name ?? 'Unknown'
}

export function CouponRegistryTable({ coupons, locale }: { coupons: Coupon[]; locale: string }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeleting, startDeleting] = useTransition()
    const [error, setError] = useState('')
    const allSelected = coupons.length > 0 && selectedIds.size === coupons.length

    function toggleCoupon(id: string, checked: boolean) {
        setSelectedIds((current) => {
            const next = new Set(current)
            if (checked) next.add(id)
            else next.delete(id)
            return next
        })
    }

    function deleteSelected() {
        const ids = [...selectedIds]
        if (ids.length === 0 || !window.confirm(`Delete ${ids.length} selected coupon${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return

        setError('')
        startDeleting(async () => {
            const result = await bulkDeleteCoupons(ids, locale)
            if (!result.success) return setError(result.error ?? 'The selected coupons could not be deleted.')
            setSelectedIds(new Set())
        })
    }

    return <section className="space-y-3" aria-labelledby="coupon-registry-table-title">
        {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        <div className="flex flex-col gap-3 rounded-2xl border bg-card px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div><h2 id="coupon-registry-table-title" className="font-black tracking-tight">All active coupons</h2><p className="mt-0.5 text-sm text-muted-foreground">{selectedIds.size ? `${selectedIds.size} coupon${selectedIds.size === 1 ? '' : 's'} selected` : 'Select coupons to delete them in bulk.'}</p></div>
            <Button variant="destructive" size="sm" disabled={selectedIds.size === 0 || isDeleting} onClick={deleteSelected}>
                <Trash2 aria-hidden="true" />
                {isDeleting ? 'Deleting…' : `Delete Selected${selectedIds.size ? ` (${selectedIds.size})` : ''}`}
            </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <Table className="min-w-[1016px]">
                <TableHeader className="bg-muted/70">
                    <TableRow>
                        <TableHead className="w-12"><Checkbox checked={allSelected} onCheckedChange={(checked) => setSelectedIds(checked ? new Set(coupons.map((coupon) => coupon.id)) : new Set())} aria-label="Select all coupons" /></TableHead>
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
                    {coupons.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No coupons found. Add your first coupon →</TableCell></TableRow>
                    ) : coupons.map((coupon) => {
                        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
                        const expiryText = coupon.expires_at ? isExpired ? 'Expired' : formatDistanceToNow(new Date(coupon.expires_at), { addSuffix: true }) : '—'
                        return <TableRow key={coupon.id} className={isExpired ? 'opacity-50' : 'transition-colors hover:bg-muted/40'}>
                            <TableCell><Checkbox checked={selectedIds.has(coupon.id)} onCheckedChange={(checked) => toggleCoupon(coupon.id, checked)} aria-label={`Select coupon ${coupon.code}`} /></TableCell>
                            <TableCell className="font-mono font-bold text-primary tracking-wider">{coupon.code}{coupon.is_exclusive && <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.5 rounded-full"><Zap aria-hidden="true" className="w-2.5 h-2.5" />EXCL</span>}</TableCell>
                            <TableCell className="font-medium text-sm">{storeName(coupon.stores)}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{coupon.title_en}</TableCell>
                            <TableCell><Badge variant="secondary" className="font-bold">{coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `AED ${coupon.discount_value} OFF`}</Badge></TableCell>
                            <TableCell className="text-sm font-semibold">{(coupon.click_count ?? 0).toLocaleString()}</TableCell>
                            <TableCell className={`text-sm font-medium ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>{expiryText}</TableCell>
                            <TableCell><div className="flex items-center gap-1.5 flex-wrap"><Badge variant={coupon.is_active ? 'default' : 'destructive'}>{coupon.is_active ? 'Active' : 'Inactive'}</Badge>{coupon.is_verified && <Badge variant="outline" className="text-[#00C875] border-[#00C875]/40"><ShieldCheck aria-hidden="true" className="w-3 h-3 mr-1" />Verified</Badge>}</div></TableCell>
                            <TableCell className="text-right"><div className="flex items-center justify-end gap-1">
                                <Link href={`/${locale}/admin/coupons/${coupon.id}/edit`}><Button variant="ghost" size="sm" className="h-8 text-xs font-bold"><Pencil aria-hidden="true" />Edit</Button></Link>
                                {!coupon.is_verified && <form action={async () => { await verifyCoupon(coupon.id, locale) }}><Button variant="ghost" size="sm" className="h-8 text-[#00C875] hover:bg-[#00C875]/10 text-xs font-bold">Verify</Button></form>}
                                <form action={async () => { await toggleCouponActive(coupon.id, !coupon.is_active, locale) }}><Button variant="ghost" size="sm" className="h-8 text-xs font-bold">{coupon.is_active ? 'Disable' : 'Enable'}</Button></form>
                                <form action={async () => { await deleteCoupon(coupon.id, locale) }}><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" aria-label={`Delete coupon ${coupon.code}`}><Trash2 aria-hidden="true" className="w-4 h-4" /></Button></form>
                            </div></TableCell>
                        </TableRow>
                    })}
                </TableBody>
            </Table>
        </div>
    </section>
}
