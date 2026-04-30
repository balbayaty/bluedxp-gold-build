/**
 * 🛡️ ENTERPRISE SECURITY SETTINGS PAGE
 * 
 * Comprehensive security management:
 * - MFA Settings
 * - SSO Providers
 * - Session Management
 * - Security Alerts
 * - Access Requests
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import MFASettings from "@/components/auth/MFASettings";
import SessionManager from "@/components/auth/SessionManager";
import SSOProviderSettings from "@/components/auth/SSOProviderSettings";
import SecurityAlertsPanel from "@/components/security/SecurityAlertsPanel";
import ApprovalQueue from "@/components/user-management/ApprovalQueue";

type Tab = "mfa" | "sessions" | "sso" | "alerts" | "approvals";

const SecuritySettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("mfa");
  
  // Mock current user ID - in production, get from session
  const currentUserId = "current_user";

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: "mfa", label: "Two-Factor Auth", icon: "ri-shield-keyhole-line" },
    { id: "sessions", label: "Active Sessions", icon: "ri-computer-line" },
    { id: "sso", label: "SSO Providers", icon: "ri-key-2-line" },
    { id: "alerts", label: "Security Alerts", icon: "ri-alarm-warning-line", badge: 2 },
    { id: "approvals", label: "Approval Queue", icon: "ri-inbox-line", badge: 3 },
  ];

  return (
    <div className="min-h-screen bg-[#030712] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <i className="ri-shield-line text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Security Settings</h1>
              <p className="text-sm text-[#9ca3af]">
                Manage authentication, sessions, and security policies
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "mfa" && <MFASettings userId={currentUserId} />}
          {activeTab === "sessions" && <SessionManager userId={currentUserId} />}
          {activeTab === "sso" && <SSOProviderSettings />}
          {activeTab === "alerts" && <SecurityAlertsPanel isAdmin />}
          {activeTab === "approvals" && <ApprovalQueue />}
        </motion.div>

        {/* Security Tips */}
        <div className="mt-8 p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <i className="ri-lightbulb-flash-line text-2xl text-cyan-400"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Security Best Practices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#9ca3af]">
                <div className="flex items-start gap-2">
                  <i className="ri-check-line text-cyan-400 mt-0.5"></i>
                  <span>Enable two-factor authentication for all admin accounts</span>
                </div>
                <div className="flex items-start gap-2">
                  <i className="ri-check-line text-cyan-400 mt-0.5"></i>
                  <span>Review active sessions regularly and revoke unknown devices</span>
                </div>
                <div className="flex items-start gap-2">
                  <i className="ri-check-line text-cyan-400 mt-0.5"></i>
                  <span>Configure SSO for enterprise-grade authentication</span>
                </div>
                <div className="flex items-start gap-2">
                  <i className="ri-check-line text-cyan-400 mt-0.5"></i>
                  <span>Monitor security alerts and respond promptly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
