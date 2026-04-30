/**
 * Workspace Module - Comprehensive Type Definitions
 * Intelligent User Workspace System for BlueDXP Platform
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type WidgetType =
  | 'METRIC_CARD'
  | 'LINE_CHART'
  | 'BAR_CHART'
  | 'PIE_CHART'
  | 'AREA_CHART'
  | 'SCATTER_CHART'
  | 'HEATMAP'
  | 'GAUGE'
  | 'PROGRESS_BAR'
  | 'KPI_CARD'
  | 'TABLE'
  | 'TIMELINE'
  | 'MAP'
  | '3D_VISUALIZATION'
  | 'REAL_TIME_METRIC'
  | 'ALERT_PANEL'
  | 'TASK_LIST'
  | 'CALENDAR'
  | 'FORECAST'
  | 'TREND_ANALYSIS'
  | 'COMPARISON'
  | 'DISTRIBUTION'
  | 'CORRELATION'
  | 'ANOMALY_DETECTION'
  | 'PREDICTIVE_INSIGHT'
  | 'AI_RECOMMENDATION'
  | 'WORKFLOW_STATUS'
  | 'RESOURCE_UTILIZATION'
  | 'PERFORMANCE_MATRIX'
  | 'RISK_ASSESSMENT'
  | 'COMPLIANCE_SCORE'
  | 'SUSTAINABILITY_METRICS'
  | 'COST_ANALYSIS'
  | 'REVENUE_TRACKING'
  | 'CUSTOMER_SATISFACTION'
  | 'EMPLOYEE_ENGAGEMENT'
  | 'SUPPLY_CHAIN_STATUS'
  | 'QUALITY_METRICS'
  | 'SAFETY_METRICS'
  | 'ENVIRONMENTAL_METRICS'
  | 'TRAINING_COMPLIANCE'
  | 'INCIDENT_TRACKING'
  | 'AUDIT_STATUS'
  | 'FEED'
  | 'DOCUMENT_MANAGEMENT'
  | 'KNOWLEDGE_BASE'
  | 'AGENT_STATUS'
  | 'IOT_DEVICE_STATUS'
  | 'NETWORK_TOPOLOGY'
  | 'EDGE_AI_STATUS'
  | 'DATA_QUALITY'
  | 'API_HEALTH'
  | 'SYSTEM_MONITORING'
  | 'VISION_METRICS'
  | 'VISION_ANALYTICS'
  | 'VISION_ALERTS'
  | 'VISION_QUALITY_SCORE'
  | 'VISION_COMPLIANCE'
  | 'VISION_ANOMALY_TRENDS'
  | 'VISION_TOP_ISSUES'
  | 'VISION_MODULE_BREAKDOWN'
  | 'VISION_INDUSTRY_BREAKDOWN'
  | 'VISION_PROCESSING_TIME'
  | 'VISION_SUCCESS_RATE'
  | 'STATUS_GRID'
  | 'CUSTOM'
  | 'GOOGLE_CALENDAR'
  | 'GOOGLE_DRIVE'
  | 'GMAIL'
  | 'GOOGLE_TASKS'
  | 'EMAIL_INBOX'
  | 'LINKEDIN_FEED'
  | 'TELEGRAM_MESSAGES'
  | 'WHATSAPP_MESSAGES'
  | 'NEWS_FEED'

export type WidgetCategoryName =
  | 'METRICS'
  | 'ANALYTICS'
  | 'OPERATIONS'
  | 'COMPLIANCE'
  | 'SAFETY'
  | 'ENVIRONMENTAL'
  | 'QUALITY'
  | 'FINANCIAL'
  | 'HUMAN_RESOURCES'
  | 'SUPPLY_CHAIN'
  | 'IOT'
  | 'AI_ML'
  | 'SYSTEM'
  | 'CUSTOM'

export type DataSourceType = 'API' | 'QUERY' | 'CALCULATION' | 'REAL_TIME' | 'AI_GENERATED'

export type EmailProvider = 'GMAIL' | 'IMAP' | 'POP3' | 'OUTLOOK' | 'CUSTOM_SMTP'

export type WorkspaceEventType =
  | 'widget_viewed'
  | 'widget_clicked'
  | 'widget_added'
  | 'widget_removed'
  | 'widget_resized'
  | 'widget_moved'
  | 'layout_changed'
  | 'layout_saved'
  | 'layout_loaded'
  | 'layout_deleted'
  | 'integration_connected'
  | 'integration_disconnected'

// ============================================================================
// WIDGET CATEGORY
// ============================================================================

export interface WidgetCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  order: number
  isSystem: boolean
  tenantId?: string
  createdBy?: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateWidgetCategoryInput {
  name: string
  description?: string
  icon?: string
  color?: string
  order?: number
  tenantId?: string
  createdBy?: string
}

export interface UpdateWidgetCategoryInput {
  name?: string
  description?: string
  icon?: string
  color?: string
  order?: number
}

// ============================================================================
// WIDGET DEFINITION
// ============================================================================

export interface WidgetSize {
  width: number // Grid units (1-12)
  height: number // Grid units
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export interface WidgetDataSource {
  type: DataSourceType
  endpoint?: string
  query?: string
  calculation?: string
  refreshInterval?: number // Milliseconds
}

export interface WidgetConfigOptions {
  title?: boolean
  colors?: boolean
  thresholds?: boolean
  filters?: boolean
  dateRange?: boolean
  aggregation?: boolean
  [key: string]: any
}

export interface WidgetDefinition {
  id: string
  name: string
  description: string
  type: WidgetType
  categoryId: string
  icon: string
  defaultSize: WidgetSize
  dataSource: WidgetDataSource
  configurable: boolean
  configOptions?: WidgetConfigOptions
  requiredPermissions?: string[]
  moduleId?: string
  tags: string[]
  preview?: string
  isActive: boolean
  order: number
  tenantId?: string
  createdBy?: string
  createdAt: Date | string
  updatedAt: Date | string
  category?: WidgetCategory
}

export interface CreateWidgetDefinitionInput {
  name: string
  description: string
  type: WidgetType
  categoryId: string
  icon: string
  defaultSize: WidgetSize
  dataSource: WidgetDataSource
  configurable?: boolean
  configOptions?: WidgetConfigOptions
  requiredPermissions?: string[]
  moduleId?: string
  tags?: string[]
  preview?: string
  order?: number
  tenantId?: string
  createdBy?: string
}

export interface UpdateWidgetDefinitionInput {
  name?: string
  description?: string
  type?: WidgetType
  categoryId?: string
  icon?: string
  defaultSize?: WidgetSize
  dataSource?: WidgetDataSource
  configurable?: boolean
  configOptions?: WidgetConfigOptions
  requiredPermissions?: string[]
  moduleId?: string
  tags?: string[]
  preview?: string
  isActive?: boolean
  order?: number
}

// ============================================================================
// WIDGET POSITION & CONFIG
// ============================================================================

export interface WidgetPosition {
  x: number // Grid column
  y: number // Grid row
  w: number // Width in grid units
  h: number // Height in grid units
}

export interface WidgetConfig {
  title?: string
  colors?: Record<string, string>
  thresholds?: {
    min?: number
    max?: number
    warning?: number
    critical?: number
  }
  filters?: Record<string, any>
  dateRange?: {
    start?: Date | string
    end?: Date | string
  }
  aggregation?: string
  [key: string]: any
}

// ============================================================================
// USER WIDGET
// ============================================================================

export interface UserWidget {
  id: string
  userId: string
  tenantId: string
  widgetDefId: string
  layoutId?: string
  position: WidgetPosition
  config: WidgetConfig
  refreshInterval?: number
  isVisible: boolean
  isCollapsed: boolean
  order: number
  createdAt: Date | string
  updatedAt: Date | string
  widgetDef?: WidgetDefinition
}

export interface CreateUserWidgetInput {
  widgetDefId: string
  layoutId?: string
  position: WidgetPosition
  config?: WidgetConfig
  refreshInterval?: number
  isVisible?: boolean
  isCollapsed?: boolean
  order?: number
}

export interface UpdateUserWidgetInput {
  position?: WidgetPosition
  config?: WidgetConfig
  refreshInterval?: number
  isVisible?: boolean
  isCollapsed?: boolean
  order?: number
}

// ============================================================================
// WORKSPACE LAYOUT
// ============================================================================

export interface WorkspaceLayout {
  id: string
  userId: string
  tenantId: string
  name: string
  description?: string
  widgets: UserWidget[] // Array of widget instances
  isDefault: boolean
  isTemplate: boolean
  category?: string
  metadata?: {
    createdBy?: string
    version?: string
    tags?: string[]
    [key: string]: any
  }
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateWorkspaceLayoutInput {
  name: string
  description?: string
  widgets?: CreateUserWidgetInput[]
  isDefault?: boolean
  isTemplate?: boolean
  category?: string
  metadata?: Record<string, any>
}

export interface UpdateWorkspaceLayoutInput {
  name?: string
  description?: string
  widgets?: (CreateUserWidgetInput | UpdateUserWidgetInput)[]
  isDefault?: boolean
  isTemplate?: boolean
  category?: string
  metadata?: Record<string, any>
}

export interface LayoutTemplate {
  id: string
  name: string
  description: string
  category: string
  widgets: Omit<CreateUserWidgetInput, 'layoutId'>[]
  userRole?: string[]
  modules?: string[]
  isDefault?: boolean
}

// ============================================================================
// WORKSPACE CONFIG
// ============================================================================

export interface WorkspaceConfig {
  userId: string
  tenantId: string
  role: string
  subscriptionTier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM'
  defaultLayout?: WorkspaceLayout
  availableWidgets: WidgetDefinition[]
  availableCategories: WidgetCategory[]
  permissions: {
    canCreateWidgets: boolean
    canCreateCategories: boolean
    canShareLayouts: boolean
    canUseTemplates: boolean
  }
  integrations: {
    googleWorkspace?: GoogleWorkspaceIntegration
    email?: EmailIntegration[]
  }
  personalization: {
    enabled: boolean
    recommendations: PersonalizationInsight[]
  }
}

// ============================================================================
// GOOGLE WORKSPACE INTEGRATION
// ============================================================================

export interface GoogleWorkspaceIntegration {
  id: string
  userId: string
  tenantId: string
  accessToken: string // Encrypted
  refreshToken: string // Encrypted
  tokenExpiresAt: Date | string
  scopes: string[]
  calendarEnabled: boolean
  driveEnabled: boolean
  gmailEnabled: boolean
  tasksEnabled: boolean
  contactsEnabled: boolean
  lastSyncedAt?: Date | string
  syncInterval: number
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface GoogleWorkspaceSyncResult {
  calendar?: {
    events: number
    lastSync: Date | string
  }
  drive?: {
    files: number
    lastSync: Date | string
  }
  gmail?: {
    emails: number
    lastSync: Date | string
  }
  tasks?: {
    tasks: number
    lastSync: Date | string
  }
  contacts?: {
    contacts: number
    lastSync: Date | string
  }
}

// ============================================================================
// EMAIL INTEGRATION
// ============================================================================

export interface EmailIntegration {
  id: string
  userId: string
  tenantId: string
  provider: EmailProvider
  email: string
  encryptedPassword?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date | string
  server?: string
  port?: number
  useSSL: boolean
  folder?: string
  syncInterval: number
  lastSyncedAt?: Date | string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface EmailAccount {
  id: string
  email: string
  provider: EmailProvider
  unreadCount: number
  lastSyncedAt?: Date | string
  isActive: boolean
}

export interface EmailMessage {
  id: string
  accountId: string
  subject: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  body: string
  htmlBody?: string
  attachments?: Array<{
    name: string
    size: number
    type: string
    url?: string
  }>
  receivedAt: Date | string
  read: boolean
  starred: boolean
  labels?: string[]
  category?: 'IMPORTANT' | 'WORK' | 'PERSONAL' | 'PLATFORM'
}

// ============================================================================
// WORKSPACE ANALYTICS
// ============================================================================

export interface WorkspaceAnalytics {
  id: string
  userId: string
  tenantId: string
  eventType: WorkspaceEventType
  widgetId?: string
  layoutId?: string
  metadata?: Record<string, any>
  timestamp: Date | string
}

export interface WorkspaceUsageStats {
  totalWidgetViews: number
  totalLayoutChanges: number
  mostUsedWidgets: Array<{
    widgetId: string
    widgetName: string
    views: number
  }>
  mostUsedLayouts: Array<{
    layoutId: string
    layoutName: string
    usage: number
  }>
  averageSessionTime: number
  peakUsageHours: number[]
}

// ============================================================================
// PERSONALIZATION
// ============================================================================

export interface PersonalizationInsight {
  id: string
  type: 'RECOMMENDATION' | 'OPTIMIZATION' | 'TREND' | 'ALERT'
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  action?: {
    type: string
    label: string
    data?: Record<string, any>
  }
  metadata?: Record<string, any>
  createdAt: Date | string
}

export interface UserBehaviorPattern {
  userId: string
  frequentWidgets: string[]
  peakUsageHours: number[]
  preferredLayouts: string[]
  averageSessionDuration: number
  mostActiveDays: string[]
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GetWidgetsQuery {
  categoryId?: string
  moduleId?: string
  search?: string
  tags?: string[]
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface GetLayoutsQuery {
  category?: string
  isTemplate?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface WidgetDataRequest {
  widgetId: string
  config?: WidgetConfig
  context?: {
    customerId?: string
    warehouseId?: string
    dateRange?: {
      start: Date | string
      end: Date | string
    }
    [key: string]: any
  }
}

export interface WidgetDataResponse {
  widgetId: string
  data: any
  lastUpdated: Date | string
  nextRefresh?: Date | string
  error?: string
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  WidgetCategory,
  WidgetDefinition,
  UserWidget,
  WorkspaceLayout,
  WorkspaceConfig,
  GoogleWorkspaceIntegration,
  EmailIntegration,
  WorkspaceAnalytics,
  PersonalizationInsight,
}













