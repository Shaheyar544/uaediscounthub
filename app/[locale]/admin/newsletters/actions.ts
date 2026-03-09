"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function deleteSubscriber(id: string, locale: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/${locale}/admin/newsletters`)
    return { success: true }
}
