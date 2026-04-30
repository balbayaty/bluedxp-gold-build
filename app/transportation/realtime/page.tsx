/**
 * Real-Time Updates
 *
 * Auto-generated page for /transportation/realtime
 * Module: tms
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { apiFetch } from "@/utils/apiFetch";
import { PremiumLoader } from "@/components/loading";

function TransportationRealtimePageContent() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Array<any>>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch("/api/transportation/tracking?limit=200");
        if (!res.ok) throw new Error(`Failed to load tracking (${res.status})`);
        const data = (await res.json()) as any[];
        if (!mounted) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : String(e));
        setRows([]);
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

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((r) => {
      const hay = [
        r.trackingNumber,
        r.shipmentNumber,
        r.customerName,
        r.carrierName,
        r.status,
        r.origin,
        r.destination,
        r.vehicleNumber,
        r.driverName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [q, rows]);

  if (loading) {
    return (
      <PageTemplate
        title="Real-Time Updates"
        description="Live internal tracking view (no fake telemetry in production)"
        icon="ri-pulse-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading real-time tracking data..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Real-Time Updates"
      description="Live internal tracking view (tenant-scoped). Use the Tracking API to update locations."
      icon="ri-pulse-line"
      actions={
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tracking…"
            className="w-[260px] max-w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-cyan-500/50"
          />
          <a
            href="/transportation/capabilities"
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm"
          >
            Capability Catalog
          </a>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="text-red-300">Failed to load tracking: {error}</div>
        )}

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
          <div className="text-sm text-white/70">
            Showing{" "}
            <span className="text-white font-semibold">{filtered.length}</span>{" "}
            shipments.
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-left text-white/70">
                  <th className="p-3">Tracking</th>
                  <th className="p-3">Shipment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Carrier</th>
                  <th className="p-3">Origin → Destination</th>
                  <th className="p-3">Location (lat,lng)</th>
                  <th className="p-3">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={String(r.id)}
                    className="border-t border-white/10 text-white/90"
                  >
                    <td className="p-3">{r.trackingNumber || ""}</td>
                    <td className="p-3">{r.shipmentNumber || ""}</td>
                    <td className="p-3">{r.status || ""}</td>
                    <td className="p-3">
                      {r.carrierName || r.carrierCode || ""}
                    </td>
                    <td className="p-3">
                      <span className="text-white/80">{r.origin}</span> →{" "}
                      <span className="text-white/80">{r.destination}</span>
                    </td>
                    <td className="p-3">
                      {Number(r.currentLocation?.lat || 0).toFixed(4)},
                      {Number(r.currentLocation?.lng || 0).toFixed(4)}
                    </td>
                    <td className="p-3">{r.lastUpdate || ""}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-6 text-white/70" colSpan={7}>
                      No tracking records yet. Create a shipment, then update
                      its location via `POST /api/transportation/tracking`.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function TransportationRealtimePagePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Real-Time Updates"
          description="Real-Time Updates - tms module"
          icon="ri-time-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationRealtimePageContent />
    </ErrorBoundary>
  );
}
