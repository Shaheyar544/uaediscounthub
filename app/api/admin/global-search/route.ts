import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthError } from '@/utils/auth/admin'
import { requireAdmin } from '@/utils/auth/require-admin'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 80) ?? ''
  if (query.length < 2) return NextResponse.json({ groups: [] })
  try {
    const { supabase } = await requireAdmin()
    const pattern = `%${query}%`
    const [products, deals, coupons, stores, categories, posts, pages, users] = await Promise.all([
      supabase.from('products').select('id, name_en, name, slug, is_active').or(`name_en.ilike.${pattern},name.ilike.${pattern}`).limit(5),
      supabase.from('deals').select('id, title, is_active').ilike('title', pattern).limit(5),
      supabase.from('coupons').select('id, code, title_en, is_active').or(`code.ilike.${pattern},title_en.ilike.${pattern}`).limit(5),
      supabase.from('stores').select('id, name, slug, is_active').ilike('name', pattern).limit(5),
      supabase.from('categories').select('id, name, slug').ilike('name', pattern).limit(5),
      supabase.from('blog_posts').select('id, title_en, slug, is_published').ilike('title_en', pattern).limit(5),
      supabase.from('pages').select('id, title, slug, is_published').ilike('title', pattern).limit(5),
      supabase.from('profiles').select('id, email, display_name, role').or(`email.ilike.${pattern},display_name.ilike.${pattern}`).limit(5),
    ])
    const groups = [
      { label: 'Products', results: (products.data ?? []).map((row: any) => ({ id: row.id, label: row.name_en || row.name || 'Untitled product', detail: row.slug || 'Product', type: 'Product', status: row.is_active ? 'Active' : 'Inactive', href: `/products/${row.id}/edit` })) },
      { label: 'Deals & coupons', results: [...(deals.data ?? []).map((row: any) => ({ id: row.id, label: row.title || 'Untitled deal', detail: 'Deal', type: 'Deal', status: row.is_active ? 'Active' : 'Inactive', href: '/deals' })), ...(coupons.data ?? []).map((row: any) => ({ id: row.id, label: row.code || row.title_en || 'Untitled coupon', detail: row.title_en || 'Coupon', type: 'Coupon', status: row.is_active ? 'Active' : 'Inactive', href: '/coupons' }))] },
      { label: 'Stores & categories', results: [...(stores.data ?? []).map((row: any) => ({ id: row.id, label: row.name, detail: row.slug || 'Store', type: 'Store', status: row.is_active ? 'Active' : 'Inactive', href: '/stores' })), ...(categories.data ?? []).map((row: any) => ({ id: row.id, label: row.name, detail: row.slug || 'Category', type: 'Category', href: '/categories' }))] },
      { label: 'Content & users', results: [...(posts.data ?? []).map((row: any) => ({ id: row.id, label: row.title_en || 'Untitled post', detail: row.slug || 'Blog post', type: 'Blog', status: row.is_published ? 'Published' : 'Draft', href: `/blog/${row.id}/edit` })), ...(pages.data ?? []).map((row: any) => ({ id: row.id, label: row.title || 'Untitled page', detail: row.slug || 'Page', type: 'Page', status: row.is_published ? 'Published' : 'Draft', href: `/pages/${row.id}/edit` })), ...(users.data ?? []).map((row: any) => ({ id: row.id, label: row.display_name || row.email, detail: row.email, type: 'User', status: row.role, href: '/users' }))] },
    ].filter((group) => group.results.length > 0)
    return NextResponse.json({ groups })
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Admin global search failed', error)
    return NextResponse.json({ error: 'Search is temporarily unavailable.' }, { status: 500 })
  }
}
