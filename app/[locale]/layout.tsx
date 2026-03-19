import type { Metadata } from 'next'
import { Syne, DM_Sans, Cairo } from 'next/font/google'
import Script from 'next/script'
import '../globals.css'
import { Locale } from '@/i18n/config'
import { Navbar }          from '@/components/layout/Navbar'
import { Footer }          from '@/components/layout/Footer'
import { FlashBanner }     from '@/components/layout/FlashBanner'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { ThemeProvider } from '@/components/theme-provider'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import { createAdminClient } from '@/utils/supabase/admin'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export const metadata: Metadata = {
  metadataBase: new URL('https://uaediscounthub.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-AE': '/en',
      'ar-AE': '/ar',
    },
  },
  title: {
    default: 'UAEDISCOUNTHUB - Best Tech Deals in UAE & GCC',
    template: '%s | UAEDISCOUNTHUB'
  },
  description: 'UAE Discount Hub - The #1 AI-powered price comparison and deals platform for the UAE, KSA, and GCC. Save big on electronics, smartphones, and gadgets with real-time tracking.',
  keywords: [
    'online shopping UAE', 'best tech deals Dubai', 'price comparison UAE',
    'noon discount code', 'amazon ae voucher', 'smartwatch deals Dubai',
    'iPhone 16 price UAE', 'S24 Ultra deals GCC', 'electronics offers Riyadh'
  ],
  authors: [{ name: 'UAEDISCOUNTHUB Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_AE',
    url: 'https://uaediscounthub.com',
    siteName: 'UAEDISCOUNTHUB',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'UAEDISCOUNTHUB - AI Tech Deals'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UAEDISCOUNTHUB - Best Tech Deals',
    description: 'Find the best electronics deals in the GCC with AI insights.',
    images: ['/og-image.jpg'],
  },
  category: 'technology',
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  // Load site settings for banner + analytics
  let settings: {
    banner_enabled: boolean
    banner_text: string
    banner_color: string
    banner_icon: string
    banner_promo_code: string
    banner_link: string
    banner_countdown: string
    google_analytics_id: string
  } | null = null

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('banner_enabled, banner_text, banner_color, banner_icon, banner_promo_code, banner_link, banner_countdown, google_analytics_id')
      .eq('id', 'global')
      .single()
    settings = data
  } catch {
    // Non-fatal — fall back to defaults below
  }

  const gaId = settings?.google_analytics_id || ''

  return (
    <html lang={locale} dir={dir} className={`${syne.variable} ${dmSans.variable} ${cairo.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-body antialiased" suppressHydrationWarning>
        {/* Google Analytics */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AnalyticsProvider>
            <FlashBanner
              enabled={settings?.banner_enabled ?? true}
              text={settings?.banner_text ?? 'Flash Sale – Up to 30% off on Smartphones!'}
              color={settings?.banner_color ?? '#EF4444'}
              icon={settings?.banner_icon ?? '🔥'}
              promoCode={settings?.banner_promo_code ?? 'TECH30'}
              link={settings?.banner_link ?? ''}
              countdown={settings?.banner_countdown ?? ''}
            />
            <Navbar locale={locale as Locale} />
            <main className="flex min-h-screen flex-col items-center justify-between pb-16 md:pb-0">
              {children}
            </main>
            <Footer locale={locale as Locale} />
            <MobileBottomNav />
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
