'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, User } from 'lucide-react'

interface AdminUserMenuProps {
  email: string
  locale: string
}

export function AdminUserMenu({ email, locale }: AdminUserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setOpen(false)
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
  }

  const initial = email[0]?.toUpperCase() ?? 'A'
  const username = email.split('@')[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex min-h-10 items-center gap-2 rounded-xl border bg-card px-3 py-2 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
          {initial}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-[12px] font-bold leading-none">{username}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">Administrator</div>
        </div>
        <ChevronDown
          size={13}
          className={`text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-[14px] border bg-popover text-popover-foreground shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 motion-reduce:animate-none">
          <div className="border-b bg-muted/50 p-3">
            <div className="truncate text-[12px] font-bold">{email}</div>
            <div className="text-[10px] text-[#0057FF] font-bold mt-0.5">✓ Administrator</div>
          </div>

          <div className="p-1">
            <button
              onClick={() => {
                setOpen(false)
                router.push(`/${locale}/admin/profile`)
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-[13px] hover:bg-muted transition-colors"
            >
              <User size={14} className="text-[#8A94A6]" />
              My Profile
            </button>

            <div className="border-t border-[#DDE3EF] mt-1 pt-1">
              <button
                onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
