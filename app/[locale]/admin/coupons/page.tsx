import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlusCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { deleteCoupon } from './actions'

export default async function AdminCouponsPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const supabase = await createClient()

    const { data: coupons, error } = await supabase
        .from('coupons')
        .select(`
            *,
            stores ( name )
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Coupons Registry</h1>
                    <p className="text-muted-foreground">Manage promo codes and exclusive affiliate discounts.</p>
                </div>
                <Link href={`/${locale}/admin/coupons/new`}>
                    <Button className="flex items-center space-x-2">
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Coupon</span>
                    </Button>
                </Link>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Store</TableHead>
                            <TableHead>Title (EN)</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!coupons || coupons.length === 0) ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No coupons found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-mono font-bold text-primary">
                                        {coupon.code}
                                    </TableCell>
                                    <TableCell>
                                        {(coupon.stores as any)?.name || 'Unknown Store'}
                                    </TableCell>
                                    <TableCell>
                                        {coupon.title_en}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `AED ${coupon.discount_value}`}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={coupon.is_active ? 'default' : 'destructive'}>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Simplified delete for now, in production would use a Client Component for confirmation */}
                                        <form action={async () => {
                                            "use server"
                                            await deleteCoupon(coupon.id, locale)
                                        }}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
