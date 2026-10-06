export default function DealsLoading() {
  return <main className="mx-auto w-full max-w-[1240px] space-y-6 px-4 py-8 sm:px-6"><div className="h-4 w-24 animate-pulse rounded bg-muted" /><section className="h-56 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" /><div className="h-12 animate-pulse rounded-2xl bg-muted" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[420px] animate-pulse rounded-2xl border bg-card" />)}</div></main>
}
