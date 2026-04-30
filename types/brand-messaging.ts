/**
 * BlueDXP Brand Messaging Engine - Type Definitions
 * On-brand, bilingual messaging generation system
 */

// ============================================================================
// BRAND VOICE & TONE
// ============================================================================

export type BrandTone = 
  | 'philosophical'  // Headers, wisdom quotes
  | 'practical'      // Descriptions, instructions
  | 'confident'      // Success messages, confirmations
  | 'dignified'      // Error messages, acknowledgments
  | 'optimistic'     // Empty states, onboarding
  | 'intelligent'    // Loading states, processing

export interface BrandVoice {
  principles: string[]
  philosophy: string[]
  wordsToUse: string[]
  wordsToAvoid: string[]
  toneCalibration: Record<BrandTone, string>
}

// ============================================================================
// MESSAGING CONTEXT
// ============================================================================

export interface MessagingContext {
  moduleId?: string
  moduleName?: string
  featureId?: string
  featureName?: string
  userRole?: string
  action?: string
  entityType?: string
  entityId?: string
  language: 'en' | 'ar' | 'both'
  tone?: BrandTone
  urgency?: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

// ============================================================================
// MESSAGING TYPES
// ============================================================================

export type MessagingType =
  | 'module_header'
  | 'module_description'
  | 'feature_header'
  | 'feature_description'
  | 'empty_state'
  | 'loading_state'
  | 'success_message'
  | 'error_message'
  | 'notification'
  | 'button_label'
  | 'tooltip'
  | 'dashboard_wisdom'
  | 'onboarding_step'
  | 'confirmation_dialog'
  | 'section_header'
  | 'welcome_message'
  | 'completion_message'

// ============================================================================
// BRAND MESSAGE
// ============================================================================

export interface BrandMessage {
  id: string
  type: MessagingType
  context: MessagingContext
  content: {
    en: string
    ar: string
    transliteration?: string
    backTranslation?: string
  }
  metadata?: {
    generatedAt: Date
    generatedBy: 'llm' | 'template' | 'cache' | 'manual'
    promptVersion?: string
    qualityScore?: number
    cacheKey?: string
    generationTime?: number
  }
}

// ============================================================================
// LLM PROMPT CONFIGURATION
// ============================================================================

export interface LLMPromptConfig {
  includeBrandContext?: boolean
  includeSaudiContext?: boolean
  includeModuleContext?: boolean
  temperature?: number
  maxTokens?: number
  model?: string
  systemPromptOverride?: string
}

// ============================================================================
// MESSAGING GENERATION REQUEST
// ============================================================================

export interface MessagingGenerationRequest {
  type: MessagingType
  context: MessagingContext
  promptConfig?: LLMPromptConfig
  useCache?: boolean
  qualityCheck?: boolean
  regenerate?: boolean
}

// ============================================================================
// MESSAGING TEMPLATES
// ============================================================================

export interface MessagingTemplate {
  id: string
  type: MessagingType
  pattern: {
    en: string
    ar: string
  }
  variables: string[]
  examples: {
    en: string[]
    ar: string[]
  }
  tone: BrandTone
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

export interface BatchGenerationRequest {
  items: Array<{
    type: MessagingType
    context: MessagingContext
  }>
  consistencyCheck?: boolean
  format?: 'table' | 'json' | 'structured'
  parallel?: boolean
}

export interface BatchGenerationResult {
  messages: BrandMessage[]
  consistencyScore?: number
  generationTime: number
  errors?: Array<{ item: number; error: string }>
}

// ============================================================================
// QUALITY METRICS
// ============================================================================

export interface MessagingQuality {
  voiceCheck: {
    soundsLikeBlueDXP: boolean
    confidentNotArrogant: boolean
    avoidsBannedWords: boolean
    quotable: boolean
    score: number
  }
  clarityCheck: {
    firstTimeUserUnderstands: boolean
    specificToAction: boolean
    avoidsJargon: boolean
    minimumWords: boolean
    score: number
  }
  emotionalCheck: {
    respectsIntelligence: boolean
    feelsHuman: boolean
    maintainsDignity: boolean
    acknowledgesWork: boolean
    score: number
  }
  culturalCheck: {
    worksForMENA: boolean
    appropriateForBusiness: boolean
    arabicFeelsNative: boolean
    avoidsWesternAssumptions: boolean
    score: number
  }
  overallScore: number // 0-100
  recommendations?: string[]
}

// ============================================================================
// MESSAGE ANALYTICS
// ============================================================================

export interface MessageAnalytics {
  messageId: string
  views: number
  usageCount: number
  lastUsed?: Date
  userFeedback?: {
    positive: number
    negative: number
    suggestions: string[]
  }
  performance?: {
    loadTime: number
    cacheHitRate: number
  }
}

// ============================================================================
// MESSAGE LIBRARY
// ============================================================================

export interface MessageLibrary {
  id: string
  name: string
  description: string
  messages: BrandMessage[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface MessagingGenerationResponse {
  success: boolean
  data?: BrandMessage
  error?: string
  quality?: MessagingQuality
  alternatives?: BrandMessage[]
}

export interface BatchGenerationResponse {
  success: boolean
  data?: BatchGenerationResult
  error?: string
}











