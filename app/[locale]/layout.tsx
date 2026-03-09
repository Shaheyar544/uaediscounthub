import type { Metadata } from 'next'
import { Syne, DM_Sans, Cairo } from 'next/font/google'
import '../globals.css'
import { Locale } from '@/i18n/config'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FlashBanner } from '@/components/layout/FlashBanner'
import { ThemeProvider } from '@/components/theme-provider'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export const metadata: Metadata = {
  metadataBase: new URL('https://uaediscounthub.com'),
  title: {
    default: 'UAEDISCOUNTHUB - Best Tech Deals in UAE & GCC',
    template: '%s | UAEDISCOUNTHUB'
  },
  description: 'AI-powered affiliate marketing and price-comparison platform. Find the best electronics, gadgets, and home appliance deals in the UAE, KSA, and GCC.',
  keywords: ['tech deals UAE', 'electronics price comparison GCC', 'discount codes Dubai', 'iPhone deals UAE', 'Noon coupons', 'Amazon UAE offers'],
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
  }
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={`${syne.variable} ${dmSans.variable} ${cairo.variable}`} suppressHydrationWarning>
      <body className={`min-h-screen bg-background text-foreground font-body antialiased`}>
        {/* We will add Navbar and Footer here later */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AnalyticsProvider>
            <FlashBanner />
            <Navbar locale={locale as Locale} />
            <main className="flex min-h-screen flex-col items-center justify-between">
              {children}
            </main>
            <Footer locale={locale as Locale} />
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
