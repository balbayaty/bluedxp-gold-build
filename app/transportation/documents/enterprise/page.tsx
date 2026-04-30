/**
 * Enterprise Documents
 *
 * This page shows documents that were synced/imported from external repositories
 * (SharePoint/Documentum/FileNet/custom), represented by `integrationSource`.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import { apiFetch } from "@/utils/apiFetch";
import type { ShipmentDocument } from "@/types/tms";

export default function EnterpriseDocumentsPage() {
  const [docs, setDocs] = useState<ShipmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [source, setSource] = useState<string>("ALL");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/transportation/documents?limit=500");
      if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
      const data = (await res.json()) as ShipmentDocument[];
      const all = Array.isArray(data) ? data : [];
      setDocs(all.filter((d) => Boolean(d.integrationSource)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sources = useMemo(
    () =>
      Array.from(
        new Set(
          docs.map((d) => d.integrationSource).filter(Boolean) as string[],
        ),
      ),
    [docs],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (source !== "ALL" && d.integrationSource !== source) return false;
      if (!query) return true;
      const hay = [
        d.id,
        d.shipmentId,
        d.name,
        d.type,
        d.integrationSource,
        d.externalId,
        d.externalUrl,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [docs, q, source]);

  return (
    <PageTemplate
      title="Enterprise Documents"
      description="Documents synced/imported from external repositories (SharePoint/Documentum/FileNet/custom)"
      icon="ri-folder-2-line"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : null}

        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search enterprise documents…"
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="ALL">All Sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="px-4 py-2 rounded border border-gray-200 dark:border-gray-700 text-sm"
              href="/transportation/documents"
            >
              Back to Documents
            </Link>
            <Link
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              href="/transportation/integration"
            >
              Configure Integrations
            </Link>
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
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  External
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-gray-500" colSpan={5}>
                    No enterprise documents yet. Configure an integration and
                    import/sync documents into the tenant.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 font-mono text-xs">{d.id}</td>
                    <td className="px-6 py-4 text-sm">{d.integrationSource}</td>
                    <td className="px-6 py-4 text-sm">{d.name}</td>
                    <td className="px-6 py-4 text-sm">{d.type}</td>
                    <td className="px-6 py-4 text-sm">
                      {d.externalUrl ? (
                        <a
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          href={d.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open external
                        </a>
                      ) : (
                        d.externalId || "—"
                      )}
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
