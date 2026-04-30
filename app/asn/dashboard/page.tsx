/**
 * ASN Dashboard Page
 * Main dashboard with tabs for different views
 * Optimized with dynamic imports for fast page transitions
 */

"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dynamic imports for code splitting - faster initial load
const OperationalDashboard = dynamic(
  () =>
    import("@/components/asn/OperationalDashboard").then((mod) => ({
      default: mod.OperationalDashboard,
    })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false,
  },
);

const ExecutiveDashboard = dynamic(
  () =>
    import("@/components/asn/ExecutiveDashboard").then((mod) => ({
      default: mod.ExecutiveDashboard,
    })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false,
  },
);

const AnalyticalDashboard = dynamic(
  () =>
    import("@/components/asn/AnalyticalDashboard").then((mod) => ({
      default: mod.AnalyticalDashboard,
    })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false,
  },
);

export default function AsnDashboardPage() {
  const [activeTab, setActiveTab] = useState("operational");

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">ASN Dashboards</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive views of ASN operations and intelligence
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="analytical">Analytical</TabsTrigger>
        </TabsList>
        <TabsContent value="operational" className="mt-6">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            }
          >
            <OperationalDashboard />
          </Suspense>
        </TabsContent>{" "}
        <TabsContent value="executive" className="mt-6">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            }
          >
            <ExecutiveDashboard days={30} />
          </Suspense>
        </TabsContent>{" "}
        <TabsContent value="analytical" className="mt-6">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            }
          >
            <AnalyticalDashboard days={30} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}