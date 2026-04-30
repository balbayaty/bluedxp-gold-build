/**
 * External Integrations Types
 * Comprehensive type definitions for LinkedIn, Telegram, WhatsApp, News Sites, and Generic Site integrations
 */

export type IntegrationType = 
  | 'LINKEDIN'
  | 'TELEGRAM'
  | 'WHATSAPP'
  | 'NEWS_SITE'
  | 'GENERIC_SITE'
  | 'RSS_FEED'
  | 'API_INTEGRATION'
  | 'IFRAME_EMBED'

export type IntegrationStatus = 
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'PENDING'
  | 'ERROR'
  | 'EXPIRED'

export type IntegrationDisplayMode = 
  | 'WIDGET'           // Display as dashboard widget
  | 'IFRAME'           // Embed as iframe
  | 'NOTIFICATION'     // Show as notifications only
  | 'SIDEBAR'          // Display in sidebar
  | 'TAB'              // Display as tab in dashboard

/**
 * Base Integration Configuration
 */
export interface BaseIntegration {
  id: string
  type: IntegrationType
  name: string
  description?: string
  status: IntegrationStatus
  tenantId: string
  userId?: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  lastSyncAt?: Date
  config: Record<string, any>
  metadata?: Record<string, any>
}

/**
 * LinkedIn Integration
 */
export interface LinkedInIntegration extends BaseIntegration {
  type: 'LINKEDIN'
  config: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: Date
    clientId?: string
    clientSecret?: string
    redirectUri?: string
    scopes?: string[]
    profileId?: string
    companyId?: string
  }
  metadata?: {
    profile?: LinkedInProfile
    company?: LinkedInCompany
    connectionCount?: number
  }
}

export interface LinkedInProfile {
  id: string
  firstName: string
  lastName: string
  headline?: string
  profilePicture?: string
  email?: string
  location?: string
}

export interface LinkedInCompany {
  id: string
  name: string
  logo?: string
  industry?: string
  employeeCount?: number
}

export interface LinkedInPost {
  id: string
  text: string
  author: string
  timestamp: Date
  likes?: number
  comments?: number
  shares?: number
  url?: string
}

/**
 * Telegram Integration
 */
export interface TelegramIntegration extends BaseIntegration {
  type: 'TELEGRAM'
  config: {
    botToken?: string
    botUsername?: string
    chatId?: string
    webhookUrl?: string
    webhookSecret?: string
    enabled?: boolean
  }
  metadata?: {
    botInfo?: TelegramBotInfo
    chatInfo?: TelegramChatInfo
    messageCount?: number
  }
}

export interface TelegramBotInfo {
  id: number
  username: string
  firstName: string
  canJoinGroups?: boolean
  canReadAllGroupMessages?: boolean
}

export interface TelegramChatInfo {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  memberCount?: number
}

export interface TelegramMessage {
  id: number
  chatId: number
  text?: string
  from?: {
    id: number
    firstName: string
    username?: string
  }
  timestamp: Date
  mediaType?: 'photo' | 'video' | 'document' | 'audio'
  mediaUrl?: string
}

/**
 * WhatsApp Integration (Enhanced)
 */
export interface WhatsAppIntegration extends BaseIntegration {
  type: 'WHATSAPP'
  config: {
    provider?: 'WHATSAPP_BUSINESS' | 'TWILIO' | 'META_CLOUD_API' | 'CUSTOM'
    apiKey?: string
    apiSecret?: string
    phoneNumberId?: string
    businessAccountId?: string
    webhookUrl?: string
    webhookSecret?: string
    enabled?: boolean
  }
  metadata?: {
    phoneNumber?: string
    messageCount?: number
    lastMessageAt?: Date
  }
}

/**
 * News Site Integration
 */
export interface NewsSiteIntegration extends BaseIntegration {
  type: 'NEWS_SITE' | 'RSS_FEED'
  config: {
    url: string
    feedUrl?: string
    apiKey?: string
    refreshInterval?: number // in seconds
    maxArticles?: number
    filters?: {
      keywords?: string[]
      categories?: string[]
      dateRange?: {
        start?: Date
        end?: Date
      }
    }
    scrapingConfig?: {
      enabled: boolean
      articleSelector?: string
      titleSelector?: string
      contentSelector?: string
      dateSelector?: string
    }
  }
  metadata?: {
    articleCount?: number
    lastArticleDate?: Date
    sourceName?: string
    sourceLogo?: string
  }
}

export interface NewsArticle {
  id: string
  title: string
  content: string
  summary?: string
  author?: string
  publishedAt: Date
  url: string
  imageUrl?: string
  category?: string
  tags?: string[]
  source: string
}

/**
 * Generic Site Integration
 */
export interface GenericSiteIntegration extends BaseIntegration {
  type: 'GENERIC_SITE' | 'IFRAME_EMBED' | 'API_INTEGRATION'
  config: {
    url: string
    mode: 'IFRAME' | 'API' | 'SCRAPING'
    apiConfig?: {
      baseUrl: string
      apiKey?: string
      apiSecret?: string
      authType?: 'API_KEY' | 'OAUTH2' | 'BASIC' | 'BEARER'
      endpoints?: Record<string, string>
    }
    iframeConfig?: {
      allowFullscreen?: boolean
      sandbox?: string[]
      width?: string
      height?: string
    }
    scrapingConfig?: {
      enabled: boolean
      selectors?: Record<string, string>
      refreshInterval?: number
    }
    displayMode?: IntegrationDisplayMode
  }
  metadata?: {
    siteName?: string
    siteIcon?: string
    lastSyncAt?: Date
  }
}

/**
 * Integration Widget Configuration
 */
export interface IntegrationWidget {
  id: string
  integrationId: string
  type: IntegrationType
  widgetType: 'FEED' | 'MESSAGES' | 'NOTIFICATIONS' | 'METRICS' | 'CUSTOM'
  position: {
    x: number
    y: number
    w: number
    h: number
  }
  config: {
    title: string
    refreshInterval?: number
    maxItems?: number
    showHeader?: boolean
    showActions?: boolean
    filters?: Record<string, any>
  }
  enabled: boolean
}

/**
 * Integration Event
 */
export interface IntegrationEvent {
  id: string
  integrationId: string
  type: IntegrationType
  eventType: 'MESSAGE' | 'POST' | 'ARTICLE' | 'NOTIFICATION' | 'UPDATE' | 'ERROR'
  data: Record<string, any>
  timestamp: Date
  processed: boolean
}

/**
 * Integration Service Interface
 */
export interface IIntegrationService {
  connect(integration: Partial<BaseIntegration>): Promise<BaseIntegration>
  disconnect(integrationId: string): Promise<void>
  sync(integrationId: string): Promise<void>
  getStatus(integrationId: string): Promise<IntegrationStatus>
  getData(integrationId: string, options?: Record<string, any>): Promise<any>
  updateConfig(integrationId: string, config: Record<string, any>): Promise<BaseIntegration>
}

/**
 * Unified Integration Response
 */
export type IntegrationResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}













