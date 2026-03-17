'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Plus, Search, Edit3, Trash2, Layout, CheckCircle, 
  XCircle, MoreVertical, ExternalLink, Info, Loader2, Save, X
} from 'lucide-react'
import { BlogAdWidget } from '@/types/blog'
import Image from 'next/image'

/**
 * Admin: Ad Widgets Management Page
 * Handles CRUD operations for blog advertisements and banners.
 */
export default function AdWidgetsPage({ params }: { params: Promise<{ locale: string }> }) {
  const supabase = createClient()
  const [widgets, setWidgets] = useState<BlogAdWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<Partial<BlogAdWidget> | null>(null)
  const [saving, setSaving] = useState(false)

  // Fetch widgets on mount
  useEffect(() => {
    const init = async () => {
      await params;
      fetchWidgets()
    }
    init()
  }, [params])

  const fetchWidgets = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('blog_ad_widgets')
      .select('*')
      .order('created_at' as any, { ascending: false })
    
    if (data) setWidgets(data)
    setLoading(false)
  }

  const handleOpenModal = (widget: BlogAdWidget | null = null) => {
    setEditingWidget(widget || {
      name: '',
      position: 'sidebar-top',
      is_active: true,
      html_code: '',
      image_url: '',
      link_url: '',
      title: '',
      cta_text: ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWidget?.name) return

    setSaving(true)
    try {
      if (editingWidget.id) {
        const { error } = await supabase
          .from('blog_ad_widgets')
          .update(editingWidget)
          .eq('id', editingWidget.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('blog_ad_widgets')
          .insert([editingWidget])
        if (error) throw error
      }
      
      await fetchWidgets()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving widget:', error)
      alert('Failed to save widget')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return

    const { error } = await supabase
      .from('blog_ad_widgets')
      .delete()
      .eq('id', id)
    
    if (error) alert('Failed to delete')
    else fetchWidgets()
  }

  const toggleStatus = async (widget: BlogAdWidget) => {
    const { error } = await supabase
      .from('blog_ad_widgets')
      .update({ is_active: !widget.is_active })
      .eq('id', widget.id)
    
    if (error) alert('Failed to update status')
    else fetchWidgets()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0D1117]">Ad Widgets</h1>
          <p className="text-[13px] text-[#8A94A6] mt-1">Manage global blog banners, sidebars, and in-article ads</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#0057FF] text-white px-5 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)]"
        >
          <Plus size={16} /> Create Widget
        </button>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#DDE3EF] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#4B5675]">
            <Layout size={16} className="text-[#0057FF]" />
            Active Placements
          </div>
          <div className="text-[12px] text-[#8A94A6] font-medium">
            Total Placements: {widgets.length}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#0057FF]" size={32} />
          </div>
        ) : widgets.length === 0 ? (
          <div className="py-20 text-center text-[#8A94A6]">
            <p>No ad widgets found. Create your first one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#F6F8FC] border-b border-[#DDE3EF]">
                <tr>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Widget Name</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Position</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Type</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {widgets.map((widget) => (
                  <tr key={widget.id} className="border-b border-[#DDE3EF] last:border-none hover:bg-[#F6F8FC] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[13px] text-[#0D1117]">{widget.name}</div>
                      <div className="text-[11px] text-[#8A94A6] mt-0.5 line-clamp-1">{widget.title || 'No display title'}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-[#e8f0ff] text-[#0057FF] text-[10px] font-bold uppercase tracking-tight">
                        {widget.position}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[12px] text-[#4B5675] font-medium">
                        {widget.html_code ? 'Custom HTML' : 'Image/Banner'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(widget)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
                          widget.is_active ? 'bg-[#e6faf5] text-[#00C48C]' : 'bg-[#FFF0EF] text-[#FF3B30]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${widget.is_active ? 'bg-[#00C48C]' : 'bg-[#FF3B30]'}`}></span>
                        {widget.is_active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenModal(widget)}
                          className="p-2 text-[#4B5675] hover:text-[#0057FF] hover:bg-[#e8f0ff] rounded-lg transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(widget.id)}
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
                  {editingWidget?.id ? 'Edit Ad Widget' : 'New Ad Widget'}
                </h2>
                <p className="text-[12px] text-[#8A94A6]">Configure placement details and content</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F6F8FC] rounded-full">
                <X size={20} className="text-[#8A94A6]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Internal Name</label>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                    placeholder="e.g., Sidebar Amazon Banner"
                    value={editingWidget?.name || ''}
                    onChange={e => setEditingWidget({...editingWidget!, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Placement Position</label>
                  <select 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                    value={editingWidget?.position || 'sidebar-top'}
                    onChange={e => setEditingWidget({...editingWidget!, position: e.target.value as any})}
                  >
                    <option value="sidebar-top">Sidebar Top</option>
                    <option value="sidebar-mid">Sidebar Middle</option>
                    <option value="sidebar-bottom">Sidebar Bottom</option>
                    <option value="in-article">In-Article (Between Content)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Custom HTML Code (Optional)</label>
                <textarea 
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] font-mono text-[#0D1117] focus:border-[#0057FF] outline-none min-h-[100px]"
                  placeholder="Paste AdSense or custom scripts here..."
                  value={editingWidget?.html_code || ''}
                  onChange={e => setEditingWidget({...editingWidget!, html_code: e.target.value})}
                />
                <p className="text-[10px] text-[#8A94A6]">If provided, this takes priority over fields below.</p>
              </div>

              <div className="border-t border-[#DDE3EF] pt-6 space-y-4">
                <div className="text-[12px] font-bold text-[#0D1117]">Simple Banner Builder</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Display Title</label>
                    <input 
                      className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] focus:border-[#0057FF] outline-none"
                      value={editingWidget?.title || ''}
                      onChange={e => setEditingWidget({...editingWidget!, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">CTA Button Text</label>
                    <input 
                      className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] focus:border-[#0057FF] outline-none"
                      placeholder="e.g., Shop Now"
                      value={editingWidget?.cta_text || ''}
                      onChange={e => setEditingWidget({...editingWidget!, cta_text: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Image URL</label>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] focus:border-[#0057FF] outline-none"
                    value={editingWidget?.image_url || ''}
                    onChange={e => setEditingWidget({...editingWidget!, image_url: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Target Link URL</label>
                  <input 
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] focus:border-[#0057FF] outline-none"
                    placeholder="https://..."
                    value={editingWidget?.link_url || ''}
                    onChange={e => setEditingWidget({...editingWidget!, link_url: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#F6F8FC] p-4 rounded-xl">
                <input 
                  type="checkbox" 
                  id="is_active"
                  className="w-4 h-4 rounded text-[#0057FF] focus:ring-[#0057FF]" 
                  checked={editingWidget?.is_active || false}
                  onChange={e => setEditingWidget({...editingWidget!, is_active: e.target.checked})}
                />
                <label htmlFor="is_active" className="text-[13px] font-bold text-[#0D1117] cursor-pointer">
                  Activate this widget immediately
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
                {editingWidget?.id ? 'Update Widget' : 'Create Widget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
