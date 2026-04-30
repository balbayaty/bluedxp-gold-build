/**
 * Intelligence Cockpit - Redirect to Control Tower V2
 * Consolidated for better UX
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CockpitRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/transportation/control-tower-v2");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <i className="ri-dashboard-3-fill text-white text-5xl"></i>
        </div>
        <div className="text-white text-2xl font-bold mb-2">
          Upgraded Intelligence Platform
        </div>
        <div className="text-white/70">Redirecting to Control Tower V2...</div>
      </div>
    </div>
  );
}
