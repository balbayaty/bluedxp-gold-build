/**
 * Truth Timeline Page
 * Unified view of all truth events for an entity with evidence drill-down
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  RiTimeLine,
  RiFileTextLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiEyeLine,
  RiDownloadLine,
} from "react-icons/ri";
import {
  TruthTimeline,
  TruthEvent,
  TruthEvidenceItem,
} from "@/types/truth-engine";

export default function TruthTimelinePage() {
  const params = useParams();
  const entityType = params.entityType as string;
  const entityId = params.entityId as string;

  const [timeline, setTimeline] = useState<TruthTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TruthEvent | null>(null);
  const [selectedEvidence, setSelectedEvidence] =
    useState<TruthEvidenceItem | null>(null);
  const [filters, setFilters] = useState({
    eventTypes: [] as string[],
    minConfidence: 0,
    includeDisputed: true,
  });

  useEffect(() => {
    loadTimeline();
  }, [entityType, entityId, filters]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/truth-engine/events?tenantId=default&entityType=${entityType}&entityId=${entityId}&minConfidence=${filters.minConfidence}&includeDisputed=${filters.includeDisputed}`,
      );
      const data = await response.json();
      if (data.success) {
        setTimeline(data.timeline);
      }
    } catch (error) {
      console.error("Error loading timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("approved") || eventType.includes("completed")) {
      return <RiCheckboxCircleLine className="text-green-500" />;
    } else if (eventType.includes("rejected") || eventType.includes("failed")) {
      return <RiCloseCircleLine className="text-red-500" />;
    } else if (
      eventType.includes("detected") ||
      eventType.includes("warning")
    ) {
      return <RiAlertLine className="text-yellow-500" />;
    }
    return <RiTimeLine className="text-blue-500" />;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return "text-green-500";
    if (score >= 0.7) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white">No timeline data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Truth Timeline</h1>
          <p className="text-gray-400">
            {entityType} • {entityId}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RiShieldCheckLine className="text-blue-500" />
              <span className="text-white">
                Confidence:{" "}
                <span className={getConfidenceColor(timeline.confidenceScore)}>
                  {(timeline.confidenceScore * 100).toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RiFileTextLine className="text-green-500" />
              <span className="text-white">
                {timeline.evidence.length} Evidence Items
              </span>
            </div>
            {timeline.gaps && timeline.gaps.length > 0 && (
              <div className="flex items-center gap-2">
                <RiAlertLine className="text-yellow-500" />
                <span className="text-yellow-500">
                  {timeline.gaps.length} Gaps Detected
                </span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {timeline.events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getEventIcon(event.eventType)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">
                        {event.eventType
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h3>
                      <span
                        className={`text-sm ${getConfidenceColor(event.confidenceScore)}`}
                      >
                        {(event.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      {new Date(event.happenedAt).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        Actor: {event.actor.name || event.actor.type}
                      </span>
                      <span className="text-gray-500">
                        Evidence: {event.evidenceLinks.length}
                      </span>
                    </div>
                    {event.businessImpact && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex gap-4 text-sm">
                          {event.businessImpact.financial && (
                            <span className="text-yellow-500">
                              Financial: {event.businessImpact.financial}
                            </span>
                          )}
                          {event.businessImpact.risk && (
                            <span
                              className={`${
                                event.businessImpact.risk === "CRITICAL"
                                  ? "text-red-500"
                                  : event.businessImpact.risk === "HIGH"
                                    ? "text-orange-500"
                                    : "text-yellow-500"
                              }`}
                            >
                              Risk: {event.businessImpact.risk}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sidebar - Evidence & Details */}
          <div className="space-y-4">
            {selectedEvent && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
              >
                <h3 className="text-white font-semibold mb-4">Event Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="text-white ml-2">
                      {selectedEvent.eventType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Happened:</span>
                    <span className="text-white ml-2">
                      {new Date(selectedEvent.happenedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Recorded:</span>
                    <span className="text-white ml-2">
                      {new Date(selectedEvent.recordedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence:</span>
                    <span
                      className={`ml-2 ${getConfidenceColor(selectedEvent.confidenceScore)}`}
                    >
                      {(selectedEvent.confidenceScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  {selectedEvent.confidenceReason && (
                    <div>
                      <span className="text-gray-500">Reason:</span>
                      <span className="text-white ml-2">
                        {selectedEvent.confidenceReason}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h4 className="text-white font-semibold mb-3">
                    Evidence ({selectedEvent.evidenceLinks.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedEvent.evidenceLinks.map((evidenceId) => {
                      const evidence = timeline.evidence.find(
                        (e) => e.id === evidenceId,
                      );
                      if (!evidence) return null;
                      return (
                        <div
                          key={evidenceId}
                          className="bg-gray-700/50 rounded p-3 cursor-pointer hover:bg-gray-700 transition-colors"
                          onClick={() => setSelectedEvidence(evidence)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm font-medium">
                                {evidence.title}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {evidence.type} • {evidence.sourceSystem}
                              </p>
                            </div>
                            <RiEyeLine className="text-gray-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {selectedEvidence && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Evidence Details</h3>
                  <button
                    onClick={() => setSelectedEvidence(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <RiCloseCircleLine />
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Title:</span>
                    <span className="text-white ml-2">
                      {selectedEvidence.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="text-white ml-2">
                      {selectedEvidence.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Source:</span>
                    <span className="text-white ml-2">
                      {selectedEvidence.sourceSystem}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Validation:</span>
                    <span
                      className={`ml-2 ${
                        selectedEvidence.validationState === "validated"
                          ? "text-green-500"
                          : selectedEvidence.validationState === "rejected"
                            ? "text-red-500"
                            : "text-yellow-500"
                      }`}
                    >
                      {selectedEvidence.validationState}
                    </span>
                  </div>
                  {selectedEvidence.fileUrl && (
                    <div className="mt-4">
                      <a
                        href={selectedEvidence.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-400"
                      >
                        <RiDownloadLine />
                        <span>Download Evidence</span>
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
