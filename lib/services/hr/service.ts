/**
 * HR Service
 *
 * Employee management, attendance, payroll, training
 *
 * @module hr
 */

import { eventBus, createEvent } from "@/lib/services/event-store";
import type {
  Employee,
  AttendanceRecord,
  TrainingRecord,
  PayrollRecord,
} from "./types";

// ============================================================================
// IN-MEMORY STORE (Will be replaced with database)
// ============================================================================

class HRStore {
  private employees: Map<string, Employee> = new Map();
  private attendance: Map<string, AttendanceRecord> = new Map();
  private training: Map<string, TrainingRecord> = new Map();
  private payroll: Map<string, PayrollRecord> = new Map();

  getEmployee(id: string): Employee | undefined {
    return this.employees.get(id);
  }

  setEmployee(id: string, employee: Employee): void {
    this.employees.set(id, employee);
  }

  getAllEmployees(): Employee[] {
    return Array.from(this.employees.values());
  }

  getAttendance(employeeId: string, date: Date): AttendanceRecord | undefined {
    const dateKey = date.toISOString().split("T")[0];
    return Array.from(this.attendance.values()).find(
      (a) =>
        a.employeeId === employeeId &&
        a.date.toISOString().split("T")[0] === dateKey,
    );
  }

  setAttendance(id: string, record: AttendanceRecord): void {
    this.attendance.set(id, record);
  }

  getTraining(employeeId: string): TrainingRecord[] {
    return Array.from(this.training.values()).filter(
      (t) => t.employeeId === employeeId,
    );
  }

  setTraining(id: string, record: TrainingRecord): void {
    this.training.set(id, record);
  }

  getPayroll(
    employeeId: string,
    period: { from: Date; to: Date },
  ): PayrollRecord | undefined {
    return Array.from(this.payroll.values()).find(
      (p) =>
        p.employeeId === employeeId &&
        p.period.from.getTime() === period.from.getTime() &&
        p.period.to.getTime() === period.to.getTime(),
    );
  }

  setPayroll(id: string, record: PayrollRecord): void {
    this.payroll.set(id, record);
  }
}

const store = new HRStore();

// ============================================================================
// HR SERVICE
// ============================================================================

export class HRService {
  /**
   * Create employee
   */
  async createEmployee(
    data: Omit<Employee, "id" | "employeeNumber" | "hireDate">,
  ): Promise<Employee> {
    const employee: Employee = {
      ...data,
      id: `employee-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      employeeNumber: `EMP-${Date.now()}`,
      hireDate: new Date(),
      status: "ACTIVE",
    };

    store.setEmployee(employee.id, employee);

    // Publish event
    await eventBus.publish(
      createEvent(
        "EmployeeCreated",
        employee.id,
        "Employee",
        {
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
        },
        1,
        {
          tenantId: employee.tenantId,
          correlationId: `hr-create-${Date.now()}`,
          userId: "hr-service",
        },
      ),
    );

    return employee;
  }

  /**
   * Record attendance
   */
  async recordAttendance(
    employeeId: string,
    date: Date,
    checkIn?: Date,
    checkOut?: Date,
    tenantId: string = "default",
  ): Promise<AttendanceRecord> {
    const existing = store.getAttendance(employeeId, date);

    const record: AttendanceRecord = {
      id:
        existing?.id ||
        `attendance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      employeeId,
      date,
      checkIn: checkIn || existing?.checkIn,
      checkOut: checkOut || existing?.checkOut,
      status: this.determineAttendanceStatus(date, checkIn, checkOut),
      hours:
        checkIn && checkOut
          ? (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
          : existing?.hours || 0,
    };

    store.setAttendance(record.id, record);

    // Publish event
    await eventBus.publish(
      createEvent(
        "AttendanceRecorded",
        employeeId,
        "Employee",
        {
          employeeId,
          date: date.toISOString(),
          checkIn: checkIn?.toISOString(),
          checkOut: checkOut?.toISOString(),
          status: record.status,
          hours: record.hours,
        },
        1,
        {
          tenantId,
          correlationId: `attendance-${Date.now()}`,
          userId: "hr-service",
        },
      ),
    );

    return record;
  }

  /**
   * Register training
   */
  async registerTraining(
    employeeId: string,
    programId: string,
    programName: string,
    expiryDays: number,
    tenantId: string,
  ): Promise<TrainingRecord> {
    const record: TrainingRecord = {
      id: `training-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      employeeId,
      programId,
      programName,
      status: "PENDING",
      expiryDate: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
    };

    store.setTraining(record.id, record);

    return record;
  }

  /**
   * Generate payroll
   */
  async generatePayroll(
    employeeId: string,
    period: { from: Date; to: Date },
    baseSalary: number,
    allowances: number,
    deductions: number,
    tenantId: string,
  ): Promise<PayrollRecord> {
    const record: PayrollRecord = {
      id: `payroll-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      employeeId,
      period,
      baseSalary,
      allowances,
      deductions,
      netSalary: baseSalary + allowances - deductions,
      status: "DRAFT",
    };

    store.setPayroll(record.id, record);

    return record;
  }

  /**
   * Determine attendance status
   */
  private determineAttendanceStatus(
    date: Date,
    checkIn?: Date,
    checkOut?: Date,
  ): AttendanceRecord["status"] {
    if (!checkIn) {
      return "ABSENT";
    }

    const expectedCheckIn = new Date(date);
    expectedCheckIn.setHours(8, 0, 0, 0); // 8 AM

    if (checkIn.getTime() > expectedCheckIn.getTime() + 15 * 60 * 1000) {
      // 15 min grace
      return "LATE";
    }

    return "PRESENT";
  }
}

// Export singleton
export const hrService = new HRService();
