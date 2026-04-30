/**
 * ISO-IMS Training Management Page
 * Employee Training & Competence Records
 * World-class UI/UX with glassmorphism and animations
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiSearch,
  FiUsers,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import PageTemplate from "@/components/PageTemplate";

interface Training {
  id: string;
  programName: string;
  employeeName: string;
  status: string;
  completionDate?: string;
  expiryDate?: string;
  progress: number;
}

function TrainingPageContent() {
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const tenantId = "default-tenant"; // TODO: Get from auth context
      const response = await fetch(
        `/api/iso-ims/training?tenantId=${tenantId}&page=1&pageSize=100`,
      );

      if (response.ok) {
        const data = await response.json();
        const mappedTrainings: Training[] = (data.trainings || []).map(
          (training: any) => ({
            id: training.id,
            programName:
              training.title || training.programName || "Untitled Training",
            employeeName:
              training.assignedTo || training.employeeName || "Unassigned",
            status: training.status || "NOT_STARTED",
            completionDate: training.completionDate,
            expiryDate: training.expiryDate,
            progress: training.progress || 0,
          }),
        );
        setTrainings(mappedTrainings);
      } else {
        console.error("Failed to fetch trainings");
        setTrainings([]);
      }
    } catch (error) {
      console.error("Error fetching Trainings:", error);
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED:
        "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400",
      IN_PROGRESS:
        "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
      EXPIRED: "from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400",
      NOT_STARTED:
        "from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-400",
    };
    return colors[status] || colors["NOT_STARTED"];
  };

  return (
    <PageTemplate
      title="Training & Competence"
      description="Employee Training Records • Competence Management • Certification Tracking"
      icon="ri-graduation-cap-line"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search Training Records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
            />
          </div>
        </div>

        <motion.button
          onClick={() => router.push("/iso-ims/training/new")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <FiPlus className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Assign Training</span>
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <PremiumLoader message="Loading Training Records..." size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map((training, index) => (
            <motion.div
              key={training.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-green-500/40 transition-all duration-300 cursor-pointer group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getStatusColor(training.status)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {training.programName}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {training.employeeName}
                    </p>
                  </div>
                  <FiUsers className="w-6 h-6 text-green-400" />
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-medium">
                      {training.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${training.progress}%` }}
                      transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(training.status)}`}
                  >
                    {training.status.replace("_", " ")}
                  </span>
                  {training.expiryDate && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <FiClock className="w-4 h-4" />
                      <span className="text-xs">
                        Expires:{" "}
                        {new Date(training.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageTemplate>
  );
}

export default function TrainingPage() {
  return (
    <ErrorBoundary>
      <TrainingPageContent />
    </ErrorBoundary>
  );
}
