import { Sparkles } from 'lucide-react'

export function AISummaryBlock({ text }: { text: string }) {
    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-5 shadow-sm mb-8">
            <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-blue-500 rounded-md text-white">
                    <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-blue-900 dark:text-blue-300">DeepSeek AI Summary</h4>
            </div>
            <p className="text-sm text-blue-800/90 dark:text-blue-200/90 leading-relaxed font-medium">
                {text}
            </p>
        </div>
    )
}
