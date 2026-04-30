/**
 * Unified Performance Center
 * Evidence-backed KPI/SLA evaluation across customers/suppliers via Truth Engine.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Modal from "@/components/Modal";
import { useApiFetch } from "@/hooks/useApiFetch";
import type { TruthKPI, TruthEvidenceItem } from "@/types/truth-engine";

type KPIsResponse =
  | { success: true; kpis: TruthKPI[] }
  | { success: false; error: string; kpis?: TruthKPI[] };

type EvidenceResponse =
  | { success: true; evidence: TruthEvidenceItem[] }
  | { success: false; error: string; evidence?: TruthEvidenceItem[] };

function PerformanceCenterContent() {
  const [tenantId, setTenantId] = useState("default");
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedKpi, setSelectedKpi] = useState<TruthKPI | null>(null);
  const [evidence, setEvidence] = useState<TruthEvidenceItem[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const {
    data: kpis,
    loading,
    error,
    errorMessage,
    fetchData,
  } = useApiFetch<TruthKPI[]>({
    module: "performance",
    service: "kpis",
    retries: 1,
  });

  const loadKPIs = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("module", "performance");
    // Best-effort tenant scoping via tags in Truth Engine layer
    params.set("tenantId", tenantId);
    const res = await fetchData(`/api/truth-engine/kpis?${params.toString()}`);
    return res;
  }, [fetchData, tenantId]);

  useEffect(() => {
    loadKPIs().catch(() => {});
  }, [loadKPIs]);

  const bootstrap = async () => {
    await fetch("/api/performance-center/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tenantId }),
    });
    await loadKPIs();
  };

  const recalc = async (kpiId: string) => {
    const filters: Record<string, string> = {};
    if (tenantId) filters.tenantId = tenantId;
    if (customerId) filters.customerId = customerId;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    await fetch("/api/truth-engine/kpis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "calculate",
        kpiId,
        filters,
      }),
    });
    await loadKPIs();
  };

  const openEvidence = async (kpi: TruthKPI) => {
    setSelectedKpi(kpi);
    setEvidence([]);
    setEvidenceLoading(true);
    try {
      const res = await fetch(
        `/api/truth-engine/kpis?kpiId=${encodeURIComponent(kpi.id)}`,
        { credentials: "include" },
      );
      const json = (await res.json()) as EvidenceResponse;
      if (json.success) setEvidence(json.evidence || []);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const kpiList = useMemo(
    () => (kpis || []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [kpis],
  );

  const stats = [
    {
      label: "KPIs",
      value: String(kpiList.length),
      icon: "ri-dashboard-line",
      tooltip: "Registered performance KPIs",
      trend: "neutral" as const,
    },
    {
      label: "Tenant",
      value: tenantId,
      icon: "ri-building-line",
      tooltip: "Current tenant scope",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Performance Center"
      description="Evidence-backed KPI/SLA evaluation across customers, suppliers, and ecosystem modules (Truth Engine powered)."
      icon="ri-line-chart-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={bootstrap}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Bootstrap KPIs
          </button>
          <button
            onClick={() => loadKPIs()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
          >
            Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-filter-3-line text-cyan-400" />
            Filters (applied on recalculation)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-gray-400">Tenant</label>
              <input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="mt-1 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Customer ID</label>
              <input
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="optional"
                className="mt-1 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Warehouse ID</label>
              <input
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                placeholder="optional"
                className="mt-1 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Date From (ISO)</label>
              <input
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="2025-01-01"
                className="mt-1 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Date To (ISO)</label>
              <input
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="2025-12-31"
                className="mt-1 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-400">Loading KPIs…</span>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200">
            Failed to load KPIs: {errorMessage || "Unknown error"}
          </div>
        ) : kpiList.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <i className="ri-dashboard-line text-4xl text-gray-500 mb-3" />
            <div className="text-white font-semibold">
              No Performance KPIs registered yet
            </div>
            <div className="text-gray-400 text-sm mt-1">
              Click “Bootstrap KPIs” to create a default set.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {kpiList.map((kpi) => (
              <div
                key={kpi.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">
                      {kpi.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {kpi.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 font-mono truncate">
                      {kpi.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-cyan-300">
                      {typeof kpi.value === "number" ? kpi.value : 0}
                      {kpi.unit ? (
                        <span className="text-sm text-gray-300 ml-1">
                          {kpi.unit}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      status: {kpi.validationStatus}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => recalc(kpi.id)}
                    className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-sm transition-colors"
                  >
                    Recalculate
                  </button>
                  <button
                    onClick={() => openEvidence(kpi)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm transition-colors"
                  >
                    Evidence ({kpi.evidenceIds?.length || 0})
                  </button>
                </div>

                {kpi.validationIssues?.length ? (
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <div className="text-yellow-200 text-sm font-semibold mb-1">
                      Validation issues
                    </div>
                    <ul className="text-yellow-100/80 text-xs space-y-1 list-disc list-inside">
                      {kpi.validationIssues.slice(0, 5).map((x, idx) => (
                        <li key={idx}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedKpi}
        onClose={() => setSelectedKpi(null)}
        title={selectedKpi ? `Evidence — ${selectedKpi.name}` : "Evidence"}
        size="lg"
      >
        {evidenceLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-300">Loading evidence…</span>
          </div>
        ) : evidence.length === 0 ? (
          <div className="text-gray-300">
            No evidence items returned yet. This usually means the related
            TruthEvents haven’t been recorded (or evidence links are missing).
          </div>
        ) : (
          <div className="space-y-3">
            {evidence.map((e) => (
              <div
                key={e.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="text-white font-semibold">{e.title}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {e.sourceSystem}
                </div>
                <div className="text-xs text-gray-500 mt-2 font-mono break-all">
                  {e.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

export default function PerformanceCenterPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Performance Center"
          description="Evidence-backed KPI/SLA evaluation across customers, suppliers, and ecosystem modules (Truth Engine powered)."
          icon="ri-line-chart-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <PerformanceCenterContent />
    </ErrorBoundary>
  );
}
