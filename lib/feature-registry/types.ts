/**
 * Feature Registry - Type Definitions
 * Single source of truth for all features in BlueDXP platform
 */

export type FeatureStatus = 'implemented' | 'partial' | 'stub' | 'missing' | 'planned';

export type FeatureDomain = 
  | 'wms' 
  | 'tms' 
  | 'qhse' 
  | 'procurement' 
  | 'trade-compliance' 
  | 'truth-engine' 
  | 'hazalyze' 
  | 'maas' 
  | 'compliance' 
  | 'finance' 
  | 'crm' 
  | 'digital-signature' 
  | 'marketplace' 
  | 'warehouse-network' 
  | 'facility-management' 
  | 'project-management' 
  | 'proposals-rfq' 
  | 'hr' 
  | 'iot' 
  | 'business-intelligence' 
  | 'communication' 
  | 'platform' 
  | 'other';

export type ComplianceTag = 
  | 'ISO-9001' 
  | 'ISO-45001' 
  | 'ISO-14001' 
  | 'ISO-22301' 
  | 'IMS' 
  | 'ZATCA' 
  | 'MISA' 
  | 'TGA' 
  | 'SFDA' 
  | 'SBC-801' 
  | 'NFPA' 
  | 'GHS' 
  | 'Civil-Defense' 
  | 'SEDA' 
  | 'CMA' 
  | 'HRSD' 
  | 'Aramco' 
  | 'SABIC' 
  | 'IKTVA' 
  | 'LCGPA' 
  | 'NUSANED';

export interface FeatureEntity {
  /** Entity name (e.g., "Shipment", "MSDS", "WorkOrder") */
  name: string;
  /** Type definition path */
  typePath: string;
  /** Storage location (database table, collection, etc.) */
  storageLocation?: string;
}

export interface FeatureEvent {
  /** Event name (e.g., "shipment.created", "msds.approved") */
  name: string;
  /** Event bus topic */
  topic: string;
  /** Whether this event is consumed by this feature */
  consumed: boolean;
  /** Whether this feature emits this event */
  emitted: boolean;
}

export interface FeatureAPI {
  /** API endpoint path */
  endpoint: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Endpoint description */
  description: string;
  /** Whether authentication is required */
  requiresAuth: boolean;
  /** Required roles */
  roles?: string[];
  /** API route file path */
  routePath?: string;
}

export interface FeatureUISurface {
  /** Page route path */
  route: string;
  /** Component path */
  componentPath: string;
  /** Page title */
  title: string;
  /** Whether authentication is required */
  requiresAuth?: boolean;
  /** Required roles */
  roles?: string[];
}

export interface FeatureTest {
  /** Test type */
  type: 'unit' | 'integration' | 'e2e';
  /** Test file path */
  filePath: string;
  /** Test coverage percentage (if known) */
  coverage?: number;
  /** Test status */
  status: 'passing' | 'failing' | 'pending' | 'not-implemented';
}

export interface FeatureDefinition {
  /** Unique feature ID */
  id: string;
  /** Feature name */
  name: string;
  /** Feature description */
  description: string;
  /** Domain owner */
  domain: FeatureDomain;
  /** Feature status */
  status: FeatureStatus;
  /** Canonical service implementation path */
  canonicalServicePath?: string;
  /** Public API endpoints */
  apis?: FeatureAPI[];
  /** UI surfaces (pages/components) */
  uiSurfaces?: FeatureUISurface[];
  /** Data entities used */
  entities?: FeatureEntity[];
  /** Events emitted/consumed */
  events?: FeatureEvent[];
  /** Compliance tags */
  complianceTags?: ComplianceTag[];
  /** Tests required */
  tests?: FeatureTest[];
  /** Dependencies on other features */
  dependencies?: string[];
  /** Related module ID */
  moduleId?: string;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
  /** Version */
  version: string;
  /** Metadata */
  metadata?: Record<string, any>;
}

export interface FeatureRegistryConfig {
  /** Whether to enforce feature registration in CI */
  enforceRegistration: boolean;
  /** Whether to auto-discover features from codebase */
  autoDiscover: boolean;
  /** Storage backend */
  storage: 'file' | 'database' | 'memory';
  /** Storage path (for file storage) */
  storagePath?: string;
}













