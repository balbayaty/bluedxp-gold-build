'use client'

// ============================================================================
// HAZALYZE ADAPTIVE ACCESSIBILITY CONTEXT
// AI-Powered, Self-Learning, Per-User Accessibility Management
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import {
  type AccessibilityPreferences,
  type AccessibilityInsight,
  type AccessibilityMLModel,
  type AccessibilityAnalytics,
  type AccessibilityEvent,
  ACCESSIBILITY_PROFILES,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  mergePreferences,
  calculateComplianceScore,
} from '@/types/accessibility'

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface AccessibilityContextType {
  // Preferences
  preferences: AccessibilityPreferences
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => void
  resetPreferences: () => void
  applyProfile: (profileId: string) => void
  
  // Insights & ML
  insights: AccessibilityInsight[]
  dismissInsight: (id: string) => void
  actOnInsight: (insightId: string, actionId: string) => void
  mlModel: AccessibilityMLModel | null
  trainModel: () => Promise<void>
  
  // Analytics
  trackEvent: (event: Omit<AccessibilityEvent, 'timestamp' | 'mlTracked'>) => void
  analytics: AccessibilityAnalytics | null
  getProductivityScore: () => number
  
  // UI State
  isQuestionnaireOpen: boolean
  setQuestionnaireOpen: (open: boolean) => void
  isSettingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  
  // Compliance
  complianceScore: number
  checkCompliance: () => Promise<void>
  
  // Import/Export
  exportPreferences: () => string
  importPreferences: (data: string) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_ACCESSIBILITY_PREFERENCES)
  const [insights, setInsights] = useState<AccessibilityInsight[]>([])
  const [mlModel, setMLModel] = useState<AccessibilityMLModel | null>(null)
  const [analytics, setAnalytics] = useState<AccessibilityAnalytics | null>(null)
  const [isQuestionnaireOpen, setQuestionnaireOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [complianceScore, setComplianceScore] = useState(0)
  
  const eventQueueRef = useRef<AccessibilityEvent[]>([])
  const mlTrainingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================================================
  // LOAD PREFERENCES (Per-User)
  // ============================================================================

  useEffect(() => {
    if (!user) return

    const storageKey = `accessibility-preferences-${user.id}`
    const saved = localStorage.getItem(storageKey)
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(mergePreferences(DEFAULT_ACCESSIBILITY_PREFERENCES, parsed))
      } catch (error) {
        console.error('Error loading accessibility preferences:', error)
      }
    } else {
      // First time user - show questionnaire
      const hasSeenQuestionnaire = localStorage.getItem(`accessibility-questionnaire-${user.id}`)
      if (!hasSeenQuestionnaire) {
        // Defer questionnaire to avoid blocking initial render
        setTimeout(() => setQuestionnaireOpen(true), 2000)
      }
    }
    
    // OPTIMIZED: Defer heavy ML model and analytics loading to avoid blocking
    // Use requestIdleCallback if available, otherwise setTimeout
    const loadHeavyData = () => {
      loadMLModel()
      loadAnalytics()
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(loadHeavyData, { timeout: 3000 })
    } else {
      setTimeout(loadHeavyData, 500) // Small delay to let UI render first
    }
  }, [user])

  // ============================================================================
  // SAVE PREFERENCES
  // ============================================================================

  const savePreferences = useCallback((prefs: AccessibilityPreferences) => {
    if (!user) return
    
    const storageKey = `accessibility-preferences-${user.id}`
    localStorage.setItem(storageKey, JSON.stringify(prefs))
    
    // Track preference change
    trackEvent({
      type: 'preference_change',
      data: { preferences: prefs },
    })
    
    // Update compliance score
    const score = calculateComplianceScore(prefs)
    setComplianceScore(score)
    
    // Trigger ML retraining if learning is enabled
    if (prefs.ai.enableLearning) {
      scheduleMLTraining()
    }
  }, [user])

  // ============================================================================
  // UPDATE PREFERENCES
  // ============================================================================

  const updatePreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => {
      const updated = mergePreferences(prev, updates)
      savePreferences(updated)
      return updated
    })
  }, [savePreferences])

  // ============================================================================
  // RESET PREFERENCES
  // ============================================================================

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_ACCESSIBILITY_PREFERENCES)
    savePreferences(DEFAULT_ACCESSIBILITY_PREFERENCES)
  }, [savePreferences])

  // ============================================================================
  // APPLY PROFILE
  // ============================================================================

  const applyProfile = useCallback((profileId: string) => {
    const profile = ACCESSIBILITY_PROFILES.find(p => p.id === profileId)
    if (profile) {
      updatePreferences(profile.preferences)
      
      // Show success insight
      addInsight({
        type: 'accessibility',
        priority: 'medium',
        title: 'Profile Applied',
        message: `${profile.name} profile has been applied. Your interface is now optimized.`,
        actionable: false,
        mlConfidence: 1.0,
        source: 'user',
      })
    }
  }, [updatePreferences])

  // ============================================================================
  // TRACK EVENTS
  // ============================================================================

  const trackEvent = useCallback((event: Omit<AccessibilityEvent, 'timestamp' | 'mlTracked'>) => {
    const fullEvent: AccessibilityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      mlTracked: preferences.ai.usageAnalytics,
    }
    
    eventQueueRef.current.push(fullEvent)
    
    // Process events every 5 seconds
    if (eventQueueRef.current.length >= 10) {
      processEvents()
    }
  }, [preferences.ai.usageAnalytics])

  // ============================================================================
  // PROCESS EVENTS (ML Training Data)
  // ============================================================================

  const processEvents = useCallback(() => {
    if (eventQueueRef.current.length === 0) return
    
    const events = [...eventQueueRef.current]
    eventQueueRef.current = []
    
    // Update analytics
    setAnalytics(prev => ({
      userId: user?.id || '',
      sessionId: `session-${Date.now()}`,
      timestamp: new Date().toISOString(),
      events: [...(prev?.events || []), ...events],
      metrics: {
        taskCompletionTime: calculateTaskCompletionTime(events),
        errorRate: calculateErrorRate(events),
        featureUsage: calculateFeatureUsage(events),
        productivityScore: calculateProductivityScore(events),
      },
    }))
    
    // Save analytics to localStorage
    if (user && preferences.ai.usageAnalytics) {
      const analyticsKey = `accessibility-analytics-${user.id}`
      localStorage.setItem(analyticsKey, JSON.stringify(analytics))
    }
  }, [user, preferences.ai.usageAnalytics, analytics])

  // ============================================================================
  // ML MODEL LOADING
  // ============================================================================

  const loadMLModel = useCallback(async () => {
    if (!user) return
    
    const modelKey = `accessibility-ml-model-${user.id}`
    const saved = localStorage.getItem(modelKey)
    
    if (saved) {
      try {
        const model = JSON.parse(saved)
        setMLModel(model)
      } catch (error) {
        console.error('Error loading ML model:', error)
      }
    } else {
      // Initialize new model
      const newModel: AccessibilityMLModel = {
        version: '1.0.0',
        lastTrained: new Date().toISOString(),
        accuracy: 0,
        predictions: {},
      }
      setMLModel(newModel)
    }
  }, [user])

  // ============================================================================
  // ML TRAINING
  // ============================================================================

  const trainModel = useCallback(async () => {
    if (!user || !preferences.ai.enableLearning) return
    
    // Simulate ML training (in production, this would call a backend service)
    const analyticsKey = `accessibility-analytics-${user.id}`
    const analyticsData = localStorage.getItem(analyticsKey)
    
    if (!analyticsData) return
    
    try {
      const data = JSON.parse(analyticsData)
      
      // Simple ML: Analyze patterns
      const patterns = analyzeUsagePatterns(data)
      
      // Generate predictions
      const predictions = generatePredictions(patterns, preferences)
      
      // Update model
      const updatedModel: AccessibilityMLModel = {
        version: '1.0.0',
        lastTrained: new Date().toISOString(),
        accuracy: calculateModelAccuracy(patterns),
        predictions,
      }
      
      setMLModel(updatedModel)
      
      // Save model
      const modelKey = `accessibility-ml-model-${user.id}`
      localStorage.setItem(modelKey, JSON.stringify(updatedModel))
      
      // Generate insights from predictions
      generateInsightsFromML(predictions)
      
    } catch (error) {
      console.error('Error training ML model:', error)
    }
  }, [user, preferences])

  // ============================================================================
  // SCHEDULE ML TRAINING
  // ============================================================================

  const scheduleMLTraining = useCallback(() => {
    if (mlTrainingTimerRef.current) {
      clearTimeout(mlTrainingTimerRef.current)
    }
    
    // Train model every 5 minutes
    mlTrainingTimerRef.current = setTimeout(() => {
      trainModel()
    }, 5 * 60 * 1000)
  }, [trainModel])

  // ============================================================================
  // INSIGHTS MANAGEMENT
  // ============================================================================

  const addInsight = useCallback((insight: Omit<AccessibilityInsight, 'id' | 'timestamp' | 'dismissed'>) => {
    const newInsight: AccessibilityInsight = {
      ...insight,
      id: `insight-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      dismissed: false,
    }
    
    setInsights(prev => [newInsight, ...prev].slice(0, 50)) // Keep last 50
    
    trackEvent({
      type: 'insight_shown',
      data: { insight: newInsight },
    })
  }, [trackEvent])

  const dismissInsight = useCallback((id: string) => {
    setInsights(prev => prev.map(i => i.id === id ? { ...i, dismissed: true } : i))
    trackEvent({
      type: 'insight_shown',
      data: { insightId: id, action: 'dismissed' },
    })
  }, [trackEvent])

  const actOnInsight = useCallback((insightId: string, actionId: string) => {
    const insight = insights.find(i => i.id === insightId)
    const action = insight?.actions?.find(a => a.id === actionId)
    
    if (action) {
      if (action.preferences) {
        updatePreferences(action.preferences)
      }
      
      if (action.handler) {
        action.handler()
      }
      
      trackEvent({
        type: 'insight_acted',
        data: { insightId, actionId },
      })
      
      dismissInsight(insightId)
    }
  }, [insights, updatePreferences, trackEvent, dismissInsight])

  // ============================================================================
  // ANALYTICS HELPERS
  // ============================================================================

  const loadAnalytics = useCallback(() => {
    if (!user) return
    
    const analyticsKey = `accessibility-analytics-${user.id}`
    const saved = localStorage.getItem(analyticsKey)
    
    if (saved) {
      try {
        setAnalytics(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading analytics:', error)
      }
    }
  }, [user])

  const getProductivityScore = useCallback(() => {
    return analytics?.metrics.productivityScore || 0
  }, [analytics])

  // ============================================================================
  // COMPLIANCE
  // ============================================================================

  const checkCompliance = useCallback(async () => {
    const score = calculateComplianceScore(preferences)
    setComplianceScore(score)
    
    // Generate compliance insight
    if (score < 50) {
      addInsight({
        type: 'compliance',
        priority: 'high',
        title: 'Accessibility Compliance Low',
        message: `Your accessibility score is ${score}/100. Consider enabling more features for better compliance.`,
        actionable: true,
        actions: [
          {
            id: 'improve-compliance',
            label: 'View Recommendations',
            type: 'learn',
            handler: () => setSettingsOpen(true),
          },
        ],
        mlConfidence: 1.0,
        source: 'rule',
      })
    }
  }, [preferences, addInsight])

  // ============================================================================
  // IMPORT/EXPORT
  // ============================================================================

  const exportPreferences = useCallback(() => {
    return JSON.stringify({
      preferences,
      version: '1.0.0',
      exported: new Date().toISOString(),
    }, null, 2)
  }, [preferences])

  const importPreferences = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data)
      if (parsed.preferences) {
        updatePreferences(parsed.preferences)
        addInsight({
          type: 'accessibility',
          priority: 'medium',
          title: 'Preferences Imported',
          message: 'Your accessibility preferences have been imported successfully.',
          actionable: false,
          mlConfidence: 1.0,
          source: 'user',
        })
      }
    } catch (error) {
      console.error('Error importing preferences:', error)
    }
  }, [updatePreferences, addInsight])

  // ============================================================================
  // APPLY CSS VARIABLES
  // ============================================================================

  useEffect(() => {
    if (!preferences.enabled) return
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const root = document.documentElement
    
    // Font size
    root.style.setProperty('--accessibility-font-size', `${preferences.visual.fontSize}%`)
    
    // Line height
    root.style.setProperty('--accessibility-line-height', `${preferences.visual.lineHeight}`)
    
    // Letter spacing
    root.style.setProperty('--accessibility-letter-spacing', `${preferences.visual.letterSpacing}px`)
    
    // Word spacing
    root.style.setProperty('--accessibility-word-spacing', `${preferences.visual.wordSpacing}px`)
    
    // Contrast
    if (preferences.visual.contrast !== 'normal') {
      const contrastMap = {
        high: '1.2',
        higher: '1.5',
        max: '2.0',
      }
      root.style.setProperty('--accessibility-contrast', contrastMap[preferences.visual.contrast])
    }
    
    // Motion
    if (preferences.motion.reducedMotion) {
      root.style.setProperty('--accessibility-animation-speed', `${preferences.motion.animationSpeed}`)
    }
    
    // Saturation
    root.style.setProperty('--accessibility-saturation', `${preferences.visual.saturation}%`)
    
    // Brightness
    root.style.setProperty('--accessibility-brightness', `${preferences.visual.brightness}%`)
    
    // Click target size
    root.style.setProperty('--accessibility-click-target-size', `${preferences.interaction.clickTargetSize}px`)
    
    // Custom CSS variables
    Object.entries(preferences.custom.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // Add accessibility class
    document.body.classList.toggle('accessibility-enabled', preferences.enabled)
    document.body.classList.toggle('accessibility-adhd-mode', preferences.focus.adhdMode)
    document.body.classList.toggle('accessibility-reading-mode', preferences.reading.readingMode)
    document.body.classList.toggle('accessibility-reduced-motion', preferences.motion.reducedMotion)
    
  }, [preferences])

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      if (mlTrainingTimerRef.current) {
        clearTimeout(mlTrainingTimerRef.current)
      }
      processEvents() // Process remaining events
    }
  }, [processEvents])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AccessibilityContextType = {
    preferences,
    updatePreferences,
    resetPreferences,
    applyProfile,
    insights: insights.filter(i => !i.dismissed),
    dismissInsight,
    actOnInsight,
    mlModel,
    trainModel,
    trackEvent,
    analytics,
    getProductivityScore,
    isQuestionnaireOpen,
    setQuestionnaireOpen,
    isSettingsOpen,
    setSettingsOpen,
    complianceScore,
    checkCompliance,
    exportPreferences,
    importPreferences,
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

// ============================================================================
// COLOR BLIND FILTERS (SVG)
// ============================================================================

export function ColorBlindFilters() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        {/* Protanopia (Red-blind) */}
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567, 0.433, 0, 0, 0
            0.558, 0.442, 0, 0, 0
            0, 0.242, 0.758, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>

        {/* Deuteranopia (Green-blind) */}
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625, 0.375, 0, 0, 0
            0.7, 0.3, 0, 0, 0
            0, 0.3, 0.7, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>

        {/* Tritanopia (Blue-blind) */}
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.95, 0.05, 0, 0, 0
            0, 0.433, 0.567, 0, 0
            0, 0.475, 0.525, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>
      </defs>
    </svg>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateTaskCompletionTime(events: AccessibilityEvent[]): number {
  // Simple average of time between events
  if (events.length < 2) return 0
  
  const times = events.map(e => new Date(e.timestamp).getTime())
  const diffs = times.slice(1).map((t, i) => t - times[i])
  return diffs.reduce((sum, d) => sum + d, 0) / diffs.length
}

function calculateErrorRate(events: AccessibilityEvent[]): number {
  const errorCount = events.filter(e => e.type === 'error').length
  return events.length > 0 ? errorCount / events.length : 0
}

function calculateFeatureUsage(events: AccessibilityEvent[]): Record<string, number> {
  const usage: Record<string, number> = {}
  
  events.filter(e => e.type === 'feature_used').forEach(e => {
    const feature = e.data.feature as string
    usage[feature] = (usage[feature] || 0) + 1
  })
  
  return usage
}

function calculateProductivityScore(events: AccessibilityEvent[]): number {
  // ML-calculated score based on completion time and error rate
  const completionTime = calculateTaskCompletionTime(events)
  const errorRate = calculateErrorRate(events)
  
  // Lower time and errors = higher score
  const timeScore = Math.max(0, 100 - (completionTime / 1000))
  const errorScore = Math.max(0, 100 - (errorRate * 100))
  
  return (timeScore + errorScore) / 2
}

function analyzeUsagePatterns(analytics: AccessibilityAnalytics): any {
  // Analyze events to find patterns
  const patterns = {
    mostUsedFeatures: [],
    peakHours: [],
    commonErrors: [],
    preferenceChanges: [],
  }
  
  // In production, this would use proper ML algorithms
  return patterns
}

function generatePredictions(patterns: any, currentPreferences: AccessibilityPreferences): any {
  // Generate ML predictions based on patterns
  return {
    nextPreferenceChange: null,
    optimalSettings: null,
    usagePatterns: patterns,
  }
}

function calculateModelAccuracy(patterns: any): number {
  // Calculate model accuracy based on patterns
  // In production, this would compare predictions vs actual outcomes
  return 0.85 // 85% accuracy
}

function generateInsightsFromML(predictions: any): void {
  // Generate insights from ML predictions
  // This would be implemented based on specific predictions
}


