/**
 * Simple test page to verify intelligent dashboard service
 */

"use client";

import { useEffect, useState } from "react";
import { intelligentDashboardService } from "@/lib/services/dashboards/intelligentDashboardService";

export default function IntelligentDashboardTest() {
  const [status, setStatus] = useState<string>("Testing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function test() {
      try {
        const result = await intelligentDashboardService.getIntelligence({
          tenantId: "test",
          userId: "test-user",
          userRole: "user",
          enabledModules: ["wms"],
          currentTime: new Date(),
        });

        setStatus(
          `✅ Success! Got ${result.recommendations.length} recommendations and ${result.insights.length} insights`,
        );
      } catch (err: any) {
        setError(err.message || "Unknown error");
        setStatus("❌ Failed");
      }
    }

    test();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">
        Intelligent Dashboard Service Test
      </h1>
      <div className="bg-slate-800 p-4 rounded-lg">
        <p className="mb-2">Status: {status}</p>
        {error && <p className="text-red-400">Error: {error}</p>}
      </div>
    </div>
  );
}
