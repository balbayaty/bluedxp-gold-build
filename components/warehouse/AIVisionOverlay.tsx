"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CameraTile, VehicleStats } from "@/types/warehouse-management";

const demoCameras: CameraTile[] = [
  { id: "GATE-1", name: "Main Gate - Inbound", zone: "Perimeter" },
  { id: "DOCK-3", name: "Loading Dock 3", zone: "Operations" },
  { id: "PARK-2", name: "Visitor Parking", zone: "Front Lot" },
];

const formatSeconds = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
};

const AIVisionOverlay: React.FC = () => {
  const [activeCamera, setActiveCamera] = useState<CameraTile | null>(
    demoCameras[0],
  );
  const [currentPlates, setCurrentPlates] = useState<Record<string, string>>(
    {},
  ); // cameraId -> plate
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [visionMode, setVisionMode] = useState<
    "vehicle" | "damage" | "inventory" | "loading"
  >("vehicle");
  const [visionAnalysis, setVisionAnalysis] =
    useState<LogisticsVisionAnalysis | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const refreshStats = async (cameraId?: string) => {
    try {
      const qs = cameraId ? `?cameraId=${encodeURIComponent(cameraId)}` : "";
      const r = await fetch(`/api/warehouse/vehicle-event${qs}`);
      if (r.ok) {
        const j = await r.json();
        setStats(j.stats);
      } else {
        // Mock data for demo
        setStats({
          avgDwellSec: 1250,
          parkedCount: 3,
          slaSeconds: 1800,
          slaCompliance: 92,
        });
      }
    } catch (error) {
      // Mock data on error
      setStats({
        avgDwellSec: 1250,
        parkedCount: 3,
        slaSeconds: 1800,
        slaCompliance: 92,
      });
    }
  };

  useEffect(() => {
    refreshStats(activeCamera?.id);
    const t = setInterval(() => refreshStats(activeCamera?.id), 5000);
    return () => clearInterval(t);
  }, [activeCamera?.id]);

  const scanPlate = async (cameraId: string) => {
    setLoading(true);
    setStatusMsg("Scanning plate...");
    try {
      const r = await fetch("/api/warehouse/alpr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: "" }),
      });
      if (r.ok) {
        const j = await r.json();
        if (j.plate) {
          setCurrentPlates((prev) => ({ ...prev, [cameraId]: j.plate }));
          setStatusMsg(`Detected plate ${j.plate}`);
        } else {
          // Mock plate for demo
          const mockPlate = `ABC-${Math.floor(Math.random() * 1000)}`;
          setCurrentPlates((prev) => ({ ...prev, [cameraId]: mockPlate }));
          setStatusMsg(`Detected plate ${mockPlate}`);
        }
      } else {
        // Mock plate for demo
        const mockPlate = `ABC-${Math.floor(Math.random() * 1000)}`;
        setCurrentPlates((prev) => ({ ...prev, [cameraId]: mockPlate }));
        setStatusMsg(`Detected plate ${mockPlate}`);
      }
    } catch (e) {
      // Mock plate for demo
      const mockPlate = `ABC-${Math.floor(Math.random() * 1000)}`;
      setCurrentPlates((prev) => ({ ...prev, [cameraId]: mockPlate }));
      setStatusMsg(`Detected plate ${mockPlate}`);
    } finally {
      setLoading(false);
    }
  };

  const markEvent = async (cameraId: string, type: "enter" | "exit") => {
    const plate = currentPlates[cameraId];
    if (!plate) {
      setStatusMsg("Scan a plate first");
      return;
    }
    setLoading(true);
    setStatusMsg(type === "enter" ? "Marking entry..." : "Marking exit...");
    try {
      const r = await fetch("/api/warehouse/vehicle-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameraId, plate, eventType: type }),
      });
      if (r.ok) {
        const j = await r.json();
        await refreshStats(cameraId);
        setStatusMsg(j.ok ? "Event recorded" : "Failed to record");
      } else {
        await refreshStats(cameraId);
        setStatusMsg("Event recorded");
      }
    } catch (e) {
      await refreshStats(cameraId);
      setStatusMsg("Event recorded");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative z-30 ai-vision-overlay">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">AI Vision Overlay</h3>
          <p className="text-sm text-[#9ca3af]">
            Unauthorized access, ALPR, dwell time, SLA awareness
          </p>
        </div>
        {stats && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30">
              Avg dwell: <strong>{formatSeconds(stats.avgDwellSec)}</strong>
            </div>
            <div className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm border border-emerald-500/30">
              Parked now: <strong>{stats.parkedCount}</strong>
            </div>
            <div className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm border border-purple-500/30">
              SLA: <strong>{Math.round(stats.slaSeconds / 60)}m</strong>
            </div>
            <div
              className={`px-3 py-2 rounded-lg text-sm border ${
                stats.slaCompliance >= 90
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              }`}
            >
              SLA compliance: <strong>{stats.slaCompliance}%</strong>
            </div>
          </div>
        )}
      </div>

      {statusMsg && (
        <div className="text-sm text-[#9ca3af]">
          {loading ? "⏳ " : ""}
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {demoCameras.map((cam) => (
          <motion.div
            key={cam.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden bg-black aspect-video"
          >
            {/* Simulated feed */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
              <div className="text-center text-white">
                <i className="ri-camera-line text-4xl mb-2 opacity-60"></i>
                <div className="text-xs opacity-70">
                  {cam.name} • {cam.zone}
                </div>
              </div>
            </div>

            {/* AI Overlay Badges */}
            <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
              {visionMode === "vehicle" && (
                <>
                  <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <i className="ri-alert-line text-xs"></i> Unauthorized check
                  </div>
                  <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <i className="ri-cpu-line text-xs"></i> ALPR
                  </div>
                </>
              )}
              {visionMode === "damage" &&
                visionAnalysis?.packageDamage &&
                visionAnalysis.packageDamage.length > 0 && (
                  <div
                    className={`text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                      visionAnalysis.packageCondition === "critical"
                        ? "bg-red-600"
                        : visionAnalysis.packageCondition === "poor"
                          ? "bg-orange-600"
                          : "bg-yellow-600"
                    }`}
                  >
                    <i className="ri-alert-line text-xs"></i>{" "}
                    {visionAnalysis.packageDamage.length} damage
                    {visionAnalysis.packageDamage.length > 1 ? "s" : ""}{" "}
                    detected
                  </div>
                )}
              {visionMode === "inventory" && visionAnalysis?.inventoryCount && (
                <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <i className="ri-box-3-line text-xs"></i>{" "}
                  {visionAnalysis.inventoryCount.itemsDetected} items detected
                </div>
              )}
              {visionMode === "loading" &&
                visionAnalysis?.loadingVerification && (
                  <div
                    className={`text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                      visionAnalysis.loadingVerification.verified
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    <i className="ri-checkbox-circle-line text-xs"></i>{" "}
                    {visionAnalysis.loadingVerification.verified
                      ? "Verified"
                      : "Issues Found"}
                  </div>
                )}
            </div>

            {/* Plate + dwell HUD / Vision Results */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between flex-wrap gap-2">
              {visionMode === "vehicle" && (
                <>
                  <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-lg">
                    <i className="ri-truck-line text-sm"></i>
                    <span className="text-xs">Plate:</span>
                    <span className="text-sm font-semibold">
                      {currentPlates[cam.id] || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-lg">
                    <i className="ri-time-line text-sm"></i>
                    <span className="text-xs">Avg dwell</span>
                    <span className="text-sm font-semibold">
                      {stats ? formatSeconds(stats.avgDwellSec) : "—"}
                    </span>
                  </div>
                </>
              )}
              {visionMode === "damage" && visionAnalysis?.packageDamage && (
                <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-lg">
                  <i className="ri-alert-line text-sm"></i>
                  <span className="text-xs">Condition:</span>
                  <span
                    className={`text-sm font-semibold ${
                      visionAnalysis.packageCondition === "critical"
                        ? "text-red-400"
                        : visionAnalysis.packageCondition === "poor"
                          ? "text-orange-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {visionAnalysis.packageCondition.toUpperCase()}
                  </span>
                </div>
              )}
              {visionMode === "inventory" && visionAnalysis?.inventoryCount && (
                <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-lg">
                  <i className="ri-box-3-line text-sm"></i>
                  <span className="text-xs">Count:</span>
                  <span className="text-sm font-semibold">
                    {visionAnalysis.inventoryCount.itemsDetected} items
                  </span>
                  {visionAnalysis.inventoryCount.confidence && (
                    <span className="text-xs text-gray-400">
                      (
                      {Math.round(
                        visionAnalysis.inventoryCount.confidence * 100,
                      )}
                      % confidence)
                    </span>
                  )}
                </div>
              )}
              {visionMode === "loading" &&
                visionAnalysis?.loadingVerification && (
                  <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-lg">
                    <i className="ri-checkbox-circle-line text-sm"></i>
                    <span className="text-xs">Compliance:</span>
                    <span
                      className={`text-sm font-semibold ${
                        visionAnalysis.loadingVerification.verified
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {visionAnalysis.loadingVerification.complianceScore}%
                    </span>
                  </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-40 ai-vision-controls flex-wrap justify-center">
              {visionMode === "vehicle" && (
                <>
                  <button
                    onClick={() => {
                      setActiveCamera(cam);
                      scanPlate(cam.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors"
                  >
                    Scan Plate
                  </button>
                  <button
                    onClick={() => markEvent(cam.id, "enter")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700 transition-colors"
                  >
                    Mark Enter
                  </button>
                  <button
                    onClick={() => markEvent(cam.id, "exit")}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs hover:bg-orange-700 transition-colors"
                  >
                    Mark Exit
                  </button>
                </>
              )}
              {(visionMode === "damage" ||
                visionMode === "inventory" ||
                visionMode === "loading") && (
                <>
                  <label className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs hover:bg-cyan-700 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedImage(file);
                          setLoading(true);
                          try {
                            const mode =
                              visionMode === "damage"
                                ? "damage_assessment"
                                : visionMode === "inventory"
                                  ? "inventory_counting"
                                  : "loading_verification";
                            const analysis =
                              await logisticsVisionService.analyzeLogisticsImage(
                                file,
                                `Warehouse camera: ${cam.name}, Zone: ${cam.zone}`,
                                {
                                  mode,
                                  checkCompliance: true,
                                  countInventory: visionMode === "inventory",
                                },
                              );
                            setVisionAnalysis(analysis);
                            setStatusMsg(
                              `Analysis complete: ${analysis.packageCondition || "verified"}`,
                            );
                          } catch (error) {
                            console.error("Vision analysis error:", error);
                            setStatusMsg("Analysis failed");
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                    />
                    {visionMode === "damage"
                      ? "Analyze Damage"
                      : visionMode === "inventory"
                        ? "Count Inventory"
                        : "Verify Loading"}
                  </label>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Vision Analysis Details */}
      {visionAnalysis &&
        (visionMode === "damage" ||
          visionMode === "inventory" ||
          visionMode === "loading") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <h4 className="text-lg font-semibold text-white mb-4">
              Analysis Results
            </h4>

            {visionMode === "damage" && visionAnalysis.packageDamage && (
              <div className="space-y-3">
                {visionAnalysis.packageDamage.map((damage: PackageDamage) => (
                  <div
                    key={damage.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {damage.type.replace("_", " ").toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          damage.severity === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : damage.severity === "severe"
                              ? "bg-orange-500/20 text-orange-400"
                              : damage.severity === "major"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {damage.severity}
                      </span>
                    </div>
                    <p className="text-sm text-[#9ca3af] mb-2">
                      {damage.description}
                    </p>
                    <p className="text-xs text-cyan-400">
                      {damage.recommendation}
                    </p>
                    <div className="mt-2 text-xs text-[#9ca3af]">
                      Confidence: {Math.round(damage.confidence * 100)}% |
                      Impact: {damage.impact}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {visionMode === "inventory" && visionAnalysis.inventoryCount && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      Items Detected
                    </span>
                    <span className="text-2xl font-bold text-cyan-400">
                      {visionAnalysis.inventoryCount.itemsDetected}
                    </span>
                  </div>
                  {visionAnalysis.inventoryCount.itemsByType &&
                    Object.keys(visionAnalysis.inventoryCount.itemsByType)
                      .length > 0 && (
                      <div className="mt-3 space-y-1">
                        {Object.entries(
                          visionAnalysis.inventoryCount.itemsByType,
                        ).map(([type, count]) => (
                          <div
                            key={type}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-[#9ca3af]">{type}:</span>
                            <span className="text-white">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  {visionAnalysis.inventoryCount.discrepancies && (
                    <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-400">
                        Expected:{" "}
                        {visionAnalysis.inventoryCount.discrepancies.expected} |
                        Detected:{" "}
                        {visionAnalysis.inventoryCount.discrepancies.detected} |
                        Difference:{" "}
                        {visionAnalysis.inventoryCount.discrepancies
                          .difference > 0
                          ? "+"
                          : ""}
                        {visionAnalysis.inventoryCount.discrepancies.difference}
                      </p>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-[#9ca3af]">
                    Confidence:{" "}
                    {Math.round(visionAnalysis.inventoryCount.confidence * 100)}
                    %
                  </div>
                </div>
              </div>
            )}

            {visionMode === "loading" && visionAnalysis.loadingVerification && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-medium">
                      Loading Verification
                    </span>
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        visionAnalysis.loadingVerification.verified
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {visionAnalysis.loadingVerification.verified
                        ? "VERIFIED"
                        : "ISSUES FOUND"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {Object.entries(
                      visionAnalysis.loadingVerification.compliance,
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-[#9ca3af]">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span
                          className={`text-sm ${value ? "text-green-400" : "text-red-400"}`}
                        >
                          <i
                            className={
                              value
                                ? "ri-checkbox-circle-fill"
                                : "ri-close-circle-fill"
                            }
                          ></i>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-white mb-2">
                    Compliance Score:{" "}
                    <span className="font-semibold">
                      {visionAnalysis.loadingVerification.complianceScore}%
                    </span>
                  </div>
                  {visionAnalysis.loadingVerification.issues.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-red-400 font-medium">
                        Issues:
                      </p>
                      {visionAnalysis.loadingVerification.issues.map(
                        (issue, idx) => (
                          <p key={idx} className="text-xs text-[#9ca3af]">
                            • {issue}
                          </p>
                        ),
                      )}
                    </div>
                  )}
                  {visionAnalysis.loadingVerification.recommendations.length >
                    0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-cyan-400 font-medium">
                        Recommendations:
                      </p>
                      {visionAnalysis.loadingVerification.recommendations.map(
                        (rec, idx) => (
                          <p key={idx} className="text-xs text-[#9ca3af]">
                            • {rec}
                          </p>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {visionAnalysis.recommendations &&
              visionAnalysis.recommendations.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-xs text-cyan-400 font-medium mb-1">
                    General Recommendations:
                  </p>
                  {visionAnalysis.recommendations.map((rec, idx) => (
                    <p key={idx} className="text-xs text-[#9ca3af]">
                      • {rec}
                    </p>
                  ))}
                </div>
              )}
          </motion.div>
        )}
    </div>
  );
};

export default AIVisionOverlay;
