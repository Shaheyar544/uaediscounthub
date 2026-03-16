'use client'

import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

interface SEOChecklistProps {
  score: number
  checks: {
    label: string
    status: 'pass' | 'warn' | 'fail'
    description?: string
  }[]
}

/**
 * SEOChecklist Component
 * Visual feedback for content creators in the admin editor.
 */
export function SEOChecklist({ score, checks }: SEOChecklistProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="text-[#00C48C]" size={16} />
      case 'warn': return <AlertTriangle className="text-[#FFC107]" size={16} />
      case 'fail': return <XCircle className="text-[#FF3B30]" size={16} />
      default: return null
    }
  }

  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-[#00C48C]'
    if (s >= 40) return 'text-[#FFC107]'
    return 'text-[#FF3B30]'
  }

  const getScoreBg = (s: number) => {
    if (s >= 70) return 'bg-[#00C48C]'
    if (s >= 40) return 'bg-[#FFC107]'
    return 'bg-[#FF3B30]'
  }

  return (
    <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-extrabold text-[#0D1117]">📈 SEO Checklist</span>
        <div className={`text-[13px] font-extrabold px-2 py-0.5 rounded-full ${getScoreBg(score)} text-white`}>
          {score}/100
        </div>
      </div>

      <div className="w-full h-1.5 bg-[#F0F3FA] rounded-full overflow-hidden mb-5">
        <div 
          className={`h-full transition-all duration-500 ${getScoreBg(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="space-y-3.5">
        {checks.map((check, i) => (
          <div key={i} className="flex gap-3">
            <div className="mt-0.5 flex-shrink-0">
              {getStatusIcon(check.status)}
            </div>
            <div>
              <div className="text-[12px] font-bold text-[#4B5675] leading-tight mb-0.5">
                {check.label}
              </div>
              {check.description && (
                <div className="text-[10px] text-[#8A94A6] leading-normal">
                  {check.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
