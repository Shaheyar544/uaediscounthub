import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { createCoupon } from '../actions'

export default async function NewCouponPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const supabase = await createClient()

    // Fetch stores for the selection dropdown
    const { data: stores } = await supabase
        .from('stores')
        .select('id, name')
        .eq('is_active', true)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/${locale}/admin/coupons`}>
                        <Button variant="outline" size="icon" className="rounded-full">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create New Coupon</h1>
                        <p className="text-muted-foreground">Add a new discount code to the registry.</p>
                    </div>
                </div>
            </div>

            <form action={async (formData) => {
                "use server"
                await createCoupon(formData, locale)
            }} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-8 rounded-xl border shadow-sm">

                <div className="space-y-2">
                    <Label htmlFor="store_id">Store / Marketplace</Label>
                    <select
                        name="store_id"
                        id="store_id"
                        required
                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        {stores?.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input id="code" name="code" placeholder="e.g. SAVE15" required className="font-mono font-bold uppercase" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="title_en">Title (English)</Label>
                    <Input id="title_en" name="title_en" placeholder="15% Off All Electronics" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="title_ar">Title (Arabic)</Label>
                    <Input id="title_ar" name="title_ar" placeholder="خصم 15% على الإلكترونيات" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="discount_type">Discount Type</Label>
                    <select
                        name="discount_type"
                        id="discount_type"
                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (AED)</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="discount_value">Discount Value</Label>
                    <Input id="discount_value" name="discount_value" type="number" step="0.01" placeholder="15" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="min_order_value">Min. Order Value (Optional)</Label>
                    <Input id="min_order_value" name="min_order_value" type="number" step="0.01" placeholder="500" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="expires_at">Expiration Date</Label>
                    <Input id="expires_at" name="expires_at" type="datetime-local" />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description_en">Internal Notes / Description</Label>
                    <textarea
                        id="description_en"
                        name="description_en"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Valid on laptops and mobile accessories..."
                    ></textarea>
                </div>

                <div className="flex items-center space-x-2">
                    <input type="checkbox" id="is_active" name="is_active" defaultChecked className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <Label htmlFor="is_active">Mark as Active immediately</Label>
                </div>

                <div className="md:col-span-2 pt-4">
                    <Button type="submit" className="w-full md:w-auto px-8 space-x-2">
                        <Save className="w-4 h-4" />
                        <span>Save Coupon</span>
                    </Button>
                </div>
            </form>
        </div>
    )
}
