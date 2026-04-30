/**
 * QHSE Bulk Operations Page
 * Bulk operations for incidents, training, inspections
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiUpload,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
} from "react-icons/fi";

export default function QHSEBulkOperationsPage() {
  const [operation, setOperation] = useState<
    | "CREATE_INCIDENTS"
    | "ASSIGN_TRAINING"
    | "SCHEDULE_INSPECTIONS"
    | "UPDATE_STATUS"
  >("CREATE_INCIDENTS");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleBulkOperation = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      // Read file and parse
      const text = await file.text();
      const data = JSON.parse(text); // Assuming JSON format for now

      const response = await fetch("/api/qhse/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          data,
          createdBy: "current-user-id", // Would get from auth context
        }),
      });

      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error("Error processing bulk operation:", error);
      setResult({ success: false, error: "Failed to process bulk operation" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
        <p className="text-gray-600 mt-1">
          Perform bulk operations on incidents, training, and inspections
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operation Type
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="CREATE_INCIDENTS">Create Incidents</option>
              <option value="ASSIGN_TRAINING">Assign Training</option>
              <option value="SCHEDULE_INSPECTIONS">Schedule Inspections</option>
              <option value="UPDATE_STATUS">Update Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (JSON/CSV)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FiUpload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : "Click to upload or drag and drop"}
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleBulkOperation}
            disabled={!file || processing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FiUpload className="w-4 h-4" />
                Process Bulk Operation
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white rounded-lg shadow p-6 ${
            result.success
              ? "border-l-4 border-green-500"
              : "border-l-4 border-red-500"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {result.success ? (
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <FiXCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className="text-lg font-semibold">
              {result.success ? "Operation Completed" : "Operation Failed"}
            </h3>
          </div>
          {result.data && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-medium">{result.data.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Successful:</span>
                <span className="font-medium text-green-600">
                  {result.data.successful}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-medium text-red-600">
                  {result.data.failed}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
