import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: subscribers, error } = await supabase
            .from('newsletter_subscribers')
            .select('email, country, created_at')
            .order('created_at', { ascending: false })

        if (error) throw error

        if (!subscribers || subscribers.length === 0) {
            return new NextResponse('No subscribers to export', { status: 404 })
        }

        // Generate CSV content
        const headers = ['Email Address', 'Country', 'Joined Date']
        const rows = subscribers.map(s => [
            s.email,
            s.country,
            new Date(s.created_at).toISOString()
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n')

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="uaediscounthub-subscribers-${new Date().toISOString().split('T')[0]}.csv"`
            }
        })
    } catch (err) {
        console.error('Export Error:', err)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
