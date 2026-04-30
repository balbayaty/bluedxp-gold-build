/**
 * Entity Graph Type Definitions
 * Cross-entity relationship management for enterprise platform
 * Supports graph traversal, impact analysis, and relationship tracking
 */

// ============================================================================
// CANONICAL ENTITIES
// ============================================================================

export type EntityType =
  | 'customer'
  | 'supplier'
  | 'warehouse'
  | 'product'
  | 'chemical'
  | 'order'
  | 'shipment'
  | 'document'
  | 'user'
  | 'asset'
  | 'location'
  | 'workflow'
  | 'incident'
  | 'ncr'
  | 'capa'
  | 'audit'
  | 'certificate'
  | 'contract'
  | 'invoice'
  | 'custom'

export interface CanonicalEntity {
  id: string
  type: EntityType
  tenantId?: string
  
  // Core identification
  name: string
  code?: string // Business code (e.g., customer number)
  externalIds?: Record<string, string> // External system IDs
  
  // Metadata
  attributes: Record<string, any>
  tags: string[]
  
  // Graph connections
  relationships: EntityRelationship[]
  
  // Lifecycle
  status: 'active' | 'inactive' | 'archived' | 'deleted'
  version: number
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
  
  // Computed (from relationships)
  relatedEntitiesCount?: number
  impactScore?: number // How many entities this impacts
}

// ============================================================================
// RELATIONSHIPS
// ============================================================================

export type RelationshipType =
  | 'parent_child'      // Hierarchical relationship
  | 'depends_on'        // Dependency
  | 'references'        // Soft reference
  | 'owns'              // Ownership
  | 'impacts'           // Impact relationship
  | 'contains'          // Container relationship
  | 'supplies'          // Supplier relationship
  | 'serves'            // Service relationship
  | 'processes'         // Processing relationship
  | 'validates'         // Validation relationship
  | 'approves'          // Approval relationship
  | 'custom'            // Custom relationship

export interface EntityRelationship {
  id: string
  
  // Source and target
  sourceEntityId: string
  sourceEntityType: EntityType
  targetEntityId: string
  targetEntityType: EntityType
  
  // Relationship details
  type: RelationshipType
  label?: string // Human-readable label
  direction: 'forward' | 'bidirectional'
  
  // Strength and weight
  strength: number // 0-1, how strong the relationship is
  weight?: number // For weighted graph algorithms
  
  // Metadata
  metadata: Record<string, any>
  
  // Validity
  validFrom?: Date | string
  validUntil?: Date | string
  isActive: boolean
  
  // Audit
  createdAt: Date | string
  createdBy?: string
}

// ============================================================================
// GRAPH QUERIES
// ============================================================================

export interface GraphQuery {
  // Starting point
  startEntityId?: string
  startEntityType?: EntityType
  
  // Filters
  targetEntityTypes?: EntityType[]
  relationshipTypes?: RelationshipType[]
  minStrength?: number
  includeInactive?: boolean
  
  // Traversal options
  maxDepth?: number
  direction?: 'outgoing' | 'incoming' | 'both'
  
  // Pagination
  limit?: number
  offset?: number
}

export interface GraphQueryResult {
  entities: CanonicalEntity[]
  relationships: EntityRelationship[]
  paths?: GraphPath[]
  totalCount: number
}

export interface GraphPath {
  nodes: CanonicalEntity[]
  edges: EntityRelationship[]
  totalWeight: number
  depth: number
}

// ============================================================================
// IMPACT ANALYSIS
// ============================================================================

export interface ImpactAnalysis {
  sourceEntity: CanonicalEntity
  impactedEntities: ImpactedEntity[]
  totalImpactScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
  analysisTimestamp: Date | string
}

export interface ImpactedEntity {
  entity: CanonicalEntity
  impactType: 'direct' | 'indirect'
  impactScore: number // 0-100
  pathToSource: EntityRelationship[]
  estimatedEffect: string
  mitigationSuggestions?: string[]
}

// ============================================================================
// GRAPH OPERATIONS
// ============================================================================

export interface GraphOperationResult {
  success: boolean
  operation: 'create' | 'update' | 'delete' | 'merge'
  entityId?: string
  relationshipId?: string
  affectedEntities: string[]
  error?: string
}

export interface EntityMergeRequest {
  sourceEntityId: string
  targetEntityId: string
  strategy: 'keep_source' | 'keep_target' | 'merge_attributes'
  attributeMergeRules?: Record<string, 'source' | 'target' | 'combine'>
}

// ============================================================================
// GRAPH ANALYTICS
// ============================================================================

export interface GraphAnalytics {
  entityCounts: Record<EntityType, number>
  relationshipCounts: Record<RelationshipType, number>
  
  // Graph metrics
  totalNodes: number
  totalEdges: number
  averageDegree: number
  density: number
  
  // Centrality (top entities)
  topByConnections: { entityId: string; connections: number }[]
  topByImpact: { entityId: string; impactScore: number }[]
  
  // Clusters
  clusters?: GraphCluster[]
  
  // Health
  orphanedEntities: number
  brokenRelationships: number
  
  analyzedAt: Date | string
}

export interface GraphCluster {
  id: string
  entities: string[] // Entity IDs
  primaryType: EntityType
  cohesion: number // 0-1
  label?: string
}

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface EntityGraphService {
  // Entity CRUD
  createEntity: (entity: Omit<CanonicalEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<CanonicalEntity>
  getEntity: (id: string) => Promise<CanonicalEntity | null>
  updateEntity: (id: string, updates: Partial<CanonicalEntity>) => Promise<CanonicalEntity>
  deleteEntity: (id: string, cascade?: boolean) => Promise<GraphOperationResult>
  
  // Relationship CRUD
  createRelationship: (relationship: Omit<EntityRelationship, 'id' | 'createdAt'>) => Promise<EntityRelationship>
  getRelationship: (id: string) => Promise<EntityRelationship | null>
  updateRelationship: (id: string, updates: Partial<EntityRelationship>) => Promise<EntityRelationship>
  deleteRelationship: (id: string) => Promise<boolean>
  
  // Graph queries
  query: (query: GraphQuery) => Promise<GraphQueryResult>
  findRelated: (entityId: string, options?: Partial<GraphQuery>) => Promise<CanonicalEntity[]>
  findPath: (fromEntityId: string, toEntityId: string, maxDepth?: number) => Promise<GraphPath | null>
  
  // Impact analysis
  analyzeImpact: (entityId: string, changeType: 'delete' | 'update' | 'disable') => Promise<ImpactAnalysis>
  getImpactedBy: (entityId: string) => Promise<ImpactedEntity[]>
  
  // Bulk operations
  mergeEntities: (request: EntityMergeRequest) => Promise<GraphOperationResult>
  bulkCreateRelationships: (relationships: Omit<EntityRelationship, 'id' | 'createdAt'>[]) => Promise<EntityRelationship[]>
  
  // Analytics
  getAnalytics: (tenantId?: string) => Promise<GraphAnalytics>
  detectClusters: (minSize?: number) => Promise<GraphCluster[]>
  
  // Search
  searchEntities: (query: string, filters?: { types?: EntityType[]; tenantId?: string }) => Promise<CanonicalEntity[]>
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CanonicalEntity

