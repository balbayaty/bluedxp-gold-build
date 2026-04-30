/**
 * Marketplace Contracts Page
 * Contract management dashboard
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { FileText, Plus, Search, Filter, Download } from "lucide-react";
import type { MarketplaceContract } from "@/types/marketplace-contracts";

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<MarketplaceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadContracts();
  }, [statusFilter]);

  const loadContracts = async () => {
    try {
      const response = await fetch("/api/marketplace/contracts");
      const result = await response.json();
      if (result.success) {
        setContracts(result.data);
      }
    } catch (error) {
      console.error("Failed to load contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.contractNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: MarketplaceContract["status"]) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-700";
      case "PENDING_SIGNATURE":
        return "bg-yellow-100 text-yellow-700";
      case "SIGNED":
        return "bg-blue-100 text-blue-700";
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-purple-100 text-purple-700";
      case "TERMINATED":
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <PageTemplate
      title="Service Agreements"
      description="Manage service agreements and contracts"
      icon={FileText}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contracts..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_SIGNATURE">Pending Signature</option>
              <option value="SIGNED">Signed</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>

        {/* Contracts List */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No contracts found
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                onClick={() =>
                  router.push(`/marketplace/contracts/${contract.id}`)
                }
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {contract.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}
                      >
                        {contract.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Contract #{contract.contractNumber}
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">
                          Provider
                        </p>
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {contract.providerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">
                          Customer
                        </p>
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {contract.customerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">
                          Value
                        </p>
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {contract.totalValue.toLocaleString()}{" "}
                          {contract.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
