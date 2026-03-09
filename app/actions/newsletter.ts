"use server"

import { createClient } from '@/utils/supabase/server'

export async function subscribeToNewsletter(formData: FormData) {
    const email = formData.get('email') as string
    if (!email) return { success: false, error: 'Email is required' }

    const supabase = await createClient()

    const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email }])

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { success: true, message: "You're already subscribed!" }
        }
        console.error('Newsletter subscription error:', error)
        return { success: false, error: 'Failed to subscribe. Please try again later.' }
    }

    return { success: true, message: "Successfully subscribed!" }
}
