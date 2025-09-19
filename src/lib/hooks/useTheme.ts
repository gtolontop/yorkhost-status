'use client'

import { useState, useEffect } from 'react'
import { localStorage } from '@/lib/utils'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    // Get theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') as Theme
    const initialTheme = savedTheme || 'dark'

    setTheme(initialTheme)
    applyTheme(initialTheme)

    // Save initial theme to localStorage if not already saved
    if (!savedTheme) {
      localStorage.setItem('theme', initialTheme)
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return {
    theme,
    toggleTheme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme)
      applyTheme(newTheme)
      localStorage.setItem('theme', newTheme)
    }
  }
}