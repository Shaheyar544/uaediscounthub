import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createHash } from 'crypto'

// POST /api/coupons/track
// Body: { coupon_id, store_id, session_id }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { coupon_id, store_id, session_id } = body

    if (!coupon_id) {
      return NextResponse.json({ error: 'coupon_id required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Increment click count atomically via RPC (falls back to read-then-write)
    const { error: rpcError } = await supabase.rpc('increment_coupon_clicks', {
      p_coupon_id: coupon_id,
    })

    // If RPC not set up yet, do manual increment
    if (rpcError) {
      const { data: existing } = await supabase
        .from('coupons')
        .select('click_count')
        .eq('id', coupon_id)
        .single()

      if (existing) {
        await supabase
          .from('coupons')
          .update({ click_count: (existing.click_count ?? 0) + 1 })
          .eq('id', coupon_id)
      }
    }

    // Insert affiliate click record
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const ipHash = createHash('sha256').update(ip).digest('hex').substring(0, 16)

    await supabase.from('affiliate_clicks').insert([
      {
        coupon_id,
        store_id: store_id ?? null,
        session_id: session_id ?? null,
        ip_hash: ipHash,
        user_agent: req.headers.get('user-agent') ?? null,
        referrer: req.headers.get('referer') ?? null,
      },
    ])

    // Return affiliate redirect URL
    const { data: couponData } = await supabase
      .from('coupons')
      .select('stores ( affiliate_base_url, base_url )')
      .eq('id', coupon_id)
      .single()

    const store = (couponData?.stores as any)
    const redirectUrl =
      store?.affiliate_base_url ?? store?.base_url ?? null

    return NextResponse.json({ success: true, redirect_url: redirectUrl })
  } catch (err) {
    console.error('[coupon-track] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
