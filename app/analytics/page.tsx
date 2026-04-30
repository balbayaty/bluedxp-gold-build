"use client";

/**
 * Analytics Page
 * Redirects to unified analytics dashboard
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified analytics
    router.replace("/analytics/unified");
  }, [router]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Analytics Dashboard...</p>
        </div>
      </div>
    </Layout>
  );
}
