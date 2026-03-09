const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    console.log('Checking Supabase Connection...')
    console.log('URL:', supabaseUrl)

    // Check for products table
    const { data: products, error: pError } = await supabase.from('products').select('*').limit(1)
    if (pError) {
        console.error('Products table error:', pError.message)
    } else {
        console.log('Products table accessible. Found:', products.length, 'records.')
    }

    // Check for schema
    const { data: schema, error: sError } = await supabase.rpc('get_tables_info')
    // If rpc doesnt exist, try a direct query to information_schema if enabled (usually not for anon)

    // Fallback: list of intended tables
    const tables = ['products', 'categories', 'stores', 'coupons', 'newsletter_subscribers', 'price_alerts']
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true })
        if (error) {
            console.log(`Table [${table}]: NOT FOUND or INACCESSIBLE (${error.message})`)
        } else {
            console.log(`Table [${table}]: FOUND`)
        }
    }
}

checkTables()
