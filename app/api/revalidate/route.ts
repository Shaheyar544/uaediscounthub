import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * On-demand revalidation API
 * Usage: POST /api/revalidate?secret=YOUR_SECRET
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  // In a production app, you would check a secret token here
  // if (secret !== process.env.REVALIDATE_SECRET) {
  //   return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  // }

  try {
    // Revalidate the main entry points
    revalidatePath('/')
    revalidatePath('/[locale]', 'layout')
    revalidatePath('/[locale]/coupons', 'page')
    revalidatePath('/[locale]/coupons/[storeSlug]', 'page')
    revalidatePath('/[locale]/stores', 'page')

    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      paths: ['/', '/en', '/ar', '/en/coupons', '/ar/coupons'] 
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
