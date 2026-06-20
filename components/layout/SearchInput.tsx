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
            <Search className="nav-search-icon absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full h-9.5 border-1.5 border-border rounded-full pl-9.5 pr-3.5 font-body text-[13.5px] bg-secondary text-foreground outline-none transition-all focus:border-primary focus:bg-white focus:ring-3 focus:ring-primary/12"
            />
        </form>
    )
}
