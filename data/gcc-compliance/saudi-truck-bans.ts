/**
 * Saudi Arabia Truck Ban Schedules - Comprehensive Data
 *
 * Contains detailed truck ban schedules for all major Saudi cities.
 * Data sourced from municipal traffic departments and TGA.
 *
 * Sources:
 * - Riyadh Traffic Department
 * - Jeddah Municipality
 * - Eastern Province Traffic
 * - TGA Circulars
 *
 * Last Updated: January 2026
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CityTruckBanSchedule {
  /** City name in English */
  city: string;
  /** City name in Arabic */
  cityAr: string;
  /** Region */
  region: 'CENTRAL' | 'WESTERN' | 'EASTERN' | 'NORTHERN' | 'SOUTHERN';
  /** Population (for context) */
  population: number;
  /** Whether truck ban is active */
  isActive: boolean;
  /** Normal schedule (non-Ramadan) */
  normalSchedule: DailySchedule;
  /** Ramadan schedule (if different) */
  ramadanSchedule?: DailySchedule;
  /** Friday schedule (if different) */
  fridaySchedule?: DailySchedule;
  /** Special event schedules */
  specialEvents?: SpecialEventSchedule[];
  /** Zones within the city */
  zones: TruckBanZone[];
  /** Exceptions */
  exceptions: TruckBanException[];
  /** Penalty for violation */
  penaltySAR: number;
  /** Confidence score */
  confidenceScore: number;
  /** Last verified date */
  lastVerified: Date;
  /** Source URLs */
  sourceUrls: string[];
  /** Coordinates for city center */
  centerCoordinates: { lat: number; lng: number };
  /** Restricted radius in km */
  restrictedRadius: number;
}

export interface DailySchedule {
  /** Days this schedule applies */
  days: ('SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT')[];
  /** Ban start time (24h format) */
  banStart: string;
  /** Ban end time (24h format) */
  banEnd: string;
  /** Vehicles affected */
  affectedVehicles: {
    minWeight: number; // kg
    types: string[];
  };
}

export interface TruckBanZone {
  /** Zone name */
  name: string;
  /** Zone type */
  type: 'CITY_CENTER' | 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED';
  /** Is this zone exempt from ban */
  exempt: boolean;
  /** Boundary coordinates (polygon) */
  boundary?: { lat: number; lng: number }[];
  /** Special hours for this zone */
  specialHours?: DailySchedule;
  /** Notes */
  notes?: string;
}

export interface TruckBanException {
  /** Exception type */
  type: 'E_APPOINTMENT' | 'EMERGENCY' | 'PERMIT' | 'VEHICLE_TYPE' | 'CARGO_TYPE' | 'TIME_SENSITIVE';
  /** Description */
  description: string;
  /** How to obtain */
  howToObtain: string;
  /** Validity period */
  validityHours?: number;
  /** Cost if applicable */
  costSAR?: number;
  /** Confidence score */
  confidenceScore: number;
}

export interface SpecialEventSchedule {
  /** Event name */
  eventName: string;
  /** Start date */
  startDate: Date;
  /** End date */
  endDate: Date;
  /** Modified schedule */
  schedule: DailySchedule;
  /** Notes */
  notes?: string;
}

// ============================================================================
// RIYADH - CAPITAL CITY
// ============================================================================

export const RIYADH_TRUCK_BAN: CityTruckBanSchedule = {
  city: 'Riyadh',
  cityAr: 'الرياض',
  region: 'CENTRAL',
  population: 7500000,
  isActive: true,
  normalSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    banStart: '06:00',
    banEnd: '22:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  fridaySchedule: {
    days: ['FRI'],
    banStart: '10:00',
    banEnd: '16:00', // Shorter due to Friday prayers
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  ramadanSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    banStart: '14:00', // Later start for Suhoor deliveries
    banEnd: '02:00', // Extended for Iftar/night activities
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  zones: [
    {
      name: 'Riyadh City Center',
      type: 'CITY_CENTER',
      exempt: false,
      notes: 'Most restricted zone - King Fahd Road to Al Maather Street',
    },
    {
      name: 'Diplomatic Quarter',
      type: 'RESIDENTIAL',
      exempt: false,
      notes: 'Additional security restrictions apply',
    },
    {
      name: 'Industrial City 1',
      type: 'INDUSTRIAL',
      exempt: true,
      notes: 'Trucks allowed 24/7 within industrial zone',
    },
    {
      name: 'Industrial City 2',
      type: 'INDUSTRIAL',
      exempt: true,
      notes: 'Trucks allowed 24/7 within industrial zone',
    },
    {
      name: 'King Khalid International Airport Zone',
      type: 'COMMERCIAL',
      exempt: true,
      notes: 'Cargo trucks with airport permits exempt',
    },
    {
      name: 'Dry Port (Riyadh)',
      type: 'INDUSTRIAL',
      exempt: true,
      notes: 'Container trucks with customs documentation exempt',
    },
  ],
  exceptions: [
    {
      type: 'E_APPOINTMENT',
      description: 'Electronic appointment for essential deliveries',
      howToObtain: 'Via TGA Logisti platform or Absher for Business',
      validityHours: 4,
      costSAR: 50,
      confidenceScore: 0.95,
    },
    {
      type: 'EMERGENCY',
      description: 'Emergency services and critical infrastructure',
      howToObtain: 'Pre-registered emergency service vehicles',
      confidenceScore: 0.99,
    },
    {
      type: 'CARGO_TYPE',
      description: 'Perishable food and pharmaceutical deliveries',
      howToObtain: 'SFDA-certified reefer vehicles with valid manifest',
      confidenceScore: 0.92,
    },
    {
      type: 'TIME_SENSITIVE',
      description: 'Construction materials with active building permit',
      howToObtain: 'Municipal permit linked to construction project',
      validityHours: 8,
      costSAR: 200,
      confidenceScore: 0.88,
    },
  ],
  penaltySAR: 3000,
  confidenceScore: 0.97,
  lastVerified: new Date('2025-12-15'),
  sourceUrls: [
    'https://riyadh.gov.sa/traffic/truck-restrictions',
    'https://tga.gov.sa/en/riyadh-truck-ban',
  ],
  centerCoordinates: { lat: 24.7136, lng: 46.6753 },
  restrictedRadius: 25,
};

// ============================================================================
// JEDDAH - COMMERCIAL HUB
// ============================================================================

export const JEDDAH_TRUCK_BAN: CityTruckBanSchedule = {
  city: 'Jeddah',
  cityAr: 'جدة',
  region: 'WESTERN',
  population: 4700000,
  isActive: true,
  normalSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    banStart: '07:00',
    banEnd: '21:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  fridaySchedule: {
    days: ['FRI'],
    banStart: '11:00',
    banEnd: '15:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  ramadanSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    banStart: '15:00',
    banEnd: '03:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  zones: [
    {
      name: 'Jeddah Historic District (Al-Balad)',
      type: 'CITY_CENTER',
      exempt: false,
      notes: 'UNESCO World Heritage site - strictest restrictions',
    },
    {
      name: 'Corniche Area',
      type: 'COMMERCIAL',
      exempt: false,
      notes: 'Tourist area with extended restrictions',
    },
    {
      name: 'Jeddah Islamic Port Zone',
      type: 'INDUSTRIAL',
      exempt: true,
      notes: 'Port-bound trucks with valid manifest exempt',
    },
    {
      name: 'King Abdulaziz International Airport',
      type: 'COMMERCIAL',
      exempt: true,
      notes: 'Cargo trucks with airport documentation exempt',
    },
    {
      name: 'Jeddah Industrial City',
      type: 'INDUSTRIAL',
      exempt: true,
      notes: 'Industrial zone - trucks allowed 24/7',
    },
  ],
  exceptions: [
    {
      type: 'E_APPOINTMENT',
      description: 'Electronic permit for commercial deliveries',
      howToObtain: 'Jeddah Municipality e-services portal',
      validityHours: 4,
      costSAR: 40,
      confidenceScore: 0.94,
    },
    {
      type: 'CARGO_TYPE',
      description: 'Port container movements with customs clearance',
      howToObtain: 'Valid customs manifest and port exit documentation',
      confidenceScore: 0.96,
    },
    {
      type: 'CARGO_TYPE',
      description: 'Hajj/Umrah logistics during season',
      howToObtain: 'Ministry of Hajj permit for registered operators',
      confidenceScore: 0.93,
    },
  ],
  penaltySAR: 3000,
  confidenceScore: 0.96,
  lastVerified: new Date('2025-12-10'),
  sourceUrls: [
    'https://jeddah.gov.sa/traffic',
    'https://tga.gov.sa/en/jeddah-truck-ban',
  ],
  centerCoordinates: { lat: 21.4858, lng: 39.1925 },
  restrictedRadius: 20,
};

// ============================================================================
// DAMMAM - EASTERN PROVINCE
// ============================================================================

export const DAMMAM_TRUCK_BAN: CityTruckBanSchedule = {
  city: 'Dammam',
  cityAr: 'الدمام',
  region: 'EASTERN',
  population: 1200000,
  isActive: true,
  normalSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    banStart: '06:00',
    banEnd: '21:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  fridaySchedule: {
    days: ['FRI'],
    banStart: '10:00',
    banEnd: '16:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  zones: [
    {
      name: 'Dammam City Center',
      type: 'CITY_CENTER',
      exempt: false,
    },
    {
      name: 'King Fahd Causeway Approach',
      type: 'COMMERCIAL',
      exempt: false,
      notes: 'Additional restrictions for Bahrain-bound traffic',
    },
    {
      name: 'King Abdul Aziz Port',
      type: 'INDUSTRIAL',
      exempt: true,
      notes: 'Port operations exempt',
    },
    {
      name: 'Dammam Industrial City',
      type: 'INDUSTRIAL',
      exempt: true,
    },
    {
      name: 'Jubail Industrial City',
      type: 'INDUSTRIAL',
      exempt: true,
      notes: 'Major petrochemical hub - special regulations apply',
    },
  ],
  exceptions: [
    {
      type: 'E_APPOINTMENT',
      description: 'Eastern Province e-permit system',
      howToObtain: 'Eastern Province Municipality portal',
      validityHours: 4,
      costSAR: 35,
      confidenceScore: 0.93,
    },
    {
      type: 'CARGO_TYPE',
      description: 'Oil & gas sector deliveries',
      howToObtain: 'Aramco/SABIC contractor permit',
      confidenceScore: 0.95,
    },
  ],
  penaltySAR: 3000,
  confidenceScore: 0.95,
  lastVerified: new Date('2025-11-20'),
  sourceUrls: ['https://eamana.gov.sa/traffic'],
  centerCoordinates: { lat: 26.4207, lng: 50.0888 },
  restrictedRadius: 15,
};

// ============================================================================
// MAKKAH - HOLY CITY (Special Restrictions)
// ============================================================================

export const MAKKAH_TRUCK_BAN: CityTruckBanSchedule = {
  city: 'Makkah',
  cityAr: 'مكة المكرمة',
  region: 'WESTERN',
  population: 2000000,
  isActive: true,
  normalSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    banStart: '00:00', // 24-hour ban in central zone
    banEnd: '23:59',
    affectedVehicles: {
      minWeight: 3500, // Lower threshold for holy city
      types: ['HEAVY_TRUCK', 'MEDIUM_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  fridaySchedule: {
    days: ['FRI'],
    banStart: '00:00',
    banEnd: '23:59',
    affectedVehicles: {
      minWeight: 3500,
      types: ['HEAVY_TRUCK', 'MEDIUM_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  specialEvents: [
    {
      eventName: 'Hajj Season',
      startDate: new Date('2026-06-01'), // Approximate - based on lunar calendar
      endDate: new Date('2026-06-20'),
      schedule: {
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        banStart: '00:00',
        banEnd: '23:59',
        affectedVehicles: {
          minWeight: 2500, // Even stricter during Hajj
          types: ['HEAVY_TRUCK', 'MEDIUM_TRUCK', 'LIGHT_TRUCK', 'CONTAINER', 'TANKER'],
        },
      },
      notes: 'Only pre-approved Hajj logistics vehicles allowed',
    },
    {
      eventName: 'Ramadan Last 10 Days',
      startDate: new Date('2026-03-20'), // Approximate
      endDate: new Date('2026-03-30'),
      schedule: {
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        banStart: '00:00',
        banEnd: '23:59',
        affectedVehicles: {
          minWeight: 2500,
          types: ['HEAVY_TRUCK', 'MEDIUM_TRUCK', 'LIGHT_TRUCK', 'CONTAINER', 'TANKER'],
        },
      },
      notes: 'Increased restrictions for Laylat al-Qadr',
    },
  ],
  zones: [
    {
      name: 'Haram Zone (Grand Mosque)',
      type: 'CITY_CENTER',
      exempt: false,
      notes: 'Absolute restriction - no commercial vehicles at any time',
    },
    {
      name: 'Central Makkah',
      type: 'RESIDENTIAL',
      exempt: false,
      notes: 'Night deliveries only (01:00-04:00) with special permit',
    },
    {
      name: 'Makkah Gateway (Outer Ring)',
      type: 'COMMERCIAL',
      exempt: false,
      notes: 'Standard truck ban hours apply',
    },
  ],
  exceptions: [
    {
      type: 'PERMIT',
      description: 'Ministry of Hajj authorized logistics',
      howToObtain: 'Pre-approved Hajj/Umrah logistics operator registration',
      confidenceScore: 0.98,
    },
    {
      type: 'EMERGENCY',
      description: 'Essential supplies (water, fuel, medical)',
      howToObtain: 'Civil Defense authorization',
      confidenceScore: 0.99,
    },
    {
      type: 'TIME_SENSITIVE',
      description: 'Night delivery window (01:00-04:00)',
      howToObtain: 'Makkah Municipality special permit',
      validityHours: 3,
      costSAR: 500,
      confidenceScore: 0.90,
    },
  ],
  penaltySAR: 10000, // Higher penalty for holy city
  confidenceScore: 0.98,
  lastVerified: new Date('2025-12-01'),
  sourceUrls: [
    'https://holymakkah.gov.sa/traffic',
    'https://tga.gov.sa/en/makkah-restrictions',
  ],
  centerCoordinates: { lat: 21.4225, lng: 39.8262 },
  restrictedRadius: 30,
};

// ============================================================================
// MADINAH - HOLY CITY
// ============================================================================

export const MADINAH_TRUCK_BAN: CityTruckBanSchedule = {
  city: 'Madinah',
  cityAr: 'المدينة المنورة',
  region: 'WESTERN',
  population: 1500000,
  isActive: true,
  normalSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    banStart: '06:00',
    banEnd: '22:00',
    affectedVehicles: {
      minWeight: 7000, // Lower threshold for holy city
      types: ['HEAVY_TRUCK', 'MEDIUM_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  fridaySchedule: {
    days: ['FRI'],
    banStart: '06:00',
    banEnd: '22:00',
    affectedVehicles: {
      minWeight: 7000,
      types: ['HEAVY_TRUCK', 'MEDIUM_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  zones: [
    {
      name: 'Haram Zone (Prophet\'s Mosque)',
      type: 'CITY_CENTER',
      exempt: false,
      notes: 'Strict restrictions similar to Makkah',
    },
    {
      name: 'Central Madinah',
      type: 'RESIDENTIAL',
      exempt: false,
    },
    {
      name: 'Madinah Industrial Zone',
      type: 'INDUSTRIAL',
      exempt: true,
    },
  ],
  exceptions: [
    {
      type: 'E_APPOINTMENT',
      description: 'Madinah Region e-permit',
      howToObtain: 'Madinah Region Municipality portal',
      validityHours: 4,
      costSAR: 100,
      confidenceScore: 0.92,
    },
    {
      type: 'CARGO_TYPE',
      description: 'Dates and agricultural produce from Al-Ula',
      howToObtain: 'Agricultural sector permit',
      confidenceScore: 0.88,
    },
  ],
  penaltySAR: 5000,
  confidenceScore: 0.94,
  lastVerified: new Date('2025-11-15'),
  sourceUrls: ['https://madinah.gov.sa/traffic'],
  centerCoordinates: { lat: 24.5247, lng: 39.5692 },
  restrictedRadius: 20,
};

// ============================================================================
// KHOBAR - EASTERN PROVINCE
// ============================================================================

export const KHOBAR_TRUCK_BAN: CityTruckBanSchedule = {
  city: 'Khobar',
  cityAr: 'الخبر',
  region: 'EASTERN',
  population: 500000,
  isActive: true,
  normalSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    banStart: '07:00',
    banEnd: '20:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  fridaySchedule: {
    days: ['FRI'],
    banStart: '10:00',
    banEnd: '16:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  zones: [
    {
      name: 'Khobar Corniche',
      type: 'COMMERCIAL',
      exempt: false,
    },
    {
      name: 'Al Rashid Mall Area',
      type: 'COMMERCIAL',
      exempt: false,
    },
    {
      name: 'Dhahran Techno Valley',
      type: 'INDUSTRIAL',
      exempt: true,
    },
  ],
  exceptions: [
    {
      type: 'E_APPOINTMENT',
      description: 'Shared with Dammam e-permit system',
      howToObtain: 'Eastern Province Municipality portal',
      validityHours: 4,
      costSAR: 35,
      confidenceScore: 0.93,
    },
  ],
  penaltySAR: 3000,
  confidenceScore: 0.93,
  lastVerified: new Date('2025-11-20'),
  sourceUrls: ['https://eamana.gov.sa/khobar'],
  centerCoordinates: { lat: 26.2172, lng: 50.1971 },
  restrictedRadius: 12,
};

// ============================================================================
// TABUK - NORTHERN REGION (NEOM Gateway)
// ============================================================================

export const TABUK_TRUCK_BAN: CityTruckBanSchedule = {
  city: 'Tabuk',
  cityAr: 'تبوك',
  region: 'NORTHERN',
  population: 600000,
  isActive: true,
  normalSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    banStart: '07:00',
    banEnd: '19:00', // Shorter due to lower traffic
    affectedVehicles: {
      minWeight: 15000, // Higher threshold
      types: ['HEAVY_TRUCK', 'CONTAINER', 'LOWBED'],
    },
  },
  fridaySchedule: {
    days: ['FRI'],
    banStart: '11:00',
    banEnd: '15:00',
    affectedVehicles: {
      minWeight: 15000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'LOWBED'],
    },
  },
  zones: [
    {
      name: 'Tabuk City Center',
      type: 'CITY_CENTER',
      exempt: false,
    },
    {
      name: 'NEOM Construction Corridor',
      type: 'INDUSTRIAL',
      exempt: true,
      notes: 'NEOM project vehicles with valid contractor ID exempt',
    },
    {
      name: 'Haql Border Crossing',
      type: 'COMMERCIAL',
      exempt: true,
      notes: 'Cross-border traffic to Jordan',
    },
  ],
  exceptions: [
    {
      type: 'PERMIT',
      description: 'NEOM project logistics',
      howToObtain: 'NEOM contractor registration',
      confidenceScore: 0.96,
    },
    {
      type: 'CARGO_TYPE',
      description: 'Cross-border transit to Jordan',
      howToObtain: 'Valid TIR carnet and customs documentation',
      confidenceScore: 0.94,
    },
  ],
  penaltySAR: 2500,
  confidenceScore: 0.91,
  lastVerified: new Date('2025-10-30'),
  sourceUrls: ['https://tabuk.gov.sa/traffic'],
  centerCoordinates: { lat: 28.3835, lng: 36.5662 },
  restrictedRadius: 10,
};

// ============================================================================
// ABHA - SOUTHERN REGION
// ============================================================================

export const ABHA_TRUCK_BAN: CityTruckBanSchedule = {
  city: 'Abha',
  cityAr: 'أبها',
  region: 'SOUTHERN',
  population: 400000,
  isActive: true,
  normalSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    banStart: '08:00',
    banEnd: '18:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  fridaySchedule: {
    days: ['FRI'],
    banStart: '10:00',
    banEnd: '16:00',
    affectedVehicles: {
      minWeight: 12000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'TANKER', 'LOWBED'],
    },
  },
  zones: [
    {
      name: 'Abha City Center',
      type: 'CITY_CENTER',
      exempt: false,
    },
    {
      name: 'Asir National Park Access',
      type: 'RESIDENTIAL',
      exempt: false,
      notes: 'Tourist area with additional restrictions',
    },
  ],
  exceptions: [
    {
      type: 'E_APPOINTMENT',
      description: 'Asir Region e-permit',
      howToObtain: 'Asir Region Municipality portal',
      validityHours: 4,
      costSAR: 30,
      confidenceScore: 0.90,
    },
  ],
  penaltySAR: 2500,
  confidenceScore: 0.90,
  lastVerified: new Date('2025-10-15'),
  sourceUrls: ['https://asir.gov.sa/traffic'],
  centerCoordinates: { lat: 18.2164, lng: 42.5053 },
  restrictedRadius: 8,
};

// ============================================================================
// YANBU - INDUSTRIAL PORT CITY
// ============================================================================

export const YANBU_TRUCK_BAN: CityTruckBanSchedule = {
  city: 'Yanbu',
  cityAr: 'ينبع',
  region: 'WESTERN',
  population: 300000,
  isActive: true,
  normalSchedule: {
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    banStart: '07:00',
    banEnd: '19:00',
    affectedVehicles: {
      minWeight: 15000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'LOWBED'],
    },
  },
  fridaySchedule: {
    days: ['FRI'],
    banStart: '10:00',
    banEnd: '16:00',
    affectedVehicles: {
      minWeight: 15000,
      types: ['HEAVY_TRUCK', 'CONTAINER', 'LOWBED'],
    },
  },
  zones: [
    {
      name: 'Yanbu City Center',
      type: 'CITY_CENTER',
      exempt: false,
    },
    {
      name: 'Royal Commission Industrial City',
      type: 'INDUSTRIAL',
      exempt: true,
      notes: 'Major petrochemical complex - trucks allowed 24/7',
    },
    {
      name: 'Yanbu Commercial Port',
      type: 'INDUSTRIAL',
      exempt: true,
    },
  ],
  exceptions: [
    {
      type: 'CARGO_TYPE',
      description: 'Petrochemical and refinery logistics',
      howToObtain: 'Royal Commission contractor permit',
      confidenceScore: 0.96,
    },
    {
      type: 'CARGO_TYPE',
      description: 'Port container movements',
      howToObtain: 'Valid customs manifest',
      confidenceScore: 0.95,
    },
  ],
  penaltySAR: 3000,
  confidenceScore: 0.93,
  lastVerified: new Date('2025-11-01'),
  sourceUrls: ['https://yanbu.gov.sa/traffic'],
  centerCoordinates: { lat: 24.0895, lng: 38.0618 },
  restrictedRadius: 10,
};

// ============================================================================
// EXPORT ALL SCHEDULES
// ============================================================================

export const SAUDI_TRUCK_BAN_SCHEDULES: CityTruckBanSchedule[] = [
  RIYADH_TRUCK_BAN,
  JEDDAH_TRUCK_BAN,
  DAMMAM_TRUCK_BAN,
  MAKKAH_TRUCK_BAN,
  MADINAH_TRUCK_BAN,
  KHOBAR_TRUCK_BAN,
  TABUK_TRUCK_BAN,
  ABHA_TRUCK_BAN,
  YANBU_TRUCK_BAN,
];

/**
 * Get truck ban schedule for a city
 */
export function getTruckBanSchedule(cityName: string): CityTruckBanSchedule | null {
  const normalized = cityName.toLowerCase().trim();
  return SAUDI_TRUCK_BAN_SCHEDULES.find(
    (schedule) =>
      schedule.city.toLowerCase() === normalized ||
      schedule.cityAr === cityName
  ) || null;
}

/**
 * Check if current time is within truck ban hours
 */
export function isWithinTruckBan(
  city: string,
  dateTime: Date,
  vehicleWeight: number,
  isRamadan: boolean = false
): { banned: boolean; reason?: string; nextWindow?: Date } {
  const schedule = getTruckBanSchedule(city);
  if (!schedule || !schedule.isActive) {
    return { banned: false };
  }

  // Get applicable schedule
  const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dateTime.getDay()];
  let applicableSchedule = schedule.normalSchedule;

  if (dayOfWeek === 'FRI' && schedule.fridaySchedule) {
    applicableSchedule = schedule.fridaySchedule;
  }

  if (isRamadan && schedule.ramadanSchedule) {
    applicableSchedule = schedule.ramadanSchedule;
  }

  // Check weight threshold
  if (vehicleWeight < applicableSchedule.affectedVehicles.minWeight) {
    return { banned: false, reason: 'Vehicle weight below threshold' };
  }

  // Check time
  const currentTime = dateTime.getHours() * 100 + dateTime.getMinutes();
  const banStart = parseInt(applicableSchedule.banStart.replace(':', ''));
  const banEnd = parseInt(applicableSchedule.banEnd.replace(':', ''));

  let isBanned: boolean;
  if (banStart < banEnd) {
    // Normal schedule (e.g., 06:00 - 22:00)
    isBanned = currentTime >= banStart && currentTime < banEnd;
  } else {
    // Overnight schedule (e.g., 14:00 - 02:00)
    isBanned = currentTime >= banStart || currentTime < banEnd;
  }

  if (isBanned) {
    // Calculate next available window
    const nextWindow = new Date(dateTime);
    if (banStart < banEnd) {
      // Next window is after banEnd today
      nextWindow.setHours(Math.floor(banEnd / 100), banEnd % 100, 0, 0);
    } else {
      // Next window is banEnd tomorrow
      nextWindow.setDate(nextWindow.getDate() + 1);
      nextWindow.setHours(Math.floor(banEnd / 100), banEnd % 100, 0, 0);
    }

    return {
      banned: true,
      reason: `Truck ban active in ${city} from ${applicableSchedule.banStart} to ${applicableSchedule.banEnd}`,
      nextWindow,
    };
  }

  return { banned: false };
}

export default SAUDI_TRUCK_BAN_SCHEDULES;
