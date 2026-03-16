import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users as UsersIcon, Mail, Shield, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default async function AdminUsersPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const supabase = await createClient()

    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Registered Users</h1>
                    <p className="text-muted-foreground mt-1">Manage platform members and permissions.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UsersIcon className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-muted border-b">
                        <tr>
                            <th className="p-4 text-left font-semibold">User</th>
                            <th className="p-4 text-left font-semibold">Role</th>
                            <th className="p-4 text-left font-semibold">Country</th>
                            <th className="p-4 text-left font-semibold">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users?.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {user.email?.[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-bold block">{user.display_name || 'No Name'}</span>
                                            <span className="text-xs text-muted-foreground flex items-center">
                                                <Mail className="w-3 h-3 mr-1" /> {user.email}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                        <Shield className="w-3 h-3 mr-1" /> {user.role}
                                    </Badge>
                                </td>
                                <td className="p-4 font-medium">{user.country_code || 'AE'}</td>
                                <td className="p-4 text-muted-foreground">
                                    <div className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {format(new Date(user.created_at), 'PPP')}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!users || users.length === 0) && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-muted-foreground">
                                    No users found in the system.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
