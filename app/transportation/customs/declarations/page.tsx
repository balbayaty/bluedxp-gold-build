/**
 * Customs Declarations Management
 *
 * Manage and track customs declarations
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { apiFetch } from "@/utils/apiFetch";

interface CustomsDeclaration {
  id: string;
  declarationNumber: string;
  shipmentId: string;
  shipmentNumber: string;
  status:
    | "PENDING"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "CLEARED"
    | "REJECTED"
    | "HELD";
  brokerId?: string;
  brokerName?: string;
  customsAuthority: string;
  customsOffice: string;
  hsCode: string;
  customsValue: number;
  duties: number;
  taxes: number;
  submittedDate?: Date | string;
  clearedDate?: Date | string;
  inspectionRequired: boolean;
  inspectionStatus?: "PENDING" | "PASSED" | "FAILED";
}

type ApiDeclaration = Record<string, any>;

export default function CustomsDeclarationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status"); // comma separated
  const [declarations, setDeclarations] = useState<CustomsDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeclaration, setSelectedDeclaration] =
    useState<CustomsDeclaration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch("/api/transportation/customs/declarations");
        const data = (await res.json()) as ApiDeclaration[];

        const mapped: CustomsDeclaration[] = (data || []).map((d) => ({
          id: String(d.id || d.declarationNumber || `CD-${Date.now()}`),
          declarationNumber: String(
            d.declarationNumber || d.declaration_number || d.id || "",
          ),
          shipmentId: String(d.shipmentId || d.shipment_id || ""),
          shipmentNumber: String(
            d.shipmentNumber || d.shipment_number || d.shipmentId || "",
          ),
          status: (d.status || "PENDING") as CustomsDeclaration["status"],
          brokerId: d.brokerId,
          brokerName: d.brokerName,
          customsAuthority: String(d.customsAuthority || "Customs Authority"),
          customsOffice: String(d.customsOffice || "Customs Office"),
          hsCode: String(d.hsCode || ""),
          customsValue: Number(d.customsValue || 0),
          duties: Number(d.duties || 0),
          taxes: Number(d.taxes || 0),
          submittedDate: d.submittedDate,
          clearedDate: d.clearedDate,
          inspectionRequired: Boolean(d.inspectionRequired),
          inspectionStatus: d.inspectionStatus,
        }));

        if (!mounted) return;
        setDeclarations(mapped);
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
  }, []);

  const filteredDeclarations = useMemo(() => {
    const list = declarations || [];
    if (!statusParam) return list;
    const allowed = new Set(
      statusParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    if (allowed.size === 0) return list;
    return list.filter((d) => allowed.has(d.status));
  }, [declarations, statusParam]);

  const statusColors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    UNDER_REVIEW:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    CLEARED:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    HELD: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  };

  const viewDetails = (declaration: CustomsDeclaration) => {
    setSelectedDeclaration(declaration);
    setShowDetailsModal(true);
  };

  return (
    <PageTemplate
      title="Customs Declarations"
      description="Manage and track customs declarations"
      icon="ri-file-text-line"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Failed to load declarations: {error}
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Declarations
            </div>
            <div className="text-2xl font-bold mt-1">{declarations.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Pending
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">
              {declarations.filter((d) => d.status === "PENDING").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Under Review
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {declarations.filter((d) => d.status === "UNDER_REVIEW").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Cleared
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {declarations.filter((d) => d.status === "CLEARED").length}
            </div>
          </div>
        </div>

        {/* Declarations Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Customs Declarations</h3>
              <button
                onClick={() =>
                  router.push("/transportation/customs/declarations/new")
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Declaration
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Declaration #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Shipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Broker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    HS Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Duties & Taxes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDeclarations.map((declaration) => (
                  <tr
                    key={declaration.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {declaration.declarationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {declaration.shipmentNumber}
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/shipments/${declaration.shipmentId}`)
                        }
                        className="text-xs text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      >
                        View Shipment
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {declaration.brokerName || "Not Assigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {declaration.hsCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {declaration.customsValue.toLocaleString()} SAR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        Duties: {declaration.duties.toLocaleString()} SAR
                      </div>
                      <div className="text-gray-500">
                        Taxes: {declaration.taxes.toLocaleString()} SAR
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[declaration.status]}`}
                      >
                        {declaration.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => viewDetails(declaration)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        View
                      </button>
                      {declaration.status === "PENDING" && (
                        <button
                          onClick={() =>
                            router.push(
                              `/transportation/customs/declarations/${declaration.id}/edit`,
                            )
                          }
                          className="text-green-600 hover:text-green-900 dark:text-green-400"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedDeclaration && (
          <Modal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            title={`Customs Declaration: ${selectedDeclaration.declarationNumber}`}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Shipment Number
                  </label>
                  <div className="mt-1">
                    {selectedDeclaration.shipmentNumber}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedDeclaration.status]}`}
                    >
                      {selectedDeclaration.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Broker
                  </label>
                  <div className="mt-1">
                    {selectedDeclaration.brokerName || "Not Assigned"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customs Office
                  </label>
                  <div className="mt-1">
                    {selectedDeclaration.customsOffice}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    HS Code
                  </label>
                  <div className="mt-1 font-mono">
                    {selectedDeclaration.hsCode}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customs Value
                  </label>
                  <div className="mt-1">
                    {selectedDeclaration.customsValue.toLocaleString()} SAR
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duties
                  </label>
                  <div className="mt-1">
                    {selectedDeclaration.duties.toLocaleString()} SAR
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Taxes
                  </label>
                  <div className="mt-1">
                    {selectedDeclaration.taxes.toLocaleString()} SAR
                  </div>
                </div>
                {selectedDeclaration.submittedDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Submitted Date
                    </label>
                    <div className="mt-1">
                      {new Date(
                        selectedDeclaration.submittedDate,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {selectedDeclaration.clearedDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cleared Date
                    </label>
                    <div className="mt-1">
                      {new Date(
                        selectedDeclaration.clearedDate,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
              {selectedDeclaration.inspectionRequired && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="font-medium text-yellow-800 dark:text-yellow-300">
                    Inspection Required
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Status: {selectedDeclaration.inspectionStatus || "PENDING"}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </PageTemplate>
  );
}
