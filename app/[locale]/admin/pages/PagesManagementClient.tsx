'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Plus, Search, Edit3, Trash2, Loader2, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Page {
  id: string
  slug: string
  title_en: string
  title_ar: string
  status: 'draft' | 'published'
  placement: 'none' | 'header' | 'footer_c1' | 'footer_c2' | 'footer_c3'
  is_active: boolean
  updated_at: string
}

export default function PagesManagementClient({ locale }: { locale: string }) {
  const supabase = createClient()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pages')
      .select('id, slug, title_en, title_ar, status, placement, is_active, updated_at')
      .order('updated_at', { ascending: false })
    
    if (data) setPages(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id)
    
    if (error) alert('Failed to delete page')
    else fetchPages()
  }

  const toggleStatus = async (page: Page) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published'
    const { error } = await supabase
      .from('pages')
      .update({ status: newStatus })
      .eq('id', page.id)
    
    if (error) alert('Failed to update status')
    else fetchPages()
  }

  const filteredPages = pages.filter(p => 
    p.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0D1117]">Pages Management</h1>
          <p className="text-[13px] text-[#8A94A6] mt-1">Manage static content pages like Home, About, and Terms</p>
        </div>
        <Link 
          href={`/${locale}/admin/pages/new`}
          className="flex items-center gap-2 bg-[#0057FF] text-white px-5 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)]"
        >
          <Plus size={16} /> Create Page
        </Link>
      </div>

      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#DDE3EF] flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" size={14} />
                <input 
                  type="text" 
                  placeholder="Search pages..."
                  className="pl-9 pr-4 py-1.5 bg-[#F6F8FC] border border-[#DDE3EF] rounded-full text-[12px] outline-none focus:border-[#0057FF] w-64"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          <div className="text-[12px] text-[#8A94A6] font-medium">
            Total Pages: {pages.length}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#0057FF]" size={32} />
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="py-20 text-center text-[#8A94A6]">
            <p>No pages found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#F6F8FC] border-b border-[#DDE3EF]">
                <tr>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Page Title</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">URL Slug</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Placement</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Last Updated</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => (
                  <tr key={page.id} className="border-b border-[#DDE3EF] last:border-none hover:bg-[#F6F8FC] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[13px] text-[#0D1117]">{page.title_en}</div>
                      <div className="text-[11px] text-[#8A94A6] mt-0.5 font-arabic text-right">{page.title_ar}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <code className="text-[11px] bg-[#F6F8FC] px-2 py-0.5 rounded border border-[#DDE3EF] text-[#4B5675]">
                          /{page.slug}
                        </code>
                        <Link href={`/${locale}/${page.slug}`} target="_blank" className="text-[#8A94A6] hover:text-[#0057FF]">
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F6F8FC] text-[#4B5675] border border-[#DDE3EF]">
                        {page.placement === 'none' ? '—' :
                         page.placement === 'header' ? 'Header' :
                         page.placement === 'footer_c1' ? 'Footer C1' :
                         page.placement === 'footer_c2' ? 'Footer C2' : 'Footer C3'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-[12px] text-[#4B5675] font-medium">
                        {new Date(page.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(page)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
                          page.status === 'published' ? 'bg-[#e6faf5] text-[#00C48C]' : 'bg-[#F6F8FC] text-[#8A94A6]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${page.status === 'published' ? 'bg-[#00C48C]' : 'bg-[#8A94A6]'}`}></span>
                        {page.status}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/${locale}/admin/pages/${page.id}/edit`}
                          className="p-2 text-[#4B5675] hover:text-[#0057FF] hover:bg-[#e8f0ff] rounded-lg transition-all"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(page.id)}
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
    </div>
  )
}
