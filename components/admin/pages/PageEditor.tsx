'use client'

import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Undo, Redo,
  Link as LinkIcon, Save, Eye, ChevronLeft, RefreshCw, FileCode, Search,
  AlignLeft, AlignCenter, AlignRight, LayoutTemplate, X
} from 'lucide-react'
import { sanitizeRichHtml } from '@/lib/sanitize-html'
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
  meta_title: string
  meta_description: string
  canonical_url: string
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

const PAGE_TEMPLATES = [
  { id: 'blank', name: 'Blank Page', desc: 'Start from scratch', content_en: '' },
  {
    id: 'about', name: 'About Us', desc: 'Pre-filled template',
    content_en: '<h1>About Us</h1><p>Write about your company here...</p><h2>Our Mission</h2><p>Our mission is to...</p><h2>What We Offer</h2><ul><li>Feature one</li><li>Feature two</li><li>Feature three</li></ul>',
  },
  {
    id: 'contact', name: 'Contact Us', desc: 'Pre-filled template',
    content_en: '<h1>Contact Us</h1><p>Have a question? We\'d love to hear from you.</p><h2>Get In Touch</h2><ul><li><strong>Email:</strong> hello@example.com</li><li><strong>Response time:</strong> Within 24–48 hours</li></ul>',
  },
  {
    id: 'faq', name: 'FAQ', desc: 'Pre-filled template',
    content_en: '<h1>Frequently Asked Questions</h1><h2>Question 1?</h2><p>Answer to question 1.</p><h2>Question 2?</h2><p>Answer to question 2.</p>',
  },
  {
    id: 'privacy', name: 'Privacy Policy', desc: 'Pre-filled template',
    content_en: '<h1>Privacy Policy</h1><p><strong>Last updated: [DATE]</strong></p><p>This Privacy Policy explains how we collect, use, and protect your information.</p><h2>Information We Collect</h2><ul><li>Account data</li><li>Usage data</li></ul><h2>Your Rights</h2><p>Contact us to request data deletion.</p>',
  },
  {
    id: 'terms', name: 'Terms of Service', desc: 'Pre-filled template',
    content_en: '<h1>Terms of Service</h1><p><strong>Last updated: [DATE]</strong></p><h2>1. Use of Service</h2><p>By using this service, you agree to these terms.</p><h2>2. Limitation of Liability</h2><p>Our service is provided "as is".</p>',
  },
]

export function PageEditor({ initialData, locale }: PageEditorProps) {
  const router = useRouter()
  const hasMounted = useHasMounted()
  const supabase = createClient()
  const isNew = !initialData?.id

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
    slug: '',
    meta_title: '',
    meta_description: '',
    canonical_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'en' | 'ar'>('en')
  const [showTemplates, setShowTemplates] = useState(isNew)

  const update = (patch: Partial<Page>) => setPage(prev => ({ ...prev, ...patch }))

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

  const editorEn = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Page Content (English)...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: page.content_en || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => update({ content_en: editor.getHTML() }),
  })

  const editorAr = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'محتوى الصفحة (عربي)...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: page.content_ar || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => update({ content_ar: editor.getHTML() }),
  })

  const applyTemplate = (template: typeof PAGE_TEMPLATES[0]) => {
    editorEn?.commands.setContent(template.content_en)
    update({ content_en: template.content_en })
    setShowTemplates(false)
  }

  const handleSave = async () => {
    if (!page.title_en || !page.slug) {
      alert('Title (EN) and Slug are required')
      return
    }
    setSaving(true)
    try {
      const sanitizedPage = {
        ...page,
        content_en: sanitizeRichHtml(page.content_en),
        content_ar: sanitizeRichHtml(page.content_ar),
      }

      if (page.id) {
        const { error } = await supabase.from('pages').update(sanitizedPage).eq('id', page.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('pages').insert([sanitizedPage])
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

  const handlePreview = () => {
    if (page.slug) {
      window.open(`/${locale}/${page.slug}`, '_blank')
    } else {
      alert('Enter a slug to preview')
    }
  }

  const activeEditor = activeTab === 'en' ? editorEn : editorAr

  if (!hasMounted) return <div className="flex-1 bg-[#F6F8FC] animate-pulse" />

  return (
    <div className="flex flex-col -m-8 h-screen overflow-hidden">
      {/* Template Picker Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-extrabold text-[#0D1117] flex items-center gap-2">
                <LayoutTemplate size={16} className="text-[#0057FF]" /> Choose a Template
              </h2>
              <button onClick={() => setShowTemplates(false)} className="text-[#8A94A6] hover:text-[#0D1117]">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PAGE_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className="p-4 border-[1.5px] border-[#DDE3EF] rounded-[10px] text-left hover:border-[#0057FF] hover:bg-[#F0F5FF] transition-all"
                >
                  <div className="font-bold text-[13px] text-[#0D1117]">{t.name}</div>
                  <div className="text-[11px] text-[#8A94A6] mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Topbar */}
      <div className="bg-white border-b-[1.5px] border-[#DDE3EF] px-7 py-3 flex items-center justify-between gap-3 shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#8A94A6] hover:text-[#0D1117] transition-colors">
          <ChevronLeft size={16} /> Back to Pages
        </button>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[#F6F8FC] rounded-[8px] border border-[#DDE3EF] mr-2">
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

          {isNew && (
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#DDE3EF] bg-[#F6F8FC] rounded-[8px] text-[12px] font-bold text-[#4B5675] hover:border-[#0057FF] hover:text-[#0057FF] transition-all"
            >
              <LayoutTemplate size={13} /> Templates
            </button>
          )}

          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#DDE3EF] bg-[#F6F8FC] rounded-[8px] text-[12px] font-bold text-[#4B5675] hover:border-[#0057FF] hover:text-[#0057FF] transition-all"
          >
            <Eye size={13} /> Preview
          </button>

          <select
            className="bg-[#F6F8FC] border border-[#DDE3EF] rounded-[8px] px-3 py-1.5 text-[12px] font-bold text-[#4B5675] outline-none"
            value={page.status}
            onChange={(e) => {
              const newStatus = e.target.value as Page['status']
              update({ 
                status: newStatus,
                ...(newStatus === 'published' ? { is_active: true, is_visible: true } : {})
              })
            }}
          >
            <option value="draft">DRAFT</option>
            <option value="published">PUBLISHED</option>
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#00C48C] text-white px-5 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#00A070] transition-all shadow-[0_4px_12px_rgba(0,196,140,0.2)] flex items-center gap-2 disabled:opacity-50"
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
            {/* Title + Slug */}
            <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-8 shadow-sm space-y-6">
              {activeTab === 'en' ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Page Title (EN)</label>
                  <input
                    className="w-full border-none outline-none text-[24px] font-extrabold text-[#0D1117] p-0 bg-transparent placeholder:text-[#DDE3EF]"
                    placeholder="e.g., About Us"
                    value={page.title_en || ''}
                    onChange={(e) => {
                      const title = e.target.value
                      update({ title_en: title, slug: page.id ? page.slug : generateSlug(title) })
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider text-right block">Page Title (AR)</label>
                  <input
                    className="w-full border-none outline-none text-[24px] font-extrabold text-[#0D1117] p-0 bg-transparent placeholder:text-[#DDE3EF] text-right"
                    placeholder="من نحن"
                    value={page.title_ar || ''}
                    onChange={(e) => update({ title_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-[#DDE3EF] flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider shrink-0">🔗 Slug:</span>
                <div className="flex-1 flex items-center gap-1 bg-[#F6F8FC] rounded-[8px] px-3 py-1.5 border border-[#DDE3EF]">
                  <span className="text-[11px] font-mono text-[#8A94A6] shrink-0">uaediscounthub.com/</span>
                  <input
                    className="flex-1 bg-transparent border-none outline-none font-mono text-[11px] text-[#0057FF] p-0"
                    value={page.slug || ''}
                    onChange={(e) => update({ slug: generateSlug(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] shadow-sm flex flex-col min-h-[500px]">
              {/* Toolbar */}
              <div className="p-3 border-b border-[#DDE3EF] bg-[#F6F8FC] rounded-t-[14px] flex flex-wrap items-center gap-0.5">
                <button onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 1 }).run()} title="H1" className={`w-7 h-7 rounded text-[11px] font-bold flex items-center justify-center text-[#4B5675] hover:bg-white ${activeEditor?.isActive('heading', { level: 1 }) ? 'bg-white text-[#0057FF]' : ''}`}>H1</button>
                <button onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 2 }).run()} title="H2" className={`w-7 h-7 rounded text-[11px] font-bold flex items-center justify-center text-[#4B5675] hover:bg-white ${activeEditor?.isActive('heading', { level: 2 }) ? 'bg-white text-[#0057FF]' : ''}`}>H2</button>
                <button onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 3 }).run()} title="H3" className={`w-7 h-7 rounded text-[11px] font-bold flex items-center justify-center text-[#4B5675] hover:bg-white ${activeEditor?.isActive('heading', { level: 3 }) ? 'bg-white text-[#0057FF]' : ''}`}>H3</button>
                <div className="w-px h-5 bg-[#DDE3EF] mx-1" />
                <button onClick={() => activeEditor?.chain().focus().toggleBold().run()} title="Bold" className={`p-1.5 rounded hover:bg-white text-[#4B5675] ${activeEditor?.isActive('bold') ? 'bg-white text-[#0057FF]' : ''}`}><Bold size={14} /></button>
                <button onClick={() => activeEditor?.chain().focus().toggleItalic().run()} title="Italic" className={`p-1.5 rounded hover:bg-white text-[#4B5675] ${activeEditor?.isActive('italic') ? 'bg-white text-[#0057FF]' : ''}`}><Italic size={14} /></button>
                <button onClick={() => activeEditor?.chain().focus().toggleUnderline().run()} title="Underline" className={`p-1.5 rounded hover:bg-white text-[#4B5675] ${activeEditor?.isActive('underline') ? 'bg-white text-[#0057FF]' : ''}`}><UnderlineIcon size={14} /></button>
                <div className="w-px h-5 bg-[#DDE3EF] mx-1" />
                <button onClick={() => activeEditor?.chain().focus().toggleBulletList().run()} title="Bullet List" className={`p-1.5 rounded hover:bg-white text-[#4B5675] ${activeEditor?.isActive('bulletList') ? 'bg-white text-[#0057FF]' : ''}`}><List size={14} /></button>
                <button onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()} title="Numbered List" className={`p-1.5 rounded hover:bg-white text-[#4B5675] ${activeEditor?.isActive('orderedList') ? 'bg-white text-[#0057FF]' : ''}`}><ListOrdered size={14} /></button>
                <button onClick={() => activeEditor?.chain().focus().toggleBlockquote().run()} title="Blockquote" className={`p-1.5 rounded hover:bg-white text-[#4B5675] ${activeEditor?.isActive('blockquote') ? 'bg-white text-[#0057FF]' : ''}`}><Quote size={14} /></button>
                <div className="w-px h-5 bg-[#DDE3EF] mx-1" />
                <button onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()} title="Align Left" className={`p-1.5 rounded hover:bg-white text-[#4B5675] ${activeEditor?.isActive({ textAlign: 'left' }) ? 'bg-white text-[#0057FF]' : ''}`}><AlignLeft size={14} /></button>
                <button onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()} title="Center" className={`p-1.5 rounded hover:bg-white text-[#4B5675] ${activeEditor?.isActive({ textAlign: 'center' }) ? 'bg-white text-[#0057FF]' : ''}`}><AlignCenter size={14} /></button>
                <button onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()} title="Align Right" className={`p-1.5 rounded hover:bg-white text-[#4B5675] ${activeEditor?.isActive({ textAlign: 'right' }) ? 'bg-white text-[#0057FF]' : ''}`}><AlignRight size={14} /></button>
                <div className="w-px h-5 bg-[#DDE3EF] mx-1" />
                <button onClick={() => activeEditor?.chain().focus().undo().run()} title="Undo" className="p-1.5 rounded hover:bg-white text-[#4B5675]"><Undo size={14} /></button>
                <button onClick={() => activeEditor?.chain().focus().redo().run()} title="Redo" className="p-1.5 rounded hover:bg-white text-[#4B5675]"><Redo size={14} /></button>
              </div>
              <div className={`p-8 flex-1 ${activeTab === 'ar' ? 'font-arabic' : ''}`} dir={activeTab === 'ar' ? 'rtl' : 'ltr'}>
                <EditorContent
                  editor={activeTab === 'en' ? editorEn : editorAr}
                  className="prose prose-blue max-w-none focus:outline-none min-h-[400px]"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Navigation & Visibility */}
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
                  onChange={(e) => update({ placement: e.target.value as Page['placement'] })}
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
                  value={page.sort_order ?? 0}
                  onChange={(e) => update({ sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F6F8FC] rounded-lg border border-[#DDE3EF]">
                <label className="text-[12px] font-bold text-[#4B5675] cursor-pointer" htmlFor="is_visible">Show in Menu</label>
                <input
                  type="checkbox"
                  id="is_visible"
                  className="w-4 h-4 rounded text-[#0057FF] focus:ring-[#0057FF]"
                  checked={page.is_visible ?? true}
                  onChange={(e) => update({ is_visible: e.target.checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F6F8FC] rounded-lg border border-[#DDE3EF]">
                <label className="text-[12px] font-bold text-[#4B5675] cursor-pointer" htmlFor="is_active">Active Page</label>
                <input
                  type="checkbox"
                  id="is_active"
                  className="w-4 h-4 rounded text-[#0057FF] focus:ring-[#0057FF]"
                  checked={page.is_active ?? true}
                  onChange={(e) => update({ is_active: e.target.checked })}
                />
              </div>
            </div>

            {/* SEO Panel */}
            <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-6 shadow-sm space-y-4">
              <h3 className="text-[13px] font-extrabold text-[#0D1117] flex items-center gap-2">
                <Search size={15} className="text-[#00C48C]" />
                SEO Settings
              </h3>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Meta Title</label>
                  <span className={`text-[10px] font-bold ${(page.meta_title?.length ?? 0) > 60 ? 'text-red-500' : 'text-[#8A94A6]'}`}>
                    {page.meta_title?.length ?? 0}/60
                  </span>
                </div>
                <input
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#00C48C] outline-none"
                  placeholder="Leave blank to use page title"
                  value={page.meta_title || ''}
                  onChange={(e) => update({ meta_title: e.target.value })}
                  maxLength={80}
                />
                <div className="h-1 bg-[#F6F8FC] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${(page.meta_title?.length ?? 0) > 60 ? 'bg-red-400' : 'bg-[#00C48C]'}`}
                    style={{ width: `${Math.min(((page.meta_title?.length ?? 0) / 60) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Meta Description</label>
                  <span className={`text-[10px] font-bold ${(page.meta_description?.length ?? 0) > 160 ? 'text-red-500' : 'text-[#8A94A6]'}`}>
                    {page.meta_description?.length ?? 0}/160
                  </span>
                </div>
                <textarea
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#00C48C] outline-none resize-none"
                  placeholder="150–160 chars recommended for search engines"
                  rows={3}
                  value={page.meta_description || ''}
                  onChange={(e) => update({ meta_description: e.target.value })}
                  maxLength={200}
                />
                <div className="h-1 bg-[#F6F8FC] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${(page.meta_description?.length ?? 0) > 160 ? 'bg-red-400' : 'bg-[#00C48C]'}`}
                    style={{ width: `${Math.min(((page.meta_description?.length ?? 0) / 160) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Canonical URL</label>
                <input
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#00C48C] outline-none font-mono"
                  placeholder="https://uaediscounthub.com/..."
                  value={page.canonical_url || ''}
                  onChange={(e) => update({ canonical_url: e.target.value })}
                />
              </div>

              {/* SERP Preview — always visible */}
              <div className="mt-2 p-3 bg-white rounded-[8px] border border-[#DDE3EF]">
                <div className="text-[10px] font-bold text-[#8A94A6] uppercase mb-2">Search Preview</div>
                <div className="text-[13px] font-medium text-[#0057FF] leading-tight truncate">
                  {page.meta_title || page.title_en || 'Page Title'}
                </div>
                <div className="text-[11px] text-[#00803A] mt-0.5 font-mono truncate">
                  uaediscounthub.com/{page.slug || '...'}
                </div>
                <div className="text-[11px] text-[#4B5675] mt-1 line-clamp-2">
                  {page.meta_description || 'Add a meta description...'}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
