/**
 * Auto-Draft Save Hook
 * 
 * Automatically saves form data as draft when:
 * - User presses ESC key
 * - User navigates away from page
 * - User closes tab/window
 * - Data changes (debounced)
 * 
 * Provides intelligent draft management with:
 * - LocalStorage backup
 * - Visual save status indicators
 * - Conflict detection
 * - Auto-restore on return
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/utils/notifications'

export interface AutoDraftSaveOptions<T> {
  /** Unique key for storing draft (e.g., 'bim-upload-form') */
  storageKey: string
  /** Current form data */
  data: T
  /** Function to check if data has unsaved changes */
  hasChanges?: (data: T) => boolean
  /** Function to save draft (async) */
  saveDraft?: (data: T) => Promise<void>
  /** Function to load draft (async) */
  loadDraft?: () => Promise<T | null>
  /** Auto-save interval in milliseconds (default: 30000 = 30s) */
  autoSaveInterval?: number
  /** Debounce delay for change detection (default: 2000 = 2s) */
  debounceDelay?: number
  /** Enable auto-save on changes */
  enableAutoSave?: boolean
  /** Enable save on ESC */
  enableEscSave?: boolean
  /** Enable save on navigation */
  enableNavigationSave?: boolean
  /** Entity type for notifications */
  entityType?: string
  /** Callback when draft is saved */
  onDraftSaved?: (data: T) => void
  /** Callback when draft is restored */
  onDraftRestored?: (data: T) => void
}

export interface AutoDraftSaveReturn<T> {
  /** Current save status */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  /** Last save timestamp */
  lastSaved: Date | null
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean
  /** Manually trigger save */
  saveNow: () => Promise<void>
  /** Clear draft */
  clearDraft: () => void
  /** Restore draft */
  restoreDraft: () => Promise<T | null>
  /** Check if draft exists */
  hasDraft: () => boolean
}

export function useAutoDraftSave<T extends Record<string, any>>(
  options: AutoDraftSaveOptions<T>
): AutoDraftSaveReturn<T> {
  const {
    storageKey,
    data,
    hasChanges = (d) => Object.keys(d).length > 0,
    saveDraft,
    loadDraft,
    autoSaveInterval = 30000,
    debounceDelay = 2000,
    enableAutoSave = true,
    enableEscSave = true,
    enableNavigationSave = true,
    entityType = 'Form',
    onDraftSaved,
    onDraftRestored,
  } = options

  const router = useRouter()
  const notifications = useNotifications()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const dataRef = useRef<T>(data)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const previousDataRef = useRef<T>(data)

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data
  }, [data])

  // Check for changes
  useEffect(() => {
    const hasDataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current)
    if (hasDataChanged && hasChanges(data)) {
      setHasUnsavedChanges(true)
      previousDataRef.current = data
    }
  }, [data, hasChanges])

  // Save to localStorage with quota error handling
  const saveToLocalStorage = useCallback((dataToSave: T) => {
    try {
      // Filter out File objects (can't be serialized)
      const serializableData = Object.entries(dataToSave).reduce((acc, [key, value]) => {
        if (value instanceof File) {
          // Store file metadata instead
          acc[key] = {
            _isFile: true,
            name: value.name,
            size: value.size,
            type: value.type,
            lastModified: value.lastModified,
          }
        } else {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, any>)

      const draftData = {
        data: serializableData,
        timestamp: new Date().toISOString(),
        version: '1.0',
      }
      
      const serialized = JSON.stringify(draftData)
      localStorage.setItem(`draft:${storageKey}`, serialized)
      return true
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. Attempting to clear old drafts...')
        try {
          // Clear old drafts (older than 7 days)
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('draft:')) {
              try {
                const draft = JSON.parse(localStorage.getItem(key) || '{}')
                const draftTime = new Date(draft.timestamp).getTime()
                if (draftTime < sevenDaysAgo) {
                  localStorage.removeItem(key)
                }
              } catch {
                // If can't parse, remove it
                localStorage.removeItem(key)
              }
            }
          }
          // Retry save
          const serialized = JSON.stringify({
            data: Object.entries(dataToSave).reduce((acc, [key, value]) => {
              if (!(value instanceof File)) {
                acc[key] = value
              }
              return acc
            }, {} as Record<string, any>),
            timestamp: new Date().toISOString(),
            version: '1.0',
          })
          localStorage.setItem(`draft:${storageKey}`, serialized)
          return true
        } catch (retryError) {
          console.error('Failed to save draft even after cleanup:', retryError)
          return false
        }
      }
      console.error('Error saving to localStorage:', error)
      return false
    }
  }, [storageKey])

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(`draft:${storageKey}`)
      if (!stored) return null
      const draftData = JSON.parse(stored)
      return draftData.data as T
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return null
    }
  }, [storageKey])

  // Clear from localStorage
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(`draft:${storageKey}`)
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }, [storageKey])

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Main save function with race condition protection
  const saveDraftData = useCallback(async (dataToSave: T = dataRef.current, silent = false): Promise<void> => {
    // Prevent concurrent saves
    if (isSavingRef.current) {
      console.debug('Save already in progress, skipping...')
      return
    }
    
    if (!hasChanges(dataToSave)) {
      console.debug('No changes detected, skipping save...')
      return
    }

    isSavingRef.current = true
    
    // Only update state if component is still mounted
    if (isMountedRef.current) {
      setSaveStatus('saving')
    }

    try {
      // Save to localStorage first (fast, always available)
      const localStorageSuccess = saveToLocalStorage(dataToSave)

      // Save to server if function provided
      if (saveDraft) {
        await saveDraft(dataToSave)
      }

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.debug('Component unmounted, skipping state update')
        return
      }

      if (localStorageSuccess) {
        setSaveStatus('saved')
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        
        if (!silent && isMountedRef.current) {
          notifications.success(
            'Draft saved',
            `${entityType} draft has been saved automatically`,
            { duration: 2000 }
          )
        }

        onDraftSaved?.(dataToSave)
      } else {
        throw new Error('Failed to save to localStorage')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setSaveStatus('error')
        
        if (!silent) {
          notifications.error(
            'Draft save failed',
            error instanceof Error ? error.message : 'Failed to save draft',
            { duration: 3000 }
          )
        }
      }
    } finally {
      isSavingRef.current = false
      
      // Reset status after 3 seconds (only if mounted)
      if (isMountedRef.current) {
        const statusTimeout = setTimeout(() => {
          if (isMountedRef.current) {
            setSaveStatus((prev) => prev === 'saved' ? 'idle' : prev)
          }
        }, 3000)
        
        // Store timeout ref for cleanup
        return () => clearTimeout(statusTimeout)
      }
    }
  }, [saveDraft, saveToLocalStorage, hasChanges, entityType, notifications, onDraftSaved])

  // Debounced auto-save with cleanup
  useEffect(() => {
    if (!enableAutoSave || !hasUnsavedChanges || !isMountedRef.current) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      // Double-check component is still mounted before saving
      if (isMountedRef.current && hasUnsavedChanges) {
        saveDraftData(dataRef.current, true).catch((error) => {
          console.error('Auto-save error:', error)
        })
      }
      saveTimeoutRef.current = null
    }, debounceDelay)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [data, enableAutoSave, hasUnsavedChanges, debounceDelay, saveDraftData])

  // Periodic auto-save with cleanup
  useEffect(() => {
    if (!enableAutoSave || !isMountedRef.current) return

    autoSaveIntervalRef.current = setInterval(() => {
      // Only save if component is mounted and has changes
      if (isMountedRef.current && hasUnsavedChanges && !isSavingRef.current) {
        saveDraftData(dataRef.current, true).catch((error) => {
          console.error('Periodic auto-save error:', error)
        })
      }
    }, autoSaveInterval)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
        autoSaveIntervalRef.current = null
      }
    }
  }, [enableAutoSave, hasUnsavedChanges, autoSaveInterval, saveDraftData])

  // ESC key handler
  useEffect(() => {
    if (!enableEscSave) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSavingRef.current) {
        // Don't save if user is typing in input/textarea
        const target = e.target as HTMLElement
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return
        }

        // Check if there are changes
        if (hasUnsavedChanges && hasChanges(dataRef.current)) {
          e.preventDefault()
          e.stopPropagation()
          saveDraftData(dataRef.current, false) // Show notification
        }
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [enableEscSave, hasUnsavedChanges, hasChanges, saveDraftData])

  // Navigation save (beforeunload)
  useEffect(() => {
    if (!enableNavigationSave) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && hasChanges(dataRef.current)) {
        // Save synchronously to localStorage
        saveToLocalStorage(dataRef.current)
        
        // Show browser warning
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enableNavigationSave, hasUnsavedChanges, hasChanges, saveToLocalStorage])

  // Router navigation save
  useEffect(() => {
    if (!enableNavigationSave) return

    const handleRouteChange = () => {
      if (hasUnsavedChanges && hasChanges(dataRef.current)) {
        // Save before navigation
        saveDraftData(dataRef.current, true) // Silent save
      }
    }

    // Note: Next.js router doesn't have a direct beforeRouteChange event
    // We'll use a combination of visibility change and focus events
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges && hasChanges(dataRef.current)) {
        saveToLocalStorage(dataRef.current)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enableNavigationSave, hasUnsavedChanges, hasChanges, saveDraftData, saveToLocalStorage])

  // Manual save function
  const saveNow = useCallback(async () => {
    await saveDraftData(dataRef.current, false)
  }, [saveDraftData])

  // Clear draft
  const clearDraft = useCallback(() => {
    clearLocalStorage()
    setHasUnsavedChanges(false)
    setSaveStatus('idle')
    setLastSaved(null)
  }, [clearLocalStorage])

  // Restore draft
  const restoreDraft = useCallback(async (): Promise<T | null> => {
    try {
      // Try server first
      if (loadDraft) {
        const serverDraft = await loadDraft()
        if (serverDraft) {
          onDraftRestored?.(serverDraft)
          return serverDraft
        }
      }

      // Fallback to localStorage
      const localDraft = loadFromLocalStorage()
      if (localDraft) {
        onDraftRestored?.(localDraft)
        notifications.info(
          'Draft restored',
          `Restored ${entityType} draft from local storage`,
          { duration: 3000 }
        )
        return localDraft
      }

      return null
    } catch (error) {
      console.error('Error restoring draft:', error)
      return null
    }
  }, [loadDraft, loadFromLocalStorage, onDraftRestored, entityType, notifications])

  // Check if draft exists
  const hasDraft = useCallback((): boolean => {
    try {
      return localStorage.getItem(`draft:${storageKey}`) !== null
    } catch {
      return false
    }
  }, [storageKey])

  return {
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    clearDraft,
    restoreDraft,
    hasDraft,
  }
}







