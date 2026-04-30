/**
 * GCC Regulation Database
 *
 * Comprehensive database of GCC transport regulations including:
 * - Truck ban schedules for major cities
 * - Border crossing requirements
 * - Weight/dimension limits
 * - Backload restrictions (TGA October 2024)
 *
 * @module gcc-compliance/regulationDatabase
 */

import type {
  GCCCountry,
  TruckBanSchedule,
  TruckBanCheckRequest,
  TruckBanCheckResult,
  GCCRegulation,
  BorderCrossing,
} from '@/types/gcc-compliance';

// ============================================================================
// TRUCK BAN SCHEDULES
// ============================================================================

export const TRUCK_BAN_SCHEDULES: TruckBanSchedule[] = [
  // SAUDI ARABIA - RIYADH
  {
    city: 'Riyadh',
    country: 'SA',
    timezone: 'Asia/Riyadh',
    restrictions: [
      {
        id: 'riyadh-weekday-normal',
        name: 'Weekday Ban (Normal)',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
        normalHours: { bannedFrom: '06:00', bannedTo: '21:00' },
        ramadanHours: { bannedFrom: '08:00', bannedTo: '02:00' },
        zones: ['CITY_CENTER', 'RING_ROAD_INNER'],
      },
      {
        id: 'riyadh-weekend-normal',
        name: 'Weekend Ban (Normal)',
        days: ['FRI', 'SAT'],
        normalHours: { bannedFrom: '16:00', bannedTo: '08:00' },
        zones: ['CITY_CENTER'],
      },
    ],
    exceptions: [
      {
        type: 'E_APPOINTMENT',
        description: 'E-Appointment via Naql Portal allows entry during banned times',
        portalUrl: 'https://bce.naql.sa',
        requiresBooking: true,
      },
      {
        type: 'INDUSTRIAL_ZONE',
        description: '24/7 access to designated industrial areas',
        requiresBooking: false,
      },
    ],
    specialNotes: [
      'Heavy vehicles > 3.5 tons restricted',
      'E-appointment must be booked 24 hours in advance',
    ],
  },

  // SAUDI ARABIA - JEDDAH
  {
    city: 'Jeddah',
    country: 'SA',
    timezone: 'Asia/Riyadh',
    restrictions: [
      {
        id: 'jeddah-morning',
        name: 'Morning Ban',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        normalHours: { bannedFrom: '06:00', bannedTo: '09:00' },
        zones: ['CITY_CENTER', 'CORNICHE'],
      },
      {
        id: 'jeddah-midday',
        name: 'Midday Ban',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        normalHours: { bannedFrom: '12:00', bannedTo: '15:00' },
        zones: ['CITY_CENTER'],
      },
      {
        id: 'jeddah-evening',
        name: 'Evening Ban',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        normalHours: { bannedFrom: '17:00', bannedTo: '01:00' },
        zones: ['CITY_CENTER', 'CORNICHE'],
      },
    ],
    exceptions: [
      {
        type: 'E_APPOINTMENT',
        description: 'E-Appointment via Naql Portal',
        portalUrl: 'https://bce.naql.sa',
        requiresBooking: true,
      },
    ],
    specialNotes: ['Multiple ban windows throughout the day'],
  },

  // SAUDI ARABIA - DAMMAM/KHOBAR
  {
    city: 'Dammam',
    country: 'SA',
    timezone: 'Asia/Riyadh',
    restrictions: [
      {
        id: 'dammam-morning',
        name: 'Morning Peak',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
        normalHours: { bannedFrom: '06:00', bannedTo: '09:00' },
        zones: ['CITY_CENTER'],
      },
      {
        id: 'dammam-evening',
        name: 'Evening Peak',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
        normalHours: { bannedFrom: '16:00', bannedTo: '20:00' },
        zones: ['CITY_CENTER'],
      },
    ],
    exceptions: [
      {
        type: 'INDUSTRIAL_ZONE',
        description: '24/7 access to Industrial City and port areas',
        requiresBooking: false,
      },
      {
        type: 'E_APPOINTMENT',
        description: 'Limited e-appointment availability',
        portalUrl: 'https://bce.naql.sa',
        requiresBooking: true,
      },
    ],
    industrialZoneGeofences: ['dammam-industrial-1', 'dammam-industrial-2', 'jubail-industrial'],
  },

  // UAE - DUBAI
  {
    city: 'Dubai',
    country: 'AE',
    timezone: 'Asia/Dubai',
    restrictions: [
      {
        id: 'dubai-sharjah-road',
        name: 'Sharjah-Dubai Roads',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
        normalHours: { bannedFrom: '06:30', bannedTo: '09:30' },
        zones: ['SHARJAH_DUBAI_CORRIDOR'],
      },
      {
        id: 'dubai-city-center',
        name: 'City Center Daytime',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        normalHours: { bannedFrom: '06:00', bannedTo: '22:00' },
        zones: ['CITY_CENTER', 'DOWNTOWN'],
      },
    ],
    exceptions: [
      {
        type: 'RTA_PERMIT',
        description: 'RTA special permit for daytime delivery',
        portalUrl: 'https://www.rta.ae',
        requiresBooking: true,
      },
    ],
    specialNotes: ['Night hours 10PM-6AM generally allowed', 'RTA permit required for exceptions'],
  },

  // KUWAIT - KUWAIT CITY
  {
    city: 'Kuwait City',
    country: 'KW',
    timezone: 'Asia/Kuwait',
    restrictions: [
      {
        id: 'kuwait-peak',
        name: 'Peak Hours',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
        normalHours: { bannedFrom: '06:00', bannedTo: '09:00' },
        zones: ['CITY_CENTER'],
      },
      {
        id: 'kuwait-friday-prayer',
        name: 'Friday Prayer Time',
        days: ['FRI'],
        normalHours: { bannedFrom: '11:00', bannedTo: '14:00' },
        zones: ['CITY_CENTER', 'MOSQUE_AREAS'],
      },
    ],
    exceptions: [
      {
        type: 'INDUSTRIAL_ZONE',
        description: '24/7 access to Shuwaikh Industrial Area',
        requiresBooking: false,
      },
    ],
    specialNotes: ['Border deposit AED 360 (refundable) for foreign trucks'],
  },

  // QATAR - DOHA
  {
    city: 'Doha',
    country: 'QA',
    timezone: 'Asia/Qatar',
    restrictions: [
      {
        id: 'doha-peak',
        name: 'Peak Hours',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
        normalHours: { bannedFrom: '06:00', bannedTo: '09:00' },
        zones: ['CITY_CENTER'],
      },
      {
        id: 'doha-corniche',
        name: 'Corniche Area',
        days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        normalHours: { bannedFrom: '00:00', bannedTo: '23:59' },
        zones: ['CORNICHE'],
      },
    ],
    exceptions: [
      {
        type: 'INDUSTRIAL_ZONE',
        description: '24/7 access to Industrial Area',
        requiresBooking: false,
      },
      {
        type: 'SPECIAL_PERMIT',
        description: 'Special permit from Ministry of Transport',
        requiresBooking: true,
      },
    ],
    specialNotes: ['Corniche always banned for heavy vehicles'],
  },
];

// ============================================================================
// BORDER CROSSINGS
// ============================================================================

export const GCC_BORDER_CROSSINGS: BorderCrossing[] = [
  // Saudi-Kuwait
  {
    id: 'sa-kw-khafji',
    name: 'Khafji / Nuwaiseeb',
    nameArabic: 'الخفجي / النويصيب',
    country1: 'SA',
    country2: 'KW',
    coordinates: { lat: 28.4167, lng: 48.5000 },
    type: 'LAND',
    operatingHours: {
      days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      openTime: '00:00',
      closeTime: '23:59',
      is24Hours: true,
    },
    facilities: ['CUSTOMS', 'INSPECTION', 'REST_AREA', 'FUEL_STATION'],
    averageProcessingTime: 2, // hours
    requirements: {
      documentsRequired: ['BAYAN_ETD', 'CUSTOMS_MANIFEST', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION'],
      feesApplicable: [
        { type: 'BORDER_DEPOSIT', amount: 360, currency: 'AED', refundable: true },
      ],
      inspectionRequired: true,
    },
  },

  // Saudi-UAE
  {
    id: 'sa-ae-ghuwaifat',
    name: 'Al Ghuwaifat / Al Silaa',
    nameArabic: 'الغويفات / السلع',
    country1: 'SA',
    country2: 'AE',
    coordinates: { lat: 24.2500, lng: 51.5833 },
    type: 'LAND',
    operatingHours: {
      days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      openTime: '00:00',
      closeTime: '23:59',
      is24Hours: true,
    },
    facilities: ['CUSTOMS', 'INSPECTION', 'REST_AREA', 'FUEL_STATION', 'TRUCK_PARKING'],
    averageProcessingTime: 1.5,
    requirements: {
      documentsRequired: ['BAYAN_ETD', 'CUSTOMS_MANIFEST', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION'],
      feesApplicable: [],
      inspectionRequired: true,
    },
  },

  // Saudi-Qatar
  {
    id: 'sa-qa-salwa',
    name: 'Salwa / Abu Samra',
    nameArabic: 'سلوى / أبو سمرة',
    country1: 'SA',
    country2: 'QA',
    coordinates: { lat: 24.7167, lng: 50.9667 },
    type: 'LAND',
    operatingHours: {
      days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      openTime: '00:00',
      closeTime: '23:59',
      is24Hours: true,
    },
    facilities: ['CUSTOMS', 'INSPECTION', 'REST_AREA'],
    averageProcessingTime: 2,
    requirements: {
      documentsRequired: ['BAYAN_ETD', 'CUSTOMS_MANIFEST', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION'],
      feesApplicable: [],
      inspectionRequired: true,
    },
  },

  // Saudi-Bahrain (King Fahd Causeway)
  {
    id: 'sa-bh-causeway',
    name: 'King Fahd Causeway',
    nameArabic: 'جسر الملك فهد',
    country1: 'SA',
    country2: 'BH',
    coordinates: { lat: 26.1833, lng: 50.3500 },
    type: 'LAND',
    operatingHours: {
      days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      openTime: '00:00',
      closeTime: '23:59',
      is24Hours: true,
    },
    facilities: ['CUSTOMS', 'INSPECTION', 'TOLL_BOOTH'],
    averageProcessingTime: 1,
    requirements: {
      documentsRequired: ['BAYAN_ETD', 'CUSTOMS_MANIFEST', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION'],
      feesApplicable: [
        { type: 'TOLL', amount: 25, currency: 'SAR', refundable: false },
      ],
      inspectionRequired: true,
    },
  },

  // Saudi-Oman
  {
    id: 'sa-om-batha',
    name: 'Al Batha',
    nameArabic: 'البطحاء',
    country1: 'SA',
    country2: 'OM',
    coordinates: { lat: 22.0000, lng: 55.0000 },
    type: 'LAND',
    operatingHours: {
      days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      openTime: '07:00',
      closeTime: '19:00',
      is24Hours: false,
    },
    facilities: ['CUSTOMS', 'INSPECTION'],
    averageProcessingTime: 2.5,
    requirements: {
      documentsRequired: ['BAYAN_ETD', 'CUSTOMS_MANIFEST', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION'],
      feesApplicable: [],
      inspectionRequired: true,
    },
  },

  // UAE-Oman
  {
    id: 'ae-om-hatta',
    name: 'Hatta',
    nameArabic: 'حتا',
    country1: 'AE',
    country2: 'OM',
    coordinates: { lat: 24.8000, lng: 56.1167 },
    type: 'LAND',
    operatingHours: {
      days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      openTime: '00:00',
      closeTime: '23:59',
      is24Hours: true,
    },
    facilities: ['CUSTOMS', 'INSPECTION'],
    averageProcessingTime: 1,
    requirements: {
      documentsRequired: ['CUSTOMS_MANIFEST', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION'],
      feesApplicable: [],
      inspectionRequired: true,
    },
  },
];

// ============================================================================
// GCC REGULATIONS
// ============================================================================

export const GCC_REGULATIONS: GCCRegulation[] = [
  // Backload Restriction - TGA October 2024
  {
    id: 'sa-backload-tga-2024',
    country: 'SA',
    category: 'BACKLOAD',
    name: 'Foreign Carrier Backload Restriction',
    description:
      'Foreign trucks can ONLY pick up backloads on their direct return route from the arrival city. They CANNOT travel across country to pick up cargo.',
    effectiveDate: new Date('2024-10-01'),
    authority: 'Transport General Authority (TGA)',
    referenceNumber: 'TGA-CIRC-2024-10',
    backloadRestriction: {
      foreignCarriersOnly: true,
      allowedPickupRadius: 50, // km from direct return route
      requiresReturnRouteProof: true,
    },
  },

  // Saudi Weight Limits
  {
    id: 'sa-weight-limits',
    country: 'SA',
    category: 'WEIGHT_LIMIT',
    name: 'Saudi Arabia Weight & Dimension Limits',
    description: 'Maximum weight and dimension limits for heavy vehicles in Saudi Arabia',
    effectiveDate: new Date('2020-01-01'),
    authority: 'Transport General Authority (TGA)',
    limits: {
      maxGrossWeight: 45000, // kg
      maxAxleLoad: 13, // tons
      maxHeight: 4.2, // meters
      maxLength: 18.75, // meters
      maxWidth: 2.55, // meters
      oversizedPermitRequired: true,
    },
  },

  // UAE Weight Limits
  {
    id: 'ae-weight-limits',
    country: 'AE',
    category: 'WEIGHT_LIMIT',
    name: 'UAE Weight & Dimension Limits',
    description: 'Maximum weight and dimension limits for heavy vehicles in UAE',
    effectiveDate: new Date('2020-01-01'),
    authority: 'Federal Transport Authority (FTA)',
    limits: {
      maxGrossWeight: 55000, // kg
      maxAxleLoad: 13, // tons
      maxHeight: 4.5, // meters
      maxLength: 22, // meters
      maxWidth: 2.55, // meters
      oversizedPermitRequired: true,
    },
  },

  // Bayan Requirement
  {
    id: 'sa-bayan-requirement',
    country: 'SA',
    category: 'DOCUMENT',
    name: 'Bayan ETD Requirement',
    description: 'All freight transport in Saudi Arabia requires active Bayan (Electronic Transport Document)',
    effectiveDate: new Date('2022-01-01'),
    authority: 'Transport General Authority (TGA)',
    documentRequirements: ['BAYAN_ETD', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION', 'CARGO_MANIFEST'],
  },

  // WASL Registration
  {
    id: 'sa-wasl-requirement',
    country: 'SA',
    category: 'PERMIT',
    name: 'WASL Fleet Registration',
    description: 'All commercial vehicles must be registered with WASL telematics system',
    effectiveDate: new Date('2021-01-01'),
    authority: 'Transport General Authority (TGA)',
    permitRequirements: ['WASL_REGISTRATION', 'TELEMATICS_DEVICE'],
  },
];

// ============================================================================
// REGULATION DATABASE SERVICE
// ============================================================================

export class RegulationDatabaseService {
  /**
   * Get truck ban schedule for a city
   */
  getTruckBanSchedule(city: string, country: GCCCountry): TruckBanSchedule | null {
    return (
      TRUCK_BAN_SCHEDULES.find(
        (s) => s.city.toLowerCase() === city.toLowerCase() && s.country === country
      ) || null
    );
  }

  /**
   * Get all truck ban schedules for a country
   */
  getTruckBanSchedulesByCountry(country: GCCCountry): TruckBanSchedule[] {
    return TRUCK_BAN_SCHEDULES.filter((s) => s.country === country);
  }

  /**
   * Check if a truck can enter a city at a given time
   */
  checkTruckBan(request: TruckBanCheckRequest): TruckBanCheckResult {
    const schedule = this.getTruckBanSchedule(request.city, request.country);

    if (!schedule) {
      return {
        canEnter: true,
        currentlyBanned: false,
        availableExceptions: [],
        recommendedAction: 'No truck ban restrictions found for this city',
      };
    }

    const arrivalDate = new Date(request.plannedArrival);
    const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][arrivalDate.getDay()];
    const timeStr = arrivalDate.toTimeString().slice(0, 5); // HH:mm

    // Check each restriction
    for (const restriction of schedule.restrictions) {
      if (!restriction.days.includes(dayOfWeek as any)) continue;

      const bannedFrom = restriction.normalHours.bannedFrom;
      const bannedTo = restriction.normalHours.bannedTo;

      // Check if time falls within banned period
      const isBanned = this.isTimeInRange(timeStr, bannedFrom, bannedTo);

      if (isBanned) {
        // Check for exceptions
        if (request.hasEAppointment) {
          const eAppointment = schedule.exceptions.find((e) => e.type === 'E_APPOINTMENT');
          if (eAppointment) {
            return {
              canEnter: true,
              currentlyBanned: true,
              activeRestriction: restriction,
              availableExceptions: schedule.exceptions,
              recommendedAction: 'Entry allowed with E-Appointment',
            };
          }
        }

        if (request.isIndustrialZone) {
          const industrial = schedule.exceptions.find((e) => e.type === 'INDUSTRIAL_ZONE');
          if (industrial) {
            return {
              canEnter: true,
              currentlyBanned: false,
              availableExceptions: schedule.exceptions,
              recommendedAction: 'Industrial zone - 24/7 access allowed',
            };
          }
        }

        // Calculate next allowed entry time
        const nextAllowedEntry = this.calculateNextAllowedEntry(arrivalDate, bannedTo);
        const waitTimeHours = (nextAllowedEntry.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60);

        return {
          canEnter: false,
          currentlyBanned: true,
          nextAllowedEntry,
          waitTimeHours: Math.round(waitTimeHours * 10) / 10,
          activeRestriction: restriction,
          availableExceptions: schedule.exceptions,
          recommendedAction: `Wait until ${bannedTo} or book E-Appointment`,
          holdAreaGeofenceId: schedule.geofenceIds?.[0],
        };
      }
    }

    return {
      canEnter: true,
      currentlyBanned: false,
      availableExceptions: schedule.exceptions,
      recommendedAction: 'Entry allowed at planned time',
    };
  }

  /**
   * Get border crossing between two countries
   */
  getBorderCrossing(country1: GCCCountry, country2: GCCCountry): BorderCrossing | null {
    return (
      GCC_BORDER_CROSSINGS.find(
        (b) =>
          (b.country1 === country1 && b.country2 === country2) ||
          (b.country1 === country2 && b.country2 === country1)
      ) || null
    );
  }

  /**
   * Get all border crossings for a country
   */
  getBorderCrossingsForCountry(country: GCCCountry): BorderCrossing[] {
    return GCC_BORDER_CROSSINGS.filter((b) => b.country1 === country || b.country2 === country);
  }

  /**
   * Get regulations by country and category
   */
  getRegulations(country: GCCCountry, category?: GCCRegulation['category']): GCCRegulation[] {
    return GCC_REGULATIONS.filter(
      (r) => r.country === country && (!category || r.category === category)
    );
  }

  /**
   * Get backload restriction for a country
   */
  getBackloadRestriction(country: GCCCountry): GCCRegulation | null {
    return GCC_REGULATIONS.find((r) => r.country === country && r.category === 'BACKLOAD') || null;
  }

  /**
   * Get weight limits for a country
   */
  getWeightLimits(country: GCCCountry): GCCRegulation['limits'] | null {
    const reg = GCC_REGULATIONS.find((r) => r.country === country && r.category === 'WEIGHT_LIMIT');
    return reg?.limits || null;
  }

  // Helper: Check if time is in range
  private isTimeInRange(time: string, from: string, to: string): boolean {
    // Handle overnight ranges (e.g., 17:00 to 01:00)
    if (from > to) {
      return time >= from || time < to;
    }
    return time >= from && time < to;
  }

  // Helper: Calculate next allowed entry time
  private calculateNextAllowedEntry(current: Date, bannedTo: string): Date {
    const [hours, minutes] = bannedTo.split(':').map(Number);
    const next = new Date(current);
    next.setHours(hours, minutes, 0, 0);

    // If ban end time is before current time, it's the next day
    if (next <= current) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }
}

// Export singleton
export const regulationDatabase = new RegulationDatabaseService();
