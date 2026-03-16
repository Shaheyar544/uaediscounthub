'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { 
  Bold, Italic, List, ListOrdered, Quote, Undo, Redo, 
  Heading1, Heading2, Heading3, Link as LinkIcon, 
  Image as ImageIcon, Table as TableIcon, Code, 
  Sparkles, Save, Eye, Calendar, ChevronLeft, 
  X, Check, AlertCircle, Info, Hash, RefreshCw
} from 'lucide-react'
import { BlogPost, BlogCategory } from '@/types/blog'
import { GoogleSearchPreview } from '@/components/blog/GoogleSearchPreview'
import { SEOChecklist } from '@/components/blog/SEOChecklist'
import { useRouter } from 'next/navigation'

interface PostEditorProps {
  initialPost?: Partial<BlogPost>
  categories: BlogCategory[]
}

/**
 * Unified Blog Post Editor
 * Includes Tiptap rich text editor, SEO optimization panel, and metadata management.
 * Matches the 'Admin: Editor' layout in the design blueprint.
 */
export function PostEditor({ initialPost, categories }: PostEditorProps) {
  const router = useRouter()
  const [post, setPost] = useState<Partial<BlogPost>>(initialPost || {
    status: 'draft',
    locale: 'en',
    allow_comments: true,
    is_featured: false,
    schema_type: 'Article'
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [uploading, setUploading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  
  // SEO Local State
  const [seoScore, setSeoScore] = useState(0)
  const [seoChecks, setSeoChecks] = useState<any[]>([])

  // Helper: Slug Generator
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60)
  }

  // Tiptap Editor Initialization
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Post Content — Write something amazing...' }),
      CharacterCount,
      Typography,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: post.content || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setPost(prev => ({ ...prev, content: html }))
    },
  })

  // SEO Score & Checklist Calculator
  const runSEOChecks = useCallback(() => {
    if (!editor) return
    
    const text = editor.getText()
    const words = text.split(/\s+/).filter(Boolean).length
    const title = post.seo_title || post.title || ''
    const description = post.seo_description || ''
    const slug = post.slug || ''
    const focusKeyword = post.seo_keywords?.[0]?.toLowerCase() || ''
    
    const checks = [
      {
        label: 'Title Length',
        status: title.length >= 50 && title.length <= 60 ? 'pass' : title.length > 0 ? 'warn' : 'fail',
        description: 'Ideal length is 50-60 characters.'
      },
      {
        label: 'Meta Description',
        status: description.length >= 140 && description.length <= 160 ? 'pass' : description.length > 0 ? 'warn' : 'fail',
        description: 'Ideal length is 140-160 characters.'
      },
      {
        label: 'Focus Keyword in Title',
        status: focusKeyword && title.toLowerCase().includes(focusKeyword) ? 'pass' : 'fail',
        description: 'Your primary keyword should appear in the title.'
      },
      {
        label: 'Content Length',
        status: words >= 300 ? 'pass' : words >= 100 ? 'warn' : 'fail',
        description: `Currently ${words} words. Target at least 300.`
      },
      {
        label: 'Slug Length',
        status: slug.length > 0 && slug.length <= 60 ? 'pass' : slug.length > 60 ? 'warn' : 'fail',
        description: 'Keep URLs short and keyword-rich.'
      },
      {
        label: 'Featured Image',
        status: post.featured_image ? 'pass' : 'fail',
        description: 'Posts with images perform better in search.'
      }
    ]

    // Calculate score
    const passCount = checks.filter(c => c.status === 'pass').length
    const warnCount = checks.filter(c => c.status === 'warn').length
    const totalScore = Math.round(((passCount * 1) + (warnCount * 0.5)) / checks.length * 100)

    setSeoChecks(checks)
    setSeoScore(totalScore)
    
    // Update reading time
    const readingTime = Math.max(1, Math.ceil(words / 200))
    if (post.reading_time_min !== readingTime) {
      setPost(prev => ({ ...prev, reading_time_min: readingTime }))
    }
  }, [editor, post.title, post.seo_title, post.seo_description, post.slug, post.seo_keywords, post.featured_image, post.reading_time_min])

  useEffect(() => {
    runSEOChecks()
  }, [runSEOChecks])

  // Handle Save
  const handleSave = async (isManual = true) => {
    if (!post.title || !post.slug) return
    
    setSaving(true)
    try {
      const url = post.id ? `/api/blog/posts/${post.id}` : '/api/blog/posts'
      const method = post.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      const savedPost = await response.json()
      if (!post.id) {
        setPost(prev => ({ ...prev, id: savedPost.id }))
      }
      
      setLastSaved(new Date())
      if (isManual) {
        // Optional toast
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  // Handle Image Upload
  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/blog/upload-image', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setPost(prev => ({
        ...prev,
        featured_image: data.original,
        og_image: data.og
      }))
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  // AI Assist Action
  const runAiAction = async (action: string) => {
    if (!editor) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/blog/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: editor.getText(),
          title: post.title,
          keywords: post.seo_keywords
        })
      })
      const data = await res.json()
      if (data.result) {
        // If it's an improvement, we might want to ask before replacing
        // For now, we'll just insert/append or replace selection
        if (action === 'improve') {
          editor.chain().focus().insertContent(data.result).run()
        } else {
          editor.chain().focus().appendContent(data.result).run()
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col -m-8">
      {/* Editor Topbar */}
      <div className="sticky top-0 z-50 bg-white border-b-[1.5px] border-[#DDE3EF] px-7 py-3 flex items-center justify-between gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#8A94A6] hover:text-[#0D1117] transition-colors">
          <ChevronLeft size={16} /> Back to Posts
        </button>
        
        <div className="flex items-center gap-2 text-[12px] text-[#8A94A6]">
          <div className={`w-1.5 h-1.5 rounded-full ${saving ? 'bg-[#FFC107] animate-pulse' : 'bg-[#00C48C]'}`}></div>
          {saving ? 'Saving...' : lastSaved ? `Saved automatically ${lastSaved.toLocaleTimeString()}` : 'Draft'}
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border-[1.5px] border-[#DDE3EF] bg-transparent text-[#0D1117] font-semibold text-[12px] hover:border-[#0057FF] hover:text-[#0057FF] transition-all">
            <Eye size={14} /> Preview
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border-[1.5px] border-[#DDE3EF] bg-transparent text-[#0D1117] font-semibold text-[12px] hover:border-[#0057FF] hover:text-[#0057FF] transition-all">
            <Calendar size={14} /> Schedule
          </button>
          
          <div className="flex items-center bg-[#e8f0ff] border-[1.5px] border-[#0057FF] rounded-[8px] px-3 py-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-[#0057FF] bg-[#0057FF] mr-2"></div>
            <span className="text-[12px] font-bold text-[#0057FF]">{post.status?.toUpperCase() || 'DRAFT'}</span>
          </div>

          <button 
            onClick={() => handleSave()}
            className="bg-[#00C48C] text-white px-5 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#00A070] transition-all shadow-[0_4px_12px_rgba(0,196,140,0.2)]"
          >
            {post.status === 'published' ? 'Update Post' : '🚀 Publish Now'}
          </button>
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="p-7 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 max-w-[1600px] mx-auto w-full">
        
        {/* Left Column: Editor & Main Metadata */}
        <div className="space-y-4">
          
          {/* Title & Slug Section */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-7 shadow-sm">
            <textarea 
              placeholder="Post Title — Make it compelling and keyword-rich..."
              className="w-full border-none outline-none font-display text-[30px] text-[#0D1117] leading-[1.3] p-0 bg-transparent resize-none placeholder:text-[#DDE3EF]"
              rows={2}
              value={post.title || ''}
              onChange={(e) => {
                const title = e.target.value
                setPost(prev => ({ 
                  ...prev, 
                  title, 
                  slug: prev.slug || generateSlug(title) 
                }))
              }}
            />
            <input 
              placeholder="Subtitle / Short description (optional)"
              className="w-full border-none outline-none font-body text-[15px] text-[#4B5675] mt-2 bg-transparent placeholder:text-[#DDE3EF]"
              value={post.subtitle || ''}
              onChange={(e) => setPost(prev => ({ ...prev, subtitle: e.target.value }))}
            />
            
            <div className="mt-4 pt-4 border-t border-[#DDE3EF] flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">🔗 Slug:</span>
              <div className="flex-1 flex items-center gap-2 bg-[#F6F8FC] rounded-[8px] px-3 py-1.5 border border-[#DDE3EF]">
                <span className="text-[11px] font-mono text-[#8A94A6]">uaediscounthub.com/blog/</span>
                <input 
                  className="flex-1 bg-transparent border-none outline-none font-mono text-[11px] text-[#0D1117] p-0"
                  value={post.slug || ''}
                  onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                />
              </div>
              <button 
                onClick={() => setPost(prev => ({ ...prev, slug: generateSlug(prev.title || '') }))}
                className="p-1.5 text-[#8A94A6] hover:text-[#0057FF] transition-colors"
                title="Regenerate slug"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Featured Image Section */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-7 shadow-sm">
            <div className="text-[11px] font-extrabold text-[#8A94A6] uppercase tracking-[0.8px] mb-4 flex items-center gap-2">
              <ImageIcon size={14} /> Featured Image
            </div>
            
            {post.featured_image ? (
              <div className="relative group rounded-[14px] overflow-hidden bg-[#F6F8FC] border border-[#DDE3EF]">
                <img src={post.featured_image} alt="Featured" className="w-full h-64 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                   <label className="bg-white text-[#0D1117] px-4 py-2 rounded-lg font-bold text-[12px] cursor-pointer hover:bg-[#F6F8FC]">
                    Replace
                    <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                   </label>
                   <button 
                    onClick={() => setPost(prev => ({ ...prev, featured_image: undefined, og_image: undefined }))}
                    className="bg-white text-[#FF3B30] px-4 py-2 rounded-lg font-bold text-[12px] hover:bg-[#FFF0EF]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#DDE3EF] rounded-[14px] p-10 text-center bg-[#F6F8FC] cursor-pointer hover:border-[#0057FF] hover:bg-[#e8f0ff] transition-all block">
                <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                <div className="text-3xl mb-2">📁</div>
                <div className="text-[13px] font-bold text-[#4B5675] mb-1">{uploading ? 'Uploading...' : 'Drop image here or click to upload'}</div>
                <div className="text-[11px] text-[#8A94A6]">PNG, JPG, WebP · Auto-optimized to WebP · Max 5MB</div>
              </label>
            )}
            
            <div className="mt-3 bg-[#e6faf5] rounded-[8px] p-3 flex items-center gap-2 text-[12px] text-[#00A070] font-semibold">
              <Check size={14} /> ✅ Auto-convert: WebP · Target size: &lt;150KB · OG Ready
            </div>
          </div>

          {/* Content Editor Section */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] shadow-sm flex flex-col min-h-[600px]">
            <div className="p-4 border-b border-[#DDE3EF] bg-[#F6F8FC] rounded-t-[14px] flex flex-wrap gap-1 sticky top-[61px] z-40">
              <div className="flex gap-1 pr-2 border-r border-[#DDE3EF] mr-1">
                <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-white ${editor?.isActive('bold') ? 'bg-white text-[#0057FF]' : 'text-[#4B5675]'}`} title="Bold"><Bold size={16} /></button>
                <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-white ${editor?.isActive('italic') ? 'bg-white text-[#0057FF]' : 'text-[#4B5675]'}`} title="Italic"><Italic size={16} /></button>
              </div>
              
              <div className="flex gap-1 pr-2 border-r border-[#DDE3EF] mr-1">
                <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded hover:bg-white ${editor?.isActive('heading', { level: 1 }) ? 'bg-white text-[#0057FF]' : 'text-[#4B5675]'}`} title="H1"><Heading1 size={16} /></button>
                <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-white ${editor?.isActive('heading', { level: 2 }) ? 'bg-white text-[#0057FF]' : 'text-[#4B5675]'}`} title="H2"><Heading2 size={16} /></button>
                <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded hover:bg-white ${editor?.isActive('heading', { level: 3 }) ? 'bg-white text-[#0057FF]' : 'text-[#4B5675]'}`} title="H3"><Heading3 size={16} /></button>
              </div>

              <div className="flex gap-1 pr-2 border-r border-[#DDE3EF] mr-1">
                <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-white ${editor?.isActive('bulletList') ? 'bg-white text-[#0057FF]' : 'text-[#4B5675]'}`} title="List"><List size={16} /></button>
                <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-white ${editor?.isActive('orderedList') ? 'bg-white text-[#0057FF]' : 'text-[#4B5675]'}`} title="Ordered List"><ListOrdered size={16} /></button>
                <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded hover:bg-white ${editor?.isActive('blockquote') ? 'bg-white text-[#0057FF]' : 'text-[#4B5675]'}`} title="Quote"><Quote size={16} /></button>
              </div>

              <div className="flex gap-1 pr-2 border-r border-[#DDE3EF] mr-1">
                <button className="p-1.5 rounded hover:bg-white text-[#4B5675]" title="Insert Link"><LinkIcon size={16} /></button>
                <button className="p-1.5 rounded hover:bg-white text-[#4B5675]" title="Insert Table"><TableIcon size={16} /></button>
                <button className="p-1.5 rounded hover:bg-white text-[#4B5675]" title="Code Block"><Code size={16} /></button>
              </div>

              <div className="flex gap-1 ml-auto">
                <button 
                  onClick={() => runAiAction('improve')}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#00C48C] font-bold text-[11px] border border-[#00C48C20] hover:bg-[#e6faf5] transition-all"
                >
                  <Sparkles size={14} className={aiLoading ? 'animate-spin' : ''} /> {aiLoading ? 'Thinking...' : 'AI Assist'}
                </button>
              </div>
            </div>

            <div className="p-7 flex-1">
              <EditorContent editor={editor} className="prose prose-blue max-w-none focus:outline-none min-h-[400px]" />
            </div>

            <div className="p-4 border-t border-[#DDE3EF] bg-[#F6F8FC] rounded-b-[14px] flex items-center justify-between text-[11px] text-[#8A94A6] font-medium">
              <div className="flex gap-4">
                <span>Words: <strong>{editor?.storage.characterCount.words() || 0}</strong></span>
                <span>Characters: <strong>{editor?.storage.characterCount.characters() || 0}</strong></span>
                <span>Est. read time: <strong>⏱ {post.reading_time_min || 1} min</strong></span>
              </div>
              <div>Last edited: {lastSaved ? lastSaved.toLocaleTimeString() : 'Never'}</div>
            </div>
          </div>

          {/* Image Gallery Manager */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-7 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[11px] font-extrabold text-[#8A94A6] uppercase tracking-[0.8px]">🖼 Image Gallery</div>
              <button className="text-[12px] font-bold text-[#0057FF] hover:underline">+ Add Images</button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {post.featured_image && (
                 <div className="aspect-square rounded-lg border-2 border-[#0057FF] overflow-hidden relative group">
                  <img src={post.featured_image} className="w-full h-full object-cover" alt="Gallery" />
                  <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check size={20} className="text-white" />
                  </div>
                </div>
              )}
              <div className="aspect-square rounded-lg border-2 border-dashed border-[#DDE3EF] flex items-center justify-center text-[#DDE3EF] cursor-pointer hover:border-[#0057FF] hover:text-[#0057FF]">
                <span className="text-2xl font-light">+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & SEO */}
        <div className="space-y-4">
          
          {/* Publish Settings */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5 shadow-sm">
             <div className="text-[13px] font-extrabold text-[#0D1117] mb-4 flex items-center gap-2">
              <Save size={16} /> Publish Settings
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Category</label>
                <select 
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                  value={post.category_id || ''}
                  onChange={(e) => setPost(prev => ({ ...prev, category_id: e.target.value }))}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Locale</label>
                <div className="flex p-1 bg-[#F6F8FC] rounded-[8px] border border-[#DDE3EF]">
                   <button 
                    onClick={() => setPost(prev => ({ ...prev, locale: 'en' }))}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${post.locale === 'en' ? 'bg-white text-[#0057FF] shadow-sm' : 'text-[#8A94A6]'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setPost(prev => ({ ...prev, locale: 'ar' }))}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${post.locale === 'ar' ? 'bg-white text-[#0057FF] shadow-sm' : 'text-[#8A94A6]'}`}
                  >
                    Arabic
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[#4B5675]">Featured Post</label>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-[#0057FF] focus:ring-[#0057FF]" 
                  checked={post.is_featured || false}
                  onChange={(e) => setPost(prev => ({ ...prev, is_featured: e.target.checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[#4B5675]">Allow Comments</label>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-[#0057FF] focus:ring-[#0057FF]" 
                  checked={post.allow_comments !== false}
                  onChange={(e) => setPost(prev => ({ ...prev, allow_comments: e.target.checked }))}
                />
              </div>
            </div>
          </div>

          {/* SEO Checklist */}
          <SEOChecklist score={seoScore} checks={seoChecks} />

          {/* Meta Information */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5 shadow-sm space-y-4">
             <div className="text-[13px] font-extrabold text-[#0D1117] mb-2 flex items-center gap-2">
              <Hash size={16} /> Meta Data
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">SEO Title</label>
                  <span className={`text-[9px] font-bold ${(post.seo_title?.length || 0) > 60 ? 'text-[#FF3B30]' : 'text-[#8A94A6]'}`}>
                    {post.seo_title?.length || 0}/60
                  </span>
                </div>
                <input 
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                  value={post.seo_title || ''}
                  onChange={(e) => setPost(prev => ({ ...prev, seo_title: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Meta Description</label>
                  <span className={`text-[9px] font-bold ${(post.seo_description?.length || 0) > 160 ? 'text-[#FF3B30]' : 'text-[#8A94A6]'}`}>
                    {post.seo_description?.length || 0}/160
                  </span>
                </div>
                <textarea 
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#0057FF] outline-none min-h-[80px] resize-none"
                  value={post.seo_description || ''}
                  onChange={(e) => setPost(prev => ({ ...prev, seo_description: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Google Preview */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold text-[#8A94A6] uppercase tracking-[0.8px] px-1">
              📱 Google Search Preview
            </div>
            <GoogleSearchPreview 
              title={post.seo_title || post.title || ''} 
              description={post.seo_description || post.excerpt || ''} 
              slug={post.slug || ''}
            />
          </div>

          {/* Target Keywords */}
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5 shadow-sm">
             <div className="text-[13px] font-extrabold text-[#0D1117] mb-3">🎯 Target Keywords</div>
             <div className="flex gap-2 mb-3">
               <input 
                id="keyword-input"
                className="flex-1 bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-1.5 text-[12px] outline-none"
                placeholder="Add keyword..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget
                    if (input.value) {
                      setPost(prev => ({ ...prev, seo_keywords: [...(prev.seo_keywords || []), input.value] }))
                      input.value = ''
                    }
                  }
                }}
               />
               <button className="bg-[#0057FF] text-white px-3 py-1 rounded-[8px] font-bold text-[11px]">Add</button>
             </div>
             <div className="flex flex-wrap gap-2">
               {post.seo_keywords?.map((kw, idx) => (
                 <span key={idx} className="bg-[#e8f0ff] text-[#0057FF] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5 border border-[#0057FF20]">
                   {kw}
                   <X size={10} className="cursor-pointer" onClick={() => setPost(prev => ({ ...prev, seo_keywords: prev.seo_keywords?.filter((_, i) => i !== idx) }))} />
                 </span>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}
