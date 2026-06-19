import { createClient } from '@/utils/supabase/server'
import { Zap, TrendingUp, Clock, Box, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DealsTableClient } from '@/components/admin/deals/DealsTableClient'

export const dynamic = 'force-dynamic'

export default async function AdminDealsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const supabase = await createClient()

    const { data: deals } = await supabase
        .from('deals')
        .select('*, stores ( id, name, slug ), products ( name_en, slug )')
        .order('created_at', { ascending: false })

    const { data: stores } = await supabase
        .from('stores')
        .select('id, name')
        .order('name')

    const totalActive = deals?.filter((d) => d.is_active).length ?? 0
    const totalDiscounts = deals?.length ?? 0
    const totalClicks = deals?.reduce((sum, d) => sum + (d.click_count ?? 0), 0) ?? 0
    const expiringSoon = deals?.filter((d) => {
        if (!d.expires_at) return false
        const inDays = (new Date(d.expires_at).getTime() - Date.now()) / 86400000
        return inDays >= 0 && inDays <= 3
    }).length ?? 0

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Deals Registry</h1>
                    <p className="text-muted-foreground">Manage imported flash deals, discounts, and specific store offers.</p>
                </div>
                <Button className="font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Add Deal
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: <Zap className="w-5 h-5" />, value: totalActive, label: 'Active Deals', color: '#0A84FF', bg: '#0A84FF1A' },
                    { icon: <Box className="w-5 h-5" />, value: totalDiscounts, label: 'Total Imported', color: '#00C875', bg: '#00C8751A' },
                    { icon: <TrendingUp className="w-5 h-5" />, value: totalClicks.toLocaleString(), label: 'Total Clicks', color: '#A855F7', bg: '#A855F71A' },
                    { icon: <Clock className="w-5 h-5" />, value: expiringSoon, label: 'Expiring in 3 days', color: '#FF6B00', bg: '#FF6B001A' },
                ].map((stat, i) => (
                    <div key={i} className="rounded-xl border bg-card p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: stat.bg, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold leading-tight" style={{ color: stat.color }}>{stat.value}</p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <DealsTableClient 
                deals={deals || []} 
                stores={stores || []} 
                locale={locale} 
            />
        </div>
    )
}
