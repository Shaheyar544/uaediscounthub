import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// POST /api/coupons/verify
// Body: { coupon_id, worked: boolean }
// Community feedback: did the code work?
export async function POST(req: NextRequest) {
  try {
    const { coupon_id, worked } = await req.json()

    if (!coupon_id || worked === undefined) {
      return NextResponse.json(
        { error: 'coupon_id and worked required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: coupon } = await supabase
      .from('coupons')
      .select('current_uses, is_verified')
      .eq('id', coupon_id)
      .single()

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    // If worked → increment current_uses and mark as verified
    if (worked) {
      await supabase
        .from('coupons')
        .update({
          current_uses: (coupon.current_uses ?? 0) + 1,
          is_verified: true,
        })
        .eq('id', coupon_id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[coupon-verify] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET /api/coupons/verify?store_id=xxx
// Returns active verified coupons for a store (for store page use)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const store_id = searchParams.get('store_id')

  const supabase = await createClient()

  let query = supabase
    .from('coupons')
    .select(
      `id, code, title_en, discount_type, discount_value,
       is_verified, is_exclusive, expires_at, click_count, current_uses`
    )
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .order('click_count', { ascending: false })
    .limit(20)

  if (store_id) {
    query = query.eq('store_id', store_id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupons: data })
}
