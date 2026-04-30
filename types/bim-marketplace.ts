/**
 * BIM Marketplace Types
 * 
 * Comprehensive types for BIM marketplace platform including:
 * - Professional services marketplace
 * - Model marketplace
 * - Collaboration features
 * - AI-powered analysis
 * - Digital twin integration
 * - AR/VR support
 * - Real-time collaboration
 */

// ============================================================================
// BIM MARKETPLACE CORE
// ============================================================================

export interface BIMMarketplaceListing {
  id: string
  type: 'model' | 'service' | 'professional' | 'tool' | 'template'
  title: string
  description: string
  category: BIMMarketplaceCategory
  subcategory?: string
  providerId: string
  providerName: string
  providerRating?: number
  providerVerified: boolean
  
  // Pricing
  pricing: BIMMarketplacePricing
  
  // Model-specific (if type === 'model')
  modelData?: BIMModelMarketplaceData
  
  // Service-specific (if type === 'service')
  serviceData?: BIMServiceMarketplaceData
  
  // Professional-specific (if type === 'professional')
  professionalData?: BIMProfessionalMarketplaceData
  
  // Tool-specific (if type === 'tool')
  toolData?: BIMToolMarketplaceData
  
  // Template-specific (if type === 'template')
  templateData?: BIMTemplateMarketplaceData
  
  // Marketplace metadata
  tags: string[]
  images: string[]
  videos?: string[]
  documentation?: string[]
  reviews: BIMMarketplaceReview[]
  averageRating: number
  reviewCount: number
  downloadCount?: number
  viewCount: number
  favoriteCount: number
  
  // Status
  status: 'draft' | 'published' | 'archived' | 'suspended'
  featured: boolean
  verified: boolean
  
  // Location
  location?: {
    country?: string
    region?: string
    city?: string
    coordinates?: { lat: number; lng: number }
  }
  
  // Availability
  availability: 'available' | 'limited' | 'unavailable'
  availableUntil?: Date
  
  // Integration
  compatibleSoftware: string[]
  compatibleFormats: string[]
  
  // Metadata
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export type BIMMarketplaceCategory =
  | 'architectural'
  | 'structural'
  | 'mep'
  | 'fire-safety'
  | 'sustainability'
  | 'facility-management'
  | 'construction'
  | 'renovation'
  | 'as-built'
  | 'digital-twin'
  | 'analysis'
  | 'visualization'
  | 'consulting'
  | 'training'
  | 'software'
  | 'plugin'
  | 'template'
  | 'library'

export interface BIMMarketplacePricing {
  model: 'free' | 'one-time' | 'subscription' | 'usage-based' | 'custom'
  amount?: number
  currency?: string
  subscriptionPeriod?: 'monthly' | 'yearly'
  usageUnit?: string
  usagePrice?: number
  customQuote?: boolean
  trialAvailable?: boolean
  trialDays?: number
}

export interface BIMModelMarketplaceData {
  modelId?: string
  fileFormat: 'ifc' | 'rvt' | 'nwd' | 'dwg' | 'gltf' | 'obj' | 'other'
  fileSize: number
  fileUrl: string
  previewUrl?: string
  thumbnailUrl?: string
  lod: 'LOD 100' | 'LOD 200' | 'LOD 300' | 'LOD 350' | 'LOD 400' | 'LOD 500'
  systems: string[]
  elements: number
  area?: number
  volume?: number
  floors?: number
  buildingType?: string
  projectType?: string
  year?: number
  location?: string
  software?: string
  version?: string
  license: 'royalty-free' | 'single-use' | 'multi-use' | 'commercial' | 'custom'
  licenseTerms?: string
}

export interface BIMServiceMarketplaceData {
  serviceType: 'modeling' | 'analysis' | 'coordination' | 'consulting' | 'training' | 'custom'
  deliverables: string[]
  duration?: string
  expertise: string[]
  certifications?: string[]
  portfolio?: string[]
  availability: 'immediate' | 'scheduled' | 'custom'
  responseTime?: string
  languages?: string[]
}

export interface BIMProfessionalMarketplaceData {
  profession: 'architect' | 'engineer' | 'bim-manager' | 'bim-coordinator' | 'consultant' | 'specialist'
  experience: number // years
  expertise: string[]
  certifications: string[]
  education: string[]
  portfolio: string[]
  languages: string[]
  availability: 'available' | 'busy' | 'unavailable'
  hourlyRate?: number
  projectRate?: number
  responseTime?: string
  verifiedCredentials: boolean
}

export interface BIMToolMarketplaceData {
  toolType: 'plugin' | 'software' | 'api' | 'script' | 'workflow'
  compatibleSoftware: string[]
  version: string
  downloadUrl?: string
  installationGuide?: string
  apiDocumentation?: string
  support: 'community' | 'email' | 'premium' | 'none'
  updates: 'manual' | 'automatic'
  license: 'free' | 'paid' | 'open-source'
}

export interface BIMTemplateMarketplaceData {
  templateType: 'project' | 'family' | 'workflow' | 'standard' | 'custom'
  compatibleSoftware: string[]
  version: string
  downloadUrl: string
  previewUrl?: string
  useCases: string[]
  industries: string[]
}

export interface BIMMarketplaceReview {
  id: string
  listingId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number // 1-5
  title?: string
  comment: string
  verifiedPurchase: boolean
  helpful: number
  images?: string[]
  createdAt: Date
  updatedAt?: Date
  providerResponse?: {
    comment: string
    respondedAt: Date
  }
}

// ============================================================================
// BIM PROFESSIONAL & PROVIDER
// ============================================================================

export interface BIMProvider {
  id: string
  type: 'individual' | 'company' | 'organization'
  name: string
  displayName: string
  description?: string
  logo?: string
  coverImage?: string
  
  // Contact
  email: string
  phone?: string
  website?: string
  location?: {
    country?: string
    region?: string
    city?: string
    address?: string
    coordinates?: { lat: number; lng: number }
  }
  
  // Verification
  verified: boolean
  verifiedAt?: Date
  verificationBadges: string[]
  
  // Ratings
  averageRating: number
  totalReviews: number
  totalListings: number
  totalSales?: number
  totalEarnings?: number
  
  // Specializations
  specializations: string[]
  certifications: string[]
  memberships: string[]
  
  // Portfolio
  portfolio: BIMProviderPortfolioItem[]
  
  // Social
  socialLinks?: {
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
    youtube?: string
  }
  
  // Stats
  responseRate?: number
  averageResponseTime?: string
  completionRate?: number
  
  // Status
  status: 'active' | 'inactive' | 'suspended'
  
  // Metadata
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface BIMProviderPortfolioItem {
  id: string
  title: string
  description?: string
  images: string[]
  videos?: string[]
  category: string
  year?: number
  location?: string
  client?: string
  tags: string[]
  featured: boolean
}

// ============================================================================
// BIM COLLABORATION
// ============================================================================

export interface BIMCollaborationSession {
  id: string
  modelId: string
  name: string
  description?: string
  hostId: string
  hostName: string
  
  // Participants
  participants: BIMCollaborationParticipant[]
  maxParticipants?: number
  
  // Settings
  settings: {
    allowGuestAccess: boolean
    requireApproval: boolean
    recordingEnabled: boolean
    chatEnabled: boolean
    annotationsEnabled: boolean
    measurementsEnabled: boolean
    exportEnabled: boolean
  }
  
  // Status
  status: 'scheduled' | 'active' | 'paused' | 'ended'
  scheduledStart?: Date
  startedAt?: Date
  endedAt?: Date
  
  // Activities
  activities: BIMCollaborationActivity[]
  annotations: BIMAnnotation[]
  issues: BIMIssue[]
  
  // Recording
  recordingUrl?: string
  
  // Metadata
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface BIMCollaborationParticipant {
  userId: string
  userName: string
  userAvatar?: string
  role: 'host' | 'co-host' | 'viewer' | 'commenter' | 'editor'
  joinedAt: Date
  leftAt?: Date
  permissions: {
    view: boolean
    comment: boolean
    annotate: boolean
    measure: boolean
    export: boolean
    edit: boolean
  }
  currentView?: {
    camera: {
      position: { x: number; y: number; z: number }
      target: { x: number; y: number; z: number }
    }
    selectedElements?: string[]
    visibleLayers?: string[]
  }
}

export interface BIMCollaborationActivity {
  id: string
  type: 'view-change' | 'selection' | 'annotation' | 'comment' | 'measurement' | 'export' | 'join' | 'leave'
  userId: string
  userName: string
  timestamp: Date
  data: Record<string, any>
}

export interface BIMAnnotation {
  id: string
  sessionId: string
  userId: string
  userName: string
  type: 'marker' | 'arrow' | 'highlight' | 'text' | 'dimension' | 'area' | 'volume'
  position: {
    x: number
    y: number
    z: number
  }
  elementId?: string
  text?: string
  color?: string
  createdAt: Date
  updatedAt?: Date
  replies?: BIMAnnotationReply[]
}

export interface BIMAnnotationReply {
  id: string
  annotationId: string
  userId: string
  userName: string
  text: string
  createdAt: Date
}

export interface BIMIssue {
  id: string
  sessionId: string
  modelId: string
  title: string
  description: string
  type: 'clash' | 'design' | 'coordination' | 'quality' | 'safety' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed'
  assignedTo?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  elementIds?: string[]
  screenshots?: string[]
  comments: BIMIssueComment[]
}

export interface BIMIssueComment {
  id: string
  issueId: string
  userId: string
  userName: string
  text: string
  attachments?: string[]
  createdAt: Date
}

// ============================================================================
// BIM AI ANALYSIS
// ============================================================================

export interface BIMAIAnalysis {
  id: string
  modelId: string
  type: 'clash-detection' | 'code-compliance' | 'sustainability' | 'cost-estimation' | 'safety' | 'optimization' | 'generative-design'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  
  // Input
  input: {
    modelId: string
    parameters: Record<string, any>
    options: Record<string, any>
  }
  
  // Output
  results: BIMAIAnalysisResult[]
  insights: BIMAIAnalysisInsight[]
  recommendations: BIMAIAnalysisRecommendation[]
  
  // Performance
  processingTime?: number
  accuracy?: number
  confidence?: number
  
  // Metadata
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  completedAt?: Date
}

export interface BIMAIAnalysisResult {
  id: string
  type: string
  elementIds?: string[]
  location?: {
    x: number
    y: number
    z: number
  }
  severity?: 'low' | 'medium' | 'high' | 'critical'
  description: string
  data: Record<string, any>
  visualization?: {
    type: 'highlight' | 'annotation' | 'measurement' | 'overlay'
    config: Record<string, any>
  }
}

export interface BIMAIAnalysisInsight {
  id: string
  category: string
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  confidence: number
  data: Record<string, any>
}

export interface BIMAIAnalysisRecommendation {
  id: string
  type: 'optimization' | 'fix' | 'improvement' | 'alternative'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  actionItems: string[]
  estimatedImpact: {
    cost?: number
    time?: number
    quality?: number
    sustainability?: number
  }
  implementationSteps?: string[]
}

// ============================================================================
// BIM DIGITAL TWIN INTEGRATION
// ============================================================================

export interface BIMDigitalTwinLink {
  id: string
  modelId: string
  digitalTwinId: string
  syncEnabled: boolean
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual'
  lastSyncAt?: Date
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending'
  mapping: BIMDigitalTwinMapping[]
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface BIMDigitalTwinMapping {
  bimElementId: string
  digitalTwinAssetId: string
  mappingType: 'one-to-one' | 'one-to-many' | 'many-to-one'
  syncProperties: string[]
  transform?: {
    position?: { x: number; y: number; z: number }
    rotation?: { x: number; y: number; z: number }
    scale?: { x: number; y: number; z: number }
  }
}

// ============================================================================
// BIM AR/VR
// ============================================================================

export interface BIMARVRSession {
  id: string
  modelId: string
  type: 'ar' | 'vr' | 'mixed-reality'
  name: string
  description?: string
  
  // Configuration
  config: {
    scale?: number
    origin?: { x: number; y: number; z: number }
    lighting?: 'auto' | 'day' | 'night' | 'custom'
    shadows?: boolean
    reflections?: boolean
    quality?: 'low' | 'medium' | 'high' | 'ultra'
  }
  
  // Access
  accessCode?: string
  publicUrl?: string
  qrCode?: string
  
  // Status
  status: 'draft' | 'active' | 'archived'
  activeUsers: number
  
  // Metadata
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// BIM SEARCH & FILTERS
// ============================================================================

export interface BIMMarketplaceSearchFilters {
  query?: string
  category?: BIMMarketplaceCategory[]
  type?: ('model' | 'service' | 'professional' | 'tool' | 'template')[]
  priceRange?: {
    min?: number
    max?: number
    currency?: string
  }
  rating?: {
    min?: number
  }
  location?: {
    country?: string
    region?: string
    city?: string
  }
  tags?: string[]
  compatibleSoftware?: string[]
  compatibleFormats?: string[]
  lod?: ('LOD 100' | 'LOD 200' | 'LOD 300' | 'LOD 350' | 'LOD 400' | 'LOD 500')[]
  verified?: boolean
  featured?: boolean
  availability?: ('available' | 'limited' | 'unavailable')[]
  sortBy?: 'relevance' | 'rating' | 'price-low' | 'price-high' | 'newest' | 'popular' | 'downloads'
  page?: number
  limit?: number
}

export interface BIMMarketplaceSearchResult {
  listings: BIMMarketplaceListing[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  facets?: {
    categories: { category: string; count: number }[]
    priceRanges: { range: string; count: number }[]
    ratings: { rating: number; count: number }[]
    locations: { location: string; count: number }[]
    tags: { tag: string; count: number }[]
  }
}

// ============================================================================
// BIM BOOKING & TRANSACTIONS
// ============================================================================

export interface BIMMarketplaceBooking {
  id: string
  listingId: string
  listingType: 'model' | 'service' | 'professional' | 'tool' | 'template'
  buyerId: string
  buyerName: string
  providerId: string
  providerName: string
  
  // Details
  title: string
  description?: string
  quantity?: number
  
  // Pricing
  pricing: BIMMarketplacePricing
  totalAmount: number
  currency: string
  
  // Status
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'refunded'
  
  // Dates
  requestedDate?: Date
  scheduledDate?: Date
  completedDate?: Date
  cancelledDate?: Date
  
  // Deliverables
  deliverables?: string[]
  downloadUrls?: string[]
  
  // Communication
  messages: BIMMarketplaceMessage[]
  
  // Review
  review?: BIMMarketplaceReview
  
  // Metadata
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface BIMMarketplaceMessage {
  id: string
  bookingId: string
  senderId: string
  senderName: string
  senderType: 'buyer' | 'provider'
  text: string
  attachments?: string[]
  read: boolean
  createdAt: Date
}








