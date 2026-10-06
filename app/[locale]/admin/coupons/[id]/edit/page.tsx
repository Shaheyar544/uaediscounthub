import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { updateCoupon } from '../../actions'
import { notFound, redirect } from 'next/navigation'

export default async function EditCouponPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; id: string }>
    searchParams: Promise<{ error?: string }>
}) {
    const { locale, id } = await params
    const { error } = await searchParams
    const supabase = await createClient()
    const [{ data: coupon }, { data: stores }] = await Promise.all([
        supabase.from('coupons').select('id, store_id, code, title_en, title_ar, description_en, discount_type, discount_value, min_order_value, expires_at, is_active, is_exclusive, is_verified').eq('id', id).single(),
        supabase.from('stores').select('id, name').eq('is_active', true),
    ])

    if (!coupon) notFound()
    const expiresAt = coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : ''

    return <div className="w-full space-y-6">
        <div className="flex items-center space-x-4">
            <Link href={`/${locale}/admin/coupons`}><Button variant="outline" size="icon" className="rounded-full" aria-label="Back to coupons"><ChevronLeft aria-hidden="true" className="w-4 h-4" /></Button></Link>
            <div><h1 className="text-3xl font-bold tracking-tight">Edit Coupon</h1><p className="text-muted-foreground">Update this discount code in the public registry.</p></div>
        </div>
        {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        <form action={async (formData) => {
            'use server'
            const result = await updateCoupon(coupon.id, formData, locale)
            if (result.success) redirect(`/${locale}/admin/coupons`)
            redirect(`/${locale}/admin/coupons/${coupon.id}/edit?error=${encodeURIComponent(result.error ?? 'The coupon could not be updated.')}`)
        }} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-8 rounded-xl border shadow-sm">
            <div className="space-y-2"><Label htmlFor="store_id">Store / Marketplace</Label><select name="store_id" id="store_id" required defaultValue={coupon.store_id} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{stores?.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="code">Coupon Code</Label><Input id="code" name="code" defaultValue={coupon.code} required className="font-mono font-bold uppercase" /></div>
            <div className="space-y-2"><Label htmlFor="title_en">Title (English)</Label><Input id="title_en" name="title_en" defaultValue={coupon.title_en} required /></div>
            <div className="space-y-2"><Label htmlFor="title_ar">Title (Arabic)</Label><Input id="title_ar" name="title_ar" defaultValue={coupon.title_ar ?? ''} dir="rtl" /></div>
            <div className="space-y-2"><Label htmlFor="discount_type">Discount Type</Label><select name="discount_type" id="discount_type" defaultValue={coupon.discount_type} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="percent">Percentage (%)</option><option value="fixed">Fixed Amount (AED)</option></select></div>
            <div className="space-y-2"><Label htmlFor="discount_value">Discount Value</Label><Input id="discount_value" name="discount_value" type="number" step="0.01" defaultValue={coupon.discount_value} required /></div>
            <div className="space-y-2"><Label htmlFor="min_order_value">Min. Order Value (Optional)</Label><Input id="min_order_value" name="min_order_value" type="number" step="0.01" defaultValue={coupon.min_order_value ?? ''} /></div>
            <div className="space-y-2"><Label htmlFor="expires_at">Expiration Date</Label><Input id="expires_at" name="expires_at" type="datetime-local" defaultValue={expiresAt} /></div>
            <div className="md:col-span-2 space-y-2"><Label htmlFor="description_en">Terms & Conditions / Description</Label><textarea id="description_en" name="description_en" defaultValue={coupon.description_en ?? ''} className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
            <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" id="is_active" name="is_active" defaultChecked={coupon.is_active} className="w-4 h-4 rounded" /><Label htmlFor="is_active" className="cursor-pointer">Active immediately</Label></label>
                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" id="is_verified" name="is_verified" defaultChecked={coupon.is_verified} className="w-4 h-4 rounded" /><Label htmlFor="is_verified" className="cursor-pointer">Mark as Verified</Label></label>
                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" id="is_exclusive" name="is_exclusive" defaultChecked={coupon.is_exclusive} className="w-4 h-4 rounded" /><Label htmlFor="is_exclusive" className="cursor-pointer">Exclusive Code</Label></label>
            </div>
            <div className="md:col-span-2 pt-4"><Button type="submit" className="w-full md:w-auto px-8 space-x-2"><Save aria-hidden="true" className="w-4 h-4" /><span>Save Changes</span></Button></div>
        </form>
    </div>
}
