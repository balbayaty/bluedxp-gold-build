/**
 * Stock Alerts - Redirect
 * Stock alerts are now available in the main Inventory page with filters
 * The real API /api/wms/inventory/alerts provides this functionality
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StockAlertsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/inventory?view=alerts");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-orange-900">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-4">🚨</div>
        <div className="text-white text-xl font-semibold mb-2">
          Redirecting to Inventory Alerts...
        </div>
        <div className="text-white/70 text-sm">
          Stock alerts are now integrated into the main Inventory module
        </div>
      </div>
    </div>
  );
}
