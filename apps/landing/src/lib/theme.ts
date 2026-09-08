import { useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'landing-theme'

function read(): Theme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(read)

  function apply(next: Theme) {
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // private mode / disabled storage
    }
  }

  return [theme, apply]
}
