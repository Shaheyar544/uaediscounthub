import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminMobileSidebar } from '@/components/admin/AdminMobileSidebar'
import { AdminCommandCenter } from '@/components/admin/AdminCommandCenter'
import { AdminAppShell } from '@/components/admin/AdminAppShell'
import { AdminUserMenu } from '@/components/admin/AdminUserMenu'
import { ThemeToggle } from '@/components/theme-toggle'
import { AdminAuthError } from '@/utils/auth/admin'
import { requireAdmin } from '@/utils/auth/require-admin'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    let userEmail: string | undefined

    try {
        const { user } = await requireAdmin()
        userEmail = user.email
    } catch (error) {
        if (error instanceof AdminAuthError) {
            redirect(error.status === 401 ? `/${locale}/login` : `/${locale}`)
        }

        throw error
    }

    return (
        <AdminAppShell
            sidebar={<AdminSidebar locale={locale} />}
            topbar={<header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <AdminMobileSidebar locale={locale} />
                        <div className="hidden min-w-0 sm:block">
                            <p className="text-xs font-medium text-muted-foreground">Admin workspace</p>
                            <p className="truncate text-sm font-bold">UAE Discount Hub operations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <AdminCommandCenter locale={locale} />
                        <ThemeToggle />
                        {userEmail && <AdminUserMenu email={userEmail} locale={locale} />}
                    </div>
                </header>}
        >
            {children}
        </AdminAppShell>
    )
}
