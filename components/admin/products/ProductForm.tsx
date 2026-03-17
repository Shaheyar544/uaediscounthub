'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ImageUpload } from '@/components/admin/ImageUpload'
import {
  saveProduct,
  deleteProductById,
} from '@/app/[locale]/admin/products/product-actions'
import type { StorePrice, SpecEntry, ProductPayload } from '@/app/[locale]/admin/products/product-actions'
import {
  Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, Package, ImageIcon, BarChart2, Settings,
  Globe, Tag, Star, X, ArrowLeft,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

// Form-local type allows empty string for number inputs while typing
interface StorePriceRow {
  id?: string
  store_id: string
  price: number | ''
  original_price: number | ''
  affiliate_url: string
  coupon_code: string
  coupon_discount: string
  in_stock: boolean
  is_best_price: boolean
}

export interface Category { id: string; name_en: string }
export interface StoreOption { id: string; name: string; logo_url?: string | null }

export interface ProductFormInitialData {
  id?: string
  name_en?: string
  name_ar?: string
  slug?: string
  brand?: string
  model?: string
  sku?: string
  category_id?: string
  status?: 'draft' | 'published' | 'archived'
  tags?: string[]
  image_url?: string
  additional_images?: string[]
  description_en?: string
  description_ar?: string
  specifications?: Record<string, string>
  meta_title?: string
  meta_description?: string
  is_featured?: boolean
  is_trending?: boolean
  store_prices?: StorePriceRow[]
}

interface ProductFormProps {
  initialData?: ProductFormInitialData
  stores: StoreOption[]
  categories: Category[]
  locale: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function calcDiscount(price: number | '', original: number | ''): number {
  const p = Number(price)
  const o = Number(original)
  if (!p || !o || o <= p) return 0
  return Math.round(((o - p) / o) * 100)
}

function emptyPriceRow(): StorePriceRow {
  return {
    store_id: '',
    price: '',
    original_price: '',
    affiliate_url: '',
    coupon_code: '',
    coupon_discount: '',
    in_stock: true,
    is_best_price: false,
  }
}

function autoMarkBestPrice(rows: StorePriceRow[]): StorePriceRow[] {
  const valid = rows.filter(r => r.store_id && Number(r.price) > 0)
  if (valid.length === 0) return rows
  const min = Math.min(...valid.map(r => Number(r.price)))
  return rows.map(r => ({
    ...r,
    is_best_price: !!r.store_id && Number(r.price) === min && Number(r.price) > 0,
  }))
}

// ── Style constants ───────────────────────────────────────────────────────────

const INPUT = 'w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] text-[#0D1117] focus:border-[#0057FF] focus:outline-none transition-colors'
const LABEL = 'text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider block mb-1.5'
const CARD = 'bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-6 shadow-sm'

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#DDE3EF]">
      <div className="p-1.5 bg-[#E8F0FF] rounded-lg text-[#0057FF]">{icon}</div>
      <h2 className="text-[15px] font-extrabold text-[#0D1117]">{title}</h2>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  color = '#0057FF',
}: {
  checked: boolean
  onChange: () => void
  color?: string
}) {
  return (
    <div
      onClick={onChange}
      className="w-10 h-[22px] rounded-full cursor-pointer transition-colors relative shrink-0"
      style={{ backgroundColor: checked ? color : '#DDE3EF' }}
    >
      <div
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`}
      />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ProductForm({ initialData, stores, categories, locale }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!initialData?.id

  // § Basic Info
  const [nameEn, setNameEn] = useState(initialData?.name_en ?? '')
  const [nameAr, setNameAr] = useState(initialData?.name_ar ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!initialData?.slug)
  const [brand, setBrand] = useState(initialData?.brand ?? '')
  const [model, setModel] = useState(initialData?.model ?? '')
  const [sku, setSku] = useState(initialData?.sku ?? '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? '')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
    initialData?.status ?? 'draft'
  )
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  // § Media
  const [primaryImage, setPrimaryImage] = useState(initialData?.image_url ?? '')
  const [additionalImages, setAdditionalImages] = useState<string[]>(
    initialData?.additional_images ?? []
  )

  // § Store Prices
  const [storePrices, setStorePrices] = useState<StorePriceRow[]>(
    initialData?.store_prices?.length ? initialData.store_prices : [emptyPriceRow()]
  )
  const [removedPriceIds, setRemovedPriceIds] = useState<string[]>([])

  // § Description + Specs
  const [descEn, setDescEn] = useState(initialData?.description_en ?? '')
  const [descAr, setDescAr] = useState(initialData?.description_ar ?? '')
  const [specs, setSpecs] = useState<SpecEntry[]>(
    Object.entries(initialData?.specifications ?? {}).map(([key, value]) => ({ key, value }))
  )

  // § SEO
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title ?? '')
  const [metaDesc, setMetaDesc] = useState(initialData?.meta_description ?? '')

  // § Settings
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false)
  const [isTrending, setIsTrending] = useState(initialData?.is_trending ?? false)

  // Form state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [storeWarning, setStoreWarning] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleNameChange = (v: string) => {
    setNameEn(v)
    if (!slugManual) setSlug(toSlug(v))
  }

  const addTag = (value: string) => {
    const t = value.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const addAdditionalImage = () => {
    if (additionalImages.length < 5) setAdditionalImages(prev => [...prev, ''])
  }

  const updateAdditionalImage = (i: number, url: string) =>
    setAdditionalImages(prev => prev.map((img, idx) => (idx === i ? url : img)))

  const removeAdditionalImage = (i: number) =>
    setAdditionalImages(prev => prev.filter((_, idx) => idx !== i))

  const addPriceRow = () => setStorePrices(prev => [...prev, emptyPriceRow()])

  const removePriceRow = (i: number) => {
    const row = storePrices[i]
    if (row.id) setRemovedPriceIds(prev => [...prev, row.id!])
    setStorePrices(prev => autoMarkBestPrice(prev.filter((_, idx) => idx !== i)))
  }

  const updatePriceRow = useCallback(
    (i: number, field: keyof StorePriceRow, value: unknown) => {
      setStorePrices(prev => {
        const updated = prev.map((row, idx) =>
          idx === i ? { ...row, [field]: value } : row
        )
        return field === 'price' ? autoMarkBestPrice(updated) : updated
      })
    },
    []
  )

  const setBestPriceManual = (i: number) =>
    setStorePrices(prev => prev.map((row, idx) => ({ ...row, is_best_price: idx === i })))

  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }])
  const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, idx) => idx !== i))
  const updateSpec = (i: number, field: 'key' | 'value', value: string) =>
    setSpecs(prev => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))

  const handleSave = async (saveStatus: 'draft' | 'published') => {
    if (!nameEn.trim()) { setError('Product name (English) is required'); return }
    if (!slug.trim()) { setError('Slug / URL is required'); return }

    const validPrices = storePrices.filter(
      sp => sp.store_id && sp.price !== '' && Number(sp.price) > 0 && sp.affiliate_url.trim()
    )
    if (validPrices.length === 0) {
      setError('At least one store price row must have: Store + Price + Affiliate URL')
      return
    }

    setSaving(true)
    setError(null)

    const payload: ProductPayload = {
      id: initialData?.id,
      name_en: nameEn.trim(),
      name_ar: nameAr.trim(),
      slug: slug.trim(),
      brand: brand.trim(),
      model: model.trim(),
      sku: sku.trim(),
      category_id: categoryId,
      status: saveStatus,
      tags,
      image_url: primaryImage,
      additional_images: additionalImages.filter(Boolean),
      description_en: descEn,
      description_ar: descAr,
      specs,
      meta_title: metaTitle,
      meta_description: metaDesc,
      is_featured: isFeatured,
      is_trending: isTrending,
      store_prices: validPrices.map(
        (sp): StorePrice => ({
          id: sp.id,
          store_id: sp.store_id,
          price: Number(sp.price),
          original_price: sp.original_price !== '' ? Number(sp.original_price) : null,
          affiliate_url: sp.affiliate_url.trim(),
          coupon_code: sp.coupon_code.trim(),
          coupon_discount: sp.coupon_discount.trim(),
          in_stock: sp.in_stock,
          is_best_price: sp.is_best_price,
        })
      ),
      removed_price_ids: removedPriceIds,
    }

    const result = await saveProduct(payload)
    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      if (result.storeErrors && result.storeErrors.length > 0) {
        setStoreWarning(
          `Product saved, but ${result.storeErrors.length} store price(s) failed: ${result.storeErrors.join(' | ')}`
        )
        // Still navigate after a longer delay so the warning is visible
        setTimeout(() => router.push(`/${locale}/admin/products`), 4000)
      } else {
        setSuccess(true)
        setTimeout(() => router.push(`/${locale}/admin/products`), 900)
      }
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id) return
    if (!window.confirm(`Delete "${nameEn}"? This cannot be undone.`)) return
    setDeleting(true)
    const result = await deleteProductById(initialData.id, slug, locale)
    setDeleting(false)
    if (result.error) setError(result.error)
    else router.push(`/${locale}/admin/products`)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto pb-28">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/${locale}/admin/products`}
          className="p-2 rounded-lg hover:bg-[#F6F8FC] text-[#8A94A6] hover:text-[#0D1117] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0D1117]">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-[13px] text-[#8A94A6] mt-0.5">
            {isEditing
              ? `Editing: ${nameEn}`
              : 'Fill in product details and store pricing links'}
          </p>
        </div>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 rounded-[10px] mb-5 text-red-700 text-[13px] font-medium">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 p-4 bg-green-50 border border-green-200 rounded-[10px] mb-5 text-green-700 text-[13px] font-medium">
          <CheckCircle2 size={16} className="shrink-0" />
          Saved! Redirecting to products list...
        </div>
      )}
      {storeWarning && (
        <div className="flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-[10px] mb-5 text-amber-800 text-[13px] font-medium">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
          <span>{storeWarning}</span>
        </div>
      )}

      <div className="space-y-6">

        {/* ══ §1 Basic Information ═══════════════════════════════════════════ */}
        <div className={CARD}>
          <SectionHeader icon={<Package size={15} />} title="Basic Information" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Product Name (English) *</label>
              <input
                className={INPUT}
                value={nameEn}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Apple iPhone 15 Pro Max"
              />
            </div>
            <div>
              <label className={LABEL}>Product Name (Arabic)</label>
              <input
                className={INPUT}
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                placeholder="اسم المنتج بالعربية"
                dir="rtl"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className={LABEL}>Slug / URL *</label>
            <div className="flex gap-2">
              <input
                className={INPUT}
                value={slug}
                onChange={e => {
                  setSlug(toSlug(e.target.value))
                  setSlugManual(true)
                }}
                placeholder="apple-iphone-15-pro-max"
              />
              <button
                type="button"
                onClick={() => { setSlug(toSlug(nameEn)); setSlugManual(false) }}
                className="px-3 py-2 text-[11px] font-bold text-[#0057FF] bg-[#E8F0FF] rounded-[8px] hover:bg-[#D0E4FF] transition-colors whitespace-nowrap"
              >
                Auto-generate
              </button>
            </div>
            <p className="text-[11px] text-[#8A94A6] mt-1">
              URL: /product/<span className="text-[#0057FF]">{slug || 'your-slug'}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className={LABEL}>Brand</label>
              <input
                className={INPUT}
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Apple"
              />
            </div>
            <div>
              <label className={LABEL}>Model</label>
              <input
                className={INPUT}
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. A2896"
              />
            </div>
            <div>
              <label className={LABEL}>SKU</label>
              <input
                className={INPUT}
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. IP15PM-256-BLK"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={LABEL}>Category</label>
              <div className="relative">
                <select
                  className={`${INPUT} appearance-none pr-8`}
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name_en}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A94A6] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <div className="relative">
                <select
                  className={`${INPUT} appearance-none pr-8`}
                  value={status}
                  onChange={e => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A94A6] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <label className={LABEL}>Tags</label>
            <div className="flex flex-wrap gap-2 min-h-[32px] mb-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-[#E8F0FF] text-[#0057FF] text-[12px] font-bold px-2.5 py-1 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                    className="hover:text-[#003FCC] ml-0.5"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <input
              className={INPUT}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
                if (e.key === ',' || e.key === ' ') { e.preventDefault(); if (tagInput.trim()) addTag(tagInput) }
              }}
              placeholder="Type a tag and press Enter to add..."
            />
            <p className="text-[11px] text-[#8A94A6] mt-1">Press Enter, comma, or space to add</p>
          </div>
        </div>

        {/* ══ §2 Media ═══════════════════════════════════════════════════════ */}
        <div className={CARD}>
          <SectionHeader icon={<ImageIcon size={15} />} title="Media" />

          <ImageUpload
            value={primaryImage}
            onChange={setPrimaryImage}
            label="Primary Image"
            description="Main product image shown on listing pages. PNG/WebP with transparent background works best."
            folder="products"
          />

          {additionalImages.length > 0 && (
            <div className="mt-6 space-y-4">
              <p className={LABEL}>Additional Images ({additionalImages.length}/5)</p>
              {additionalImages.map((img, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-1">
                    <ImageUpload
                      value={img}
                      onChange={url => updateAdditionalImage(i, url)}
                      label={`Image ${i + 2}`}
                      folder="products"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAdditionalImage(i)}
                    className="mt-7 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {additionalImages.length < 5 && (
            <button
              type="button"
              onClick={addAdditionalImage}
              className="mt-4 flex items-center gap-2 text-[13px] font-bold text-[#0057FF] hover:text-[#0047DD] transition-colors"
            >
              <Plus size={15} /> Add Additional Image
            </button>
          )}
        </div>

        {/* ══ §3 Pricing & Store Links ════════════════════════════════════════ */}
        <div className={CARD}>
          <SectionHeader icon={<BarChart2 size={15} />} title="Pricing & Store Links" />
          <p className="text-[12px] text-[#8A94A6] -mt-2 mb-5">
            Add affiliate prices from every store. The lowest price is auto-marked as Best Price.
          </p>

          <div className="space-y-4">
            {storePrices.map((sp, i) => {
              const disc = calcDiscount(sp.price, sp.original_price)
              const usedStoreIds = storePrices
                .filter((_, idx) => idx !== i)
                .map(r => r.store_id)
                .filter(Boolean)

              return (
                <div
                  key={i}
                  className="border-[1.5px] border-[#DDE3EF] rounded-[12px] p-4 bg-[#FAFBFD]"
                >
                  {/* Row header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-[#8A94A6] uppercase tracking-wider">
                        Store #{i + 1}
                      </span>
                      {sp.is_best_price && sp.store_id && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#FF6B00] bg-[#FFF8F2] border border-[#FF6B00]/20 px-2 py-0.5 rounded-full">
                          <Star size={9} fill="#FF6B00" /> BEST PRICE
                        </span>
                      )}
                    </div>
                    {storePrices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePriceRow(i)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Store selector */}
                    <div>
                      <label className={LABEL}>Store *</label>
                      <div className="relative">
                        <select
                          className={`${INPUT} appearance-none pr-8`}
                          value={sp.store_id}
                          onChange={e => updatePriceRow(i, 'store_id', e.target.value)}
                        >
                          <option value="">Select Store...</option>
                          {stores.map(s => (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={usedStoreIds.includes(s.id)}
                            >
                              {s.name}
                              {usedStoreIds.includes(s.id) ? ' (already added)' : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A94A6] pointer-events-none" />
                      </div>
                    </div>

                    {/* Affiliate URL */}
                    <div>
                      <label className={LABEL}>Affiliate URL *</label>
                      <input
                        className={INPUT}
                        type="url"
                        value={sp.affiliate_url}
                        onChange={e => updatePriceRow(i, 'affiliate_url', e.target.value)}
                        placeholder="https://www.amazon.ae/dp/ASIN?tag=..."
                      />
                    </div>

                    {/* Current Price */}
                    <div>
                      <label className={LABEL}>Current Price (AED) *</label>
                      <input
                        className={INPUT}
                        type="number"
                        min="0"
                        step="0.01"
                        value={sp.price}
                        onChange={e =>
                          updatePriceRow(
                            i,
                            'price',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>

                    {/* Original Price */}
                    <div>
                      <label className={LABEL}>
                        Original Price (AED)
                        {disc > 0 && (
                          <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                            Save {disc}%
                          </span>
                        )}
                      </label>
                      <input
                        className={INPUT}
                        type="number"
                        min="0"
                        step="0.01"
                        value={sp.original_price}
                        onChange={e =>
                          updatePriceRow(
                            i,
                            'original_price',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )
                        }
                        placeholder="0.00 (leave blank if no discount)"
                      />
                    </div>

                    {/* Coupon Code */}
                    <div>
                      <label className={LABEL}>Coupon Code (optional)</label>
                      <input
                        className={INPUT}
                        value={sp.coupon_code}
                        onChange={e => updatePriceRow(i, 'coupon_code', e.target.value)}
                        placeholder="e.g. NOON30"
                      />
                    </div>

                    {/* Coupon Discount Label */}
                    <div>
                      <label className={LABEL}>Coupon Discount Label (optional)</label>
                      <input
                        className={INPUT}
                        value={sp.coupon_discount}
                        onChange={e => updatePriceRow(i, 'coupon_discount', e.target.value)}
                        placeholder="e.g. Extra 10% OFF"
                      />
                    </div>
                  </div>

                  {/* Toggles row */}
                  <div className="flex items-center gap-6 mt-3 pt-3 border-t border-[#DDE3EF]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Toggle
                        checked={sp.in_stock}
                        onChange={() => updatePriceRow(i, 'in_stock', !sp.in_stock)}
                        color="#00C48C"
                      />
                      <span className="text-[12px] font-bold text-[#4B5675]">In Stock</span>
                    </label>

                    <label
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setBestPriceManual(i)}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${sp.is_best_price ? 'border-[#FF6B00] bg-[#FF6B00]' : 'border-[#DDE3EF]'}`}
                      >
                        {sp.is_best_price && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-[12px] font-bold text-[#4B5675]">
                        Override as Best Price
                      </span>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={addPriceRow}
            className="mt-4 flex items-center gap-2 text-[13px] font-bold text-[#0057FF] hover:text-[#0047DD] transition-colors"
          >
            <Plus size={15} /> Add Store Price
          </button>
        </div>

        {/* ══ §4 Description ═════════════════════════════════════════════════ */}
        <div className={CARD}>
          <SectionHeader icon={<Globe size={15} />} title="Description" />

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={LABEL} style={{ marginBottom: 0 }}>Description (English)</label>
                <span className="text-[11px] text-[#8A94A6]">{descEn.length} chars</span>
              </div>
              <textarea
                className={INPUT}
                rows={5}
                value={descEn}
                onChange={e => setDescEn(e.target.value)}
                placeholder="Detailed product description in English..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={LABEL} style={{ marginBottom: 0 }}>Description (Arabic)</label>
                <span className="text-[11px] text-[#8A94A6]">{descAr.length} chars</span>
              </div>
              <textarea
                className={INPUT}
                rows={5}
                value={descAr}
                onChange={e => setDescAr(e.target.value)}
                placeholder="وصف المنتج بالعربية..."
                dir="rtl"
              />
            </div>
          </div>

          {/* Technical Specs key/value pairs */}
          <div className="mt-6 pt-5 border-t border-[#DDE3EF]">
            <div className="flex items-center justify-between mb-3">
              <label className={LABEL} style={{ marginBottom: 0 }}>Technical Specifications</label>
              <button
                type="button"
                onClick={addSpec}
                className="text-[12px] font-bold text-[#0057FF] hover:text-[#0047DD] flex items-center gap-1 transition-colors"
              >
                <Plus size={13} /> Add Spec
              </button>
            </div>

            <div className="space-y-2">
              {specs.length === 0 && (
                <p className="text-[12px] text-[#8A94A6] py-4 text-center border border-dashed border-[#DDE3EF] rounded-lg">
                  No specs yet. Click &quot;+ Add Spec&quot; to add key/value pairs.
                </p>
              )}
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className={`${INPUT} flex-1`}
                    value={spec.key}
                    onChange={e => updateSpec(i, 'key', e.target.value)}
                    placeholder="e.g. RAM"
                  />
                  <input
                    className={`${INPUT} flex-1`}
                    value={spec.value}
                    onChange={e => updateSpec(i, 'value', e.target.value)}
                    placeholder="e.g. 8GB"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(i)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ §5 SEO ═════════════════════════════════════════════════════════ */}
        <div className={CARD}>
          <SectionHeader icon={<Tag size={15} />} title="SEO" />

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={LABEL} style={{ marginBottom: 0 }}>Meta Title</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMetaTitle(nameEn)}
                    className="text-[10px] font-bold text-[#0057FF] hover:underline"
                  >
                    Copy from name
                  </button>
                  <span
                    className={`text-[11px] font-bold ${
                      metaTitle.length > 60
                        ? 'text-red-500'
                        : metaTitle.length > 50
                        ? 'text-yellow-500'
                        : 'text-[#8A94A6]'
                    }`}
                  >
                    {metaTitle.length}/60
                  </span>
                </div>
              </div>
              <input
                className={INPUT}
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
                placeholder="SEO optimized title (under 60 chars)..."
                maxLength={80}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={LABEL} style={{ marginBottom: 0 }}>Meta Description</label>
                <span
                  className={`text-[11px] font-bold ${
                    metaDesc.length > 160
                      ? 'text-red-500'
                      : metaDesc.length > 140
                      ? 'text-yellow-500'
                      : 'text-[#8A94A6]'
                  }`}
                >
                  {metaDesc.length}/160
                </span>
              </div>
              <textarea
                className={INPUT}
                rows={3}
                value={metaDesc}
                onChange={e => setMetaDesc(e.target.value)}
                placeholder="Compelling search engine description (under 160 chars)..."
                maxLength={200}
              />
            </div>
          </div>
        </div>

        {/* ══ §6 Settings ════════════════════════════════════════════════════ */}
        <div className={CARD}>
          <SectionHeader icon={<Settings size={15} />} title="Settings" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-[#F6F8FC] p-4 rounded-xl border border-[#DDE3EF]/50">
              <div className="flex-1">
                <p className="text-[13px] font-bold text-[#0D1117]">Featured Product</p>
                <p className="text-[11px] text-[#8A94A6]">Show in homepage featured section</p>
              </div>
              <Toggle checked={isFeatured} onChange={() => setIsFeatured(v => !v)} />
            </div>

            <div className="flex items-center gap-3 bg-[#FFF8F2] p-4 rounded-xl border border-[#FF6B00]/10">
              <div className="flex-1">
                <p className="text-[13px] font-bold text-[#FF6B00]">Trending</p>
                <p className="text-[11px] text-[#FF6B00]/60">Highlight as trending product</p>
              </div>
              <Toggle
                checked={isTrending}
                onChange={() => setIsTrending(v => !v)}
                color="#FF6B00"
              />
            </div>
          </div>
        </div>

      </div>

      {/* ══ Sticky Action Bar ══════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#DDE3EF] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-red-500 border border-red-200 rounded-[8px] hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Trash2 size={14} />}
                Delete Product
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/admin/products`}
              className="px-4 py-2 text-[13px] font-bold text-[#4B5675] hover:text-[#0D1117] transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving || deleting}
              className="flex items-center gap-2 px-5 py-2 text-[13px] font-bold text-[#4B5675] bg-[#F6F8FC] border border-[#DDE3EF] rounded-[8px] hover:bg-[#E8EEFF] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saving || deleting}
              className="flex items-center gap-2 px-5 py-2 text-[13px] font-bold text-white bg-[#0057FF] rounded-[8px] hover:bg-[#0047DD] transition-colors shadow-[0_4px_12px_rgba(0,87,255,0.25)] disabled:opacity-50"
            >
              {saving
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />}
              {isEditing ? 'Update & Publish' : 'Publish Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
