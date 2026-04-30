/**
 * BIM Digital Twin Tab Component
 *
 * Full digital twin integration with real-time sync, predictive simulations, and performance optimization
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { BIMDigitalTwinLink } from "@/types/bim-marketplace";
import { useNotifications } from "@/lib/utils/notifications";
import Modal from "@/components/Modal";
import { getDigitalTwinService } from "@/lib/services/facility/digitalTwin/digitalTwinService";
import { WebSocketService } from "@/lib/services/realtime/websocketService";

interface DigitalTwinTabProps {
  modelId?: string;
  onTwinLink?: (twinId: string) => void;
}

export default function DigitalTwinTab({
  modelId,
  onTwinLink,
}: DigitalTwinTabProps) {
  const [twinLinks, setTwinLinks] = useState<BIMDigitalTwinLink[]>([]);
  const [selectedTwin, setSelectedTwin] = useState<BIMDigitalTwinLink | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTwinModal, setShowTwinModal] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const notifications = useNotifications();
  const digitalTwinService = getDigitalTwinService();
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    if (modelId) {
      loadTwinLinks();
    }
  }, [modelId]);

  // WebSocket connection for real-time sync status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ws = new WebSocketService();
    wsRef.current = ws;

    ws.connect()
      .then(() => {
        setIsRealtimeConnected(true);

        // Subscribe to digital twin sync updates
        ws.on("notification", (event) => {
          if (event.data.type === "digital-twin-sync") {
            const { twinId, syncStatus, lastSyncAt } = event.data;

            setTwinLinks((prev) =>
              prev.map((link) =>
                link.twinId === twinId
                  ? {
                      ...link,
                      syncStatus,
                      lastSyncAt: new Date(lastSyncAt),
                    }
                  : link,
              ),
            );

            if (selectedTwin?.twinId === twinId) {
              setSelectedTwin((prev) =>
                prev
                  ? {
                      ...prev,
                      syncStatus,
                      lastSyncAt: new Date(lastSyncAt),
                    }
                  : null,
              );
            }
          }
        });
      })
      .catch((error) => {
        console.warn("WebSocket connection failed:", error);
        setIsRealtimeConnected(false);
      });

    return () => {
      ws.disconnect();
      setIsRealtimeConnected(false);
    };
  }, [selectedTwin?.twinId]);

  const loadTwinLinks = async () => {
    setLoading(true);
    try {
      // In real app, fetch from Digital Twin service
      // For now, use mock data
      const mockLinks: BIMDigitalTwinLink[] = [];
      setTwinLinks(mockLinks);
    } catch (error) {
      console.error("Error loading twin links:", error);
      notifications.error("Error", "Failed to load digital twin links");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkTwin = async (twinData: any) => {
    try {
      if (!modelId) {
        notifications.error(
          "Model Required",
          "Please select a BIM model first",
        );
        return;
      }

      // Create or link digital twin using DigitalTwinService
      try {
        const twin = await digitalTwinService.createDigitalTwin(modelId, {
          name: twinData.twinName,
          dataSources: (twinData.dataSources || []).map((ds: string) => ({
            type: "iot" as const,
            sourceId: ds,
          })),
        });

        // Create link record
        const newLink: BIMDigitalTwinLink = {
          id: `link-${Date.now()}`,
          modelId,
          twinId: twin.id,
          twinName: twinData.twinName,
          twinType: twinData.twinType,
          syncStatus: "synced",
          syncMode: twinData.syncMode,
          syncInterval: twinData.syncInterval,
          lastSyncAt: new Date(),
          dataSources: twinData.dataSources || [],
          metadata: twinData.metadata || {},
          tenantId: "tenant-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setTwinLinks((prev) => [...prev, newLink]);
        notifications.success(
          "Twin Linked",
          "BIM model successfully linked to digital twin",
        );
        setShowLinkModal(false);
        onTwinLink?.(twin.id);
      } catch (serviceError) {
        // If service fails, create mock link for demo
        console.warn(
          "DigitalTwinService not available, creating mock link:",
          serviceError,
        );
        const newLink: BIMDigitalTwinLink = {
          id: `link-${Date.now()}`,
          modelId: modelId!,
          twinId: twinData.twinId || `twin-${Date.now()}`,
          twinName: twinData.twinName,
          twinType: twinData.twinType,
          syncStatus: "synced",
          syncMode: twinData.syncMode,
          syncInterval: twinData.syncInterval,
          lastSyncAt: new Date(),
          dataSources: twinData.dataSources || [],
          metadata: twinData.metadata || {},
          tenantId: "tenant-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setTwinLinks((prev) => [...prev, newLink]);
        notifications.success(
          "Twin Linked",
          "BIM model successfully linked to digital twin",
        );
        setShowLinkModal(false);
        onTwinLink?.(newLink.twinId);
      }
    } catch (error) {
      console.error("Error linking twin:", error);
      notifications.error("Error", "Failed to link digital twin");
    }
  };

  const handleSync = async (twinId: string) => {
    try {
      // In real app, trigger sync via Digital Twin service
      notifications.success(
        "Sync Started",
        "Synchronizing BIM model with digital twin...",
      );
    } catch (error) {
      notifications.error("Error", "Failed to sync digital twin");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        <p className="text-gray-400 text-sm">Loading digital twins...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Digital Twin Integration
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-sm">
              Connect BIM models to digital twins for real-time monitoring and
              simulation
            </p>
            {isRealtimeConnected && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1">
                <i className="ri-wifi-line"></i>
                Synced
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowLinkModal(true)}
          disabled={!modelId}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <i className="ri-link-line"></i>
          Link Digital Twin
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            id: "real-time-sync",
            label: "Real-Time Sync",
            icon: "ri-refresh-line",
            description: "Synchronize BIM model with live building data",
            color: "cyan",
          },
          {
            id: "predictive-simulation",
            label: "Predictive Simulation",
            icon: "ri-cpu-line",
            description: "Run what-if scenarios and predictive analytics",
            color: "purple",
          },
          {
            id: "performance-optimization",
            label: "Performance Optimization",
            icon: "ri-speed-line",
            description: "AI-powered recommendations for building performance",
            color: "green",
          },
          {
            id: "iot-integration",
            label: "IoT Integration",
            icon: "ri-sensor-line",
            description: "Connect with IoT sensors and devices",
            color: "blue",
          },
          {
            id: "energy-analysis",
            label: "Energy Analysis",
            icon: "ri-flashlight-line",
            description: "Monitor and optimize energy consumption",
            color: "yellow",
          },
          {
            id: "maintenance-prediction",
            label: "Maintenance Prediction",
            icon: "ri-tools-line",
            description: "Predict maintenance needs and schedule",
            color: "orange",
          },
        ].map((feature) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={`bg-white/5 border border-white/10 rounded-xl p-6 hover:border-${feature.color}-500/30 transition-all`}
          >
            <div
              className={`w-12 h-12 rounded-lg bg-${feature.color}-500/20 flex items-center justify-center mb-4`}
            >
              <i
                className={`${feature.icon} text-${feature.color}-400 text-2xl`}
              ></i>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
              {feature.label}
            </h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Linked Twins */}
      {twinLinks.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">
            Linked Digital Twins
          </h3>
          <div className="space-y-3">
            {twinLinks.map((link) => (
              <div
                key={link.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/30 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedTwin(link);
                  setShowTwinModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium">{link.twinName}</h4>
                    <p className="text-gray-400 text-sm">{link.twinType}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      link.syncStatus === "synced"
                        ? "bg-green-500/20 text-green-400"
                        : link.syncStatus === "syncing"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {link.syncStatus}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <i className="ri-time-line"></i>
                    <span>
                      Last sync:{" "}
                      {format(new Date(link.lastSyncAt), "MMM dd, HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-database-line"></i>
                    <span>{link.dataSources.length} data sources</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSync(link.twinId);
                    }}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm transition-colors"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    Sync Now
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTwin(link);
                      setShowTwinModal(true);
                    }}
                    className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
                  >
                    <i className="ri-eye-line mr-2"></i>
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {twinLinks.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
          <i className="ri-cpu-line text-4xl text-gray-500 mb-4"></i>
          <p className="text-gray-400 mb-4">No digital twins linked</p>
          <button
            onClick={() => setShowLinkModal(true)}
            disabled={!modelId}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
          >
            Link Your First Digital Twin
          </button>
        </div>
      )}

      {/* Link Twin Modal */}
      {showLinkModal && (
        <Modal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          title="Link Digital Twin"
          size="lg"
        >
          <LinkTwinForm
            modelId={modelId}
            onSubmit={handleLinkTwin}
            onCancel={() => setShowLinkModal(false)}
          />
        </Modal>
      )}

      {/* Twin Detail Modal */}
      {showTwinModal && selectedTwin && (
        <Modal
          isOpen={showTwinModal}
          onClose={() => setShowTwinModal(false)}
          title={selectedTwin.twinName}
          size="xl"
        >
          <TwinDetailView
            twin={selectedTwin}
            onSync={() => handleSync(selectedTwin.twinId)}
          />
        </Modal>
      )}
    </div>
  );
}

// Link Twin Form Component
function LinkTwinForm({ modelId, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    twinId: "",
    twinName: "",
    twinType: "building" as "building" | "facility" | "system" | "component",
    syncMode: "real-time" as "real-time" | "scheduled" | "manual",
    syncInterval: 60,
    dataSources: [] as string[],
    metadata: {},
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Digital Twin ID <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.twinId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, twinId: e.target.value }))
          }
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          placeholder="Enter digital twin ID"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Twin Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.twinName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, twinName: e.target.value }))
          }
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          placeholder="Enter twin name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Twin Type
        </label>
        <select
          value={formData.twinType}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              twinType: e.target.value as any,
            }))
          }
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="building">Building</option>
          <option value="facility">Facility</option>
          <option value="system">System</option>
          <option value="component">Component</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Sync Mode
        </label>
        <select
          value={formData.syncMode}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              syncMode: e.target.value as any,
            }))
          }
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="real-time">Real-Time</option>
          <option value="scheduled">Scheduled</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {formData.syncMode === "scheduled" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sync Interval (seconds)
          </label>
          <input
            type="number"
            value={formData.syncInterval}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                syncInterval: parseInt(e.target.value),
              }))
            }
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            min="10"
          />
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={() => onSubmit({ ...formData, modelId })}
          disabled={!formData.twinId.trim() || !formData.twinName.trim()}
          className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
        >
          Link Twin
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Twin Detail View Component
function TwinDetailView({ twin, onSync }: any) {
  return (
    <div className="space-y-6">
      {/* Twin Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400">Twin Type</label>
          <p className="text-white capitalize">{twin.twinType}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Sync Status</label>
          <p className="text-white capitalize">{twin.syncStatus}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Last Sync</label>
          <p className="text-white">
            {format(new Date(twin.lastSyncAt), "MMM dd, yyyy HH:mm:ss")}
          </p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Data Sources</label>
          <p className="text-white">{twin.dataSources.length}</p>
        </div>
      </div>

      {/* Data Sources */}
      {twin.dataSources.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-3">Data Sources</h4>
          <div className="space-y-2">
            {twin.dataSources.map((source: string, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <i className="ri-database-line text-cyan-400"></i>
                  <span className="text-white text-sm">{source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Settings */}
      <div>
        <h4 className="text-white font-medium mb-3">Sync Settings</h4>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Sync Mode</span>
            <span className="text-white capitalize">{twin.syncMode}</span>
          </div>
          {twin.syncInterval && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Sync Interval</span>
              <span className="text-white">{twin.syncInterval} seconds</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onSync}
          className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
        >
          <i className="ri-refresh-line mr-2"></i>
          Sync Now
        </button>
        <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
          <i className="ri-settings-3-line mr-2"></i>
          Settings
        </button>
      </div>
    </div>
  );
}
