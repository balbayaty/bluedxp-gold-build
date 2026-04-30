/**
 * Customs Authorities
 *
 * Eliminates demo/mock lists by using tenant-scoped APIs:
 * - GET/POST `/api/transportation/customs/authorities`
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { apiFetch } from "@/utils/apiFetch";
import type { CustomsAuthority } from "@/types/tms";

export default function CustomsAuthoritiesPage() {
  const [items, setItems] = useState<CustomsAuthority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("ALL");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    code: "",
    name: "",
    country: "",
    region: "",
    timezone: "",
    workingHours: "",
    requirements: "",
  });

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(
        "/api/transportation/customs/authorities?limit=200",
      );
      if (!res.ok)
        throw new Error(`Failed to load authorities (${res.status})`);
      const data = (await res.json()) as CustomsAuthority[];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const countries = useMemo(
    () =>
      Array.from(new Set(items.map((a) => a.country).filter(Boolean))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((a) => {
      if (country !== "ALL" && a.country !== country) return false;
      if (status !== "ALL" && a.status !== status) return false;
      if (!query) return true;
      const hay = [a.code, a.name, a.country, a.region, a.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [country, items, q, status]);

  async function createAuthority() {
    const requirements = draft.requirements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await apiFetch("/api/transportation/customs/authorities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: draft.code,
        name: draft.name,
        country: draft.country,
        region: draft.region || undefined,
        timezone: draft.timezone || undefined,
        workingHours: draft.workingHours || undefined,
        requirements,
        offices: [],
        status: "ACTIVE",
      }),
    });
    if (!res.ok) throw new Error(`Failed to create authority (${res.status})`);
    setShowCreate(false);
    setDraft({
      code: "",
      name: "",
      country: "",
      region: "",
      timezone: "",
      workingHours: "",
      requirements: "",
    });
    await load();
  }

  return (
    <PageTemplate
      title="Customs Authorities"
      description="Tenant-scoped customs authorities with requirements and audit trails"
      icon="ri-government-line"
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
              placeholder="Search authorities…"
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="ALL">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="px-4 py-2 rounded border border-gray-200 dark:border-gray-700 text-sm"
              href="/transportation/customs"
            >
              Back to Customs
            </Link>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Add Authority
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Requirements
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-gray-500" colSpan={5}>
                    No authorities yet. Add one to standardize required
                    documents and clearance workflows.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 font-mono text-xs">{a.code}</td>
                    <td className="px-6 py-4 text-sm">{a.name}</td>
                    <td className="px-6 py-4 text-sm">{a.country}</td>
                    <td className="px-6 py-4 text-sm">{a.status}</td>
                    <td className="px-6 py-4 text-sm">
                      {a.requirements?.length || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Customs Authority"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Code (e.g. SA-CUSTOMS)"
              value={draft.code}
              onChange={(e) =>
                setDraft((d) => ({ ...d, code: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Name"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Country"
              value={draft.country}
              onChange={(e) =>
                setDraft((d) => ({ ...d, country: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Region (optional)"
              value={draft.region}
              onChange={(e) =>
                setDraft((d) => ({ ...d, region: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Timezone (optional)"
              value={draft.timezone}
              onChange={(e) =>
                setDraft((d) => ({ ...d, timezone: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Working hours (optional)"
              value={draft.workingHours}
              onChange={(e) =>
                setDraft((d) => ({ ...d, workingHours: e.target.value }))
              }
            />
          </div>
          <textarea
            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            rows={4}
            placeholder={
              "Requirements (one per line)\n- Commercial Invoice\n- Packing List\n- Certificate of Origin"
            }
            value={draft.requirements}
            onChange={(e) =>
              setDraft((d) => ({ ...d, requirements: e.target.value }))
            }
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded border border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                createAuthority().catch((e) =>
                  setError(e instanceof Error ? e.message : String(e)),
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
