import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/blog/posts/[id]
 * Retrieves a single blog post by ID or Slug.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, author:author_id(full_name,avatar_url,role), category:category_id(*), tags:blog_post_tags(tag:blog_tags(*))')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Fetch post error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PUT /api/blog/posts/[id]
 * Updates an existing blog post. (Admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { status, content } = body

    // Auto-calculate reading time if content changed
    if (content && !body.reading_time_min) {
      body.reading_time_min = Math.ceil(content.split(/\s+/).length / 200)
    }

    // Set published_at if status changed to published
    if (status === 'published' && !body.published_at) {
      body.published_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * DELETE /api/blog/posts/[id]
 * Soft-deletes a blog post (archived) or hard deletes if requested. (Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const hardDelete = searchParams.get('hard') === 'true'

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (hardDelete) {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: 'archived' })
        .eq('id', id)
      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
