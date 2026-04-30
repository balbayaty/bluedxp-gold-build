/**
 * Keyboard Shortcuts System
 * 
 * Provides global keyboard shortcuts for power users
 */

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description: string
  category: 'navigation' | 'actions' | 'search' | 'system'
}

class KeyboardShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private enabled: boolean = true

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): () => void {
    const key = this.getKeyString(shortcut)
    this.shortcuts.set(key, shortcut)
    
    // Return unregister function
    return () => {
      this.shortcuts.delete(key)
    }
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string): void {
    this.shortcuts.delete(key)
  }

  /**
   * Enable/disable shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Get all shortcuts
   */
  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Get shortcuts by category
   */
  getByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(s => s.category === category)
  }

  /**
   * Check if user is typing in an input field
   */
  private isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement
    
    // Check if target is an input, textarea, select, or contenteditable element
    if (!target) return false
    
    const tagName = target.tagName.toLowerCase()
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select'
    const isContentEditable = target.getAttribute('contenteditable') === 'true'
    
    // Check if it's a specific input type that should allow shortcuts
    if (isInput && target instanceof HTMLInputElement) {
      const inputType = target.type.toLowerCase()
      // Allow shortcuts for search inputs when using Ctrl/Cmd modifier
      if (inputType === 'search' && (event.ctrlKey || event.metaKey)) {
        return false
      }
      // Allow shortcuts for text inputs only with modifiers
      if (inputType === 'text' && (event.ctrlKey || event.metaKey || event.altKey)) {
        return false
      }
    }
    
    return isInput || isContentEditable
  }

  /**
   * Handle keydown event
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.enabled) return false

    // Don't trigger shortcuts when user is typing in input fields
    // Exception: Escape key and shortcuts with modifiers (Ctrl/Cmd/Alt) are allowed
    const isTyping = this.isTypingInInput(event)
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
    const isEscape = event.key === 'Escape'
    
    // Allow shortcuts if:
    // 1. User is not typing in an input field, OR
    // 2. Shortcut has a modifier key (Ctrl/Cmd/Alt/Shift), OR
    // 3. It's the Escape key
    if (isTyping && !hasModifier && !isEscape) {
      return false
    }

    const key = this.getKeyStringFromEvent(event)
    const shortcut = this.shortcuts.get(key)

    if (shortcut) {
      event.preventDefault()
      event.stopPropagation()
      shortcut.action()
      return true
    }

    return false
  }

  /**
   * Get key string from shortcut config
   */
  private getKeyString(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.alt) parts.push('alt')
    if (shortcut.meta) parts.push('meta')
    parts.push(shortcut.key.toLowerCase())
    return parts.join('+')
  }

  /**
   * Get key string from keyboard event
   */
  private getKeyStringFromEvent(event: KeyboardEvent): string {
    const parts: string[] = []
    if (event.ctrlKey) parts.push('ctrl')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')
    if (event.metaKey) parts.push('meta')
    parts.push(event.key.toLowerCase())
    return parts.join('+')
  }
}

// Global instance
export const keyboardShortcuts = new KeyboardShortcutsManager()

// Initialize event listener
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (event) => {
    keyboardShortcuts.handleKeyDown(event)
  })
}

// Default shortcuts
export const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrl: true,
    action: () => {
      // Open search/command palette
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
        searchInput.select()
      }
    },
    description: 'Open search',
    category: 'search',
  },
  {
    key: '/',
    action: () => {
      // Only focus search if not already typing in an input
      const activeElement = document.activeElement
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      )
      
      if (!isTyping) {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    },
    description: 'Focus search',
    category: 'search',
  },
  {
    key: 'h',
    ctrl: true,
    action: () => {
      window.location.href = '/'
    },
    description: 'Go to home',
    category: 'navigation',
  },
  {
    key: 'b',
    ctrl: true,
    action: () => {
      window.history.back()
    },
    description: 'Go back',
    category: 'navigation',
  },
  {
    key: 'f',
    ctrl: true,
    action: () => {
      window.history.forward()
    },
    description: 'Go forward',
    category: 'navigation',
  },
  {
    key: 'Escape',
    action: () => {
      // Close modals
      const modals = document.querySelectorAll('[role="dialog"]')
      modals.forEach((modal) => {
        const closeButton = modal.querySelector('button[aria-label*="close" i], button[aria-label*="Close" i]')
        if (closeButton) {
          (closeButton as HTMLButtonElement).click()
        }
      })
    },
    description: 'Close modal/dialog',
    category: 'actions',
  },
]

// Register default shortcuts
defaultShortcuts.forEach(shortcut => {
  keyboardShortcuts.register(shortcut)
})

/**
 * React hook for keyboard shortcuts
 */
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  options?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
    description?: string
    category?: KeyboardShortcut['category']
    enabled?: boolean
  }
) {
  if (typeof window === 'undefined') return

  const { useEffect } = require('react')

  useEffect(() => {
    if (options?.enabled === false) return

    const shortcut: KeyboardShortcut = {
      key,
      ctrl: options?.ctrl,
      shift: options?.shift,
      alt: options?.alt,
      meta: options?.meta,
      action,
      description: options?.description || `Shortcut: ${key}`,
      category: options?.category || 'actions',
    }

    const unregister = keyboardShortcuts.register(shortcut)

    return () => {
      unregister()
    }
  }, [key, action, options?.ctrl, options?.shift, options?.alt, options?.meta, options?.enabled])
}

export default keyboardShortcuts


