import { createClient } from '@/utils/supabase/server'
import { DealCard } from '@/components/home/DealCard'
import { getDictionary } from '@/i18n/dictionaries'
import { Locale } from '@/i18n/config'

export default async function SearchPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ q: string }>
}) {
    const { locale } = await params
    const { q: query } = await searchParams
    const dict = await getDictionary(locale as Locale)
    const supabase = await createClient()

    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .or(`name_en.ilike.%${query}%,description_en.ilike.%${query}%`)
        .limit(20)

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-12">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    {dict.common.search_results_for || 'Search results for'}: "{query}"
                </h1>
                <p className="text-muted-foreground">
                    {products?.length || 0} {dict.common.products_found || 'products found'}
                </p>
            </div>

            {!products || products.length === 0 ? (
                <div className="text-center py-24 border rounded-2xl bg-muted/20 border-dashed">
                    <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                        {dict.common.no_products_found || "We couldn't find any products matching your search."}
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Try checking for typos or using more general keywords like "iPhone" or "Samsung".
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <DealCard
                            key={product.id}
                            id={product.id}
                            name={product.name_en}
                            slug={product.slug}
                            image_url={(product.images as any)?.[0]?.url}
                            base_price={product.base_price || 0}
                            originalPrice={(product.base_price || 0) * 1.15}
                            discountPercent={15}
                            store="Multiple Stores"
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
