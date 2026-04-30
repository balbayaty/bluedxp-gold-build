/**
 * QR Code Module Demo & Visualization Page
 * Comprehensive demo of all QR code features with test data
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";
import QRScanner from "@/components/qr/QRScanner";
import {
  generateQRTestData,
  generateQRAnalyticsTestData,
  generateScanEventTestData,
} from "@/lib/utils/qrTestDataGenerator";
import { QRCodeData } from "@/types/qr";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function QRDemoPage() {
  const [testData, setTestData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [scanEvents, setScanEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "generator" | "scanner" | "templates" | "bulk" | "analytics"
  >("overview");

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    setLoading(true);
    try {
      const data = await generateQRTestData();
      const analyticsData = generateQRAnalyticsTestData();
      const events = generateScanEventTestData(50);

      setTestData(data);
      setAnalytics(analyticsData);
      setScanEvents(events);
    } catch (error) {
      console.error("Error loading test data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  if (loading) {
    return (
      <PageTemplate title="QR Code Demo">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading QR code test data...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="QR Code Module - Demo & Visualization">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total QR Codes</p>
                <p className="text-3xl font-bold text-white">
                  {testData?.qrCodes.length || 0}
                </p>
              </div>
              <i className="ri-qr-code-line text-4xl text-cyan-400"></i>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Scans</p>
                <p className="text-3xl font-bold text-white">
                  {analytics?.totalScans.toLocaleString() || 0}
                </p>
              </div>
              <i className="ri-scan-line text-4xl text-green-400"></i>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Templates</p>
                <p className="text-3xl font-bold text-white">
                  {testData?.templates.length || 0}
                </p>
              </div>
              <i className="ri-file-list-line text-4xl text-purple-400"></i>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Unique Scans</p>
                <p className="text-3xl font-bold text-white">
                  {analytics?.uniqueScans.toLocaleString() || 0}
                </p>
              </div>
              <i className="ri-user-line text-4xl text-orange-400"></i>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="flex -mb-px">
              {[
                {
                  id: "overview",
                  label: "Overview",
                  icon: "ri-dashboard-line",
                },
                {
                  id: "generator",
                  label: "QR Generator",
                  icon: "ri-qr-code-line",
                },
                { id: "scanner", label: "Scanner", icon: "ri-scan-line" },
                {
                  id: "templates",
                  label: "Templates",
                  icon: "ri-file-list-line",
                },
                {
                  id: "bulk",
                  label: "Bulk Operations",
                  icon: "ri-file-list-3-line",
                },
                {
                  id: "analytics",
                  label: "Analytics",
                  icon: "ri-bar-chart-line",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-cyan-500 text-cyan-400"
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                  }`}
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Sample QR Codes
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {testData?.qrCodes
                      .slice(0, 10)
                      .map((qr: any, index: number) => (
                        <motion.div
                          key={qr.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-cyan-500/50 transition cursor-pointer"
                          onClick={() => setSelectedQR(qr)}
                        >
                          {qr.qrImageUrl && (
                            <img
                              src={qr.qrImageUrl}
                              alt="QR Code"
                              className="w-full mb-2 bg-white p-2 rounded"
                            />
                          )}
                          <p className="text-xs text-gray-400 font-mono truncate">
                            {qr.qrData.id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {qr.qrData.documentType || qr.qrData.type}
                          </p>
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <span className="text-cyan-400">
                              {qr.analytics.totalScans} scans
                            </span>
                            <QRCodeBadge
                              entityId={qr.qrData.documentId || qr.id}
                              entityType={qr.qrData.type}
                              entityName={qr.qrData.documentType}
                              documentType={qr.qrData.documentType}
                              size="sm"
                            />
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>

                {/* Analytics Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">
                      Scans by Module
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(
                          analytics?.scansByModule || {},
                        ).map(([module, scans]) => ({ module, scans }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="module"
                          stroke="#9ca3af"
                          fontSize={12}
                        />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                          }}
                        />
                        <Bar dataKey="scans" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">
                      Scans by Device
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            analytics?.scansByDevice || {},
                          ).map(([device, scans]) => ({ device, scans }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ device, percent }) =>
                            `${device}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="scans"
                        >
                          {Object.entries(analytics?.scansByDevice || {}).map(
                            (_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ),
                          )}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Generator Tab */}
            {activeTab === "generator" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <UniversalQRGenerator
                    entityId="DEMO-001"
                    entityType="damage"
                    entityName="Demo Damage Report"
                    documentType="report"
                    documentUrl="/damage?id=DEMO-001"
                    module="damage"
                    showAdvanced={true}
                  />
                  <UniversalQRGenerator
                    entityId="DEMO-002"
                    entityType="incident"
                    entityName="Demo Safety Incident"
                    documentType="report"
                    documentUrl="/qhse/incidents/DEMO-002"
                    module="qhse"
                    showAdvanced={true}
                  />
                </div>
              </div>
            )}

            {/* Scanner Tab */}
            {activeTab === "scanner" && (
              <div className="max-w-2xl mx-auto">
                <QRScanner
                  onScan={(result) => {
                    console.log("QR Code Scanned:", result);
                    alert(
                      `QR Code Scanned!\nID: ${result.qrData.id}\nType: ${result.qrData.type}`,
                    );
                  }}
                  onError={(error) => {
                    console.error("Scan error:", error);
                  }}
                  config={{
                    continuous: true,
                    showHistory: true,
                    soundEnabled: true,
                    vibrationEnabled: true,
                  }}
                />
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === "templates" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Available Templates
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testData?.templates.map((template: any) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-cyan-500/50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">
                          {template.name}
                        </h4>
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        {template.description}
                      </p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <i className="ri-checkbox-circle-line text-green-400"></i>
                          Dynamic: {template.config.dynamic ? "Yes" : "No"}
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="ri-bar-chart-line text-blue-400"></i>
                          Analytics:{" "}
                          {template.config.analytics ? "Enabled" : "Disabled"}
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="ri-user-line text-purple-400"></i>
                          Usage: {template.usageCount} times
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk Operations Tab */}
            {activeTab === "bulk" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Bulk Operations
                </h3>
                {testData?.bulkOperations.map((op: any) => (
                  <div
                    key={op.id}
                    className="bg-gray-700 rounded-lg p-6 border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-white">
                          Operation {op.id}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Type: {op.type} • Status: {op.status}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          op.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : op.status === "processing"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {op.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">
                          Total Items
                        </p>
                        <p className="text-xl font-bold text-white">
                          {op.totalItems}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Processed</p>
                        <p className="text-xl font-bold text-green-400">
                          {op.processedItems}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Failed</p>
                        <p className="text-xl font-bold text-red-400">
                          {op.failedItems}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">
                          Success Rate
                        </p>
                        <p className="text-xl font-bold text-cyan-400">
                          {op.totalItems > 0
                            ? Math.round(
                                (op.processedItems / op.totalItems) * 100,
                              )
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {op.items.slice(0, 5).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-gray-800 rounded text-sm"
                        >
                          <span className="text-gray-300 font-mono">
                            {item.id}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.status === "success"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">
                      Top Scanned QR Codes
                    </h4>
                    <div className="space-y-3">
                      {analytics?.topScanned.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded"
                        >
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.documentType}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-cyan-400">
                              {item.scans}
                            </p>
                            <p className="text-xs text-gray-400">scans</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">
                      Scans by Location
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(
                          analytics?.scansByLocation || {},
                        ).map(([location, scans]) => ({ location, scans }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="location"
                          stroke="#9ca3af"
                          fontSize={12}
                        />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                          }}
                        />
                        <Bar dataKey="scans" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-4">
                    Recent Scan Events
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {scanEvents
                      .slice(0, 20)
                      .map((event: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <i className="ri-scan-line text-cyan-400"></i>
                            <div>
                              <p className="text-white font-mono">
                                {event.qrId}
                              </p>
                              <p className="text-xs text-gray-400">
                                {event.location} • {event.device}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected QR Code Modal */}
        {selectedQR && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedQR(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  QR Code Details
                </h3>
                <button
                  onClick={() => setSelectedQR(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              {selectedQR.qrImageUrl && (
                <div className="bg-white p-4 rounded-lg mb-4 text-center">
                  <img
                    src={selectedQR.qrImageUrl}
                    alt="QR Code"
                    className="mx-auto max-w-[200px]"
                  />
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">ID:</span>
                  <span className="text-white font-mono">
                    {selectedQR.qrData.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{selectedQR.qrData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Document Type:</span>
                  <span className="text-white">
                    {selectedQR.qrData.documentType || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Scans:</span>
                  <span className="text-cyan-400 font-semibold">
                    {selectedQR.analytics.totalScans}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Unique Scans:</span>
                  <span className="text-green-400 font-semibold">
                    {selectedQR.analytics.uniqueScans}
                  </span>
                </div>
                {selectedQR.analytics.lastScanned && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Scanned:</span>
                    <span className="text-white">
                      {new Date(
                        selectedQR.analytics.lastScanned,
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
