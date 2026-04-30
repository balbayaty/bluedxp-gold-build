/**
 * Comprehensive SKU (Stock Keeping Unit) Type Definitions
 * Enterprise-grade SKU management exceeding SAP and Oracle capabilities
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { Customer } from './tenant'

// ============================================================================
// SKU CORE TYPES
// ============================================================================

/**
 * SKU Status
 */
export type SKUStatus = 
  | 'DRAFT'           // Being created/configured
  | 'ACTIVE'          // Active and available for use
  | 'INACTIVE'        // Temporarily disabled
  | 'DISCONTINUED'    // No longer produced/used
  | 'PENDING_APPROVAL' // Awaiting approval
  | 'SUSPENDED'       // Suspended due to compliance/quality issues
  | 'ARCHIVED'        // Historical record

/**
 * SKU Lifecycle Stage
 */
export type SKULifecycleStage =
  | 'DEVELOPMENT'     // Under development
  | 'TESTING'         // Testing phase
  | 'PRODUCTION'      // In production
  | 'PHASE_OUT'       // Being phased out
  | 'OBSOLETE'        // Obsolete

/**
 * Material Type
 */
export type MaterialType =
  | 'RAW_MATERIAL'    // Raw materials
  | 'SEMI_FINISHED'   // Semi-finished goods
  | 'FINISHED_GOOD'   // Finished products
  | 'PACKAGING'       // Packaging materials
  | 'CONSUMABLE'      // Consumables
  | 'SPARE_PART'      // Spare parts
  | 'TOOL'            // Tools and equipment
  | 'SERVICE'         // Services

/**
 * SKU - Comprehensive Stock Keeping Unit
 * Exceeds SAP Material Master and Oracle Item Master capabilities
 */
export interface SKU {
  // ============================================================================
  // IDENTIFICATION
  // ============================================================================
  id: string
  skuCode: string                    // Unique SKU code (e.g., "SKU-001234")
  materialNumber?: string             // Material master number (SAP/Oracle compatibility)
  materialDescription: string         // Full description
  shortDescription?: string          // Short description for displays
  alternateSKUCodes?: string[]        // Alternate SKU codes (cross-reference)
  barcode?: string                    // Primary barcode
  barcodes?: Barcode[]                // Multiple barcodes (EAN, UPC, QR, etc.)
  gtin?: string                       // Global Trade Item Number
  upc?: string                        // Universal Product Code
  ean?: string                        // European Article Number
  isbn?: string                       // ISBN (for books)
  
  // ============================================================================
  // CLASSIFICATION
  // ============================================================================
  category: string                    // Primary category
  subcategory?: string               // Subcategory
  materialType: MaterialType         // Material type classification
  productGroup?: string              // Product group
  productLine?: string               // Product line
  brand?: string                     // Brand name
  manufacturer?: string              // Manufacturer name
  manufacturerPartNumber?: string    // Manufacturer part number
  supplierPartNumber?: string        // Supplier part number
  industry?: string                 // Industry classification
  commodityCode?: string            // Commodity code
  hsCode?: string                   // Harmonized System code
  unspscCode?: string               // UNSPSC code
  
  // ============================================================================
  // STATUS & LIFECYCLE
  // ============================================================================
  status: SKUStatus
  lifecycleStage: SKULifecycleStage
  validFrom?: Date | string          // Valid from date
  validTo?: Date | string            // Valid to date
  effectiveDate?: Date | string      // Effective date
  expirationDate?: Date | string     // Expiration date
  
  // ============================================================================
  // PHYSICAL PROPERTIES
  // ============================================================================
  baseUnit: string                   // Base unit of measure (EA, KG, L, M, etc.)
  weight?: number                    // Weight in base unit
  weightUnit?: string                // Weight unit (KG, LBS, etc.)
  volume?: number                    // Volume in base unit
  volumeUnit?: string                // Volume unit (L, M3, etc.)
  dimensions?: Dimensions            // Product dimensions
  density?: number                   // Density (kg/m³)
  specificGravity?: number          // Specific gravity
  
  // ============================================================================
  // PACKAGING HIERARCHY
  // ============================================================================
  packagingHierarchy?: PackagingHierarchy  // Complete packaging structure
  defaultPackaging?: string                // Default packaging type ID
  packagingOptions?: PackagingOption[]     // Available packaging options
  
  // ============================================================================
  // STORAGE REQUIREMENTS
  // ============================================================================
  storageConditions?: StorageConditions
  temperatureControlled?: boolean
  minTemperature?: number
  maxTemperature?: number
  temperatureUnit?: 'C' | 'F'
  humidityControlled?: boolean
  minHumidity?: number
  maxHumidity?: number
  lightSensitive?: boolean
  airSensitive?: boolean
  moistureSensitive?: boolean
  storageClass?: string              // Storage class (A, B, C, D, E)
  storageType?: string                // Storage type (AMBIENT, COLD, FROZEN, etc.)
  
  // ============================================================================
  // HAZARDOUS MATERIALS
  // ============================================================================
  hazardous?: boolean
  hazardClass?: string               // UN hazard class
  hazardSubclass?: string            // UN hazard subclass
  packingGroup?: string              // Packing group (I, II, III)
  unNumber?: string                  // UN number
  properShippingName?: string        // Proper shipping name
  flashPoint?: number                // Flash point
  flashPointUnit?: 'C' | 'F'
  msdsRequired?: boolean
  msdsNumber?: string
  ghsClassification?: GHSClassification
  
  // ============================================================================
  // QUALITY & COMPLIANCE
  // ============================================================================
  batchManaged?: boolean             // Batch/lot tracking required
  serialNumberManaged?: boolean      // Serial number tracking required
  expiryDateManaged?: boolean        // Expiry date tracking required
  shelfLife?: number                 // Shelf life in days
  shelfLifeUnit?: 'DAYS' | 'MONTHS' | 'YEARS'
  qualityGrade?: string              // Quality grade
  certifications?: Certification[]   // Certifications (ISO, FDA, CE, etc.)
  complianceStandards?: string[]     // Compliance standards
  regulatoryStatus?: RegulatoryStatus[]
  
  // ============================================================================
  // COSTING & VALUATION
  // ============================================================================
  standardCost?: number              // Standard cost
  lastCost?: number                  // Last purchase cost
  averageCost?: number               // Average cost
  currency: string                   // Currency code (SAR, USD, etc.)
  costingMethod?: 'STANDARD' | 'AVERAGE' | 'FIFO' | 'LIFO' | 'SPECIFIC'
  valuationMethod?: 'STANDARD' | 'AVERAGE' | 'FIFO' | 'LIFO'
  
  // ============================================================================
  // INVENTORY MANAGEMENT
  // ============================================================================
  reorderPoint?: number              // Reorder point
  reorderQuantity?: number           // Reorder quantity
  maxStock?: number                  // Maximum stock level
  minStock?: number                  // Minimum stock level
  safetyStock?: number               // Safety stock level
  leadTime?: number                  // Lead time in days
  leadTimeUnit?: 'DAYS' | 'WEEKS' | 'MONTHS'
  
  // ============================================================================
  // CUSTOMER RELATIONSHIPS
  // ============================================================================
  customerSKUs?: CustomerSKURelationship[]  // Customer-specific SKU mappings
  defaultCustomer?: string                   // Default customer ID
  
  // ============================================================================
  // SUPPLIER INFORMATION
  // ============================================================================
  preferredVendor?: string            // Preferred vendor ID
  preferredVendorName?: string       // Preferred vendor name
  alternateVendors?: VendorReference[]
  
  // ============================================================================
  // SPECIFICATIONS
  // ============================================================================
  specifications?: SKUSpecifications
  
  // ============================================================================
  // USAGE & ANALYTICS
  // ============================================================================
  totalQuantityUsed?: number         // Total quantity used (historical)
  lastUsedDate?: Date | string      // Last used date
  usageFrequency?: 'HIGH' | 'MEDIUM' | 'LOW'
  
  // ============================================================================
  // INTEGRATION & EXTERNAL SYSTEMS
  // ============================================================================
  erpSystemId?: string              // ERP system ID (SAP, Oracle, etc.)
  erpMaterialNumber?: string        // ERP material number
  externalSystemIds?: ExternalSystemId[]
  
  // ============================================================================
  // METADATA
  // ============================================================================
  tags?: string[]                    // Tags for categorization
  notes?: string                     // Internal notes
  attachments?: Attachment[]         // Attachments (images, documents, etc.)
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
  version?: number                   // Version number for tracking changes
}

// ============================================================================
// PACKAGING TYPES
// ============================================================================

/**
 * Packaging Hierarchy
 * Supports multi-level packaging (e.g., Each → Box → Case → Pallet)
 */
export interface PackagingHierarchy {
  id: string
  skuId: string
  levels: PackagingLevel[]          // Ordered from smallest to largest
  defaultLevel?: string              // Default packaging level ID
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Packaging Level
 * Represents one level in the packaging hierarchy
 */
export interface PackagingLevel {
  id: string
  level: number                     // Level number (1 = smallest, higher = larger)
  name: string                      // Name (e.g., "Each", "Box", "Case", "Pallet")
  code: string                      // Code (e.g., "EA", "BX", "CS", "PLT")
  unitOfMeasure: string            // Unit of measure
  quantityPerParent?: number       // Quantity of this level per parent level
  parentLevelId?: string            // Parent level ID (null for base level)
  
  // Physical properties
  dimensions?: Dimensions
  weight?: number
  weightUnit?: string
  volume?: number
  volumeUnit?: string
  maxWeight?: number                // Maximum weight capacity
  maxVolume?: number                // Maximum volume capacity
  
  // Pallet-specific properties
  isPallet?: boolean
  palletType?: PalletType
  palletConfiguration?: PalletConfiguration
  
  // Costing
  packagingCost?: number            // Cost of this packaging level
  currency?: string
  
  // Barcode
  barcode?: string
  barcodes?: Barcode[]
  
  // Status
  active: boolean
  default?: boolean                 // Is this the default packaging level?
  
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Pallet Type
 */
export type PalletType =
  | 'STANDARD_EURO'      // Standard Euro pallet (1200x800mm)
  | 'STANDARD_US'        // Standard US pallet (48x40 inches)
  | 'STANDARD_ASIA'      // Standard Asia pallet
  | 'CUSTOM'             // Custom pallet
  | 'DISPLAY_PALLET'     // Display pallet
  | 'DOUBLE_DECK'        // Double deck pallet
  | 'WING_PALLET'        // Wing pallet
  | 'REVERSIBLE'         // Reversible pallet

/**
 * Pallet Configuration
 */
export interface PalletConfiguration {
  palletType: PalletType
  palletDimensions: Dimensions      // Pallet dimensions
  maxLayers?: number                // Maximum number of layers
  maxUnitsPerLayer?: number         // Maximum units per layer
  maxWeight?: number                // Maximum weight capacity (kg)
  stackingPattern?: StackingPattern  // Stacking pattern
  tiePattern?: TiePattern            // Tie pattern for stability
  stretchWrapRequired?: boolean     // Stretch wrap required
  shrinkWrapRequired?: boolean      // Shrink wrap required
  palletCapRequired?: boolean       // Pallet cap required
  cornerProtectors?: boolean        // Corner protectors required
}

/**
 * Stacking Pattern
 */
export interface StackingPattern {
  pattern: 'COLUMN' | 'BRICK' | 'INTERLOCK' | 'PINWHEEL' | 'CUSTOM'
  unitsPerLayer: number
  layers: number
  diagram?: string                  // Visual diagram reference
}

/**
 * Tie Pattern
 */
export interface TiePattern {
  horizontalTies?: number           // Number of horizontal ties
  verticalTies?: number             // Number of vertical ties
  diagonalTies?: number             // Number of diagonal ties
  pattern?: string                  // Pattern description
}

/**
 * Packaging Option
 * Available packaging options for a SKU
 */
export interface PackagingOption {
  id: string
  packagingLevelId: string
  name: string
  description?: string
  default?: boolean
  cost?: number
  currency?: string
  active: boolean
}

// ============================================================================
// CUSTOMER-SKU RELATIONSHIPS
// ============================================================================

/**
 * Customer-SKU Relationship
 * Links SKUs to customers with customer-specific configurations
 */
export interface CustomerSKURelationship {
  id: string
  skuId: string
  customerId: string
  customerNumber?: string
  customerName?: string
  
  // Customer-specific SKU information
  customerSKUCode?: string          // Customer's SKU code
  customerPartNumber?: string       // Customer's part number
  customerDescription?: string      // Customer's description
  customerBarcode?: string          // Customer's barcode
  
  // Customer-specific packaging
  customerPackaging?: CustomerPackagingConfig
  
  // Customer-specific pricing
  customerPrice?: number
  customerCurrency?: string
  pricingTier?: string
  
  // Customer-specific requirements
  customerRequirements?: CustomerRequirements
  
  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'
  effectiveDate?: Date | string
  expirationDate?: Date | string
  
  // Integration
  customerSystemId?: string          // Customer's system ID
  customerSystemSKU?: string        // Customer's system SKU
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
}

/**
 * Customer Packaging Configuration
 */
export interface CustomerPackagingConfig {
  preferredPackagingLevel?: string  // Preferred packaging level ID
  customPackaging?: PackagingLevel[] // Custom packaging levels
  packagingInstructions?: string    // Special packaging instructions
  labelingRequirements?: LabelingRequirement[]
}

/**
 * Customer Requirements
 */
export interface CustomerRequirements {
  specialHandling?: string[]
  qualityRequirements?: string[]
  complianceRequirements?: string[]
  documentationRequirements?: string[]
  certificationRequirements?: string[]
  customFields?: Record<string, any>
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

/**
 * Barcode
 */
export interface Barcode {
  id: string
  type: 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'CODE39' | 'QR' | 'DATA_MATRIX' | 'CUSTOM'
  value: string
  primary?: boolean
  active: boolean
}

/**
 * Dimensions
 */
export interface Dimensions {
  length: number
  width: number
  height: number
  unit: 'CM' | 'M' | 'IN' | 'FT'
}

/**
 * Storage Conditions
 */
export interface StorageConditions {
  temperature?: {
    min: number
    max: number
    unit: 'C' | 'F'
  }
  humidity?: {
    min: number
    max: number
    unit: '%'
  }
  light?: 'DARK' | 'LOW_LIGHT' | 'NORMAL' | 'BRIGHT'
  atmosphere?: 'NORMAL' | 'NITROGEN' | 'VACUUM' | 'CONTROLLED'
  orientation?: 'ANY' | 'UPRIGHT' | 'HORIZONTAL' | 'SPECIFIC'
  stacking?: {
    maxLayers?: number
    maxWeight?: number
  }
}

/**
 * GHS Classification
 */
export interface GHSClassification {
  pictograms?: string[]             // GHS pictogram codes
  signalWord?: 'DANGER' | 'WARNING'
  hazardStatements?: string[]       // H-codes
  precautionaryStatements?: string[] // P-codes
  hazardCategories?: string[]       // Hazard category codes
}

/**
 * Certification
 */
export interface Certification {
  id: string
  type: string                      // Certification type (ISO, FDA, CE, etc.)
  number?: string                   // Certification number
  issuer?: string                   // Issuing organization
  issueDate?: Date | string
  expiryDate?: Date | string
  status: 'VALID' | 'EXPIRED' | 'PENDING' | 'SUSPENDED'
  documentUrl?: string
}

/**
 * Regulatory Status
 */
export interface RegulatoryStatus {
  authority: string                 // Regulatory authority
  region: string                    // Region
  status: 'APPROVED' | 'PENDING' | 'RESTRICTED' | 'BANNED' | 'UNKNOWN'
  registrationNumber?: string
  expiryDate?: Date | string
  notes?: string
}

/**
 * Vendor Reference
 */
export interface VendorReference {
  vendorId: string
  vendorName: string
  vendorPartNumber?: string
  priority?: number                 // Priority (1 = highest)
  leadTime?: number
  leadTimeUnit?: 'DAYS' | 'WEEKS' | 'MONTHS'
  minimumOrderQuantity?: number
  price?: number
  currency?: string
}

/**
 * SKU Specifications
 */
export interface SKUSpecifications {
  color?: string
  grade?: string
  purity?: string
  ph?: number
  viscosity?: string
  hardness?: string
  tensileStrength?: string
  meltingPoint?: number
  boilingPoint?: number
  flashPoint?: number
  customProperties?: Record<string, any>
}

/**
 * External System ID
 */
export interface ExternalSystemId {
  system: string                    // System name (SAP, Oracle, etc.)
  systemType: 'ERP' | 'WMS' | 'TMS' | 'CUSTOM'
  externalId: string
  syncEnabled?: boolean
  lastSyncDate?: Date | string
}

/**
 * Attachment
 */
export interface Attachment {
  id: string
  type: 'IMAGE' | 'DOCUMENT' | 'CERTIFICATE' | 'MSDS' | 'OTHER'
  name: string
  url: string
  thumbnailUrl?: string
  size?: number
  mimeType?: string
  uploadedAt: Date | string
  uploadedBy?: string
}

/**
 * Labeling Requirement
 */
export interface LabelingRequirement {
  type: 'SHIPPING' | 'PRODUCT' | 'HAZMAT' | 'CUSTOM'
  language?: string[]
  requiredFields?: string[]
  template?: string
  customInstructions?: string
}

// ============================================================================
// SKU SEARCH & FILTER TYPES
// ============================================================================

export interface SKUSearchFilters {
  searchQuery?: string
  status?: SKUStatus[]
  category?: string[]
  materialType?: MaterialType[]
  hazardous?: boolean
  batchManaged?: boolean
  serialNumberManaged?: boolean
  customerId?: string
  warehouseId?: string
  tags?: string[]
}

export interface SKUSearchResult {
  skus: SKU[]
  total: number
  page: number
  pageSize: number
  filters: SKUSearchFilters
}

// ============================================================================
// SKU ANALYTICS TYPES
// ============================================================================

export interface SKUAnalytics {
  skuId: string
  totalStock: number
  reservedStock: number
  availableStock: number
  totalValue: number
  averageCost: number
  turnoverRate?: number
  daysOnHand?: number
  abcClassification?: 'A' | 'B' | 'C'
  velocity?: 'FAST' | 'MEDIUM' | 'SLOW'
  lastMovementDate?: Date | string
  movementFrequency?: number
}











