/**
 * Transportation Payments
 *
 * Enterprise: tenant-scoped payment records via hardened API gateway + persistence.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { apiFetch } from "@/utils/apiFetch";

type PaymentRecord = {
  id: string;
  invoiceId?: string;
  shipmentId?: string;
  carrierId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
};

export default function TransportationPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProcess, setShowProcess] = useState(false);
  const [draft, setDraft] = useState({
    invoiceId: "",
    shipmentId: "",
    carrierId: "",
    amount: 0,
    currency: "SAR",
  });

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(
        "/api/transportation/payments?action=records&limit=200",
      );
      const data = (await res.json()) as PaymentRecord[];
      setPayments(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments],
  );
  const currency = payments[0]?.currency || draft.currency || "SAR";

  async function processPayment() {
    const res = await apiFetch("/api/transportation/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: draft.invoiceId,
        shipmentId: draft.shipmentId,
        carrierId: draft.carrierId,
        amount: Number(draft.amount || 0),
        currency: draft.currency,
      }),
    });
    if (!res.ok) throw new Error(`Failed to process payment: ${res.status}`);
    setShowProcess(false);
    await load();
  }

  return (
    <PageTemplate
      title="Transportation Payments"
      description="Process and audit tenant-scoped payment records"
      icon="ri-bank-card-line"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Failed to load payments: {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Payments
              </div>
              <div className="text-2xl font-bold mt-1">{payments.length}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Paid/Processed
              </div>
              <div className="text-2xl font-bold mt-1">
                <CurrencyDisplay amount={total} currency={currency} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Latest Payment
              </div>
              <div className="text-2xl font-bold mt-1">
                {payments[0]?.id || "-"}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowProcess(true)}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Process Payment
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Payment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Shipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Carrier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {p.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.invoiceId || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.shipmentId || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.carrierId || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CurrencyDisplay
                      amount={Number(p.amount || 0)}
                      currency={p.currency || currency}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {p.status || "-"}
                  </td>
                </tr>
              ))}
              {!loading && payments.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    colSpan={6}
                  >
                    No payment records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showProcess}
        onClose={() => setShowProcess(false)}
        title="Process Payment"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Invoice ID"
              value={draft.invoiceId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, invoiceId: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Shipment ID"
              value={draft.shipmentId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, shipmentId: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Carrier ID"
              value={draft.carrierId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, carrierId: e.target.value }))
              }
            />
            <input
              type="number"
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Amount"
              value={draft.amount}
              onChange={(e) =>
                setDraft((d) => ({ ...d, amount: Number(e.target.value) }))
              }
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowProcess(false)}
              className="px-4 py-2 rounded border border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                processPayment().catch((e) =>
                  setError(e instanceof Error ? e.message : String(e)),
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Process
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
