import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { PostEditor } from '@/components/admin/blog/PostEditor'

/**
 * Admin: New Blog Post Page
 */
export default async function AdminNewPostPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  // Fetch categories for the selector
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name')

  return (
    <PostEditor categories={categories || []} />
  )
}
