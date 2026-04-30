/**
 * Calendar Grid View Component
 * Month/week calendar grid visualization
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";

interface CalendarEvent {
  id: string;
  type: "INSPECTION" | "TRAINING" | "AUDIT" | "DEADLINE" | "INCIDENT";
  title: string;
  startDate: Date | string;
  endDate?: Date | string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface CalendarGridViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  view?: "MONTH" | "WEEK";
}

export default function CalendarGridView({
  events,
  currentDate,
  onDateClick,
  onEventClick,
  view = "MONTH",
}: CalendarGridViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      return (
        (eventStart <= date && eventEnd >= date) || isSameDay(eventStart, date)
      );
    });
  };

  const getEventColor = (event: CalendarEvent): string => {
    if (event.status === "OVERDUE") return "bg-red-500";
    if (event.status === "COMPLETED") return "bg-green-500";
    if (event.status === "IN_PROGRESS") return "bg-blue-500";

    switch (event.priority) {
      case "CRITICAL":
        return "bg-red-600";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getEventTypeIcon = (type: CalendarEvent["type"]): string => {
    switch (type) {
      case "INSPECTION":
        return "ri-search-line";
      case "TRAINING":
        return "ri-book-open-line";
      case "AUDIT":
        return "ri-file-list-3-line";
      case "DEADLINE":
        return "ri-time-line";
      case "INCIDENT":
        return "ri-alert-line";
      default:
        return "ri-calendar-line";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, "MMMM yyyy")}
          </h3>
        </div>

        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.01 }}
                onClick={() => onDateClick?.(day)}
                className={`
                  min-h-[80px] p-1 border border-gray-200 rounded cursor-pointer
                  transition-all hover:bg-gray-50
                  ${!isCurrentMonth ? "bg-gray-50 opacity-50" : "bg-white"}
                  ${isToday ? "ring-2 ring-blue-500" : ""}
                `}
              >
                {/* Day Number */}
                <div
                  className={`
                  text-xs font-medium mb-1
                  ${isToday ? "text-blue-600 font-bold" : "text-gray-700"}
                  ${!isCurrentMonth ? "text-gray-400" : ""}
                `}
                >
                  {format(day, "d")}
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <motion.div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      whileHover={{ scale: 1.05 }}
                      className={`
                        ${getEventColor(event)} text-white text-xs px-1 py-0.5 rounded truncate
                        cursor-pointer flex items-center gap-1
                      `}
                      title={event.title}
                    >
                      <i className={getEventTypeIcon(event.type)}></i>
                      <span className="truncate">{event.title}</span>
                    </motion.div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
}
