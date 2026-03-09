import { Locale } from '@/i18n/config'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="flex min-h-screen bg-background text-foreground antialiased font-sans">
                <AdminSidebar locale={locale} />
                <main className="flex-1 flex flex-col">
                    <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center px-8 justify-end">
                        <ThemeToggle />
                    </header>
                    <div className="p-8 flex-1 overflow-auto bg-muted/10">
                        {children}
                    </div>
                </main>
            </div>
        </ThemeProvider>
    )
}
