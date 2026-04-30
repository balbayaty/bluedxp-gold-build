/**
 * Civil Defense License Management Page
 * Manage Civil Defense licenses for chemical products
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface CivilDefenseLicense {
  id: string;
  licenseNumber: string;
  productName: string;
  productCategory: string;
  hazardClass: string;
  status:
    | "DRAFT"
    | "APPLIED"
    | "UNDER_REVIEW"
    | "INSPECTION_SCHEDULED"
    | "APPROVED"
    | "REJECTED"
    | "EXPIRED";
  appliedDate: string;
  expiryDate?: string;
  inspectionDate?: string;
  documents: string[];
}

export default function CivilDefensePage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<CivilDefenseLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/trade-compliance/licenses?type=CIVIL_DEFENSE_CHEMICAL",
      );
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

  const filteredLicenses = licenses.filter(
    (license) =>
      license.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.productName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/20 text-green-400";
      case "REJECTED":
      case "EXPIRED":
        return "bg-red-500/20 text-red-400";
      case "INSPECTION_SCHEDULED":
        return "bg-yellow-500/20 text-yellow-400";
      case "UNDER_REVIEW":
        return "bg-blue-500/20 text-blue-400";
      case "APPLIED":
        return "bg-blue-500/20 text-blue-400";
      case "DRAFT":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
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
                  Civil Defense Licenses
                </h1>
                <p className="text-[#9ca3af] text-sm sm:text-base leading-relaxed">
                  Manage Civil Defense licenses for chemical products and
                  hazardous materials
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
              <button
                onClick={() => router.push("/trade-compliance/licenses")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <i className="ri-file-add-line"></i>
                <span className="hidden sm:inline">Apply for License</span>
                <span className="sm:hidden">Apply</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 sm:mb-6 flex items-start gap-3"
        >
          <i className="ri-alert-line text-red-400 text-xl flex-shrink-0 mt-0.5"></i>
          <div className="text-sm text-red-400">
            <p className="font-medium mb-1">Civil Defense Requirements</p>
            <p>
              All chemical products imported to Saudi Arabia require Civil
              Defense license. Required documents include MSDS, Storage Plan,
              Safety Certificate, and Fire Safety Plan.
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6"
        >
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
        </motion.div>

        {/* Licenses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#9ca3af] text-sm">Loading licenses...</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="p-12 text-center">
              <i className="ri-shield-check-line mx-auto text-6xl text-[#6b7280] mb-4"></i>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Civil Defense licenses
              </h3>
              <p className="text-[#9ca3af] mb-6">
                {licenses.length === 0
                  ? "Apply for a Civil Defense license to import chemical products"
                  : "Try adjusting your search"}
              </p>
              {licenses.length === 0 && (
                <button
                  onClick={() => router.push("/trade-compliance/licenses")}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors text-sm font-medium"
                >
                  <i className="ri-file-add-line"></i>
                  Apply for License
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      License Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Hazard Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Documents
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredLicenses.map((license) => (
                    <tr
                      key={license.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {license.licenseNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-white">
                          {license.productName}
                        </div>
                        <div className="text-sm text-[#9ca3af]">
                          {license.productCategory}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded">
                          {license.hazardClass}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(license.status)}`}
                        >
                          {license.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#9ca3af]">
                        {new Date(license.appliedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#9ca3af]">
                        {license.expiryDate
                          ? new Date(license.expiryDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <i className="ri-file-text-line text-[#9ca3af]"></i>
                          <span className="text-sm text-white">
                            {license.documents.length} files
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
