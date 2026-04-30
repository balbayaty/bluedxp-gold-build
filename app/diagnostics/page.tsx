"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface DiagnosticResult {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  details?: string;
}

export default function DiagnosticsPage() {
  const { user, isLoading, isHydrated } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    async function runDiagnostics() {
      const results: DiagnosticResult[] = [];

      // 1. Check Authentication
      if (user) {
        results.push({
          name: "Authentication",
          status: "ok",
          message: `Logged in as ${user.email}`,
          details: `Role: ${user.role}, User ID: ${user.id}`,
        });
      } else {
        results.push({
          name: "Authentication",
          status: "warning",
          message: "Not logged in - using development mode",
          details:
            "In development, the app allows access without login. API calls use mock authentication.",
        });
      }

      // 2. Check Complete System Health (using System Health Module)
      try {
        const systemRes = await fetch("/api/system-health/status");
        const system = await systemRes.json();

        if (system.ok && system.overallStatus === "ok") {
          results.push({
            name: "System Health",
            status: "ok",
            message: "All systems operational",
            details: `Services: ${system.summary?.healthyServices || 0}/${system.summary?.totalServices || 0} healthy, Modules: ${system.summary?.healthyModules || 0}/${system.summary?.totalModules || 0} healthy`,
          });
        } else {
          results.push({
            name: "System Health",
            status: system.overallStatus === "degraded" ? "warning" : "error",
            message: `System status: ${system.overallStatus}`,
            details: `Services: ${system.summary?.healthyServices || 0}/${system.summary?.totalServices || 0} healthy, Modules: ${system.summary?.healthyModules || 0}/${system.summary?.totalModules || 0} healthy`,
          });
        }

        // Add individual service checks
        if (system.services) {
          system.services.forEach((service: any) => {
            const statusMap: Record<string, "ok" | "warning" | "error"> = {
              ok: "ok",
              degraded: "warning",
              not_configured: "warning",
              down: "error",
            };

            results.push({
              name: service.name,
              status: statusMap[service.status] || "warning",
              message:
                service.status === "ok"
                  ? `${service.name} is operational`
                  : service.details ||
                    `${service.name} status: ${service.status}`,
              details: service.url ? `URL: ${service.url}` : service.details,
            });
          });
        }
      } catch (error) {
        results.push({
          name: "System Health",
          status: "error",
          message: "Could not check system health",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // 4. Check Environment
      const isDev = process.env.NODE_ENV === "development";
      results.push({
        name: "Environment",
        status: isDev ? "warning" : "ok",
        message: `Running in ${process.env.NODE_ENV || "development"} mode`,
        details: isDev
          ? "Development mode allows access without authentication. Mock auth context is used for API calls."
          : "Production mode requires full authentication.",
      });

      // 5. Check Auth Context
      results.push({
        name: "Auth Context",
        status: isHydrated ? "ok" : "warning",
        message: isHydrated
          ? "Auth context is hydrated"
          : "Auth context is still loading",
        details: `Loading: ${isLoading}, User: ${user ? "Present" : "Not present"}`,
      });

      setDiagnostics(results);
      setChecking(false);
    }

    if (isHydrated) {
      runDiagnostics();
      // Auto-refresh every 30 seconds
      interval = setInterval(runDiagnostics, 30000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, isLoading, isHydrated]);

  if (!isHydrated || checking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm text-slate-300">Running diagnostics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            System Diagnostics
          </h1>
          <p className="text-slate-400">
            Check your app's authentication, database connection, and system
            status
          </p>
        </div>

        <div className="space-y-4">
          {diagnostics.map((diag, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-6 ${
                diag.status === "ok"
                  ? "bg-green-500/10 border-green-500/30"
                  : diag.status === "warning"
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">
                  {diag.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    diag.status === "ok"
                      ? "bg-green-500/20 text-green-400"
                      : diag.status === "warning"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {diag.status.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-300 mb-2">{diag.message}</p>
              {diag.details && (
                <details className="mt-3">
                  <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                    View Details
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-900/50 rounded text-xs text-slate-300 overflow-x-auto">
                    {diag.details}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-white">
            What This Means
          </h2>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              <strong className="text-cyan-400">✅ OK (Green):</strong> This
              component is working correctly.
            </p>
            <p>
              <strong className="text-amber-400">⚠️ Warning (Yellow):</strong>{" "}
              This is working but may not be optimal. In development mode,
              warnings are usually OK.
            </p>
            <p>
              <strong className="text-red-400">❌ Error (Red):</strong> This
              component has a problem that needs attention.
            </p>
          </div>
        </div>

        <div className="mt-6 p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-white">
            Quick Actions
          </h2>
          <div className="flex gap-3 flex-wrap">
            <a
              href="/login"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition"
            >
              Go to Login
            </a>
            <a
              href="/system-status"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition"
            >
              Full System Status
            </a>
            <a
              href="/api/system-health/status"
              target="_blank"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
            >
              Health API
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
            >
              Refresh Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
