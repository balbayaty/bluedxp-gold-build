/**
 * ISO-IMS CAPA Management Page
 * Corrective and Preventive Actions Management
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
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiLink2,
} from "react-icons/fi";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import PageTemplate from "@/components/PageTemplate";

interface CAPA {
  id: string;
  capaNumber: string;
  subject: string;
  status: string;
  priority: string;
  capaType: string;
  assignedTo?: string;
  targetDate?: string;
  createdAt: string;
}

function CAPAPageContent() {
  const router = useRouter();
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    fetchCAPAs();
  }, [statusFilter, priorityFilter]);

  const fetchCAPAs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("tenantId", "default-tenant");
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      const response = await fetch(`/api/iso-ims/capa?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        let filtered = data.data || [];

        if (searchQuery) {
          filtered = filtered.filter(
            (capa: CAPA) =>
              capa.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
              capa.capaNumber.toLowerCase().includes(searchQuery.toLowerCase()),
          );
        }

        if (statusFilter !== "all") {
          filtered = filtered.filter(
            (capa: CAPA) => capa.status === statusFilter,
          );
        }

        if (priorityFilter !== "all") {
          filtered = filtered.filter(
            (capa: CAPA) => capa.priority === priorityFilter,
          );
        }

        setCapas(filtered);
      }
    } catch (error) {
      console.error("Error fetching CAPAs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
      IN_PROGRESS:
        "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400",
      COMPLETED:
        "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400",
      CLOSED:
        "from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-400",
    };
    return colors[status] || colors["OPEN"];
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
      HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
    return colors[priority] || colors["MEDIUM"];
  };

  return (
    <PageTemplate
      title="CAPA Management"
      description="Corrective and Preventive Actions • AI-Powered Insights • Real-time Tracking"
      icon="ri-check-double-line"
    >
      {/* Header Actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search CAPAs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <motion.button
            onClick={() => router.push("/iso-ims/capa/new")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <FiPlus className="w-5 h-5 relative z-10" />
            <span className="relative z-10">New CAPA</span>
          </motion.button>
        </div>
      </div>

      {/* CAPA Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <PremiumLoader message="Loading CAPAs..." size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {capas.map((capa, index) => (
              <motion.div
                key={capa.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => router.push(`/iso-ims/capa/${capa.id}`)}
                className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group"
              >
                {/* Animated gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${getStatusColor(capa.status)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {capa.subject}
                      </h3>
                      <p className="text-sm text-gray-400">{capa.capaNumber}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(capa.priority)}`}
                    >
                      {capa.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(capa.status)}`}
                    >
                      {capa.status.replace("_", " ")}
                    </span>
                    {capa.targetDate && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <FiClock className="w-4 h-4" />
                        <span>
                          {new Date(capa.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && capas.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <FiCheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No CAPAs found</p>
          <motion.button
            onClick={() => router.push("/iso-ims/capa/new")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium"
          >
            Create First CAPA
          </motion.button>
        </motion.div>
      )}
    </PageTemplate>
  );
}

export default function CAPAPage() {
  return (
    <ErrorBoundary>
      <CAPAPageContent />
    </ErrorBoundary>
  );
}
