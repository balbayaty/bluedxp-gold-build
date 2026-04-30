/**
 * Transportation Dashboard
 *
 * Main dashboard for Global Transportation & Logistics Management System
 * Shows overview of all transportation operations
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ModuleLinks from "@/components/ModuleLinks";
import { getTransportationLinks } from "@/utils/transportationLinks";
import { apiFetch } from "@/utils/apiFetch";
import type { Shipment, Carrier } from "@/types/tms";
import { JobMonitor } from "@/components/jobs/JobMonitor";

interface TransportationStats {
  totalShipments: number;
  activeShipments: number;
  inTransit: number;
  customsClearance: number;
  delivered: number;
  onTimeDeliveryRate: number;
  averageTransitTime: number;
  totalFreightCost: number;
  modeDistribution: { mode: string; count: number; percentage: number }[];
  carrierPerformance: {
    carrier: string;
    shipments: number;
    onTimeRate: number;
  }[];
}

const TransportationCharts = dynamic(
  () => import("@/components/transportation/TransportationCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        Loading charts…
      </div>
    ),
  },
);

export default function TransportationDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<TransportationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [shipRes, carRes] = await Promise.all([
          apiFetch("/api/transportation/shipments?limit=500"),
          apiFetch("/api/transportation/carriers?limit=500"),
        ]);

        const shipments = (await shipRes.json()) as Shipment[];
        const carriers = (await carRes.json()) as Carrier[];

        const carrierNameById = new Map<string, string>();
        for (const c of Array.isArray(carriers) ? carriers : []) {
          carrierNameById.set(
            String((c as any).id),
            String((c as any).name || (c as any).code || (c as any).id),
          );
        }

        const all = Array.isArray(shipments) ? shipments : [];
        const totalShipments = all.length;

        const statusOf = (s: Shipment) =>
          String((s as any).status || "CREATED").toUpperCase();
        const modeOf = (s: Shipment) =>
          String((s as any).mode || "UNKNOWN").toUpperCase();

        const deliveredShipments = all.filter(
          (s) => statusOf(s) === "DELIVERED",
        );
        const inTransitShipments = all.filter(
          (s) => statusOf(s) === "IN_TRANSIT",
        );
        const customsShipments = all.filter((s) =>
          statusOf(s).includes("CUSTOMS"),
        );
        const activeShipments = all.filter(
          (s) => !["DELIVERED", "CANCELLED"].includes(statusOf(s)),
        );

        const onTimeEligible = all.filter(
          (s) => (s as any).estimatedDelivery && (s as any).actualDelivery,
        );
        const onTimeCount = onTimeEligible.filter((s) => {
          const est = new Date(String((s as any).estimatedDelivery));
          const act = new Date(String((s as any).actualDelivery));
          if (Number.isNaN(est.getTime()) || Number.isNaN(act.getTime()))
            return false;
          return act.getTime() <= est.getTime();
        }).length;
        const onTimeDeliveryRate =
          onTimeEligible.length > 0
            ? Number(((onTimeCount / onTimeEligible.length) * 100).toFixed(1))
            : 0;

        const transitEligible = all.filter(
          (s) => (s as any).pickupDate && (s as any).actualDelivery,
        );
        const transitTimes = transitEligible
          .map((s) => {
            const p = new Date(String((s as any).pickupDate));
            const a = new Date(String((s as any).actualDelivery));
            if (Number.isNaN(p.getTime()) || Number.isNaN(a.getTime()))
              return null;
            return Math.max(
              0,
              (a.getTime() - p.getTime()) / (1000 * 60 * 60 * 24),
            );
          })
          .filter((v): v is number => typeof v === "number");
        const averageTransitTime =
          transitTimes.length > 0
            ? Number(
                (
                  transitTimes.reduce((x, y) => x + y, 0) / transitTimes.length
                ).toFixed(1),
              )
            : 0;

        const totalFreightCost = all.reduce((sum, s) => {
          const fc =
            (s as any).freightCharges?.total ??
            (s as any).totalCost ??
            (s as any).cost;
          const n = Number(fc || 0);
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0);

        const modeCounts = new Map<string, number>();
        for (const s of all) {
          const m = modeOf(s);
          modeCounts.set(m, (modeCounts.get(m) || 0) + 1);
        }
        const modeDistribution = Array.from(modeCounts.entries()).map(
          ([mode, count]) => ({
            mode,
            count,
            percentage:
              totalShipments > 0
                ? Number(((count / totalShipments) * 100).toFixed(1))
                : 0,
          }),
        );

        const byCarrier = new Map<string, Shipment[]>();
        for (const s of all) {
          const cid = String((s as any).carrierId || "");
          if (!cid) continue;
          byCarrier.set(cid, [...(byCarrier.get(cid) || []), s]);
        }
        const carrierPerformance = Array.from(byCarrier.entries())
          .map(([carrierId, ss]) => {
            const eligible = ss.filter(
              (s) => (s as any).estimatedDelivery && (s as any).actualDelivery,
            );
            const onTime = eligible.filter((s) => {
              const est = new Date(String((s as any).estimatedDelivery));
              const act = new Date(String((s as any).actualDelivery));
              if (Number.isNaN(est.getTime()) || Number.isNaN(act.getTime()))
                return false;
              return act.getTime() <= est.getTime();
            }).length;
            const onTimeRate =
              eligible.length > 0
                ? Number(((onTime / eligible.length) * 100).toFixed(1))
                : 0;
            return {
              carrier: carrierNameById.get(carrierId) || carrierId,
              shipments: ss.length,
              onTimeRate,
            };
          })
          .sort((a, b) => b.shipments - a.shipments)
          .slice(0, 8);

        const next: TransportationStats = {
          totalShipments,
          activeShipments: activeShipments.length,
          inTransit: inTransitShipments.length,
          customsClearance: customsShipments.length,
          delivered: deliveredShipments.length,
          onTimeDeliveryRate,
          averageTransitTime,
          totalFreightCost: Math.round(totalFreightCost),
          modeDistribution,
          carrierPerformance,
        };

        if (!mounted) return;
        setStats(next);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : String(e));
        setStats(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageTemplate
      title="Transportation Dashboard"
      description="Global Transportation & Logistics Management System - Overview"
      icon="ri-truck-line"
      actions={
        <a
          href="/transportation/capabilities"
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm flex items-center gap-2"
        >
          <i className="ri-radar-line"></i>
          Capability Catalog
        </a>
      }
    >
      <div className="space-y-6">
        {loading && (
          <div className="text-white/70">Loading live Transportation KPIs…</div>
        )}
        {error && (
          <div className="text-red-300">Failed to load KPIs: {error}</div>
        )}
        {!loading && !error && !stats && (
          <div className="text-white/70">
            No data yet. Create a shipment to see KPIs.
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Shipments</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.totalShipments.toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl opacity-50">📦</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Shipments</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.activeShipments}
                  </p>
                </div>
                <div className="text-4xl opacity-50">🚚</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">On-Time Delivery</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.onTimeDeliveryRate}%
                  </p>
                </div>
                <div className="text-4xl opacity-50">✅</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Freight Cost</p>
                  <p className="text-3xl font-bold mt-1">
                    {(stats.totalFreightCost / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-purple-100 text-xs mt-1">SAR</p>
                </div>
                <div className="text-4xl opacity-50">💰</div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/jobs")}
              className="p-4 border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left relative"
            >
              <div className="absolute top-2 right-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                NEW
              </div>
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-medium">Background Jobs</div>
              <div className="text-sm text-gray-500">
                Monitor processing tasks
              </div>
            </button>
            <button
              onClick={() => router.push("/transportation/intelligent-routing")}
              className="p-4 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left relative"
            >
              <div className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                NEW
              </div>
              <div className="text-2xl mb-2">🧠</div>
              <div className="font-medium">Intelligent Routing</div>
              <div className="text-sm text-gray-500">Plan routes with AI</div>
            </button>
            <button
              onClick={() => router.push("/shipments")}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="font-medium">Shipments</div>
              <div className="text-sm text-gray-500">View all shipments</div>
            </button>
            <button
              onClick={() => router.push("/transportation/customs")}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🛂</div>
              <div className="font-medium">Customs</div>
              <div className="text-sm text-gray-500">Customs management</div>
            </button>
            <button
              onClick={() => router.push("/carriers")}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🚛</div>
              <div className="font-medium">Carriers</div>
              <div className="text-sm text-gray-500">Manage carriers</div>
            </button>
          </div>
        </div>

        {/* Charts + Status Overview (only when stats are loaded) */}
        {stats && (
          <>
            {/* Charts */}
            <TransportationCharts
              modeDistribution={stats.modeDistribution}
              carrierPerformance={stats.carrierPerformance}
              colors={COLORS}
            />

            {/* Status Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">
                Shipment Status Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.inTransit}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    In Transit
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.customsClearance}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Customs Clearance
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.delivered}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Delivered
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.averageTransitTime}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Avg Transit (days)
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Module Links */}
        <ModuleLinks links={getTransportationLinks()} />

        {/* Job Monitor for Transportation Module */}
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Background Jobs</h3>
              <p className="text-sm text-muted-foreground">
                Monitor and manage background processing tasks for
                transportation
              </p>
            </div>
            <button
              onClick={() => router.push("/jobs")}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>⚡</span>
              View All Jobs
            </button>
          </div>
          <JobMonitor moduleId="tms" maxJobs={5} floating={false} />
        </div>
      </div>
    </PageTemplate>
  );
}
