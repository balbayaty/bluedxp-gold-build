/**
 * Cross-Docking
 *
 * Auto-generated page for /warehouse-network/cross-docking
 * Module: warehouse-network
 */

"use client";

import { useEffect, useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";

function WarehouseNetworkCrossDockingPageContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/warehouse-network/cross-docking");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setData({
            operations: [],
            count: 0,
            error: "Failed to fetch cross-docking operations",
          });
        }
      } catch (error) {
        console.error("Error fetching cross-docking:", error);
        setData({
          operations: [],
          count: 0,
          error: "Failed to fetch cross-docking operations",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageTemplate
        title="Cross-Docking"
        description="Cross-Docking - warehouse-network module"
        icon="ri-swap-box-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading cross-docking operations..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Cross-Docking"
      description="Cross-Docking - warehouse-network module"
      icon="ri-swap-box-line"
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Cross-Docking</h2>
          <p className="text-gray-400">
            This page is ready for implementation. Connect it to your services
            and components.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function WarehouseNetworkCrossDockingPagePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Cross-Docking"
          description="Cross-Docking - warehouse-network module"
          icon="ri-swap-box-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <WarehouseNetworkCrossDockingPageContent />
    </ErrorBoundary>
  );
}
