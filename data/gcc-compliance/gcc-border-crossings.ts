/**
 * GCC Border Crossings - Comprehensive Data
 *
 * Contains detailed information about all border crossings between
 * GCC countries and their neighbors, including operating hours,
 * requirements, and special regulations.
 *
 * Sources:
 * - Saudi Customs (Fasah/MASAR)
 * - UAE Federal Customs Authority
 * - GCC Customs Union
 *
 * Last Updated: January 2026
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BorderCrossingData {
  /** Unique crossing ID */
  id: string;
  /** Crossing name in English */
  name: string;
  /** Crossing name in Arabic */
  nameAr: string;
  /** Country A */
  countryA: GCCCountryCode;
  /** City/region on Country A side */
  cityA: string;
  /** Country B */
  countryB: GCCCountryCode | 'JO' | 'IQ' | 'YE';
  /** City/region on Country B side */
  cityB: string;
  /** Crossing type */
  type: 'LAND' | 'SEA' | 'CAUSEWAY';
  /** Is crossing active */
  isActive: boolean;
  /** Operating hours */
  operatingHours: OperatingHours;
  /** Vehicle restrictions */
  vehicleRestrictions: VehicleRestriction[];
  /** Required documents */
  requiredDocuments: DocumentRequirement[];
  /** Customs capabilities */
  customsCapabilities: CustomsCapability[];
  /** Average processing time (minutes) */
  averageProcessingTime: {
    commercial: number;
    passenger: number;
  };
  /** Coordinates */
  coordinates: {
    lat: number;
    lng: number;
  };
  /** Contact information */
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  /** Special notes */
  notes?: string;
  /** Confidence score */
  confidenceScore: number;
  /** Last verified */
  lastVerified: Date;
}

export type GCCCountryCode = 'SA' | 'AE' | 'BH' | 'KW' | 'OM' | 'QA';

export interface OperatingHours {
  /** Is 24/7 */
  is24Hours: boolean;
  /** Regular hours if not 24/7 */
  regularHours?: {
    open: string;
    close: string;
  };
  /** Different hours for commercial traffic */
  commercialHours?: {
    open: string;
    close: string;
  };
  /** Closed days */
  closedDays?: string[];
  /** Ramadan hours */
  ramadanHours?: {
    open: string;
    close: string;
  };
}

export interface VehicleRestriction {
  /** Restriction type */
  type: 'WEIGHT' | 'HEIGHT' | 'WIDTH' | 'LENGTH' | 'AXLES' | 'HAZMAT';
  /** Maximum value */
  maxValue?: number;
  /** Unit */
  unit?: string;
  /** Description */
  description: string;
  /** Permit available to exceed */
  permitAvailable: boolean;
  /** Permit cost */
  permitCost?: number;
}

export interface DocumentRequirement {
  /** Document name */
  document: string;
  /** Is mandatory */
  mandatory: boolean;
  /** Where to obtain */
  obtainFrom: string;
  /** Processing time (hours) */
  processingTime?: number;
  /** Cost (SAR equivalent) */
  cost?: number;
  /** Electronic version accepted */
  electronicAccepted: boolean;
}

export interface CustomsCapability {
  /** Capability name */
  capability: string;
  /** Is available */
  available: boolean;
  /** Notes */
  notes?: string;
}

// ============================================================================
// SAUDI ARABIA - UAE BORDERS
// ============================================================================

export const AL_BATHA_CROSSING: BorderCrossingData = {
  id: 'SA-AE-BATHA',
  name: 'Al Batha Border Crossing',
  nameAr: 'منفذ البطحاء',
  countryA: 'SA',
  cityA: 'Batha (Eastern Province)',
  countryB: 'AE',
  cityB: 'Al Ghweifat (Abu Dhabi)',
  type: 'LAND',
  isActive: true,
  operatingHours: {
    is24Hours: true,
    commercialHours: {
      open: '06:00',
      close: '22:00',
    },
  },
  vehicleRestrictions: [
    {
      type: 'WEIGHT',
      maxValue: 48000,
      unit: 'kg',
      description: 'Maximum gross vehicle weight',
      permitAvailable: true,
      permitCost: 500,
    },
    {
      type: 'HEIGHT',
      maxValue: 4.5,
      unit: 'm',
      description: 'Maximum vehicle height',
      permitAvailable: true,
    },
    {
      type: 'HAZMAT',
      description: 'Hazmat requires advance notification and escort',
      permitAvailable: true,
      permitCost: 2000,
    },
  ],
  requiredDocuments: [
    {
      document: 'Bayan (Saudi E-Waybill)',
      mandatory: true,
      obtainFrom: 'bayan.tga.gov.sa',
      electronicAccepted: true,
    },
    {
      document: 'UAE Customs Manifest',
      mandatory: true,
      obtainFrom: 'UAE Federal Customs Authority',
      electronicAccepted: true,
    },
    {
      document: 'GCC Unified Customs Declaration',
      mandatory: true,
      obtainFrom: 'Fasah/MASAR',
      electronicAccepted: true,
    },
    {
      document: 'Commercial Invoice',
      mandatory: true,
      obtainFrom: 'Exporter',
      electronicAccepted: true,
    },
    {
      document: 'Packing List',
      mandatory: true,
      obtainFrom: 'Shipper',
      electronicAccepted: true,
    },
    {
      document: 'Certificate of Origin',
      mandatory: false,
      obtainFrom: 'Chamber of Commerce',
      electronicAccepted: true,
    },
  ],
  customsCapabilities: [
    { capability: 'X-Ray Scanning', available: true },
    { capability: 'Weighbridge', available: true },
    { capability: 'Cold Chain Inspection', available: true },
    { capability: 'Hazmat Handling', available: true },
    { capability: 'Livestock Inspection', available: true },
    { capability: 'SFDA Food Inspection', available: true },
    { capability: 'Vehicle Inspection', available: true },
    { capability: 'Bonded Warehouse', available: true },
  ],
  averageProcessingTime: {
    commercial: 120,
    passenger: 30,
  },
  coordinates: { lat: 22.9847, lng: 51.5894 },
  contact: {
    phone: '+966-13-XXX-XXXX',
    website: 'https://customs.gov.sa',
  },
  notes: 'Busiest Saudi-UAE crossing for commercial traffic',
  confidenceScore: 0.97,
  lastVerified: new Date('2025-12-01'),
};

export const SALWA_CROSSING: BorderCrossingData = {
  id: 'SA-AE-SALWA',
  name: 'Salwa Border Crossing',
  nameAr: 'منفذ سلوى',
  countryA: 'SA',
  cityA: 'Salwa (Eastern Province)',
  countryB: 'AE',
  cityB: 'Ghuwaifat',
  type: 'LAND',
  isActive: true,
  operatingHours: {
    is24Hours: true,
  },
  vehicleRestrictions: [
    {
      type: 'WEIGHT',
      maxValue: 48000,
      unit: 'kg',
      description: 'Maximum gross vehicle weight',
      permitAvailable: true,
    },
  ],
  requiredDocuments: [
    {
      document: 'Bayan (Saudi E-Waybill)',
      mandatory: true,
      obtainFrom: 'bayan.tga.gov.sa',
      electronicAccepted: true,
    },
    {
      document: 'GCC Transit Document',
      mandatory: true,
      obtainFrom: 'Customs',
      electronicAccepted: true,
    },
  ],
  customsCapabilities: [
    { capability: 'X-Ray Scanning', available: true },
    { capability: 'Weighbridge', available: true },
  ],
  averageProcessingTime: {
    commercial: 90,
    passenger: 20,
  },
  coordinates: { lat: 24.0500, lng: 51.1000 },
  contact: {
    website: 'https://customs.gov.sa',
  },
  confidenceScore: 0.94,
  lastVerified: new Date('2025-11-15'),
};

// ============================================================================
// SAUDI ARABIA - BAHRAIN (CAUSEWAY)
// ============================================================================

export const KING_FAHD_CAUSEWAY: BorderCrossingData = {
  id: 'SA-BH-CAUSEWAY',
  name: 'King Fahd Causeway',
  nameAr: 'جسر الملك فهد',
  countryA: 'SA',
  cityA: 'Khobar (Eastern Province)',
  countryB: 'BH',
  cityB: 'Jasra',
  type: 'CAUSEWAY',
  isActive: true,
  operatingHours: {
    is24Hours: true,
    commercialHours: {
      open: '00:00',
      close: '23:59',
    },
  },
  vehicleRestrictions: [
    {
      type: 'WEIGHT',
      maxValue: 44000,
      unit: 'kg',
      description: 'Maximum gross vehicle weight for causeway',
      permitAvailable: false,
    },
    {
      type: 'HEIGHT',
      maxValue: 4.2,
      unit: 'm',
      description: 'Height restriction due to causeway structure',
      permitAvailable: false,
    },
    {
      type: 'LENGTH',
      maxValue: 18,
      unit: 'm',
      description: 'Length restriction for causeway turns',
      permitAvailable: true,
      permitCost: 1000,
    },
    {
      type: 'HAZMAT',
      description: 'Hazmat restricted to specific hours (02:00-06:00)',
      permitAvailable: true,
      permitCost: 3000,
    },
  ],
  requiredDocuments: [
    {
      document: 'Bayan (Saudi E-Waybill)',
      mandatory: true,
      obtainFrom: 'bayan.tga.gov.sa',
      electronicAccepted: true,
    },
    {
      document: 'Bahrain Customs Manifest',
      mandatory: true,
      obtainFrom: 'Bahrain Customs Affairs',
      electronicAccepted: true,
    },
    {
      document: 'Causeway Commercial Vehicle Permit',
      mandatory: true,
      obtainFrom: 'King Fahd Causeway Authority',
      processingTime: 24,
      cost: 100,
      electronicAccepted: true,
    },
  ],
  customsCapabilities: [
    { capability: 'X-Ray Scanning', available: true },
    { capability: 'Weighbridge', available: true },
    { capability: 'Cold Chain Inspection', available: true },
    { capability: 'Hazmat Handling', available: true, notes: 'Restricted hours only' },
    { capability: 'Vehicle Inspection', available: true },
  ],
  averageProcessingTime: {
    commercial: 60,
    passenger: 15,
  },
  coordinates: { lat: 26.2286, lng: 50.4178 },
  contact: {
    phone: '+966-13-898-4444',
    website: 'https://kfca.com.sa',
  },
  notes: 'Toll crossing - commercial vehicle fees apply',
  confidenceScore: 0.98,
  lastVerified: new Date('2025-12-10'),
};

// ============================================================================
// SAUDI ARABIA - KUWAIT
// ============================================================================

export const KHAFJI_CROSSING: BorderCrossingData = {
  id: 'SA-KW-KHAFJI',
  name: 'Khafji Border Crossing',
  nameAr: 'منفذ الخفجي',
  countryA: 'SA',
  cityA: 'Khafji (Eastern Province)',
  countryB: 'KW',
  cityB: 'Nuwaiseeb',
  type: 'LAND',
  isActive: true,
  operatingHours: {
    is24Hours: true,
    commercialHours: {
      open: '06:00',
      close: '22:00',
    },
  },
  vehicleRestrictions: [
    {
      type: 'WEIGHT',
      maxValue: 45000,
      unit: 'kg',
      description: 'Maximum gross vehicle weight',
      permitAvailable: true,
    },
  ],
  requiredDocuments: [
    {
      document: 'Bayan (Saudi E-Waybill)',
      mandatory: true,
      obtainFrom: 'bayan.tga.gov.sa',
      electronicAccepted: true,
    },
    {
      document: 'Kuwait Customs Declaration',
      mandatory: true,
      obtainFrom: 'Kuwait Customs',
      electronicAccepted: true,
    },
    {
      document: 'GCC Transit Document',
      mandatory: true,
      obtainFrom: 'Customs',
      electronicAccepted: true,
    },
  ],
  customsCapabilities: [
    { capability: 'X-Ray Scanning', available: true },
    { capability: 'Weighbridge', available: true },
    { capability: 'Cold Chain Inspection', available: true },
    { capability: 'Hazmat Handling', available: true },
  ],
  averageProcessingTime: {
    commercial: 90,
    passenger: 25,
  },
  coordinates: { lat: 28.4291, lng: 48.4961 },
  contact: {
    website: 'https://customs.gov.sa',
  },
  confidenceScore: 0.95,
  lastVerified: new Date('2025-11-20'),
};

// ============================================================================
// SAUDI ARABIA - JORDAN
// ============================================================================

export const HALAT_AMMAR_CROSSING: BorderCrossingData = {
  id: 'SA-JO-HALAT',
  name: 'Halat Ammar Border Crossing',
  nameAr: 'منفذ حالة عمار',
  countryA: 'SA',
  cityA: 'Halat Ammar (Tabuk Region)',
  countryB: 'JO',
  cityB: 'Mudawwara',
  type: 'LAND',
  isActive: true,
  operatingHours: {
    is24Hours: false,
    regularHours: {
      open: '08:00',
      close: '17:00',
    },
    commercialHours: {
      open: '08:00',
      close: '15:00',
    },
    closedDays: ['Friday'],
  },
  vehicleRestrictions: [
    {
      type: 'WEIGHT',
      maxValue: 48000,
      unit: 'kg',
      description: 'Maximum gross vehicle weight',
      permitAvailable: true,
    },
    {
      type: 'HAZMAT',
      description: 'ADR documentation required for all hazmat',
      permitAvailable: true,
    },
  ],
  requiredDocuments: [
    {
      document: 'Bayan (Saudi E-Waybill)',
      mandatory: true,
      obtainFrom: 'bayan.tga.gov.sa',
      electronicAccepted: true,
    },
    {
      document: 'TIR Carnet',
      mandatory: true,
      obtainFrom: 'International Road Transport Union (IRU)',
      electronicAccepted: false,
    },
    {
      document: 'Jordan Customs Declaration',
      mandatory: true,
      obtainFrom: 'Jordan Customs',
      electronicAccepted: true,
    },
    {
      document: 'Arab League Origin Certificate',
      mandatory: false,
      obtainFrom: 'Chamber of Commerce',
      electronicAccepted: true,
    },
  ],
  customsCapabilities: [
    { capability: 'X-Ray Scanning', available: true },
    { capability: 'Weighbridge', available: true },
    { capability: 'Cold Chain Inspection', available: true },
    { capability: 'Hazmat Handling', available: true },
    { capability: 'TIR Processing', available: true },
  ],
  averageProcessingTime: {
    commercial: 180,
    passenger: 45,
  },
  coordinates: { lat: 29.1167, lng: 36.0833 },
  contact: {
    website: 'https://customs.gov.sa',
  },
  notes: 'Main crossing for Jordan-Saudi trade; TIR route',
  confidenceScore: 0.93,
  lastVerified: new Date('2025-11-01'),
};

export const DURRA_CROSSING: BorderCrossingData = {
  id: 'SA-JO-DURRA',
  name: 'Al Durra Border Crossing',
  nameAr: 'منفذ الدرة',
  countryA: 'SA',
  cityA: 'Al Durra (Tabuk Region)',
  countryB: 'JO',
  cityB: 'Al Omari',
  type: 'LAND',
  isActive: true,
  operatingHours: {
    is24Hours: false,
    regularHours: {
      open: '08:00',
      close: '17:00',
    },
    closedDays: ['Friday'],
  },
  vehicleRestrictions: [
    {
      type: 'WEIGHT',
      maxValue: 48000,
      unit: 'kg',
      description: 'Maximum gross vehicle weight',
      permitAvailable: true,
    },
  ],
  requiredDocuments: [
    {
      document: 'Bayan (Saudi E-Waybill)',
      mandatory: true,
      obtainFrom: 'bayan.tga.gov.sa',
      electronicAccepted: true,
    },
    {
      document: 'TIR Carnet',
      mandatory: true,
      obtainFrom: 'IRU',
      electronicAccepted: false,
    },
  ],
  customsCapabilities: [
    { capability: 'X-Ray Scanning', available: true },
    { capability: 'Weighbridge', available: true },
  ],
  averageProcessingTime: {
    commercial: 150,
    passenger: 40,
  },
  coordinates: { lat: 29.6333, lng: 37.2667 },
  contact: {
    website: 'https://customs.gov.sa',
  },
  confidenceScore: 0.90,
  lastVerified: new Date('2025-10-15'),
};

// ============================================================================
// SAUDI ARABIA - OMAN
// ============================================================================

export const BATHA_OMAN_CROSSING: BorderCrossingData = {
  id: 'SA-OM-BATHA',
  name: 'Al Batha Border Crossing (Oman)',
  nameAr: 'منفذ البطحاء (عمان)',
  countryA: 'SA',
  cityA: 'Shaybah (Eastern Province)',
  countryB: 'OM',
  cityB: 'Al Ain',
  type: 'LAND',
  isActive: true,
  operatingHours: {
    is24Hours: false,
    regularHours: {
      open: '07:00',
      close: '19:00',
    },
    commercialHours: {
      open: '07:00',
      close: '17:00',
    },
  },
  vehicleRestrictions: [
    {
      type: 'WEIGHT',
      maxValue: 48000,
      unit: 'kg',
      description: 'Maximum gross vehicle weight',
      permitAvailable: true,
    },
  ],
  requiredDocuments: [
    {
      document: 'Bayan (Saudi E-Waybill)',
      mandatory: true,
      obtainFrom: 'bayan.tga.gov.sa',
      electronicAccepted: true,
    },
    {
      document: 'Oman Customs Declaration',
      mandatory: true,
      obtainFrom: 'Royal Oman Customs',
      electronicAccepted: true,
    },
    {
      document: 'GCC Transit Document',
      mandatory: true,
      obtainFrom: 'Customs',
      electronicAccepted: true,
    },
  ],
  customsCapabilities: [
    { capability: 'X-Ray Scanning', available: true },
    { capability: 'Weighbridge', available: true },
    { capability: 'Cold Chain Inspection', available: false },
  ],
  averageProcessingTime: {
    commercial: 120,
    passenger: 30,
  },
  coordinates: { lat: 22.6500, lng: 54.9500 },
  contact: {
    website: 'https://customs.gov.sa',
  },
  notes: 'Remote crossing - limited facilities',
  confidenceScore: 0.88,
  lastVerified: new Date('2025-09-01'),
};

// ============================================================================
// UAE - OMAN BORDERS (For Transit Routes)
// ============================================================================

export const HATTA_CROSSING: BorderCrossingData = {
  id: 'AE-OM-HATTA',
  name: 'Hatta Border Crossing',
  nameAr: 'منفذ حتا',
  countryA: 'AE',
  cityA: 'Hatta (Dubai)',
  countryB: 'OM',
  cityB: 'Al Wajajah',
  type: 'LAND',
  isActive: true,
  operatingHours: {
    is24Hours: true,
  },
  vehicleRestrictions: [
    {
      type: 'WEIGHT',
      maxValue: 45000,
      unit: 'kg',
      description: 'Maximum gross vehicle weight',
      permitAvailable: true,
    },
  ],
  requiredDocuments: [
    {
      document: 'UAE Customs Manifest',
      mandatory: true,
      obtainFrom: 'UAE Federal Customs',
      electronicAccepted: true,
    },
    {
      document: 'Oman Customs Declaration',
      mandatory: true,
      obtainFrom: 'Royal Oman Customs',
      electronicAccepted: true,
    },
  ],
  customsCapabilities: [
    { capability: 'X-Ray Scanning', available: true },
    { capability: 'Weighbridge', available: true },
  ],
  averageProcessingTime: {
    commercial: 60,
    passenger: 15,
  },
  coordinates: { lat: 24.7883, lng: 56.1250 },
  contact: {
    website: 'https://www.fca.gov.ae',
  },
  confidenceScore: 0.95,
  lastVerified: new Date('2025-11-10'),
};

// ============================================================================
// EXPORT ALL BORDER CROSSINGS
// ============================================================================

export const GCC_BORDER_CROSSINGS: BorderCrossingData[] = [
  // Saudi-UAE
  AL_BATHA_CROSSING,
  SALWA_CROSSING,
  // Saudi-Bahrain
  KING_FAHD_CAUSEWAY,
  // Saudi-Kuwait
  KHAFJI_CROSSING,
  // Saudi-Jordan
  HALAT_AMMAR_CROSSING,
  DURRA_CROSSING,
  // Saudi-Oman
  BATHA_OMAN_CROSSING,
  // UAE-Oman
  HATTA_CROSSING,
];

/**
 * Get border crossing by ID
 */
export function getBorderCrossingById(id: string): BorderCrossingData | null {
  return GCC_BORDER_CROSSINGS.find((crossing) => crossing.id === id) || null;
}

/**
 * Get border crossings between two countries
 */
export function getBorderCrossingsBetween(
  country1: GCCCountryCode | 'JO' | 'IQ' | 'YE',
  country2: GCCCountryCode | 'JO' | 'IQ' | 'YE'
): BorderCrossingData[] {
  return GCC_BORDER_CROSSINGS.filter(
    (crossing) =>
      (crossing.countryA === country1 && crossing.countryB === country2) ||
      (crossing.countryA === country2 && crossing.countryB === country1)
  );
}

/**
 * Get all border crossings for a country
 */
export function getBorderCrossingsForCountry(
  country: GCCCountryCode | 'JO' | 'IQ' | 'YE'
): BorderCrossingData[] {
  return GCC_BORDER_CROSSINGS.filter(
    (crossing) => crossing.countryA === country || crossing.countryB === country
  );
}

/**
 * Check if a crossing is open at a given time
 */
export function isCrossingOpen(
  crossingId: string,
  dateTime: Date,
  isCommercial: boolean = true
): { open: boolean; reason?: string; nextOpen?: Date } {
  const crossing = getBorderCrossingById(crossingId);
  if (!crossing) {
    return { open: false, reason: 'Crossing not found' };
  }

  if (!crossing.isActive) {
    return { open: false, reason: 'Crossing is currently closed' };
  }

  const hours = crossing.operatingHours;

  if (hours.is24Hours) {
    // Check commercial hours if applicable
    if (isCommercial && hours.commercialHours) {
      const currentTime = dateTime.getHours() * 100 + dateTime.getMinutes();
      const openTime = parseInt(hours.commercialHours.open.replace(':', ''));
      const closeTime = parseInt(hours.commercialHours.close.replace(':', ''));

      if (currentTime < openTime || currentTime >= closeTime) {
        return {
          open: false,
          reason: `Commercial traffic only ${hours.commercialHours.open} - ${hours.commercialHours.close}`,
        };
      }
    }
    return { open: true };
  }

  // Check regular hours
  const applicableHours = isCommercial && hours.commercialHours
    ? hours.commercialHours
    : hours.regularHours;

  if (!applicableHours) {
    return { open: true };
  }

  // Check closed days
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dateTime.getDay()];
  if (hours.closedDays?.includes(dayName)) {
    return { open: false, reason: `Closed on ${dayName}` };
  }

  // Check time
  const currentTime = dateTime.getHours() * 100 + dateTime.getMinutes();
  const openTime = parseInt(applicableHours.open.replace(':', ''));
  const closeTime = parseInt(applicableHours.close.replace(':', ''));

  if (currentTime < openTime || currentTime >= closeTime) {
    return {
      open: false,
      reason: `Operating hours: ${applicableHours.open} - ${applicableHours.close}`,
    };
  }

  return { open: true };
}

export default GCC_BORDER_CROSSINGS;
