"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { format } from "date-fns";
import { DigitalTwinService } from "@/lib/services/facility/digitalTwin/digitalTwinService";
import type { DigitalTwin } from "@/types/facility";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

function DigitalTwinContent() {
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [selectedTwin, setSelectedTwin] = useState<DigitalTwin | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const digitalTwinService = new DigitalTwinService();

  useEffect(() => {
    loadTwins();
  }, []);

  const loadTwins = async () => {
    setLoading(true);
    try {
      const facilityId = "facility-1"; // In real app, get from context/params
      const response = await fetch(
        `/api/facility/digital-twin?facilityId=${facilityId}`,
      );
      const result = await response.json();

      if (result.success && result.data) {
        setTwins(Array.isArray(result.data) ? result.data : []);
      } else {
        // Fallback to empty array
        setTwins([]);
      }
    } catch (error) {
      console.error("Error loading digital twins:", error);
      // Fallback to empty array on error
      setTwins([]);
    } finally {
      setLoading(false);
    }
  };

  // Legacy mock data function (kept for reference, not used)
  const getMockTwins = (): DigitalTwin[] => [
    {
      id: "1",
      facilityId: "facility-1",
      name: "Main Warehouse Digital Twin",
      status: "active",
      version: "2.1.0",
      syncFrequency: 60,
      lastSyncDate: new Date(),
      nextSyncDate: new Date(Date.now() + 60000),
      dataSources: [
        {
          id: "ds-1",
          type: "iot-sensor",
          sourceId: "iot-network-1",
          syncEnabled: true,
          lastSyncDate: new Date(),
          syncStatus: "success",
        },
        {
          id: "ds-2",
          type: "energy-meter",
          sourceId: "energy-system-1",
          syncEnabled: true,
          lastSyncDate: new Date(),
          syncStatus: "success",
        },
      ],
      simulations: [],
      optimizations: [],
      metadata: {},
      tenantId: "tenant-1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date(),
    },
    {
      id: "2",
      facilityId: "facility-2",
      name: "Office Building Digital Twin",
      status: "active",
      version: "1.5.0",
      syncFrequency: 120,
      lastSyncDate: new Date(Date.now() - 60000),
      nextSyncDate: new Date(Date.now() + 60000),
      dataSources: [
        {
          id: "ds-3",
          type: "bim-model",
          sourceId: "space-management-1",
          syncEnabled: true,
          lastSyncDate: new Date(),
          syncStatus: "success",
        },
      ],
      simulations: [],
      optimizations: [],
      metadata: {},
      tenantId: "tenant-1",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date(),
    },
  ];

  const stats = {
    total: twins.length,
    active: twins.filter((t) => t.status === "active").length,
    inactive: twins.filter((t) => t.status === "inactive").length,
    totalDataSources: twins.reduce((sum, t) => sum + t.dataSources.length, 0),
  };

  const syncStatusData = twins.map((twin) => ({
    name: twin.name,
    lastSync: twin.lastSyncDate
      ? Math.floor(
          (Date.now() - new Date(twin.lastSyncDate).getTime()) / 1000 / 60,
        )
      : 0,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "inactive":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "syncing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Digital Twin"
        icon="ri-magic-line"
        description="Digital twin management and simulation"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Digital Twin"
      description="Real-time digital twin of your facilities with predictive simulations and optimization"
      icon="ri-magic-line"
      stats={[
        {
          label: "Total Twins",
          value: stats.total,
          icon: "ri-cube-line",
          tooltip: "Total digital twins",
        },
        {
          label: "Active",
          value: stats.active,
          icon: "ri-checkbox-circle-line",
          tooltip: "Active digital twins",
        },
        {
          label: "Data Sources",
          value: stats.totalDataSources,
          icon: "ri-database-2-line",
          tooltip: "Total data sources",
        },
        {
          label: "Sync Frequency",
          value: "60s",
          icon: "ri-time-line",
          tooltip: "Average sync frequency",
        },
      ]}
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Create Digital Twin
        </button>
      }
    >
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sync Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={syncStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis
                stroke="#9ca3af"
                label={{
                  value: "Minutes Ago",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                }}
              />
              <Bar dataKey="lastSync" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Data Sources by Type
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Array.from(
                twins.reduce((acc, t) => {
                  t.dataSources.forEach((ds) => {
                    acc.set(ds.type, (acc.get(ds.type) || 0) + 1);
                  });
                  return acc;
                }, new Map<string, number>()),
              ).map(([type, count]) => ({ type, count }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="type" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                }}
              />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Digital Twins List */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Digital Twins</h3>
        </div>
        <div className="p-4 space-y-3">
          {twins.map((twin) => (
            <div
              key={twin.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{twin.name}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(twin.status)}`}
                    >
                      {twin.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Version {twin.version} • {twin.dataSources.length} data
                    sources
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTwin(twin);
                    setShowDetailModal(true);
                  }}
                  className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm hover:bg-cyan-500/30 transition-colors"
                >
                  View Details
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Last Sync</p>
                  <p className="text-white">
                    {twin.lastSyncDate
                      ? format(new Date(twin.lastSyncDate), "MMM dd, HH:mm")
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Next Sync</p>
                  <p className="text-white">
                    {twin.nextSyncDate
                      ? format(new Date(twin.nextSyncDate), "MMM dd, HH:mm")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Sync Frequency</p>
                  <p className="text-white">{twin.syncFrequency}s</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTwin && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedTwin.name}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Status
              </label>
              <p className="text-white">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedTwin.status)}`}
                >
                  {selectedTwin.status}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Version
              </label>
              <p className="text-white">{selectedTwin.version}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Sync Frequency
              </label>
              <p className="text-white">{selectedTwin.syncFrequency} seconds</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Last Sync
              </label>
              <p className="text-white">
                {selectedTwin.lastSyncDate
                  ? format(
                      new Date(selectedTwin.lastSyncDate),
                      "MMMM dd, yyyy HH:mm:ss",
                    )
                  : "Never"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Next Sync
              </label>
              <p className="text-white">
                {selectedTwin.nextSyncDate
                  ? format(
                      new Date(selectedTwin.nextSyncDate),
                      "MMMM dd, yyyy HH:mm:ss",
                    )
                  : "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Data Sources
              </label>
              <div className="mt-2 space-y-2">
                {selectedTwin.dataSources.map((ds) => (
                  <div key={ds.id} className="bg-white/5 p-2 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{ds.type}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          ds.syncStatus === "success"
                            ? "bg-green-500/20 text-green-400"
                            : ds.syncStatus === "error"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {ds.syncStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Last sync:{" "}
                      {ds.lastSyncDate
                        ? format(new Date(ds.lastSyncDate), "MMM dd, HH:mm")
                        : "Never"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors">
                View 3D Model
              </button>
              <button className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
                Run Simulation
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Digital Twin"
        >
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Create a digital twin for a facility to enable real-time
              synchronization, predictive simulations, and optimization.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Facility
              </label>
              <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <option value="">Select facility...</option>
                <option value="facility-1">Main Warehouse</option>
                <option value="facility-2">Office Building</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="Enter digital twin name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sync Frequency (seconds)
              </label>
              <input
                type="number"
                defaultValue={60}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors">
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}

export default function DigitalTwinPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Digital Twin"
          description="Real-time digital twin synchronization and predictive simulations"
          icon="ri-cpu-line"
        >
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Error Loading Digital Twins
              </h2>
              <p className="text-gray-500">
                Something went wrong. Please refresh the page.
              </p>
            </div>
          </div>
        </PageTemplate>
      }
    >
      <DigitalTwinContent />
    </ErrorBoundary>
  );
}
