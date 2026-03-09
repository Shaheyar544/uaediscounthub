import { DealCard } from '@/components/home/DealCard'
import { FacetedFilters } from '@/components/search/FacetedFilters'
import { createClient } from '@/utils/supabase/server'

export default async function CategoryPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string, slug: string }>
    searchParams: Promise<{
        minPrice?: string,
        maxPrice?: string,
        brand?: string,
        ram?: string,
        storage?: string
    }>
}) {
    const { slug } = await params;
    const { minPrice, maxPrice, brand, ram, storage } = await searchParams;
    const categoryQueryName = slug.replace('-', ' ')

    const supabase = await createClient()

    let query = supabase
        .from('products')
        .select('*, categories!inner(name)')
        .ilike('categories.name', `%${categoryQueryName}%`)

    // Apply Price Filters
    if (minPrice) query = query.gte('base_price', Number(minPrice))
    if (maxPrice) query = query.lte('base_price', Number(maxPrice))

    // Apply Brand Filters
    if (brand) {
        const brands = brand.split(',')
        query = query.in('brand_name', brands) // Assuming brand_name is a field or we might need another join
    }

    // Apply Specs Filters (JSONB filtering)
    if (ram) {
        const ramValues = ram.split(',')
        query = query.contains('specifications', { RAM: ramValues[0] }) // Basic JSONB match for now
    }
    if (storage) {
        const storageValues = storage.split(',')
        query = query.contains('specifications', { Storage: storageValues[0] })
    }

    const { data: products } = await query.order('created_at', { ascending: false })

    const validProducts = products || []

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold capitalize text-primary">{categoryQueryName} Deals</h1>
                <p className="text-muted-foreground mt-2">Find the best prices and deep specs for {categoryQueryName} across the GCC.</p>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
                <FacetedFilters />

                <div className="flex-1 w-full space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <span className="text-sm font-medium">{validProducts.length} Products Found</span>
                        <select className="bg-background border rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none">
                            <option>Sort by Recommended</option>
                            <option>Sort by Price: Low to High</option>
                            <option>Sort by Highest Discount</option>
                        </select>
                    </div>

                    {validProducts.length === 0 ? (
                        <div className="h-48 w-full border border-dashed rounded-xl flex items-center justify-center text-muted-foreground bg-muted/20">
                            No products found in the database.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {validProducts.map(product => (
                                <DealCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    slug={product.slug}
                                    image_url={product.image_url}
                                    base_price={product.base_price}
                                    originalPrice={product.base_price ? product.base_price * 1.15 : 0}
                                    discountPercent={15}
                                    store="Amazon AE"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
