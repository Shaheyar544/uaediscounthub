"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createCoupon(formData: FormData, locale: string) {
    const supabase = await createClient()

    const data = {
        store_id: formData.get('store_id') as string,
        code: (formData.get('code') as string).toUpperCase().trim(),
        title_en: formData.get('title_en') as string,
        title_ar: formData.get('title_ar') as string,
        description_en: formData.get('description_en') as string,
        discount_type: formData.get('discount_type') as string,
        discount_value: parseFloat(formData.get('discount_value') as string),
        min_order_value: formData.get('min_order_value') ? parseFloat(formData.get('min_order_value') as string) : null,
        expires_at: formData.get('expires_at') || null,
        is_active: formData.get('is_active') === 'on',
        is_exclusive: formData.get('is_exclusive') === 'on',
        is_verified: formData.get('is_verified') === 'on',
    }

    const { error } = await supabase.from('coupons').insert([data])

    if (error) {
        console.error('Coupon creation error:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/${locale}/admin/coupons`)
    revalidatePath(`/${locale}/coupons`)
    return { success: true }
}

export async function updateCoupon(id: string, formData: FormData, locale: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return { success: false, error: 'The coupon could not be found.' }
    }

    const supabase = await createClient()
    const data = {
        store_id: formData.get('store_id') as string,
        code: (formData.get('code') as string).toUpperCase().trim(),
        title_en: formData.get('title_en') as string,
        title_ar: formData.get('title_ar') as string,
        description_en: formData.get('description_en') as string,
        discount_type: formData.get('discount_type') as string,
        discount_value: parseFloat(formData.get('discount_value') as string),
        min_order_value: formData.get('min_order_value') ? parseFloat(formData.get('min_order_value') as string) : null,
        expires_at: formData.get('expires_at') || null,
        is_active: formData.get('is_active') === 'on',
        is_exclusive: formData.get('is_exclusive') === 'on',
        is_verified: formData.get('is_verified') === 'on',
    }

    const { error } = await supabase.from('coupons').update(data).eq('id', id)
    if (error) {
        console.error('Coupon update error:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/${locale}/admin/coupons`)
    revalidatePath(`/${locale}/coupons`)
    revalidatePath(`/${locale}`)
    return { success: true }
}

export async function deleteCoupon(id: string, locale: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/${locale}/admin/coupons`)
    revalidatePath(`/${locale}/coupons`)
    return { success: true }
}

export async function bulkDeleteCoupons(ids: string[], locale: string) {
    const couponIds = [...new Set(ids)].filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    if (couponIds.length === 0) return { success: false, error: 'Select at least one coupon to delete.' }

    const supabase = await createClient()
    const { error } = await supabase.from('coupons').delete().in('id', couponIds)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/${locale}/admin/coupons`)
    revalidatePath(`/${locale}/coupons`)
    return { success: true, deleted: couponIds.length }
}

export async function toggleCouponActive(id: string, isActive: boolean, locale: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/${locale}/admin/coupons`)
    revalidatePath(`/${locale}/coupons`)
    return { success: true }
}

export async function verifyCoupon(id: string, locale: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('coupons').update({ is_verified: true }).eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/${locale}/admin/coupons`)
    revalidatePath(`/${locale}/coupons`)
    return { success: true }
}
