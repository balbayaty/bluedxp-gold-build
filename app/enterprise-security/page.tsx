/**
 * 🛡️ ENTERPRISE SECURITY DASHBOARD
 * 
 * Central hub for all enterprise security features:
 * - MFA Management
 * - SSO Providers
 * - Session Control
 * - Security Alerts
 * - Access Approvals
 * - User Management
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  {
    id: "mfa",
    title: "Two-Factor Authentication",
    description: "Secure accounts with TOTP-based MFA and backup codes",
    icon: "ri-shield-keyhole-line",
    href: "/settings/security",
    color: "from-green-500 to-emerald-500",
    stats: "Enabled for 85% of users",
  },
  {
    id: "sso",
    title: "Single Sign-On",
    description: "Configure SAML 2.0 and OIDC identity providers",
    icon: "ri-key-2-line",
    href: "/settings/security",
    color: "from-blue-500 to-indigo-500",
    stats: "2 providers configured",
  },
  {
    id: "sessions",
    title: "Session Management",
    description: "Monitor and control active user sessions",
    icon: "ri-computer-line",
    href: "/settings/security",
    color: "from-purple-500 to-pink-500",
    stats: "24 active sessions",
  },
  {
    id: "alerts",
    title: "Security Alerts",
    description: "Real-time anomaly detection and threat monitoring",
    icon: "ri-alarm-warning-line",
    href: "/settings/security",
    color: "from-red-500 to-orange-500",
    stats: "2 alerts pending",
    badge: "2",
  },
  {
    id: "users",
    title: "User Management",
    description: "Complete user lifecycle and permission management",
    icon: "ri-user-settings-line",
    href: "/settings/users",
    color: "from-cyan-500 to-blue-500",
    stats: "156 active users",
  },
  {
    id: "approvals",
    title: "Access Approvals",
    description: "Review and approve access requests from team members",
    icon: "ri-inbox-line",
    href: "/settings/security",
    color: "from-yellow-500 to-amber-500",
    stats: "3 pending",
    badge: "3",
  },
  {
    id: "audit",
    title: "Audit Logs",
    description: "Export and analyze security audit trails",
    icon: "ri-file-list-3-line",
    href: "/audit-trail",
    color: "from-slate-500 to-gray-600",
    stats: "Last 30 days available",
  },
  {
    id: "import",
    title: "Bulk Operations",
    description: "Import/export users, clone roles, and more",
    icon: "ri-upload-cloud-line",
    href: "/settings/users",
    color: "from-teal-500 to-cyan-500",
    stats: "CSV & JSON supported",
  },
];

const EnterpriseSecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#030712] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <i className="ri-shield-star-line text-3xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Enterprise Security</h1>
              <p className="text-[#9ca3af]">
                Comprehensive security management for your organization
              </p>
            </div>
          </div>

          {/* Security Score */}
          <div className="mt-6 p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Security Score</div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-green-400">87</span>
                  <span className="text-[#6b7280]">/ 100</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-[#9ca3af]">MFA Adoption</div>
                  <div className="text-lg font-bold text-white">85%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#9ca3af]">SSO Enabled</div>
                  <div className="text-lg font-bold text-white">Yes</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#9ca3af]">Active Alerts</div>
                  <div className="text-lg font-bold text-red-400">2</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={feature.href}>
                <div className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <i className={`${feature.icon} text-2xl text-white`}></i>
                    </div>
                    {feature.badge && (
                      <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#9ca3af] mb-4">
                    {feature.description}
                  </p>
                  <div className="text-xs text-[#6b7280]">
                    {feature.stats}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings/security"
              className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <i className="ri-shield-check-line mr-2"></i>
              Enable MFA
            </Link>
            <Link
              href="/settings/security"
              className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <i className="ri-key-line mr-2"></i>
              Configure SSO
            </Link>
            <Link
              href="/settings/users"
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              <i className="ri-user-add-line mr-2"></i>
              Add User
            </Link>
            <Link
              href="/settings/users"
              className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-400 hover:bg-purple-500/30 transition-colors"
            >
              <i className="ri-upload-2-line mr-2"></i>
              Import Users
            </Link>
            <Link
              href="/audit-trail"
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
            >
              <i className="ri-download-line mr-2"></i>
              Export Audit Log
            </Link>
          </div>
        </div>

        {/* Help */}
        <div className="mt-6 text-center text-xs text-[#6b7280]">
          <p>
            Need help? Visit the{" "}
            <a href="/docs" className="text-cyan-400 hover:underline">
              documentation
            </a>{" "}
            or contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseSecurityPage;
