import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ data, error })
}
