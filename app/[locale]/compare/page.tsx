import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, ExternalLink, ArrowRight, Store, BarChart2 } from 'lucide-react'

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

    // Fetch products based on IDs with store prices
    const { data: products, error } = await supabase
        .from('products')
        .select(`
            *,
            product_store_prices (
                price,
                original_price,
                discount_percent,
                affiliate_url,
                in_stock,
                stores (
                    name,
                    logo_url,
                    slug
                )
            )
        `)
        .in('id', productIds)

    if (error || !products || products.length === 0) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 py-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <h1 className="text-3xl font-extrabold mb-4">Product Comparison</h1>
                <p className="text-muted-foreground mb-8 text-lg">No products selected for comparison. Please go back to the browse page and select some deals.</p>
                <a href={`/${locale}`} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20">
                    Browse Deals
                </a>
            </div>
        )
    }

    // Extract all unique spec keys
    const allSpecKeys = Array.from(new Set(
        products.flatMap(p => Object.keys((p.specifications as Record<string, any>) || {}))
    ));

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-12">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="px-4 py-1 rounded-full border-blue-200 text-blue-600 font-bold bg-blue-50">Comparison Mode</Badge>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Side-by-Side Comparison</h1>
                <p className="text-gray-500 max-w-2xl mx-auto font-medium">We've gathered all the data from major stores to help you choose the best value for your money.</p>
            </div>

            {/* Price Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 flex flex-col h-full hover:border-blue-200 transition-colors">
                        <div className="relative aspect-square w-full mb-6 bg-gray-50 rounded-2xl overflow-hidden p-4">
                            {product.image_url ? (
                                <Image
                                    src={product.image_url}
                                    alt={product.name_en}
                                    fill
                                    className="object-contain p-2"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 uppercase font-black">No Image</div>
                            )}
                        </div>
                        
                        <div className="space-y-4 flex-1">
                            <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight h-10">{product.name_en}</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-blue-600">AED {product.base_price}</span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Current Base</span>
                            </div>

                            <div className="pt-4 border-t border-gray-50 space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <Store size={12} className="text-blue-500" />
                                    Available Stores
                                </div>
                                <div className="space-y-2">
                                    {(product.product_store_prices as any[])?.map((sp: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 group hover:bg-blue-50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                {sp.stores?.logo_url ? (
                                                    <div className="w-6 h-6 rounded-md bg-white border border-gray-100 overflow-hidden relative">
                                                        <Image src={sp.stores.logo_url} alt={sp.stores.name} fill className="object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-md bg-blue-100 text-[8px] flex items-center justify-center font-bold">{sp.stores?.name?.charAt(0)}</div>
                                                )}
                                                <span className="text-[11px] font-bold text-gray-700">{sp.stores?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-gray-900">AED {sp.price}</span>
                                                <a 
                                                    href={sp.affiliate_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="p-1 px-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Spec Comparison Table */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl text-white">
                        <BarChart2 size={20} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Technical Specifications</h2>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/20 bg-white">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b bg-gray-50/50">
                                <th className="p-6 text-left border-r border-gray-100 min-w-[200px]">
                                    <div className="text-sm font-black text-gray-400 uppercase tracking-widest">Detail</div>
                                </th>
                                {products.map(prod => (
                                    <th key={prod.id} className="p-6 border-r border-gray-100 last:border-0 min-w-[200px]">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 p-1 flex-shrink-0 relative overflow-hidden">
                                                {prod.image_url && <Image src={prod.image_url} alt="" fill className="object-contain" />}
                                            </div>
                                            <span className="text-[11px] font-black text-gray-900 line-clamp-1 truncate">{prod.name_en}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {allSpecKeys.map((key) => (
                                <tr key={key} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-5 border-r border-gray-100 font-bold text-gray-400 uppercase text-[10px] tracking-widest bg-gray-50/20">{key}</td>
                                    {products.map((prod) => (
                                        <td key={prod.id} className="p-5 border-r border-gray-100 last:border-0 text-center font-bold text-sm text-gray-800">
                                            {(prod.specifications as Record<string, any>)?.[key] !== undefined ? (
                                                typeof (prod.specifications as Record<string, any>)[key] === 'boolean' ? (
                                                    (prod.specifications as Record<string, any>)[key] ?
                                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto"><Check className="w-3.5 h-3.5 text-green-600 stroke-[4px]" /></div> :
                                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mx-auto"><X className="w-3.5 h-3.5 text-red-600" /></div>
                                                ) : (
                                                    <span>{(prod.specifications as Record<string, any>)[key]}</span>
                                                )
                                            ) : (
                                                <span className="text-gray-200">—</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-10 rounded-[40px] bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 space-y-2">
                    <h3 className="text-3xl font-black tracking-tight">Ready to buy?</h3>
                    <p className="text-blue-100 max-w-sm font-medium">Get real-time price drop notifications for any of these products directly on your WhatsApp.</p>
                </div>
                <Button size="lg" className="relative z-10 bg-white text-blue-700 hover:bg-gray-100 font-black h-16 px-10 rounded-2xl shadow-xl shadow-black/20 uppercase tracking-wider text-sm">
                    Set Price Alert
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}
