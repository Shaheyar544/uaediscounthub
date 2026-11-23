import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
    const supabaseResponse = await updateSession(request)

    const { pathname } = request.nextUrl;

    // Never redirect robots.txt or sitemap.xml
    if (pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname.startsWith('/robots') || pathname.startsWith('/sitemap')) {
        return NextResponse.next();
    }

    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) return supabaseResponse;

    const locale = defaultLocale;
    request.nextUrl.pathname = `/${locale}${pathname}`;

    const response = NextResponse.redirect(request.nextUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie)
    })

    return response;
}

export const config = {
    matcher: [
        // Skip internal paths (_next), API routes, static files, robots.txt and sitemap.xml
        '/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
    ],
};
