export default function AdminDealsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1540px] space-y-6 px-4 py-6 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading deals registry">
      <div className="space-y-3"><div className="h-3 w-28 animate-pulse rounded bg-muted" /><div className="h-9 w-64 animate-pulse rounded-xl bg-muted" /><div className="h-5 w-full max-w-xl animate-pulse rounded bg-muted" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-31 animate-pulse rounded-2xl border bg-card p-5"><div className="h-3 w-24 rounded bg-muted" /><div className="mt-4 h-7 w-16 rounded bg-muted" /><div className="mt-3 h-3 w-32 rounded bg-muted" /></div>)}</div>
      <div className="overflow-hidden rounded-2xl border bg-card"><div className="space-y-4 border-b p-5"><div className="h-5 w-24 animate-pulse rounded bg-muted" /><div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-muted" /></div><div className="space-y-px p-5">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-muted/50" />)}</div></div>
    </div>
  )
}
