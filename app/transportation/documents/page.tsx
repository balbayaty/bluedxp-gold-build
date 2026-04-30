/**
 * Transport Documents
 *
 * Replaces any demo/mock document arrays with tenant-scoped API persistence:
 * - GET/POST `/api/transportation/documents`
 * - Evidence + events emitted on create/update
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { apiFetch } from "@/utils/apiFetch";
import type { ShipmentDocument } from "@/types/tms";

export default function TransportDocumentsPage() {
  const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");

  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    shipmentId: "",
    type: "BILL_OF_LADING",
    name: "",
    fileUrl: "",
  });

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/transportation/documents?limit=200");
      if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
      const data = (await res.json()) as ShipmentDocument[];
      setDocuments(Array.isArray(data) ? data : []);
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
    return documents.filter((d) => {
      if (type !== "ALL" && d.type !== type) return false;
      if (status !== "ALL" && d.status !== status) return false;
      if (!query) return true;
      const hay = [d.id, d.shipmentId, d.type, d.name, d.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [documents, q, status, type]);

  async function createDocument() {
    const res = await apiFetch("/api/transportation/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipmentId: draft.shipmentId,
        type: draft.type,
        name: draft.name,
        fileUrl: draft.fileUrl,
      }),
    });
    if (!res.ok) throw new Error(`Failed to create document (${res.status})`);
    setShowCreate(false);
    setDraft({ shipmentId: "", type: "BILL_OF_LADING", name: "", fileUrl: "" });
    await load();
  }

  return (
    <PageTemplate
      title="Transport Documents"
      description="Tenant-scoped transportation documents (BOL/AWB/CMR/customs/insurance/certificates) with evidence + audit events"
      icon="ri-file-list-3-line"
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
              placeholder="Search documents…"
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="BILL_OF_LADING">Bill of Lading</option>
              <option value="AIRWAY_BILL">Airway Bill</option>
              <option value="CMR">CMR</option>
              <option value="COMMERCIAL_INVOICE">Commercial Invoice</option>
              <option value="PACKING_LIST">Packing List</option>
              <option value="CERTIFICATE_OF_ORIGIN">
                Certificate of Origin
              </option>
              <option value="CUSTOMS_DECLARATION">Customs Declaration</option>
              <option value="INSURANCE_CERTIFICATE">
                Insurance Certificate
              </option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="px-4 py-2 rounded border border-gray-200 dark:border-gray-700 text-sm"
              href="/transportation/documents/enterprise"
            >
              Enterprise Docs
            </Link>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Upload Document
            </button>
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
                  Shipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Link
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-gray-500" colSpan={6}>
                    No documents yet. Upload one to attach it to a shipment and
                    generate an audit trail.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 font-mono text-xs">{d.id}</td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {d.shipmentId}
                    </td>
                    <td className="px-6 py-4 text-sm">{d.name}</td>
                    <td className="px-6 py-4 text-sm">{d.type}</td>
                    <td className="px-6 py-4 text-sm">{d.status}</td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
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
        title="Upload Transport Document"
      >
        <div className="space-y-4">
          <input
            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            placeholder="Shipment ID (required)"
            value={draft.shipmentId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, shipmentId: e.target.value }))
            }
          />
          <select
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="BILL_OF_LADING">Bill of Lading</option>
            <option value="AIRWAY_BILL">Airway Bill</option>
            <option value="CMR">CMR</option>
            <option value="COMMERCIAL_INVOICE">Commercial Invoice</option>
            <option value="PACKING_LIST">Packing List</option>
            <option value="CERTIFICATE_OF_ORIGIN">Certificate of Origin</option>
            <option value="CUSTOMS_DECLARATION">Customs Declaration</option>
            <option value="INSURANCE_CERTIFICATE">Insurance Certificate</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            placeholder="Document name/title"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <input
            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            placeholder="File URL (for now we store a URL; later we can add direct uploads)"
            value={draft.fileUrl}
            onChange={(e) =>
              setDraft((d) => ({ ...d, fileUrl: e.target.value }))
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
                createDocument().catch((e) =>
                  setError(e instanceof Error ? e.message : String(e)),
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Upload
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
