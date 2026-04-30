"use client";

import { motion } from "framer-motion";
import { ComplianceDashboard } from "@/types/compliance";

interface ComplianceByAuthorityProps {
  dashboard: ComplianceDashboard;
}

export default function ComplianceByAuthority({
  dashboard,
}: ComplianceByAuthorityProps) {
  const authorities = dashboard.complianceByAuthority
    ? Object.values(dashboard.complianceByAuthority)
    : [];

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "HEALTHY":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "DEGRADED":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "OFFLINE":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <i className="ri-government-line text-cyan-400"></i>
        Compliance by Regulatory Authority
      </h2>
      <div className="space-y-4">
        {authorities.map((authority, index) => (
          <motion.div
            key={authority.authority}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <i className="ri-building-2-line text-cyan-400"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {authority.authority}
                  </h3>
                  {authority.apiStatus && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mt-1 ${getStatusBadge(authority.apiStatus)}`}
                    >
                      <i className="ri-wifi-line mr-1"></i>
                      {authority.apiStatus}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`text-2xl font-bold ${
                  authority.complianceScore >= 90
                    ? "text-green-400"
                    : authority.complianceScore >= 70
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {authority.complianceScore.toFixed(1)}%
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-xs text-[#6b7280] mb-1">Total</p>
                <p className="text-lg font-semibold text-white">
                  {authority.totalRequirements}
                </p>
              </div>
              <div className="text-center p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <i className="ri-checkbox-circle-line text-green-400 text-sm"></i>
                  <p className="text-xs text-green-400">Compliant</p>
                </div>
                <p className="text-lg font-semibold text-green-400">
                  {authority.compliant}
                </p>
              </div>
              <div className="text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <i className="ri-close-circle-line text-red-400 text-sm"></i>
                  <p className="text-xs text-red-400">Non-Compliant</p>
                </div>
                <p className="text-lg font-semibold text-red-400">
                  {authority.nonCompliant}
                </p>
              </div>
              <div className="text-center p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <i className="ri-alert-line text-yellow-400 text-sm"></i>
                  <p className="text-xs text-yellow-400">At Risk</p>
                </div>
                <p className="text-lg font-semibold text-yellow-400">
                  {authority.atRisk}
                </p>
              </div>
            </div>

            {authority.lastSync && (
              <p className="text-xs text-[#6b7280] mt-3 flex items-center gap-1">
                <i className="ri-refresh-line"></i>
                Last synced: {new Date(authority.lastSync).toLocaleString()}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
