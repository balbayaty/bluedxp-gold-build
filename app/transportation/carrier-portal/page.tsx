/**
 * Carrier Collaboration Portal Page
 *
 * Self-service portal for carriers
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Truck,
  Package,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Upload,
  MessageSquare,
  BarChart3,
  Settings,
  Bell,
  Download,
  Eye,
  Trash2,
  Search,
  Send,
  Paperclip,
  X,
  File,
  Image,
  FileCheck,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
import type {
  CarrierDashboard,
  CarrierShipmentView,
} from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function CarrierPortalPage() {
  const [dashboard, setDashboard] = useState<CarrierDashboard | null>(null);
  const [shipments, setShipments] = useState<CarrierShipmentView[]>([]);
  const [selectedShipment, setSelectedShipment] =
    useState<CarrierShipmentView | null>(null);
  const [activeTab, setActiveTab] = useState<
    "DASHBOARD" | "SHIPMENTS" | "DOCUMENTS" | "MESSAGES"
  >("DASHBOARD");

  useEffect(() => {
    loadDashboard();
    loadShipments();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await apiFetch(
        "/api/transportation/carrier-portal?carrierId=carrier-1&action=dashboard",
      );
      const data = await response.json();
      if (data.dashboard) {
        setDashboard(data.dashboard);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading dashboard", err, {
        module: "transportation",
        service: "carrier-portal",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "carrier-portal",
      });
    }
  };

  const loadShipments = async () => {
    try {
      const response = await apiFetch(
        "/api/transportation/carrier-portal?carrierId=carrier-1&action=shipments",
      );
      const data = await response.json();
      if (data.shipments) {
        setShipments(data.shipments);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading shipments", err, {
        module: "transportation",
        service: "carrier-portal",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "carrier-portal",
      });
    }
  };

  const updateShipmentStatus = async (shipmentId: string, status: string) => {
    try {
      await apiFetch("/api/transportation/carrier-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-status",
          carrierId: "carrier-1",
          shipmentId,
          status,
        }),
      });
      loadShipments();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating status", err, {
        module: "transportation",
        service: "carrier-portal",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "carrier-portal",
      });
    }
  };

  return (
    <PageTemplate
      title="Carrier Portal"
      description="Self-service portal for carriers with real-time updates and document exchange"
      icon="ri-user-star-line"
      stats={
        dashboard
          ? [
              {
                label: "Active Shipments",
                value: dashboard.statistics.activeShipments,
                icon: "ri-truck-line",
              },
              {
                label: "On-Time Rate",
                value: `${dashboard.statistics.onTimeRate.toFixed(1)}%`,
                icon: "ri-time-line",
              },
              {
                label: "Total Revenue",
                value: `$${dashboard.statistics.totalRevenue.toLocaleString()}`,
                icon: "ri-money-dollar-circle-line",
              },
              {
                label: "Pending Actions",
                value:
                  dashboard.pendingActions.documentsToUpload +
                  dashboard.pendingActions.statusUpdates,
                icon: "ri-notification-line",
              },
            ]
          : []
      }
      actions={
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {[
            { id: "DASHBOARD", label: "Dashboard", icon: BarChart3 },
            { id: "SHIPMENTS", label: "Shipments", icon: Truck },
            { id: "DOCUMENTS", label: "Documents", icon: FileText },
            { id: "MESSAGES", label: "Messages", icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "DASHBOARD" && dashboard && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Shipments"
                value={dashboard.statistics.totalShipments}
                icon={Truck}
                color="blue"
              />
              <StatCard
                title="Active Shipments"
                value={dashboard.statistics.activeShipments}
                icon={Package}
                color="green"
              />
              <StatCard
                title="On-Time Rate"
                value={`${dashboard.statistics.onTimeRate.toFixed(1)}%`}
                icon={Clock}
                color="purple"
              />
              <StatCard
                title="Total Revenue"
                value={`$${dashboard.statistics.totalRevenue.toLocaleString()}`}
                icon={DollarSign}
                color="orange"
              />
            </div>

            {/* Pending Actions */}
            {dashboard.pendingActions && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Pending Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Documents to Upload
                    </div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {dashboard.pendingActions.documentsToUpload}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Status Updates
                    </div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {dashboard.pendingActions.statusUpdates}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Exceptions to Report
                    </div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {dashboard.pendingActions.exceptionsToReport}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Shipments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-4">Recent Shipments</h3>
              <div className="space-y-3">
                {dashboard.recentShipments.slice(0, 5).map((shipment) => (
                  <div
                    key={shipment.shipmentId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition"
                    onClick={() => {
                      setSelectedShipment(shipment);
                      setActiveTab("SHIPMENTS");
                    }}
                  >
                    <div>
                      <div className="font-medium">
                        {shipment.shipmentNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shipment.origin.address.city} →{" "}
                        {shipment.destination.address.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          shipment.status === "IN_TRANSIT"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : shipment.status === "DELIVERED"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {shipment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            {dashboard.notifications.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </h3>
                <div className="space-y-2">
                  {dashboard.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.read
                          ? "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {notification.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {notification.message}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            notification.priority === "URGENT"
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : notification.priority === "HIGH"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {notification.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shipments Tab */}
        {activeTab === "SHIPMENTS" && (
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <div
                key={shipment.shipmentId}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold">
                      {shipment.shipmentNumber}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {shipment.origin.address.city} →{" "}
                      {shipment.destination.address.city}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      shipment.status === "IN_TRANSIT"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : shipment.status === "DELIVERED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {shipment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500">Pickup Date</label>
                    <p className="font-medium">
                      {shipment.pickupDate?.toLocaleDateString() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Delivery Date
                    </label>
                    <p className="font-medium">
                      {shipment.deliveryDate?.toLocaleDateString() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Current Location
                    </label>
                    <p className="font-medium">
                      {shipment.currentLocation?.address.city || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Tracking Events
                    </label>
                    <p className="font-medium">
                      {shipment.trackingEvents.length}
                    </p>
                  </div>
                </div>

                {shipment.canUpdateStatus && (
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() =>
                        updateShipmentStatus(shipment.shipmentId, "IN_TRANSIT")
                      }
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                    >
                      Update Status
                    </button>
                    {shipment.canAddTrackingEvent && (
                      <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium">
                        Add Tracking Event
                      </button>
                    )}
                    {shipment.canUploadDocuments && (
                      <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Document
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "DOCUMENTS" && <DocumentManagementPanel />}

        {/* Messages Tab */}
        {activeTab === "MESSAGES" && <MessagingSystemPanel />}
      </div>
    </PageTemplate>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-4 border ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </motion.div>
  );
}

function DocumentManagementPanel() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "ALL" | "BILL_OF_LADING" | "INVOICE" | "PROOF_OF_DELIVERY" | "OTHER"
  >("ALL");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Load documents
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await apiFetch(
        "/api/transportation/documents?carrierId=carrier-1",
      );
      const data = await response.json();
      if (data.documents) {
        setDocuments(data.documents);
      } else {
        // Demo data
        setDocuments([
          {
            id: "doc-1",
            name: "Bill of Lading - SHIP-001",
            type: "BILL_OF_LADING",
            shipmentId: "ship-1",
            uploadedAt: new Date("2024-01-20"),
            size: 245760,
            status: "APPROVED",
            url: "#",
          },
          {
            id: "doc-2",
            name: "Proof of Delivery - SHIP-002",
            type: "PROOF_OF_DELIVERY",
            shipmentId: "ship-2",
            uploadedAt: new Date("2024-01-19"),
            size: 128000,
            status: "PENDING",
            url: "#",
          },
        ]);
      }
    } catch (error) {
      // Use demo data on error
      setDocuments([
        {
          id: "doc-1",
          name: "Bill of Lading - SHIP-001",
          type: "BILL_OF_LADING",
          shipmentId: "ship-1",
          uploadedAt: new Date("2024-01-20"),
          size: 245760,
          status: "APPROVED",
          url: "#",
        },
      ]);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const newDocs = Array.from(files).map((file, idx) => ({
        id: `doc-${Date.now()}-${idx}`,
        name: file.name,
        type: "OTHER",
        shipmentId: null,
        uploadedAt: new Date(),
        size: file.size,
        status: "PENDING",
        url: "#",
      }));
      setDocuments([...newDocs, ...documents]);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "ALL" || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes("IMAGE")) return Image;
    if (type.includes("PDF")) return FileText;
    return File;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Management
        </h3>
        <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Types</option>
          <option value="BILL_OF_LADING">Bill of Lading</option>
          <option value="INVOICE">Invoice</option>
          <option value="PROOF_OF_DELIVERY">Proof of Delivery</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Drag and Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFileUpload(e.dataTransfer.files);
        }}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500">
          PDF, Images, Documents (Max 10MB)
        </p>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocuments.map((doc) => {
          const FileIcon = getFileIcon(doc.type);
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-sm text-gray-500">
                    {doc.type} • {formatFileSize(doc.size)} •{" "}
                    {doc.uploadedAt.toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    doc.status === "APPROVED"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : doc.status === "REJECTED"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition text-red-600 dark:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No documents found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MessagingSystemPanel() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);  const loadConversations = async () => {
    // Demo data
    setConversations([
      {
        id: "conv-1",
        title: "Shipment SHIP-001",
        lastMessage: "Delivery completed successfully",
        timestamp: new Date("2024-01-20T14:30:00"),
        unread: 2,
        type: "SHIPMENT",
      },
      {
        id: "conv-2",
        title: "General Inquiry",
        lastMessage: "When will the next pickup be scheduled?",
        timestamp: new Date("2024-01-20T12:15:00"),
        unread: 0,
        type: "GENERAL",
      },
    ]);
  };  const loadMessages = (conversationId: string) => {
    setSelectedConversation(conversationId);
    // Demo messages
    setMessages([
      {
        id: "msg-1",
        sender: "Carrier Support",
        message: "Your shipment SHIP-001 has been picked up and is in transit.",
        timestamp: new Date("2024-01-20T10:00:00"),
        isOwn: false,
      },
      {
        id: "msg-2",
        sender: "You",
        message: "Thank you for the update. When is the estimated delivery?",
        timestamp: new Date("2024-01-20T10:15:00"),
        isOwn: true,
      },
      {
        id: "msg-3",
        sender: "Carrier Support",
        message:
          "Delivery is scheduled for tomorrow, January 21st, between 9 AM and 12 PM.",
        timestamp: new Date("2024-01-20T10:20:00"),
        isOwn: false,
      },
      {
        id: "msg-4",
        sender: "You",
        message: "Perfect, I will ensure someone is available to receive it.",
        timestamp: new Date("2024-01-20T10:25:00"),
        isOwn: true,
      },
    ]);
  };  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const message = {
      id: `msg-${Date.now()}`,
      sender: "You",
      message: newMessage,
      timestamp: new Date(),
      isOwn: true,
    };
    setMessages([...messages, message]);
    setNewMessage("");
  };  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="flex h-[700px]">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversations
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadMessages(conv.id)}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                  selectedConversation === conv.id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium">{conv.title}</div>
                  {conv.unread > 0 && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-medium">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {conv.lastMessage}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {conv.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold">
                  {
                    conversations.find((c) => c.id === selectedConversation)
                      ?.title
                  }
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.isOwn
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <div className="text-xs font-medium mb-1 opacity-80">
                        {msg.sender}
                      </div>
                      <div>{msg.message}</div>
                      <div className="text-xs mt-1 opacity-60">
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    title="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
