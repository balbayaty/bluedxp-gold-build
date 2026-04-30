"use client";

/**
 * 👤 UNIFIED ACCOUNT PAGE
 * 
 * Central account management combining:
 * - Profile information
 * - Billing & subscription
 * - Security settings
 * - Preferences
 * 
 * BlueDXP Platform - Enterprise Account Management
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import billing dashboard
const UnifiedBillingDashboard = dynamic(
  () => import("@/components/billing/UnifiedBillingDashboard"),
  { ssr: false }
);

type TabType = "profile" | "billing" | "security" | "preferences";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const subscriptionLimits = useSubscriptionLimits();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  const tabs: { id: TabType; name: string; icon: string; description: string }[] = [
    { id: "profile", name: "Profile", icon: "ri-user-3-line", description: "Personal information" },
    { id: "billing", name: "Billing", icon: "ri-money-dollar-circle-line", description: "Subscription & payments" },
    { id: "security", name: "Security", icon: "ri-shield-user-line", description: "Password & authentication" },
    { id: "preferences", name: "Preferences", icon: "ri-settings-3-line", description: "App preferences" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#0a0e14] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard" className="text-[#6b7280] hover:text-white transition-colors">
              <i className="ri-arrow-left-line text-xl"></i>
            </Link>
            <h1 className="text-3xl font-bold text-white">Account</h1>
          </div>
          <p className="text-[#9ca3af]">Manage your profile, billing, and preferences</p>
        </div>

        {/* User Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.name || "User"}</h2>
                <p className="text-[#9ca3af]">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                    {user?.role || "User"}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    {subscriptionLimits.planName} Plan
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg transition-all"
            >
              <i className="ri-logout-box-r-line mr-2"></i>
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.name || ""}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ""}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Role</label>
                    <input
                      type="text"
                      defaultValue={user?.role || ""}
                      disabled
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-[#9ca3af] cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Tenant ID</label>
                    <input
                      type="text"
                      defaultValue={user?.tenantId || ""}
                      disabled
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-[#9ca3af] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20">
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/billing"
                  className="bg-white/[0.03] border border-white/10 hover:border-blue-500/30 rounded-xl p-4 transition-all group"
                >
                  <i className="ri-vip-crown-line text-2xl text-blue-400 mb-2"></i>
                  <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">Subscription</h4>
                  <p className="text-sm text-[#9ca3af]">{subscriptionLimits.planName} Plan</p>
                </Link>

                <Link
                  href="/settings/users"
                  className="bg-white/[0.03] border border-white/10 hover:border-purple-500/30 rounded-xl p-4 transition-all group"
                >
                  <i className="ri-user-settings-line text-2xl text-purple-400 mb-2"></i>
                  <h4 className="text-white font-medium group-hover:text-purple-400 transition-colors">User Management</h4>
                  <p className="text-sm text-[#9ca3af]">{subscriptionLimits.currentUsers} users</p>
                </Link>

                <Link
                  href="/settings"
                  className="bg-white/[0.03] border border-white/10 hover:border-green-500/30 rounded-xl p-4 transition-all group"
                >
                  <i className="ri-settings-3-line text-2xl text-green-400 mb-2"></i>
                  <h4 className="text-white font-medium group-hover:text-green-400 transition-colors">Settings</h4>
                  <p className="text-sm text-[#9ca3af]">System configuration</p>
                </Link>
              </div>
            </motion.div>
          )}

          {activeTab === "billing" && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UnifiedBillingDashboard mode="user" />
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Change Password</h3>
                
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Two-Factor Authentication</h3>
                <p className="text-[#9ca3af] mb-4">Add an extra layer of security to your account</p>
                <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg transition-all">
                  Enable 2FA
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Preferences</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Email Notifications</p>
                      <p className="text-sm text-[#9ca3af]">Receive email updates</p>
                    </div>
                    <button className="relative w-12 h-6 bg-blue-500 rounded-full transition-colors">
                      <motion.div
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                        animate={{ x: 24 }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Dark Mode</p>
                      <p className="text-sm text-[#9ca3af]">Use dark theme</p>
                    </div>
                    <button className="relative w-12 h-6 bg-blue-500 rounded-full transition-colors">
                      <motion.div
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                        animate={{ x: 24 }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Real-time Updates</p>
                      <p className="text-sm text-[#9ca3af]">Live data synchronization</p>
                    </div>
                    <button className="relative w-12 h-6 bg-blue-500 rounded-full transition-colors">
                      <motion.div
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                        animate={{ x: 24 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
