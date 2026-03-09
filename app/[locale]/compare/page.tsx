import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

export default async function ComparePage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>,
    searchParams: Promise<{ ids?: string }>
}) {
    const { locale } = await params;
    const { ids } = await searchParams;
    const productIds = ids?.split(',').filter(Boolean) || [];

    const supabase = await createClient()

    // Fetch products based on IDs
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)

    if (error || !products || products.length === 0) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 py-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold mb-4">Product Comparison</h1>
                <p className="text-muted-foreground mb-8">No products selected for comparison. Please go back to the browse page and select some deals.</p>
                <a href={`/${locale}`} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold">Browse Deals</a>
            </div>
        )
    }

    // Extract all unique spec keys from all selected products
    const allSpecKeys = Array.from(new Set(
        products.flatMap(p => Object.keys(p.specifications || {}))
    ));

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-foreground mb-3">Compare Tech Deals</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">Side-by-side spec comparison of your selected items to help you find the best value.</p>
            </div>

            <div className="overflow-x-auto shadow-xl rounded-2xl border bg-card">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b bg-muted/30">
                            <th className="p-8 text-left border-r min-w-[200px] bg-muted/10">
                                <div className="text-xl font-bold text-primary">Features & Specs</div>
                                <div className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">{products.length} Items Selected</div>
                            </th>
                            {products.map(prod => (
                                <th key={prod.id} className="p-6 border-r last:border-0 align-top text-center min-w-[280px]">
                                    <div className="relative w-32 h-32 mx-auto bg-white border rounded-2xl mb-6 overflow-hidden shadow-sm">
                                        {prod.image_url ? (
                                            <Image
                                                src={prod.image_url}
                                                alt={prod.name_en}
                                                fill
                                                className="object-contain p-3"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground uppercase font-bold">No Image</div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg mb-3 line-clamp-2 min-h-[3.5rem] leading-tight px-2">{prod.name_en}</h3>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="text-2xl font-black text-primary">AED {prod.base_price}</div>
                                        <Badge variant="secondary" className="font-bold">
                                            {prod.brand_name || 'Electronics'}
                                        </Badge>
                                        <a
                                            href={`/${locale}/product/${prod.slug}`}
                                            className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20"
                                        >
                                            View Full Deal
                                        </a>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {allSpecKeys.map((key, i) => (
                            <tr key={key} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/5'}>
                                <td className="p-5 border-r font-bold text-muted-foreground bg-muted/5 uppercase text-[11px] tracking-widest">{key}</td>
                                {products.map((prod) => (
                                    <td key={prod.id} className="p-5 border-r last:border-0 text-center font-semibold text-sm">
                                        {(prod.specifications as Record<string, any>)?.[key] !== undefined ? (
                                            typeof (prod.specifications as Record<string, any>)[key] === 'boolean' ? (
                                                (prod.specifications as Record<string, any>)[key] ?
                                                    <Check className="w-6 h-6 mx-auto text-green-500 stroke-[3px]" /> :
                                                    <X className="w-6 h-6 mx-auto text-red-400" />
                                            ) : (
                                                <span className="text-foreground">{(prod.specifications as Record<string, any>)[key]}</span>
                                            )
                                        ) : (
                                            <span className="text-muted-foreground/40">—</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-12 p-8 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h4 className="text-xl font-bold text-primary mb-1">Found the winner?</h4>
                    <p className="text-muted-foreground">Prices fluctuate quickly. Set an alert to get notified on WhatsApp when the price drops further.</p>
                </div>
                <Button size="lg" variant="default" className="font-bold h-14 px-8 rounded-2xl shadow-lg shadow-primary/20">Set Price Alarm</Button>
            </div>
        </div>
    )
}
