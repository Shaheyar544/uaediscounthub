'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

export default function DealsError({ reset }: { reset: () => void }) {
  return <main className="mx-auto flex min-h-[55vh] w-full max-w-[1240px] items-center justify-center px-4 py-12"><section className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm"><AlertCircle aria-hidden="true" className="mx-auto size-10 text-destructive" /><h1 className="mt-4 text-2xl font-black">Deals are unavailable</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">We could not load the latest product offers. Please try again.</p><button type="button" onClick={reset} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RefreshCw aria-hidden="true" className="size-4" />Try again</button></section></main>
}
