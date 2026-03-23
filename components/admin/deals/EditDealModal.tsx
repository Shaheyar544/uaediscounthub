'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateDeal } from '@/app/[locale]/admin/deals/actions'
import { Edit } from 'lucide-react'

interface EditDealModalProps {
    deal: any
    stores: { id: string; name: string }[]
    locale: string
}

export function EditDealModal({ deal, stores, locale }: EditDealModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title_en: deal.title_en || '',
        deal_price: deal.deal_price || '',
        original_price: deal.original_price || '',
        affiliate_url: deal.affiliate_url || '',
        coupon_value: deal.coupon_value || '',
        store_id: deal.store_id || '',
        is_active: deal.is_active
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        
        // Clean data: convert empty strings to null for nullable columns
        const cleanedData = {
            ...formData,
            store_id: formData.store_id === '' ? null : formData.store_id,
            original_price: formData.original_price === '' ? null : Number(formData.original_price),
            coupon_value: formData.coupon_value === '' ? null : Number(formData.coupon_value),
        }

        try {
            await updateDeal(deal.id, cleanedData, locale)
            setOpen(false)
        } catch (error) {
            console.error(error)
            alert('Failed to update deal. Check the console for more info.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setOpen(true)} title="Edit Deal">
                <Edit className="w-4 h-4" />
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="sm:max-w-[500px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Edit Deal Details</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-6 px-1">
                        <div className="space-y-2">
                            <Label htmlFor="title">Deal Title (English)</Label>
                            <Input 
                                id="title" 
                                value={formData.title_en} 
                                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="store">Store</Label>
                            <select
                                id="store"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.store_id}
                                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                                required
                            >
                                <option value="">Select a Store</option>
                                {stores.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Deal Price (AED)</Label>
                                <Input 
                                    id="price" 
                                    type="number"
                                    step="0.01"
                                    value={formData.deal_price} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, deal_price: val === '' ? '' : parseFloat(val) })
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="original">Original Price (AED)</Label>
                                <Input 
                                    id="original" 
                                    type="number"
                                    step="0.01"
                                    value={formData.original_price} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, original_price: val === '' ? '' : parseFloat(val) })
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="affiliate">Affiliate / Redirection Link</Label>
                            <Input 
                                id="affiliate" 
                                value={formData.affiliate_url} 
                                onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })}
                                required
                                placeholder="https://amazon.ae/..."
                            />
                            <p className="text-[10px] text-muted-foreground italic">Important: This is where users are sent when they click "Go to Deal".</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coupon">Coupon Value (Numeric only, if any)</Label>
                            <Input 
                                id="coupon" 
                                type="number"
                                value={formData.coupon_value} 
                                onChange={(e) => setFormData({ ...formData, coupon_value: e.target.value ? parseInt(e.target.value) : '' })}
                                placeholder="e.g. 10"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="active">Show this deal on the website (Active)</Label>
                        </div>

                        <SheetFooter className="pt-4 sticky bottom-0 bg-background pb-4">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" className="flex-1 font-bold" disabled={loading}>
                                {loading ? 'Saving...' : 'Update Deal'}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    )
}
