'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Zap, TrendingUp, Clock, ExternalLink, Image as ImageIcon, Box, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { deleteDeal, toggleDealActive, bulkDeleteDeals, bulkToggleDealsActive } from '@/app/[locale]/admin/deals/actions'
import { formatDistanceToNow } from 'date-fns'
import { EditDealModal } from '@/components/admin/deals/EditDealModal'

interface DealsTableClientProps {
    deals: any[]
    stores: any[]
    locale: string
}

export function DealsTableClient({ deals, stores, locale }: DealsTableClientProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isProcessing, setIsProcessing] = useState(false)

    const toggleAll = () => {
        if (selectedIds.size === deals.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(deals.map(d => d.id)))
        }
    }

    const toggleOne = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} deals? This cannot be undone.`)) return
        setIsProcessing(true)
        const res = await bulkDeleteDeals(Array.from(selectedIds), locale)
        if (!res.success) alert(`Failed: ${res.error}`)
        setSelectedIds(new Set())
        setIsProcessing(false)
    }

    const handleBulkToggleActive = async (active: boolean) => {
        setIsProcessing(true)
        const res = await bulkToggleDealsActive(Array.from(selectedIds), active, locale)
        if (!res.success) alert(`Failed: ${res.error}`)
        setSelectedIds(new Set())
        setIsProcessing(false)
    }

    return (
        <div className="space-y-4">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {selectedIds.size}
                        </div>
                        <span className="text-sm font-semibold text-blue-900">Items selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkToggleActive(true)}
                            disabled={isProcessing}
                            className="bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-8 text-xs font-bold"
                        >
                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                            Enable Selected
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkToggleActive(false)}
                            disabled={isProcessing}
                            className="bg-white text-amber-700 border-amber-200 hover:bg-amber-50 h-8 text-xs font-bold"
                        >
                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            Disable Selected
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isProcessing}
                            className="h-8 text-xs font-bold"
                        >
                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                            Delete Selected
                        </Button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-12 text-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                                    checked={deals.length > 0 && selectedIds.size === deals.length}
                                    onChange={toggleAll}
                                />
                            </TableHead>
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
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    No deals found. Use the Product Importer Extension to scoop deals!
                                </TableCell>
                            </TableRow>
                        ) : (
                            deals.map((deal) => {
                                const isExpired = deal.expires_at && new Date(deal.expires_at) < new Date()
                                const expiryText = deal.expires_at
                                    ? isExpired ? 'Expired' : formatDistanceToNow(new Date(deal.expires_at), { addSuffix: true })
                                    : '—'
                                const isSelected = selectedIds.has(deal.id)

                                return (
                                    <TableRow 
                                        key={deal.id} 
                                        className={`
                                            ${isExpired ? 'opacity-50 hover:bg-muted/50' : 'hover:bg-muted/50'}
                                            ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : ''}
                                        `}
                                    >
                                        <TableCell className="text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                                                checked={isSelected}
                                                onChange={() => toggleOne(deal.id)}
                                            />
                                        </TableCell>
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
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Go to Deal">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                <EditDealModal deal={deal} stores={stores || []} locale={locale} />
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 text-[11px] font-bold px-2"
                                                    onClick={() => toggleDealActive(deal.id, deal.is_active, locale)}
                                                >
                                                    {deal.is_active ? 'Disable' : 'Enable'}
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => confirm(`Delete this deal?`) && deleteDeal(deal.id, locale)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
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
