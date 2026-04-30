/**
 * Compliance
 *
 * Regulatory compliance dashboard with Hours of Service, ELD, and compliance checking
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import ComplianceStatusPanel from "@/components/transportation/ComplianceStatusPanel";
import { apiFetch } from "@/utils/apiFetch";
import { RiShieldCheckLine, RiTimeLine, RiFileTextLine } from "react-icons/ri";

function TransportationCompliancePageContent() {
  const [loading, setLoading] = useState(false);
  const [compliance, setCompliance] = useState<any>(null);
  const [hoursOfService, setHoursOfService] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState("");
  const [driverId, setDriverId] = useState("");

  const checkCompliance = async () => {
    if (!shipmentId) {
      setError("Please enter a shipment ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(
        `/api/transportation/compliance?action=compliance&shipmentId=${shipmentId}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to check compliance: ${response.statusText}`);
      }

      const data = await response.json();
      setCompliance(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check compliance",
      );
      console.error("Error checking compliance:", err);
    } finally {
      setLoading(false);
    }
  };

  const getHoursOfService = async () => {
    if (!driverId) {
      setError("Please enter a driver ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split("T")[0];
      const response = await apiFetch(
        `/api/transportation/compliance?action=hos&driverId=${driverId}&date=${today}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get hours of service: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setHoursOfService(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get hours of service",
      );
      console.error("Error getting hours of service:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !compliance && !hoursOfService) {
    return (
      <PageTemplate
        title="Compliance"
        description="Regulatory compliance, Hours of Service, and ELD"
        icon="ri-shield-check-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading compliance data..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Compliance"
      description="Regulatory compliance, Hours of Service, and ELD"
      icon="ri-shield-check-line"
    >
      <div className="space-y-6">
        {/* Search Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RiShieldCheckLine className="w-5 h-5" />
              Check Shipment Compliance
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Shipment ID
                </label>
                <input
                  type="text"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  placeholder="Enter shipment ID"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <button
                onClick={checkCompliance}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Check Compliance
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RiTimeLine className="w-5 h-5" />
              Hours of Service
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Driver ID
                </label>
                <input
                  type="text"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  placeholder="Enter driver ID"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <button
                onClick={getHoursOfService}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Get HOS Data
              </button>
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Compliance Status Panel */}
        {compliance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ComplianceStatusPanel
              compliance={compliance}
              hoursOfService={hoursOfService}
            />
          </motion.div>
        )}

        {/* Hours of Service Display */}
        {hoursOfService && !compliance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4">Hours of Service</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drive Time
                  </p>
                  <p className="text-xl font-bold">
                    {hoursOfService.driveTime || 0} hours
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    On-Duty Time
                  </p>
                  <p className="text-xl font-bold">
                    {hoursOfService.onDutyTime || 0} hours
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Off-Duty Time
                  </p>
                  <p className="text-xl font-bold">
                    {hoursOfService.offDutyTime || 0} hours
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      hoursOfService.status === "COMPLIANT"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {hoursOfService.status || "UNKNOWN"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!compliance && !hoursOfService && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <RiShieldCheckLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Enter a shipment ID or driver ID to check compliance status
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function TransportationCompliancePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Compliance"
          description="Regulatory compliance, Hours of Service, and ELD"
          icon="ri-shield-check-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationCompliancePageContent />
    </ErrorBoundary>
  );
}
