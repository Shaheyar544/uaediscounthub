import Link from 'next/link'
import { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { Search, ShoppingCart, User, Menu } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SearchInput } from '@/components/layout/SearchInput'

export async function Navbar({ locale }: { locale: Locale }) {
    const dict = await getDictionary(locale);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4 md:px-6">
                <div className="mr-8 hidden md:flex">
                    <Link href={`/${locale}`} className="flex items-center space-x-2">
                        <span className="font-bold text-xl tracking-tight text-primary">UAEDISCOUNTHUB</span>
                    </Link>
                </div>

                {/* Mobile menu trigger */}
                <button className="md:hidden mr-4">
                    <Menu className="h-6 w-6" />
                </button>

                <div className="flex md:hidden flex-1">
                    <Link href={`/${locale}`} className="font-bold text-lg tracking-tight text-primary">
                        UDH
                    </Link>
                </div>

                <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
                    <Link href={`/${locale}/categories`} className="transition-colors hover:text-foreground/80 text-foreground/60">{dict.common.categories}</Link>
                    <Link href={`/${locale}/deals`} className="transition-colors hover:text-foreground/80 text-foreground/60">{dict.common.deals}</Link>
                    <Link href={`/${locale}/coupons`} className="transition-colors hover:text-foreground/80 text-foreground/60">{dict.common.coupons}</Link>
                    <Link href={`/${locale}/compare`} className="transition-colors hover:text-foreground/80 text-foreground/60">{dict.common.compare}</Link>
                </nav>

                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex relative w-64">
                        <SearchInput placeholder={dict.common.search} locale={locale} />
                    </div>

                    <Link href={locale === 'en' ? '/ar' : '/en'} className="text-sm font-semibold hover:text-primary transition-colors">
                        {locale === 'en' ? 'عربي' : 'EN'}
                    </Link>

                    <ThemeToggle />

                    <button className="relative">
                        <User className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    )
}
