/**
 * Transportation Quotes
 *
 * Enterprise: tenant-scoped data via hardened API gateway + persistence.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { apiFetch } from "@/utils/apiFetch";

type QuoteRow = {
  id: string;
  quoteNumber: string;
  shipmentId?: string;
  mode?: string;
  type?: string;
  currency?: string;
  charges?: { total?: number };
  status?: string;
  createdAt?: string;
};

export default function TransportationQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    originCity: "",
    destinationCity: "",
    mode: "LAND",
    type: "FTL",
    currency: "SAR",
    baseRate: 0,
    shipmentId: "",
  });

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/transportation/quotes?limit=200");
      const data = (await res.json()) as QuoteRow[];
      setQuotes(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalValue = useMemo(
    () => quotes.reduce((sum, q) => sum + Number(q.charges?.total || 0), 0),
    [quotes],
  );

  async function createQuote() {
    const body = {
      originCity: draft.originCity,
      destinationCity: draft.destinationCity,
      mode: draft.mode,
      type: draft.type,
      currency: draft.currency,
      baseRate: Number(draft.baseRate || 0),
      shipmentId: draft.shipmentId || undefined,
    };
    const res = await apiFetch("/api/transportation/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to create quote: ${res.status}`);
    setShowCreate(false);
    await load();
  }

  return (
    <PageTemplate
      title="Transportation Quotes"
      description="Create and manage tenant-scoped quotes"
      icon="ri-file-list-2-line"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Failed to load quotes: {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Quotes
              </div>
              <div className="text-2xl font-bold mt-1">{quotes.length}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Value
              </div>
              <div className="text-2xl font-bold mt-1">
                <CurrencyDisplay
                  amount={totalValue}
                  currency={quotes[0]?.currency || "SAR"}
                />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Latest
              </div>
              <div className="text-2xl font-bold mt-1">
                {quotes[0]?.quoteNumber || "-"}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Quote
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Quote #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Shipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Mode/Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {q.quoteNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {q.shipmentId ? (
                      <button
                        onClick={() =>
                          router.push(`/shipments/${q.shipmentId}`)
                        }
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      >
                        {q.shipmentId}
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {(q.mode || "-") + " / " + (q.type || "-")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CurrencyDisplay
                      amount={Number(q.charges?.total || 0)}
                      currency={q.currency || "SAR"}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {q.status || "-"}
                  </td>
                </tr>
              ))}
              {!loading && quotes.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    colSpan={5}
                  >
                    No quotes yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Quote"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Origin city"
              value={draft.originCity}
              onChange={(e) =>
                setDraft((d) => ({ ...d, originCity: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Destination city"
              value={draft.destinationCity}
              onChange={(e) =>
                setDraft((d) => ({ ...d, destinationCity: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Shipment ID (optional)"
              value={draft.shipmentId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, shipmentId: e.target.value }))
              }
            />
            <input
              type="number"
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Base rate"
              value={draft.baseRate}
              onChange={(e) =>
                setDraft((d) => ({ ...d, baseRate: Number(e.target.value) }))
              }
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded border border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                createQuote().catch((e) =>
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
