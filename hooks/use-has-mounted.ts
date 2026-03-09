"use client"

import { useEffect, useState } from 'react'

/**
 * Hook to solve hydration mismatch issues by delaying client-only rendering
 * until after the initial mount.
 */
export function useHasMounted() {
    const [hasMounted, setHasMounted] = useState(false)

    useEffect(() => {
        setHasMounted(true)
    }, [])

    return hasMounted
}
