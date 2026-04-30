/**
 * Warehouse Truth Engine View Component
 * Evidence and lineage visualization
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { TruthEvent, TruthTimeline, TruthKPI } from "@/types/truth-engine";

interface WarehouseTruthViewProps {
  warehouseId: string;
}

export default function WarehouseTruthView({
  warehouseId,
}: WarehouseTruthViewProps) {
  const [events, setEvents] = useState<TruthEvent[]>([]);
  const [timeline, setTimeline] = useState<TruthTimeline | null>(null);
  const [kpis, setKpis] = useState<TruthKPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTruthData();
  }, [warehouseId]);

  const loadTruthData = async () => {
    setIsLoading(true);
    try {
      // NOTE: Truth Engine API currently requires tenantId; use default here (matches other dashboards).
      const tenantId = "default";

      const dateFrom = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const dateTo = new Date().toISOString();

      const [timelineRes, kpiRes] = await Promise.all([
        fetch(
          `/api/truth-engine/events?tenantId=${encodeURIComponent(tenantId)}&entityType=warehouse&entityId=${encodeURIComponent(warehouseId)}&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`,
        ),
        fetch(
          `/api/truth-engine/kpis?tenantId=${encodeURIComponent(tenantId)}&module=warehouse`,
        ),
      ]);

      const timelineJson = await timelineRes.json();
      if (!timelineRes.ok || !timelineJson?.success) {
        throw new Error(timelineJson?.error || "Failed to load truth timeline");
      }
      const timelineData = timelineJson.timeline as TruthTimeline;
      setTimeline(timelineData);
      setEvents((timelineData?.events || []) as TruthEvent[]);

      const kpiJson = await kpiRes.json();
      if (kpiRes.ok && kpiJson?.success) {
        setKpis((kpiJson.kpis || []) as TruthKPI[]);
      } else {
        setKpis([]);
      }
    } catch (error) {
      console.error("Error loading truth data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {kpis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <i className="ri-shield-check-line mr-3 text-cyan-400"></i>
            Truth Engine - Evidence & Lineage
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpis.slice(0, 3).map((kpi) => (
              <div
                key={kpi.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <p className="text-sm text-gray-400 mb-1">{kpi.name}</p>
                <p className="text-2xl font-bold text-white">
                  {kpi.value.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{kpi.unit || ""}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      {timeline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-time-line mr-2 text-blue-400"></i>
            Timeline
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {timeline.events.slice(0, 20).map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm font-medium">
                    {event.title}
                  </p>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      event.confidence >= 0.8
                        ? "bg-green-500/20 text-green-400"
                        : event.confidence >= 0.6
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {(event.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <i className="ri-file-list-3-line mr-2 text-purple-400"></i>
          Recent Truth Events
        </h3>
        <div className="space-y-2">
          {events.slice(0, 10).map((event) => (
            <div
              key={event.id}
              className="p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{event.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{event.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Confidence</p>
                  <p className="text-white font-medium">
                    {(event.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
