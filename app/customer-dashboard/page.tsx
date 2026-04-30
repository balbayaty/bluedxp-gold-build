/**
 * Customer Dashboard - Redirect
 * This page has been consolidated into /dashboard/customer
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerDashboardRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/dashboard/customer");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-4">🔄</div>
        <div className="text-white text-xl font-semibold mb-2">
          Redirecting to Customer Dashboard...
        </div>
        <div className="text-white/70 text-sm">
          This page has been consolidated for better UX
        </div>
      </div>
    </div>
  );
}
