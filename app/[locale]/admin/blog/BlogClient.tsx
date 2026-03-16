'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
  Plus, Search, TrendingUp, FileText, CheckCircle, Clock,
  MoreVertical, Eye, Edit3, Trash2
} from 'lucide-react'

interface Post {
  id: string
  title: string
  excerpt: string | null
  status: string
  featured_image: string | null
  view_count: number
  created_at: string
  author?: { full_name: string }
  category?: { name: string, color: string }
}

export default function BlogClient({ locale }: { locale: string }) {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([
    { label: 'Total Posts', value: 0, delta: '+0 this week', color: 'text-[#0D1117]', icon: <FileText size={20} /> },
    { label: 'Published', value: 0, delta: 'Live & Indexed', color: 'text-[#00C48C]', icon: <CheckCircle size={20} /> },
    { label: 'Drafts', value: 0, delta: 'Pending', color: 'text-[#FFC107]', icon: <Clock size={20} /> },
    { label: 'Monthly Views', value: '0', delta: '+0% MoM', color: 'text-[#0057FF]', icon: <TrendingUp size={20} /> },
  ])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch Stats
      const { count: totalPosts } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true })
      const { count: publishedPosts } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published')
      const { count: drafts } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft')

      setStats([
        { label: 'Total Posts', value: totalPosts || 0, delta: '+3 this week', color: 'text-[#0D1117]', icon: <FileText size={20} /> },
        { label: 'Published', value: publishedPosts || 0, delta: 'Live & Indexed', color: 'text-[#00C48C]', icon: <CheckCircle size={20} /> },
        { label: 'Drafts', value: drafts || 0, delta: 'Pending', color: 'text-[#FFC107]', icon: <Clock size={20} /> },
        { label: 'Monthly Views', value: '84K', delta: '+22% MoM', color: 'text-[#0057FF]', icon: <TrendingUp size={20} /> },
      ])

      // Fetch Posts
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, author:author_id(full_name), category:category_id(name, color)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      console.error('Error fetching blog data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0D1117]">Blog Posts</h1>
            <p className="text-[13px] text-[#8A94A6] mt-1">Manage all blog content, SEO, and publishing</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-[8px] border-[1.5px] border-[#DDE3EF] bg-white text-[#0D1117] font-semibold text-[13px] hover:border-[#0057FF] transition-all">
              📥 Import CSV
            </button>
            <Link 
              href={`/${locale}/admin/blog/new`}
              className="flex items-center gap-2 bg-[#0057FF] text-white px-5 py-2 rounded-[8px] font-bold text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)]"
            >
              <Plus size={16} /> New Post
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5 shadow-sm">
              <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-[0.5px] mb-2">{stat.label}</div>
              <div className={`text-[28px] font-extrabold ${stat.color}`}>{stat.value}</div>
              <div className={`text-[11px] mt-1 font-medium ${stat.delta.includes('↑') || stat.delta.includes('+') ? 'text-[#00C48C]' : 'text-[#8A94A6]'}`}>
                {stat.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Table Toolbar */}
        <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#DDE3EF] flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" size={16} />
              <input 
                type="text" 
                placeholder="Search posts..." 
                className="w-full pl-10 pr-4 py-2 bg-white border-[1.5px] border-[#DDE3EF] rounded-[8px] text-[13px] outline-none focus:border-[#0057FF] transition-colors"
              />
            </div>
            
            <select className="bg-white border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] font-semibold text-[#4B5675] outline-none">
              <option>All Status</option>
              <option>Published</option>
              <option>Draft</option>
              <option>Scheduled</option>
            </select>

            <select className="bg-white border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] font-semibold text-[#4B5675] outline-none">
              <option>All Categories</option>
            </select>

            <div className="ml-auto text-[12px] text-[#8A94A6] font-medium">
              Showing {posts.length} posts
            </div>
          </div>

          {/* Posts Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#F6F8FC] border-b border-[#DDE3EF]">
                <tr>
                  <th className="p-4 text-left w-10"><input type="checkbox" className="rounded text-[#0057FF]" /></th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Post</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Category</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Author</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Views</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Date</th>
                  <th className="p-4 text-right text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-[13px] text-[#8A94A6]">Loading posts...</td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-[13px] text-[#8A94A6]">No posts found.</td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="border-b border-[#DDE3EF] last:border-none hover:bg-[#F6F8FC] transition-colors">
                      <td className="p-4"><input type="checkbox" className="rounded text-[#0057FF]" /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-[#e8f0ff] flex items-center justify-center text-xl flex-shrink-0 overflow-hidden relative">
                            {post.featured_image ? (
                              <img src={post.featured_image} className="w-full h-full object-cover" alt="" />
                            ) : (
                              '📝'
                            )}
                          </div>
                          <div className="max-w-[280px]">
                            <div className="text-[13px] font-bold text-[#0D1117] line-clamp-1">{post.title}</div>
                            <div className="text-[11px] text-[#8A94A6] line-clamp-1 mt-0.5">{post.excerpt || 'No excerpt provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span 
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${post.category?.color}20` || '#F0F3FA', color: post.category?.color || '#8A94A6' }}
                        >
                          {post.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0057FF] text-white text-[9px] font-bold flex items-center justify-center">
                            {post.author?.full_name?.[0] || 'A'}
                          </div>
                          <span className="text-[12px] font-semibold text-[#4B5675]">{post.author?.full_name || 'Admin'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1.5 w-fit ${
                          post.status === 'published' ? 'bg-[#e6faf5] text-[#00C48C]' : 
                          post.status === 'draft' ? 'bg-[#F0F3FA] text-[#8A94A6]' : 
                          'bg-[#fff8e0] text-[#FFC107]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            post.status === 'published' ? 'bg-[#00C48C]' : 
                            post.status === 'draft' ? 'bg-[#8A94A6]' : 
                            'bg-[#FFC107]'
                          }`}></span>
                          {post.status}
                        </span>
                      </td>
                      <td className="p-4 text-[13px] font-bold text-[#0D1117]">{post.view_count.toLocaleString()}</td>
                      <td className="p-4 text-[12px] text-[#8A94A6] font-medium">
                        {new Date(post.created_at).toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link 
                            href={`/${locale}/admin/blog/${post.id}/edit`}
                            className="p-2 text-[#4B5675] hover:text-[#0057FF] hover:bg-[#e8f0ff] rounded-lg transition-all"
                          >
                            <Edit3 size={16} />
                          </Link>
                          <button className="p-2 text-[#4B5675] hover:text-[#0D1117] hover:bg-[#F0F3FA] rounded-lg transition-all">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 text-[#4B5675] hover:text-[#FF3B30] hover:bg-[#FFF0EF] rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}
