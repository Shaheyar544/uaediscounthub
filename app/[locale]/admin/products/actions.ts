"use server"

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { generateDeepSeekSummary } from '@/utils/ai/deepseek'

export async function deleteProduct(id: string, locale: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete error:', error)
        return { error: error.message }
    }

    revalidatePath(`/${locale}/admin/products`)
    return { success: true }
}

export async function generateAISummaryForProduct(productId: string, locale: string) {
    const supabase = await createClient()

    // 1. Fetch product
    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('name_en, specifications')
        .eq('id', productId)
        .single()

    if (fetchError || !product) {
        return { error: 'Product not found' }
    }

    try {
        // 2. Call AI
        const specsString = JSON.stringify(product.specifications || {})
        const summary = await generateDeepSeekSummary(product.name_en, specsString)

        // 3. Update DB
        const { error: updateError } = await supabase
            .from('products')
            .update({ ai_summary_en: summary })
            .eq('id', productId)

        if (updateError) throw updateError

        revalidatePath(`/${locale}/admin/products`)
        return { success: true, summary }
    } catch (err: any) {
        console.error('AI Summary Error:', err)
        return { error: err.message || 'AI Generation Failed' }
    }
}
