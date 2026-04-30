/**
 * Showcase Context
 * Shares active section state between showcase page and top navigation
 */

'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ShowcaseContextType {
  activeSection: string
  setActiveSection: (section: string) => void
}

const ShowcaseContext = createContext<ShowcaseContextType | undefined>(undefined)

export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<string>('hero')

  return (
    <ShowcaseContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </ShowcaseContext.Provider>
  )
}

export function useShowcase() {
  const context = useContext(ShowcaseContext)
  // Return default values if context is not available (for pages without provider)
  if (context === undefined) {
    return {
      activeSection: 'hero',
      setActiveSection: () => {},
    }
  }
  return context
}

