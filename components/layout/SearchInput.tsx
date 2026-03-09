"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchInput({ placeholder, locale }: { placeholder: string, locale: string }) {
    const [query, setQuery] = useState('')
    const router = useRouter()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`)
        }
    }

    return (
        <form onSubmit={handleSearch} className="w-full relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-input bg-transparent px-9 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
        </form>
    )
}
