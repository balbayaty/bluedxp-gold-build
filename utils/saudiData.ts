/**
 * Saudi Arabia Data Module
 * Comprehensive Saudi-specific data for warehouses, locations, regulators, and compliance
 */

// Saudi Cities and Major Industrial Areas
export const saudiCities = [
  { name: 'Riyadh', arabic: 'الرياض', region: 'Riyadh', coordinates: { lat: 24.7136, lng: 46.6753 } },
  { name: 'Jeddah', arabic: 'جدة', region: 'Makkah', coordinates: { lat: 21.4858, lng: 39.1925 } },
  { name: 'Dammam', arabic: 'الدمام', region: 'Eastern Province', coordinates: { lat: 26.4207, lng: 50.0888 } },
  { name: 'Khobar', arabic: 'الخبر', region: 'Eastern Province', coordinates: { lat: 26.2172, lng: 50.1971 } },
  { name: 'Mecca', arabic: 'مكة المكرمة', region: 'Makkah', coordinates: { lat: 21.3891, lng: 39.8579 } },
  { name: 'Medina', arabic: 'المدينة المنورة', region: 'Al Madinah', coordinates: { lat: 24.5247, lng: 39.5692 } },
  { name: 'Abha', arabic: 'أبها', region: 'Asir', coordinates: { lat: 18.2164, lng: 42.5042 } },
  { name: 'Tabuk', arabic: 'تبوك', region: 'Tabuk', coordinates: { lat: 28.3998, lng: 36.5705 } },
  { name: 'Buraidah', arabic: 'بريدة', region: 'Al Qassim', coordinates: { lat: 26.3260, lng: 43.9750 } },
  { name: 'Khamis Mushait', arabic: 'خميس مشيط', region: 'Asir', coordinates: { lat: 18.3000, lng: 42.7333 } },
  { name: 'Hail', arabic: 'حائل', region: 'Hail', coordinates: { lat: 27.5114, lng: 41.7208 } },
  { name: 'Najran', arabic: 'نجران', region: 'Najran', coordinates: { lat: 17.4924, lng: 44.1277 } },
  { name: 'Al Jubail', arabic: 'الجبيل', region: 'Eastern Province', coordinates: { lat: 27.0174, lng: 49.6225 } },
  { name: 'Yanbu', arabic: 'ينبع', region: 'Al Madinah', coordinates: { lat: 24.0892, lng: 38.0618 } },
  { name: 'Al Khafji', arabic: 'الخفجي', region: 'Eastern Province', coordinates: { lat: 28.4392, lng: 48.4913 } },
]

// Saudi Industrial Areas by City
export const saudiIndustrialAreas: Record<string, string[]> = {
  'Riyadh': [
    'First Industrial City (المنطقة الصناعية الأولى)',
    'Second Industrial City (المنطقة الصناعية الثانية)',
    'Third Industrial City (المنطقة الصناعية الثالثة)',
    'Modon Industrial City (مدن)',
    'King Salman Energy Park (SPARK)',
    'Riyadh Logistics Park',
  ],
  'Jeddah': [
    'First Industrial City',
    'Second Industrial City',
    'Modon Industrial City',
    'King Abdullah Economic City (KAEC)',
    'Jeddah Logistics Park',
  ],
  'Dammam': [
    'First Industrial City',
    'Second Industrial City',
    'Modon Industrial City',
    'Dammam Logistics Hub',
    'King Fahd Industrial Port',
  ],
  'Khobar': [
    'Industrial Area',
    'Modon Industrial City',
    'Khobar Logistics Center',
  ],
  'Al Jubail': [
    'Jubail Industrial City',
    'Royal Commission for Jubail',
    'Jubail Port Area',
  ],
  'Yanbu': [
    'Yanbu Industrial City',
    'Royal Commission for Yanbu',
    'Yanbu Port Area',
  ],
}

// Saudi Regulatory Bodies
export const saudiRegulators = {
  SABER: {
    name: 'SABER (Saudi Product Safety Program)',
    arabic: 'سابر',
    fullName: 'Saudi Standards, Metrology and Quality Organization - SABER',
    website: 'https://saber.sa',
    description: 'Product safety and conformity assessment program',
    certifications: ['SABER Certificate', 'Product Certificate of Conformity (PCoC)', 'Shipment Certificate of Conformity (SCoC)'],
  },
  SFDA: {
    name: 'SFDA (Saudi Food and Drug Authority)',
    arabic: 'هيئة الغذاء والدواء',
    fullName: 'Saudi Food and Drug Authority',
    website: 'https://www.sfda.gov.sa',
    description: 'Regulates food, drugs, medical devices, and cosmetics',
    certifications: ['Food Import Permit', 'Drug Registration', 'Medical Device License', 'Cosmetic Product Registration'],
  },
  SASO: {
    name: 'SASO (Saudi Standards, Metrology and Quality Organization)',
    arabic: 'الهيئة السعودية للمواصفات والمقاييس والجودة',
    fullName: 'Saudi Standards, Metrology and Quality Organization',
    website: 'https://www.saso.gov.sa',
    description: 'National standards and quality organization',
    certifications: ['SASO Certificate', 'Quality Mark', 'Conformity Certificate'],
  },
  MODON: {
    name: 'MODON (Saudi Industrial Property Authority)',
    arabic: 'المدينة الصناعية',
    fullName: 'Saudi Industrial Property Authority',
    website: 'https://www.modon.gov.sa',
    description: 'Manages industrial cities and zones',
    certifications: ['Industrial License', 'Warehouse License', 'Factory License'],
  },
  ZATCA: {
    name: 'ZATCA (Zakat, Tax and Customs Authority)',
    arabic: 'هيئة الزكاة والضريبة والجمارك',
    fullName: 'Zakat, Tax and Customs Authority',
    website: 'https://zatca.gov.sa',
    description: 'Customs, tax, and zakat administration',
    certifications: ['Customs Clearance', 'Import License', 'Export License', 'Bonded Warehouse License'],
  },
  MOC: {
    name: 'MOC (Ministry of Commerce)',
    arabic: 'وزارة التجارة',
    fullName: 'Ministry of Commerce',
    website: 'https://moc.gov.sa',
    description: 'Commercial registration and business licensing',
    certifications: ['Commercial Registration (CR)', 'Import/Export License', 'Warehouse License'],
  },
  MOI: {
    name: 'MOI (Ministry of Interior)',
    arabic: 'وزارة الداخلية',
    fullName: 'Ministry of Interior',
    website: 'https://www.moi.gov.sa',
    description: 'Security and safety compliance',
    certifications: ['Security Clearance', 'Safety Certificate'],
  },
  MOMRA: {
    name: 'MOMRA (Ministry of Municipal and Rural Affairs)',
    arabic: 'وزارة الشؤون البلدية والقروية',
    fullName: 'Ministry of Municipal and Rural Affairs',
    website: 'https://www.momra.gov.sa',
    description: 'Municipal licensing and building permits',
    certifications: ['Building Permit', 'Municipal License', 'Warehouse Operating License'],
  },
}

// Saudi Compliance Standards
export const saudiComplianceStandards = [
  'SASO Standards',
  'SABER Certification',
  'SFDA Food Safety',
  'MODON Industrial Compliance',
  'ZATCA Customs Compliance',
  'ISO 9001:2015',
  'ISO 14001:2015',
  'ISO 45001:2018',
  'OHSAS 18001',
  'HACCP (Hazard Analysis Critical Control Points)',
  'GMP (Good Manufacturing Practices)',
  'Halal Certification',
  'Saudi Building Code (SBC)',
  'Fire Safety Standards',
  'Environmental Compliance',
]

// Saudi Warehouse Types and Specializations
export const saudiWarehouseTypes = {
  'GENERAL': { name: 'General Warehouse', arabic: 'مستودع عام' },
  'COLD_STORAGE': { name: 'Cold Storage', arabic: 'مستودع تبريد' },
  'FROZEN': { name: 'Frozen Storage', arabic: 'مستودع تجميد' },
  'HAZMAT': { name: 'Hazardous Materials', arabic: 'مواد خطرة' },
  'BONDED': { name: 'Bonded Warehouse', arabic: 'مستودع جمركي' },
  'PHARMACEUTICAL': { name: 'Pharmaceutical', arabic: 'مستودع أدوية' },
  'FOOD_GRADE': { name: 'Food Grade', arabic: 'مستودع أغذية' },
  'AUTOMOTIVE': { name: 'Automotive Parts', arabic: 'قطع غيار سيارات' },
  'ELECTRONICS': { name: 'Electronics', arabic: 'إلكترونيات' },
  'TEXTILES': { name: 'Textiles', arabic: 'منسوجات' },
}

// Saudi Postal Codes by City (Sample)
export const saudiPostalCodes: Record<string, { range: [number, number], format: string }> = {
  'Riyadh': { range: [11564, 12836], format: '#####' },
  'Jeddah': { range: [21461, 23811], format: '#####' },
  'Dammam': { range: [31421, 32416], format: '#####' },
  'Khobar': { range: [34428, 34465], format: '#####' },
  'Mecca': { range: [24231, 24285], format: '#####' },
  'Medina': { range: [42311, 42393], format: '#####' },
}

// Get random Saudi city
export function getRandomSaudiCity() {
  return saudiCities[Math.floor(Math.random() * saudiCities.length)]
}

// Get random industrial area for a city
export function getRandomIndustrialArea(cityName: string): string {
  const areas = saudiIndustrialAreas[cityName] || saudiIndustrialAreas['Riyadh']
  return areas[Math.floor(Math.random() * areas.length)]
}

// Get random Saudi postal code
export function getRandomSaudiPostalCode(cityName: string): string {
  const cityData = saudiPostalCodes[cityName] || saudiPostalCodes['Riyadh']
  const code = Math.floor(Math.random() * (cityData.range[1] - cityData.range[0] + 1)) + cityData.range[0]
  return String(code).padStart(5, '0')
}

// Get Saudi phone number format
export function getSaudiPhoneNumber(): string {
  const prefixes = ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return `+966${prefix}${number}`
}

// Saudi warehouse names
export const saudiWarehouseNames = [
  'Riyadh Main Distribution Center',
  'Jeddah Logistics Hub',
  'Dammam Port Warehouse',
  'Khobar Storage Facility',
  'Riyadh Second Industrial City Warehouse',
  'Jeddah King Abdullah Port Warehouse',
  'Dammam Industrial Warehouse',
  'Riyadh Cold Storage Facility',
  'Jeddah Food Grade Warehouse',
  'Dammam Bonded Warehouse',
  'Riyadh Pharmaceutical Warehouse',
  'Jeddah E-commerce Fulfillment Center',
  'Dammam Automotive Parts Warehouse',
  'Riyadh Electronics Distribution Center',
  'Jeddah Textiles Warehouse',
]

// Saudi-specific warehouse capabilities
export const saudiWarehouseCapabilities = [
  { id: 'saber', name: 'SABER Compliance', description: 'SABER product certification handling' },
  { id: 'sfda', name: 'SFDA Compliance', description: 'Food and drug authority compliance' },
  { id: 'halal', name: 'Halal Storage', description: 'Halal-certified storage facilities' },
  { id: 'bonded', name: 'Bonded Warehouse', description: 'Customs-bonded storage' },
  { id: 'cold-chain', name: 'Cold Chain', description: 'Temperature-controlled logistics' },
  { id: 'hazmat', name: 'Hazmat Storage', description: 'Hazardous materials handling' },
  { id: 'pharma', name: 'Pharmaceutical', description: 'Pharmaceutical storage (SFDA licensed)' },
  { id: 'food-grade', name: 'Food Grade', description: 'Food-grade storage (SFDA certified)' },
]

// Saudi timezone
export const SAUDI_TIMEZONE = 'Asia/Riyadh'

// Saudi currency (already set to SAR)
export const SAUDI_CURRENCY = 'SAR'

// Saudi date format (Hijri support)
export const SAUDI_DATE_FORMAT = 'dd/MM/yyyy' // Gregorian
export const SAUDI_HIJRI_FORMAT = 'dd/MM/yyyy' // Hijri


