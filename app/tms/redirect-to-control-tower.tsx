/**
 * TMS Dashboard - Redirect to Control Tower V2
 * This page redirects to the new unified Control Tower V2
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TMSRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Control Tower V2
    router.replace("/transportation/control-tower-v2");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-4">🚀</div>
        <div className="text-white text-xl">
          Redirecting to Control Tower V2...
        </div>
        <div className="text-white/50 text-sm mt-2">
          The new unified transportation dashboard
        </div>
      </div>
    </div>
  );
}
