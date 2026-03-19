'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, LogOut, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ProfileClientProps {
  email: string
  userId: string
  role: string
  lastSignIn: string | null
  createdAt: string
  locale: string
}

export function ProfileClient({
  email,
  userId,
  role,
  lastSignIn,
  createdAt,
  locale,
}: ProfileClientProps) {
  const supabase = createClient()
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [pwError, setPwError] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')

    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }

    setPwStatus('saving')
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPwError(error.message)
      setPwStatus('error')
    } else {
      setPwStatus('success')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwStatus('idle'), 3000)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
  }

  const initial = email[0]?.toUpperCase() ?? 'A'

  const fmt = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-AE', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-[22px] font-extrabold text-[#0D1117]">My Profile</h1>
        <p className="text-[13px] text-[#8A94A6] mt-1">Manage your admin account settings</p>
      </div>

      {/* Avatar + info */}
      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-6 mb-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#0057FF] flex items-center justify-center text-white text-[28px] font-black flex-shrink-0">
            {initial}
          </div>
          <div>
            <div className="font-bold text-[16px] text-[#0D1117]">{email}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-[#E8F0FF] text-[#0057FF] text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize">
                {role}
              </span>
            </div>
            {lastSignIn && (
              <div className="text-[11px] text-[#8A94A6] mt-1.5">
                Last sign in: {fmt(lastSignIn)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-6 mb-5 shadow-sm">
        <h2 className="text-[14px] font-extrabold text-[#0D1117] mb-4 flex items-center gap-2">
          <Lock size={15} className="text-[#8A94A6]" /> Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            placeholder="New password (min. 8 characters)"
            className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-4 py-2.5 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-4 py-2.5 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />

          {pwError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[12px]">
              <AlertCircle size={14} /> {pwError}
            </div>
          )}
          {pwStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-[#e6faf5] border border-[#b3f0dc] rounded-lg text-[#00C48C] text-[12px]">
              <CheckCircle size={14} /> Password updated successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={pwStatus === 'saving'}
            className="flex items-center gap-2 bg-[#0057FF] text-white font-bold px-5 py-2.5 rounded-[8px] text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)] disabled:opacity-50"
          >
            {pwStatus === 'saving' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Update Password
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-6 mb-5 shadow-sm">
        <h2 className="text-[14px] font-extrabold text-[#0D1117] mb-4">Account Information</h2>
        <div className="space-y-0 divide-y divide-[#F6F8FC]">
          {[
            { label: 'Email', value: email },
            { label: 'Role', value: role, highlight: true },
            { label: 'Member Since', value: fmt(createdAt) },
            { label: 'User ID', value: userId, mono: true },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-3 text-[13px]">
              <span className="text-[#8A94A6]">{row.label}</span>
              <span className={
                row.highlight
                  ? 'font-bold text-[#0057FF] capitalize'
                  : row.mono
                  ? 'font-mono text-[11px] text-[#8A94A6]'
                  : 'font-medium text-[#0D1117]'
              }>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-red-50 rounded-[14px] border border-red-100 p-6">
        <h2 className="text-[14px] font-extrabold text-red-700 mb-1">Sign Out</h2>
        <p className="text-[12px] text-red-500 mb-4">You will be redirected to the login page.</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 bg-[#FF3B30] text-white font-bold px-5 py-2.5 rounded-[8px] text-[13px] hover:bg-red-700 transition-all"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  )
}
