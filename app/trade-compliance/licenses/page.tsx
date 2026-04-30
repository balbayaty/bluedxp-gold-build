/**
 * License Management Page
 * View and manage all trade compliance licenses
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface License {
  id: string;
  licenseNumber: string;
  licenseType:
    | "CIVIL_DEFENSE_CHEMICAL"
    | "SFDA_FOOD"
    | "SFDA_MEDICINE"
    | "SABER_CERTIFICATE"
    | "CUSTOMS_CLEARANCE"
    | "IMPORT_LICENSE"
    | "EXPORT_LICENSE";
  status:
    | "DRAFT"
    | "APPLIED"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "EXPIRED";
  productCategory: string;
  recordId?: string;
  appliedDate: string;
  expiryDate?: string;
  authority: string;
}

export default function LicenseManagementPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trade-compliance/licenses");
      const data = await response.json();

      if (data.success && data.licenses) {
        setLicenses(data.licenses);
      } else {
        setLicenses([]);
      }
    } catch (error) {
      console.error("Error loading licenses:", error);
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      license.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.productCategory.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || license.licenseType === typeFilter;
    const matchesStatus =
      statusFilter === "all" || license.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/20 text-green-400";
      case "REJECTED":
        return "bg-red-500/20 text-red-400";
      case "EXPIRED":
        return "bg-red-500/20 text-red-400";
      case "UNDER_REVIEW":
        return "bg-yellow-500/20 text-yellow-400";
      case "APPLIED":
        return "bg-blue-500/20 text-blue-400";
      case "DRAFT":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getLicenseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CIVIL_DEFENSE_CHEMICAL: "Civil Defense (Chemical)",
      SFDA_FOOD: "SFDA (Food)",
      SFDA_MEDICINE: "SFDA (Medicine)",
      SABER_CERTIFICATE: "SABER Certificate",
      CUSTOMS_CLEARANCE: "Customs Clearance",
      IMPORT_LICENSE: "Import License",
      EXPORT_LICENSE: "Export License",
    };
    return labels[type] || type;
  };

  const getLicenseIcon = (type: string) => {
    if (type.includes("CIVIL_DEFENSE"))
      return <i className="ri-shield-check-line text-xl text-red-400"></i>;
    if (type.includes("SFDA"))
      return <i className="ri-file-certificate-line text-xl text-blue-400"></i>;
    return <i className="ri-file-certificate-line text-xl text-cyan-400"></i>;
  };

  return (
    <div className="min-h-screen bg-[#111827] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Following UI/UX Standards */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0 mt-0.5">
                <i className="ri-shield-check-line text-white text-lg sm:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">
                  License Management
                </h1>
                <p className="text-[#9ca3af] text-sm sm:text-base leading-relaxed">
                  View and manage all trade compliance licenses and certificates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
              <button
                onClick={() => router.push("/trade-compliance/licenses/apply")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <i className="ri-file-add-line"></i>
                <span className="hidden sm:inline">Apply for License</span>
                <span className="sm:hidden">Apply</span>
              </button>
              <button
                onClick={() => router.push("/trade-compliance/civil-defense")}
                className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium hover:bg-white/10"
              >
                <i className="ri-shield-check-line"></i>
                Civil Defense
              </button>
              <button
                onClick={() => router.push("/trade-compliance/sfda")}
                className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium hover:bg-white/10"
              >
                <i className="ri-file-certificate-line"></i>
                SFDA
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]"></i>
              <input
                type="text"
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="CIVIL_DEFENSE_CHEMICAL">Civil Defense</option>
              <option value="SFDA_FOOD">SFDA Food</option>
              <option value="SFDA_MEDICINE">SFDA Medicine</option>
              <option value="SABER_CERTIFICATE">SABER</option>
              <option value="CUSTOMS_CLEARANCE">Customs</option>
              <option value="IMPORT_LICENSE">Import License</option>
              <option value="EXPORT_LICENSE">Export License</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="APPLIED">Applied</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </motion.div>

        {/* Licenses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            <div className="col-span-full p-12 text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#9ca3af] text-sm">Loading licenses...</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="col-span-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
              <i className="ri-file-certificate-line mx-auto text-6xl text-[#6b7280] mb-4 block"></i>
              <h3 className="text-xl font-semibold text-white mb-2">
                No licenses found
              </h3>
              <p className="text-[#9ca3af]">
                {licenses.length === 0
                  ? "Licenses will appear here once you create trade compliance records"
                  : "Try adjusting your filters to see more results"}
              </p>
            </div>
          ) : (
            filteredLicenses.map((license, index) => (
              <motion.div
                key={license.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getLicenseIcon(license.licenseType)}
                    <div>
                      <h3 className="font-semibold text-white">
                        {license.licenseNumber}
                      </h3>
                      <p className="text-sm text-[#9ca3af]">
                        {getLicenseTypeLabel(license.licenseType)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(license.status)}`}
                  >
                    {license.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[#9ca3af]">Authority:</span>
                    <span className="ml-2 text-white font-medium">
                      {license.authority}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Category:</span>
                    <span className="ml-2 text-white">
                      {license.productCategory}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Applied:</span>
                    <span className="ml-2 text-white">
                      {new Date(license.appliedDate).toLocaleDateString()}
                    </span>
                  </div>
                  {license.expiryDate && (
                    <div>
                      <span className="text-[#9ca3af]">Expires:</span>
                      <span
                        className={`ml-2 ${new Date(license.expiryDate) < new Date() ? "text-red-400 font-medium" : "text-white"}`}
                      >
                        {new Date(license.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {license.recordId && (
                  <button
                    onClick={() =>
                      router.push(
                        `/trade-compliance/records/${license.recordId}`,
                      )
                    }
                    className="mt-4 w-full text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    View Record →
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {filteredLicenses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">
                Total Licenses
              </div>
              <div className="text-2xl font-bold text-white">
                {filteredLicenses.length}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">Approved</div>
              <div className="text-2xl font-bold text-green-400">
                {filteredLicenses.filter((l) => l.status === "APPROVED").length}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">
                Under Review
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {
                  filteredLicenses.filter((l) => l.status === "UNDER_REVIEW")
                    .length
                }
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">Expired</div>
              <div className="text-2xl font-bold text-red-400">
                {filteredLicenses.filter((l) => l.status === "EXPIRED").length}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
