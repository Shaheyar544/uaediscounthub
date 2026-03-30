'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Save,
  LogOut,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  Globe2,
  Linkedin,
  AtSign,
  UserRound,
  FileText,
} from 'lucide-react'
import type { SocialLinks } from '@/types/profile'

interface ProfileClientProps {
  email: string
  userId: string
  role: string
  displayName: string
  bio: string
  avatarUrl: string
  socialLinks: SocialLinks
  lastSignIn: string | null
  createdAt: string
  locale: string
}

export function ProfileClient({
  email,
  userId,
  role,
  displayName,
  bio,
  avatarUrl,
  socialLinks,
  lastSignIn,
  createdAt,
  locale,
}: ProfileClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authorProfile, setAuthorProfile] = useState({
    display_name: displayName,
    bio,
    avatar_url: avatarUrl,
    social_links: {
      twitter: socialLinks?.twitter ?? '',
      linkedin: socialLinks?.linkedin ?? '',
      website: socialLinks?.website ?? '',
    },
  })
  const [pwStatus, setPwStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pwError, setPwError] = useState('')
  const [profileStatus, setProfileStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [profileError, setProfileError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isPasswordPending, startPasswordTransition] = useTransition()
  const [isProfilePending, startProfileTransition] = useTransition()
  const [isUploadPending, startUploadTransition] = useTransition()

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

    startPasswordTransition(async () => {
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
    })
  }

  const handleAuthorField = (field: 'display_name' | 'bio' | 'avatar_url', value: string) => {
    setAuthorProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSocialField = (field: keyof SocialLinks, value: string) => {
    setAuthorProfile((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [field]: value,
      },
    }))
  }

  const handleAvatarFile = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPEG, PNG and WebP files are supported.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Maximum avatar file size is 10MB.')
      return
    }

    setUploadError('')

    startUploadTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'authors')

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Avatar upload failed')
        }

        setAuthorProfile((prev) => ({
          ...prev,
          avatar_url: data.url,
        }))
      } catch (error: any) {
        setUploadError(error.message || 'Avatar upload failed')
      }
    })
  }

  const handleSaveAuthorProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')

    startProfileTransition(async () => {
      const payload = {
        display_name: authorProfile.display_name.trim() || null,
        bio: authorProfile.bio.trim() || null,
        avatar_url: authorProfile.avatar_url.trim() || null,
        social_links: Object.fromEntries(
          Object.entries(authorProfile.social_links).filter(([, value]) => value && value.trim().length > 0)
        ),
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          ...payload,
        })

      if (error) {
        setProfileError(error.message)
        setProfileStatus('error')
        return
      }

      setProfileStatus('success')
      router.refresh()
      setTimeout(() => setProfileStatus('idle'), 3000)
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
  }

  const publicName = authorProfile.display_name.trim() || email
  const initial = publicName[0]?.toUpperCase() ?? 'A'

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

      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-6 mb-5 shadow-sm">
        <div className="flex items-center gap-4">
          {authorProfile.avatar_url ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-[1.5px] border-[#DDE3EF] flex-shrink-0 shadow-sm">
              <Image src={authorProfile.avatar_url} alt={publicName} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#0057FF] flex items-center justify-center text-white text-[28px] font-black flex-shrink-0">
              {initial}
            </div>
          )}

          <div>
            <div className="font-bold text-[16px] text-[#0D1117]">{publicName}</div>
            <div className="text-[12px] text-[#8A94A6] mt-0.5">{email}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-[#E8F0FF] text-[#0057FF] text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize">
                {role}
              </span>
              {authorProfile.display_name.trim() && (
                <span className="bg-[#FFF3E8] text-[#FF6B00] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Public Author
                </span>
              )}
            </div>
            {lastSignIn && (
              <div className="text-[11px] text-[#8A94A6] mt-1.5">
                Last sign in: {fmt(lastSignIn)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-6 mb-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[14px] font-extrabold text-[#0D1117] flex items-center gap-2">
              <UserRound size={15} className="text-[#0057FF]" /> Public Author Profile
            </h2>
            <p className="text-[12px] text-[#8A94A6] mt-1">
              This information is used for blog author bylines and public author sections.
            </p>
          </div>
          <div className="bg-[#F6F8FC] border border-[#DDE3EF] rounded-[10px] px-3 py-2 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6]">Preview Name</div>
            <div className="text-[12px] font-bold text-[#0D1117] mt-0.5">{publicName}</div>
          </div>
        </div>

        <form onSubmit={handleSaveAuthorProfile} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-[168px_1fr] gap-5">
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Author Avatar</div>
              <div className="bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[14px] p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  {authorProfile.avatar_url ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-[1.5px] border-[#DDE3EF] bg-white shadow-sm">
                      <Image src={authorProfile.avatar_url} alt={publicName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#0057FF] text-white flex items-center justify-center text-[34px] font-black shadow-sm">
                      {initial}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleAvatarFile(file)
                      e.currentTarget.value = ''
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadPending}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-[#DDE3EF] text-[#0D1117] font-bold px-3 py-2 rounded-[10px] text-[12px] hover:border-[#0057FF] hover:text-[#0057FF] transition-all disabled:opacity-50"
                  >
                    {isUploadPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {isUploadPending ? 'Uploading...' : 'Upload Avatar'}
                  </button>
                  <div className="text-[10px] text-[#8A94A6] leading-relaxed">
                    Upload to Cloudflare or paste a hosted media URL below.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Display Name</label>
                <div className="relative">
                  <UserRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
                  <input
                    type="text"
                    placeholder="e.g., Ahmed Al-Rashid"
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[10px] pl-9 pr-4 py-2.5 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none transition-colors"
                    value={authorProfile.display_name}
                    onChange={(e) => handleAuthorField('display_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Avatar URL</label>
                <div className="relative">
                  <Globe2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
                  <input
                    type="url"
                    placeholder="https://media.uaediscounthub.com/..."
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[10px] pl-9 pr-4 py-2.5 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none transition-colors"
                    value={authorProfile.avatar_url}
                    onChange={(e) => handleAuthorField('avatar_url', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Short Bio</label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-3 text-[#8A94A6]" />
                  <textarea
                    rows={4}
                    maxLength={280}
                    placeholder="Add a short public bio for article bylines and author boxes."
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[10px] pl-9 pr-4 py-2.5 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none resize-none transition-colors"
                    value={authorProfile.bio}
                    onChange={(e) => handleAuthorField('bio', e.target.value)}
                  />
                </div>
                <div className="text-[10px] text-[#8A94A6] text-right">
                  {authorProfile.bio.length}/280
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Twitter / X</label>
                  <div className="relative">
                    <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
                    <input
                      type="url"
                      placeholder="https://x.com/username"
                      className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[10px] pl-9 pr-4 py-2.5 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none transition-colors"
                      value={authorProfile.social_links.twitter}
                      onChange={(e) => handleSocialField('twitter', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">LinkedIn</label>
                  <div className="relative">
                    <Linkedin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[10px] pl-9 pr-4 py-2.5 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none transition-colors"
                      value={authorProfile.social_links.linkedin}
                      onChange={(e) => handleSocialField('linkedin', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Website</label>
                <div className="relative">
                  <Globe2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
                  <input
                    type="url"
                    placeholder="https://your-site.com"
                    className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[10px] pl-9 pr-4 py-2.5 text-[13px] text-[#0D1117] focus:border-[#0057FF] outline-none transition-colors"
                    value={authorProfile.social_links.website}
                    onChange={(e) => handleSocialField('website', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[12px]">
              <AlertCircle size={14} /> {uploadError}
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[12px]">
              <AlertCircle size={14} /> {profileError}
            </div>
          )}

          {profileStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-[#e6faf5] border border-[#b3f0dc] rounded-lg text-[#00C48C] text-[12px]">
              <CheckCircle size={14} /> Public author profile updated successfully.
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isProfilePending || isUploadPending}
              className="flex items-center gap-2 bg-[#0057FF] text-white font-bold px-5 py-2.5 rounded-[8px] text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)] disabled:opacity-50"
            >
              {isProfilePending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Author Profile
            </button>
          </div>
        </form>
      </div>

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
            disabled={isPasswordPending}
            className="flex items-center gap-2 bg-[#0057FF] text-white font-bold px-5 py-2.5 rounded-[8px] text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_12px_rgba(0,87,255,0.2)] disabled:opacity-50"
          >
            {isPasswordPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Update Password
          </button>
        </form>
      </div>

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
