import { createAdminClient } from '@/utils/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users as UsersIcon, Mail, Shield, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Profile {
  id: string
  email: string | null
  display_name: string | null
  role: string | null
  country_code: string | null
  created_at: string
}

interface MergedUser extends Profile {
  last_sign_in_at: string | null
}

export default async function AdminUsersPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  await params

  const admin = createAdminClient()

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    admin.from('profiles').select('id, email, display_name, role, country_code, created_at').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const authMap = new Map(authData?.users?.map(u => [u.id, u]) ?? [])

  const users: MergedUser[] = (profiles ?? []).map((p: Profile) => {
    const authUser = authMap.get(p.id)
    return {
      ...p,
      email: p.email ?? authUser?.email ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    }
  })

  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-extrabold text-[#0D1117]">Registered Users</h1>
        <p className="text-[13px] text-[#8A94A6] mt-1">Manage platform members and permissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{adminCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <UsersIcon className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{users.length - adminCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F8FC] border-b border-[#DDE3EF]">
              <tr>
                <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">User</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Role</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Country</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Last Sign In</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3EF]">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-[#F6F8FC] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8F0FF] flex items-center justify-center font-bold text-[#0057FF] text-[13px] flex-shrink-0">
                        {(user.email ?? user.display_name ?? '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-[13px] text-[#0D1117] block">
                          {user.display_name || 'No Name'}
                        </span>
                        <span className="text-[11px] text-[#8A94A6] flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email ?? '—'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className="capitalize text-[11px]"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role ?? 'user'}
                    </Badge>
                  </td>
                  <td className="p-4 text-[13px] font-medium text-[#0D1117]">
                    {user.country_code ?? 'AE'}
                  </td>
                  <td className="p-4 text-[12px] text-[#8A94A6]">
                    {user.last_sign_in_at ? (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(user.last_sign_in_at), 'PPp')}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="p-4 text-[12px] text-[#8A94A6]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(user.created_at), 'PP')}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#8A94A6] text-[13px]">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
