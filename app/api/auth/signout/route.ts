import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()

    // Check if a user's logged in
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        await supabase.auth.signOut()
    }

    // Find origin or fallback
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(`${requestUrl.origin}/en`, {
        status: 301,
    })
}
