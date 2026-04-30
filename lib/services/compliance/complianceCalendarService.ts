/**
 * Compliance Calendar Service
 * Track deadlines, renewals, inspections, and compliance milestones
 * Automated reminders and deadline management
 */

import {
  ComplianceRecord,
  ComplianceDocument,
  ComplianceCertificate,
} from "@/types/compliance";
import { LocalRegulation } from "@/types/compliance-hierarchy";

// ============================================================================
// CALENDAR EVENTS
// ============================================================================

export interface ComplianceCalendarEvent {
  id: string;
  type:
    | "DEADLINE"
    | "RENEWAL"
    | "INSPECTION"
    | "AUDIT"
    | "REVIEW"
    | "SUBMISSION";
  title: string;
  description: string;
  recordId?: string;
  requirementId?: string;
  documentId?: string;
  certificateId?: string;

  // Timing
  startDate: Date | string;
  dueDate: Date | string;
  reminderDate?: Date | string;
  completedDate?: Date | string;

  // Status
  status: "UPCOMING" | "DUE_SOON" | "OVERDUE" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  // Metadata
  assignedTo?: string;
  notes?: string;
  relatedEvents?: string[];
  tags: string[];

  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CalendarView {
  view: "MONTH" | "WEEK" | "DAY" | "LIST";
  startDate: Date | string;
  endDate: Date | string;
  events: ComplianceCalendarEvent[];
  summary: CalendarSummary;
}

export interface CalendarSummary {
  totalEvents: number;
  upcoming: number;
  dueSoon: number;
  overdue: number;
  completed: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

// ============================================================================
// CALENDAR SERVICE
// ============================================================================

class ComplianceCalendarStore {
  private events: Map<string, ComplianceCalendarEvent> = new Map();

  addEvent(event: ComplianceCalendarEvent): void {
    this.events.set(event.id, event);
  }

  getEvent(id: string): ComplianceCalendarEvent | undefined {
    return this.events.get(id);
  }

  getAllEvents(): ComplianceCalendarEvent[] {
    return Array.from(this.events.values());
  }

  getEventsByDateRange(
    startDate: Date,
    endDate: Date,
  ): ComplianceCalendarEvent[] {
    return this.getAllEvents().filter((event) => {
      const eventDate = new Date(event.dueDate);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  getUpcomingEvents(days: number = 30): ComplianceCalendarEvent[] {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.getAllEvents()
      .filter((event) => {
        const eventDate = new Date(event.dueDate);
        return (
          eventDate >= now &&
          eventDate <= future &&
          event.status !== "COMPLETED"
        );
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
  }

  getOverdueEvents(): ComplianceCalendarEvent[] {
    const now = new Date();
    return this.getAllEvents()
      .filter((event) => {
        const eventDate = new Date(event.dueDate);
        return (
          eventDate < now &&
          event.status !== "COMPLETED" &&
          event.status !== "CANCELLED"
        );
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
  }
}

const calendarStore = new ComplianceCalendarStore();

/**
 * Generate calendar events from compliance records
 */
export function generateCalendarEvents(
  records: ComplianceRecord[],
): ComplianceCalendarEvent[] {
  const events: ComplianceCalendarEvent[] = [];

  for (const record of records) {
    // Document expiry events
    for (const document of record.documents) {
      if (document.expiryDate) {
        const expiryDate = new Date(document.expiryDate);
        const reminderDate = new Date(
          expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000,
        ); // 30 days before

        let status: ComplianceCalendarEvent["status"] = "UPCOMING";
        const now = new Date();
        if (expiryDate < now) {
          status = "OVERDUE";
        } else if (reminderDate <= now) {
          status = "DUE_SOON";
        }

        events.push({
          id: `event-doc-${document.id}`,
          type: "RENEWAL",
          title: `Renew ${document.name}`,
          description: `${document.name} expires on ${expiryDate.toLocaleDateString()}`,
          recordId: record.id,
          documentId: document.id,
          startDate: reminderDate.toISOString(),
          dueDate: expiryDate.toISOString(),
          reminderDate: reminderDate.toISOString(),
          status,
          priority: document.status === "EXPIRED" ? "CRITICAL" : "HIGH",
          tags: ["document", "renewal", record.requirement.category],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Certificate expiry events
    for (const certificate of record.certificates) {
      const expiryDate = new Date(certificate.expiryDate);
      const reminderDate = new Date(
        expiryDate.getTime() - 45 * 24 * 60 * 60 * 1000,
      ); // 45 days before

      let status: ComplianceCalendarEvent["status"] = "UPCOMING";
      const now = new Date();
      if (expiryDate < now) {
        status = "OVERDUE";
      } else if (reminderDate <= now) {
        status = "DUE_SOON";
      }

      events.push({
        id: `event-cert-${certificate.id}`,
        type: "RENEWAL",
        title: `Renew Certificate ${certificate.certificateNumber}`,
        description: `Certificate ${certificate.certificateNumber} expires on ${expiryDate.toLocaleDateString()}`,
        recordId: record.id,
        certificateId: certificate.id,
        startDate: reminderDate.toISOString(),
        dueDate: expiryDate.toISOString(),
        reminderDate: reminderDate.toISOString(),
        status,
        priority: certificate.status === "EXPIRED" ? "CRITICAL" : "HIGH",
        tags: ["certificate", "renewal", record.requirement.category],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Next compliance check
    if (record.nextCheckDue) {
      const checkDate = new Date(record.nextCheckDue);
      const reminderDate = new Date(
        checkDate.getTime() - 7 * 24 * 60 * 60 * 1000,
      ); // 7 days before

      let status: ComplianceCalendarEvent["status"] = "UPCOMING";
      const now = new Date();
      if (checkDate < now) {
        status = "OVERDUE";
      } else if (reminderDate <= now) {
        status = "DUE_SOON";
      }

      events.push({
        id: `event-check-${record.id}`,
        type: "REVIEW",
        title: `Compliance Check: ${record.requirement.title}`,
        description: `Scheduled compliance check for ${record.requirement.title}`,
        recordId: record.id,
        requirementId: record.requirementId,
        startDate: reminderDate.toISOString(),
        dueDate: checkDate.toISOString(),
        reminderDate: reminderDate.toISOString(),
        status,
        priority: record.complianceScore < 70 ? "HIGH" : "MEDIUM",
        tags: ["compliance-check", "review", record.requirement.category],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Violation resolution deadlines
    for (const violation of record.violations.filter(
      (v) => v.status === "OPEN",
    )) {
      const resolutionDeadline = new Date(violation.detectedAt);
      resolutionDeadline.setDate(resolutionDeadline.getDate() + 30); // 30 days to resolve

      let status: ComplianceCalendarEvent["status"] = "UPCOMING";
      const now = new Date();
      if (resolutionDeadline < now) {
        status = "OVERDUE";
      } else if (
        (resolutionDeadline.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24) <=
        7
      ) {
        status = "DUE_SOON";
      }

      events.push({
        id: `event-violation-${violation.id}`,
        type: "DEADLINE",
        title: `Resolve Violation: ${violation.description.substring(0, 50)}`,
        description: violation.description,
        recordId: record.id,
        startDate: new Date(violation.detectedAt).toISOString(),
        dueDate: resolutionDeadline.toISOString(),
        status,
        priority: violation.severity,
        tags: ["violation", "resolution", violation.severity.toLowerCase()],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Add events to store
  for (const event of events) {
    calendarStore.addEvent(event);
  }

  return events;
}

/**
 * Get calendar view
 */
export function getCalendarView(
  view: "MONTH" | "WEEK" | "DAY" | "LIST",
  startDate: Date | string,
  endDate?: Date | string,
): CalendarView {
  const start = new Date(startDate);
  const end = endDate
    ? new Date(endDate)
    : (() => {
        const e = new Date(start);
        if (view === "MONTH") {
          e.setMonth(e.getMonth() + 1);
        } else if (view === "WEEK") {
          e.setDate(e.getDate() + 7);
        } else if (view === "DAY") {
          e.setDate(e.getDate() + 1);
        } else {
          e.setDate(e.getDate() + 30); // LIST view: 30 days
        }
        return e;
      })();

  const events = calendarStore.getEventsByDateRange(start, end);

  const now = new Date();
  const summary: CalendarSummary = {
    totalEvents: events.length,
    upcoming: events.filter((e) => {
      const due = new Date(e.dueDate);
      return (
        due > now && (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) > 7
      );
    }).length,
    dueSoon: events.filter((e) => {
      const due = new Date(e.dueDate);
      const daysUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return due > now && daysUntil <= 7 && daysUntil > 0;
    }).length,
    overdue: events.filter((e) => {
      const due = new Date(e.dueDate);
      return due < now && e.status !== "COMPLETED";
    }).length,
    completed: events.filter((e) => e.status === "COMPLETED").length,
    byType: {},
    byPriority: {},
  };

  // Calculate by type
  for (const event of events) {
    summary.byType[event.type] = (summary.byType[event.type] || 0) + 1;
    summary.byPriority[event.priority] =
      (summary.byPriority[event.priority] || 0) + 1;
  }

  return {
    view,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    events: events.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    ),
    summary,
  };
}

/**
 * Get upcoming deadlines
 */
export function getUpcomingDeadlines(
  days: number = 30,
): ComplianceCalendarEvent[] {
  return calendarStore.getUpcomingEvents(days);
}

/**
 * Get overdue items
 */
export function getOverdueItems(): ComplianceCalendarEvent[] {
  return calendarStore.getOverdueEvents();
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const complianceCalendarService = {
  generateCalendarEvents,
  getCalendarView,
  getUpcomingDeadlines,
  getOverdueItems,
  getEvent: (id: string) => calendarStore.getEvent(id),
  getAllEvents: () => calendarStore.getAllEvents(),
};

export default complianceCalendarService;
