'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'uae_compare_ids'
const MAX_COMPARE_ITEMS = 4

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [hasMounted, setHasMounted] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  // Initialization
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setCompareIds(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse compare IDs', e)
      }
    }
    setHasMounted(true)
  }, [])

  // Sync with localStorage
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds))
    }
  }, [compareIds, hasMounted])

  const addToCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev
      if (prev.length >= MAX_COMPARE_ITEMS) {
        setWarning(`Maximum ${MAX_COMPARE_ITEMS} products can be compared`)
        return prev
      }
      setWarning(null)
      return [...prev, id]
    })
  }, [])

  const removeFromCompare = useCallback((id: string) => {
    setCompareIds((prev) => prev.filter((item) => item !== id))
    setWarning(null)
  }, [])

  const clearCompare = useCallback(() => {
    setCompareIds([])
    setWarning(null)
  }, [])

  const isInCompare = useCallback((id: string) => {
    return compareIds.includes(id)
  }, [compareIds])

  const clearWarning = useCallback(() => {
    setWarning(null)
  }, [])

  return {
    compareIds: hasMounted ? compareIds : [],
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    hasMounted,
    warning,
    clearWarning
  }
}
