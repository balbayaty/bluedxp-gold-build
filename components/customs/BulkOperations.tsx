/**
 * Bulk Operations Component
 * Handle multiple declarations at once
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiCheckSquare,
  FiX,
  FiUpload,
  FiDownload,
  FiTrash2,
  FiEdit,
  FiCheckCircle,
} from "react-icons/fi";

interface BulkOperationsProps {
  onBulkAction?: (action: string, ids: string[]) => void;
}

export default function BulkOperations({ onBulkAction }: BulkOperationsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showActions, setShowActions] = useState(false);

  const handleSelectAll = () => {
    // In real implementation, would get all IDs
    setSelectedIds(new Set(["1", "2", "3"]));
    setShowActions(true);
  };

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedIds.size > 0) {
      onBulkAction(action, Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowActions(false);
    }
  };

  if (!showActions && selectedIds.size === 0) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleSelectAll}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
        >
          <FiCheckSquare className="w-4 h-4" />
          <span>Select All</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiCheckSquare className="w-5 h-5 text-cyan-400" />
          <span className="font-medium">
            {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleBulkAction("approve")}
            className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex items-center space-x-2"
          >
            <FiCheckCircle className="w-4 h-4" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => handleBulkAction("reject")}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center space-x-2"
          >
            <FiX className="w-4 h-4" />
            <span>Reject</span>
          </button>
          <button
            onClick={() => handleBulkAction("export")}
            className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center space-x-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center space-x-2"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
          <button
            onClick={() => {
              setSelectedIds(new Set());
              setShowActions(false);
            }}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
