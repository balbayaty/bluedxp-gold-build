/**
 * Accessibility Utilities
 * ARIA labels, keyboard navigation, and screen reader support
 */

/**
 * Generate ARIA label for actions
 */
export function getAriaLabel(action: string, context?: string): string {
  if (context) {
    return `${action} ${context}`
  }
  return action
}

/**
 * Generate ARIA description for complex elements
 */
export function getAriaDescription(element: string, details?: string): string {
  if (details) {
    return `${element}. ${details}`
  }
  return element
}

/**
 * Keyboard navigation helpers
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  SPACE: ' ',
} as const

/**
 * Handle keyboard navigation
 */
export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  actions: {
    onEnter?: () => void
    onEscape?: () => void
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowLeft?: () => void
    onArrowRight?: () => void
    onTab?: () => void
    onSpace?: () => void
  }
): void {
  switch (event.key) {
    case KEYBOARD_KEYS.ENTER:
      actions.onEnter?.()
      break
    case KEYBOARD_KEYS.ESCAPE:
      actions.onEscape?.()
      break
    case KEYBOARD_KEYS.ARROW_UP:
      event.preventDefault()
      actions.onArrowUp?.()
      break
    case KEYBOARD_KEYS.ARROW_DOWN:
      event.preventDefault()
      actions.onArrowDown?.()
      break
    case KEYBOARD_KEYS.ARROW_LEFT:
      event.preventDefault()
      actions.onArrowLeft?.()
      break
    case KEYBOARD_KEYS.ARROW_RIGHT:
      event.preventDefault()
      actions.onArrowRight?.()
      break
    case KEYBOARD_KEYS.TAB:
      actions.onTab?.()
      break
    case KEYBOARD_KEYS.SPACE:
      event.preventDefault()
      actions.onSpace?.()
      break
  }
}

/**
 * Generate role attribute
 */
export function getRole(elementType: 'button' | 'link' | 'tab' | 'dialog' | 'list' | 'listitem' | 'table' | 'row' | 'cell'): string {
  return elementType
}

/**
 * Generate live region announcement for screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}


