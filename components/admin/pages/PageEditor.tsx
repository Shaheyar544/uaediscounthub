'use client'

import React, { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  Bold, Italic, List, ListOrdered, Quote, Undo, Redo, 
  Heading1, Heading2, Heading3, Link as LinkIcon, 
  Save, Eye, ChevronLeft, X, Check, RefreshCw, FileCode
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useHasMounted } from '@/hooks/use-has-mounted'

interface Page {
  id?: string
  slug: string
  title_en: string
  title_ar: string
  content_en: string
  content_ar: string
  status: 'draft' | 'published'
  placement: 'none' | 'header' | 'footer_c1' | 'footer_c2' | 'footer_c3'
  sort_order: number
  is_visible: boolean
  is_active: boolean
}

interface PageEditorProps {
  initialData?: Partial<Page>
  locale: string
}

export function PageEditor({ initialData, locale }: PageEditorProps) {
  const router = useRouter()
  const hasMounted = useHasMounted()
  const supabase = createClient()
  const [page, setPage] = useState<Partial<Page>>(initialData || {
    status: 'draft',
    placement: 'none',
    sort_order: 0,
    is_visible: true,
    is_active: true,
    content_en: '',
    content_ar: '',
    title_en: '',
    title_ar: '',
    slug: ''
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'en' | 'ar'>('en')

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  }

  const editorEn = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Page Content (English)...' }),
    ],
    content: page.content_en || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setPage(prev => ({ ...prev, content_en: editor.getHTML() }))
    },
  })

  const editorAr = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'محتوى الصفحة (عربي)...' }),
    ],
    content: page.content_ar || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setPage(prev => ({ ...prev, content_ar: editor.getHTML() }))
    },
  })

  const handleSave = async () => {
    if (!page.title_en || !page.slug) {
        alert('Title (EN) and Slug are required')
        return
    }
    
    setSaving(true)
    try {
      if (page.id) {
        const { error } = await supabase
          .from('pages')
          .update(page)
          .eq('id', page.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('pages')
          .insert([page])
        if (error) throw error
      }
      router.push(`/${locale}/admin/pages`)
    } catch (error) {
      console.error('Error saving page:', error)
      alert('Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  if (!hasMounted) {
    return <div className="flex-1 bg-[#F6F8FC] animate-pulse" />
  }

  return (
    <div className="flex flex-col -m-8 h-screen overflow-hidden">
      {/* Topbar */}
      <div className="bg-white border-b-[1.5px] border-[#DDE3EF] px-7 py-3 flex items-center justify-between gap-3 shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#8A94A6] hover:text-[#0D1117] transition-colors">
          <ChevronLeft size={16} /> Back to Pages
        </button>
        
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[#F6F8FC] rounded-[8px] border border-[#DDE3EF] mr-4">
            <button 
              onClick={() => setActiveTab('en')}
              className={`px-4 py-1 text-[11px] font-bold rounded-md transition-all ${activeTab === 'en' ? 'bg-white text-[#0057FF] shadow-sm' : 'text-[#8A94A6]'}`}
            >
              English
            </button>
            <button 
              onClick={() => setActiveTab('ar')}
              className={`px-4 py-1 text-[11px] font-bold rounded-md transition-all ${activeTab === 'ar' ? 'bg-white text-[#0057FF] shadow-sm' : 'text-[#8A94A6]'}`}
            >
              العربية
            </button>
          </div>

          <select 
            className="bg-[#F6F8FC] border border-[#DDE3EF] rounded-[8px] px-3 py-1.5 text-[12px] font-bold text-[#4B5675] outline-none mr-2"
            value={page.status}
            onChange={(e) => setPage(prev => ({ ...prev, status: e.target.value as any }))}
          >
            <option value="draft">DRAFT</option>
            <option value="published">PUBLISHED</option>
          </select>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#00C48C] text-white px-5 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#00A070] transition-all shadow-[0_4px_12px_rgba(0,196,140,0.2)] flex items-center gap-2"
          >
            {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
            {page.id ? 'Update Page' : 'Create Page'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F6F8FC]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-8 shadow-sm space-y-6">
              {activeTab === 'en' ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Page Title (EN)</label>
                  <input 
                    className="w-full border-none outline-none font-display text-[24px] text-[#0D1117] p-0 bg-transparent placeholder:text-[#DDE3EF]"
                    placeholder="e.g., About Us"
                    value={page.title_en || ''}
                    onChange={(e) => {
                      const title = e.target.value
                      setPage(prev => ({ 
                        ...prev, 
                        title_en: title, 
                        slug: prev.id ? prev.slug : generateSlug(title) 
                      }))
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider text-right block">Page Title (AR)</label>
                  <input 
                    className="w-full border-none outline-none font-display text-[24px] text-[#0D1117] p-0 bg-transparent placeholder:text-[#DDE3EF] text-right font-arabic"
                    placeholder="من نحن"
                    value={page.title_ar || ''}
                    onChange={(e) => setPage(prev => ({ ...prev, title_ar: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-[#DDE3EF] flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">🔗 URL Slug:</span>
                <div className="flex-1 flex items-center gap-2 bg-[#F6F8FC] rounded-[8px] px-3 py-1.5 border border-[#DDE3EF]">
                  <span className="text-[11px] font-mono text-[#8A94A6]">uaediscounthub.com/</span>
                  <input 
                    className="flex-1 bg-transparent border-none outline-none font-mono text-[11px] text-[#0057FF] p-0"
                    value={page.slug || ''}
                    onChange={(e) => setPage(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] shadow-sm flex flex-col min-h-[500px]">
              <div className="p-4 border-b border-[#DDE3EF] bg-[#F6F8FC] rounded-t-[14px] flex items-center justify-between">
                <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                  {activeTab === 'en' ? 'English Content' : 'Arabic Content (عربي)'}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => (activeTab === 'en' ? editorEn : editorAr)?.chain().focus().toggleBold().run()} className="p-1.5 rounded hover:bg-white text-[#4B5675]"><Bold size={16} /></button>
                  <button onClick={() => (activeTab === 'en' ? editorEn : editorAr)?.chain().focus().toggleItalic().run()} className="p-1.5 rounded hover:bg-white text-[#4B5675]"><Italic size={16} /></button>
                  <button onClick={() => (activeTab === 'en' ? editorEn : editorAr)?.chain().focus().toggleHeading({ level: 2 }).run()} className="p-1.5 rounded hover:bg-white text-[#4B5675]"><Heading2 size={16} /></button>
                  <button onClick={() => (activeTab === 'en' ? editorEn : editorAr)?.chain().focus().toggleBulletList().run()} className="p-1.5 rounded hover:bg-white text-[#4B5675]"><List size={16} /></button>
                </div>
              </div>
              <div className={`p-8 flex-1 ${activeTab === 'ar' ? 'font-arabic prose-rtl' : ''}`} dir={activeTab === 'ar' ? 'rtl' : 'ltr'}>
                <EditorContent 
                  editor={activeTab === 'en' ? editorEn : editorAr} 
                  className="prose prose-blue max-w-none focus:outline-none min-h-[400px]" 
                />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-6 shadow-sm space-y-4">
              <h3 className="text-[13px] font-extrabold text-[#0D1117] flex items-center gap-2">
                <FileCode size={16} className="text-[#0057FF]" />
                Navigation & Visibility
              </h3>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Placement</label>
                <select 
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                  value={page.placement}
                  onChange={(e) => setPage(prev => ({ ...prev, placement: e.target.value as any }))}
                >
                  <option value="none">None</option>
                  <option value="header">Header Menu</option>
                  <option value="footer_c1">Footer: Quick Links</option>
                  <option value="footer_c2">Footer: Stores</option>
                  <option value="footer_c3">Footer: Connect</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Sort Order</label>
                <input 
                  type="number"
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                  value={page.sort_order}
                  onChange={(e) => setPage(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F6F8FC] rounded-lg border border-[#DDE3EF]">
                <label className="text-[12px] font-bold text-[#4B5675] cursor-pointer" htmlFor="is_visible">Show in Menu</label>
                <input 
                  type="checkbox" 
                  id="is_visible"
                  className="w-4 h-4 rounded text-[#0057FF] focus:ring-[#0057FF]" 
                  checked={page.is_visible}
                  onChange={(e) => setPage(prev => ({ ...prev, is_visible: e.target.checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F6F8FC] rounded-lg border border-[#DDE3EF]">
                <label className="text-[12px] font-bold text-[#4B5675] cursor-pointer" htmlFor="is_active">Active Page</label>
                <input 
                  type="checkbox" 
                  id="is_active"
                  className="w-4 h-4 rounded text-[#0057FF] focus:ring-[#0057FF]" 
                  checked={page.is_active}
                  onChange={(e) => setPage(prev => ({ ...prev, is_active: e.target.checked }))}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
