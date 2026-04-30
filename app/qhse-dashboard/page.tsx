/**
 * QHSE Dashboard - Redirect to Enhanced Dashboard
 * This route redirects to the new enhanced QHSE dashboard at /qhse/dashboard
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QHSEDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the enhanced QHSE dashboard
    router.replace("/qhse/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting to QHSE Dashboard...
        </p>
      </div>
    </div>
  );
}
