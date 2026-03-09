import { Locale } from '@/i18n/config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { DollarSign, Tag, Users, Activity } from 'lucide-react'

export default async function AdminDashboard({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const supabase = await createClient()

    // Fetch simple aggregate counts
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
    const { count: clicksCount } = await supabase.from('affiliate_clicks').select('*', { count: 'exact', head: true })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground">Monitor your GCC affiliate network performance.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Revenue (Ref)</CardTitle>
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">¥--</div>
                        <p className="text-xs text-muted-foreground">Requires API sync</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Affiliate Clicks</CardTitle>
                        <Activity className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clicksCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Total out-bound clicks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                        <Tag className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productsCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Tracked in database</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
                        <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usersCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Active platform members</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Placeholder */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Overview Activity</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[250px] w-full flex items-center justify-center border-dashed border-2 rounded-xl bg-muted/20 text-muted-foreground">
                        Activity Chart (Implement Recharts)
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
