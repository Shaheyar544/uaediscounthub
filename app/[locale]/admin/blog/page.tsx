import { createAdminClient } from '@/utils/supabase/admin'
import BlogClient from './BlogClient'

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const admin = createAdminClient()

  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: drafts },
    { data: posts },
  ] = await Promise.all([
    admin.from('blog_posts').select('*', { count: 'exact', head: true }),
    admin.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    admin
      .from('blog_posts')
      .select('*, author:author_id(display_name), category:category_id(name, color)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <BlogClient
      locale={locale}
      initialPosts={posts || []}
      initialStats={{
        totalPosts: totalPosts || 0,
        publishedPosts: publishedPosts || 0,
        drafts: drafts || 0,
      }}
    />
  )
}
