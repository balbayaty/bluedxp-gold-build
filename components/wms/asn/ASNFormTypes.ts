/**
 * ASN Form Types - Comprehensive Type Definitions
 * 
 * Supports all fields needed for world-class ASN creation
 */

import { ASNPriority, ASNSource, ASNItemStatus } from "@/types/asn";

// Shipment modes
export enum ShipmentMode {
  ROAD = "road",
  SEA = "sea",
  AIR = "air",
  RAIL = "rail",
  MULTIMODAL = "multimodal",
}

// Incoterms 2020
export enum Incoterm {
  EXW = "EXW", // Ex Works
  FCA = "FCA", // Free Carrier
  CPT = "CPT", // Carriage Paid To
  CIP = "CIP", // Carriage and Insurance Paid To
  DAP = "DAP", // Delivered at Place
  DPU = "DPU", // Delivered at Place Unloaded
  DDP = "DDP", // Delivered Duty Paid
  FAS = "FAS", // Free Alongside Ship
  FOB = "FOB", // Free on Board
  CFR = "CFR", // Cost and Freight
  CIF = "CIF", // Cost, Insurance and Freight
}

// Delivery type
export enum DeliveryType {
  VENDOR_DELIVERY = "VENDOR_DELIVERY",
  EX_WORKS = "EX_WORKS",
  CUSTOMER_PICKUP = "CUSTOMER_PICKUP",
  CROSS_DOCK = "CROSS_DOCK",
}

// Temperature requirements
export enum TemperatureRequirement {
  AMBIENT = "ambient",
  CHILLED = "chilled",
  FROZEN = "frozen",
  CONTROLLED = "controlled",
}

// Hazmat classes
export enum HazmatClass {
  NONE = "none",
  CLASS_1 = "class_1_explosives",
  CLASS_2 = "class_2_gases",
  CLASS_3 = "class_3_flammable_liquids",
  CLASS_4 = "class_4_flammable_solids",
  CLASS_5 = "class_5_oxidizers",
  CLASS_6 = "class_6_toxic",
  CLASS_7 = "class_7_radioactive",
  CLASS_8 = "class_8_corrosive",
  CLASS_9 = "class_9_miscellaneous",
}

// Units of measure
export const UNITS_OF_MEASURE = [
  { value: "EA", label: "Each (EA)" },
  { value: "CS", label: "Case (CS)" },
  { value: "CTN", label: "Carton (CTN)" },
  { value: "PLT", label: "Pallet (PLT)" },
  { value: "KG", label: "Kilogram (KG)" },
  { value: "MT", label: "Metric Ton (MT)" },
  { value: "LTR", label: "Liter (LTR)" },
  { value: "M3", label: "Cubic Meter (M³)" },
  { value: "BOX", label: "Box (BOX)" },
  { value: "DRUM", label: "Drum (DRUM)" },
  { value: "BAG", label: "Bag (BAG)" },
  { value: "ROLL", label: "Roll (ROLL)" },
];

// Currencies
export const CURRENCIES = [
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

// Form step interface
export interface FormStep {
  id: string;
  title: string;
  icon: string;
  description: string;
}

// ASN form steps
export const ASN_FORM_STEPS: FormStep[] = [
  { id: "vendor", title: "Supplier & Customer", icon: "ri-store-2-line", description: "Vendor and customer details" },
  { id: "shipment", title: "Shipment Details", icon: "ri-ship-line", description: "Mode, carrier, and tracking" },
  { id: "items", title: "Line Items", icon: "ri-list-check-2", description: "Products and quantities" },
  { id: "schedule", title: "Scheduling", icon: "ri-calendar-line", description: "Dates and appointments" },
  { id: "handling", title: "Special Handling", icon: "ri-shield-star-line", description: "Temperature, hazmat, instructions" },
  { id: "documents", title: "Documents", icon: "ri-file-upload-line", description: "Attach required documents" },
  { id: "review", title: "Review & Submit", icon: "ri-checkbox-circle-line", description: "Final review before submission" },
];

// ASN Line Item interface
export interface ASNLineItem {
  id: string;
  lineNumber: number;
  sku: string;
  skuDescription: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
  
  // Batch & Serial
  batchNumber?: string;
  serialNumbers?: string[];
  lotNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  
  // Dimensions & Weight
  grossWeight?: number;
  netWeight?: number;
  weightUnit: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit: string;
  volume?: number;
  
  // Packaging
  packagingType?: string;
  packagingQuantity?: number;
  palletCount?: number;
  
  // Quality
  qualityGrade?: string;
  inspectionRequired: boolean;
  
  // Location
  suggestedLocation?: string;
  
  // Customs
  hsCode?: string;
  countryOfOrigin?: string;
  
  // Status
  status: ASNItemStatus;
}

// ASN Document interface
export interface ASNDocumentData {
  id: string;
  type: string;
  name: string;
  file?: File;
  url?: string;
  uploadProgress?: number;
  uploaded: boolean;
}

// Complete ASN Form Data interface
export interface ASNFormData {
  // Header
  asnNumber: string;
  
  // Vendor/Supplier
  supplierId: string;
  supplierName: string;
  supplierAddress?: string;
  supplierContact?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  
  // Customer (Owner of goods)
  customerId: string;
  customerName: string;
  customerNumber: string;
  customerContact?: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Purchase Order
  purchaseOrderNumber?: string;
  salesOrderNumber?: string;
  referenceNumber?: string;
  
  // Warehouse/Destination
  warehouseId: string;
  warehouseName?: string;
  plant?: string;
  storageLocation?: string;
  receivingDock?: string;
  
  // Shipment Details
  shipmentMode: ShipmentMode;
  carrierCode?: string;
  carrierName?: string;
  trackingNumber?: string;
  vehiclePlateNumber?: string;
  driverName?: string;
  driverPhone?: string;
  containerNumber?: string;
  sealNumber?: string;
  billOfLading?: string;
  
  // Incoterms & Delivery
  incoterm?: Incoterm;
  incotermLocation?: string;
  deliveryType: DeliveryType;
  
  // Origin & Destination
  shipFromCountry?: string;
  shipFromCity?: string;
  shipFromAddress?: string;
  shipToCountry?: string;
  shipToCity?: string;
  shipToAddress?: string;
  
  // Scheduling
  shipDate?: string;
  expectedArrivalDate: string;
  expectedArrivalTime?: string;
  appointmentNumber?: string;
  appointmentDate?: string;
  appointmentTimeSlot?: string;
  
  // Totals
  totalItems: number;
  totalQuantity: number;
  totalGrossWeight?: number;
  totalNetWeight?: number;
  weightUnit: string;
  totalVolume?: number;
  volumeUnit: string;
  totalPallets?: number;
  totalValue: number;
  currency: string;
  
  // Special Handling
  temperatureRequirement: TemperatureRequirement;
  minTemperature?: number;
  maxTemperature?: number;
  hazmatClass: HazmatClass;
  unNumber?: string;
  properShippingName?: string;
  fragile: boolean;
  stackable: boolean;
  specialInstructions?: string;
  
  // Compliance
  requiresInspection: boolean;
  inspectionType?: string;
  requiresCertificate: boolean;
  certificateTypes?: string[];
  customsCleared: boolean;
  customsDeclarationNumber?: string;
  
  // Priority & Status
  priority: ASNPriority;
  source: ASNSource;
  
  // Line Items
  items: ASNLineItem[];
  
  // Documents
  documents: ASNDocumentData[];
  
  // Notes & Tags
  notes?: string;
  tags?: string[];
  
  // Metadata
  metadata: Record<string, unknown>;
  tenantId: string;
}

// Initial form state
export const initialASNFormData: Partial<ASNFormData> = {
  asnNumber: "",
  supplierId: "",
  supplierName: "",
  customerId: "",
  customerName: "",
  customerNumber: "",
  warehouseId: "",
  purchaseOrderNumber: "",
  shipmentMode: ShipmentMode.ROAD,
  deliveryType: DeliveryType.VENDOR_DELIVERY,
  expectedArrivalDate: "",
  totalItems: 0,
  totalQuantity: 0,
  totalValue: 0,
  currency: "SAR",
  weightUnit: "KG",
  volumeUnit: "M3",
  temperatureRequirement: TemperatureRequirement.AMBIENT,
  hazmatClass: HazmatClass.NONE,
  fragile: false,
  stackable: true,
  requiresInspection: false,
  requiresCertificate: false,
  customsCleared: false,
  priority: ASNPriority.NORMAL,
  source: ASNSource.MANUAL,
  items: [],
  documents: [],
  tags: [],
  metadata: {},
  tenantId: "default-tenant",
};

// Default line item
export const createDefaultLineItem = (lineNumber: number): ASNLineItem => ({
  id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  lineNumber,
  sku: "",
  skuDescription: "",
  description: "",
  quantity: 1,
  unitOfMeasure: "EA",
  unitPrice: 0,
  totalPrice: 0,
  weightUnit: "KG",
  dimensionUnit: "CM",
  inspectionRequired: false,
  status: ASNItemStatus.PENDING,
});
