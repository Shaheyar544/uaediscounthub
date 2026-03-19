'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteProductById } from '@/app/[locale]/admin/products/product-actions'

export function DeleteProductButton({
  productId,
  productName,
  slug,
  locale,
}: {
  productId: string
  productName: string
  slug: string
  locale: string
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete "${productName}"?\n\nThis cannot be undone.`)) return
    setDeleting(true)
    try {
      const result = await deleteProductById(productId, slug, locale)
      if (!result.success) {
        alert(`Delete failed: ${result.error}`)
      }
    } catch {
      alert('Delete failed — please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      title="Delete"
      style={{
        background: 'none',
        border: 'none',
        cursor: deleting ? 'not-allowed' : 'pointer',
        color: '#EF4444',
        padding: 6,
        borderRadius: 6,
        display: 'flex',
        opacity: deleting ? 0.5 : 1,
      }}
    >
      {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  )
}
