/**
 * Data Cleaning Utility
 * Handles parsing and standardization of dates, times, and status values
 */

export interface RawASNData {
  entity?: string
  primaryId?: string
  date1?: string // DD-MM-YYYY
  time1?: string // HH:MM or HH:MM:SS
  date2?: string // MM/DD/YY
  time2?: string // HH:MM AM/PM
  timestamp1?: string // MM/DD/YY HH:MM AM/PM
  code?: string
  personnel?: string
  assetType?: string
  action?: string
  outcome?: string
  date3?: string
  time3?: string
  time4?: string
  timestamp2?: string
  duration1?: string // MM:SS
  duration2?: string // MM:SS
  assetId?: string
  category?: string
  location?: string
  processStatus?: string
  confirmation?: string
  date4?: string
}

export interface CleanedASNData {
  id: string
  entity: string
  primaryId: string
  createdAt: Date
  expectedDate: Date
  actualDate: Date | null
  duration1: number // in seconds
  duration2: number // in seconds
  code: string
  personnel: string
  assetType: 'Trailer' | 'container'
  action: string
  outcome: string
  assetId: string
  category: string
  location: string
  processStatus: 'Completed' | 'In Progress' | 'Pending'
  confirmation: boolean
  lastUpdate: Date
  status: 'pending' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled'
}

/**
 * Parse date in DD-MM-YYYY format
 */
export function parseDateDDMMYYYY(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
  const year = parseInt(parts[2], 10)
  if (year < 2000) return null
  return new Date(year, month, day)
}

/**
 * Parse date in MM/DD/YY format
 */
export function parseDateMMDDYY(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  const month = parseInt(parts[0], 10) - 1
  const day = parseInt(parts[1], 10)
  let year = parseInt(parts[2], 10)
  if (year < 100) {
    year += 2000 // Convert 2-digit year to 4-digit
  }
  return new Date(year, month, day)
}

/**
 * Parse time in HH:MM or HH:MM:SS format
 */
export function parseTime(timeStr: string): { hours: number; minutes: number; seconds: number } | null {
  if (!timeStr || timeStr === '-') return null
  const parts = timeStr.split(':')
  if (parts.length < 2) return null
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0
  return { hours, minutes, seconds }
}

/**
 * Parse time in HH:MM AM/PM format
 */
export function parseTimeAMPM(timeStr: string): { hours: number; minutes: number; seconds: number } | null {
  if (!timeStr || timeStr === '-') return null
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()
  
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  
  return { hours, minutes, seconds: 0 }
}

/**
 * Parse timestamp in MM/DD/YY HH:MM AM/PM format
 */
export function parseTimestamp(timestampStr: string): Date | null {
  if (!timestampStr || timestampStr === '-') return null
  const parts = timestampStr.split(' ')
  if (parts.length < 2) return null
  
  const datePart = parseDateMMDDYY(parts[0])
  if (!datePart) return null
  
  const timePart = parseTimeAMPM(parts.slice(1).join(' '))
  if (!timePart) return null
  
  const date = new Date(datePart)
  date.setHours(timePart.hours, timePart.minutes, timePart.seconds, 0)
  return date
}

/**
 * Parse duration in MM:SS format to seconds
 */
export function parseDuration(durationStr: string): number {
  if (!durationStr || durationStr === '-') return 0
  const parts = durationStr.split(':')
  if (parts.length !== 2) return 0
  const minutes = parseInt(parts[0], 10) || 0
  const seconds = parseInt(parts[1], 10) || 0
  return minutes * 60 + seconds
}

/**
 * Map status values to standardized status
 */
export function mapStatus(action: string, outcome: string, processStatus: string): 'pending' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled' {
  if (processStatus === 'Completed') {
    if (outcome === 'Not Taken') return 'delayed'
    return 'delivered'
  }
  if (action === 'Carried' && outcome === 'Not Taken') return 'in-transit'
  if (outcome === 'Not Taken') return 'pending'
  return 'pending'
}

/**
 * Clean and standardize raw ASN data
 */
export function cleanASNData(raw: RawASNData, index: number): CleanedASNData | null {
  try {
    // Generate ID if not present
    const id = raw.primaryId || `ASN-${String(index + 1).padStart(3, '0')}`
    
    // Parse dates - use the first available date as created date
    let createdAt = parseDateDDMMYYYY(raw.date1 || '') || 
                   parseDateMMDDYY(raw.date2 || '') ||
                   parseTimestamp(raw.timestamp1 || '') ||
                   new Date()
    
    // Parse expected date (use date2 or timestamp1)
    let expectedDate = parseDateMMDDYY(raw.date2 || '') ||
                      parseTimestamp(raw.timestamp1 || '') ||
                      parseDateDDMMYYYY(raw.date1 || '') ||
                      new Date()
    
    // Parse actual date (use date3 or timestamp2)
    let actualDate = parseDateDDMMYYYY(raw.date3 || '') ||
                    parseTimestamp(raw.timestamp2 || '') ||
                    null
    
    // If process is completed, use the latest timestamp as actual date
    if (raw.processStatus === 'Completed' && !actualDate) {
      actualDate = parseTimestamp(raw.timestamp2 || '') ||
                   parseDateDDMMYYYY(raw.date4 || '') ||
                   new Date()
    }
    
    // Parse durations
    const duration1 = parseDuration(raw.duration1 || '')
    const duration2 = parseDuration(raw.duration2 || '')
    
    // Map status
    const status = mapStatus(raw.action || '', raw.outcome || '', raw.processStatus || '')
    
    // Parse asset type
    const assetType = (raw.assetType?.toLowerCase() === 'container' ? 'container' : 'Trailer') as 'Trailer' | 'container'
    
    // Parse confirmation
    const confirmation = (raw.confirmation?.toUpperCase() === 'YES')
    
    // Map process status
    let processStatus: 'Completed' | 'In Progress' | 'Pending' = 'Pending'
    if (raw.processStatus === 'Completed') {
      processStatus = 'Completed'
    } else if (raw.action === 'Carried') {
      processStatus = 'In Progress'
    }
    
    // Get last update timestamp
    const lastUpdate = parseTimestamp(raw.timestamp2 || '') ||
                      parseTimestamp(raw.timestamp1 || '') ||
                      parseDateDDMMYYYY(raw.date4 || '') ||
                      new Date()
    
    return {
      id,
      entity: raw.entity || 'Unknown',
      primaryId: raw.primaryId || id,
      createdAt,
      expectedDate,
      actualDate,
      duration1,
      duration2,
      code: raw.code || '',
      personnel: raw.personnel || '',
      assetType,
      action: raw.action || '',
      outcome: raw.outcome || '',
      assetId: raw.assetId || '',
      category: raw.category || '',
      location: raw.location || '',
      processStatus,
      confirmation,
      lastUpdate,
      status,
    }
  } catch (error) {
    console.error('Error cleaning ASN data:', error, raw)
    return null
  }
}

/**
 * Clean array of raw ASN data
 */
export function cleanASNDataArray(rawData: RawASNData[]): CleanedASNData[] {
  return rawData
    .map((raw, index) => cleanASNData(raw, index))
    .filter((data): data is CleanedASNData => data !== null)
}

