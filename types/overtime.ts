// Employee Overtime Tracking Types

export interface EmployeeOvertimeRecord {
  employeeId: string
  employeeName: string
  date: Date | string
  hoursIssued: number
  reason?: string
  approvedBy?: string
  status?: 'Approved' | 'Pending' | 'Rejected'
}

export interface OvertimeDiscrepancy {
  employeeId: string
  employeeName: string
  date: Date | string
  calculatedHours: number
  issuedHours: number
  difference: number
  status: 'Match' | 'Underreported' | 'Overreported'
  details?: string
}

export function compareOvertime(
  calculatedHours: number,
  issuedHours: number,
  tolerance: number = 0.1 // 0.1 hour tolerance
): OvertimeDiscrepancy['status'] {
  const difference = Math.abs(calculatedHours - issuedHours)
  
  if (difference <= tolerance) {
    return 'Match'
  } else if (calculatedHours > issuedHours) {
    return 'Underreported'
  } else {
    return 'Overreported'
  }
}

