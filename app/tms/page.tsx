/**
 * TMS Main Dashboard - Redirects to Control Tower V2
 * Consolidated: This now redirects to the unified Control Tower V2
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TMSDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Control Tower V2
    router.replace("/transportation/control-tower-v2");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-4">🚀</div>
        <div className="text-white text-xl font-semibold mb-2">
          Redirecting to Control Tower V2...
        </div>
        <div className="text-white/70 text-sm">
          The new unified transportation command center
        </div>
        <div className="text-white/50 text-xs mt-4">
          This dashboard has been consolidated for better UX
        </div>
      </div>
    </div>
  );
}
