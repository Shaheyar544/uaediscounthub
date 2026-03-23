"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, ShoppingBag, Tags, Users, Settings,
    LogOut, Mail, FileText, PenTool, Layout, FolderTree,
    FileCode, Store, Beaker, UserCircle, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHasMounted } from '@/hooks/use-has-mounted'

const mainNavItems = [
    { href: '', label: 'Overview', icon: LayoutDashboard },
    { href: '/products', label: 'Products', icon: ShoppingBag },
    { href: '/categories', label: 'Categories', icon: FolderTree },
    { href: '/stores', label: 'Stores', icon: Store },
    { href: '/coupons', label: 'Coupons', icon: Tags },
    { href: '/deals', label: 'Deals', icon: Zap },
    { href: '/newsletters', label: 'Newsletter', icon: Mail },
    { href: '/users', label: 'Users', icon: Users },
]

const contentNavItems = [
    { href: '/pages', label: 'Pages', icon: FileCode },
    { href: '/blog', label: 'Blog Posts', icon: FileText },
    { href: '/blog/new', label: 'Write New Post', icon: PenTool },
    { href: '/blog/ad-widgets', label: 'Ad Widgets', icon: Layout },
]

const settingsNavItems = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/api-sandbox', label: 'API Sandbox', icon: Beaker },
    { href: '/profile', label: 'My Profile', icon: UserCircle },
]

export function AdminSidebar({ locale }: { locale: string }) {
    const pathname = usePathname()
    const hasMounted = useHasMounted()

    const renderNavItem = (item: any) => {
        const fullHref = `/${locale}/admin${item.href}`
        const active = pathname === fullHref || (item.href !== '' && pathname.startsWith(fullHref))

        return (
            <Link
                key={item.href}
                href={fullHref}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
            </Link>
        )
    }

    return (
        <aside className="w-64 border-r bg-muted/20 min-h-screen flex flex-col">
            <div className="h-16 flex items-center px-6 border-b">
                <Link href={`/${locale}/admin`} className="font-bold text-lg text-primary tracking-tight">UDH Admin</Link>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                <nav className="space-y-2">
                    <div className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Main</div>
                    {mainNavItems.map(renderNavItem)}
                </nav>

                <nav className="space-y-2">
                    <div className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Content</div>
                    {contentNavItems.map(renderNavItem)}
                </nav>

                <nav className="space-y-2">
                    <div className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">System</div>
                    {settingsNavItems.map(renderNavItem)}
                </nav>
            </div>
            <div className="p-4 border-t h-20">
                {hasMounted && (
                    <form action="/api/auth/signout" method="post" data-lpignore="true">
                        <Button 
                            type="submit"
                            variant="ghost" 
                            className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            suppressHydrationWarning
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                        </Button>
                    </form>
                )}
            </div>
        </aside>
    )
}
