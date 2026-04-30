/**
 * ISO-IMS NCR Management Page
 * Non-Conformance Reports Management
 * World-class UI/UX with glassmorphism and animations
 */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiAlertTriangle,
  FiClock,
  FiTrendingUp,
  FiLink2,
} from "react-icons/fi";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import PageTemplate from "@/components/PageTemplate";

interface NCR {
  id: string;
  ncrNumber: string;
  subject: string;
  status: string;
  priority: string;
  severity: string;
  ncType: string;
  reportedBy: string;
  reportedDate: string;
  assignedTo?: string;
}

function NCRPageContent() {
  const router = useRouter();
  const [ncrs, setNCRs] = useState<NCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    fetchNCRs();
  }, [statusFilter, severityFilter]);

  const fetchNCRs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("tenantId", "default-tenant");
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (severityFilter !== "all") params.append("severity", severityFilter);

      const response = await fetch(`/api/iso-ims/ncr?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        let filtered = data.data || [];

        if (searchQuery) {
          filtered = filtered.filter(
            (ncr: NCR) =>
              ncr.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ncr.ncrNumber.toLowerCase().includes(searchQuery.toLowerCase()),
          );
        }

        if (statusFilter !== "all") {
          filtered = filtered.filter((ncr: NCR) => ncr.status === statusFilter);
        }

        if (severityFilter !== "all") {
          filtered = filtered.filter(
            (ncr: NCR) => ncr.severity === severityFilter,
          );
        }

        setNCRs(filtered);
      }
    } catch (error) {
      console.error("Error fetching NCRs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400",
      HIGH: "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400",
      MEDIUM:
        "from-yellow-500/20 to-yellow-500/20 border-yellow-500/30 text-yellow-400",
      MINOR: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
    };
    return colors[severity] || colors["MEDIUM"];
  };

  return (
    <PageTemplate
      title="NCR Management"
      description="Non-Conformance Reports • Root Cause Analysis • AI-Powered Insights"
      icon="ri-alarm-warning-line"
    >
      {/* Header Actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search NCRs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="MINOR">Minor</option>
          </select>

          <motion.button
            onClick={() => router.push("/iso-ims/ncr/new")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <FiPlus className="w-5 h-5 relative z-10" />
            <span className="relative z-10">New NCR</span>
          </motion.button>
        </div>
      </div>

      {/* NCR Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <PremiumLoader message="Loading NCRs..." size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {ncrs.map((ncr, index) => (
              <motion.div
                key={ncr.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => router.push(`/iso-ims/ncr/${ncr.id}`)}
                className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-red-500/40 transition-all duration-300 cursor-pointer group"
              >
                {/* Animated gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${getSeverityColor(ncr.severity)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Pulse indicator for critical NCRs */}
                {ncr.severity === "CRITICAL" && (
                  <motion.div
                    className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {ncr.subject}
                      </h3>
                      <p className="text-sm text-gray-400">{ncr.ncrNumber}</p>
                    </div>
                    <FiAlertTriangle
                      className={`w-6 h-6 ${ncr.severity === "CRITICAL" ? "text-red-400" : ncr.severity === "HIGH" ? "text-orange-400" : "text-yellow-400"}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium border ${getSeverityColor(ncr.severity)}`}
                    >
                      {ncr.severity}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400">
                      <FiClock className="w-4 h-4" />
                      <span>
                        {new Date(ncr.reportedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && ncrs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <FiAlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No NCRs found</p>
          <motion.button
            onClick={() => router.push("/iso-ims/ncr/new")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium"
          >
            Create First NCR
          </motion.button>
        </motion.div>
      )}
    </PageTemplate>
  );
}

export default function NCRPage() {
  return (
    <ErrorBoundary>
      <NCRPageContent />
    </ErrorBoundary>
  );
}
