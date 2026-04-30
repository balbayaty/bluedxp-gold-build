/**
 * System Admin Log Viewer
 * Real-time log viewing with filtering and search
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/utils/apiFetch";

interface LogEntry {
  id: string;
  level: string;
  action: string;
  module?: string;
  message: string;
  metadata?: any;
  createdAt: string;
  userId?: string;
}

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    level: "",
    module: "",
    search: "",
    limit: 100,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [scrollToBottom, setScrollToBottom] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (filters.level) params.append("level", filters.level);
      if (filters.module) params.append("module", filters.module);
      params.append("limit", filters.limit.toString());

      const response = await apiFetch(
        `/api/system-admin/logs?${params.toString()}`,
      );
      const data = await response.json();

      if (data.success) {
        let filteredLogs = data.data.logs || [];

        // Client-side search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredLogs = filteredLogs.filter(
            (log: LogEntry) =>
              log.message.toLowerCase().includes(searchLower) ||
              log.action.toLowerCase().includes(searchLower) ||
              log.module?.toLowerCase().includes(searchLower),
          );
        }

        setLogs(filteredLogs);
      } else {
        setError(data.error || "Failed to fetch logs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [filters.level, filters.module, filters.limit, autoRefresh]);

  useEffect(() => {
    if (scrollToBottom && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, scrollToBottom]);

  const getLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "ERROR":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "WARN":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "INFO":
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
      case "DEBUG":
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
      default:
        return "text-gray-300 bg-gray-800 border-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Level</label>
          <select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Module</label>
          <input
            type="text"
            value={filters.module}
            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
            placeholder="Filter by module"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search logs..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
              autoRefresh
                ? "bg-green-500/20 border-green-500/30 text-green-400"
                : "bg-gray-800 border-gray-700 text-gray-400"
            }`}
          >
            <i
              className={`ri-${autoRefresh ? "pause" : "play"}-circle-line mr-2`}
            ></i>
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
          >
            <i className="ri-refresh-line"></i>
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 max-h-[600px] overflow-y-auto">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-12">{error}</div>
        ) : logs.length === 0 ? (
          <div className="text-gray-400 text-center py-12">No logs found</div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-3 rounded-lg border ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase">
                          {log.level}
                        </span>
                        {log.module && (
                          <span className="text-xs px-2 py-0.5 bg-white/10 rounded">
                            {log.module}
                          </span>
                        )}
                        <span className="text-xs opacity-70">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm font-medium mb-1">
                        {log.action}
                      </div>
                      <div className="text-xs opacity-80 break-words">
                        {log.message}
                      </div>
                      {log.metadata && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer opacity-70">
                            View Metadata
                          </summary>
                          <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
