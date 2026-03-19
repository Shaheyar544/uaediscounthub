'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ImageUpload } from '@/components/admin/ImageUpload'
import {
  Plus, Search, Edit3, Trash2, FolderTree, Loader2, Save, X,
  ChevronUp, ChevronDown, Globe, Palette,
} from 'lucide-react'

interface Category {
  id: string
  slug: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  icon_url?: string
  logo_url?: string
  icon_emoji?: string
  color?: string
  meta_title?: string
  meta_description?: string
  is_active: boolean
  parent_id?: string
  display_order: number
}

const COLORS = ['blue', 'purple', 'red', 'green', 'orange', 'cyan', 'pink', 'yellow'] as const
type ColorOption = (typeof COLORS)[number]

const COLOR_HEX: Record<ColorOption, string> = {
  blue:   '#3B82F6',
  purple: '#8B5CF6',
  red:    '#EF4444',
  green:  '#22C55E',
  orange: '#F97316',
  cyan:   '#06B6D4',
  pink:   '#EC4899',
  yellow: '#EAB308',
}

export default function CategoriesClient({ locale }: { locale: string }) {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('display_order', { ascending: true }),
      supabase.from('products').select('category_id').eq('is_active', true),
    ])

    if (cats) setCategories(cats)
    if (prods) {
      const counts: Record<string, number> = {}
      for (const p of prods) {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1
      }
      setProductCounts(counts)
    }
    setLoading(false)
  }

  const update = (fields: Partial<Category>) =>
    setEditingCategory(prev => ({ ...prev!, ...fields }))

  const handleOpenModal = (category: Category | null = null) => {
    setEditingCategory(
      category || {
        name_en: '',
        name_ar: '',
        slug: '',
        description_en: '',
        description_ar: '',
        is_active: true,
        display_order: categories.length,
        color: 'blue',
      }
    )
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory?.name_en || !editingCategory?.slug) return

    setSaving(true)
    try {
      const payload = {
        name_en:          editingCategory.name_en,
        name_ar:          editingCategory.name_ar || '',
        slug:             editingCategory.slug,
        description_en:   editingCategory.description_en || '',
        description_ar:   editingCategory.description_ar || '',
        icon_url:         editingCategory.icon_url || null,
        logo_url:         editingCategory.logo_url || null,
        icon_emoji:       editingCategory.icon_emoji || null,
        color:            editingCategory.color || 'blue',
        meta_title:       editingCategory.meta_title || null,
        meta_description: editingCategory.meta_description || null,
        is_active:        editingCategory.is_active ?? true,
        parent_id:        editingCategory.parent_id || null,
        display_order:    Number(editingCategory.display_order) || 0,
      }

      if (editingCategory.id) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert([payload])
        if (error) throw error
      }

      await fetchCategories()
      setIsModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to save category: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) alert('Failed to delete')
    else fetchCategories()
  }

  const toggleStatus = async (category: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)
    if (error) alert('Failed to update status')
    else fetchCategories()
  }

  const handleReorder = async (category: Category, dir: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order)
    const idx = sorted.findIndex(c => c.id === category.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx]
    const b = sorted[swapIdx]
    await Promise.all([
      supabase.from('categories').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('categories').update({ display_order: a.display_order }).eq('id', b.id),
    ])
    fetchCategories()
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (!selectedIds.length) return
    if (action === 'delete' && !confirm(`Delete ${selectedIds.length} categories?`)) return
    setBulkLoading(true)
    try {
      if (action === 'delete') {
        await supabase.from('categories').delete().in('id', selectedIds)
      } else {
        await supabase
          .from('categories')
          .update({ is_active: action === 'activate' })
          .in('id', selectedIds)
      }
      setSelectedIds([])
      await fetchCategories()
    } finally {
      setBulkLoading(false)
    }
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

  const filtered = categories.filter(
    c =>
      c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allSelected = filtered.length > 0 && filtered.every(c => selectedIds.includes(c.id))

  const metaTitle = editingCategory?.meta_title || ''
  const metaDesc  = editingCategory?.meta_description || ''

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0D1117]">Categories Management</h1>
          <p className="text-[13px] text-[#8A94A6] mt-1">
            Organize products into dynamic categories
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#0057FF] text-white px-5 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)]"
        >
          <Plus size={16} /> Create Category
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-5 border-b border-[#DDE3EF] flex items-center justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" size={14} />
            <input
              type="text"
              placeholder="Search categories..."
              className="pl-9 pr-4 py-1.5 bg-[#F6F8FC] border border-[#DDE3EF] rounded-full text-[12px] outline-none focus:border-[#0057FF] w-64"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-[12px] text-[#8A94A6] font-medium">{categories.length} categories</span>
        </div>

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border-b border-blue-100 px-5 py-3">
            <span className="font-bold text-[13px] text-blue-700">{selectedIds.length} selected</span>
            <button
              onClick={() => handleBulkAction('activate')}
              disabled={bulkLoading}
              className="px-3 py-1 text-[11px] font-bold bg-[#e6faf5] text-[#00C48C] rounded-full hover:bg-[#ccf7eb] transition-colors disabled:opacity-50"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              disabled={bulkLoading}
              className="px-3 py-1 text-[11px] font-bold bg-[#FFF0EF] text-[#FF6B00] rounded-full hover:bg-[#ffe0dd] transition-colors disabled:opacity-50"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={bulkLoading}
              className="px-3 py-1 text-[11px] font-bold bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {bulkLoading ? 'Working…' : 'Delete'}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="ml-auto text-[11px] text-[#8A94A6] hover:text-[#0D1117]"
            >
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#0057FF]" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-[#8A94A6]">No categories found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#F6F8FC] border-b border-[#DDE3EF]">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        allSelected ? setSelectedIds([]) : setSelectedIds(filtered.map(c => c.id))
                      }
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Image</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Name (EN/AR)</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Slug</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Products</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Order</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(category => (
                  <tr
                    key={category.id}
                    className="border-b border-[#DDE3EF] last:border-none hover:bg-[#F6F8FC] transition-colors"
                  >
                    {/* Checkbox */}
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(category.id)}
                        onChange={e =>
                          e.target.checked
                            ? setSelectedIds(p => [...p, category.id])
                            : setSelectedIds(p => p.filter(id => id !== category.id))
                        }
                        className="w-4 h-4 rounded"
                      />
                    </td>

                    {/* Image / emoji */}
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-lg bg-[#F6F8FC] border border-[#DDE3EF] flex items-center justify-center overflow-hidden">
                        {category.logo_url || category.icon_url ? (
                          <img
                            src={category.logo_url || category.icon_url}
                            alt={category.name_en}
                            className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : category.icon_emoji ? (
                          <span className="text-xl leading-none">{category.icon_emoji}</span>
                        ) : (
                          <FolderTree size={18} className="text-[#8A94A6]" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {category.color && COLOR_HEX[category.color as ColorOption] && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLOR_HEX[category.color as ColorOption] }}
                          />
                        )}
                        <div>
                          <div className="font-bold text-[13px] text-[#0D1117]">{category.name_en}</div>
                          {category.name_ar && (
                            <div className="text-[11px] text-[#8A94A6] mt-0.5 font-arabic" dir="rtl">
                              {category.name_ar}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="p-4">
                      <code className="text-[11px] bg-[#F6F8FC] px-2 py-0.5 rounded border border-[#DDE3EF] text-[#4B5675]">
                        {category.slug}
                      </code>
                    </td>

                    {/* Product count */}
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-[#E8F0FF] text-[#0057FF] text-[11px] font-bold rounded-full">
                        {productCounts[category.id] ?? 0} products
                      </span>
                    </td>

                    {/* Order */}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-bold text-[#0D1117] w-7 text-center">
                          {category.display_order}
                        </span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => handleReorder(category, 'up')}
                            className="p-0.5 text-[#8A94A6] hover:text-[#0057FF] hover:bg-[#E8F0FF] rounded"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            onClick={() => handleReorder(category, 'down')}
                            className="p-0.5 text-[#8A94A6] hover:text-[#0057FF] hover:bg-[#E8F0FF] rounded"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(category)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
                          category.is_active
                            ? 'bg-[#e6faf5] text-[#00C48C]'
                            : 'bg-[#FFF0EF] text-[#FF3B30]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            category.is_active ? 'bg-[#00C48C]' : 'bg-[#FF3B30]'
                          }`}
                        />
                        {category.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-2 text-[#4B5675] hover:text-[#0057FF] hover:bg-[#e8f0ff] rounded-lg transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-[#4B5675] hover:text-[#FF3B30] hover:bg-[#FFF0EF] rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal header */}
            <div className="p-6 border-b border-[#DDE3EF] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#0D1117]">
                  {editingCategory?.id ? 'Edit Category' : 'New Category'}
                </h2>
                <p className="text-[12px] text-[#8A94A6]">Configure details, image, and SEO metadata</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F6F8FC] rounded-full">
                <X size={20} className="text-[#8A94A6]" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                    Name (EN) *
                  </label>
                  <input
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                    placeholder="e.g., Smartphones"
                    value={editingCategory?.name_en || ''}
                    onChange={e => {
                      const name = e.target.value
                      update({
                        name_en: name,
                        slug: editingCategory?.id ? editingCategory.slug : generateSlug(name),
                      })
                    }}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider text-right block">
                    Name (AR)
                  </label>
                  <input
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none text-right"
                    placeholder="الهواتف الذكية"
                    value={editingCategory?.name_ar || ''}
                    onChange={e => update({ name_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Slug *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#8A94A6] font-mono">
                    /category/
                  </span>
                  <input
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] pl-20 pr-3 py-2 text-[13px] font-mono text-[#0057FF] focus:border-[#0057FF] outline-none"
                    value={editingCategory?.slug || ''}
                    onChange={e => update({ slug: generateSlug(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                    Description (EN)
                  </label>
                  <textarea
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none min-h-[80px] resize-none"
                    placeholder="Describe this category…"
                    value={editingCategory?.description_en || ''}
                    onChange={e => update({ description_en: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider text-right block">
                    Description (AR)
                  </label>
                  <textarea
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none min-h-[80px] resize-none text-right"
                    placeholder="وصف هذه الفئة…"
                    value={editingCategory?.description_ar || ''}
                    onChange={e => update({ description_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Image upload */}
              <ImageUpload
                value={editingCategory?.logo_url || ''}
                onChange={url => update({ logo_url: url })}
                label="Category Image"
                description="Recommended: 400×400px square. Stored in Cloudflare R2."
                folder="categories"
              />

              {/* Emoji + Color */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                    Emoji Icon
                  </label>
                  <input
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[20px] focus:border-[#0057FF] outline-none"
                    placeholder="📱"
                    maxLength={2}
                    value={editingCategory?.icon_emoji || ''}
                    onChange={e => update({ icon_emoji: e.target.value })}
                  />
                  <p className="text-[10px] text-[#8A94A6]">Fallback when no image is uploaded</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider flex items-center gap-1.5">
                    <Palette size={12} /> Theme Color
                  </label>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => update({ color })}
                        title={color}
                        className="w-7 h-7 rounded-full transition-all"
                        style={{
                          backgroundColor: COLOR_HEX[color],
                          outline:
                            editingCategory?.color === color
                              ? `3px solid #0D1117`
                              : '3px solid transparent',
                          outlineOffset: '2px',
                          transform: editingCategory?.color === color ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Organization */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                    placeholder="0"
                    value={editingCategory?.display_order ?? 0}
                    onChange={e => update({ display_order: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                    Parent Category
                  </label>
                  <select
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                    value={editingCategory?.parent_id || ''}
                    onChange={e => update({ parent_id: e.target.value || undefined })}
                  >
                    <option value="">No parent (top level)</option>
                    {categories
                      .filter(c => c.id !== editingCategory?.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name_en}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* SEO */}
              <div className="border-t border-[#DDE3EF] pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={14} className="text-[#8A94A6]" />
                  <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                    SEO Settings
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                        Meta Title
                      </label>
                      <span
                        className={`text-[10px] font-bold ${
                          metaTitle.length > 55 ? 'text-[#FF6B00]' : 'text-[#8A94A6]'
                        }`}
                      >
                        {metaTitle.length}/60
                      </span>
                    </div>
                    <input
                      className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                      placeholder="Best Smartphones in UAE 2026 | UAE Discount Hub"
                      maxLength={60}
                      value={metaTitle}
                      onChange={e => update({ meta_title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                        Meta Description
                      </label>
                      <span
                        className={`text-[10px] font-bold ${
                          metaDesc.length > 150 ? 'text-[#FF6B00]' : 'text-[#8A94A6]'
                        }`}
                      >
                        {metaDesc.length}/160
                      </span>
                    </div>
                    <textarea
                      className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none min-h-[80px] resize-none"
                      placeholder="Compare prices on the latest smartphones from top UAE retailers…"
                      maxLength={160}
                      value={metaDesc}
                      onChange={e => update({ meta_description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 bg-[#F6F8FC] p-4 rounded-xl">
                <input
                  type="checkbox"
                  id="cat_active"
                  className="w-4 h-4 rounded"
                  checked={editingCategory?.is_active ?? true}
                  onChange={e => update({ is_active: e.target.checked })}
                />
                <label htmlFor="cat_active" className="text-[13px] font-bold text-[#0D1117] cursor-pointer">
                  Active — show in navigation and filters
                </label>
              </div>
            </form>

            {/* Modal footer */}
            <div className="p-6 border-t border-[#DDE3EF] bg-[#F6F8FC] flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-[13px] font-bold text-[#4B5675] hover:text-[#0D1117] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#00C48C] text-white px-6 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#00A070] transition-all shadow-[0_4px_12px_rgba(0,196,140,0.2)] disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {editingCategory?.id ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
