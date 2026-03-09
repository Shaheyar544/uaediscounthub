"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function addProduct(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const base_price = parseFloat(formData.get('base_price') as string)
    const image_url = formData.get('image_url') as string
    const category_id = formData.get('category_id') as string || null
    const locale = formData.get('locale') as string || 'en'

    // Construct JSONB Specs
    let specs = {}
    try {
        const rawSpecs = formData.get('specs') as string
        if (rawSpecs) specs = JSON.parse(rawSpecs)
    } catch (e) {
        console.warn("Invalid specs JSON provided.")
    }

    const { data, error } = await supabase.from('products').insert({
        name,
        slug,
        description,
        base_price,
        image_url,
        category_id,
        specs,
        currency: 'AED' // Default to AED for UAE Discount Hub
    }).select().single()

    if (error) {
        console.error("Insert Error", error)
        redirect(`/${locale}/admin/products/new?error=${encodeURIComponent(error.message)}`)
    }

    // Revalidate the products table to instantly show the new row
    revalidatePath(`/${locale}/admin/products`)
    redirect(`/${locale}/admin/products`)
}
