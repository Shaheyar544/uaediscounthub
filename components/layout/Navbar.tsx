import Link from 'next/link'
import { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { Search, Bell, Moon, Sun, Monitor } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/utils/supabase/server'
import { SearchInput } from '@/components/layout/SearchInput'

export async function Navbar({ locale }: { locale: Locale }) {
    const dict = await getDictionary(locale);
    const supabase = await createClient();

    const { data: headerPages } = await supabase
        .from('pages')
        .select('slug, title_en, title_ar')
        .eq('placement', 'header')
        .eq('is_visible', true)
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

    return (
        <nav className="navbar sticky top-0 z-[100] bg-white/92 backdrop-blur-[16px] border-b border-border h-[60px] flex items-center">
            <div className="navbar-inner mx-auto flex w-full min-w-0 max-w-[1280px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
                <Link href={`/${locale}`} className="logo flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-[16px] font-extrabold tracking-tight text-foreground sm:text-[18px]">
                    <div className="logo-dot w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    UAEDiscountHub
                </Link>

                <ul className="nav-links hidden xl:flex items-center gap-1 list-none">
                    <li>
                        <Link href={`/${locale}`} className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all">
                            {dict.common.home}
                        </Link>
                    </li>
                    <li>
                        <Link href={`/${locale}/deals`} className="text-[13.5px] font-semibold text-[#FF6B00] bg-[#FF6B00]/10 px-3 py-1.5 rounded-sm hover:bg-[#FF6B00]/18 transition-all">
                            🔥 {dict.common.deals}
                        </Link>
                    </li>
                    <li>
                        <Link href={`/${locale}/coupons`} className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all">
                            {dict.common.coupons}
                        </Link>
                    </li>
                    <li>
                        <Link href={`/${locale}/compare`} className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all">
                            {dict.common.compare}
                        </Link>
                    </li>
                    <li>
                        <Link href={`/${locale}/blog`} className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all">
                            Blog
                        </Link>
                    </li>
                    {headerPages?.map((page) => (
                        <li key={page.slug}>
                            <Link 
                                href={`/${locale}/${page.slug}`} 
                                className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all"
                            >
                                {locale === 'ar' ? page.title_ar || page.title_en : page.title_en}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="nav-search relative hidden min-w-0 flex-1 max-w-[340px] md:block">
                    <SearchInput placeholder={dict.common.search} locale={locale} />
                </div>

                <div className="nav-right ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
                    <Link
                        href={locale === 'en' ? '/ar' : '/en'}
                        className="nav-btn hidden h-9 px-3.5 border-1.5 border-border rounded-full font-mono font-body text-[12px] font-medium tracking-wide transition-all hover:border-primary hover:bg-primary/5 hover:text-primary sm:flex sm:items-center"
                    >
                        {locale === 'en' ? 'عربي' : 'ENGLISH'}
                    </Link>

                    <ThemeToggle />

                    <button
                        suppressHydrationWarning
                        aria-label="Notifications"
                        className="nav-btn hidden h-9 px-2 border-1.5 border-border rounded-full transition-all hover:border-primary hover:bg-primary/5 hover:text-primary sm:flex sm:items-center sm:justify-center"
                    >
                        <Bell className="w-4.5 h-4.5" />
                    </button>

                    <button
                        suppressHydrationWarning
                        className="nav-btn h-9 px-3 sm:px-4 bg-primary border-1.5 border-primary rounded-full text-white font-body text-[13px] font-semibold transition-all hover:border-primary-dim hover:bg-primary-dim"
                    >
                        {dict.common.login || 'Sign In'}
                    </button>
                </div>
            </div>
        </nav>
    )
}
