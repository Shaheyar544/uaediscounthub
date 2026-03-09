"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Tags, Users, Settings, LogOut, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
    { href: '', label: 'Overview', icon: LayoutDashboard },
    { href: '/products', label: 'Products', icon: ShoppingBag },
    { href: '/coupons', label: 'Coupons & Deals', icon: Tags },
    { href: '/newsletters', label: 'Newsletter', icon: Mail },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar({ locale }: { locale: string }) {
    const pathname = usePathname()

    return (
        <aside className="w-64 border-r bg-muted/20 min-h-screen flex flex-col">
            <div className="h-16 flex items-center px-6 border-b">
                <Link href={`/${locale}/admin`} className="font-bold text-lg text-primary tracking-tight">UDH Admin</Link>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => {
                    const fullHref = `/${locale}/admin${item.href}`
                    const active = pathname === fullHref

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
                })}
            </nav>
            <div className="p-4 border-t">
                <form action="/api/auth/signout" method="post">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                    </Button>
                </form>
            </div>
        </aside>
    )
}
