/**
 * Liability Dashboard
 * Comprehensive liability assessment dashboard with all tools
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function LiabilityDashboard() {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState<
    "overview" | "assessments" | "claims" | "rules" | "analytics"
  >("overview");

  const faultDistribution = [
    { name: "Warehouse", value: 65, color: "#ef4444" },
    { name: "Carrier", value: 20, color: "#f59e0b" },
    { name: "Supplier", value: 10, color: "#3b82f6" },
    { name: "Customer", value: 3, color: "#10b981" },
    { name: "Other", value: 2, color: "#8b5cf6" },
  ];

  const claimTrend = [
    { month: "Jan", amount: 45000, count: 12 },
    { month: "Feb", amount: 52000, count: 15 },
    { month: "Mar", amount: 48000, count: 14 },
    { month: "Apr", amount: 61000, count: 18 },
    { month: "May", amount: 55000, count: 16 },
    { month: "Jun", amount: 68000, count: 20 },
  ];

  return (
    <PageTemplate
      title="⚖️ Liability Dashboard"
      description="Comprehensive liability assessment, insurance claims, and fault determination dashboard"
      icon="ri-scales-3-line"
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Assessments",
              value: "234",
              change: "+18",
              color: "orange",
              href: "/liability/assessments",
            },
            {
              label: "Total Claims",
              value: "AED 125K",
              change: "+12%",
              color: "green",
              href: "/liability/claims",
            },
            {
              label: "Warehouse Fault",
              value: "65%",
              change: "-3%",
              color: "red",
              href: "/liability/analytics",
            },
            {
              label: "Active Rules",
              value: "42",
              change: "+5",
              color: "blue",
              href: "/liability/rules",
            },
          ].map((stat, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(stat.href)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 border border-${stat.color}-500/30 rounded-xl p-6 hover:border-${stat.color}-400/50 transition-all text-left group`}
            >
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className={`text-${stat.color}-400 text-sm`}>{stat.change}</p>
              <div className="mt-3 flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors">
                <span className="text-xs">View Details</span>
                <i className="ri-arrow-right-line"></i>
              </div>
            </motion.button>
          ))}
        </div>

        {/* View Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
              {
                id: "assessments",
                label: "Assessments",
                icon: "ri-file-list-line",
              },
              { id: "claims", label: "Claims", icon: "ri-file-paper-line" },
              { id: "rules", label: "Rules", icon: "ri-settings-3-line" },
              {
                id: "analytics",
                label: "Analytics",
                icon: "ri-bar-chart-line",
              },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedView(tab.id as any)}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedView === tab.id
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <i className={`ri-${tab.icon.split("-")[1]}-line`}></i>
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {selectedView === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Fault Distribution */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Fault Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={faultDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {faultDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Claim Trend */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Claim Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={claimTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Amount (AED)"
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Count"
                      />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/liability/calculator")}
                    className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className="ri-calculator-line text-2xl text-orange-400"></i>
                      <h5 className="text-white font-semibold">
                        Liability Calculator
                      </h5>
                    </div>
                    <p className="text-white/70 text-sm">
                      Calculate fault and claimable amounts
                    </p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/liability/compliance")}
                    className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className="ri-shield-check-line text-2xl text-orange-400"></i>
                      <h5 className="text-white font-semibold">
                        Compliance Checker
                      </h5>
                    </div>
                    <p className="text-white/70 text-sm">
                      Verify legal compliance requirements
                    </p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/liability/rules")}
                    className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className="ri-settings-3-line text-2xl text-orange-400"></i>
                      <h5 className="text-white font-semibold">Manage Rules</h5>
                    </div>
                    <p className="text-white/70 text-sm">
                      Configure liability assessment rules
                    </p>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === "assessments" && (
            <motion.div
              key="assessments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    All Liability Assessments
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-white text-sm transition-all flex items-center gap-2"
                  >
                    <i className="ri-add-line"></i>
                    New Assessment
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-orange-500/50 transition-all cursor-pointer"
                      onClick={() =>
                        router.push(`/liability/assessments/${idx + 1}`)
                      }
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">
                            Assessment #LI-2025-
                            {String(idx + 1).padStart(3, "0")}
                          </h4>
                          <p className="text-white/70 text-sm">
                            Damage Record: DR-2025-
                            {String(idx + 1).padStart(3, "0")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-orange-400 font-bold text-2xl">
                            75%
                          </p>
                          <p className="text-white/60 text-xs">
                            Warehouse Fault
                          </p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">
                            Primary Fault
                          </p>
                          <p className="text-white font-semibold">Warehouse</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">
                            Claimable Amount
                          </p>
                          <p className="text-green-400 font-semibold">
                            AED 1,250
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">Status</p>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            Assessed
                          </span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">Date</p>
                          <p className="text-white/70 text-xs">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/liability/assessments/${idx + 1}`);
                          }}
                          className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-white text-sm transition-all"
                        >
                          View Details
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/liability/claims/new?assessment=${idx + 1}`,
                            );
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                        >
                          Create Claim
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === "claims" && (
            <motion.div
              key="claims"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    Insurance Claims
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/liability/claims/new")}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-white text-sm transition-all flex items-center gap-2"
                  >
                    <i className="ri-add-line"></i>
                    New Claim
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-green-500/50 transition-all cursor-pointer"
                      onClick={() =>
                        router.push(`/liability/claims/${idx + 1}`)
                      }
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">
                            Claim #CL-2025-{String(idx + 1).padStart(3, "0")}
                          </h4>
                          <p className="text-white/70 text-sm">
                            Assessment: LI-2025-
                            {String(idx + 1).padStart(3, "0")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold text-2xl">
                            AED {[1250, 2300, 1800, 3200][idx]}
                          </p>
                          <p className="text-white/60 text-xs">Claim Amount</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">Status</p>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              ["submitted", "approved", "pending", "rejected"][
                                idx
                              ] === "approved"
                                ? "bg-green-500/20 text-green-400"
                                : [
                                      "submitted",
                                      "approved",
                                      "pending",
                                      "rejected",
                                    ][idx] === "rejected"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {["submitted", "approved", "pending", "rejected"][
                              idx
                            ].toUpperCase()}
                          </span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">
                            Insurance Provider
                          </p>
                          <p className="text-white font-semibold text-sm">
                            Provider {idx + 1}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">
                            Policy Number
                          </p>
                          <p className="text-white/70 text-xs font-mono">
                            POL-{String(idx + 1).padStart(6, "0")}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">Date</p>
                          <p className="text-white/70 text-xs">
                            {(idx + 1) * 2} days ago
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === "rules" && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    Liability Rules
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/liability/rules/new")}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-white text-sm transition-all flex items-center gap-2"
                  >
                    <i className="ri-add-line"></i>
                    Create Rule
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      name: "Warehouse Loading Dock Rule",
                      condition:
                        'IF area == "loading_dock" AND equipment == "forklift"',
                      action: "THEN warehouse_fault = 75%",
                      priority: 1,
                      status: "active",
                    },
                    {
                      name: "Carrier Transport Rule",
                      condition:
                        'IF damageType == "crush" AND carrier IS NOT NULL',
                      action: "THEN carrier_fault = 50%",
                      priority: 2,
                      status: "active",
                    },
                  ].map((rule, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">
                            {rule.name}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                              <p className="text-blue-300 font-mono text-xs mb-1">
                                Condition:
                              </p>
                              <p className="text-white">{rule.condition}</p>
                            </div>
                            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                              <p className="text-green-300 font-mono text-xs mb-1">
                                Action:
                              </p>
                              <p className="text-white">{rule.action}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-400 font-bold">
                            Priority {rule.priority}
                          </p>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs mt-2 inline-block">
                            {rule.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-white text-sm transition-all"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                        >
                          Test
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                        >
                          Disable
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Liability Analytics
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Fault Distribution Over Time
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={claimTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="count" fill="#a855f7" name="Claims" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Fault by Module
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={faultDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {faultDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}
