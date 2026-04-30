/**
 * 🎯 PERMISSION SYSTEM DEMO PAGE
 * 
 * Interactive showcase of the world's most flexible permission system:
 * - 5-Level Permission Tree (Module → Feature → Tab → Action → Field)
 * - Advanced Restrictions (Time, Location, Device)
 * - Module Registry with 35+ modules
 * - Monetization Calculator
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import DeepPermissionTree from "@/components/permissions/DeepPermissionTree";
import AdvancedRestrictions, { type AdvancedRestrictionsValue } from "@/components/permissions/AdvancedRestrictions";
import { 
  COMPLETE_MODULE_REGISTRY, 
  getAllModules, 
  getPremiumModules,
  getTotalTabCount,
  getAllSensitiveFields 
} from "@/lib/services/permissions/moduleRegistry";
import type { HierarchicalPermission } from "@/types/permissions";

// ============================================================================
// DEMO DATA
// ============================================================================

const DEMO_PERMISSIONS: HierarchicalPermission[] = [
  { module: "wms", action: "read", scope: "TENANT" },
  { module: "wms", feature: "inventory", action: "read", scope: "TENANT" },
  { module: "wms", feature: "inventory", tab: "stock", action: "read", scope: "TENANT" },
  { module: "wms", feature: "inventory", tab: "stock", action: "update", scope: "ASSIGNED_WAREHOUSES" },
  { module: "tms", action: "read", scope: "TENANT" },
  { module: "tms", feature: "shipments", action: "read", scope: "TENANT" },
  { module: "finance", feature: "accounts_receivable", action: "read", scope: "TENANT" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PermissionDemoPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "tree" | "restrictions" | "monetization">("overview");
  const [permissions, setPermissions] = useState<HierarchicalPermission[]>(DEMO_PERMISSIONS);
  const [restrictions, setRestrictions] = useState<AdvancedRestrictionsValue>({
    timeRestrictions: [],
    locationRestrictions: [],
    deviceRestrictions: [],
    conditionalRestrictions: [],
  });

  // Stats
  const totalModules = getAllModules().length;
  const premiumModules = getPremiumModules().length;
  const totalTabs = getTotalTabCount();
  const sensitiveFields = getAllSensitiveFields().length;
  const totalFeatures = COMPLETE_MODULE_REGISTRY.reduce((sum, m) => sum + m.features.length, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
              World's Most Flexible Permission System
            </span>
          </h1>
          <p className="text-[#9ca3af] text-lg">
            5-Level Hierarchical Permissions • 35+ Modules • Advanced Restrictions • Billion-Dollar Monetization
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Modules", value: totalModules, icon: "ri-apps-line", color: "cyan" },
            { label: "Features", value: totalFeatures, icon: "ri-grid-line", color: "purple" },
            { label: "Tabs", value: totalTabs, icon: "ri-window-line", color: "green" },
            { label: "Sensitive Fields", value: sensitiveFields, icon: "ri-shield-keyhole-line", color: "red" },
            { label: "Premium Modules", value: premiumModules, icon: "ri-vip-crown-line", color: "yellow" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/30`}
            >
              <div className="flex items-center gap-3">
                <i className={`${stat.icon} text-2xl text-${stat.color}-400`}></i>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-[#9ca3af]">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
          {[
            { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
            { id: "tree", label: "5-Level Permission Tree", icon: "ri-git-branch-line" },
            { id: "restrictions", label: "Advanced Restrictions", icon: "ri-lock-line" },
            { id: "monetization", label: "Monetization Calculator", icon: "ri-money-dollar-circle-line" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border border-purple-500/30"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              <i className={tab.icon}></i>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Permission System Overview</h2>
              
              {/* Hierarchy Explanation */}
              <div className="grid md:grid-cols-5 gap-4">
                {[
                  { level: 1, name: "Module", icon: "ri-folder-line", color: "cyan", example: "WMS, TMS, Finance" },
                  { level: 2, name: "Feature", icon: "ri-apps-line", color: "purple", example: "Inventory, Shipments" },
                  { level: 3, name: "Tab", icon: "ri-window-line", color: "green", example: "Stock, Tracking" },
                  { level: 4, name: "Action", icon: "ri-play-line", color: "yellow", example: "Read, Update, Delete" },
                  { level: 5, name: "Field", icon: "ri-input-field", color: "red", example: "Unit Cost, Salary" },
                ].map((item) => (
                  <div
                    key={item.level}
                    className={`p-4 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/30`}
                  >
                    <div className={`text-xs text-${item.color}-400 mb-1`}>Level {item.level}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <i className={`${item.icon} text-${item.color}-400`}></i>
                      <span className="text-white font-medium">{item.name}</span>
                    </div>
                    <div className="text-xs text-[#9ca3af]">{item.example}</div>
                  </div>
                ))}
              </div>

              {/* Module Categories */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Module Categories</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { category: "operations", label: "Operations", count: COMPLETE_MODULE_REGISTRY.filter(m => m.category === "operations").length },
                    { category: "finance", label: "Finance", count: COMPLETE_MODULE_REGISTRY.filter(m => m.category === "finance").length },
                    { category: "compliance", label: "Compliance", count: COMPLETE_MODULE_REGISTRY.filter(m => m.category === "compliance").length },
                    { category: "intelligence", label: "Intelligence", count: COMPLETE_MODULE_REGISTRY.filter(m => m.category === "intelligence").length },
                    { category: "hr", label: "HR", count: COMPLETE_MODULE_REGISTRY.filter(m => m.category === "hr").length },
                    { category: "system", label: "System", count: COMPLETE_MODULE_REGISTRY.filter(m => m.category === "system").length },
                    { category: "integration", label: "Integration", count: COMPLETE_MODULE_REGISTRY.filter(m => m.category === "integration").length },
                    { category: "core", label: "Core", count: COMPLETE_MODULE_REGISTRY.filter(m => m.category === "core").length },
                  ].map((cat) => (
                    <div key={cat.category} className="p-3 bg-white/5 rounded-lg flex justify-between items-center">
                      <span className="text-[#9ca3af]">{cat.label}</span>
                      <span className="text-white font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Module List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">All Modules ({totalModules})</h3>
                <div className="flex flex-wrap gap-2">
                  {COMPLETE_MODULE_REGISTRY.map((module) => (
                    <span
                      key={module.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        module.premium
                          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                          : "bg-white/5 text-[#9ca3af]"
                      }`}
                    >
                      <i className={`${module.icon} mr-1`}></i>
                      {module.name}
                      {module.premium && <i className="ri-vip-crown-line ml-1"></i>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Permission Tree Tab */}
          {activeTab === "tree" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">5-Level Permission Tree</h2>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                  {permissions.length} permissions set
                </span>
              </div>
              
              <DeepPermissionTree
                permissions={permissions}
                onChange={setPermissions}
                showFieldLevel={true}
                showAdvancedOptions={true}
                showRestrictions={true}
              />
            </div>
          )}

          {/* Restrictions Tab */}
          {activeTab === "restrictions" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Advanced Restrictions</h2>
              <p className="text-[#9ca3af] mb-6">
                Configure time, location, and device-based access restrictions for maximum security and compliance.
              </p>
              
              <AdvancedRestrictions
                value={restrictions}
                onChange={setRestrictions}
              />

              {/* Restriction Examples */}
              <div className="mt-8 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-lg">
                <h3 className="text-white font-medium mb-3">Example Use Cases</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <i className="ri-time-line"></i>
                      <span className="font-medium">Time Restriction</span>
                    </div>
                    <p className="text-[#9ca3af]">
                      Limit access to 9 AM - 6 PM (Riyadh time), weekdays only
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <i className="ri-map-pin-line"></i>
                      <span className="font-medium">Location Restriction</span>
                    </div>
                    <p className="text-[#9ca3af]">
                      Only allow access from Saudi Arabia, UAE, or office VPN
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <i className="ri-smartphone-line"></i>
                      <span className="font-medium">Device Restriction</span>
                    </div>
                    <p className="text-[#9ca3af]">
                      Require MFA and corporate device for sensitive data access
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monetization Tab */}
          {activeTab === "monetization" && (
            <MonetizationCalculator />
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-[#6b7280]">
          <p>BlueDXP Platform • World's Most Flexible Permission System</p>
          <p>Vision 2040 Aligned • Enterprise Ready • Billion-Dollar Capable</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MONETIZATION CALCULATOR COMPONENT
// ============================================================================

function MonetizationCalculator() {
  const [selectedModules, setSelectedModules] = useState<string[]>(["wms", "tms"]);
  const [premiumFeatures, setPremiumFeatures] = useState(2);
  const [users, setUsers] = useState(50);
  const [apiCallsPerMonth, setApiCallsPerMonth] = useState(100000);

  // Pricing
  const MODULE_PRICE = 500; // per module per month
  const PREMIUM_FEATURE_PRICE = 100; // per premium feature per month
  const USER_PRICE = 15; // per user per month
  const API_CALLS_PRICE = 0.001; // per API call

  const moduleRevenue = selectedModules.length * MODULE_PRICE;
  const premiumRevenue = premiumFeatures * PREMIUM_FEATURE_PRICE;
  const userRevenue = users * USER_PRICE;
  const apiRevenue = apiCallsPerMonth * API_CALLS_PRICE;
  const totalMonthly = moduleRevenue + premiumRevenue + userRevenue + apiRevenue;
  const totalAnnual = totalMonthly * 12;

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Monetization Calculator</h2>
      <p className="text-[#9ca3af] mb-6">
        Calculate potential revenue from granular permission-based pricing.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-6">
          {/* Module Selection */}
          <div>
            <label className="text-sm text-[#9ca3af] mb-2 block">Select Licensed Modules</label>
            <div className="flex flex-wrap gap-2">
              {COMPLETE_MODULE_REGISTRY.slice(0, 10).map((module) => (
                <button
                  key={module.id}
                  onClick={() => toggleModule(module.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedModules.includes(module.id)
                      ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                      : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                  }`}
                >
                  {module.name}
                </button>
              ))}
            </div>
          </div>

          {/* Premium Features */}
          <div>
            <label className="text-sm text-[#9ca3af] mb-2 block">Premium Features</label>
            <input
              type="range"
              min="0"
              max="20"
              value={premiumFeatures}
              onChange={(e) => setPremiumFeatures(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#6b7280]">
              <span>0</span>
              <span className="text-white">{premiumFeatures} features</span>
              <span>20</span>
            </div>
          </div>

          {/* Users */}
          <div>
            <label className="text-sm text-[#9ca3af] mb-2 block">Number of Users</label>
            <input
              type="range"
              min="1"
              max="500"
              value={users}
              onChange={(e) => setUsers(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#6b7280]">
              <span>1</span>
              <span className="text-white">{users} users</span>
              <span>500</span>
            </div>
          </div>

          {/* API Calls */}
          <div>
            <label className="text-sm text-[#9ca3af] mb-2 block">Monthly API Calls</label>
            <input
              type="range"
              min="0"
              max="1000000"
              step="10000"
              value={apiCallsPerMonth}
              onChange={(e) => setApiCallsPerMonth(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#6b7280]">
              <span>0</span>
              <span className="text-white">{(apiCallsPerMonth / 1000).toFixed(0)}K calls</span>
              <span>1M</span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Breakdown</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-[#9ca3af]">Module Licenses ({selectedModules.length})</span>
              <span className="text-white font-medium">${moduleRevenue.toLocaleString()}/mo</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-[#9ca3af]">Premium Features ({premiumFeatures})</span>
              <span className="text-white font-medium">${premiumRevenue.toLocaleString()}/mo</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-[#9ca3af]">User Licenses ({users})</span>
              <span className="text-white font-medium">${userRevenue.toLocaleString()}/mo</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-[#9ca3af]">API Usage ({(apiCallsPerMonth / 1000).toFixed(0)}K)</span>
              <span className="text-white font-medium">${apiRevenue.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#9ca3af]">Monthly Revenue</span>
              <span className="text-2xl font-bold text-green-400">${totalMonthly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af]">Annual Revenue</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                ${totalAnnual.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Scaling Projection */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Scaling Projection</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-white/5 rounded">
                <div className="text-[#9ca3af]">10 Customers</div>
                <div className="text-green-400 font-medium">${(totalAnnual * 10).toLocaleString()}/yr</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded">
                <div className="text-[#9ca3af]">100 Customers</div>
                <div className="text-green-400 font-medium">${(totalAnnual * 100 / 1000000).toFixed(1)}M/yr</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded">
                <div className="text-[#9ca3af]">1000 Customers</div>
                <div className="text-green-400 font-medium">${(totalAnnual * 1000 / 1000000).toFixed(0)}M/yr</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
