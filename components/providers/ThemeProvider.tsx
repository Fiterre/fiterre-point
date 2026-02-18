'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  theme: string
  accentColor: string
  fontSize: string
  setTheme: (theme: string) => void
  setAccentColor: (color: string) => void
  setFontSize: (size: string) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useThemeContext() {
  return useContext(ThemeContext)
}

const FONT_SIZE_MAP: Record<string, string> = {
  compact: '14px',
  normal: '16px',
  large: '18px',
}

// アクセントカラーのCSS変数マッピング
const ACCENT_COLOR_MAP: Record<string, { primary: string; primaryForeground: string }> = {
  amber: {
    primary: 'oklch(0.795 0.184 86.047)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
  blue: {
    primary: 'oklch(0.623 0.214 259.815)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
  green: {
    primary: 'oklch(0.723 0.219 149.579)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
  purple: {
    primary: 'oklch(0.627 0.265 303.9)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
  red: {
    primary: 'oklch(0.637 0.237 25.331)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
  emerald: {
    primary: 'oklch(0.765 0.177 163.223)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
}

interface Props {
  children: React.ReactNode
  initialTheme: string
  initialAccentColor: string
  initialFontSize: string
}

export default function ThemeProvider({
  children,
  initialTheme,
  initialAccentColor,
  initialFontSize,
}: Props) {
  const [theme, setTheme] = useState(initialTheme)
  const [accentColor, setAccentColor] = useState(initialAccentColor)
  const [fontSize, setFontSize] = useState(initialFontSize)

  // ダークモード適用
  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // system: OS設定に追従
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)

      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches)
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  // アクセントカラー適用（CSS変数を上書き）
  useEffect(() => {
    const colors = ACCENT_COLOR_MAP[accentColor]
    if (colors) {
      document.documentElement.style.setProperty('--primary', colors.primary)
      document.documentElement.style.setProperty('--primary-foreground', colors.primaryForeground)
    }
  }, [accentColor])

  // フォントサイズ適用
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_MAP[fontSize] || '16px'
  }, [fontSize])

  return (
    <ThemeContext.Provider
      value={{ theme, accentColor, fontSize, setTheme, setAccentColor, setFontSize }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
