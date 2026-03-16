import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { PostEditor } from '@/components/admin/blog/PostEditor'
import { notFound } from 'next/navigation'

/**
 * Admin: Edit Blog Post Page
 */
export default async function AdminEditPostPage(props: { params: Promise<{ id: string, locale: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  // Fetch the post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*, author:author_id(full_name,avatar_url,role), category:category_id(*), tags:blog_post_tags(tag:blog_tags(*))')
    .eq('id', id)
    .single()

  if (!post || error) {
    notFound()
  }

  // Fetch categories for the selector
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name')

  return (
    <PostEditor initialPost={post} categories={categories || []} />
  )
}
