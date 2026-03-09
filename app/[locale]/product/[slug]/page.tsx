import { Locale } from '@/i18n/config'
import { AISummaryBlock } from '@/components/product/AISummaryBlock'
import { PriceComparisonTable } from '@/components/product/PriceComparisonTable'
import { Badge } from '@/components/ui/badge'
import { Check, Info, ShieldCheck, Share2, Heart } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { PriceAlertTrigger } from '@/components/product/PriceAlertTrigger'

export default async function ProductPage({
    params
}: {
    params: Promise<{ locale: string, slug: string }>
}) {
    const { slug, locale } = await params;
    const supabase = await createClient()

    const { data: product, error } = await supabase
        .from('products')
        .select(`
            *,
            categories(name_en),
            product_prices(
                current_price,
                original_price,
                discount_percent,
                affiliate_url,
                in_stock,
                stores(name, logo_url)
            )
        `)
        .eq('slug', slug)
        .single()

    if (error || !product) {
        notFound()
    }

    const categoryName = (product.categories as any)?.name_en || 'Uncategorized'

    // Convert JSONB specifications object to array for UI
    const specsObject = typeof product.specifications === 'object' && product.specifications !== null ? product.specifications as Record<string, string> : {}
    const specsArray = Object.entries(specsObject).map(([label, value]) => ({ label, value }))

    // Process real prices from DB
    const dbPrices = (product.product_prices as any[])?.map(p => ({
        store: p.stores?.name || 'Unknown Store',
        storeLogoUrl: p.stores?.logo_url,
        price: p.current_price,
        originalPrice: p.original_price,
        discount: Math.round(p.discount_percent || 0),
        inStock: p.in_stock,
        hasCOD: true, // Static for now as per schema
        hasTabby: true,
        isLowest: false, // Will calculate below
        affiliateUrl: p.affiliate_url || `/${locale}/go/unknown/${product.id}`
    })) || []

    // Sort to find lowest
    if (dbPrices.length > 0) {
        dbPrices.sort((a, b) => a.price - b.price);
        dbPrices[0].isLowest = true;
    }

    // Fallback prices if none in DB (UI test safety)
    const finalPrices = dbPrices.length > 0 ? dbPrices : [
        { store: 'Amazon AE', price: product.base_price, originalPrice: Math.round(product.base_price * 1.15), discount: 15, inStock: true, hasCOD: true, hasTabby: true, isLowest: true, affiliateUrl: `/${locale}/go/amazon/${product.id}` },
        { store: 'Noon', price: Math.round(product.base_price * 1.05), originalPrice: Math.round(product.base_price * 1.15), discount: 10, inStock: true, hasCOD: true, hasTabby: true, affiliateUrl: `/${locale}/go/noon/${product.id}` }
    ]

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <div className="text-sm text-muted-foreground mb-6">
                Home / {categoryName} / <span className="text-foreground">{product.name_en || product.name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                {/* Left: Images */}
                <div className="space-y-4">
                    <div className="aspect-square bg-white rounded-2xl border flex items-center justify-center p-4 overflow-hidden relative">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                        ) : (
                            <div className="text-muted-foreground/30 text-2xl font-bold tracking-widest">[No Image]</div>
                        )}
                    </div>
                </div>

                {/* Right: Details */}
                <div className="flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{product.name_en || product.name}</h1>
                        <div className="flex gap-2">
                            <button className="p-2 border rounded-full hover:bg-muted text-muted-foreground"><Share2 className="w-5 h-5" /></button>
                            <button className="p-2 border rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-muted-foreground"><Heart className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <Badge variant="secondary" className="font-medium text-xs">Best in {categoryName}</Badge>
                        <Badge variant="outline" className="font-medium text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300">Verified Deals Active</Badge>
                    </div>

                    <AISummaryBlock text={product.ai_summary_en || product.description_en || product.description || "The DeepSeek AI has not generated a summary for this product yet. It analyzes reviews across the web to give you an unbiased TL;DR."} />

                    <PriceAlertTrigger productId={product.id} productName={product.name} />

                    {/* Quick Specs */}
                    {specsArray.length > 0 && (
                        <div className="mb-8 p-4 bg-muted/30 rounded-xl border">
                            <h3 className="font-semibold mb-3 flex items-center"><Info className="w-4 h-4 mr-2 text-muted-foreground" /> Technical Specifications</h3>
                            <ul className="space-y-2">
                                {specsArray.map((spec, i) => (
                                    <li key={i} className="flex border-b border-border/50 pb-2 text-sm">
                                        <span className="w-1/3 text-muted-foreground">{spec.label}</span>
                                        <span className="w-2/3 font-medium text-foreground">{spec.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-4 border border-primary/10 mt-auto">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">UAEDISCOUNTHUB Secure Shopping</p>
                            <p className="text-xs text-muted-foreground">All listed sellers are verified authorized retailers in the GCC.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Pricing Table */}
            <div className="mb-16">
                <h2 className="text-2xl font-bold mb-6">Live Price Comparison</h2>
                <PriceComparisonTable prices={finalPrices} />
            </div>

        </div>
    )
}
