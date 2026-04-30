/**
 * Global Locations Data
 * Comprehensive country and city database for worldwide warehouse management
 * BlueDXP Platform - Global Support
 */

export interface Country {
  code: string
  name: string
  nameAr?: string // Arabic name
  region: string
  timezone: string
  currency: string
}

export interface City {
  code: string
  name: string
  nameAr?: string // Arabic name
  countryCode: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

/**
 * Global Countries Database
 */
export const GLOBAL_COUNTRIES: Country[] = [
  // Middle East & GCC
  {
    code: 'SAU',
    name: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    region: 'Middle East',
    timezone: 'Asia/Riyadh',
    currency: 'SAR'
  },
  {
    code: 'UAE',
    name: 'United Arab Emirates',
    nameAr: 'الإمارات العربية المتحدة',
    region: 'Middle East',
    timezone: 'Asia/Dubai',
    currency: 'AED'
  },
  {
    code: 'IRQ',
    name: 'Iraq',
    nameAr: 'العراق',
    region: 'Middle East',
    timezone: 'Asia/Baghdad',
    currency: 'IQD'
  },
  {
    code: 'QAT',
    name: 'Qatar',
    nameAr: 'قطر',
    region: 'Middle East',
    timezone: 'Asia/Qatar',
    currency: 'QAR'
  },
  {
    code: 'KWT',
    name: 'Kuwait',
    nameAr: 'الكويت',
    region: 'Middle East',
    timezone: 'Asia/Kuwait',
    currency: 'KWD'
  },
  {
    code: 'OMN',
    name: 'Oman',
    nameAr: 'عُمان',
    region: 'Middle East',
    timezone: 'Asia/Muscat',
    currency: 'OMR'
  },
  {
    code: 'BHR',
    name: 'Bahrain',
    nameAr: 'البحرين',
    region: 'Middle East',
    timezone: 'Asia/Bahrain',
    currency: 'BHD'
  },
  {
    code: 'EGY',
    name: 'Egypt',
    nameAr: 'مصر',
    region: 'Middle East',
    timezone: 'Africa/Cairo',
    currency: 'EGP'
  },
  {
    code: 'JOR',
    name: 'Jordan',
    nameAr: 'الأردن',
    region: 'Middle East',
    timezone: 'Asia/Amman',
    currency: 'JOD'
  },
  {
    code: 'LBN',
    name: 'Lebanon',
    nameAr: 'لبنان',
    region: 'Middle East',
    timezone: 'Asia/Beirut',
    currency: 'LBP'
  },
  {
    code: 'SYR',
    name: 'Syria',
    nameAr: 'سوريا',
    region: 'Middle East',
    timezone: 'Asia/Damascus',
    currency: 'SYP'
  },
  {
    code: 'YEM',
    name: 'Yemen',
    nameAr: 'اليمن',
    region: 'Middle East',
    timezone: 'Asia/Aden',
    currency: 'YER'
  },
  // Asia
  {
    code: 'IND',
    name: 'India',
    region: 'Asia',
    timezone: 'Asia/Kolkata',
    currency: 'INR'
  },
  {
    code: 'CHN',
    name: 'China',
    nameAr: 'الصين',
    region: 'Asia',
    timezone: 'Asia/Shanghai',
    currency: 'CNY'
  },
  {
    code: 'TUR',
    name: 'Turkey',
    nameAr: 'تركيا',
    region: 'Europe/Asia',
    timezone: 'Europe/Istanbul',
    currency: 'TRY'
  },
  // Europe
  {
    code: 'GBR',
    name: 'United Kingdom',
    region: 'Europe',
    timezone: 'Europe/London',
    currency: 'GBP'
  },
  {
    code: 'DEU',
    name: 'Germany',
    region: 'Europe',
    timezone: 'Europe/Berlin',
    currency: 'EUR'
  },
  {
    code: 'FRA',
    name: 'France',
    region: 'Europe',
    timezone: 'Europe/Paris',
    currency: 'EUR'
  },
  // Americas
  {
    code: 'USA',
    name: 'United States',
    region: 'Americas',
    timezone: 'America/New_York',
    currency: 'USD'
  },
  {
    code: 'CAN',
    name: 'Canada',
    region: 'Americas',
    timezone: 'America/Toronto',
    currency: 'CAD'
  }
]

/**
 * Global Cities Database
 */
export const GLOBAL_CITIES: City[] = [
  // Saudi Arabia
  { code: 'RYD', name: 'Riyadh', nameAr: 'الرياض', countryCode: 'SAU', coordinates: { latitude: 24.7136, longitude: 46.6753 } },
  { code: 'JED', name: 'Jeddah', nameAr: 'جدة', countryCode: 'SAU', coordinates: { latitude: 21.4858, longitude: 39.1925 } },
  { code: 'DMM', name: 'Dammam', nameAr: 'الدمام', countryCode: 'SAU', coordinates: { latitude: 26.4207, longitude: 50.0888 } },
  { code: 'KHO', name: 'Khobar', nameAr: 'الخبر', countryCode: 'SAU', coordinates: { latitude: 26.2794, longitude: 50.2080 } },
  { code: 'JBL', name: 'Jubail', nameAr: 'الجبيل', countryCode: 'SAU', coordinates: { latitude: 27.0174, longitude: 49.6225 } },
  { code: 'YNB', name: 'Yanbu', nameAr: 'ينبع', countryCode: 'SAU', coordinates: { latitude: 24.0892, longitude: 38.0617 } },
  { code: 'MKH', name: 'Mecca', nameAr: 'مكة المكرمة', countryCode: 'SAU', coordinates: { latitude: 21.3891, longitude: 39.8579 } },
  { code: 'MED', name: 'Medina', nameAr: 'المدينة المنورة', countryCode: 'SAU', coordinates: { latitude: 24.5247, longitude: 39.5692 } },
  { code: 'ABH', name: 'Abha', nameAr: 'أبها', countryCode: 'SAU', coordinates: { latitude: 18.2164, longitude: 42.5042 } },
  { code: 'TIF', name: 'Taif', nameAr: 'الطائف', countryCode: 'SAU', coordinates: { latitude: 21.2703, longitude: 40.4158 } },
  
  // UAE
  { code: 'DXB', name: 'Dubai', nameAr: 'دبي', countryCode: 'UAE', coordinates: { latitude: 25.2048, longitude: 55.2708 } },
  { code: 'AUH', name: 'Abu Dhabi', nameAr: 'أبو ظبي', countryCode: 'UAE', coordinates: { latitude: 24.4539, longitude: 54.3773 } },
  { code: 'SHJ', name: 'Sharjah', nameAr: 'الشارقة', countryCode: 'UAE', coordinates: { latitude: 25.3573, longitude: 55.4033 } },
  { code: 'AJM', name: 'Ajman', nameAr: 'عجمان', countryCode: 'UAE', coordinates: { latitude: 25.4052, longitude: 55.5136 } },
  
  // Iraq
  { code: 'BGW', name: 'Baghdad', nameAr: 'بغداد', countryCode: 'IRQ', coordinates: { latitude: 33.3152, longitude: 44.3661 } },
  { code: 'BSR', name: 'Basra', nameAr: 'البصرة', countryCode: 'IRQ', coordinates: { latitude: 30.5083, longitude: 47.7804 } },
  { code: 'EBL', name: 'Erbil', nameAr: 'أربيل', countryCode: 'IRQ', coordinates: { latitude: 36.1911, longitude: 44.0092 } },
  { code: 'NJF', name: 'Najaf', nameAr: 'النجف', countryCode: 'IRQ', coordinates: { latitude: 32.0290, longitude: 44.3396 } },
  { code: 'KBL', name: 'Karbala', nameAr: 'كربلاء', countryCode: 'IRQ', coordinates: { latitude: 32.6160, longitude: 44.0249 } },
  { code: 'MSL', name: 'Mosul', nameAr: 'الموصل', countryCode: 'IRQ', coordinates: { latitude: 36.3498, longitude: 43.1380 } },
  
  // Qatar
  { code: 'DOH', name: 'Doha', nameAr: 'الدوحة', countryCode: 'QAT', coordinates: { latitude: 25.2854, longitude: 51.5310 } },
  
  // Kuwait
  { code: 'KWI', name: 'Kuwait City', nameAr: 'مدينة الكويت', countryCode: 'KWT', coordinates: { latitude: 29.3759, longitude: 47.9774 } },
  
  // Oman
  { code: 'MCT', name: 'Muscat', nameAr: 'مسقط', countryCode: 'OMN', coordinates: { latitude: 23.5880, longitude: 58.3829 } },
  { code: 'SLL', name: 'Salalah', nameAr: 'صلالة', countryCode: 'OMN', coordinates: { latitude: 17.0151, longitude: 54.0924 } },
  
  // Bahrain
  { code: 'BAH', name: 'Manama', nameAr: 'المنامة', countryCode: 'BHR', coordinates: { latitude: 26.0667, longitude: 50.5577 } },
  
  // Egypt
  { code: 'CAI', name: 'Cairo', nameAr: 'القاهرة', countryCode: 'EGY', coordinates: { latitude: 30.0444, longitude: 31.2357 } },
  { code: 'ALY', name: 'Alexandria', nameAr: 'الإسكندرية', countryCode: 'EGY', coordinates: { latitude: 31.2001, longitude: 29.9187 } },
  
  // Jordan
  { code: 'AMM', name: 'Amman', nameAr: 'عمان', countryCode: 'JOR', coordinates: { latitude: 31.9539, longitude: 35.9106 } },
  
  // Turkey
  { code: 'IST', name: 'Istanbul', nameAr: 'إسطنبول', countryCode: 'TUR', coordinates: { latitude: 41.0082, longitude: 28.9784 } },
  { code: 'ANK', name: 'Ankara', nameAr: 'أنقرة', countryCode: 'TUR', coordinates: { latitude: 39.9334, longitude: 32.8597 } },
  
  // India
  { code: 'MUM', name: 'Mumbai', countryCode: 'IND', coordinates: { latitude: 19.0760, longitude: 72.8777 } },
  { code: 'DEL', name: 'Delhi', countryCode: 'IND', coordinates: { latitude: 28.6139, longitude: 77.2090 } },
  
  // China
  { code: 'BEI', name: 'Beijing', countryCode: 'CHN', coordinates: { latitude: 39.9042, longitude: 116.4074 } },
  { code: 'SHA', name: 'Shanghai', countryCode: 'CHN', coordinates: { latitude: 31.2304, longitude: 121.4737 } },
  
  // UK
  { code: 'LON', name: 'London', countryCode: 'GBR', coordinates: { latitude: 51.5074, longitude: -0.1278 } },
  
  // Germany
  { code: 'BER', name: 'Berlin', countryCode: 'DEU', coordinates: { latitude: 52.5200, longitude: 13.4050 } },
  { code: 'HAM', name: 'Hamburg', countryCode: 'DEU', coordinates: { latitude: 53.5511, longitude: 9.9937 } },
  
  // USA
  { code: 'NYC', name: 'New York', countryCode: 'USA', coordinates: { latitude: 40.7128, longitude: -74.0060 } },
  { code: 'LAX', name: 'Los Angeles', countryCode: 'USA', coordinates: { latitude: 34.0522, longitude: -118.2437 } },
  { code: 'CHI', name: 'Chicago', countryCode: 'USA', coordinates: { latitude: 41.8781, longitude: -87.6298 } }
]

/**
 * Get countries by region
 */
export function getCountriesByRegion(region: string): Country[] {
  return GLOBAL_COUNTRIES.filter(country => country.region === region)
}

/**
 * Get cities by country
 */
export function getCitiesByCountry(countryCode: string): City[] {
  return GLOBAL_CITIES.filter(city => city.countryCode === countryCode)
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return GLOBAL_COUNTRIES.find(country => country.code === code)
}

/**
 * Get city by code
 */
export function getCityByCode(code: string, countryCode?: string): City | undefined {
  if (countryCode) {
    return GLOBAL_CITIES.find(city => city.code === code && city.countryCode === countryCode)
  }
  return GLOBAL_CITIES.find(city => city.code === code)
}

/**
 * Generate location code
 */
export function generateLocationCode(countryCode: string, cityCode: string, sequence: number = 1): string {
  return `${countryCode}-${cityCode}-${sequence.toString().padStart(4, '0')}`
}











