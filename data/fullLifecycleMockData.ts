// Full Lifecycle Mock Data - Complete inbound and outbound orders with all lifecycle stages
// This demonstrates the complete data cycle from creation to completion

import { ASNData, OrderStatus, ASNStatus, LoadSetup } from '@/types/asn'

// ========== INBOUND ASN - FULL LIFECYCLE ==========
export const fullLifecycleInboundASN: ASNData = {
  // Document Identification
  id: 'ASN-INB-001',
  documentNumber: 'ASN-2024-001',
  externalReference: 'VND-REF-001',
  purchaseOrderNumber: 'PO-2024-001',
  materialDocumentNumber: 'MAT-DOC-001',
  
  // Entity Information
  entity: 'K-SIKA',
  plant: 'PLANT-DXB-001',
  storageLocation: 'SL-A-01',
  costCenter: 'CC-WH-001',
  
  // Vendor/Supplier Information
  vendorNumber: 'VND-001',
  vendorName: 'Sika Manufacturing Ltd',
  vendorAddress: '123 Industrial Street, Dubai, UAE',
  deliveryType: 'VENDOR_DELIVERY',
  
  // Customer Information
  customerNumber: 'CUST-001',
  customerName: 'Sika Middle East',
  
  // Shipment Information
  shipmentNumber: 'SHIP-2024-001',
  carrier: 'DHL Logistics',
  trackingNumber: 'TRK-123456789',
  billOfLading: 'BOL-2024-001',
  expectedDeliveryDate: '2024-11-01T08:00:00Z',
  actualDeliveryDate: '2024-11-01T07:35:00Z',
  plannedGoodsReceiptDate: '2024-11-01T09:00:00Z',
  
  // Email/ASN Receipt
  emailDate: '2024-10-31',
  emailTime: '14:30',
  emailTime2: '2024-10-31T14:30:00Z',
  
  // Vehicle Arrival
  vehicleArrivalDate: '2024-11-01',
  vehicleArrivalTime: '07:35',
  vehicleId: 'TRUCK-AED-1234',
  truckDriverName: 'Ahmed Al Mansoori',
  vehicleType: 'TRUCK',
  containerSealNumber: 'SEAL-001',
  vehicleInspectionComment: 'Vehicle in good condition',
  photoBeforeOffloading: 'Taken',
  
  // Enhanced Carrier/Driver Information
  carrierName: 'DHL Logistics',
  driverName: 'Ahmed Al Mansoori',
  driverId: 'ID-123456',
  driverLicenseNumber: 'DL-AED-789012',
  driverLicensePhoto: '/photos/driver-license-001.jpg',
  driverPhoneNumber: '+971501234567',
  truckPlateNumber: 'AED-1234',
  truckType: 'Flatbed Truck',
  truckOrigin: 'Dubai Port',
  truckPhoto: '/photos/truck-001.jpg',
  truckPaperwork: '/photos/truck-paperwork-001.pdf',
  arrivedOnTime: true,
  arrivalDeviation: -25, // 25 minutes early
  waitingTimeUponArrival: 15, // 15 minutes waiting
  arrivalTimestamp: '2024-11-01T07:35:00Z',
  expectedArrivalTimestamp: '2024-11-01T08:00:00Z',
  
  // Offloading Execution
  offloadingDate: '2024-11-01',
  offloadingStartTime: '2024-11-01T07:50:00Z',
  offloadingEndTime: '2024-11-01T09:15:00Z',
  offloadingDuration: 5100, // 85 minutes in seconds
  forklift1: 'FL-001',
  forklift2: 'FL-002',
  offloadingForkliftDriver: 'Mohammed Hassan',
  offloadingPersonnel: ['Mohammed Hassan', 'Ali Ahmed', 'Omar Khalid'],
  offloadingEquipment: ['FL-001', 'FL-002'],
  
  // Putaway Execution
  putawayDate: '2024-11-01',
  putawayStartTime: '2024-11-01T09:30:00Z',
  putawayEndTime: '2024-11-01T11:45:00Z',
  putawayDuration: 8100, // 135 minutes in seconds
  putawayForkliftDriver: 'Khalid Ibrahim',
  putawayForklift1: 'FL-001',
  putawayForklift2: 'FL-003',
  locationAllocated: 'A-01-15',
  locationAllocatedFlag: true,
  putawayPersonnel: ['Khalid Ibrahim', 'Saeed Al Zaabi'],
  putawayEquipment: ['FL-001', 'FL-003'],
  
  // Quality/Operations (Inbound)
  qcCheckStatus: 'Completed',
  ncr: undefined,
  operationOfficerName: 'Yusuf Al Maktoum',
  
  // Goods Receipt Information
  goodsReceiptDate: '2024-11-01T11:45:00Z',
  goodsReceiptNumber: 'GR-2024-001',
  receivedBy: 'Yusuf Al Maktoum',
  receivedQuantity: 50,
  receivedWeight: 2500, // kg
  receivedItems: 50,
  
  // Status and Workflow
  status: 'GR_POSTED' as ASNStatus,
  priority: 'HIGH',
  complianceStatus: 'COMPLIANT',
  processStatus: 'COMPLETED',
  
  // SLA Compliance Information
  slaComplianceStatus: 'COMPLIANT',
  slaId: 'SLA-INB-001',
  slaTargetDuration: 14400, // 4 hours
  slaActualDuration: 13500, // 3.75 hours
  slaCompliancePercentage: 93.75,
  
  // Dates and Timestamps
  createdAt: '2024-10-31T14:30:00Z',
  createdBy: 'SYSTEM',
  lastUpdate: '2024-11-01T11:45:00Z',
  changedBy: 'Yusuf Al Maktoum',
  
  // Location Information
  destination: 'muzaffar',
  locationName: 'muzaffar',
  
  // Material Information
  totalItems: 50,
  totalQuantity: 50,
  totalWeight: 2500,
  totalVolume: 125, // m³
  baseUnit: 'EA',
  
  // Processing Information
  duration1: 5100, // Offloading duration
  duration2: 8100, // Putaway duration
  code: 'ASN-2024-001',
  personnel: 'Yusuf Al Maktoum',
  assetType: 'TRAILER',
  assetId: 'TRUCK-AED-1234',
  action: 'Received',
  outcome: 'Completed',
  category: 'Standard',
  confirmation: true,
  
  // Additional ERP Fields
  transactionCode: 'GR01',
  workCenter: 'WC-WH-001',
  batchNumber: 'BATCH-2024-001',
  serialNumber: undefined,
  qualityStatus: 'PASSED',
  inspectionLot: 'INSP-001',
  
  // Process Type Metadata
  processType: 'INBOUND',
  documentType: 'ASN',
  
  // Overtime Tracking
  employeeStandardHours: 8,
  employeeOvertimeHours: 0.5,
  employeeBreakHours: 1,
  employeePreShiftHours: 0,
  equipmentStandardHours: 8,
  equipmentOvertimeHours: 0.5,
  equipmentBreakHours: 1,
  equipmentPreShiftHours: 0,
}

// ========== OUTBOUND ORDER - FULL LIFECYCLE ==========
export const fullLifecycleOutboundOrder: ASNData = {
  // Document Identification
  id: 'ORD-OUT-001',
  documentNumber: 'ORD-2024-001',
  externalReference: 'CUST-REF-001',
  purchaseOrderNumber: 'PO-2024-002',
  materialDocumentNumber: 'MAT-DOC-002',
  
  // Entity Information
  entity: 'K-SIKA',
  plant: 'PLANT-DXB-001',
  storageLocation: 'SL-A-01',
  costCenter: 'CC-WH-001',
  
  // Vendor/Supplier Information (for outbound, this is the warehouse)
  vendorNumber: 'WH-001',
  vendorName: 'Hazalyze Warehouse',
  
  // Customer Information
  customerNumber: 'CUST-002',
  customerName: 'ABC Construction LLC',
  
  // Order/Pick List Information
  plProjectDnNumber: 'PL-2024-001',
  orderType: 'STANDARD',
  orderCycleId: 'CYCLE-STD-001',
  erpSystem: 'SAP',
  plEmailDate: '2024-11-01',
  plEmailTime: '08:00',
  plEmailDateTime: '2024-11-01T08:00:00Z',
  plStatus: 'RELEASED',
  plIssuingDate: '2024-11-01',
  plIssuingTime: '08:15',
  plIssuingDateTime: '2024-11-01T08:15:00Z',
  plCreating: 'SYSTEM',
  customersClientName: 'ABC Construction LLC',
  remarks: 'Urgent delivery required',
  remarks2: 'Handle with care',
  remarks3: 'Fragile items',
  remarks5: 'Customer will inspect on delivery',
  
  // Order Confirmation
  orderConfirmedAt: '2024-11-01T08:30:00Z',
  orderConfirmedBy: 'Customer Service',
  confirmationNumber: 'CONF-2024-001',
  
  // Pick Release
  pickReleasedAt: '2024-11-01T08:45:00Z',
  pickReleasedBy: 'Warehouse Manager',
  pickReleaseNumber: 'PR-2024-001',
  
  // Assignment
  assignedBy: 'Warehouse Manager',
  assigningDate: '2024-11-01',
  assigningTime: '08:50',
  assignedPerson: 'Hassan Ali',
  
  // Picking Execution
  pickingDate: '2024-11-01',
  pickingStartTime: '2024-11-01T09:00:00Z',
  pickingEndTime: '2024-11-01T10:30:00Z',
  plTime: 5400, // 90 minutes in seconds
  pickingDuration: 5400,
  pickingPersonnel: ['Hassan Ali', 'Fatima Al Zaabi', 'Omar Khalid'],
  pickingEquipment: ['FL-001', 'FL-002'],
  
  // Quality Check (Outbound)
  qcDate: '2024-11-01',
  qcStartTime: '2024-11-01T10:45:00Z',
  qcEndTime: '2024-11-01T11:15:00Z',
  qcDuration: 1800, // 30 minutes in seconds
  qcPersonnel: ['QC Inspector 1', 'QC Inspector 2'],
  
  // Dispatch Notification
  dispatchNotification: 'Order ready for dispatch',
  
  // Driver/Transporter Arrival (Outbound)
  driverArrivalDate: '2024-11-01',
  driverArrivalTime: '2024-11-01T11:30:00Z',
  transporterName: 'Wajeeh Transport',
  
  // Dispatching Execution
  dispatchingStartDate: '2024-11-01T11:45:00Z',
  dispatchingEndTime: '2024-11-01T12:30:00Z',
  dispatchingDuration: 2700, // 45 minutes in seconds
  photoAfterLoading: 'Taken',
  dispatchingPersonnel: ['Dispatcher 1', 'Loader 1', 'Loader 2'],
  
  // Ship Confirmation (SAP: Ship Confirm, Oracle: Ship Confirm)
  shipConfirmedAt: '2024-11-01T12:35:00Z',
  shipConfirmedBy: 'Warehouse Supervisor',
  shippingNumber: 'SHIP-2024-002',
  waybillNumber: 'WB-2024-001',
  
  // Goods Issue (SAP: Goods Issue)
  goodsIssuedAt: '2024-11-01T12:40:00Z',
  goodsIssuedBy: 'Warehouse Supervisor',
  goodsIssueNumber: 'GI-2024-001',
  
  // Delivery Note (SAP: Delivery Note)
  deliveryNoteIssuedAt: '2024-11-01T12:45:00Z',
  deliveryNoteNumber: 'DN-2024-001',
  deliveryNoteIssuedBy: 'Warehouse Supervisor',
  
  // Invoice/Billing (SAP: Billing, Oracle: Receivables Interface)
  invoicedAt: '2024-11-01T13:00:00Z',
  invoiceNumber: 'INV-2024-001',
  invoiceAmount: 50000,
  invoiceCurrency: 'SAR',
  
  // Order Completion
  orderCompletedAt: '2024-11-01T13:00:00Z',
  orderCompletedBy: 'SYSTEM',
  completionReason: 'Order fulfilled and invoiced',
  
  // Shipment Information
  shipmentNumber: 'SHIP-2024-002',
  carrier: 'Wajeeh Transport',
  trackingNumber: 'TRK-987654321',
  expectedDeliveryDate: '2024-11-02T10:00:00Z',
  actualDeliveryDate: '2024-11-02T09:45:00Z',
  
  // Delivery Preferences
  preferredDeliveryDate: '2024-11-02',
  preferredDeliveryTime: '09:00-12:00',
  deliveryInstructions: 'Call customer 30 minutes before arrival',
  deliveryCity: 'Dubai',
  deliveryAddress: '123 Construction Site, Business Bay, Dubai, UAE',
  deliveryPostalCode: '12345',
  deliveryCountry: 'UAE',
  projectName: 'Dubai Tower Construction',
  
  // Shipment Classification
  shipmentClassification: 'LOCAL_DELIVERY',
  
  // Load Planning & Optimization
  totalCBM: 75, // Cubic meters
  loadSetup: {
    id: 'load-001',
    asnId: 'ORD-OUT-001',
    totalPallets: 30,
    totalWeight: 1500,
    totalVolume: 75,
    totalCBM: 75,
    averagePalletWeight: 50,
    averagePalletVolume: 2.5,
    recommendedTruckTypes: [
      {
        truckType: 'Flatbed Truck',
        capacity: 2000,
        volume: 80,
        suitabilityScore: 95,
        estimatedCost: 500,
        estimatedTransitTime: 2,
      },
    ],
    loadOptimization: {
      utilizationPercentage: 93.75,
      weightUtilization: 75,
      volumeUtilization: 93.75,
      palletArrangement: '2x15 stacked',
      stackingHeight: 2,
      canOptimize: false,
    },
    createdAt: '2024-11-01T08:00:00Z',
    updatedAt: '2024-11-01T08:00:00Z',
  },
  recommendedTruckType: 'Flatbed Truck',
  recommendedTruckCapacity: 2000,
  recommendedTruckVolume: 80,
  
  // Status and Workflow
  status: 'COMPLETED' as OrderStatus,
  orderStatus: 'COMPLETED' as OrderStatus,
  priority: 'HIGH',
  complianceStatus: 'COMPLIANT',
  processStatus: 'COMPLETED',
  
  // SLA Compliance Information
  slaComplianceStatus: 'COMPLIANT',
  slaId: 'SLA-OUT-001',
  slaTargetDuration: 18000, // 5 hours
  slaActualDuration: 16200, // 4.5 hours
  slaCompliancePercentage: 90,
  
  // Dates and Timestamps
  createdAt: '2024-11-01T08:00:00Z',
  createdBy: 'SYSTEM',
  lastUpdate: '2024-11-01T13:00:00Z',
  changedBy: 'SYSTEM',
  
  // Location Information
  destination: 'Dubai',
  locationName: 'Business Bay',
  
  // Material Information
  totalItems: 30,
  totalQuantity: 30,
  totalWeight: 1500,
  totalVolume: 75,
  baseUnit: 'EA',
  
  // Processing Information
  duration1: 5400, // Picking duration
  duration2: 2700, // Dispatching duration
  code: 'ORD-2024-001',
  personnel: 'Hassan Ali',
  assetType: 'TRUCK',
  assetId: 'TRUCK-WAJ-5678',
  action: 'Dispatched',
  outcome: 'Completed',
  category: 'Standard',
  confirmation: true,
  
  // Additional ERP Fields
  transactionCode: 'ORD01',
  workCenter: 'WC-WH-001',
  batchNumber: 'BATCH-2024-002',
  qualityStatus: 'PASSED',
  
  // Process Type Metadata
  processType: 'OUTBOUND',
  documentType: 'DELIVERY_NOTE',
  
  // Outbound Material Information
  numOfPlt: 30,
  driverSignedReceivingDeclaration: 'Yes',
  
  // Overtime Tracking
  employeeStandardHours: 4,
  employeeOvertimeHours: 0,
  employeeBreakHours: 0.5,
  employeePreShiftHours: 0,
  equipmentStandardHours: 4,
  equipmentOvertimeHours: 0,
  equipmentBreakHours: 0.5,
  equipmentPreShiftHours: 0,
  
  // Carrier Pickup Request
  carrierPickupRequested: true,
  carrierPickupRequestedAt: '2024-11-01T11:00:00Z',
  carrierPickupRequestedBy: 'Customer Service',
  carrierPickupStatus: 'COMPLETED',
  wajeehRequestId: 'WAJ-2024-001',
  expectedReadinessTime: '2024-11-01T12:00:00Z',
  carrierAssigned: 'Wajeeh Transport',
  carrierContact: '+971501234567',
  splitDelivery: false,
}

// ========== INBOUND ASN - IN PROGRESS ==========
export const inProgressInboundASN: ASNData = {
  ...fullLifecycleInboundASN,
  id: 'ASN-INB-002',
  documentNumber: 'ASN-2024-002',
  status: 'ARRIVED' as ASNStatus,
  processStatus: 'IN_PROGRESS',
  vehicleArrivalDate: '2024-11-02',
  vehicleArrivalTime: '08:15',
  arrivalTimestamp: '2024-11-02T08:15:00Z',
  expectedArrivalTimestamp: '2024-11-02T08:00:00Z',
  arrivedOnTime: false,
  arrivalDeviation: 15, // 15 minutes late
  waitingTimeUponArrival: 5,
  offloadingStartTime: '2024-11-02T08:20:00Z',
  offloadingEndTime: undefined,
  offloadingDuration: undefined,
  putawayStartTime: undefined,
  putawayEndTime: undefined,
  putawayDuration: undefined,
  goodsReceiptDate: undefined,
  goodsReceiptNumber: undefined,
  receivedBy: undefined,
  slaComplianceStatus: 'WARNING',
  slaActualDuration: undefined,
  slaCompliancePercentage: undefined,
}

// ========== OUTBOUND ORDER - IN PROGRESS ==========
export const inProgressOutboundOrder: ASNData = {
  ...fullLifecycleOutboundOrder,
  id: 'ORD-OUT-002',
  documentNumber: 'ORD-2024-002',
  status: 'PICKING' as OrderStatus,
  orderStatus: 'PICKING' as OrderStatus,
  processStatus: 'IN_PROGRESS',
  orderConfirmedAt: '2024-11-02T09:00:00Z',
  confirmationNumber: 'CONF-2024-002',
  pickReleasedAt: '2024-11-02T09:15:00Z',
  pickReleaseNumber: 'PR-2024-002',
  pickingStartTime: '2024-11-02T09:30:00Z',
  pickingEndTime: undefined,
  pickingDuration: undefined,
  qcStartTime: undefined,
  qcEndTime: undefined,
  qcDuration: undefined,
  driverArrivalDate: undefined,
  driverArrivalTime: undefined,
  dispatchingStartDate: undefined,
  dispatchingEndTime: undefined,
  dispatchingDuration: undefined,
  shipConfirmedAt: undefined,
  goodsIssuedAt: undefined,
  deliveryNoteIssuedAt: undefined,
  invoicedAt: undefined,
  orderCompletedAt: undefined,
  slaComplianceStatus: 'WARNING',
  slaActualDuration: undefined,
  slaCompliancePercentage: undefined,
  // Reset pickup request fields for in-progress order
  carrierPickupRequested: false,
  carrierPickupRequestedAt: undefined,
  carrierPickupRequestedBy: undefined,
  carrierPickupStatus: undefined,
  wajeehRequestId: undefined,
  expectedReadinessTime: undefined,
  carrierAssigned: undefined,
  carrierContact: undefined,
  splitDelivery: undefined,
}

// ========== EXPORT ALL MOCK DATA ==========
export const fullLifecycleMockData = {
  inbound: {
    completed: fullLifecycleInboundASN,
    inProgress: inProgressInboundASN,
  },
  outbound: {
    completed: fullLifecycleOutboundOrder,
    inProgress: inProgressOutboundOrder,
  },
}

