/**
 * Comprehensive Transport Job Types
 * Based on Zoho CSV data structure and enhanced TMS requirements
 */

export enum JobType {
  CROSS_BORDER = 'Cross Border',
  INLAND_EXPORT = 'Inland Export',
  INTER_CITY = 'Inter City',
  INLAND_IMPORT = 'Inland Import',
}

export enum JobStatus {
  PENDING = 'Pending',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered',
  COMPLETED = 'Job Completed',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export enum ShipmentType {
  BOXES_CASES = 'Boxes / Cases',
  EQUIPMENT = 'Equipment',
  JUMBO_BAGS = 'Jumbo Bags',
  DRUMS = 'Drums',
  OTHER = 'Other',
}

export enum TruckType {
  BOX_TRAILER_DRY = 'Box Trailer Dry',
  REEFER_TRAILER = 'Reefer Trailer',
  FLATBED = 'Flatbed',
  LOWBED = 'Lowbed',
  CURTAIN_SIDE = 'Curtain Side',
  OTHER = 'Other',
}

export enum BayanStatus {
  PENDING = 'Pending',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum DOStatus {
  PENDING = 'Pending',
  ISSUED = 'Issued',
  RECEIVED = 'Received',
  COMPLETED = 'Completed',
}

export enum ManifestStatus {
  PENDING = 'Pending',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
}

export enum SIStatus {
  PENDING = 'Pending',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
}

/**
 * Core Transport Job Entity
 */
export interface TransportJob {
  // Basic Information
  id: string;
  recordId?: string; // Zoho record ID
  jobName: string;
  jobNumber: string;
  jobType: JobType;
  jobStatus: JobStatus;
  
  // Ownership & Audit
  jobOwnerId?: string;
  jobOwner?: string;
  createdById?: string;
  createdBy?: string;
  modifiedById?: string;
  modifiedBy?: string;
  createdTime: Date;
  modifiedTime: Date;
  lastActivityTime?: Date;
  
  // Financial
  currency: string;
  exchangeRate?: number;
  
  // Customer & Transporter
  customerId?: string;
  customer?: string;
  transporterId?: string;
  transporter?: string;
  
  // Shipment Details
  containerNumber?: string;
  shipmentNumber?: string;
  shipmentType?: ShipmentType;
  shipmentTypeOther?: string;
  shipmentOrigin?: string;
  shipmentDestination?: string;
  shipmentFinalDestination?: string;
  shipmentWeight?: number;
  numberOfContainersOnMBL?: number;
  
  // Booking & Documentation
  bookingNumber?: string;
  masterBillOfLading?: string; // MBL
  houseBillOfLading?: string; // HBL
  orderNumber?: string;
  poNumber?: string;
  flexInvoiceNumber?: string;
  refNo?: string;
  transporterBill?: string;
  
  // Bayan & Customs
  bayanStatus?: BayanStatus;
  bayanNumber?: string;
  bayanNumberEntry?: string;
  bayanNumberExit?: string;
  doStatus?: DOStatus;
  manifestStatus?: ManifestStatus;
  siStatus?: SIStatus;
  
  // Equipment & Vehicle
  truckType?: TruckType;
  vehiclePlateNumber?: string;
  typeOfEquipment?: string;
  oldContainer?: string;
  
  // Driver Information
  driverId?: string;
  driverName?: string;
  driverMobileNumber?: string;
  driverForeignMobileNumber?: string;
  driverIqamaNumber?: string;
  driverLicenseNumber?: string;
  driverPassportNumber?: string;
  driverNationality?: string;
  
  // Location Details
  polCountry?: string;
  polLocation?: string;
  podCountry?: string;
  podLocation?: string;
  polDetails?: string;
  
  // Ports & Terminals
  dropOffPort?: string; // Sailing Port
  emptyContainerCollectionDepot?: string;
  collectionPort?: string; // Arrival Port
  fullContainerDropOffDepot?: string;
  storageTerminalName?: string;
  
  // Consignee Information
  foreignConsignee?: string;
  localConsignee?: string;
  consigneeName?: string;
  consigneePhone?: string;
  
  // Dates & Times
  requestDate?: Date;
  loadingDate?: Date;
  loadingDateForWayBill?: Date;
  departureTimeForWayBill?: string;
  dateOffload?: Date;
  
  // Border Crossings
  saudiBorderArrival?: Date;
  saudiBorderDeparture?: Date;
  destinationBorderArrival?: Date;
  destinationBorderDeparture?: Date;
  transitBorderArrival?: Date;
  transitBorderDeparture?: Date;
  borderEntryNo?: string;
  
  // Shipper (POL) Events
  shipperArrival?: Date;
  shipperDeparture?: Date;
  
  // Consignee (POD) Events
  consigneeArrival?: Date;
  consigneeDeparture?: Date;
  
  // Terminal Storage
  storageTerminalDateIn?: Date;
  storageTerminalDateOut?: Date;
  
  // Financial Details
  agreedRate?: number;
  costTRP?: number;
  otherExpenses?: number;
  othersAmount?: number;
  bridgeClearanceFees?: number;
  ccBOEntry?: number;
  ccBOExit?: number;
  overWeight?: number;
  totalCost?: number;
  
  // Detention
  detentionLoadingDays?: number;
  detentionDetails?: DetentionRecord[];
  
  // Transit Times
  totalLoadingTime?: number; // hours
  totalOffloadingTime?: number; // hours
  transitTime?: number; // hours
  transitTime2?: number; // hours
  
  // Lane & Deal
  laneId?: string;
  laneName?: string;
  dealId?: string;
  deal?: string;
  
  // Round Trip
  roundTrip?: boolean;
  
  // Banking
  bankName?: string;
  ibanNumber?: string;
  
  // Container Release
  containerReleaseOrderNumber?: string; // CRO
  
  // Dispatcher
  dispatcherName?: string;
  
  // Notes
  notesAndInstructions?: string;
  podDetails?: string;
  
  // ETA
  eta?: Date;
  etaNotProvided?: boolean;
  
  // Connected To
  connectedToModule?: string;
  connectedToId?: string;
  
  // Metadata
  tag?: string;
  locked?: boolean;
  tenantId: string; // Multi-tenant isolation
  
  // Enhanced Fields
  podRecords?: PODRecord[];
  transitTimeRecords?: TransitTimeRecord[];
  lane?: Lane;
  
  // Integration Status
  tgaVerified?: boolean;
  daleeliVerified?: boolean;
  bayanSynced?: boolean;
}

/**
 * Proof of Delivery Record
 */
export interface PODRecord {
  id: string;
  jobId: string;
  
  // Delivery Information
  deliveryDate: Date;
  deliveryTime: string;
  deliveryTimestamp: Date;
  
  // Location
  deliveryLocation?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  
  // Consignee
  consigneeName: string;
  consigneeSignature?: string; // Digital signature data
  consigneePhone?: string;
  
  // Delivery Status
  deliveryStatus: 'delivered' | 'partial' | 'refused' | 'damaged';
  deliveryNotes?: string;
  
  // Evidence
  photos?: string[]; // URLs or base64
  documents?: string[]; // URLs
  evidenceIds?: string[]; // Links to Evidence Service
  
  // Verification
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  tenantId: string;
}

/**
 * Detention Record
 */
export interface DetentionRecord {
  id: string;
  jobId: string;
  
  // Detention Type
  detentionType: 'loading' | 'unloading' | 'border' | 'terminal' | 'customs';
  
  // Time Period
  startDate: Date;
  endDate?: Date;
  freeTimeDays: number;
  detentionDays: number;
  
  // Location
  location?: string;
  locationType?: 'shipper' | 'consignee' | 'border' | 'terminal' | 'customs';
  
  // Cost
  detentionRate?: number; // Per day
  detentionCost?: number;
  
  // Status
  status: 'active' | 'resolved' | 'disputed';
  resolvedAt?: Date;
  
  // Reason
  reason?: string;
  notes?: string;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  tenantId: string;
}

/**
 * Transit Time Record
 */
export interface TransitTimeRecord {
  id: string;
  jobId: string;
  
  // Route Segment
  segment: 'full' | 'pol_to_border' | 'border_to_pod' | 'transit_border' | 'custom';
  segmentName?: string;
  
  // Time Period
  startDate: Date;
  endDate: Date;
  plannedTransitTime?: number; // hours
  actualTransitTime: number; // hours
  delay?: number; // hours
  
  // Locations
  origin: string;
  destination: string;
  
  // Performance
  onTime: boolean;
  delayReason?: string;
  
  // Metadata
  createdAt: Date;
  tenantId: string;
}

/**
 * Lane Definition
 */
export interface Lane {
  id: string;
  name: string;
  
  // Route
  origin: string;
  originCountry?: string;
  destination: string;
  destinationCountry?: string;
  
  // Equipment
  truckType?: TruckType;
  
  // Performance Metrics
  averageTransitTime?: number; // hours
  onTimeDeliveryRate?: number; // percentage
  averageCost?: number;
  utilizationRate?: number; // percentage
  
  // Deal Information
  dealId?: string;
  deal?: string;
  rate?: number;
  
  // Statistics
  totalJobs?: number;
  completedJobs?: number;
  activeJobs?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  isActive: boolean;
}

/**
 * Border Crossing Event
 */
export interface BorderCrossing {
  id: string;
  jobId: string;
  
  // Border Information
  borderName: string;
  borderType: 'saudi' | 'destination' | 'transit';
  crossingDirection: 'entry' | 'exit';
  
  // Timing
  arrivalDate?: Date;
  departureDate?: Date;
  processingTime?: number; // hours
  
  // Documentation
  bayanNumber?: string;
  borderEntryNo?: string;
  clearanceStatus?: 'pending' | 'in_progress' | 'cleared' | 'rejected';
  
  // Costs
  clearanceFees?: number;
  bridgeClearanceFees?: number;
  
  // Metadata
  createdAt: Date;
  tenantId: string;
}

/**
 * Terminal Storage Record
 */
export interface TerminalStorage {
  id: string;
  jobId: string;
  
  // Terminal Information
  terminalName: string;
  terminalType: 'storage' | 'collection' | 'drop_off';
  
  // Timing
  dateIn: Date;
  dateOut?: Date;
  storageDays?: number;
  
  // Container
  containerNumber?: string;
  containerStatus?: 'full' | 'empty';
  
  // Costs
  storageRate?: number; // Per day
  storageCost?: number;
  
  // Metadata
  createdAt: Date;
  tenantId: string;
}

/**
 * Financial Record
 */
export interface FinancialRecord {
  id: string;
  jobId: string;
  
  // Cost Components
  agreedRate?: number;
  costTRP?: number;
  otherExpenses?: number;
  detentionCost?: number;
  storageCost?: number;
  clearanceFees?: number;
  bridgeClearanceFees?: number;
  overWeightCharge?: number;
  othersAmount?: number;
  
  // Totals
  totalCost: number;
  totalRevenue?: number;
  profit?: number;
  profitMargin?: number; // percentage
  
  // Currency
  currency: string;
  exchangeRate?: number;
  
  // Payment
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount?: number;
  dueAmount?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

/**
 * CSV Import Mapping
 */
export interface CSVImportMapping {
  recordId: string;
  jobName: string;
  jobNumber: string;
  jobType: string;
  // ... all CSV fields mapped
}

/**
 * TMS Analytics
 */
export interface TMSAnalytics {
  // Job Statistics
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  pendingJobs: number;
  
  // Performance Metrics
  averageTransitTime: number;
  onTimeDeliveryRate: number;
  averageDetentionDays: number;
  
  // Financial Metrics
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageProfitMargin: number;
  
  // Lane Performance
  topPerformingLanes: Array<{
    laneId: string;
    laneName: string;
    jobCount: number;
    averageTransitTime: number;
    onTimeRate: number;
  }>;
  
  // Time Period
  periodStart: Date;
  periodEnd: Date;
  tenantId: string;
}

