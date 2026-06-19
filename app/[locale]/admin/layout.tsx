import { AdminSidebar } from '@/components/admin/AdminSidebar'
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
        <div className="flex min-h-screen bg-background text-foreground antialiased font-sans" suppressHydrationWarning>
            <AdminSidebar locale={locale} />
            <main className="flex-1 flex flex-col">
                <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center px-8 justify-end gap-3">
                    {userEmail && (
                        <AdminUserMenu email={userEmail} locale={locale} />
                    )}
                    <ThemeToggle />
                </header>
                <div className="p-8 flex-1 overflow-auto bg-muted/10">
                    <div className="max-w-7xl">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
