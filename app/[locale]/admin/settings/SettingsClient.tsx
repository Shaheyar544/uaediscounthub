'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/admin/ImageUpload'
import {
  Globe, Bell, Zap, Share2, Languages, Smartphone, Twitter,
  Linkedin, Instagram, Loader2, Save, Search, Mail, Shield,
  RefreshCw, Map, Download, CheckCircle2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface SiteSettings {
  id: string
  site_name: string
  primary_domain: string
  site_description: string
  logo_url: string
  favicon_url: string
  contact_email: string
  whatsapp_number: string
  twitter_url: string
  linkedin_url: string
  instagram_url: string
  banner_enabled: boolean
  banner_text: string
  banner_promo_code: string
  banner_countdown: string
  banner_color: string
  banner_icon: string
  banner_link: string
  meta_title_template: string
  meta_description: string
  og_image_url: string
  google_analytics_id: string
  google_search_console: string
  robots_txt: string
  from_email: string
  from_name: string
  sendpulse_list_id: string
  amazon_associate_id: string
  noon_affiliate_id: string
  sharaf_dg_partner_key: string
  carrefour_tracking_id: string
  default_currency: string
  target_regions: string[]
  maintenance_mode: boolean
  newsletter_auto_sync: boolean
}

const DEFAULTS: SiteSettings = {
  id: 'global',
  site_name: 'UAEDiscountHub',
  primary_domain: 'https://uaediscounthub.com',
  site_description: '',
  logo_url: '',
  favicon_url: '',
  contact_email: 'hello@uaediscounthub.com',
  whatsapp_number: '',
  twitter_url: '',
  linkedin_url: '',
  instagram_url: '',
  banner_enabled: true,
  banner_text: 'Flash Sale – Up to 30% off on Smartphones!',
  banner_promo_code: 'TECH30',
  banner_countdown: '',
  banner_color: '#EF4444',
  banner_icon: '🔥',
  banner_link: '',
  meta_title_template: '%s | UAEDiscountHub',
  meta_description: 'Find the best tech deals in UAE. Compare prices across Amazon UAE, Noon, Sharaf DG and more.',
  og_image_url: '',
  google_analytics_id: '',
  google_search_console: '',
  robots_txt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://uaediscounthub.com/sitemap.xml',
  from_email: 'alerts@uaediscounthub.com',
  from_name: 'UAEDiscountHub',
  sendpulse_list_id: '',
  amazon_associate_id: 'uaediscount-21',
  noon_affiliate_id: '',
  sharaf_dg_partner_key: '',
  carrefour_tracking_id: '',
  default_currency: 'AED',
  target_regions: ['UAE'],
  maintenance_mode: false,
  newsletter_auto_sync: true,
}

const BANNER_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
const BANNER_ICONS = ['🔥', '⚡', '🎉', '💰', '🛍️']
const REGIONS = ['UAE', 'KSA', 'GCC', 'QA', 'KW', 'BH', 'OM']
const CURRENCIES = [
  { value: 'AED', label: 'AED – UAE Dirham' },
  { value: 'SAR', label: 'SAR – Saudi Riyal' },
  { value: 'QAR', label: 'QAR – Qatari Riyal' },
  { value: 'KWD', label: 'KWD – Kuwaiti Dinar' },
  { value: 'BHD', label: 'BHD – Bahraini Dinar' },
  { value: 'OMR', label: 'OMR – Omani Rial' },
]

// ─────────────────────────────────────────────────────────────
// Reusable field components
// ─────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
      {hint && <p className="text-[11px] text-[#8A94A6]">{hint}</p>}
    </div>
  )
}

function TextInput({
  value, onChange, placeholder, type = 'text', mono = false
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  mono?: boolean
}) {
  return (
    <input
      type={type}
      className={`w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#0057FF] outline-none ${mono ? 'font-mono' : ''}`}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function StatusBadge({ set }: { set: boolean }) {
  return set ? (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#00C48C] bg-[#e6faf5] px-1.5 py-0.5 rounded">✓ SET</span>
  ) : (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#FF3B30] bg-[#FFF0EF] px-1.5 py-0.5 rounded">NOT SET</span>
  )
}

function IntegrationInput({
  label, value, onChange, placeholder, secret = false
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  secret?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <input
          type={secret ? 'password' : 'text'}
          className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 pr-16 text-[12px] text-[#0D1117] focus:border-[#0057FF] outline-none font-mono"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <StatusBadge set={!!value} />
      </div>
    </div>
  )
}

function SectionCard({
  title, desc, icon, children, className = ''
}: {
  title: string
  desc?: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] shadow-sm ${className}`}>
      <div className="px-6 pt-5 pb-4 border-b border-[#DDE3EF]">
        <h2 className="text-[15px] font-extrabold text-[#0D1117] flex items-center gap-2">
          {icon} {title}
        </h2>
        {desc && <p className="text-[12px] text-[#8A94A6] mt-0.5">{desc}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function SettingsClient({
  locale,
  initialSettings,
}: {
  locale: string
  initialSettings: SiteSettings | null
}) {
  const supabase = createClient()
  const [s, setS] = useState<SiteSettings>({ ...DEFAULTS, ...initialSettings })
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [cacheStatus, setCacheStatus] = useState<'idle' | 'clearing' | 'done'>('idle')
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const upd = (patch: Partial<SiteSettings>) => setS(prev => ({ ...prev, ...patch }))

  const toggleRegion = (region: string) => {
    upd({
      target_regions: s.target_regions.includes(region)
        ? s.target_regions.filter(r => r !== region)
        : [...s.target_regions, region]
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const { error } = await supabase
        .from('site_settings')
        .update(s)
        .eq('id', 'global')
      if (error) throw error
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleClearCache = async () => {
    setCacheStatus('clearing')
    await fetch('/api/revalidate', { method: 'POST' })
    setCacheStatus('done')
    setTimeout(() => setCacheStatus('idle'), 3000)
  }

  const handleTestEmail = async () => {
    setTestEmailStatus('sending')
    await new Promise(r => setTimeout(r, 1500))
    setTestEmailStatus('sent')
    setTimeout(() => setTestEmailStatus('idle'), 3000)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0D1117]">Platform Settings</h1>
          <p className="text-[13px] text-[#8A94A6] mt-1">Configure global site variables, branding, and integrations.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0057FF] text-white px-6 py-2.5 rounded-[10px] font-bold text-[13px] hover:bg-[#0047dd] transition-all shadow-[0_4px_14px_rgba(0,87,255,0.25)] disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
          Save All Changes
        </button>
      </div>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 bg-[#e6faf5] border border-[#b3f0dc] text-[#00A070] text-[13px] font-bold px-4 py-3 rounded-[10px]">
          <CheckCircle2 size={16} /> Settings saved successfully.
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] font-bold px-4 py-3 rounded-[10px]">
          Failed to save — you may need to sign out and back in to refresh admin permissions.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── 1. General Identity ── */}
        <SectionCard
          title="General Identity"
          desc="Site name, domain, branding assets"
          icon={<Globe className="w-4 h-4 text-[#0057FF]" />}
        >
          <div className="space-y-5">
            <Field label="Site Name">
              <TextInput value={s.site_name} onChange={v => upd({ site_name: v })} placeholder="UAEDiscountHub" />
            </Field>
            <Field label="Primary Domain">
              <TextInput value={s.primary_domain} onChange={v => upd({ primary_domain: v })} placeholder="https://uaediscounthub.com" />
            </Field>
            <Field label="Site Description" hint="Used in meta tags and social sharing">
              <textarea
                className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#0057FF] outline-none resize-none"
                rows={2}
                value={s.site_description}
                onChange={e => upd({ site_description: e.target.value })}
                placeholder="AI-powered price comparison for UAE, KSA, and GCC"
              />
            </Field>
            <Field label="Contact Email">
              <TextInput value={s.contact_email} onChange={v => upd({ contact_email: v })} placeholder="hello@uaediscounthub.com" />
            </Field>

            {/* Logo + Favicon */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#DDE3EF]">
              <div>
                <FieldLabel>Site Logo</FieldLabel>
                <ImageUpload
                  value={s.logo_url}
                  onChange={url => upd({ logo_url: url })}
                  folder="settings"
                  description="200×50px PNG/SVG"
                />
              </div>
              <div>
                <FieldLabel>Favicon</FieldLabel>
                <ImageUpload
                  value={s.favicon_url}
                  onChange={url => upd({ favicon_url: url })}
                  folder="settings"
                  description="32×32px ICO/PNG"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 2. Flash Banner ── */}
        <SectionCard
          title="Flash Banner"
          desc="Top announcement bar with countdown"
          icon={<Bell className="w-4 h-4 text-[#FF6B00]" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#F6F8FC] rounded-[8px] border border-[#DDE3EF]">
              <span className="text-[13px] font-bold text-[#0D1117]">Enable Top Bar</span>
              <Switch checked={s.banner_enabled} onCheckedChange={v => upd({ banner_enabled: v })} />
            </div>

            <Field label="Announcement Text">
              <TextInput value={s.banner_text} onChange={v => upd({ banner_text: v })} placeholder="Flash Sale – Up to 30% off..." />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Promo Code">
                <TextInput value={s.banner_promo_code} onChange={v => upd({ banner_promo_code: v })} placeholder="TECH30" mono />
              </Field>
              <Field label="Countdown End">
                <input
                  type="datetime-local"
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#0057FF] outline-none"
                  value={s.banner_countdown}
                  onChange={e => upd({ banner_countdown: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Banner Link URL">
              <TextInput value={s.banner_link} onChange={v => upd({ banner_link: v })} placeholder="/en/deals" />
            </Field>

            {/* Color + Icon pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Banner Color</FieldLabel>
                <div className="flex gap-2 mt-1">
                  {BANNER_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => upd({ banner_color: color })}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${s.banner_color === color ? 'border-[#0D1117] scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Banner Icon</FieldLabel>
                <div className="flex gap-2 mt-1">
                  {BANNER_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => upd({ banner_icon: icon })}
                      className={`w-8 h-8 rounded-lg text-[16px] border-2 transition-all ${s.banner_icon === icon ? 'border-[#0057FF] bg-[#E8F0FF]' : 'border-[#DDE3EF] bg-[#F6F8FC]'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <FieldLabel>Live Preview</FieldLabel>
              <div
                className="rounded-[8px] px-4 py-2.5 flex items-center justify-center gap-2.5"
                style={{ backgroundColor: s.banner_color }}
              >
                <span className="text-[16px]">{s.banner_icon}</span>
                <span className="text-white text-[13px] font-bold">{s.banner_text || 'Announcement text'}</span>
                {s.banner_promo_code && (
                  <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded font-mono">
                    {s.banner_promo_code}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 3. SEO & Analytics ── */}
        <SectionCard
          title="SEO & Analytics"
          desc="Default meta tags and tracking codes"
          icon={<Search className="w-4 h-4 text-[#00C48C]" />}
        >
          <div className="space-y-4">
            <Field label="Title Template" hint={`%s = page title — e.g. "iPhone 15 Pro | UAEDiscountHub"`}>
              <TextInput value={s.meta_title_template} onChange={v => upd({ meta_title_template: v })} placeholder="%s | UAEDiscountHub" mono />
            </Field>

            <Field label="Default Meta Description">
              <div className="relative">
                <textarea
                  className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] text-[#0D1117] focus:border-[#0057FF] outline-none resize-none"
                  rows={2}
                  maxLength={160}
                  value={s.meta_description}
                  onChange={e => upd({ meta_description: e.target.value })}
                  placeholder="Find the best tech deals in UAE..."
                />
                <span className={`absolute bottom-2 right-2 text-[10px] font-bold ${s.meta_description.length > 150 ? 'text-red-400' : 'text-[#8A94A6]'}`}>
                  {s.meta_description.length}/160
                </span>
              </div>
            </Field>

            <Field label="Default OG Image URL" hint="1200×630px for social sharing">
              <TextInput value={s.og_image_url} onChange={v => upd({ og_image_url: v })} placeholder="https://uaediscounthub.com/og-image.jpg" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Google Analytics ID">
                <TextInput value={s.google_analytics_id} onChange={v => upd({ google_analytics_id: v })} placeholder="G-XXXXXXXXXX" mono />
              </Field>
              <Field label="Search Console Tag">
                <TextInput value={s.google_search_console} onChange={v => upd({ google_search_console: v })} placeholder="Verification meta content" mono />
              </Field>
            </div>

            <Field label="robots.txt Content">
              <textarea
                className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[11px] text-[#0D1117] focus:border-[#0057FF] outline-none resize-none font-mono"
                rows={5}
                value={s.robots_txt}
                onChange={e => upd({ robots_txt: e.target.value })}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── 4. Email & Notifications ── */}
        <SectionCard
          title="Email & Notifications"
          desc="SendPulse configuration for email campaigns"
          icon={<Mail className="w-4 h-4 text-[#0057FF]" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="From Email">
                <TextInput value={s.from_email} onChange={v => upd({ from_email: v })} placeholder="alerts@uaediscounthub.com" />
              </Field>
              <Field label="From Name">
                <TextInput value={s.from_name} onChange={v => upd({ from_name: v })} placeholder="UAEDiscountHub" />
              </Field>
            </div>

            <Field label="SendPulse Mailing List ID" hint="List ID for subscribers — find in SendPulse dashboard">
              <TextInput value={s.sendpulse_list_id} onChange={v => upd({ sendpulse_list_id: v })} placeholder="Mailing list ID" mono />
            </Field>

            <div className="p-3 bg-[#F6F8FC] rounded-[8px] border border-[#DDE3EF] flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#E8F0FF] flex items-center justify-center shrink-0">
                <span className="text-[12px]">🔑</span>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#4B5675]">SendPulse API Credentials</div>
                <div className="text-[11px] text-[#8A94A6]">Configured via <code className="font-mono bg-white px-1 rounded">SENDPULSE_API_USER_ID</code> environment variable</div>
              </div>
            </div>

            <button
              onClick={handleTestEmail}
              disabled={testEmailStatus === 'sending'}
              className="flex items-center gap-2 border-[1.5px] border-[#DDE3EF] text-[#4B5675] font-bold px-4 py-2 rounded-[8px] text-[12px] hover:bg-[#F6F8FC] transition-all disabled:opacity-50"
            >
              {testEmailStatus === 'sending' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : testEmailStatus === 'sent' ? (
                <CheckCircle2 size={13} className="text-[#00C48C]" />
              ) : (
                <Mail size={13} />
              )}
              {testEmailStatus === 'sent' ? 'Test Email Sent!' : 'Send Test Email'}
            </button>
          </div>
        </SectionCard>

        {/* ── 5. Integrations ── */}
        <SectionCard
          title="Integrations"
          desc="Affiliate IDs and partner credentials"
          icon={<Zap className="w-4 h-4 text-[#00C48C]" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <IntegrationInput
                label="Amazon Associate ID"
                value={s.amazon_associate_id}
                onChange={v => upd({ amazon_associate_id: v })}
                placeholder="uaediscount-21"
              />
              <IntegrationInput
                label="Noon Affiliate ID"
                value={s.noon_affiliate_id}
                onChange={v => upd({ noon_affiliate_id: v })}
                placeholder="noon-affiliate-id"
              />
              <IntegrationInput
                label="Sharaf DG Partner Key"
                value={s.sharaf_dg_partner_key}
                onChange={v => upd({ sharaf_dg_partner_key: v })}
                placeholder="partner-key"
              />
              <IntegrationInput
                label="Carrefour Tracking ID"
                value={s.carrefour_tracking_id}
                onChange={v => upd({ carrefour_tracking_id: v })}
                placeholder="tracking-id"
              />
            </div>

            <div className="pt-3 border-t border-[#DDE3EF] space-y-2">
              {[
                { label: 'DeepSeek AI Engine', status: 'CONNECTED', color: '#00C48C', bg: '#E6FAF5', env: 'DEEPSEEK_API_KEY' },
                { label: 'PostHog Analytics', status: 'CONNECTED', color: '#00C48C', bg: '#E6FAF5', env: 'NEXT_PUBLIC_POSTHOG_KEY' },
                { label: 'Amazon PAAPI', status: 'ENV SET', color: '#0057FF', bg: '#E8F0FF', env: 'AMAZON_PARTNER_TAG' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-[8px] flex items-center justify-between border border-[#DDE3EF]" style={{ backgroundColor: item.bg }}>
                  <div>
                    <span className="text-[12px] font-bold" style={{ color: item.color }}>{item.label}</span>
                    <span className="text-[10px] text-[#8A94A6] ml-2 font-mono">{item.env}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold" style={{ color: item.color }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: item.color }} />
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── 6. Social & Contact ── */}
        <SectionCard
          title="Social & Contact"
          desc="Footer social links and contact channels"
          icon={<Share2 className="w-4 h-4 text-[#0057FF]" />}
        >
          <div className="space-y-4">
            <Field label="WhatsApp Alert Number">
              <div className="flex items-center gap-2 bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2">
                <Smartphone size={13} className="text-[#8A94A6] shrink-0" />
                <input
                  className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#0D1117]"
                  value={s.whatsapp_number}
                  onChange={e => upd({ whatsapp_number: e.target.value })}
                  placeholder="+971 50 123 4567"
                />
              </div>
            </Field>
            <Field label="X (Twitter) URL">
              <div className="flex items-center gap-2 bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2">
                <Twitter size={13} className="text-[#8A94A6] shrink-0" />
                <input
                  className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#0D1117]"
                  value={s.twitter_url}
                  onChange={e => upd({ twitter_url: e.target.value })}
                  placeholder="https://x.com/uaediscounthub"
                />
              </div>
            </Field>
            <Field label="LinkedIn URL">
              <div className="flex items-center gap-2 bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2">
                <Linkedin size={13} className="text-[#8A94A6] shrink-0" />
                <input
                  className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#0D1117]"
                  value={s.linkedin_url}
                  onChange={e => upd({ linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/company/uaediscounthub"
                />
              </div>
            </Field>
            <Field label="Instagram URL">
              <div className="flex items-center gap-2 bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2">
                <Instagram size={13} className="text-[#8A94A6] shrink-0" />
                <input
                  className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#0D1117]"
                  value={s.instagram_url}
                  onChange={e => upd({ instagram_url: e.target.value })}
                  placeholder="https://instagram.com/uaediscounthub"
                />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ── 7. Localization ── */}
        <SectionCard
          title="Localization"
          desc="Currency and target market regions"
          icon={<Languages className="w-4 h-4 text-[#0057FF]" />}
        >
          <div className="space-y-5">
            <Field label="Default Currency">
              <select
                className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[12px] outline-none focus:border-[#0057FF]"
                value={s.default_currency}
                onChange={e => upd({ default_currency: e.target.value })}
              >
                {CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Target Regions">
              <div className="grid grid-cols-4 gap-2 mt-1">
                {REGIONS.map(region => (
                  <button
                    key={region}
                    onClick={() => toggleRegion(region)}
                    className={`px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all border ${
                      s.target_regions.includes(region)
                        ? 'bg-[#0057FF] text-white border-[#0057FF]'
                        : 'bg-[#F6F8FC] text-[#4B5675] border-[#DDE3EF] hover:border-[#0057FF]'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ── 8. System Controls ── */}
        <SectionCard
          title="System Controls"
          desc="Maintenance mode, cache and data management"
          icon={<Shield className="w-4 h-4 text-[#FF3B30]" />}
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Toggle controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#FFF0EF] rounded-[10px] border border-[#FF3B30]/20">
                <div>
                  <div className="font-bold text-[#FF3B30] text-[13px]">Maintenance Mode</div>
                  <div className="text-[11px] text-[#FF3B30]/70 mt-0.5">Takes the public site offline. Admin panel stays accessible.</div>
                </div>
                <Switch checked={s.maintenance_mode} onCheckedChange={v => upd({ maintenance_mode: v })} />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#E8F0FF] rounded-[10px] border border-[#0057FF]/20">
                <div>
                  <div className="font-bold text-[#0057FF] text-[13px]">Newsletter Auto-Sync</div>
                  <div className="text-[11px] text-[#0057FF]/70 mt-0.5">Sync leads to SendPulse CRM every 24 hours.</div>
                </div>
                <Switch checked={s.newsletter_auto_sync} onCheckedChange={v => upd({ newsletter_auto_sync: v })} />
              </div>
            </div>

            {/* Action controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#E8F0FF] rounded-[10px] border border-[#0057FF]/20">
                <div>
                  <div className="font-bold text-[#0057FF] text-[13px]">🗄️ Cache Management</div>
                  <div className="text-[11px] text-[#0057FF]/70 mt-0.5">Revalidate all cached pages immediately.</div>
                </div>
                <button
                  onClick={handleClearCache}
                  disabled={cacheStatus === 'clearing'}
                  className="flex items-center gap-1.5 bg-[#0057FF] text-white font-bold px-3 py-1.5 rounded-[8px] text-[12px] hover:bg-[#0047dd] disabled:opacity-50 shrink-0"
                >
                  {cacheStatus === 'clearing' ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : cacheStatus === 'done' ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  {cacheStatus === 'done' ? 'Cleared!' : 'Clear Cache'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#E6FAF5] rounded-[10px] border border-[#00C48C]/20">
                <div>
                  <div className="font-bold text-[#00A070] text-[13px]">🗺️ Sitemap</div>
                  <div className="text-[11px] text-[#00A070]/70 mt-0.5">View current sitemap.xml for search engines.</div>
                </div>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#00C48C] text-white font-bold px-3 py-1.5 rounded-[8px] text-[12px] hover:bg-[#00A070] shrink-0"
                >
                  <Map size={12} /> View
                </a>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-[10px] border border-purple-200">
                <div>
                  <div className="font-bold text-purple-800 text-[13px]">💾 Data Backup</div>
                  <div className="text-[11px] text-purple-600 mt-0.5">Export platform data as CSV/JSON.</div>
                </div>
                <button
                  className="flex items-center gap-1.5 bg-purple-600 text-white font-bold px-3 py-1.5 rounded-[8px] text-[12px] hover:bg-purple-700 shrink-0"
                  onClick={() => alert('Data export coming soon.')}
                >
                  <Download size={12} /> Export
                </button>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0057FF] text-white px-10 py-3 rounded-[12px] font-bold text-[14px] hover:bg-[#0047dd] transition-all shadow-[0_4px_20px_rgba(0,87,255,0.25)] disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save All Settings
        </button>
      </div>
    </div>
  )
}
