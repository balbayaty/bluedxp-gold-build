/**
 * Declarations Overview Widget
 * For use in dashboard widgets
 */

"use client";

import React from "react";
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
} from "react-icons/fi";

interface DeclarationsOverviewProps {
  data?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export default function DeclarationsOverview({
  data,
}: DeclarationsOverviewProps) {
  const stats = data || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center space-x-2">
          <FiFileText className="text-cyan-400" />
          <span>Declarations Overview</span>
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiClock className="text-yellow-400" />
            <span className="text-sm text-gray-400">Pending</span>
          </div>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiCheckCircle className="text-green-400" />
            <span className="text-sm text-gray-400">Approved</span>
          </div>
          <p className="text-2xl font-bold">{stats.approved}</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiAlertTriangle className="text-red-400" />
            <span className="text-sm text-gray-400">Rejected</span>
          </div>
          <p className="text-2xl font-bold">{stats.rejected}</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiFileText className="text-cyan-400" />
            <span className="text-sm text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
      </div>
    </div>
  );
}
