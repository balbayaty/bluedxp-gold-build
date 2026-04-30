"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceStatus {
  name: string;
  status: "ok" | "degraded" | "down" | "not_configured";
  details?: string;
  port?: number;
  url?: string;
}

interface DockerContainer {
  name: string;
  status: string;
  ports: string;
  healthy: boolean;
}

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  version: string;
  routes: number;
  components: number;
  dependencies: string[];
  standalone: boolean;
}

interface CompleteStatus {
  timestamp: string;
  environment: string;
  services: ServiceStatus[];
  modules: ModuleInfo[];
  docker: DockerContainer[];
  environment_vars: Record<string, boolean>;
  status: "ok" | "degraded" | "down";
  ok: boolean;
}

export default function SystemStatusPage() {
  const { user, isHydrated } = useAuth();
  const [status, setStatus] = useState<CompleteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;

    async function fetchStatus() {
      try {
        setLoading(true);
        // Use the System Health Service endpoint for consistency
        const response = await fetch("/api/system-health/status");
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }
        const data = await response.json();
        // Transform timestamp from string to Date if needed
        if (data.timestamp && typeof data.timestamp === "string") {
          data.timestamp = new Date(data.timestamp);
        }
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds (matches service auto-update)
    return () => clearInterval(interval);
  }, [isHydrated]);

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm text-slate-300">Loading system status...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Error Loading Status
            </h2>
            <p className="text-slate-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "degraded":
      case "not_configured":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "down":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const enabledModules = status.modules.filter((m) => m.enabled);
  const disabledModules = status.modules.filter((m) => !m.enabled);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Complete System Status
          </h1>
          <p className="text-slate-400">
            Full overview of all services, modules, and infrastructure
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Last updated: {new Date(status.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Overall Status */}
        <div
          className={`mb-6 rounded-lg border p-6 ${getStatusColor(status.status)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-1">
                Overall System Status
              </h2>
              <p className="text-sm opacity-80">
                {status.status === "ok" && "All systems operational"}
                {status.status === "degraded" && "Some services have issues"}
                {status.status === "down" && "Critical services are down"}
              </p>
            </div>
            <div className="text-4xl font-bold">{status.ok ? "✅" : "⚠️"}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">
              Infrastructure Services
            </h2>
            {status.services.map((service, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-4 ${getStatusColor(service.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{service.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-black/20">
                    {service.status.toUpperCase()}
                  </span>
                </div>
                {service.port && (
                  <p className="text-xs opacity-70 mb-1">
                    Port: {service.port}
                  </p>
                )}
                {service.url && (
                  <p className="text-xs opacity-70 mb-1">URL: {service.url}</p>
                )}
                {service.details && (
                  <p className="text-xs opacity-70 mt-2">{service.details}</p>
                )}
              </div>
            ))}
          </div>

          {/* Docker Containers */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">
              Docker Containers ({status.docker.length})
            </h2>
            {status.docker.length > 0 ? (
              status.docker.map((container, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 ${
                    container.healthy
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-amber-500/10 border-amber-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{container.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-black/20">
                      {container.healthy ? "HEALTHY" : "UNHEALTHY"}
                    </span>
                  </div>
                  <p className="text-xs opacity-70 mb-1">{container.status}</p>
                  {container.ports && container.ports !== "none" && (
                    <p className="text-xs opacity-70">
                      Ports: {container.ports}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-slate-700 p-4 text-slate-400 text-sm">
                Docker containers not detected (Docker may not be running or not
                accessible)
              </div>
            )}
          </div>
        </div>

        {/* Modules */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">
            Registered Modules ({status.modules.length} total,{" "}
            {enabledModules.length} enabled)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {status.modules.map((module) => (
              <div
                key={module.id}
                className={`rounded-lg border p-4 ${
                  module.enabled
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-slate-800/50 border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{module.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{module.id}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      module.enabled
                        ? "bg-green-500/20 text-green-400"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {module.enabled ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  {module.description}
                </p>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>Routes: {module.routes}</span>
                  <span>Components: {module.components}</span>
                </div>
                {module.dependencies.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    Depends on: {module.dependencies.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">
            Environment Configuration
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(status.environment_vars).map(([key, value]) => (
              <div
                key={key}
                className={`rounded-lg border p-3 ${
                  value
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                }`}
              >
                <div className="text-xs font-mono text-slate-400 mb-1">
                  {key}
                </div>
                <div className="text-sm font-semibold">
                  {value ? "✅ Set" : "⚠️ Not Set"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-700 p-4">
            <div className="text-2xl font-bold text-cyan-400">
              {status.services.length}
            </div>
            <div className="text-sm text-slate-400">Services</div>
          </div>
          <div className="rounded-lg border border-slate-700 p-4">
            <div className="text-2xl font-bold text-blue-400">
              {status.modules.length}
            </div>
            <div className="text-sm text-slate-400">Total Modules</div>
          </div>
          <div className="rounded-lg border border-slate-700 p-4">
            <div className="text-2xl font-bold text-green-400">
              {enabledModules.length}
            </div>
            <div className="text-sm text-slate-400">Enabled Modules</div>
          </div>
          <div className="rounded-lg border border-slate-700 p-4">
            <div className="text-2xl font-bold text-purple-400">
              {status.docker.length}
            </div>
            <div className="text-sm text-slate-400">Docker Containers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
