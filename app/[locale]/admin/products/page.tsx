import { createAdminClient } from '@/utils/supabase/admin'
import { PlusCircle, Edit, Eye } from 'lucide-react'
import Link from 'next/link'
import { ProductsTableClient } from '@/components/admin/products/ProductsTableClient'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { locale } = await params
  const { status, q } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('products')
    .select(`
      id,
      name_en,
      slug,
      sku,
      thumbnail_url,
      image_url,
      status,
      is_featured,
      is_trending,
      base_price,
      created_at,
      categories ( name_en )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  } else {
    // Hide trash from 'all' view
    query = query.neq('status', 'archived')
  }
  
  if (q) query = query.ilike('name_en', `%${q}%`)

  const { data: products } = await query

  // Fetch store price counts per product
  const productIds = (products ?? []).map((p) => p.id)
  let storeCounts: Record<string, number> = {}
  if (productIds.length > 0) {
    const { data: priceCounts } = await supabase
      .from('product_store_prices')
      .select('product_id')
      .in('product_id', productIds)
    if (priceCounts) {
      priceCounts.forEach((row) => {
        storeCounts[row.product_id] = (storeCounts[row.product_id] ?? 0) + 1
      })
    }
  }

  const filters = ['all', 'published', 'draft', 'archived']

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Products Registry
          </h1>
          <p style={{ fontSize: 13, color: '#8A94A6', marginTop: 2 }}>
            Manage your global product catalog with multi-store pricing
          </p>
        </div>
        <Link
          href={`/${locale}/admin/products/new`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#0057FF',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <PlusCircle size={15} />
          Add Product
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = (status ?? 'all') === f
          const displayLabel = f === 'archived' ? 'trash' : f
          return (
            <Link
              key={f}
              href={`/${locale}/admin/products?status=${f}${q ? `&q=${q}` : ''}`}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                border: '1.5px solid',
                borderColor: active ? '#0057FF' : '#DDE3EF',
                background: active ? '#EBF1FF' : '#fff',
                color: active ? '#0057FF' : '#8A94A6',
                textTransform: 'capitalize',
              }}
            >
              {displayLabel}
            </Link>
          )
        })}
        <form method="get" action={`/${locale}/admin/products`} className="flex w-full flex-wrap gap-2 sm:ms-auto sm:w-auto">
          {status && status !== 'all' && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search products..."
            style={{
              border: '1.5px solid #DDE3EF',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              color: '#0D1117',
              outline: 'none',
            }}
            className="w-full sm:w-[200px]"
          />
          <button
            type="submit"
            style={{
              background: '#F6F8FC',
              border: '1.5px solid #DDE3EF',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              color: '#0D1117',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <ProductsTableClient 
        products={products as any[]}
        locale={locale}
        storeCounts={storeCounts}
        currentStatus={status ?? 'all'}
      />
    </div>
  )
}
