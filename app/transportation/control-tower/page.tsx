/**
 * Control Tower (Old) - Redirect to Control Tower V2
 * Consolidated for better UX
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ControlTowerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/transportation/control-tower-v2");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-radar-fill text-white text-5xl"></i>
        </div>
        <div className="text-white text-2xl font-bold mb-2">
          Control Tower V2
        </div>
        <div className="text-white/70">Loading enhanced command center...</div>
      </div>
    </div>
  );
}
