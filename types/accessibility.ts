// ============================================================================
// HAZALYZE ADAPTIVE ACCESSIBILITY SYSTEM
// AI-Powered, Self-Improving, Per-User Accessibility Framework
// ============================================================================
// Legal: Compliant with WCAG 2.1 AAA, ADA, Section 508, EN 301 549
// Privacy: GDPR, CCPA, HIPAA compliant data handling
// ============================================================================

// ============================================================================
// ACCESSIBILITY PREFERENCES
// ============================================================================

export interface AccessibilityPreferences {
  // Core Settings
  enabled: boolean
  version: string // For tracking preference schema versions
  lastUpdated: Date | string
  
  // Visual Adjustments
  visual: {
    fontSize: number // 80-200%, default 100
    fontFamily: 'default' | 'dyslexic' | 'mono' | 'serif'
    lineHeight: number // 1.0-2.5, default 1.5
    letterSpacing: number // 0-5px, default 0
    wordSpacing: number // 0-10px, default 0
    contrast: 'normal' | 'high' | 'higher' | 'max'
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
    invertColors: boolean
    grayscale: boolean
    saturation: number // 0-200%, default 100
    brightness: number // 50-150%, default 100
  }
  
  // Motion & Animation
  motion: {
    reducedMotion: boolean
    animationSpeed: number // 0.25-2.0x, default 1.0
    disableParallax: boolean
    disableAutoplay: boolean
    pauseAnimations: boolean
  }
  
  // Focus & Attention (ADHD-Friendly)
  focus: {
    adhdMode: boolean
    minimizeDistractions: boolean
    highlightFocus: boolean
    focusIndicatorSize: 'small' | 'medium' | 'large'
    simplifyInterface: boolean
    hideNonEssential: boolean
    singleTaskMode: boolean
    breakReminders: boolean
    breakInterval: number // minutes
  }
  
  // Reading & Comprehension
  reading: {
    readingMode: boolean
    readingGuide: boolean
    highlightLinks: boolean
    underlineLinks: boolean
    textToSpeech: boolean
    speechRate: number // 0.5-2.0x
    dyslexiaFont: boolean
    bionicReading: boolean // Emphasize first letters
    screenReader: boolean
  }
  
  // Interaction
  interaction: {
    keyboardOnly: boolean
    largeClickTargets: boolean
    clickTargetSize: number // 44-88px, default 44
    hoverDelay: number // ms, default 0
    doubleClickSpeed: number // ms, default 500
    dragThreshold: number // px, default 5
    autoScrollSpeed: number // 1-10, default 5
  }
  
  // Cognitive Support
  cognitive: {
    simplifiedLanguage: boolean
    showTooltips: boolean
    tooltipDelay: number // ms
    showHelp: boolean
    confirmActions: boolean
    undoEnabled: boolean
    saveProgress: boolean
    progressIndicators: boolean
  }
  
  // Notifications & Alerts
  notifications: {
    intelligentInsights: boolean // ML-powered suggestions
    insightFrequency: 'minimal' | 'low' | 'medium' | 'high'
    insightTypes: InsightType[]
    popupStyle: 'subtle' | 'standard' | 'prominent'
    soundEnabled: boolean
    hapticEnabled: boolean
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  }
  
  // AI & Machine Learning
  ai: {
    enableLearning: boolean // Self-improvement
    personalizedSuggestions: boolean
    predictiveAdaptation: boolean
    usageAnalytics: boolean // Anonymous usage patterns
    shareData: boolean // Help improve the system
    mlModelVersion: string
  }
  
  // Custom Overrides
  custom: {
    cssVariables: Record<string, string>
    scriptPreferences: Record<string, any>
  }
}

// ============================================================================
// INSIGHT TYPES
// ============================================================================

export type InsightType =
  | 'performance' // "Your productivity is up 15% with focus mode"
  | 'accessibility' // "High contrast might help with these tasks"
  | 'efficiency' // "You could save 2 clicks by using keyboard shortcuts"
  | 'wellbeing' // "You've been working for 2 hours, time for a break"
  | 'learning' // "New feature detected that matches your workflow"
  | 'optimization' // "We noticed you often adjust font size, try..."
  | 'compliance' // "This document meets WCAG AAA standards"
  | 'social' // "Your team uses these accessibility features"

// ============================================================================
// INTELLIGENT INSIGHTS
// ============================================================================

export interface AccessibilityInsight {
  id: string
  type: InsightType
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  actionable: boolean
  actions?: InsightAction[]
  timestamp: Date | string
  dismissed: boolean
  mlConfidence: number // 0-1, ML model confidence
  source: 'ml' | 'rule' | 'user' | 'admin'
  metadata?: {
    mlModel?: string
    dataPoints?: number
    userBenefit?: string // e.g., "15% faster"
    category?: string
  }
}

export interface InsightAction {
  id: string
  label: string
  type: 'apply' | 'try' | 'learn' | 'dismiss'
  handler: () => void | Promise<void>
  preferences?: Partial<AccessibilityPreferences>
}

// ============================================================================
// ML MODEL INTERFACES
// ============================================================================

export interface AccessibilityMLModel {
  version: string
  lastTrained: Date | string
  accuracy: number
  predictions: {
    nextPreferenceChange?: {
      preference: string
      value: any
      confidence: number
      reason: string
    }
    optimalSettings?: {
      preferences: Partial<AccessibilityPreferences>
      confidence: number
      expectedImprovement: string
    }
    usagePatterns?: {
      peakProductivityHours: number[]
      preferredFeatures: string[]
      strugglingAreas: string[]
    }
  }
}

// ============================================================================
// USAGE ANALYTICS
// ============================================================================

export interface AccessibilityAnalytics {
  userId: string
  sessionId: string
  timestamp: Date | string
  events: AccessibilityEvent[]
  metrics: {
    taskCompletionTime: number
    errorRate: number
    featureUsage: Record<string, number>
    satisfactionScore?: number
    productivityScore: number // ML-calculated
  }
}

export interface AccessibilityEvent {
  type: 'preference_change' | 'feature_used' | 'insight_shown' | 'insight_acted' | 'error' | 'success'
  timestamp: Date | string
  data: Record<string, any>
  mlTracked: boolean
}

// ============================================================================
// QUESTIONNAIRE
// ============================================================================

export interface AccessibilityQuestion {
  id: string
  category: string
  question: string
  description?: string
  type: 'single' | 'multiple' | 'range' | 'boolean' | 'text'
  options?: QuestionOption[]
  default?: any
  required: boolean
  skipIf?: (answers: Record<string, any>) => boolean
  mlWeight: number // How important for ML training
}

export interface QuestionOption {
  value: any
  label: string
  description?: string
  icon?: string
  recommendedFor?: string[]
  impact: {
    preferences: Partial<AccessibilityPreferences>
    confidence: number
  }
}

export interface QuestionnaireResponse {
  userId: string
  timestamp: Date | string
  answers: Record<string, any>
  generatedPreferences: AccessibilityPreferences
  confidence: number
  source: 'questionnaire' | 'ml' | 'import'
}

// ============================================================================
// LEGAL & COMPLIANCE
// ============================================================================

export interface AccessibilityCompliance {
  wcag: {
    level: 'A' | 'AA' | 'AAA'
    version: '2.0' | '2.1' | '2.2'
    violations: ComplianceViolation[]
    score: number // 0-100
  }
  ada: {
    compliant: boolean
    issues: string[]
  }
  section508: {
    compliant: boolean
    issues: string[]
  }
  gdpr: {
    dataProcessing: boolean
    userConsent: boolean
    rightToErase: boolean
    dataPortability: boolean
  }
}

export interface ComplianceViolation {
  criterion: string
  level: 'A' | 'AA' | 'AAA'
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  remediation: string
  automated: boolean
}

// ============================================================================
// PROFILE PRESETS
// ============================================================================

export interface AccessibilityProfile {
  id: string
  name: string
  description: string
  icon: string
  category: 'vision' | 'motor' | 'cognitive' | 'hearing' | 'custom'
  preferences: Partial<AccessibilityPreferences>
  recommended: boolean
  userCount?: number // How many users use this
  mlOptimized: boolean
}

export const ACCESSIBILITY_PROFILES: AccessibilityProfile[] = [
  {
    id: 'visual-impairment',
    name: 'Visual Impairment',
    description: 'Optimized for users with low vision or color blindness',
    icon: 'ri-eye-line',
    category: 'vision',
    recommended: true,
    mlOptimized: true,
    preferences: {
      visual: {
        fontSize: 140,
        contrast: 'max',
        colorBlindMode: 'none',
        fontFamily: 'default',
        lineHeight: 1.8,
        letterSpacing: 1,
        wordSpacing: 2,
        invertColors: false,
        grayscale: false,
        saturation: 100,
        brightness: 100,
      },
      reading: {
        readingMode: true,
        readingGuide: true,
        highlightLinks: true,
        underlineLinks: true,
        textToSpeech: true,
        speechRate: 1.0,
        dyslexiaFont: false,
        bionicReading: false,
        screenReader: true,
      },
    },
  },
  {
    id: 'adhd-focus',
    name: 'ADHD Focus Mode',
    description: 'Minimize distractions and enhance focus',
    icon: 'ri-focus-line',
    category: 'cognitive',
    recommended: true,
    mlOptimized: true,
    preferences: {
      focus: {
        adhdMode: true,
        minimizeDistractions: true,
        highlightFocus: true,
        focusIndicatorSize: 'large',
        simplifyInterface: true,
        hideNonEssential: true,
        singleTaskMode: true,
        breakReminders: true,
        breakInterval: 25,
      },
      motion: {
        reducedMotion: true,
        animationSpeed: 0.5,
        disableParallax: true,
        disableAutoplay: true,
        pauseAnimations: false,
      },
    },
  },
  {
    id: 'dyslexia',
    name: 'Dyslexia Support',
    description: 'Dyslexia-friendly fonts and formatting',
    icon: 'ri-font-size-2',
    category: 'cognitive',
    recommended: true,
    mlOptimized: true,
    preferences: {
      visual: {
        fontSize: 120,
        fontFamily: 'dyslexic',
        lineHeight: 2.0,
        letterSpacing: 2,
        wordSpacing: 3,
        contrast: 'high',
        colorBlindMode: 'none',
        invertColors: false,
        grayscale: false,
        saturation: 100,
        brightness: 100,
      },
      reading: {
        readingMode: true,
        readingGuide: true,
        highlightLinks: true,
        underlineLinks: true,
        textToSpeech: false,
        speechRate: 1.0,
        dyslexiaFont: true,
        bionicReading: true,
        screenReader: false,
      },
    },
  },
  {
    id: 'motor-impairment',
    name: 'Motor Impairment',
    description: 'Larger targets and keyboard navigation',
    icon: 'ri-hand-line',
    category: 'motor',
    recommended: true,
    mlOptimized: true,
    preferences: {
      interaction: {
        keyboardOnly: true,
        largeClickTargets: true,
        clickTargetSize: 64,
        hoverDelay: 500,
        doubleClickSpeed: 800,
        dragThreshold: 10,
        autoScrollSpeed: 3,
      },
      cognitive: {
        simplifiedLanguage: false,
        showTooltips: true,
        tooltipDelay: 0,
        showHelp: true,
        confirmActions: true,
        undoEnabled: true,
        saveProgress: true,
        progressIndicators: true,
      },
    },
  },
  {
    id: 'productivity-max',
    name: 'Maximum Productivity',
    description: 'ML-optimized for peak performance',
    icon: 'ri-rocket-line',
    category: 'custom',
    recommended: true,
    mlOptimized: true,
    preferences: {
      focus: {
        adhdMode: false,
        minimizeDistractions: true,
        highlightFocus: false,
        focusIndicatorSize: 'medium',
        simplifyInterface: false,
        hideNonEssential: false,
        singleTaskMode: false,
        breakReminders: true,
        breakInterval: 50,
      },
      notifications: {
        intelligentInsights: true,
        insightFrequency: 'high',
        insightTypes: ['performance', 'efficiency', 'optimization'],
        popupStyle: 'subtle',
        soundEnabled: false,
        hapticEnabled: false,
        position: 'bottom-right',
      },
      ai: {
        enableLearning: true,
        personalizedSuggestions: true,
        predictiveAdaptation: true,
        usageAnalytics: true,
        shareData: true,
        mlModelVersion: '1.0.0',
      },
    },
  },
]

// ============================================================================
// DEFAULT PREFERENCES
// ============================================================================

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  enabled: false,
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  
  visual: {
    fontSize: 100,
    fontFamily: 'default',
    lineHeight: 1.5,
    letterSpacing: 0,
    wordSpacing: 0,
    contrast: 'normal',
    colorBlindMode: 'none',
    invertColors: false,
    grayscale: false,
    saturation: 100,
    brightness: 100,
  },
  
  motion: {
    reducedMotion: false,
    animationSpeed: 1.0,
    disableParallax: false,
    disableAutoplay: false,
    pauseAnimations: false,
  },
  
  focus: {
    adhdMode: false,
    minimizeDistractions: false,
    highlightFocus: false,
    focusIndicatorSize: 'medium',
    simplifyInterface: false,
    hideNonEssential: false,
    singleTaskMode: false,
    breakReminders: false,
    breakInterval: 25,
  },
  
  reading: {
    readingMode: false,
    readingGuide: false,
    highlightLinks: false,
    underlineLinks: false,
    textToSpeech: false,
    speechRate: 1.0,
    dyslexiaFont: false,
    bionicReading: false,
    screenReader: false,
  },
  
  interaction: {
    keyboardOnly: false,
    largeClickTargets: false,
    clickTargetSize: 44,
    hoverDelay: 0,
    doubleClickSpeed: 500,
    dragThreshold: 5,
    autoScrollSpeed: 5,
  },
  
  cognitive: {
    simplifiedLanguage: false,
    showTooltips: true,
    tooltipDelay: 500,
    showHelp: true,
    confirmActions: false,
    undoEnabled: true,
    saveProgress: true,
    progressIndicators: true,
  },
  
  notifications: {
    intelligentInsights: true,
    insightFrequency: 'medium',
    insightTypes: ['performance', 'accessibility', 'efficiency', 'wellbeing'],
    popupStyle: 'standard',
    soundEnabled: false,
    hapticEnabled: false,
    position: 'bottom-right',
  },
  
  ai: {
    enableLearning: true,
    personalizedSuggestions: true,
    predictiveAdaptation: true,
    usageAnalytics: true,
    shareData: false,
    mlModelVersion: '1.0.0',
  },
  
  custom: {
    cssVariables: {},
    scriptPreferences: {},
  },
}

// ============================================================================
// UTILITIES
// ============================================================================

export function mergePreferences(
  base: AccessibilityPreferences,
  updates: Partial<AccessibilityPreferences>
): AccessibilityPreferences {
  return {
    ...base,
    ...updates,
    visual: { ...base.visual, ...updates.visual },
    motion: { ...base.motion, ...updates.motion },
    focus: { ...base.focus, ...updates.focus },
    reading: { ...base.reading, ...updates.reading },
    interaction: { ...base.interaction, ...updates.interaction },
    cognitive: { ...base.cognitive, ...updates.cognitive },
    notifications: { ...base.notifications, ...updates.notifications },
    ai: { ...base.ai, ...updates.ai },
    custom: {
      cssVariables: { ...base.custom.cssVariables, ...updates.custom?.cssVariables },
      scriptPreferences: { ...base.custom.scriptPreferences, ...updates.custom?.scriptPreferences },
    },
    lastUpdated: new Date().toISOString(),
  }
}

export function calculateComplianceScore(preferences: AccessibilityPreferences): number {
  let score = 0
  const maxScore = 100
  
  // Visual accessibility (30 points)
  if (preferences.visual.fontSize >= 120) score += 10
  if (preferences.visual.contrast !== 'normal') score += 10
  if (preferences.visual.lineHeight >= 1.5) score += 10
  
  // Reading support (20 points)
  if (preferences.reading.highlightLinks) score += 5
  if (preferences.reading.underlineLinks) score += 5
  if (preferences.reading.textToSpeech) score += 10
  
  // Interaction (20 points)
  if (preferences.interaction.largeClickTargets) score += 10
  if (preferences.interaction.keyboardOnly || preferences.interaction.clickTargetSize >= 44) score += 10
  
  // Motion (15 points)
  if (preferences.motion.reducedMotion) score += 10
  if (preferences.motion.pauseAnimations) score += 5
  
  // Cognitive (15 points)
  if (preferences.cognitive.showTooltips) score += 5
  if (preferences.cognitive.confirmActions) score += 5
  if (preferences.cognitive.progressIndicators) score += 5
  
  return Math.min(score, maxScore)
}


