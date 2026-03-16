'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Plus, Search, Edit3, Trash2, FolderTree, CheckCircle, 
  XCircle, Loader2, Save, X, ImageIcon
} from 'lucide-react'

interface Category {
  id: string
  slug: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  icon_url?: string
  is_active: boolean
  parent_id?: string
  display_order: number
}

export default function CategoriesClient({ locale }: { locale: string }) {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (data) setCategories(data)
    setLoading(false)
  }

  const handleOpenModal = (category: Category | null = null) => {
    setEditingCategory(category || {
      name_en: '',
      name_ar: '',
      slug: '',
      description_en: '',
      is_active: true,
      display_order: 0
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory?.name_en || !editingCategory?.slug) return

    setSaving(true)
    try {
      if (editingCategory.id) {
        const { error } = await supabase
          .from('categories')
          .update(editingCategory)
          .eq('id', editingCategory.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([editingCategory])
        if (error) throw error
      }
      
      await fetchCategories()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) alert('Failed to delete category')
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

  const filteredCategories = categories.filter(c => 
    c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0D1117]">Categories Management</h1>
          <p className="text-[13px] text-[#8A94A6] mt-1">Organize products and blog posts into dynamic categories</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#0057FF] text-white px-5 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)]"
        >
          <Plus size={16} /> Create Category
        </button>
      </div>

      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#DDE3EF] flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          </div>
          <div className="text-[12px] text-[#8A94A6] font-medium">
            Total Categories: {categories.length}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#0057FF]" size={32} />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center text-[#8A94A6]">
            <p>No categories found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#F6F8FC] border-b border-[#DDE3EF]">
                <tr>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Icon</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Name (EN/AR)</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Slug</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b border-[#DDE3EF] last:border-none hover:bg-[#F6F8FC] transition-colors">
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-lg bg-[#F6F8FC] border border-[#DDE3EF] flex items-center justify-center text-[#8A94A6]">
                        {category.icon_url ? (
                          <img src={category.icon_url} alt="" className="w-6 h-6 object-contain" />
                        ) : (
                          <FolderTree size={18} />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[13px] text-[#0D1117]">{category.name_en}</div>
                      <div className="text-[11px] text-[#8A94A6] mt-0.5 font-arabic">{category.name_ar}</div>
                    </td>
                    <td className="p-4">
                      <code className="text-[11px] bg-[#F6F8FC] px-2 py-0.5 rounded border border-[#DDE3EF] text-[#4B5675]">
                        {category.slug}
                      </code>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(category)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
                          category.is_active ? 'bg-[#e6faf5] text-[#00C48C]' : 'bg-[#FFF0EF] text-[#FF3B30]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${category.is_active ? 'bg-[#00C48C]' : 'bg-[#FF3B30]'}`}></span>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#DDE3EF] flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#0D1117]">
                  {editingCategory?.id ? 'Edit Category' : 'New Category'}
                </h2>
                <p className="text-[12px] text-[#8A94A6]">Configure category details and metadata</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F6F8FC] rounded-full">
                <X size={20} className="text-[#8A94A6]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Category Name (EN)</label>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                    placeholder="e.g., Smartphones"
                    value={editingCategory?.name_en || ''}
                    onChange={e => {
                      const name = e.target.value
                      setEditingCategory({
                        ...editingCategory!, 
                        name_en: name,
                        slug: editingCategory?.id ? editingCategory.slug : generateSlug(name)
                      })
                    }}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider text-right block w-full">Category Name (AR)</label>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none text-right font-arabic"
                    placeholder="الهواتف الذكية"
                    value={editingCategory?.name_ar || ''}
                    onChange={e => setEditingCategory({...editingCategory!, name_ar: e.target.value})}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Slug</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#8A94A6] font-mono">/category/</span>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] pl-20 pr-3 py-2 text-[13px] font-mono text-[#0057FF] focus:border-[#0057FF] outline-none"
                    value={editingCategory?.slug || ''}
                    onChange={e => setEditingCategory({...editingCategory!, slug: generateSlug(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Description (EN)</label>
                <textarea 
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none min-h-[80px]"
                  placeholder="Describe this category..."
                  value={editingCategory?.description_en || ''}
                  onChange={e => setEditingCategory({...editingCategory!, description_en: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Icon URL</label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" size={14} />
                    <input 
                      className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] pl-9 pr-3 py-2 text-[13px] focus:border-[#0057FF] outline-none"
                      placeholder="https://..."
                      value={editingCategory?.icon_url || ''}
                      onChange={e => setEditingCategory({...editingCategory!, icon_url: e.target.value})}
                    />
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#F6F8FC] border border-[#DDE3EF] flex items-center justify-center">
                    {editingCategory?.icon_url ? <img src={editingCategory.icon_url} className="w-6 h-6 object-contain" /> : <FolderTree size={18} className="text-[#8A94A6]" />}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#F6F8FC] p-4 rounded-xl">
                <input 
                  type="checkbox" 
                  id="cat_active"
                  className="w-4 h-4 rounded text-[#0057FF] focus:ring-[#0057FF]" 
                  checked={editingCategory?.is_active || false}
                  onChange={e => setEditingCategory({...editingCategory!, is_active: e.target.checked})}
                />
                <label htmlFor="cat_active" className="text-[13px] font-bold text-[#0D1117] cursor-pointer">
                  Active (Show in navigation and filters)
                </label>
              </div>
            </form>

            <div className="p-6 border-t border-[#DDE3EF] bg-[#F6F8FC] flex items-center justify-end gap-3">
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
