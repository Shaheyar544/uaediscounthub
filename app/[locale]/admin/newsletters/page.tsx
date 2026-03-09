import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Trash2, Users } from 'lucide-react'
import { deleteSubscriber } from '@/app/[locale]/admin/newsletters/actions'

export default async function AdminNewslettersPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const supabase = await createClient()

    const { data: subscribers, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Newsletter Leads</h1>
                    <p className="text-muted-foreground">Manage your subscriber base and export lists for campaigns.</p>
                </div>
                <a href="/api/admin/newsletters/export" download>
                    <Button className="flex items-center space-x-2" variant="outline">
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </Button>
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-card p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center space-x-2 text-primary mb-2">
                        <Users className="w-5 h-5" />
                        <span className="font-semibold">Total Subscribers</span>
                    </div>
                    <div className="text-3xl font-bold">{subscribers?.length || 0}</div>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Email Address</TableHead>
                            <TableHead>Subscription Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!subscribers || subscribers.length === 0) ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No subscribers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subscribers.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">
                                        {sub.email}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(sub.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={sub.is_confirmed ? 'default' : 'secondary'}>
                                            {sub.is_confirmed ? 'Confirmed' : 'Pending'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <form action={async () => {
                                            "use server"
                                            await deleteSubscriber(sub.id, locale)
                                        }}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
