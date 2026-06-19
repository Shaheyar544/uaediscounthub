import { Sparkles } from 'lucide-react'
import { sanitizeRichHtml } from '@/lib/sanitize-html'

export function AISummaryBlock({ text }: { text: string }) {
  const isHtml = /<[a-z][\s\S]*>/i.test(text)
  const sanitizedText = sanitizeRichHtml(text)

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-500 rounded-md text-white">
          <Sparkles className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-blue-900">DeepSeek AI Summary</h4>
      </div>

      {isHtml ? (
        <div
          dangerouslySetInnerHTML={{ __html: sanitizedText }}
          className="text-sm text-blue-800/90 leading-relaxed font-medium prose prose-sm max-w-none
            [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-1
            [&>ol]:list-decimal [&>ol]:pl-4
            [&>li]:text-blue-800/90
            [&>p]:mb-2
            [&>strong]:font-bold"
        />
      ) : (
        <div className="text-sm text-blue-800/90 leading-relaxed font-medium space-y-1.5">
          {text.split('\n').map(l => l.trim()).filter(Boolean).map((line, i) => {
            if (/^[•\-*]\s/.test(line)) {
              return (
                <div key={i} className="flex gap-2">
                  <span className="text-blue-500 font-bold mt-0.5 shrink-0">•</span>
                  <span>{line.replace(/^[•\-*]\s*/, '')}</span>
                </div>
              )
            }
            return <p key={i}>{line}</p>
          })}
        </div>
      )}
    </div>
  )
}
