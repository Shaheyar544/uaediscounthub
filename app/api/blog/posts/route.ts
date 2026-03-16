import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { BlogPost } from '@/types/blog'

/**
 * GET /api/blog/posts
 * Retrieves a list of blog posts with filtering, sorting, and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const locale = searchParams.get('locale') || 'en'
    const search = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sortBy = searchParams.get('sortBy') || 'published_at'
    const order = searchParams.get('order') || 'desc'

    let query = supabase
      .from('blog_posts')
      .select('*, author:author_id(full_name,avatar_url,role), category:category_id(*)', { count: 'exact' })
      .eq('locale', locale)

    if (status) query = query.eq('status', status)
    else query = query.eq('status', 'published') // Default to published for public consumption

    if (category) query = query.eq('category_id', category)
    
    // For tags, we'd need a subquery or join via blog_post_tags
    // Simplified for now, but can be expanded

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query
      .order(sortBy, { ascending: order === 'asc' })
      .range(from, to)

    const { data, count, error } = await query

    if (error) throw error

    return NextResponse.json({
      posts: data as BlogPost[],
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error: any) {
    console.error('Fetch posts error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/blog/posts
 * Creates a new blog post. (Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      title, 
      subtitle, 
      slug, 
      content, 
      excerpt, 
      featured_image, 
      og_image, 
      status, 
      scheduled_at, 
      category_id, 
      reading_time_min, 
      seo_title, 
      seo_description, 
      seo_keywords, 
      canonical_url, 
      schema_type, 
      is_featured, 
      allow_comments, 
      locale 
    } = body

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, Slug, and Content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title,
        subtitle,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 160).replace(/<[^>]+>/g, ''),
        featured_image,
        og_image,
        status: status || 'draft',
        scheduled_at,
        published_at: status === 'published' ? new Date().toISOString() : null,
        author_id: user.id,
        category_id,
        reading_time_min: reading_time_min || Math.ceil(content.split(/\s+/).length / 200),
        seo_title,
        seo_description,
        seo_keywords,
        canonical_url,
        schema_type: schema_type || 'Article',
        is_featured: is_featured || false,
        allow_comments: allow_comments !== false,
        locale: locale || 'en'
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
