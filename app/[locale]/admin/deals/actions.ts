'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function toggleDealActive(id: string, currentStatus: boolean, locale: string) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('deals')
        .update({ is_active: !currentStatus })
        .eq('id', id)
    
    if (error) {
        console.error('Error toggling deal:', error)
        throw new Error('Failed to toggle deal status')
    }
    revalidatePath(`/${locale}/admin/deals`)
}

export async function updateDeal(id: string, data: any, locale: string) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('deals')
        .update(data)
        .eq('id', id)
    
    if (error) {
        console.error('Error updating deal:', error)
        throw new Error('Failed to update deal')
    }
    revalidatePath(`/${locale}/admin/deals`)
}

export async function deleteDeal(id: string, locale: string) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id)
        
    if (error) {
        console.error('Error deleting deal:', error)
        throw new Error('Failed to delete deal')
    }
    revalidatePath(`/${locale}/admin/deals`)
}
