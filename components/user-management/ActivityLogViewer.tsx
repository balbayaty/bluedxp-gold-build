/**
 * 📋 ACTIVITY LOG VIEWER
 * 
 * Complete audit trail with:
 * - Real-time activity stream
 * - Filterable by action type
 * - Searchable
 * - Exportable
 * - Detailed metadata
 * 
 * BlueDXP Platform - Production Ready
 */

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActivityLogEntry, ActivityAction } from "@/types/userManagement";
import { format, formatDistanceToNow } from "date-fns";

export interface ActivityLogViewerProps {
  userId: string;
  activities: ActivityLogEntry[];
  onExport?: () => void;
  maxHeight?: string;
}

const ACTION_CONFIG: Record<ActivityAction, { icon: string; color: string; label: string }> = {
  login: { icon: "ri-login-box-line", color: "text-green-400", label: "Login" },
  logout: { icon: "ri-logout-box-line", color: "text-gray-400", label: "Logout" },
  create: { icon: "ri-add-circle-line", color: "text-cyan-400", label: "Create" },
  read: { icon: "ri-eye-line", color: "text-blue-400", label: "View" },
  update: { icon: "ri-edit-line", color: "text-yellow-400", label: "Update" },
  delete: { icon: "ri-delete-bin-line", color: "text-red-400", label: "Delete" },
  export: { icon: "ri-download-line", color: "text-purple-400", label: "Export" },
  import: { icon: "ri-upload-line", color: "text-indigo-400", label: "Import" },
  approve: { icon: "ri-check-double-line", color: "text-green-400", label: "Approve" },
  reject: { icon: "ri-close-circle-line", color: "text-red-400", label: "Reject" },
  execute: { icon: "ri-play-line", color: "text-orange-400", label: "Execute" },
  configure: { icon: "ri-settings-3-line", color: "text-gray-400", label: "Configure" },
  api_call: { icon: "ri-code-s-slash-line", color: "text-cyan-400", label: "API Call" },
  agent_execution: { icon: "ri-robot-line", color: "text-purple-400", label: "Agent Run" },
};

// Note: Mock generator removed - component now uses real API data from /api/users/[id]/activity

const ActivityLogViewer: React.FC<ActivityLogViewerProps> = ({
  userId,
  activities: providedActivities,
  onExport,
  maxHeight = "600px",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<ActivityAction | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "success" | "failure" | "warning">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Use provided activities - no mock fallback
  const activities = providedActivities;

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        !searchQuery ||
        activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.resource?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.resourceId?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAction = selectedAction === "all" || activity.action === selectedAction;
      const matchesStatus = selectedStatus === "all" || activity.status === selectedStatus;

      return matchesSearch && matchesAction && matchesStatus;
    });
  }, [activities, searchQuery, selectedAction, selectedStatus]);

  // Activity stats
  const stats = useMemo(() => {
    const today = activities.filter(
      (a) => new Date(a.timestamp).toDateString() === new Date().toDateString()
    ).length;
    const success = activities.filter((a) => a.status === "success").length;
    const failures = activities.filter((a) => a.status === "failure").length;

    return { total: activities.length, today, success, failures };
  }, [activities]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-history-line text-cyan-400"></i>
            Activity Log
          </h3>
          <p className="text-sm text-[#9ca3af] mt-1">
            {stats.total} total activities • {stats.today} today
          </p>
        </div>

        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
          >
            <i className="ri-download-line mr-2"></i>
            Export
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: "ri-bar-chart-line", color: "text-cyan-400" },
          { label: "Today", value: stats.today, icon: "ri-calendar-line", color: "text-blue-400" },
          { label: "Successful", value: stats.success, icon: "ri-check-line", color: "text-green-400" },
          { label: "Failed", value: stats.failures, icon: "ri-close-line", color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <i className={`${stat.icon} ${stat.color}`}></i>
              <span className="text-xs text-[#9ca3af]">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Actions</option>
          {Object.entries(ACTION_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      {/* Activity List */}
      <div
        className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: `calc(${maxHeight} - 2px)` }}>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-history-line text-4xl text-[#6b7280] mb-2"></i>
              <p className="text-sm text-[#9ca3af]">No activities found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredActivities.map((activity, index) => {
                const config = ACTION_CONFIG[activity.action] || {
                  icon: "ri-checkbox-blank-circle-line",
                  color: "text-gray-400",
                  label: activity.action,
                };
                const isExpanded = expandedId === activity.id;

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <div
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${config.color}`}>
                          <i className={`${config.icon} text-xl`}></i>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{config.label}</span>
                            {activity.resource && (
                              <>
                                <span className="text-[#9ca3af]">•</span>
                                <span className="text-[#9ca3af]">{activity.resource}</span>
                              </>
                            )}
                            {activity.resourceId && (
                              <span className="text-xs font-mono text-cyan-400">{activity.resourceId}</span>
                            )}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            {activity.ipAddress && ` • ${activity.ipAddress}`}
                          </div>
                        </div>

                        {/* Status */}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            activity.status === "success"
                              ? "bg-green-500/20 text-green-400"
                              : activity.status === "failure"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {activity.status}
                        </span>

                        {/* Expand Icon */}
                        <i
                          className={`ri-arrow-${isExpanded ? "up" : "down"}-s-line text-[#9ca3af] transition-transform`}
                        ></i>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/10 bg-white/5"
                        >
                          <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-[#9ca3af] mb-1">Timestamp</div>
                              <div className="text-white font-mono text-xs">
                                {format(new Date(activity.timestamp), "yyyy-MM-dd HH:mm:ss")}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-[#9ca3af] mb-1">Activity ID</div>
                              <div className="text-white font-mono text-xs">{activity.id}</div>
                            </div>
                            {activity.ipAddress && (
                              <div>
                                <div className="text-xs text-[#9ca3af] mb-1">IP Address</div>
                                <div className="text-white font-mono text-xs">{activity.ipAddress}</div>
                              </div>
                            )}
                            {activity.errorMessage && (
                              <div className="col-span-2">
                                <div className="text-xs text-[#9ca3af] mb-1">Error</div>
                                <div className="text-red-400 text-xs">{activity.errorMessage}</div>
                              </div>
                            )}
                            {activity.metadata && (
                              <div className="col-span-2">
                                <div className="text-xs text-[#9ca3af] mb-1">Metadata</div>
                                <pre className="text-white text-xs bg-black/20 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(activity.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogViewer;
