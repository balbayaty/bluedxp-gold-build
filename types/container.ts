/**
 * Container-Level Tracking Types
 * Individual container management with barcode/QR tracking
 */

export interface ChemicalContainer {
  id: string
  containerNumber: string
  barcode?: string
  qrCode?: string
  
  // Chemical Assignment
  chemicalId: string
  chemicalName: string
  casNumber?: string
  
  // Container Details
  containerType: ContainerType
  capacity: number
  unit: string
  currentQuantity: number
  fillLevel: number // 0-100%
  
  // Location
  warehouseId?: string
  warehouseName?: string
  zoneId?: string
  zoneName?: string
  roomId?: string
  roomName?: string
  rackId?: string
  rackName?: string
  shelfId?: string
  shelfName?: string
  coordinates?: { x: number; y: number } // For visual mapping
  
  // Lifecycle
  status: ContainerStatus
  lifecycle: ContainerLifecycle
  
  // Dates
  receivedDate?: string
  openedDate?: string
  expiryDate?: string
  disposalDate?: string
  
  // Labels
  labelPrinted: boolean
  labelPrintedDate?: string
  ghsLabel?: GHSLabel
  
  // Tracking
  transferHistory: ContainerTransfer[]
  usageHistory: ContainerUsage[]
  
  // Metadata
  metadata: ContainerMetadata
}

export type ContainerType = 
  | 'Drum'
  | 'Barrel'
  | 'IBC'
  | 'Bottle'
  | 'Can'
  | 'Cylinder'
  | 'Bag'
  | 'Box'
  | 'Tank'
  | 'Bulk'
  | 'Other'

export type ContainerStatus = 
  | 'Full'
  | 'In-Use'
  | 'Empty'
  | 'Disposed'
  | 'Quarantine'
  | 'In Transit'

export interface ContainerLifecycle {
  stage: LifecycleStage
  history: LifecycleEvent[]
}

export type LifecycleStage = 
  | 'Received'
  | 'Stored'
  | 'In-Use'
  | 'Empty'
  | 'Disposed'

export interface LifecycleEvent {
  date: string
  stage: LifecycleStage
  location?: string
  notes?: string
  performedBy?: string
}

export interface ContainerTransfer {
  id: string
  date: string
  fromLocation: string
  toLocation: string
  reason: string
  transferredBy?: string
  notes?: string
}

export interface ContainerUsage {
  id: string
  date: string
  quantityUsed: number
  unit: string
  usedBy?: string
  purpose?: string
  notes?: string
}

export interface GHSLabel {
  chemicalName: string
  casNumber?: string
  ghsSymbols: string[]
  signalWord: 'Danger' | 'Warning'
  hazardStatements: string[]
  precautionaryStatements: string[]
  supplierInfo?: string
  lotNumber?: string
  barcode?: string
  qrCode?: string
}

export interface ContainerMetadata {
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  tags?: string[]
  notes?: string
  photos?: string[] // URLs to container photos
}

// Container Search & Filters
export interface ContainerSearchFilters {
  containerNumber?: string
  barcode?: string
  chemicalId?: string
  chemicalName?: string
  status?: ContainerStatus
  location?: string
  containerType?: ContainerType
  expiryDateRange?: {
    from: string
    to: string
  }
}

export interface ContainerSearchResult {
  containers: ChemicalContainer[]
  total: number
  page: number
  pageSize: number
  filters: ContainerSearchFilters
}











