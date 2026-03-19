import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminUserMenu } from '@/components/admin/AdminUserMenu'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/utils/supabase/server'

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="flex min-h-screen bg-background text-foreground antialiased font-sans" suppressHydrationWarning>
            <AdminSidebar locale={locale} />
            <main className="flex-1 flex flex-col">
                <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center px-8 justify-end gap-3">
                    {user?.email && (
                        <AdminUserMenu email={user.email} locale={locale} />
                    )}
                    <ThemeToggle />
                </header>
                <div className="p-8 flex-1 overflow-auto bg-muted/10">
                    {children}
                </div>
            </main>
        </div>
    )
}
