/**
 * Transportation Incidents
 *
 * Operational queue created from Control Tower risks and human entries.
 * Tenant-scoped via API + apiFetch headers.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import { apiFetch } from "@/utils/apiFetch";

type Incident = {
  id: string;
  riskId?: string;
  title?: string;
  description?: string;
  status?: string;
  severity?: string;
  priority?: string;
  workflowId?: string;
  executionId?: string;
  evidencePacketId?: string;
  evidenceId?: string;
  incidentEvidenceId?: string;
  createdAt?: string;
  createdBy?: string;
};

export default function TransportationIncidentsPage() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("ALL");
  const [severity, setSeverity] = useState<string>("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (status !== "ALL") params.set("status", status);
        if (severity !== "ALL") params.set("severity", severity);
        const url = `/api/transportation/incidents${params.toString() ? `?${params}` : ""}`;
        const res = await apiFetch(url);
        if (!res.ok)
          throw new Error(`Failed to load incidents (${res.status})`);
        const data = (await res.json()) as Incident[];
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [status, severity]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((i) => {
      const hay = [
        i.id,
        i.riskId,
        i.title,
        i.description,
        i.status,
        i.severity,
        i.priority,
        i.evidenceId,
        i.workflowId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [items, q]);

  return (
    <PageTemplate
      title="Transportation Incidents"
      description="Operational incident queue (Control Tower + manual) with workflow + evidence links"
      icon="ri-alarm-warning-line"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : null}

        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search incidents…"
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="ALL">All Severity</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {loading ? "Loading…" : `${filtered.length} incident(s)`}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Severity / Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Workflow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Evidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                    No incidents yet. Create them from the Control Tower risks.
                  </td>
                </tr>
              ) : (
                filtered.map((i) => (
                  <tr
                    key={i.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 font-mono text-xs">{i.id}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold">
                        {i.title || i.riskId || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {i.description || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{i.status || "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>{i.severity || "—"}</div>
                      <div className="text-xs text-gray-500">
                        {i.priority || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {i.workflowId ? (
                        <Link
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          href={`/process-lifecycle/workflows/${i.workflowId}`}
                        >
                          Open
                        </Link>
                      ) : (
                        "—"
                      )}
                      {i.executionId ? (
                        <div className="font-mono text-xs text-gray-500 mt-1">
                          {i.executionId}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {i.evidenceId ? (
                        <div className="font-mono text-xs">{i.evidenceId}</div>
                      ) : (
                        "—"
                      )}
                      {i.evidencePacketId ? (
                        <div className="font-mono text-xs text-gray-500">
                          {i.evidencePacketId}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageTemplate>
  );
}
