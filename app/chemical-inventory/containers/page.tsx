/**
 * Container-Level Tracking Module
 * Individual container management with barcode/QR scanning
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import CameraScanner from "@/components/barcode/CameraScanner";
import AdvancedSmartDetectionForm from "@/components/forms/AdvancedSmartDetectionForm";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import {
  ChemicalContainer,
  ContainerStatus,
  ContainerType,
} from "@/types/container";
import { containerService } from "@/lib/services/chemical/containerService";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TabType = "overview" | "containers" | "scan" | "transfers" | "disposal";

type AdvancedDetectionContext = any;

export default function ContainerManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [containers, setContainers] = useState<ChemicalContainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ChemicalContainer | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    setLoading(true);
    try {
      const result = await containerService.getContainers();
      setContainers(result.containers);
    } catch (error) {
      console.error("Error loading containers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (barcode: string) => {
    try {
      const container = await containerService.scanBarcode(barcode);
      if (container) {
        setScanResult(container);
        setShowScanner(false);
      }
    } catch (error) {
      console.error("Error scanning:", error);
    }
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "ri-dashboard-line" },
    { id: "containers" as TabType, label: "Containers", icon: "ri-box-line" },
    { id: "scan" as TabType, label: "Scan Barcode", icon: "ri-qr-scan-line" },
    { id: "transfers" as TabType, label: "Transfers", icon: "ri-truck-line" },
    {
      id: "disposal" as TabType,
      label: "Disposal",
      icon: "ri-delete-bin-line",
    },
  ];

  return (
    <PageTemplate
      title="Container Management"
      description="Individual container tracking with barcode/QR scanning"
      icon="ri-box-line"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ContainerOverviewTab containers={containers} loading={loading} />
            </motion.div>
          )}

          {activeTab === "containers" && (
            <motion.div
              key="containers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ContainersListTab
                containers={containers}
                loading={loading}
                onRefresh={loadContainers}
              />
            </motion.div>
          )}

          {activeTab === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BarcodeScannerTab
                onScan={handleScan}
                scanResult={scanResult}
                onCloseResult={() => setScanResult(null)}
              />
            </motion.div>
          )}

          {activeTab === "transfers" && (
            <motion.div
              key="transfers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ContainerTransfersTab containers={containers} />
            </motion.div>
          )}

          {activeTab === "disposal" && (
            <motion.div
              key="disposal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ContainerDisposalTab containers={containers} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Camera Scanner Modal */}
      <CameraScanner
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={handleScan}
        scanType="both"
      />
    </PageTemplate>
  );
}

// ============================================================================
// CONTAINER OVERVIEW TAB
// ============================================================================

interface ContainerOverviewTabProps {
  containers: ChemicalContainer[];
  loading: boolean;
}

function ContainerOverviewTab({
  containers,
  loading,
}: ContainerOverviewTabProps) {
  const totalContainers = containers.length;
  const fullContainers = containers.filter((c) => c.status === "Full").length;
  const inUseContainers = containers.filter(
    (c) => c.status === "In-Use",
  ).length;
  const emptyContainers = containers.filter((c) => c.status === "Empty").length;

  const statusDistribution = [
    { name: "Full", value: fullContainers, color: "#10b981" },
    { name: "In-Use", value: inUseContainers, color: "#f59e0b" },
    { name: "Empty", value: emptyContainers, color: "#6b7280" },
    {
      name: "Disposed",
      value: containers.filter((c) => c.status === "Disposed").length,
      color: "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Containers</span>
            <i className="ri-box-line text-cyan-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{totalContainers}</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Full</span>
            <i className="ri-checkbox-circle-line text-green-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{fullContainers}</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">In-Use</span>
            <i className="ri-time-line text-yellow-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{inUseContainers}</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Empty</span>
            <i className="ri-inbox-line text-gray-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{emptyContainers}</div>
        </div>
      </div>

      {/* Status Distribution Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h4 className="font-bold mb-4 text-white">
          Container Status Distribution
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================================
// CONTAINERS LIST TAB
// ============================================================================

interface ContainersListTabProps {
  containers: ChemicalContainer[];
  loading: boolean;
  onRefresh: () => void;
}

function ContainersListTab({
  containers,
  loading,
  onRefresh,
}: ContainersListTabProps) {
  const [selectedContainer, setSelectedContainer] =
    useState<ChemicalContainer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Containers</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
        >
          <i className="ri-add-line mr-2"></i>
          New Container
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : containers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="ri-box-line text-4xl mb-4"></i>
          <p>No containers found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {containers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              onClick={() => setSelectedContainer(container)}
            />
          ))}
        </div>
      )}

      {/* Container Detail Modal */}
      <AnimatePresence>
        {selectedContainer && (
          <Modal
            isOpen={!!selectedContainer}
            onClose={() => setSelectedContainer(null)}
            title={`Container: ${selectedContainer.containerNumber}`}
            size="xl"
          >
            <ContainerDetailView container={selectedContainer} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Create Container Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Create New Container"
            size="lg"
          >
            <CreateContainerForm
              onSuccess={() => {
                setShowCreateModal(false);
                onRefresh();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// CONTAINER CARD COMPONENT
// ============================================================================

interface ContainerCardProps {
  container: ChemicalContainer;
  onClick: () => void;
}

function ContainerCard({ container, onClick }: ContainerCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer hover:border-cyan-500 transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{container.containerNumber}</h3>
          <p className="text-sm text-gray-400">{container.chemicalName}</p>
          {container.casNumber && (
            <p className="text-xs text-gray-500">CAS: {container.casNumber}</p>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded text-xs ${
            container.status === "Full"
              ? "bg-green-900/30 text-green-400"
              : container.status === "In-Use"
                ? "bg-yellow-900/30 text-yellow-400"
                : container.status === "Empty"
                  ? "bg-gray-700 text-gray-400"
                  : "bg-red-900/30 text-red-400"
          }`}
        >
          {container.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Quantity:</span>
          <span className="font-semibold">
            {container.currentQuantity} / {container.capacity} {container.unit}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              container.fillLevel > 75
                ? "bg-green-500"
                : container.fillLevel > 50
                  ? "bg-yellow-500"
                  : container.fillLevel > 25
                    ? "bg-orange-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${container.fillLevel}%` }}
          ></div>
        </div>
        {container.barcode && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <i className="ri-barcode-line"></i>
            {container.barcode}
          </div>
        )}
        {(container.warehouseName || container.zoneName) && (
          <div className="text-xs text-gray-400">
            <i className="ri-map-pin-line mr-1"></i>
            {container.warehouseName || ""}{" "}
            {container.zoneName ? `→ ${container.zoneName}` : ""}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// BARCODE SCANNER TAB
// ============================================================================

interface BarcodeScannerTabProps {
  onScan: (barcode: string) => void;
  scanResult: ChemicalContainer | null;
  onCloseResult: () => void;
}

function BarcodeScannerTab({
  onScan,
  scanResult,
  onCloseResult,
}: BarcodeScannerTabProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);

  const handleManualScan = () => {
    if (barcodeInput.trim()) {
      onScan(barcodeInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Interface */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-qr-scan-line text-cyan-400"></i>
          Barcode/QR Scanner
        </h3>

        <div className="space-y-4">
          {/* Camera Scanner */}
          <div className="p-8 rounded-lg bg-gray-900 border-2 border-dashed border-gray-700 text-center">
            <i className="ri-camera-line text-4xl text-cyan-400 mb-4"></i>
            <p className="text-gray-400 mb-2">Camera Scanner</p>
            <button
              onClick={() => setShowCameraScanner(true)}
              className="mt-4 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition flex items-center gap-2 mx-auto"
            >
              <i className="ri-camera-line"></i>
              Open Camera Scanner
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Use your device camera to scan barcodes/QR codes
            </p>
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Or Enter Barcode/QR Manually
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
                placeholder="Scan or enter barcode/QR code"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
              />
              <button
                onClick={handleManualScan}
                disabled={!barcodeInput.trim() || scanning}
                className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
              >
                {scanning ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Scanning...
                  </>
                ) : (
                  <>
                    <i className="ri-search-line mr-2"></i>
                    Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Scan Result</h3>
            <button
              onClick={onCloseResult}
              className="text-gray-400 hover:text-white transition"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
          <ContainerDetailView container={scanResult} />
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// CONTAINER DETAIL VIEW
// ============================================================================

interface ContainerDetailViewProps {
  container: ChemicalContainer;
}

function ContainerDetailView({ container }: ContainerDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* QR Code Section */}
      <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
        <UniversalQRGenerator
          entityId={container.id}
          entityType="container"
          entityName={container.containerNumber}
          documentType="other"
          documentUrl={`/chemical-inventory/containers?container=${container.containerNumber}`}
          module="chemical-inventory"
          showAdvanced={false}
        />
      </div>

      {/* Header */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Container Number</p>
          <p className="text-xl font-bold">{container.containerNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">Status</p>
          <span
            className={`px-3 py-1 rounded-lg text-sm font-semibold ${
              container.status === "Full"
                ? "bg-green-900/30 text-green-400"
                : container.status === "In-Use"
                  ? "bg-yellow-900/30 text-yellow-400"
                  : container.status === "Empty"
                    ? "bg-gray-700 text-gray-400"
                    : "bg-red-900/30 text-red-400"
            }`}
          >
            {container.status}
          </span>
        </div>
      </div>

      {/* Chemical Info */}
      <div className="p-4 rounded-lg bg-gray-700">
        <p className="text-sm text-gray-400 mb-1">Chemical</p>
        <p className="font-semibold">{container.chemicalName}</p>
        {container.casNumber && (
          <p className="text-xs text-gray-400 mt-1">
            CAS: {container.casNumber}
          </p>
        )}
      </div>

      {/* Quantity & Fill Level */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-gray-700">
          <p className="text-sm text-gray-400 mb-1">Quantity</p>
          <p className="text-2xl font-bold">
            {container.currentQuantity} / {container.capacity} {container.unit}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-700">
          <p className="text-sm text-gray-400 mb-1">Fill Level</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-600 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  container.fillLevel > 75
                    ? "bg-green-500"
                    : container.fillLevel > 50
                      ? "bg-yellow-500"
                      : container.fillLevel > 25
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
                style={{ width: `${container.fillLevel}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold">
              {container.fillLevel.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Barcode/QR */}
      {container.barcode && (
        <div className="p-4 rounded-lg bg-gray-700">
          <p className="text-sm text-gray-400 mb-2">Barcode</p>
          <div className="flex items-center gap-4">
            <code className="text-lg font-mono">{container.barcode}</code>
            <button className="px-3 py-1 rounded bg-cyan-900/30 text-cyan-400 text-sm border border-cyan-500/30 hover:bg-cyan-900/50 transition">
              <i className="ri-printer-line mr-1"></i>
              Print Label
            </button>
          </div>
        </div>
      )}

      {/* Location */}
      {container.warehouseName && (
        <div className="p-4 rounded-lg bg-gray-700">
          <p className="text-sm text-gray-400 mb-1">Location</p>
          <p className="font-semibold">
            {container.warehouseName} → {container.zoneName}
            {container.roomName && ` → ${container.roomName}`}
            {container.rackName && ` → ${container.rackName}`}
            {container.shelfName && ` → ${container.shelfName}`}
          </p>
        </div>
      )}

      {/* Lifecycle */}
      <div className="p-4 rounded-lg bg-gray-700">
        <p className="text-sm text-gray-400 mb-2">Lifecycle</p>
        <p className="font-semibold">{container.lifecycle.stage}</p>
        {container.lifecycle.history.length > 0 && (
          <div className="mt-2 space-y-1">
            {container.lifecycle.history.slice(-3).map((event, idx) => (
              <p key={idx} className="text-xs text-gray-400">
                {new Date(event.date).toLocaleDateString()} - {event.stage}
                {event.location && ` at ${event.location}`}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CREATE CONTAINER FORM
// ============================================================================

interface CreateContainerFormProps {
  onSuccess: () => void;
}

function CreateContainerForm({ onSuccess }: CreateContainerFormProps) {
  const [containers, setContainers] = useState<ChemicalContainer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      const result = await containerService.getContainers();
      setContainers(result.containers);
    } catch (error) {
      console.error("Error loading containers:", error);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    setSubmitting(true);
    try {
      const containerData = {
        containerNumber: formData.containerNumber || "",
        chemicalId: formData.chemicalId || "",
        chemicalName: formData.chemicalName || "",
        containerType: (formData.containerType || "Drum") as ContainerType,
        capacity: formData.capacity ? parseFloat(formData.capacity) : 0,
        unit: formData.unit || "L",
        currentQuantity: formData.currentQuantity
          ? parseFloat(formData.currentQuantity)
          : 0,
        warehouseName: formData.warehouseName || "",
        zoneName: formData.zoneName || "",
      };
      await containerService.createContainer(containerData);
      onSuccess();
    } catch (error) {
      console.error("Error creating container:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdvancedSmartDetectionForm
      formId={`container-form-${Date.now()}`}
      fields={[
        {
          id: "containerNumber",
          name: "containerNumber",
          type: "text",
          label: "Container Number",
          value: "",
          required: true,
          placeholder: "Container identifier...",
        },
        {
          id: "containerType",
          name: "containerType",
          type: "select",
          label: "Container Type",
          value: "Drum",
          required: true,
          options: [
            { label: "Drum", value: "Drum" },
            { label: "Barrel", value: "Barrel" },
            { label: "IBC", value: "IBC" },
            { label: "Bottle", value: "Bottle" },
            { label: "Can", value: "Can" },
            { label: "Cylinder", value: "Cylinder" },
            { label: "Bag", value: "Bag" },
            { label: "Box", value: "Box" },
            { label: "Tank", value: "Tank" },
            { label: "Bulk", value: "Bulk" },
            { label: "Other", value: "Other" },
          ],
        },
        {
          id: "chemicalName",
          name: "chemicalName",
          type: "text",
          label: "Chemical Name",
          value: "",
          required: true,
          placeholder: "Name of the chemical...",
        },
        {
          id: "capacity",
          name: "capacity",
          type: "number",
          label: "Capacity",
          value: "",
          required: true,
          placeholder: "0",
        },
        {
          id: "unit",
          name: "unit",
          type: "select",
          label: "Unit",
          value: "L",
          required: true,
          options: [
            { label: "Liters (L)", value: "L" },
            { label: "Kilograms (kg)", value: "kg" },
            { label: "Grams (g)", value: "g" },
            { label: "Cubic Meters (m³)", value: "m³" },
          ],
        },
        {
          id: "currentQuantity",
          name: "currentQuantity",
          type: "number",
          label: "Current Quantity",
          value: "",
          required: true,
          placeholder: "0",
        },
        {
          id: "warehouseName",
          name: "warehouseName",
          type: "text",
          label: "Warehouse Name (Optional)",
          value: "",
          placeholder: "Warehouse location...",
        },
        {
          id: "zoneName",
          name: "zoneName",
          type: "text",
          label: "Zone Name (Optional)",
          value: "",
          placeholder: "Zone location...",
        },
      ]}
      context={{
        formType: "OTHER",
        moduleId: "chemical-inventory",
        previousForms: containers.map((c) => ({
          containerNumber: c.containerNumber,
          containerType: c.containerType,
          chemicalName: c.chemicalName,
          capacity: c.capacity,
          unit: c.unit,
          currentQuantity: c.currentQuantity,
          warehouseName: c.warehouseName,
          zoneName: c.zoneName,
        })),
        userRole: "USER",
        tenantId: "default-tenant",
      }}
      onSubmit={handleSubmit}
      onCancel={onSuccess}
      title="Create New Container"
      isDark={true}
    />
  );
}

// ============================================================================
// OTHER TAB COMPONENTS
// ============================================================================

function ContainerTransfersTab({
  containers,
}: {
  containers: ChemicalContainer[];
}) {
  const allTransfers = containers.flatMap((c) =>
    c.transferHistory.map((t) => ({ ...t, container: c.containerNumber })),
  );

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Container Transfers</h3>
      {allTransfers.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No transfers recorded</p>
      ) : (
        <div className="space-y-2">
          {allTransfers.map((transfer, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">Container: {transfer.container}</p>
                <p className="text-xs text-gray-400">
                  {new Date(transfer.date).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm text-gray-300">
                <i className="ri-arrow-right-line text-cyan-400 mr-1"></i>
                {transfer.fromLocation} → {transfer.toLocation}
              </p>
              {transfer.reason && (
                <p className="text-xs text-gray-400 mt-1">
                  Reason: {transfer.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContainerDisposalTab({
  containers,
}: {
  containers: ChemicalContainer[];
}) {
  const disposedContainers = containers.filter((c) => c.status === "Disposed");

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Disposed Containers</h3>
      {disposedContainers.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No disposed containers</p>
      ) : (
        <div className="space-y-2">
          {disposedContainers.map((container) => (
            <div
              key={container.id}
              className="p-4 rounded-lg bg-red-900/20 border border-red-500/30"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{container.containerNumber}</p>
                {container.disposalDate && (
                  <p className="text-xs text-gray-400">
                    Disposed:{" "}
                    {new Date(container.disposalDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-300">{container.chemicalName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
