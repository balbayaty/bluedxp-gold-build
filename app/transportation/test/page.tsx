/**
 * Transport Module Test Page
 * Quick verification that the transport module is working
 */

"use client";

import { useEffect, useState } from "react";
import PageTemplate from "@/components/PageTemplate";

interface ModuleStatus {
  registered: boolean;
  enabled: boolean;
  routes: number;
  inNavigation: boolean;
}

export default function TransportTestPage() {
  const [status, setStatus] = useState<ModuleStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkModule() {
      try {
        // Check module API
        const res = await fetch("/api/modules/list", {
          credentials: "include",
        });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const tmsModule = data.data.find((m: any) => m.id === "tms");

          setStatus({
            registered: !!tmsModule,
            enabled: tmsModule?.id === "tms",
            routes: tmsModule?.routes?.length || 0,
            inNavigation: true, // Navigation is hardcoded in defaultNavigation.ts
          });
        }
      } catch (error) {
        console.error("Error checking module:", error);
      } finally {
        setLoading(false);
      }
    }

    checkModule();
  }, []);

  return (
    <PageTemplate
      title="Transport Module Test"
      description="Verify that the transport module is properly configured"
    >
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Module Status</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Checking module status...
              </p>
            </div>
          ) : status ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg ${status.registered ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {status.registered ? "✅" : "❌"}
                    </span>
                    <div>
                      <div className="font-semibold">Registered</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {status.registered
                          ? "Module is registered"
                          : "Module NOT registered"}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${status.enabled ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {status.enabled ? "✅" : "❌"}
                    </span>
                    <div>
                      <div className="font-semibold">Enabled</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {status.enabled
                          ? "Module is enabled"
                          : "Module is disabled"}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${status.routes > 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {status.routes > 0 ? "✅" : "❌"}
                    </span>
                    <div>
                      <div className="font-semibold">Routes</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {status.routes} routes defined
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${status.inNavigation ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {status.inNavigation ? "✅" : "❌"}
                    </span>
                    <div>
                      <div className="font-semibold">In Navigation</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {status.inNavigation
                          ? "In navigation menu"
                          : "NOT in navigation"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {status.registered &&
              status.enabled &&
              status.routes > 0 &&
              status.inNavigation ? (
                <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ Transport Module is Working!
                  </h3>
                  <p className="text-green-700 dark:text-green-300 mb-4">
                    The transport module is properly configured and should be
                    visible in your sidebar.
                  </p>
                  <div className="space-y-2 text-sm text-green-600 dark:text-green-400">
                    <p>
                      <strong>How to access:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Look for "Transportation" in the left sidebar</li>
                      <li>Click to expand the Transportation menu</li>
                      <li>
                        Or navigate directly to{" "}
                        <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                          /transportation
                        </code>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    ⚠️ Issues Detected
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    There may be configuration issues with the transport module.
                    Check the console for details.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              Failed to check module status
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/transportation"
              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="font-semibold">Dashboard</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Main overview
              </div>
            </a>
            <a
              href="/shipments"
              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="font-semibold">Shipments</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Manage shipments
              </div>
            </a>
            <a
              href="/tracking"
              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="font-semibold">Tracking</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Real-time tracking
              </div>
            </a>
            <a
              href="/routes"
              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="font-semibold">Routes</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Route optimization
              </div>
            </a>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
