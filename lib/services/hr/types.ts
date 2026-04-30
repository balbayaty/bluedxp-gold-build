/**
 * HR Module Types
 *
 * Types for HR module
 * Employee management, attendance, payroll, training
 *
 * @module hr
 */

// ============================================================================
// HR TYPES
// ============================================================================

/**
 * Employee
 */
export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  department: string;
  position: string;
  hireDate: Date;
  status: "ACTIVE" | "INACTIVE" | "TERMINATED";
  tenantId: string;
}

/**
 * Attendance record
 */
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  hours: number;
}

/**
 * Training record
 */
export interface TrainingRecord {
  id: string;
  employeeId: string;
  programId: string;
  programName: string;
  completedDate?: Date;
  expiryDate?: Date;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  certificateId?: string;
}

/**
 * Payroll record
 */
export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: { from: Date; to: Date };
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: "DRAFT" | "APPROVED" | "PAID";
}
