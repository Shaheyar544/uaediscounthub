'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { 
  Plus, Search, Edit3, Trash2, Store, CheckCircle, 
  XCircle, Loader2, Save, X, ImageIcon, ExternalLink,
  ShoppingBag, Star
} from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface StoreType {
  id: string
  slug: string
  name: string
  logo_url: string | null
  base_url: string
  affiliate_base_url: string | null
  is_active: boolean
  is_featured: boolean
  display_order: number
  _count?: {
    deals: number
    coupons: number
  }
}

export default function StoresClient({ locale }: { locale: string }) {
  const supabase = createClient()
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Partial<StoreType> | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState(Date.now()) // ✅ forces image refresh

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (storesError) throw storesError

      if (!storesData || storesData.length === 0) {
        setStores([])
        setLoading(false)
        return
      }

      // Optimized count fetching
      const storesWithCounts = await Promise.all(storesData.map(async (store) => {
        try {
          const [dealsRes, couponsRes] = await Promise.all([
            supabase.from('deals').select('*', { count: 'exact', head: true }).eq('store_id', store.id).eq('is_active', true),
            supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('store_id', store.id).eq('is_active', true)
          ])
          
          return {
            ...store,
            _count: {
              deals: dealsRes.count || 0,
              coupons: couponsRes.count || 0
            }
          }
        } catch (err) {
          console.error(`Failed to fetch counts for store ${store.id}:`, err)
          return { ...store, _count: { deals: 0, coupons: 0 } }
        }
      }))

      setStores(storesWithCounts)
      setLastUpdated(Date.now()) // ✅ triggers cache-bust on images
    } catch (err: any) {
      console.error('Critical error in fetchStores:', err)
      setError(err.message || 'Failed to load stores. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (store: StoreType | null = null) => {
    setEditingStore(store || {
      name: '',
      slug: '',
      logo_url: '',
      base_url: '',
      affiliate_base_url: '',
      is_active: true,
      is_featured: false,
      display_order: 0
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStore?.name || !editingStore?.slug || !editingStore?.base_url) {
      alert('Name, Slug, and Base URL are required')
      return
    }

    setSaving(true)
    try {
      const { _count, ...storeData } = editingStore as any
      
      console.log('[DEBUG] Saving store with logo_url:', storeData.logo_url)

      if (editingStore.id) {
        const { error } = await supabase
          .from('stores')
          .update(storeData)
          .eq('id', editingStore.id)
        if (error) throw error

        // ✅ Immediately update local state
        setStores(prev => prev.map(s =>
          s.id === editingStore.id
            ? { ...s, ...storeData }
            : s
        ))
        setLastUpdated(Date.now())
      } else {
        const { error } = await supabase
          .from('stores')
          .insert([storeData])
        if (error) throw error
      }
      
      await fetchStores()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving store:', error)
      alert('Failed to save store')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store? This may affect products and deals linked to it.')) return

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id)
    
    if (error) alert('Failed to delete store. It might be linked to existing products or deals.')
    else fetchStores()
  }

  const toggleStatus = async (store: StoreType) => {
    const { error } = await supabase
      .from('stores')
      .update({ is_active: !store.is_active })
      .eq('id', store.id)
    
    if (error) alert('Failed to update status')
    else fetchStores()
  }

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0D1117]">Stores Management</h1>
          <p className="text-[13px] text-[#8A94A6] mt-1">Manage retail partners and featured marketplaces</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#0057FF] text-white px-5 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)]"
        >
          <Plus size={16} /> Add Store
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 shadow-sm">
          <XCircle size={20} />
          <div className="flex-1 text-[13px] font-medium">{error}</div>
          <button 
            onClick={() => fetchStores()}
            className="text-[12px] font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table Area */}
      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#DDE3EF] flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" size={14} />
                <input 
                  type="text" 
                  placeholder="Search stores..."
                  className="pl-9 pr-4 py-1.5 bg-[#F6F8FC] border border-[#DDE3EF] rounded-full text-[12px] outline-none focus:border-[#0057FF] w-64"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          <div className="text-[12px] text-[#8A94A6] font-medium">
            Total Stores: {stores.length}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#0057FF]" size={32} />
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="py-20 text-center text-[#8A94A6]">
            <p>No stores found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#F6F8FC] border-b border-[#DDE3EF]">
                <tr>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider w-16">Logo</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Store Name</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Active Deals/Coupons</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Featured</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((store) => (
                  <tr key={`${store.id}-${lastUpdated}`} className="border-b border-[#DDE3EF] last:border-none hover:bg-[#F6F8FC] transition-colors">
                    <td className="p-4">
                      <div className="w-12 h-12 rounded-lg bg-white border border-[#DDE3EF] flex items-center justify-center p-1 overflow-hidden shadow-sm">
                        {store.logo_url ? (
                          <img 
                            key={`${store.id}-${lastUpdated}`}
                            src={`${store.logo_url}?v=${lastUpdated}`} 
                            alt={store.name} 
                            className="w-full h-full object-contain" 
                          />
                        ) : (
                          <Store size={20} className="text-[#8A94A6]" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[13px] text-[#0D1117]">{store.name}</div>
                      <div className="text-[11px] text-[#8A94A6] mt-0.5 flex items-center gap-1">
                        <code>{store.slug}</code>
                        <Link href={store.base_url} target="_blank" className="hover:text-[#0057FF]">
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[12px] font-bold text-[#4B5675]">
                          <ShoppingBag size={12} className="text-[#0057FF]" /> {store._count?.deals || 0}
                        </span>
                        <span className="flex items-center gap-1 text-[12px] font-bold text-[#4B5675]">
                          <Plus size={12} className="text-[#00C48C]" /> {store._count?.coupons || 0}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {store.is_featured ? (
                         <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF6B00] bg-[#FFF8F2] px-2 py-1 rounded-md w-fit border border-[#FF6B00]/10">
                            <Star size={12} fill="#FF6B00" /> Featured
                         </div>
                      ) : (
                        <span className="text-[11px] text-[#8A94A6]">Standard</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(store)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
                          store.is_active ? 'bg-[#e6faf5] text-[#00C48C]' : 'bg-[#FFF0EF] text-[#FF3B30]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${store.is_active ? 'bg-[#00C48C]' : 'bg-[#FF3B30]'}`}></span>
                        {store.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenModal(store)}
                          className="p-2 text-[#4B5675] hover:text-[#0057FF] hover:bg-[#e8f0ff] rounded-lg transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(store.id)}
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

      {/* Modal / Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#DDE3EF] flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#0D1117]">
                  {editingStore?.id ? 'Edit Store' : 'Add New Store'}
                </h2>
                <p className="text-[12px] text-[#8A94A6]">Configure store branding and affiliate links</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F6F8FC] rounded-full">
                <X size={20} className="text-[#8A94A6]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Store Name</label>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                    placeholder="e.g., Amazon UAE"
                    value={editingStore?.name || ''}
                    data-lpignore="true"
                    autoComplete="off"
                    onChange={e => {
                      const name = e.target.value
                      setEditingStore({
                        ...editingStore!, 
                        name,
                        slug: editingStore?.id ? editingStore.slug : generateSlug(name)
                      })
                    }}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Slug</label>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none font-mono"
                    value={editingStore?.slug || ''}
                    data-lpignore="true"
                    autoComplete="off"
                    onChange={e => setEditingStore({...editingStore!, slug: generateSlug(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <ImageUpload 
                value={editingStore?.logo_url || ''} 
                onChange={(url) => {
                  setEditingStore({...editingStore!, logo_url: url})
                }}
                label="Store Logo"
                description="Upload a high-quality logo. PNG/WebP with transparent backgrounds work best."
                folder="stores"
              />

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Base Store URL</label>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                    placeholder="https://amazon.ae"
                    value={editingStore?.base_url || ''}
                    data-lpignore="true"
                    autoComplete="off"
                    onChange={e => setEditingStore({...editingStore!, base_url: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Affiliate Redirect URL (Optional)</label>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                    placeholder="https://affiliate.amazon.ae/redirect?..."
                    value={editingStore?.affiliate_base_url || ''}
                    data-lpignore="true"
                    autoComplete="off"
                    onChange={e => setEditingStore({...editingStore!, affiliate_base_url: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#DDE3EF] pt-6">
                <div className="flex items-center gap-3 bg-[#F6F8FC] p-4 rounded-xl border border-[#DDE3EF]/50">
                  <div className="flex-1">
                    <label htmlFor="store_active" className="text-[13px] font-bold text-[#0D1117] cursor-pointer block">Status</label>
                    <p className="text-[10px] text-[#8A94A6]">Enable store across the site</p>
                  </div>
                  <input 
                    type="checkbox" 
                    id="store_active"
                    className="w-4 h-4 rounded text-[#0057FF] focus:ring-[#0057FF]" 
                    checked={editingStore?.is_active || false}
                    onChange={e => setEditingStore({...editingStore!, is_active: e.target.checked})}
                  />
                </div>
                <div className="flex items-center gap-3 bg-[#FFF8F2] p-4 rounded-xl border border-[#FF6B00]/10">
                  <div className="flex-1">
                    <label htmlFor="store_featured" className="text-[13px] font-bold text-[#FF6B00] cursor-pointer block">Featured</label>
                    <p className="text-[10px] text-[#FF6B00]/60">Show on Home Page carousel</p>
                  </div>
                  <input 
                    type="checkbox" 
                    id="store_featured"
                    className="w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00]" 
                    checked={editingStore?.is_featured || false}
                    onChange={e => setEditingStore({...editingStore!, is_featured: e.target.checked})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Display Order</label>
                <input 
                  type="number"
                  className="w-32 bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                  value={editingStore?.display_order || 0}
                  onChange={e => setEditingStore({...editingStore!, display_order: parseInt(e.target.value) || 0})}
                />
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
                className="flex items-center gap-2 bg-[#0057FF] text-white px-6 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)] disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {editingStore?.id ? 'Update Store' : 'Add Store'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
