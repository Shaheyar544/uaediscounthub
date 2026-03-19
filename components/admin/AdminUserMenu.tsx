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
        className="flex items-center gap-2 bg-[#F6F8FC] border border-[#DDE3EF] rounded-xl px-3 py-2 hover:bg-[#eef0f6] transition-colors"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
          {initial}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-[12px] font-bold text-[#0D1117] leading-none">{username}</div>
          <div className="text-[10px] text-[#8A94A6] mt-0.5">Administrator</div>
        </div>
        <ChevronDown
          size={13}
          className={`text-[#8A94A6] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-white rounded-[14px] shadow-2xl border border-[#DDE3EF] w-52 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 border-b border-[#DDE3EF] bg-[#F6F8FC]">
            <div className="text-[12px] font-bold text-[#0D1117] truncate">{email}</div>
            <div className="text-[10px] text-[#0057FF] font-bold mt-0.5">✓ Administrator</div>
          </div>

          <div className="p-1">
            <button
              onClick={() => {
                setOpen(false)
                router.push(`/${locale}/admin/profile`)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[#0D1117] hover:bg-[#F6F8FC] rounded-lg transition-colors text-left"
            >
              <User size={14} className="text-[#8A94A6]" />
              My Profile
            </button>

            <div className="border-t border-[#DDE3EF] mt-1 pt-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[#FF3B30] hover:bg-[#FFF0EF] rounded-lg transition-colors text-left"
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
