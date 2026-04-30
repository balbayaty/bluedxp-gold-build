/**
 * Carriers Management
 *
 * Manage carriers and their services
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { apiFetch } from "@/utils/apiFetch";
import type { Carrier } from "@/types/tms";

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    code: "",
    type: "LAND",
    email: "",
    phone: "",
    website: "",
    serviceTypes: "",
  });

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/transportation/carriers?limit=500");
      if (!res.ok) throw new Error(`Failed to load carriers (${res.status})`);
      const data = (await res.json()) as Carrier[];
      setCarriers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return carriers;
    return carriers.filter((c) => {
      const hay = [
        c.id,
        c.name,
        c.code,
        c.type,
        c.status,
        ...(c.serviceTypes || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [carriers, q]);

  async function createCarrier() {
    const res = await apiFetch("/api/transportation/carriers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        code: draft.code,
        type: draft.type,
        email: draft.email,
        phone: draft.phone,
        website: draft.website || undefined,
        serviceTypes: draft.serviceTypes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    if (!res.ok) throw new Error(`Failed to create carrier (${res.status})`);
    setShowCreate(false);
    setDraft({
      name: "",
      code: "",
      type: "LAND",
      email: "",
      phone: "",
      website: "",
      serviceTypes: "",
    });
    await load();
  }

  const typeIcons: Record<string, string> = {
    SEA: "🚢",
    AIR: "✈️",
    LAND: "🚛",
    RAIL: "🚂",
    MULTIMODAL: "🚚",
  };

  return (
    <PageTemplate
      title="Carriers Management"
      description="Tenant-scoped carrier master data (connectivity-ready for carrier API integrations)"
      icon="ri-truck-fill"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Carriers
            </div>
            <div className="text-2xl font-bold mt-1">{carriers.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Carriers
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {carriers.filter((c) => c.status === "ACTIVE").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg On-Time Rate
            </div>
            <div className="text-2xl font-bold mt-1">
              {carriers.length
                ? `${(carriers.reduce((sum, c) => sum + (c.rating || 0), 0) / carriers.length).toFixed(2)} / 5`
                : "—"}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Coverage
            </div>
            <div className="text-2xl font-bold mt-1">
              {carriers.length ? "Configured" : "—"}
            </div>
          </div>
        </div>

        {/* Carriers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Carriers</h3>
              <div className="flex items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search carriers…"
                  className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                />
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Carrier
                </button>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading carriers…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">
                No carriers found. Add one to start building a reusable carrier
                master list for this tenant.
              </div>
            ) : (
              filtered.map((carrier) => (
                <motion.div
                  key={carrier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">
                        {typeIcons[String(carrier.type)] || "🚚"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold">
                            {carrier.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              carrier.status === "ACTIVE"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {carrier.status}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-medium">
                              {(carrier.rating || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Type:
                            </span>{" "}
                            <span className="font-medium">{carrier.type}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Email:
                            </span>{" "}
                            <span className="font-medium">
                              {carrier.email || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Phone:
                            </span>{" "}
                            <span className="font-medium">
                              {carrier.phone || "—"}
                            </span>
                          </div>
                          {carrier.website && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                Website:
                              </span>{" "}
                              <a
                                href={`https://${carrier.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {carrier.website}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Services */}
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-2">
                            Services
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(carrier.serviceTypes || []).map(
                              (service, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded"
                                >
                                  {service}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Carrier"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Name
              </label>
              <input
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Code
              </label>
              <input
                value={draft.code}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, code: e.target.value }))
                }
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Type
              </label>
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, type: e.target.value }))
                }
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              >
                <option value="LAND">Land</option>
                <option value="SEA">Sea</option>
                <option value="AIR">Air</option>
                <option value="RAIL">Rail</option>
                <option value="MULTIMODAL">Multimodal</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Service types (comma-separated)
              </label>
              <input
                value={draft.serviceTypes}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, serviceTypes: e.target.value }))
                }
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Email
              </label>
              <input
                value={draft.email}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, email: e.target.value }))
                }
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Phone
              </label>
              <input
                value={draft.phone}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, phone: e.target.value }))
                }
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Website (optional)
              </label>
              <input
                value={draft.website}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, website: e.target.value }))
                }
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded border border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => void createCarrier()}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              disabled={!draft.name.trim() || !draft.code.trim()}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
