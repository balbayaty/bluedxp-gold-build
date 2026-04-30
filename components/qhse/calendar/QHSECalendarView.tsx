/**
 * QHSE Calendar View
 * Comprehensive calendar for inspections, training, audits, and deadlines
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiDownload,
} from "react-icons/fi";
import CalendarGridView from "./CalendarGridView";

interface CalendarEvent {
  id: string;
  type: "INSPECTION" | "TRAINING" | "AUDIT" | "DEADLINE" | "INCIDENT";
  title: string;
  description?: string;
  startDate: Date | string;
  endDate?: Date | string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  link?: string;
}

interface QHSECalendarViewProps {
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
  facilityId?: string;
}

export default function QHSECalendarView({
  tenantId,
  customerId,
  warehouseId,
  facilityId,
}: QHSECalendarViewProps) {
  const [view, setView] = useState<"MONTH" | "WEEK" | "DAY" | "LIST">("MONTH");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  useEffect(() => {
    loadCalendarEvents();
  }, [view, currentDate, tenantId, customerId, warehouseId, facilityId]);

  const loadCalendarEvents = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (tenantId) params.append("tenantId", tenantId);
      if (customerId) params.append("customerId", customerId);
      if (warehouseId) params.append("warehouseId", warehouseId);
      if (facilityId) params.append("facilityId", facilityId);

      // Fetch inspections, training, audits
      const [inspectionsRes, trainingRes, auditsRes] = await Promise.all([
        fetch(`/api/qhse/inspections?${params.toString()}`),
        fetch(`/api/qhse/training?type=records&${params.toString()}`),
        fetch(`/api/qhse/regulatory?${params.toString()}`),
      ]);

      const inspectionsData = await inspectionsRes.json();
      const trainingData = await trainingRes.json();
      const auditsData = await auditsRes.json();

      const calendarEvents: CalendarEvent[] = [];

      // Add inspections
      if (inspectionsData.success) {
        inspectionsData.data.forEach((inspection: any) => {
          calendarEvents.push({
            id: inspection.id,
            type: "INSPECTION",
            title: inspection.title,
            description: inspection.description,
            startDate: inspection.scheduledDate,
            endDate: inspection.conductedDate,
            status:
              inspection.status === "SCHEDULED"
                ? "SCHEDULED"
                : inspection.status === "IN_PROGRESS"
                  ? "IN_PROGRESS"
                  : inspection.status === "COMPLETED"
                    ? "COMPLETED"
                    : inspection.status === "OVERDUE"
                      ? "OVERDUE"
                      : "CANCELLED",
            priority: inspection.findings?.some(
              (f: any) => f.severity === "CRITICAL",
            )
              ? "CRITICAL"
              : inspection.findings?.some((f: any) => f.severity === "MAJOR")
                ? "HIGH"
                : "MEDIUM",
            link: `/qhse/inspections/${inspection.id}`,
          });
        });
      }

      // Add training
      if (trainingData.success) {
        trainingData.data.forEach((record: any) => {
          if (record.dueDate || record.completedDate) {
            calendarEvents.push({
              id: record.id,
              type: "TRAINING",
              title: record.trainingProgram?.name || "Training",
              description: `Training for ${record.employeeName}`,
              startDate: record.dueDate || record.completedDate,
              status:
                record.status === "COMPLETED"
                  ? "COMPLETED"
                  : record.status === "IN_PROGRESS"
                    ? "IN_PROGRESS"
                    : new Date(record.dueDate || "") < new Date()
                      ? "OVERDUE"
                      : "SCHEDULED",
              priority: record.status === "EXPIRED" ? "CRITICAL" : "MEDIUM",
              link: `/qhse/training?record=${record.id}`,
            });
          }
        });
      }

      // Add audits
      if (auditsData.success) {
        auditsData.data.forEach((audit: any) => {
          calendarEvents.push({
            id: audit.id,
            type: "AUDIT",
            title: `${audit.regulatoryStandard} Audit`,
            description: audit.scope,
            startDate: audit.scheduledDate,
            endDate: audit.conductedDate,
            status:
              audit.status === "SCHEDULED"
                ? "SCHEDULED"
                : audit.status === "IN_PROGRESS"
                  ? "IN_PROGRESS"
                  : audit.status === "COMPLETED"
                    ? "COMPLETED"
                    : "CANCELLED",
            priority: audit.auditType === "REGULATORY" ? "HIGH" : "MEDIUM",
            link: `/qhse/regulatory?audit=${audit.id}`,
          });
        });
      }

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error loading calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.status === "OVERDUE") return "bg-red-500 text-white";
    if (event.status === "COMPLETED") return "bg-green-500 text-white";
    if (event.priority === "CRITICAL") return "bg-red-600 text-white";
    if (event.priority === "HIGH") return "bg-orange-500 text-white";
    if (event.type === "INSPECTION") return "bg-blue-500 text-white";
    if (event.type === "TRAINING") return "bg-purple-500 text-white";
    if (event.type === "AUDIT") return "bg-yellow-500 text-black";
    return "bg-gray-500 text-white";
  };

  const getEventIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "INSPECTION":
        return "📋";
      case "TRAINING":
        return "🎓";
      case "AUDIT":
        return "📊";
      case "DEADLINE":
        return "⏰";
      case "INCIDENT":
        return "⚠️";
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "MONTH") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (view === "WEEK") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QHSE Calendar</h1>
          <p className="text-gray-600 mt-1">
            View inspections, training, audits, and deadlines
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <FiDownload className="w-4 h-4 inline mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView("MONTH")}
            className={`px-4 py-2 rounded-lg ${
              view === "MONTH"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView("WEEK")}
            className={`px-4 py-2 rounded-lg ${
              view === "WEEK"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView("DAY")}
            className={`px-4 py-2 rounded-lg ${
              view === "DAY"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setView("LIST")}
            className={`px-4 py-2 rounded-lg ${
              view === "LIST"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            List
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={() => navigateDate("next")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {view === "LIST" ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (event.link) window.location.href = event.link;
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(event.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl">
                        {getEventIcon(event.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {event.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          event.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : event.status === "OVERDUE"
                              ? "bg-red-100 text-red-800"
                              : event.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          event.priority === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : event.priority === "HIGH"
                              ? "bg-orange-100 text-orange-800"
                              : event.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {event.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <CalendarGridView
          events={events}
          currentDate={currentDate}
          onDateClick={(date) => {
            setCurrentDate(date);
            setView("DAY");
          }}
          onEventClick={(event) => {
            setSelectedEvent(event);
          }}
          view={view === "MONTH" ? "MONTH" : "WEEK"}
        />
      )}

      {/* Event Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Events</span>
            <span className="text-2xl font-bold text-gray-900">
              {events.length}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overdue</span>
            <span className="text-2xl font-bold text-red-600">
              {events.filter((e) => e.status === "OVERDUE").length}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Upcoming</span>
            <span className="text-2xl font-bold text-blue-600">
              {events.filter((e) => e.status === "SCHEDULED").length}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Completed</span>
            <span className="text-2xl font-bold text-green-600">
              {events.filter((e) => e.status === "COMPLETED").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
