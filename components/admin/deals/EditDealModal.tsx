'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { CheckCircle2, Edit, ExternalLink, Loader2, Store, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateDeal } from '@/app/[locale]/admin/deals/actions'

interface EditDealModalProps {
  deal: any
  stores: { id: string; name: string }[]
  locale: string
}

function asPositiveNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function money(value: number) {
  return `AED ${value.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function EditDealModal({ deal, stores, locale }: EditDealModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [formData, setFormData] = useState({
    title_en: deal.title_en || '',
    deal_price: deal.deal_price || '',
    original_price: deal.original_price || '',
    affiliate_url: deal.affiliate_url || '',
    coupon_value: deal.coupon_value || '',
    store_id: deal.store_id || '',
    image_url: deal.image_url || '',
    is_active: deal.is_active,
  })

  const dealPrice = asPositiveNumber(formData.deal_price)
  const originalPrice = asPositiveNumber(formData.original_price)
  const saving = dealPrice !== null && originalPrice !== null && originalPrice > dealPrice ? originalPrice - dealPrice : null
  const percentage = saving !== null && originalPrice !== null ? Math.round((saving / originalPrice) * 100) : null
  const productName = deal.products?.name_en || null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading || imageUploading) return
    setLoading(true)

    const cleanedData = {
      ...formData,
      store_id: formData.store_id === '' ? null : formData.store_id,
      original_price: formData.original_price === '' ? null : Number(formData.original_price),
      coupon_value: formData.coupon_value === '' ? null : Number(formData.coupon_value),
    }

    try {
      await updateDeal(deal.id, cleanedData, locale)
      setOpen(false)
    } catch (error) {
      console.error(error)
      alert('Failed to update deal. Check the console for more info.')
    } finally {
      setLoading(false)
    }
  }

  return <>
    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setOpen(true)} title="Edit Deal" aria-label={`Edit ${deal.title_en || productName || 'deal'}`}>
      <Edit aria-hidden="true" className="size-4" />
    </Button>

    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[200] bg-slate-950/35 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-x-3 top-1/2 z-[200] flex max-h-[calc(100dvh-1.5rem)] w-auto -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-[0_28px_70px_-24px_rgba(15,23,42,0.55)] outline-none transition duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:left-1/2 sm:right-auto sm:w-[min(94vw,780px)] sm:-translate-x-1/2 sm:rounded-3xl">
          <header className="relative shrink-0 border-b border-border/80 bg-card px-5 py-5 sm:px-7"><div className="pr-10"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">Deal management</p><Dialog.Title className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Edit Deal</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">Update pricing, retailer, tracking and visibility settings.</Dialog.Description>{productName && <p className="mt-3 inline-flex max-w-full items-center gap-1.5 truncate rounded-lg bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"><Store aria-hidden="true" className="size-3.5 shrink-0 text-primary" />{productName}</p>}</div><Dialog.Close className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close edit deal"><X aria-hidden="true" className="size-4" /></Dialog.Close></header>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              <section aria-labelledby="deal-information-title" className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5"><SectionHeading id="deal-information-title" number="01" title="Deal information" description="Identify the offer and assign its retailer." /><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field className="sm:col-span-2" label="Deal Title" htmlFor={`deal-title-${deal.id}`}><Input id={`deal-title-${deal.id}`} className="h-11" value={formData.title_en} onChange={(event) => setFormData({ ...formData, title_en: event.target.value })} required /></Field><Field label="Store" htmlFor={`deal-store-${deal.id}`}><select id={`deal-store-${deal.id}`} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50" value={formData.store_id} onChange={(event) => setFormData({ ...formData, store_id: event.target.value })} required><option value="">Select a Store</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></Field><div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5"><p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Linked product</p><p className="mt-1 truncate text-sm font-semibold">{productName || 'No linked product'}</p></div></div><div className="mt-5 border-t border-border/70 pt-5"><ImageUpload value={formData.image_url} onChange={(image_url) => setFormData({ ...formData, image_url })} onUploadingChange={setImageUploading} label="Deal image" description="Upload JPG, JPEG, PNG or WebP. New uploads are converted to optimized WebP before storage." folder="deals" entityName="deal image" allowManualUrl={false} /></div></section>

              <section aria-labelledby="deal-pricing-title" className="rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(0,87,255,0.06),rgba(255,255,255,0.8))] p-4 sm:p-5"><SectionHeading id="deal-pricing-title" number="02" title="Pricing" description="Make the current offer and any verified saving clear." /><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Deal Price (AED)" htmlFor={`deal-price-${deal.id}`}><Input id={`deal-price-${deal.id}`} className="h-11 bg-background text-base font-bold tabular-nums" type="number" min="0" step="0.01" value={formData.deal_price} onChange={(event) => { const value = event.target.value; setFormData({ ...formData, deal_price: value === '' ? '' : parseFloat(value) }) }} required /></Field><Field label="Original Price (AED)" htmlFor={`original-price-${deal.id}`}><Input id={`original-price-${deal.id}`} className="h-11 bg-background text-base font-bold tabular-nums" type="number" min="0" step="0.01" value={formData.original_price} onChange={(event) => { const value = event.target.value; setFormData({ ...formData, original_price: value === '' ? '' : parseFloat(value) }) }} /></Field></div><div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/10 bg-background/85 px-3 py-2.5 text-sm"><span className="font-black tabular-nums text-foreground">{dealPrice !== null ? money(dealPrice) : 'Enter deal price'}</span>{originalPrice !== null && dealPrice !== null && originalPrice > dealPrice && <><span className="text-xs text-muted-foreground line-through tabular-nums">Original {money(originalPrice)}</span><span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-black text-emerald-700">Save {money(saving!)} · {percentage}%</span></>} {saving === null && <span className="text-xs text-muted-foreground">Add a higher original price to show savings.</span>}</div></section>

              <section aria-labelledby="deal-tracking-title" className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5"><SectionHeading id="deal-tracking-title" number="03" title="Affiliate / tracking" description="Control where shoppers go after selecting this deal." /><div className="mt-4 space-y-4"><Field label="Affiliate / Redirection Link" htmlFor={`affiliate-link-${deal.id}`}><div className="relative"><ExternalLink aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id={`affiliate-link-${deal.id}`} className="h-11 pl-9" value={formData.affiliate_url} onChange={(event) => setFormData({ ...formData, affiliate_url: event.target.value })} required placeholder="https://amazon.ae/..." /></div><p className="mt-1.5 text-xs leading-5 text-muted-foreground">This is where users are sent when they click “Go to Deal”.</p></Field><Field label="Coupon Value (Numeric only, if any)" htmlFor={`coupon-value-${deal.id}`}><Input id={`coupon-value-${deal.id}`} className="h-11 sm:max-w-xs" type="number" value={formData.coupon_value} onChange={(event) => setFormData({ ...formData, coupon_value: event.target.value ? parseInt(event.target.value) : '' })} placeholder="e.g. 10" /></Field></div></section>

              <section aria-labelledby="deal-visibility-title" className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5"><SectionHeading id="deal-visibility-title" number="04" title="Website visibility" description="Choose whether this offer appears in the active deals registry." /><label htmlFor={`deal-active-${deal.id}`} className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-primary/30"><input id={`deal-active-${deal.id}`} type="checkbox" checked={formData.is_active} onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })} className="mt-0.5 size-4 rounded border-border accent-primary" /><span><span className="flex items-center gap-1.5 text-sm font-bold"><CheckCircle2 aria-hidden="true" className="size-4 text-emerald-600" />Show this deal on the website</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Active deals are available to visitors. Turn this off to keep the record without showing it publicly.</span></span></label></section>
            </div>
            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-5 py-4 sm:px-7"><Dialog.Close render={<Button type="button" variant="outline" disabled={loading || imageUploading} className="min-h-11 px-4" />}>Cancel</Dialog.Close><Button type="submit" disabled={loading || imageUploading} className="min-h-11 px-5 font-bold">{imageUploading ? <><Loader2 aria-hidden="true" className="size-4 animate-spin" />Uploading image…</> : loading ? <><Loader2 aria-hidden="true" className="size-4 animate-spin" />Saving Changes…</> : 'Save Changes'}</Button></footer>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  </>
}

function SectionHeading({ id, number, title, description }: { id: string; number: string; title: string; description: string }) {
  return <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{number}</p><h2 id={id} className="mt-1 text-base font-black tracking-tight">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
}

function Field({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return <div className={`space-y-2 ${className ?? ''}`}><Label htmlFor={htmlFor} className="text-sm font-bold">{label}</Label>{children}</div>
}
