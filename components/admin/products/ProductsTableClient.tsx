'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Edit, Eye, Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react'
import { DeleteProductButton } from './DeleteProductButton'
import { bulkSoftDeleteProducts, bulkRestoreProducts, bulkHardDeleteProducts, softDeleteProductById, deleteProductById } from '@/app/[locale]/admin/products/product-actions'

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-red-50 text-red-700 border-red-200', // Treated as Trash visually
}

interface ProductWithData {
  id: string
  name_en: string | null
  slug: string | null
  thumbnail_url: string | null
  image_url: string | null
  status: string | null
  base_price: number | null
  categories: { name_en?: string } | null | any
}

interface ProductsTableClientProps {
  products: ProductWithData[]
  locale: string
  storeCounts: Record<string, number>
  currentStatus: string
}

export function ProductsTableClient({ products, locale, storeCounts, currentStatus }: ProductsTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  const isTrashTab = currentStatus === 'archived'

  const toggleAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map(p => p.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkSoftDelete = async () => {
    if (!confirm(`Are you sure you want to move ${selectedIds.size} items to the trash?`)) return
    setIsProcessing(true)
    const res = await bulkSoftDeleteProducts(Array.from(selectedIds), locale)
    if (!res.success) alert(`Failed: ${res.error}`)
    setSelectedIds(new Set())
    setIsProcessing(false)
  }

  const handleBulkRestore = async () => {
    setIsProcessing(true)
    const res = await bulkRestoreProducts(Array.from(selectedIds), locale)
    if (!res.success) alert(`Failed: ${res.error}`)
    setSelectedIds(new Set())
    setIsProcessing(false)
  }

  const handleBulkHardDelete = async () => {
    if (!confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${selectedIds.size} items? This cannot be undone.`)) return
    setIsProcessing(true)
    const res = await bulkHardDeleteProducts(Array.from(selectedIds), locale)
    if (!res.success) alert(`Failed: ${res.error}`)
    setSelectedIds(new Set())
    setIsProcessing(false)
  }

  const handleSingleRestore = async (id: string) => {
    setIsProcessing(true)
    const res = await bulkRestoreProducts([id], locale)
    if (!res.success) alert(`Failed: ${res.error}`)
    setIsProcessing(false)
  }

  const handleSingleHardDelete = async (id: string, name: string, slug: string) => {
    if (!confirm(`WARNING: Permanently delete "${name}"? This cannot be undone.`)) return
    setIsProcessing(true)
    const res = await deleteProductById(id, slug, locale)
    if (!res.success) alert(`Failed: ${res.error}`)
    setIsProcessing(false)
  }

  const handleSingleSoftDelete = async (id: string, name: string) => {
    if (!confirm(`Move "${name}" to Trash?`)) return
    setIsProcessing(true)
    const res = await softDeleteProductById(id, locale)
    if (!res.success) alert(`Failed: ${res.error}`)
    setIsProcessing(false)
  }

  return (
    <div>
      {/* Bulk Actions Header */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between animate-in fade-in duration-200">
          <div className="text-sm font-medium text-blue-800">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-2">
            {isTrashTab ? (
              <>
                <button 
                  onClick={handleBulkRestore} 
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-white text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold hover:bg-emerald-50 disabled:opacity-50 flex items-center gap-1"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Restore
                </button>
                <button 
                  onClick={handleBulkHardDelete} 
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-red-600 text-white border border-red-600 rounded-md text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} Delete Permanently
                </button>
              </>
            ) : (
              <button 
                onClick={handleBulkSoftDelete} 
                disabled={isProcessing}
                className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-md text-xs font-bold hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
              >
                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Move to Trash
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1.5px solid #DDE3EF', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F6F8FC', borderBottom: '1.5px solid #DDE3EF' }}>
              <th style={{ padding: '10px 16px', width: 40 }}>
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 w-4 h-4"
                  checked={products.length > 0 && selectedIds.size === products.length}
                  onChange={toggleAll}
                />
              </th>
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
                  colSpan={7}
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
                const isSelected = selectedIds.has(product.id)

                return (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: i < products.length - 1 ? '1px solid #F0F2F7' : 'none',
                      backgroundColor: isSelected ? '#F0F7FF' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleOne(product.id)}
                      />
                    </td>

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
                        {statusKey === 'archived' ? 'Trash' : statusKey}
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
                        {isTrashTab ? (
                          <>
                            <button
                              onClick={() => handleSingleRestore(product.id)}
                              title="Restore"
                              style={{ color: '#059669', padding: 6, borderRadius: 6, display: 'flex' }}
                              className="hover:bg-emerald-50"
                            >
                              <RotateCcw size={15} />
                            </button>
                            <button
                              onClick={() => handleSingleHardDelete(product.id, product.name_en ?? '', product.slug ?? '')}
                              title="Permadelete"
                              style={{ color: '#DC2626', padding: 6, borderRadius: 6, display: 'flex' }}
                              className="hover:bg-red-50"
                            >
                              <AlertTriangle size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/${locale}/product/${product.slug}`}
                              target="_blank"
                              title="View"
                              style={{ color: '#8A94A6', padding: 6, borderRadius: 6, display: 'flex' }}
                              className="hover:bg-gray-100"
                            >
                              <Eye size={15} />
                            </Link>
                            <Link
                              href={`/${locale}/admin/products/${product.id}/edit`}
                              title="Edit"
                              style={{ color: '#0057FF', padding: 6, borderRadius: 6, display: 'flex' }}
                              className="hover:bg-blue-50"
                            >
                              <Edit size={15} />
                            </Link>
                            <button
                              onClick={() => handleSingleSoftDelete(product.id, product.name_en ?? '')}
                              title="Move to Trash"
                              style={{ color: '#EF4444', padding: 6, borderRadius: 6, display: 'flex' }}
                              className="hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
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
