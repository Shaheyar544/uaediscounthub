import type { ReactNode } from 'react'

interface AdminAppShellProps {
  sidebar: ReactNode
  topbar: ReactNode
  children: ReactNode
}

/** Shared structural shell for every authenticated admin route. */
export function AdminAppShell({ sidebar, topbar, children }: AdminAppShellProps) {
  return (
    <div className="flex min-h-dvh w-full min-w-0 overflow-x-clip bg-background text-foreground antialiased">
      {sidebar}
      <main id="admin-main" className="min-w-0 flex-1">
        {topbar}
        <div className="min-h-[calc(100dvh-68px)] overflow-x-clip bg-muted/20 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full min-w-0 max-w-[1600px]">{children}</div>
        </div>
      </main>
    </div>
  )
}
