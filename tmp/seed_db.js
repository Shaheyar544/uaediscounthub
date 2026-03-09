const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log('🚀 Final Seeding Attempt...')

    // 1. Categories
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .insert([
            { name_en: 'Smartphones', name_ar: 'هواتف ذكية', slug: 'smartphones', is_active: true },
            { name_en: 'Laptops', name_ar: 'لابتوب', slug: 'laptops', is_active: true }
        ])
        .select()

    if (catError) console.error('Category error:', catError.message)
    const phoneCat = categories?.find(c => c.slug === 'smartphones')?.id

    // 2. Stores
    const { data: stores, error: storeError } = await supabase
        .from('stores')
        .insert([
            { name: 'Amazon AE', slug: 'amazon-ae', base_url: 'https://amazon.ae', is_active: true }
        ])
        .select()

    if (storeError) console.error('Store error:', storeError.message)

    // 3. Products
    if (phoneCat) {
        const { error: prodError } = await supabase
            .from('products')
            .insert([
                {
                    name_en: 'Samsung Galaxy S24 Ultra',
                    slug: 'samsung-s24-ultra',
                    base_price: 3899,
                    category_id: phoneCat,
                    is_active: true
                }
            ])

        if (prodError) console.error('Product seed error:', prodError.message)
        else console.log('✅ Success!')
    }
}

seed()
