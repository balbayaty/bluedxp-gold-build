"use client";

import { motion } from "framer-motion";

interface ASNFiltersProps {
  statusFilter: string;
  priorityFilter: string;
  complianceFilter: string;
  onStatusFilterChange: (status: string) => void;
  onPriorityFilterChange: (priority: string) => void;
  onComplianceFilterChange: (compliance: string) => void;
}

export default function ASNFilters({
  statusFilter,
  priorityFilter,
  complianceFilter,
  onStatusFilterChange,
  onPriorityFilterChange,
  onComplianceFilterChange,
}: ASNFiltersProps) {
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "in-transit", label: "In Transit" },
    { value: "delivered", label: "Delivered" },
    { value: "delayed", label: "Delayed" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const complianceOptions = [
    { value: "all", label: "All Compliance" },
    { value: "compliant", label: "Compliant" },
    { value: "non-compliant", label: "Non-Compliant" },
    { value: "review", label: "Under Review" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 mb-6"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <i className="ri-filter-line text-blue-400"></i>
          <span className="text-[#94A3B8] text-sm">Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
          className="bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Compliance Filter */}
        <select
          value={complianceFilter}
          onChange={(e) => onComplianceFilterChange(e.target.value)}
          className="bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        >
          {complianceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Export Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="ml-auto bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
        >
          <i className="ri-download-line"></i>
          Export Data
        </motion.button>
      </div>
    </motion.div>
  );
}
