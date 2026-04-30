/**
 * Journey Analysis Visualization Component
 *
 * Dynamic journey visualization with touchpoints, transport legs, and root cause analysis
 * Multi-modal support (Europe to Middle East)
 * Industry-standard terminology
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Navigation,
  TrendingUp,
  Activity,
  FileText,
  Settings,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type {
  JourneyAnalysis,
  Touchpoint,
  TransportLeg,
  JourneyBottleneck,
  JourneyInsight,
} from "@/lib/services/transportation";

interface JourneyAnalysisVisualizationProps {
  journey: JourneyAnalysis;
  onTouchpointClick?: (touchpoint: Touchpoint) => void;
  onLegClick?: (leg: TransportLeg) => void;
  interactive?: boolean;
}

export default function JourneyAnalysisVisualization({
  journey,
  onTouchpointClick,
  onLegClick,
  interactive = true,
}: JourneyAnalysisVisualizationProps) {
  const [selectedTouchpoint, setSelectedTouchpoint] =
    useState<Touchpoint | null>(null);
  const [selectedLeg, setSelectedLeg] = useState<TransportLeg | null>(null);
  const [viewMode, setViewMode] = useState<"TIMELINE" | "MAP" | "DETAILS">(
    "TIMELINE",
  );
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleTouchpointClick = (touchpoint: Touchpoint) => {
    setSelectedTouchpoint(touchpoint);
    setSelectedLeg(null);
    if (onTouchpointClick) onTouchpointClick(touchpoint);
  };

  const handleLegClick = (leg: TransportLeg) => {
    setSelectedLeg(leg);
    setSelectedTouchpoint(null);
    if (onLegClick) onLegClick(leg);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 ${
        isFullscreen ? "fixed inset-4 z-50" : "relative"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {journey.journeyName ||
                `Journey ${journey.shipmentId || journey.id}`}
            </h3>
            <p className="text-sm text-gray-500">
              {journey.touchpoints?.length || 0} touchpoints •{" "}
              {journey.transportLegs?.length || 0} legs •{" "}
              {journey.totalDistance ? journey.totalDistance.toFixed(1) : "0.0"}{" "}
              km
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: "TIMELINE", label: "Timeline", icon: Clock },
              { id: "MAP", label: "Map", icon: MapPin },
              { id: "DETAILS", label: "Details", icon: FileText },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  viewMode === mode.id
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <mode.icon className="w-4 h-4 inline mr-1" />
                {mode.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === "TIMELINE" && (
          <JourneyTimeline
            journey={journey}
            onTouchpointClick={handleTouchpointClick}
            onLegClick={handleLegClick}
            selectedTouchpoint={selectedTouchpoint}
            selectedLeg={selectedLeg}
          />
        )}

        {viewMode === "MAP" && (
          <JourneyMap
            journey={journey}
            onTouchpointClick={handleTouchpointClick}
            onLegClick={handleLegClick}
            selectedTouchpoint={selectedTouchpoint}
            selectedLeg={selectedLeg}
          />
        )}

        {viewMode === "DETAILS" && (
          <JourneyDetails
            journey={journey}
            onTouchpointClick={handleTouchpointClick}
            selectedTouchpoint={selectedTouchpoint}
          />
        )}
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {(selectedTouchpoint || selectedLeg) && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto"
          >
            {selectedTouchpoint && (
              <TouchpointDetails
                touchpoint={selectedTouchpoint}
                onClose={() => setSelectedTouchpoint(null)}
              />
            )}
            {selectedLeg && (
              <LegDetails
                leg={selectedLeg}
                onClose={() => setSelectedLeg(null)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function JourneyTimeline({
  journey,
  onTouchpointClick,
  onLegClick,
  selectedTouchpoint,
  selectedLeg,
}: any) {
  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />

        {/* Touchpoints */}
        <div className="space-y-8">
          {journey.touchpoints?.map((touchpoint: Touchpoint, idx: number) => {
            const leg = journey.transportLegs?.find(
              (l: TransportLeg) => l.toTouchpointId === touchpoint.id,
            );
            const isSelected = selectedTouchpoint?.id === touchpoint.id;

            return (
              <div key={touchpoint.id} className="relative">
                {/* Touchpoint */}
                <div
                  className={`flex items-start gap-4 cursor-pointer transition ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
                      : ""
                  }`}
                  onClick={() => onTouchpointClick(touchpoint)}
                >
                  <div
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-white shadow-lg z-10 ${
                      touchpoint.status === "COMPLETED"
                        ? "bg-green-500 border-green-600"
                        : touchpoint.status === "IN_TRANSIT" ||
                            touchpoint.status === "PROCESSING"
                          ? "bg-blue-500 border-blue-600"
                          : touchpoint.status === "EXCEPTION" ||
                              touchpoint.status === "DELAYED"
                            ? "bg-red-500 border-red-600"
                            : "bg-gray-500 border-gray-600"
                    }`}
                  >
                    {touchpoint.sequence || idx + 1}
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold">{touchpoint.name}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          touchpoint.status === "COMPLETED"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : touchpoint.status === "IN_TRANSIT" ||
                                touchpoint.status === "PROCESSING"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : touchpoint.status === "EXCEPTION" ||
                                  touchpoint.status === "DELAYED"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {touchpoint.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {touchpoint.location?.address?.city ||
                        touchpoint.location?.name ||
                        "Unknown"}
                      ,{" "}
                      {touchpoint.location?.address?.country ||
                        touchpoint.location?.country ||
                        "Unknown"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        ETA:{" "}
                        {touchpoint.estimatedArrival
                          ? new Date(
                              touchpoint.estimatedArrival,
                            ).toLocaleString()
                          : touchpoint.plannedArrival
                            ? new Date(
                                touchpoint.plannedArrival,
                              ).toLocaleString()
                            : "N/A"}
                      </span>
                      {touchpoint.processingTime && (
                        <span>Processing: {touchpoint.processingTime}h</span>
                      )}
                    </div>
                    {touchpoint.customsStatus && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Customs: </span>
                        <span
                          className={`text-xs font-medium ${
                            touchpoint.customsStatus === "CLEARED"
                              ? "text-green-600"
                              : touchpoint.customsStatus === "HELD" ||
                                  touchpoint.customsStatus === "REJECTED"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {touchpoint.customsStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transport Leg */}
                {leg && idx < (journey.touchpoints?.length || 0) - 1 && (
                  <div
                    className={`ml-8 mt-2 mb-4 p-3 rounded-lg border cursor-pointer transition ${
                      selectedLeg?.id === leg.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300"
                    }`}
                    onClick={() => onLegClick(leg)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4" />
                      <span className="font-medium text-sm">
                        Leg {leg.sequence || idx + 1}: {leg.mode}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>
                        Distance:{" "}
                        {leg.distance ? leg.distance.toFixed(1) : "0.0"} km
                      </div>
                      <div>
                        Duration:{" "}
                        {leg.estimatedDuration
                          ? leg.estimatedDuration.toFixed(1)
                          : leg.plannedDuration
                            ? (leg.plannedDuration / 3600).toFixed(1)
                            : "0.0"}{" "}
                        hours
                      </div>
                      {leg.carrier && (
                        <div>
                          Carrier:{" "}
                          {typeof leg.carrier === "string"
                            ? leg.carrier
                            : leg.carrier.name}
                        </div>
                      )}
                      {leg.vessel && <div>Vessel: {leg.vessel.name}</div>}
                      {leg.flight && <div>Flight: {leg.flight.number}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottlenecks & Insights */}
      {(journey.bottlenecks?.length > 0 || journey.insights?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {journey.bottlenecks && journey.bottlenecks.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                Bottlenecks
              </h4>
              <div className="space-y-2">
                {journey.bottlenecks.map((bottleneck: JourneyBottleneck) => (
                  <div key={bottleneck.touchpointId} className="text-sm">
                    <div className="font-medium">
                      {bottleneck.touchpointName}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Avg Delay: {bottleneck.avgDelayHours}h • Severity:{" "}
                      {bottleneck.severity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {journey.insights && journey.insights.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Insights
              </h4>
              <div className="space-y-2">
                {journey.insights.map((insight: JourneyInsight) => (
                  <div key={insight.id} className="text-sm">
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {insight.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JourneyMap({
  journey,
  onTouchpointClick,
  selectedTouchpoint,
  selectedLeg,
}: any) {
  return (
    <div className="relative h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden">
      {/* Placeholder for map integration */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">Journey Map Visualization</p>
          <p className="text-sm mt-2">
            Interactive map with touchpoints, transport legs, and route
            visualization
          </p>
          <p className="text-xs mt-4 text-gray-400">
            In production: Integrate with Google Maps, Mapbox, or Leaflet
          </p>
        </div>
      </div>

      {/* Touchpoint markers (simplified) */}
      <div className="absolute inset-0 p-4">
        {journey.touchpoints?.map((touchpoint: Touchpoint, idx: number) => (
          <div
            key={touchpoint.id}
            className={`absolute cursor-pointer transition transform hover:scale-110 ${
              selectedTouchpoint?.id === touchpoint.id ? "z-10" : "z-0"
            }`}
            style={{
              left: `${10 + (idx / Math.max(1, (journey.touchpoints?.length || 1) - 1)) * 80}%`,
              top: `${20 + (idx % 3) * 30}%`,
            }}
            onClick={() => onTouchpointClick(touchpoint)}
          >
            <div
              className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-white shadow-lg ${
                touchpoint.status === "COMPLETED"
                  ? "bg-green-500 border-green-600"
                  : touchpoint.status === "IN_TRANSIT" ||
                      touchpoint.status === "PROCESSING"
                    ? "bg-blue-500 border-blue-600"
                    : touchpoint.status === "EXCEPTION" ||
                        touchpoint.status === "DELAYED"
                      ? "bg-red-500 border-red-600"
                      : "bg-gray-500 border-gray-600"
              }`}
            >
              {touchpoint.sequence || idx + 1}
            </div>
            <div className="mt-2 text-xs text-center bg-white dark:bg-gray-800 rounded px-2 py-1 shadow border border-gray-200 dark:border-gray-700 max-w-[100px] truncate">
              {touchpoint.location?.address?.city ||
                touchpoint.location?.name ||
                "Unknown"}
            </div>
          </div>
        )) || []}
      </div>
    </div>
  );
}

function JourneyDetails({
  journey,
  onTouchpointClick,
  selectedTouchpoint,
}: any) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Distance
          </div>
          <div className="text-2xl font-bold">
            {journey.totalDistance ? journey.totalDistance.toFixed(1) : "0.0"}{" "}
            km
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Est. Duration
          </div>
          <div className="text-2xl font-bold">
            {journey.estimatedTotalDuration
              ? journey.estimatedTotalDuration.toFixed(1)
              : journey.totalDuration
                ? (journey.totalDuration / 3600).toFixed(1)
                : "0.0"}{" "}
            hours
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Touchpoints
          </div>
          <div className="text-2xl font-bold">
            {journey.touchpoints?.length || 0}
          </div>
        </div>
      </div>

      {/* Touchpoints Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left p-3 font-medium">Sequence</th>
              <th className="text-left p-3 font-medium">Touchpoint</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Location</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">ETA</th>
            </tr>
          </thead>
          <tbody>
            {journey.touchpoints?.map((touchpoint: Touchpoint) => (
              <tr
                key={touchpoint.id}
                className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${
                  selectedTouchpoint?.id === touchpoint.id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
                onClick={() => onTouchpointClick(touchpoint)}
              >
                <td className="p-3 font-medium">
                  {touchpoint.sequence || "N/A"}
                </td>
                <td className="p-3">{touchpoint.name}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700">
                    {touchpoint.type}
                  </span>
                </td>
                <td className="p-3">
                  {touchpoint.location?.address?.city ||
                    touchpoint.location?.name ||
                    "Unknown"}
                  ,{" "}
                  {touchpoint.location?.address?.country ||
                    touchpoint.location?.country ||
                    "Unknown"}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      touchpoint.status === "COMPLETED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : touchpoint.status === "IN_TRANSIT" ||
                            touchpoint.status === "PROCESSING"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : touchpoint.status === "EXCEPTION" ||
                              touchpoint.status === "DELAYED"
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {touchpoint.status}
                  </span>
                </td>
                <td className="p-3">
                  {touchpoint.estimatedArrival
                    ? new Date(touchpoint.estimatedArrival).toLocaleString()
                    : touchpoint.plannedArrival
                      ? new Date(touchpoint.plannedArrival).toLocaleString()
                      : "N/A"}
                </td>
              </tr>
            )) || []}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TouchpointDetails({
  touchpoint,
  onClose,
}: {
  touchpoint: Touchpoint;
  onClose: () => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold">Touchpoint {touchpoint.sequence}</h4>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500">Name</label>
          <p className="font-medium">{touchpoint.name}</p>
        </div>
        <div>
          <label className="text-xs text-gray-500">Type</label>
          <p className="font-medium">{touchpoint.type}</p>
        </div>
        <div>
          <label className="text-xs text-gray-500">Location</label>
          <p className="font-medium">
            {touchpoint.location.address.street},{" "}
            {touchpoint.location.address.city},{" "}
            {touchpoint.location.address.country}
          </p>
        </div>
        <div>
          <label className="text-xs text-gray-500">Status</label>
          <span
            className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
              touchpoint.status === "COMPLETED"
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : touchpoint.status === "IN_TRANSIT" ||
                    touchpoint.status === "PROCESSING"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
            }`}
          >
            {touchpoint.status}
          </span>
        </div>
        {touchpoint.processingTime && (
          <div>
            <label className="text-xs text-gray-500">Processing Time</label>
            <p className="font-medium">{touchpoint.processingTime} hours</p>
          </div>
        )}
        {touchpoint.documents && touchpoint.documents.length > 0 && (
          <div>
            <label className="text-xs text-gray-500 mb-2 block">
              Required Documents
            </label>
            <div className="space-y-1">
              {touchpoint.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`text-sm p-2 rounded ${
                    doc.status === "APPROVED"
                      ? "bg-green-50 dark:bg-green-900/20"
                      : doc.status === "REJECTED"
                        ? "bg-red-50 dark:bg-red-900/20"
                        : "bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  {doc.name} - {doc.status}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LegDetails({
  leg,
  onClose,
}: {
  leg: TransportLeg;
  onClose: () => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold">Transport Leg {leg.sequence}</h4>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500">Mode</label>
          <p className="font-medium">{leg.mode}</p>
        </div>
        <div>
          <label className="text-xs text-gray-500">Distance</label>
          <p className="font-medium">{leg.distance.toFixed(1)} km</p>
        </div>
        <div>
          <label className="text-xs text-gray-500">Duration</label>
          <p className="font-medium">
            {leg.estimatedDuration.toFixed(1)} hours
          </p>
        </div>
        {leg.carrier && (
          <div>
            <label className="text-xs text-gray-500">Carrier</label>
            <p className="font-medium">{leg.carrier.name}</p>
          </div>
        )}
        {leg.vessel && (
          <div>
            <label className="text-xs text-gray-500">Vessel</label>
            <p className="font-medium">{leg.vessel.name}</p>
          </div>
        )}
        {leg.flight && (
          <div>
            <label className="text-xs text-gray-500">Flight</label>
            <p className="font-medium">
              {leg.flight.number} - {leg.flight.airline}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
