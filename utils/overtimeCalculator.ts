// Overtime Calculation Utility
// Working hours: 7:00 AM - 5:00 PM (standard)
// Break: 12:00 PM - 1:00 PM (excluded from work hours)
// Overtime: Anything after 5:00 PM

const STANDARD_START = 7; // 7:00 AM
const STANDARD_END = 17; // 5:00 PM
const BREAK_START = 12; // 12:00 PM
const BREAK_END = 13; // 1:00 PM

export interface OvertimeCalculation {
  standardHours: number
  overtimeHours: number
  breakHours: number
  totalHours: number
  preShiftHours: number
}

/**
 * Calculate overtime for employee/equipment based on working hours
 * Standard: 7:00 AM - 5:00 PM
 * Break: 12:00 PM - 1:00 PM (excluded from work hours)
 * Overtime: Anything after 5:00 PM
 * 
 * Examples:
 * - 4:00 PM to 6:00 PM = 1 hour standard + 1 hour overtime
 * - 6:00 AM to 6:00 PM = 1 hour pre-shift + 10 hours standard + 1 hour overtime
 * - Break time (12 PM-1 PM) is excluded from total hours
 */
export function calculateOvertime(
  startTime: Date | string,
  endTime: Date | string
): OvertimeCalculation {
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  // Ensure same date for calculation
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  // Get hours and minutes
  const startHour = startDate.getHours()
  const endHour = endDate.getHours()
  const startMinute = startDate.getMinutes()
  const endMinute = endDate.getMinutes()
  
  // Convert to decimal hours
  const startDecimal = startHour + startMinute / 60
  const endDecimal = endHour + endMinute / 60
  
  let standardHours = 0
  let overtimeHours = 0
  let breakHours = 0
  let preShiftHours = 0
  
  // Calculate pre-shift hours (before 7 AM)
  if (startDecimal < STANDARD_START) {
    preShiftHours = STANDARD_START - startDecimal
  }
  
  // Calculate break hours (12 PM - 1 PM)
  const breakStart = Math.max(startDecimal, BREAK_START)
  const breakEnd = Math.min(endDecimal, BREAK_END)
  if (breakEnd > breakStart) {
    breakHours = breakEnd - breakStart
  }
  
  // Calculate standard hours (7 AM - 5 PM, excluding break)
  const standardStart = Math.max(startDecimal, STANDARD_START)
  const standardEnd = Math.min(endDecimal, STANDARD_END)
  if (standardEnd > standardStart) {
    standardHours = standardEnd - standardStart - breakHours
    if (standardHours < 0) standardHours = 0
  }
  
  // Calculate overtime hours (after 5 PM)
  if (endDecimal > STANDARD_END) {
    overtimeHours = endDecimal - STANDARD_END
  }
  
  const totalHours = preShiftHours + standardHours + overtimeHours
  
  return {
    standardHours: Math.max(0, standardHours),
    overtimeHours: Math.max(0, overtimeHours),
    breakHours: Math.max(0, breakHours),
    totalHours: Math.max(0, totalHours),
    preShiftHours: Math.max(0, preShiftHours),
  }
}

/**
 * Calculate overtime for multiple time periods (e.g., offloading + putaway)
 */
export function calculateTotalOvertime(
  timePeriods: Array<{ startTime: Date | string; endTime: Date | string }>
): OvertimeCalculation {
  let totalStandard = 0
  let totalOvertime = 0
  let totalBreak = 0
  let totalPreShift = 0
  
  timePeriods.forEach(({ startTime, endTime }) => {
    const calc = calculateOvertime(startTime, endTime)
    totalStandard += calc.standardHours
    totalOvertime += calc.overtimeHours
    totalBreak += calc.breakHours
    totalPreShift += calc.preShiftHours
  })
  
  return {
    standardHours: totalStandard,
    overtimeHours: totalOvertime,
    breakHours: totalBreak,
    totalHours: totalStandard + totalOvertime + totalPreShift,
    preShiftHours: totalPreShift,
  }
}

/**
 * Calculate overtime for an employee across multiple operations
 */
export function calculateEmployeeOvertime(
  operations: Array<{
    employeeName: string
    startTime: Date | string
    endTime: Date | string
  }>
): Map<string, OvertimeCalculation> {
  const employeeMap = new Map<string, Array<{ startTime: Date | string; endTime: Date | string }>>()
  
  // Group operations by employee
  operations.forEach(({ employeeName, startTime, endTime }) => {
    if (!employeeMap.has(employeeName)) {
      employeeMap.set(employeeName, [])
    }
    employeeMap.get(employeeName)!.push({ startTime, endTime })
  })
  
  // Calculate overtime for each employee
  const result = new Map<string, OvertimeCalculation>()
  employeeMap.forEach((timePeriods, employeeName) => {
    result.set(employeeName, calculateTotalOvertime(timePeriods))
  })
  
  return result
}

/**
 * Calculate overtime for equipment across multiple operations
 */
export function calculateEquipmentOvertime(
  operations: Array<{
    equipmentId: string
    startTime: Date | string
    endTime: Date | string
  }>
): Map<string, OvertimeCalculation> {
  const equipmentMap = new Map<string, Array<{ startTime: Date | string; endTime: Date | string }>>()
  
  // Group operations by equipment
  operations.forEach(({ equipmentId, startTime, endTime }) => {
    if (!equipmentMap.has(equipmentId)) {
      equipmentMap.set(equipmentId, [])
    }
    equipmentMap.get(equipmentId)!.push({ startTime, endTime })
  })
  
  // Calculate overtime for each equipment
  const result = new Map<string, OvertimeCalculation>()
  equipmentMap.forEach((timePeriods, equipmentId) => {
    result.set(equipmentId, calculateTotalOvertime(timePeriods))
  })
  
  return result
}

