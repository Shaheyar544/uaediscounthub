'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  description?: string
  folder?: string
}

// Helper to format bytes into KB or MB
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function ImageUpload({ value, onChange, label, description, folder = 'stores' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(!value)
  const [optimizedSize, setOptimizedSize] = useState<number | null>(null) // ✅ NEW
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Only JPEG, PNG and WebP allowed')
      return
    }

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setError('Maximum file size is 10MB')
      return
    }

    setError(null)
    setUploading(true)
    setOptimizedSize(null) // ✅ Reset size on new upload

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      onChange(data.url)
      setShowUrlInput(false)

      // ✅ Save optimized file size from API response
      if (data.file_size) {
        setOptimizedSize(data.file_size)
      }

    } catch (err: any) {
      console.error('[Upload] Error:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    onChange('')
    setShowUrlInput(true)
    setOptimizedSize(null) // ✅ Clear size on remove
  }

  return (
    <div className="space-y-4">
      {label && (
        <Label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
          {label}
        </Label>
      )}

      {value && !showUrlInput ? (
        <div className="relative group w-full aspect-video md:aspect-[2/1] bg-[#F6F8FC] rounded-xl border-[1.5px] border-[#DDE3EF] overflow-hidden flex items-center justify-center p-4 shadow-sm">
          <img 
            src={value} 
            alt="Upload Preview" 
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button 
              type="button" 
              variant="destructive" 
              size="sm" 
              onClick={removeImage}
              className="h-8 rounded-full px-3 text-[11px] font-bold"
            >
              <X size={14} className="mr-1" /> Remove
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowUrlInput(true)}
              className="h-8 rounded-full px-3 text-[11px] font-bold bg-white text-[#0D1117] hover:bg-white/90"
            >
              Edit URL
            </Button>
          </div>

          {/* ✅ UPDATED BADGE: Shows "Optimized WebP • 42.3 KB" */}
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-[#DDE3EF] shadow-sm">
            <span className="text-[9px] font-bold text-[#00C48C] flex items-center gap-1 uppercase tracking-tighter">
              <CheckCircle2 size={10} /> Optimized WebP
              {optimizedSize && (
                <>
                  <span className="text-[#DDE3EF]">•</span>
                  <span className="text-[#8A94A6]">{formatSize(optimizedSize)}</span>
                </>
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`
              relative w-full py-10 px-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer
              ${uploading ? 'bg-[#F6F8FC] border-[#DDE3EF] cursor-not-allowed' : 'bg-white border-[#DDE3EF] hover:border-[#0057FF] hover:bg-[#F6F8FC]/50'}
              ${error ? 'border-red-300 bg-red-50/30' : ''}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-[#0057FF]" size={32} />
                <span className="text-[13px] font-bold text-[#0057FF]">Compressing & Optimizing...</span>
                <span className="text-[10px] text-[#8A94A6]">Sending WebP to R2 + Supabase</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-[#E8F0FF] flex items-center justify-center text-[#0057FF] mb-2">
                  <Upload size={24} />
                </div>
                <span className="text-[14px] font-bold text-[#0D1117]">Click to upload store logo</span>
                <span className="text-[11px] text-[#8A94A6]">JPG, PNG or WebP (Max 2MB)</span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#DDE3EF]"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold">
              <span className="bg-white px-3 text-[#8A94A6]">or enter manual URL</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" size={14} />
              <Input 
                placeholder="https://media.uaediscounthub.com/..." 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-9 h-10 text-[13px] border-[#DDE3EF] focus:border-[#0057FF] rounded-lg"
              />
            </div>
            {value && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowUrlInput(false)}
                className="h-10 text-[11px] font-bold"
              >
                Preview
              </Button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 animate-in fade-in duration-300">
          <AlertCircle size={14} />
          <span className="text-[11px] font-bold">{error}</span>
        </div>
      )}

      {description && <p className="text-[10px] text-[#8A94A6] leading-relaxed">{description}</p>}
    </div>
  )
}
