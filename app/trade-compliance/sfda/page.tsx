/**
 * SFDA License Management Page
 * Manage SFDA licenses for food and medicine products
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SFDALicense {
  id: string;
  licenseNumber: string;
  productName: string;
  licenseType: "FOOD" | "MEDICINE";
  productCategory: string;
  status:
    | "DRAFT"
    | "APPLIED"
    | "UNDER_REVIEW"
    | "TESTING"
    | "APPROVED"
    | "REJECTED"
    | "EXPIRED";
  appliedDate: string;
  expiryDate?: string;
  testResults?: string;
  documents: string[];
}

export default function SFDAPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<SFDALicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      // Load both SFDA_FOOD and SFDA_MEDICINE licenses
      const [foodResponse, medicineResponse] = await Promise.all([
        fetch("/api/trade-compliance/licenses?type=SFDA_FOOD"),
        fetch("/api/trade-compliance/licenses?type=SFDA_MEDICINE"),
      ]);

      const foodData = await foodResponse.json();
      const medicineData = await medicineResponse.json();

      const allLicenses = [
        ...(foodData.success
          ? foodData.licenses.map((l: any) => ({ ...l, licenseType: "FOOD" }))
          : []),
        ...(medicineData.success
          ? medicineData.licenses.map((l: any) => ({
              ...l,
              licenseType: "MEDICINE",
            }))
          : []),
      ];

      setLicenses(allLicenses);
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
      license.productName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || license.licenseType === typeFilter;

    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/20 text-green-400";
      case "REJECTED":
      case "EXPIRED":
        return "bg-red-500/20 text-red-400";
      case "TESTING":
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
                <i className="ri-file-certificate-line text-white text-lg sm:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">
                  SFDA Licenses
                </h1>
                <p className="text-[#9ca3af] text-sm sm:text-base leading-relaxed">
                  Manage SFDA (Saudi Food and Drug Authority) licenses for food
                  and medicine products
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
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 sm:mb-6 flex items-start gap-3"
        >
          <i className="ri-file-certificate-line text-blue-400 text-xl flex-shrink-0 mt-0.5"></i>
          <div className="text-sm text-blue-400">
            <p className="font-medium mb-1">SFDA Requirements</p>
            <p>
              Food and medicine products imported to Saudi Arabia require SFDA
              licenses. Required documents include Product Specification,
              Manufacturing Certificate, Certificate of Analysis, and Test
              Results.
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="FOOD">Food</option>
              <option value="MEDICINE">Medicine</option>
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
              <i className="ri-file-certificate-line mx-auto text-6xl text-[#6b7280] mb-4"></i>
              <h3 className="text-xl font-semibold text-white mb-2">
                No SFDA licenses
              </h3>
              <p className="text-[#9ca3af] mb-6">
                {licenses.length === 0
                  ? "Apply for an SFDA license to import food or medicine products"
                  : "Try adjusting your filters"}
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
                    {license.licenseType === "FOOD" ? (
                      <i className="ri-restaurant-line text-xl text-orange-400"></i>
                    ) : (
                      <i className="ri-medicine-bottle-line text-xl text-blue-400"></i>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">
                        {license.licenseNumber}
                      </h3>
                      <p className="text-sm text-[#9ca3af]">
                        {license.licenseType}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(license.status)}`}
                  >
                    {license.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <span className="text-[#9ca3af]">Product:</span>
                    <span className="ml-2 text-white font-medium">
                      {license.productName}
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
                  {license.testResults && (
                    <div>
                      <span className="text-[#9ca3af]">Test Results:</span>
                      <span className="ml-2 text-white">
                        {license.testResults}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-sm text-[#9ca3af]">
                    {license.documents.length} documents
                  </span>
                  <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                    View Details →
                  </button>
                </div>
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
              <div className="text-sm font-medium text-[#9ca3af]">Food</div>
              <div className="text-2xl font-bold text-orange-400">
                {
                  filteredLicenses.filter((l) => l.licenseType === "FOOD")
                    .length
                }
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">Medicine</div>
              <div className="text-2xl font-bold text-blue-400">
                {
                  filteredLicenses.filter((l) => l.licenseType === "MEDICINE")
                    .length
                }
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">Approved</div>
              <div className="text-2xl font-bold text-green-400">
                {filteredLicenses.filter((l) => l.status === "APPROVED").length}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
