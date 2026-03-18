'use client'

import { useState } from 'react'

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const validImages = images.filter(Boolean)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed]           = useState(false)
  const [zoomPos, setZoomPos]             = useState({ x: 50, y: 50 })

  if (validImages.length === 0) {
    return (
      <div className="aspect-square bg-[#F6F8FC] rounded-[24px] border border-[#DDE3EF] flex items-center justify-center text-[#8A94A6] text-xl font-bold">
        No Image
      </div>
    )
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {/* Thumbnail strip — horizontal scroll on mobile, vertical on desktop */}
      {validImages.length > 1 && (
        <div
          className="flex flex-row gap-2 overflow-x-auto md:flex-col md:overflow-y-auto md:overflow-x-visible md:max-h-[500px]"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#DDE3EF transparent' }}
        >
          {validImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`w-[60px] h-[60px] md:w-[68px] md:h-[68px] rounded-[10px] border-2 p-1 transition-all shrink-0 bg-white ${
                selectedIndex === i
                  ? 'border-[#0057FF] shadow-[0_0_0_2px_rgba(0,87,255,0.15)]'
                  : 'border-[#DDE3EF] hover:border-[#8A94A6]'
              }`}
            >
              <img
                src={img}
                alt={`${productName} view ${i + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image with zoom */}
      <div
        className="relative flex-1 overflow-hidden rounded-[24px] border border-[#DDE3EF] bg-white shadow-sm cursor-zoom-in"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setZoomPos({
            x: ((e.clientX - rect.left) / rect.width)  * 100,
            y: ((e.clientY - rect.top)  / rect.height) * 100,
          })
          setIsZoomed(true)
        }}
        onMouseLeave={() => setIsZoomed(false)}
      >
        {/* FIX 1: TOP DEAL badge */}
        <div className="absolute top-4 left-4 z-10">
          <span
            className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white text-xs uppercase tracking-wide"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            🔥 TOP DEAL
          </span>
        </div>

        <div className="aspect-square flex items-center justify-center p-10 overflow-hidden">
          <img
            src={validImages[selectedIndex]}
            alt={productName}
            className="w-full h-full object-contain transition-transform duration-150 select-none"
            style={isZoomed ? {
              transform:       'scale(2.5)',
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            } : {}}
            draggable={false}
          />
        </div>

        {isZoomed && (
          <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none">
            🔍 Zoom
          </div>
        )}
      </div>
    </div>
  )
}
