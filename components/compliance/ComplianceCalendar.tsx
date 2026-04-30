"use client";

/**
 * Compliance Calendar Component
 * Visual calendar view of compliance deadlines, renewals, and events
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ComplianceCalendarEvent,
  CalendarView,
} from "@/lib/services/compliance/complianceCalendarService";
import { complianceCalendarService } from "@/lib/services/compliance/complianceCalendarService";
import { complianceService } from "@/lib/services/compliance/complianceService";

interface ComplianceCalendarProps {
  tenantId: string;
}

export default function ComplianceCalendar({
  tenantId,
}: ComplianceCalendarProps) {
  const [view, setView] = useState<"MONTH" | "WEEK" | "DAY" | "LIST">("MONTH");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendar();
  }, [tenantId, view, currentDate]);

  const loadCalendar = async () => {
    try {
      setLoading(true);

      // Get compliance records
      const records = complianceService.getRecordsByTenant(tenantId);

      // Generate calendar events
      complianceCalendarService.generateCalendarEvents(records);

      // Get calendar view
      const startDate = new Date(currentDate);
      if (view === "MONTH") {
        startDate.setDate(1);
      } else if (view === "WEEK") {
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day);
      }

      const calView = complianceCalendarService.getCalendarView(
        view,
        startDate,
      );
      setCalendarView(calView);
    } catch (error) {
      console.error("Error loading calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (event: ComplianceCalendarEvent) => {
    if (event.status === "OVERDUE")
      return "bg-red-500/20 border-red-500/50 text-red-400";
    if (event.status === "DUE_SOON")
      return "bg-orange-500/20 border-orange-500/50 text-orange-400";
    if (event.priority === "CRITICAL")
      return "bg-purple-500/20 border-purple-500/50 text-purple-400";
    return "bg-cyan-500/20 border-cyan-500/50 text-cyan-400";
  };

  const getEventIcon = (type: ComplianceCalendarEvent["type"]) => {
    switch (type) {
      case "DEADLINE":
        return "ri-time-line";
      case "RENEWAL":
        return "ri-refresh-line";
      case "INSPECTION":
        return "ri-search-line";
      case "AUDIT":
        return "ri-file-search-line";
      case "REVIEW":
        return "ri-eye-line";
      case "SUBMISSION":
        return "ri-upload-line";
      default:
        return "ri-calendar-line";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!calendarView) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No calendar events available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Compliance Calendar</h2>
          <p className="text-gray-400 mt-1">
            Track deadlines, renewals, and compliance events
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              if (view === "MONTH") {
                newDate.setMonth(newDate.getMonth() - 1);
              } else if (view === "WEEK") {
                newDate.setDate(newDate.getDate() - 7);
              } else {
                newDate.setDate(newDate.getDate() - 1);
              }
              setCurrentDate(newDate);
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
          >
            <i className="ri-arrow-left-line"></i>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              if (view === "MONTH") {
                newDate.setMonth(newDate.getMonth() + 1);
              } else if (view === "WEEK") {
                newDate.setDate(newDate.getDate() + 7);
              } else {
                newDate.setDate(newDate.getDate() + 1);
              }
              setCurrentDate(newDate);
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
          >
            <i className="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 border-b border-white/10">
        {(["MONTH", "WEEK", "DAY", "LIST"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              view === v
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Events</p>
          <p className="text-2xl font-bold text-white">
            {calendarView.summary.totalEvents}
          </p>
        </div>
        <div className="bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-gray-400">Upcoming</p>
          <p className="text-2xl font-bold text-blue-400">
            {calendarView.summary.upcoming}
          </p>
        </div>
        <div className="bg-orange-500/20 backdrop-blur-xl border border-orange-500/30 rounded-xl p-4">
          <p className="text-sm text-gray-400">Due Soon</p>
          <p className="text-2xl font-bold text-orange-400">
            {calendarView.summary.dueSoon}
          </p>
        </div>
        <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-gray-400">Overdue</p>
          <p className="text-2xl font-bold text-red-400">
            {calendarView.summary.overdue}
          </p>
        </div>
        <div className="bg-green-500/20 backdrop-blur-xl border border-green-500/30 rounded-xl p-4">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-400">
            {calendarView.summary.completed}
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Upcoming Events
        </h3>
        <div className="space-y-3">
          {calendarView.events.slice(0, 20).map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${getEventColor(event)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${getEventColor(event)}`}
                  >
                    <i className={`${getEventIcon(event.type)} text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium">{event.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          event.priority === "CRITICAL"
                            ? "bg-red-500/30 text-red-300"
                            : event.priority === "HIGH"
                              ? "bg-orange-500/30 text-orange-300"
                              : "bg-blue-500/30 text-blue-300"
                        }`}
                      >
                        {event.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        <i className="ri-calendar-line mr-1"></i>
                        {new Date(event.dueDate).toLocaleDateString()}
                      </span>
                      <span>
                        <i className="ri-time-line mr-1"></i>
                        {new Date(event.dueDate).toLocaleTimeString()}
                      </span>
                      {event.status === "OVERDUE" && (
                        <span className="text-red-400 font-medium">
                          OVERDUE
                        </span>
                      )}
                      {event.status === "DUE_SOON" && (
                        <span className="text-orange-400 font-medium">
                          DUE SOON
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
