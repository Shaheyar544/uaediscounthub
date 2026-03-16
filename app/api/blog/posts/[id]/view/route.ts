import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const supabase = await createClient()
    
    // Use an RPC call to increment atomically
    const { error } = await supabase.rpc('increment_view_count', { 
        post_id: id 
    })

    if (error) {
        // Fallback if RPC doesn't exist yet: Manual increment
        const { data: post } = await supabase.from('blog_posts').select('view_count').eq('id', id).single()
        await supabase.from('blog_posts').update({ view_count: (post?.view_count || 0) + 1 }).eq('id', id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
