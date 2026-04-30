// Enhanced Data Cleaner for Inbound/Outbound Logistics Data
// Handles multiple date/time formats, standardizes durations, and categorizes processes

export interface RawInboundData {
  entity?: string
  primaryId?: string
  code?: string
  submission?: string
  eventDateStart?: string | Date
  eventTimeStart?: string
  quantity?: number | string
  confirmation?: string | boolean
  eventDateEnd?: string | Date
  timePoint1?: string
  timePoint2?: string
  duration1?: string | number
  duration2?: string | number
  timestamp?: string | Date
  assetId?: string
  assetType?: string
  status?: string
  outcome?: string
  confirmation2?: string | boolean
  personnel?: string
  location?: string
  locationName?: string
  category?: string
  action?: string
  processStatus?: string
  createdAt?: string | Date
  lastUpdate?: string | Date
}

export interface CleanedInboundData {
  // Document Identification
  id: string
  documentNumber: string
  externalReference?: string
  submission?: string
  
  // Entity Information
  entity: string
  customerNumber?: string
  customerName?: string
  
  // Process Type
  processType: 'INBOUND' | 'OUTBOUND'
  documentType: 'ASN' | 'GR' | 'ORDER' | 'RETURN'
  
  // Dates and Times (standardized to ISO strings)
  eventDateStart: string
  eventTimeStart: string
  eventDateEnd?: string
  eventTimeEnd?: string
  expectedDate?: string
  actualDate?: string
  createdAt: string
  lastUpdate: string
  
  // Time Points (standardized to HH:MM:SS)
  timePoint1?: string
  timePoint2?: string
  
  // Durations (standardized to seconds)
  duration1?: number // in seconds
  duration2?: number // in seconds
  totalDuration?: number // duration1 + duration2 in seconds
  
  // Status and Workflow
  status: string
  processStatus?: string
  confirmation: boolean
  confirmation2?: boolean
  
  // Personnel and Location
  personnel?: string
  location?: string
  locationName?: string
  
  // Asset Information
  assetType?: string
  assetId?: string
  
  // Operational Data
  quantity?: number
  category?: string
  action?: string
  outcome?: string
  
  // Goods Receipt Information (for inbound)
  goodsReceiptDate?: string
  goodsReceiptNumber?: string
  receivedBy?: string
  
  // Order Information (for outbound)
  orderNumber?: string
  orderDate?: string
  dispatchDate?: string
  
  // ========== INBOUND FIELDS ==========
  
  // Email/ASN Receipt
  emailDate?: string
  emailTime?: string
  emailTime2?: string
  
  // Vehicle Arrival
  vehicleArrivalDate?: string
  vehicleArrivalTime?: string
  vehicleId?: string
  truckDriverName?: string
  vehicleType?: string
  containerSealNumber?: string
  vehicleInspectionComment?: string
  photoBeforeOffloading?: 'Taken' | 'Not Taken'
  
  // Offloading Execution
  offloadingDate?: string
  offloadingStartTime?: string
  offloadingEndTime?: string
  forklift1?: string
  forklift2?: string
  offloadingForkliftDriver?: string
  
  // Putaway Execution
  putawayDate?: string
  putawayStartTime?: string
  putawayEndTime?: string
  putawayForkliftDriver?: string
  putawayForklift1?: string
  putawayForklift2?: string
  locationAllocated?: string
  locationAllocatedFlag?: boolean
  
  // Quality/Operations (Inbound)
  qcCheckStatus?: 'Completed' | 'Not Completed'
  ncr?: string
  operationOfficerName?: string
  
  // ========== OUTBOUND FIELDS ==========
  
  // Order/Pick List Information
  plProjectDnNumber?: string
  orderType?: string
  plEmailDate?: string
  plEmailTime?: string
  plEmailDateTime?: string
  plStatus?: string
  plIssuingDate?: string
  plIssuingTime?: string
  plIssuingDateTime?: string
  plCreating?: string
  customersClientName?: string
  remarks?: string
  remarks2?: string
  remarks3?: string
  remarks5?: string
  
  // Assignment
  assignedBy?: string
  assigningDate?: string
  assigningTime?: string
  assignedPerson?: string
  
  // Picking Execution
  pickingDate?: string
  pickingStartTime?: string
  pickingEndTime?: string
  plTime?: number
  
  // Quality Check (Outbound)
  qcDate?: string
  qcStartTime?: string
  qcEndTime?: string
  
  // Dispatch Notification
  dispatchNotification?: string
  
  // Driver/Transporter Arrival (Outbound)
  driverArrivalDate?: string
  driverArrivalTime?: string
  transporterName?: string
  
  // Dispatching Execution
  dispatchingStartDate?: string
  dispatchingEndTime?: string
  photoAfterLoading?: 'Taken' | 'Not Taken'
  
  // Outbound Material Information
  numOfPlt?: number
  driverSignedReceivingDeclaration?: 'Yes' | 'No'
}

/**
 * Parse various date formats to ISO string
 */
export function parseDate(dateInput: string | Date | undefined): string | undefined {
  if (!dateInput) return undefined
  
  if (dateInput instanceof Date) {
    return dateInput.toISOString()
  }
  
  const dateStr = String(dateInput).trim()
  if (!dateStr || dateStr === '-' || dateStr === 'N/A') return undefined
  
  // Handle DD-MM-YYYY format
  const ddMMyyyy = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/)
  if (ddMMyyyy) {
    const [, day, month, year] = ddMMyyyy
    const fullYear = year.length === 2 ? `20${year}` : year
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString()
  }
  
  // Handle MM/DD/YY format
  const mmddyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (mmddyy) {
    const [, month, day, year] = mmddyy
    const fullYear = `20${year}`
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString()
  }
  
  // Handle YYYY-MM-DD format
  const yyyymmdd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (yyyymmdd) {
    return new Date(dateStr).toISOString()
  }
  
  // Try standard Date parsing
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }
  
  return undefined
}

/**
 * Parse various time formats to HH:MM:SS
 */
export function parseTime(timeInput: string | undefined): string | undefined {
  if (!timeInput) return undefined
  
  const timeStr = String(timeInput).trim()
  if (!timeStr || timeStr === '-' || timeStr === 'N/A') return undefined
  
  // Handle HH:MM:SS format
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr
  }
  
  // Handle HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return `${timeStr}:00`
  }
  
  // Handle HH:MM AM/PM format
  const ampm = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampm) {
    let [, hours, minutes, period] = ampm
    let hour24 = parseInt(hours, 10)
    if (period.toUpperCase() === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`
  }
  
  return undefined
}

/**
 * Parse duration from various formats to seconds
 */
export function parseDuration(durationInput: string | number | undefined): number | undefined {
  if (durationInput === undefined || durationInput === null) return undefined
  
  // If already a number, assume it's in seconds
  if (typeof durationInput === 'number') {
    return durationInput
  }
  
  const durationStr = String(durationInput).trim()
  if (!durationStr || durationStr === '-' || durationStr === 'N/A') return undefined
  
  // Handle HH:MM format (e.g., "00:25", "01:04")
  const hhmm = durationStr.match(/^(\d{1,2}):(\d{2})$/)
  if (hhmm) {
    const [, hours, minutes] = hhmm
    return (parseInt(hours, 10) * 3600) + (parseInt(minutes, 10) * 60)
  }
  
  // Handle HH:MM:SS format
  const hhmmss = durationStr.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
  if (hhmmss) {
    const [, hours, minutes, seconds] = hhmmss
    return (parseInt(hours, 10) * 3600) + (parseInt(minutes, 10) * 60) + parseInt(seconds, 10)
  }
  
  // Handle number as seconds
  const num = parseFloat(durationStr)
  if (!isNaN(num)) {
    return Math.floor(num)
  }
  
  return undefined
}

/**
 * Combine date and time into ISO string
 */
export function combineDateTime(date: string | undefined, time: string | undefined): string | undefined {
  if (!date) return undefined
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return undefined
  
  if (time) {
    const [hours, minutes, seconds = '00'] = time.split(':')
    dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10), 0)
  }
  
  return dateObj.toISOString()
}

/**
 * Determine process type based on data
 */
export function determineProcessType(data: RawInboundData): 'INBOUND' | 'OUTBOUND' {
  // Check for order-related keywords
  const orderKeywords = ['order', 'dispatch', 'outbound', 'shipment']
  const inboundKeywords = ['asn', 'grn', 'receipt', 'inbound', 'arrival']
  
  const category = String(data.category || '').toLowerCase()
  const action = String(data.action || '').toLowerCase()
  const status = String(data.status || '').toLowerCase()
  
  if (orderKeywords.some(keyword => category.includes(keyword) || action.includes(keyword) || status.includes(keyword))) {
    return 'OUTBOUND'
  }
  
  if (inboundKeywords.some(keyword => category.includes(keyword) || action.includes(keyword) || status.includes(keyword))) {
    return 'INBOUND'
  }
  
  // Default: if it has ASN-like data, it's inbound
  if (data.primaryId || data.code || data.submission) {
    return 'INBOUND'
  }
  
  return 'INBOUND' // Default to inbound for now
}

/**
 * Determine document type based on process and data
 */
export function determineDocumentType(
  processType: 'INBOUND' | 'OUTBOUND',
  data: RawInboundData
): 'ASN' | 'GR' | 'ORDER' | 'RETURN' {
  if (processType === 'OUTBOUND') {
    return 'ORDER'
  }
  
  // Check for GR indicators
  const grKeywords = ['gr', 'grn', 'goods receipt', 'received', 'receipt']
  const status = String(data.status || '').toLowerCase()
  const action = String(data.action || '').toLowerCase()
  const category = String(data.category || '').toLowerCase()
  
  if (grKeywords.some(keyword => status.includes(keyword) || action.includes(keyword) || category.includes(keyword))) {
    return 'GR'
  }
  
  // Check for return indicators
  const returnKeywords = ['return', 'rrr', 'reverse']
  if (returnKeywords.some(keyword => status.includes(keyword) || action.includes(keyword) || category.includes(keyword))) {
    return 'RETURN'
  }
  
  // Default: ASN for inbound
  return 'ASN'
}

/**
 * Clean and standardize raw inbound data
 */
export function cleanInboundData(rawData: RawInboundData[]): CleanedInboundData[] {
  return rawData.map((raw, index) => {
    // Parse dates
    const eventDateStart = parseDate(raw.eventDateStart) || parseDate(raw.createdAt) || new Date().toISOString()
    const eventDateEnd = parseDate(raw.eventDateEnd)
    const createdAt = parseDate(raw.createdAt) || eventDateStart
    const lastUpdate = parseDate(raw.lastUpdate) || createdAt
    
    // Parse times
    const eventTimeStart = parseTime(raw.eventTimeStart) || '00:00:00'
    const eventTimeEnd = parseTime(raw.timePoint2)
    const timePoint1 = parseTime(raw.timePoint1)
    const timePoint2 = parseTime(raw.timePoint2)
    
    // Combine date and time for expected/actual dates
    const expectedDate = combineDateTime(eventDateStart, eventTimeStart)
    const actualDate = eventDateEnd ? combineDateTime(eventDateEnd, eventTimeEnd) : undefined
    
    // Parse durations
    const duration1 = parseDuration(raw.duration1)
    const duration2 = parseDuration(raw.duration2)
    const totalDuration = (duration1 || 0) + (duration2 || 0)
    
    // Determine process and document types
    const processType = determineProcessType(raw)
    const documentType = determineDocumentType(processType, raw)
    
    // Parse quantity
    const quantity = raw.quantity ? (typeof raw.quantity === 'number' ? raw.quantity : parseInt(String(raw.quantity), 10)) : undefined
    
    // Parse confirmation
    const confirmation = raw.confirmation === true || String(raw.confirmation || '').toUpperCase() === 'YES'
    const confirmation2 = raw.confirmation2 === true || String(raw.confirmation2 || '').toUpperCase() === 'YES'
    
    // Determine customer information
    const entity = String(raw.entity || 'UNKNOWN').trim()
    const isSika = entity === 'K-SIKA' || entity === 'SIKA'
    const customerNumber = isSika ? 'CUST-SIKA-001' : undefined
    const customerName = isSika ? 'SIKA' : entity
    
    // Generate document numbers
    const id = raw.submission || raw.primaryId || raw.code || `DOC-${String(index + 1).padStart(10, '0')}`
    const documentNumber = raw.primaryId || raw.code || id
    
    // Goods Receipt information (if GR document type)
    const goodsReceiptDate = documentType === 'GR' ? actualDate : undefined
    const goodsReceiptNumber = documentType === 'GR' ? `GR-${id}` : undefined
    const receivedBy = documentType === 'GR' ? raw.personnel : undefined
    
    // Order information (if ORDER document type)
    const orderNumber = documentType === 'ORDER' ? documentNumber : undefined
    const orderDate = documentType === 'ORDER' ? eventDateStart : undefined
    const dispatchDate = documentType === 'ORDER' ? actualDate : undefined
    
    return {
      id,
      documentNumber,
      externalReference: raw.code,
      submission: raw.submission,
      entity,
      customerNumber,
      customerName,
      processType,
      documentType,
      eventDateStart,
      eventTimeStart,
      eventDateEnd,
      eventTimeEnd,
      expectedDate,
      actualDate,
      createdAt,
      lastUpdate,
      timePoint1,
      timePoint2,
      duration1,
      duration2,
      totalDuration,
      status: String(raw.status || 'PENDING').trim(),
      processStatus: raw.processStatus,
      confirmation,
      confirmation2,
      personnel: raw.personnel,
      location: raw.location,
      locationName: raw.locationName,
      assetType: raw.assetType,
      assetId: raw.assetId,
      quantity,
      category: raw.category,
      action: raw.action,
      outcome: raw.outcome,
      goodsReceiptDate,
      goodsReceiptNumber,
      receivedBy,
      orderNumber,
      orderDate,
      dispatchDate,
    }
  })
}

/**
 * Group cleaned data by process type and document type
 */
export function groupCleanedData(data: CleanedInboundData[]) {
  const inbound = data.filter(d => d.processType === 'INBOUND')
  const outbound = data.filter(d => d.processType === 'OUTBOUND')
  
  const asns = inbound.filter(d => d.documentType === 'ASN')
  const grs = inbound.filter(d => d.documentType === 'GR')
  const orders = outbound.filter(d => d.documentType === 'ORDER')
  const returns = data.filter(d => d.documentType === 'RETURN')
  
  return {
    all: data,
    inbound,
    outbound,
    asns,
    grs,
    orders,
    returns,
  }
}

