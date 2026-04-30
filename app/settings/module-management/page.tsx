"use client";

/**
 * Module Management Admin Page
 *
 * Provides admin tools for:
 * - Module Manager (lifecycle, health, dependencies)
 * - Module Communication (inter-module messaging, API discovery)
 * - Module Isolation (sandboxing, resource limits, permissions)
 *
 * This page makes these powerful admin tools visible and accessible.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { moduleRegistry, getEnabledModules } from "@/lib/modules";
import dynamic from "next/dynamic";

// Lazy load module management services
const ModuleManager = dynamic(
  () =>
    import("@/lib/modules/manager").then((m) => ({ default: m.moduleManager })),
  { ssr: false },
);
const ModuleCommunication = dynamic(
  () =>
    import("@/lib/modules/communication").then((m) => ({
      default: m.moduleCommunication,
    })),
  { ssr: false },
);
const ModuleIsolation = dynamic(
  () =>
    import("@/lib/modules/isolation").then((m) => ({
      default: m.moduleIsolation,
    })),
  { ssr: false },
);

export default function ModuleManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "manager" | "communication" | "isolation"
  >("overview");
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const enabled = getEnabledModules();
      setModules(enabled);
      setLoading(false);
    }
  }, []);

  // Check if user has admin access
  const isAdmin = user?.role === "SYSTEM_ADMIN" || user?.role === "IT_ADMIN";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <i className="ri-shield-cross-line text-4xl text-red-400 mb-4"></i>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-400">
              Module Management is only available to System Administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <i className="ri-settings-3-line text-cyan-400"></i>
            Module Management
          </h1>
          <p className="text-gray-400">
            Advanced module lifecycle, communication, and isolation management
            tools
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          {[
            { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
            { id: "manager", label: "Module Manager", icon: "ri-tools-line" },
            {
              id: "communication",
              label: "Communication",
              icon: "ri-message-3-line",
            },
            { id: "isolation", label: "Isolation", icon: "ri-shield-line" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          {activeTab === "overview" && (
            <OverviewTab modules={modules} loading={loading} />
          )}
          {activeTab === "manager" && <ManagerTab />}
          {activeTab === "communication" && <CommunicationTab />}
          {activeTab === "isolation" && <IsolationTab />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({
  modules,
  loading,
}: {
  modules: any[];
  loading: boolean;
}) {
  if (loading) {
    return <div className="text-center py-12">Loading modules...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Module Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => (
          <div
            key={module.id}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{module.name}</h3>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                Enabled
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">{module.description}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>{module.routes?.length || 0} routes</span>
              <span>{module.components?.length || 0} components</span>
              <span>{module.apis?.length || 0} APIs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManagerTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Module Manager</h2>
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <i className="ri-information-line"></i>
            Module Lifecycle Management
          </h3>
          <p className="text-sm text-gray-400">
            Start, stop, and monitor module lifecycle states. Check dependencies
            and health status.
          </p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm text-yellow-400">
            <i className="ri-alert-line mr-2"></i>
            Module Manager service is available. Full UI implementation coming
            soon.
          </p>
        </div>
      </div>
    </div>
  );
}

function CommunicationTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Module Communication</h2>
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <i className="ri-information-line"></i>
            Inter-Module Messaging
          </h3>
          <p className="text-sm text-gray-400">
            Send messages between modules, discover module APIs, and monitor
            communication protocols.
          </p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm text-yellow-400">
            <i className="ri-alert-line mr-2"></i>
            Module Communication service is available. Full UI implementation
            coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

function IsolationTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Module Isolation</h2>
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <i className="ri-information-line"></i>
            Sandboxing & Resource Limits
          </h3>
          <p className="text-sm text-gray-400">
            Configure isolation policies, resource limits, and permissions for
            module sandboxing.
          </p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm text-yellow-400">
            <i className="ri-alert-line mr-2"></i>
            Module Isolation service is available. Full UI implementation coming
            soon.
          </p>
        </div>
      </div>
    </div>
  );
}
