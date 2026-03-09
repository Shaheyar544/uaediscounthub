import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    const supabaseResponse = await updateSession(request)

    const { pathname } = request.nextUrl;
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
        // Skip all internal paths (_next)
        '/((?!_next|api|favicon.ico).*)',
    ],
};
