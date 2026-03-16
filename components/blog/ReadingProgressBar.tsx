'use client'

import React, { useEffect, useState } from 'react'

/**
 * ReadingProgressBar Component
 * Fixed bar at the top of the viewport that fills as the user scrolls.
 * Uses a gradient from primary to accent as specified in the design.
 */
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight > 0) {
        setProgress((window.scrollY / scrollHeight) * 100)
      }
    }

    window.addEventListener('scroll', updateProgress)
    window.addEventListener('resize', updateProgress)

    // Initial calculation
    updateProgress()

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return (
    <div 
      className="fixed top-0 left-0 h-[3px] z-[9999] transition-all duration-100 ease-out rounded-r-full"
      style={{ 
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #0057FF, #FF6B00)'
      }}
    />
  )
}
