/**
 * Customs Management Dashboard
 *
 * Comprehensive customs clearance management including:
 * - Customs declarations
 * - Broker management
 * - Customs authority integration
 * - Document management
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ModuleLinks from "@/components/ModuleLinks";
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

export default function CustomsManagementPage() {
  const router = useRouter();
  const [declarations, setDeclarations] = useState<CustomsDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch("/api/transportation/customs/declarations");
        const data = (await res.json()) as any[];
        const mapped: CustomsDeclaration[] = (data || []).map((d) => ({
          id: String(d.id || d.declarationNumber || ""),
          declarationNumber: String(d.declarationNumber || d.id || ""),
          shipmentId: String(d.shipmentId || ""),
          shipmentNumber: String(d.shipmentNumber || d.shipmentId || ""),
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

  const stats = useMemo(
    () => ({
      total: declarations.length,
      pending: declarations.filter((d) => d.status === "PENDING").length,
      underReview: declarations.filter((d) => d.status === "UNDER_REVIEW")
        .length,
      cleared: declarations.filter((d) => d.status === "CLEARED").length,
      totalDuties: declarations.reduce((sum, d) => sum + d.duties, 0),
      totalTaxes: declarations.reduce((sum, d) => sum + d.taxes, 0),
    }),
    [declarations],
  );

  return (
    <PageTemplate
      title="Customs Management"
      description="Manage customs declarations, brokers, and clearance processes"
      icon="ri-passport-line"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Failed to load customs data: {error}
          </div>
        ) : null}
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Declarations
            </div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Pending
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">
              {stats.pending}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Under Review
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {stats.underReview}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Cleared
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {stats.cleared}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() =>
                router.push("/transportation/customs/declarations")
              }
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">Declarations</div>
              <div className="text-sm text-gray-500">View all declarations</div>
            </button>
            <button
              onClick={() => router.push("/transportation/customs/brokers")}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
            >
              <div className="text-2xl mb-2">👤</div>
              <div className="font-medium">Brokers</div>
              <div className="text-sm text-gray-500">Manage brokers</div>
            </button>
            <button
              onClick={() => router.push("/transportation/customs/authorities")}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🏛️</div>
              <div className="font-medium">Authorities</div>
              <div className="text-sm text-gray-500">Customs authorities</div>
            </button>
            <button
              onClick={() => router.push("/transportation/documents")}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium">Documents</div>
              <div className="text-sm text-gray-500">Customs documents</div>
            </button>
          </div>
        </div>

        {/* Recent Declarations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">
              Recent Customs Declarations
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Declaration #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Shipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Broker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    HS Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duties & Taxes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {declarations.map((declaration) => (
                  <tr
                    key={declaration.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">
                        {declaration.declarationNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {declaration.shipmentNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {declaration.brokerName || "Not Assigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[declaration.status]}`}
                      >
                        {declaration.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{declaration.hsCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        Duties: {declaration.duties.toLocaleString()} SAR
                        <br />
                        Taxes: {declaration.taxes.toLocaleString()} SAR
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() =>
                          router.push(
                            `/transportation/customs/declarations/${declaration.id}`,
                          )
                        }
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Duties
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stats.totalDuties.toLocaleString()} SAR
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Taxes
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.totalTaxes.toLocaleString()} SAR
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
