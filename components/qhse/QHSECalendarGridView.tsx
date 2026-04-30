/**
 * QHSE Calendar Grid View
 * Interactive calendar with incidents, audits, training, and inspections
 *
 * FEATURES:
 * - Month/Week/Day views
 * - Event categorization (incidents, audits, training, inspections)
 * - Color-coded by severity/type
 * - Drag-and-drop scheduling (future)
 * - Event details on click
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type EventType = "INCIDENT" | "AUDIT" | "TRAINING" | "INSPECTION" | "MEETING";
type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface QHSEEvent {
  id: string;
  title: string;
  type: EventType;
  date: Date;
  time?: string;
  severity?: Severity;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedTo?: string;
  location?: string;
  description?: string;
}

interface QHSECalendarGridViewProps {
  tenantId?: string;
  warehouseId?: string;
  onEventClick?: (event: QHSEEvent) => void;
}

export default function QHSECalendarGridView({
  tenantId = "default",
  warehouseId,
  onEventClick,
}: QHSECalendarGridViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<QHSEEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<QHSEEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, [currentDate, view, tenantId, warehouseId]);

  const loadEvents = async () => {
    // In production, fetch from QHSE service
    // For now, generate sample events
    const mockEvents: QHSEEvent[] = [];
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      // Random events throughout month
      if (Math.random() > 0.7) {
        const eventDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          day,
        );
        const eventTypes: EventType[] = [
          "INCIDENT",
          "AUDIT",
          "TRAINING",
          "INSPECTION",
          "MEETING",
        ];
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        mockEvents.push({
          id: `evt-${day}`,
          title: `${type} - ${day}`,
          type,
          date: eventDate,
          time: `${Math.floor(Math.random() * 12) + 8}:00`,
          severity:
            type === "INCIDENT"
              ? (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Severity[])[
                  Math.floor(Math.random() * 4)
                ]
              : undefined,
          status: eventDate < new Date() ? "COMPLETED" : "SCHEDULED",
          assignedTo: `Employee ${Math.floor(Math.random() * 10) + 1}`,
          location: warehouseId || "Warehouse A",
        });
      }
    }

    setEvents(mockEvents);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (e) =>
        e.date.getDate() === date.getDate() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getFullYear() === date.getFullYear(),
    );
  };

  const getEventColor = (event: QHSEEvent) => {
    switch (event.type) {
      case "INCIDENT":
        return event.severity === "CRITICAL" || event.severity === "HIGH"
          ? "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "AUDIT":
        return "bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "TRAINING":
        return "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "INSPECTION":
        return "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "MEETING":
        return "bg-gray-100 border-gray-500 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400";
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() - 1,
                  1,
                ),
              )
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="ri-arrow-left-s-line text-xl text-gray-600 dark:text-gray-400" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthName}
          </h3>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + 1,
                  1,
                ),
              )
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="ri-arrow-right-s-line text-xl text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(["month", "week", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                view === v
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Calendar Days */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day,
          );
          const dayEvents = getEventsForDate(date);
          const isToday =
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear();

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`aspect-square border-2 rounded-lg p-2 hover:shadow-lg transition-all cursor-pointer ${
                isToday
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {day}
              </div>
              <div className="space-y-1 overflow-y-auto max-h-20">
                {dayEvents.slice(0, 3).map((event) => (
                  <motion.div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      onEventClick?.(event);
                    }}
                    whileHover={{ scale: 1.05 }}
                    className={`text-xs px-2 py-1 rounded border-l-2 ${getEventColor(event)} cursor-pointer truncate`}
                    title={event.title}
                  >
                    {event.title}
                  </motion.div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedEvent.date.toLocaleDateString()}{" "}
                    {selectedEvent.time || ""}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <i className="ri-close-line text-xl text-gray-400" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Type:
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${getEventColor(selectedEvent)}`}
                  >
                    {selectedEvent.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Status:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedEvent.status}
                  </span>
                </div>
                {selectedEvent.severity && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Severity:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {selectedEvent.severity}
                    </span>
                  </div>
                )}
                {selectedEvent.assignedTo && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Assigned:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {selectedEvent.assignedTo}
                    </span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Location:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {selectedEvent.location}
                    </span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Description:
                    </span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Edit event
                    console.log("Edit event:", selectedEvent.id);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Incident</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">Audit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Training</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Inspection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">Meeting</span>
        </div>
      </div>
    </div>
  );
}
