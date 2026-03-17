import { createAdminClient } from '@/utils/supabase/admin'
import { PlusCircle, Edit, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { deleteProductById } from './product-actions'

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

  if (status && status !== 'all') query = query.eq('status', status)
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
      <div className="flex items-center justify-between mb-6">
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
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, alignItems: 'center' }}>
        {filters.map((f) => {
          const active = (status ?? 'all') === f
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
              {f}
            </Link>
          )
        })}
        <form method="get" action={`/${locale}/admin/products`} style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
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
              width: 200,
            }}
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
      <div
        style={{
          background: '#fff',
          border: '1.5px solid #DDE3EF',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F6F8FC', borderBottom: '1.5px solid #DDE3EF' }}>
              {['Product', 'Category', 'Status', 'Stores', 'Base Price', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#8A94A6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!products || products.length === 0) ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: '48px 16px', textAlign: 'center', color: '#8A94A6', fontSize: 13 }}
                >
                  No products found. Try changing your filters or add a new product.
                </td>
              </tr>
            ) : (
              products.map((product, i) => {
                const thumb = product.thumbnail_url || product.image_url
                const statusKey = (product.status ?? 'draft') as string
                const cat = (product.categories as { name_en?: string } | null)?.name_en
                const storeCount = storeCounts[product.id] ?? 0

                return (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: i < products.length - 1 ? '1px solid #F0F2F7' : 'none',
                    }}
                  >
                    {/* Product */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            border: '1px solid #DDE3EF',
                            overflow: 'hidden',
                            background: '#F6F8FC',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={product.name_en ?? ''}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: 16, color: '#DDE3EF' }}>📦</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1117' }}>
                            {product.name_en}
                          </div>
                          <div style={{ fontSize: 11, color: '#8A94A6', marginTop: 1 }}>
                            /{product.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#5A6476',
                          background: '#F6F8FC',
                          border: '1px solid #DDE3EF',
                          borderRadius: 20,
                          padding: '3px 10px',
                        }}
                      >
                        {cat ?? 'Uncategorized'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 20,
                          padding: '3px 10px',
                          border: '1px solid',
                          textTransform: 'capitalize',
                        }}
                        className={STATUS_STYLES[statusKey] ?? STATUS_STYLES.draft}
                      >
                        {statusKey}
                      </span>
                    </td>

                    {/* Stores */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: storeCount > 0 ? '#0057FF' : '#8A94A6',
                        }}
                      >
                        {storeCount > 0 ? `${storeCount} store${storeCount > 1 ? 's' : ''}` : '—'}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0D1117' }}>
                        {product.base_price != null
                          ? `AED ${product.base_price.toLocaleString()}`
                          : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <Link
                          href={`/${locale}/product/${product.slug}`}
                          target="_blank"
                          title="View"
                          style={{ color: '#8A94A6', padding: 6, borderRadius: 6, display: 'flex' }}
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/${locale}/admin/products/${product.id}/edit`}
                          title="Edit"
                          style={{ color: '#0057FF', padding: 6, borderRadius: 6, display: 'flex' }}
                        >
                          <Edit size={15} />
                        </Link>
                        <form
                          action={async () => {
                            'use server'
                            await deleteProductById(product.id, product.slug ?? '', locale)
                          }}
                          style={{ display: 'inline' }}
                        >
                          <button
                            type="submit"
                            title="Delete"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#EF4444',
                              padding: 6,
                              borderRadius: 6,
                              display: 'flex',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
