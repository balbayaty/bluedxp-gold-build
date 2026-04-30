/**
 * ISO-IMS Risk Management Page
 * Risk Assessment & Register
 * World-class UI/UX with glassmorphism and animations
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiSearch,
  FiShield,
  FiAlertCircle,
  FiTrendingUp,
} from "react-icons/fi";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import PageTemplate from "@/components/PageTemplate";

interface Risk {
  id: string;
  riskNumber: string;
  title: string;
  riskLevel: string;
  category: string;
  status: string;
  lastAssessed: string;
}

function RiskPageContent() {
  const router = useRouter();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const tenantId = "default-tenant"; // TODO: Get from auth context
      const response = await fetch(
        `/api/iso-ims/risk?tenantId=${tenantId}&page=1&pageSize=100`,
      );

      if (response.ok) {
        const data = await response.json();
        const mappedRisks: Risk[] = (data.risks || []).map((risk: any) => ({
          id: risk.id,
          riskNumber: risk.riskNumber || risk.id,
          title: risk.title,
          riskLevel: risk.riskLevel || "MEDIUM",
          category: risk.category || "OPERATIONAL",
          status: risk.status || "OPEN",
          lastAssessed: risk.lastAssessed || risk.updatedAt || risk.createdAt,
        }));
        setRisks(mappedRisks);
      } else {
        console.error("Failed to fetch risks");
        setRisks([]);
      }
    } catch (error) {
      console.error("Error fetching Risks:", error);
      setRisks([]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400",
      HIGH: "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400",
      MEDIUM:
        "from-yellow-500/20 to-yellow-500/20 border-yellow-500/30 text-yellow-400",
      LOW: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400",
    };
    return colors[level] || colors["MEDIUM"];
  };

  return (
    <PageTemplate
      title="Risk Management"
      description="Risk Assessment & Register • Risk Scoring • Mitigation Tracking"
      icon="ri-shield-cross-line"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search Risks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
            />
          </div>
        </div>

        <motion.button
          onClick={() => router.push("/iso-ims/risk/new")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <FiPlus className="w-5 h-5 relative z-10" />
          <span className="relative z-10">New Risk</span>
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <PremiumLoader message="Loading Risks..." size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {risks.map((risk, index) => (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-yellow-500/40 transition-all duration-300 cursor-pointer group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getRiskLevelColor(risk.riskLevel)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {risk.title}
                    </h3>
                    <p className="text-sm text-gray-400">{risk.riskNumber}</p>
                  </div>
                  <FiShield className="w-6 h-6 text-yellow-400" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${getRiskLevelColor(risk.riskLevel)}`}
                  >
                    {risk.riskLevel}
                  </span>
                  <span className="text-gray-400 text-xs">{risk.category}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageTemplate>
  );
}

export default function RiskPage() {
  return (
    <ErrorBoundary>
      <RiskPageContent />
    </ErrorBoundary>
  );
}
