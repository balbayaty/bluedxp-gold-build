"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";
import PageTemplate from "@/components/PageTemplate";
import SLAManager from "@/components/SLAManager";
import MultiPartySLAManager from "@/components/supply-chain/MultiPartySLAManager";
import SLAMockDataViewer from "@/components/supply-chain/SLAMockDataViewer";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";
import ViewScopeSelector from "@/components/role-based/ViewScopeSelector";
import {
  generateMultiTenantCustomers,
  generateMultiTenantWarehouses,
} from "@/utils/mockDataGenerators";
import { initializeSLAMockData } from "@/utils/slaMockDataGenerators";

export default function SLAManagement() {
  const { user } = useAuth();
  const { context } = useViewContext();
  const [customers] = useState(() =>
    generateMultiTenantCustomers(20, user?.tenantId || "tenant-1"),
  );
  const [warehouses] = useState(() => generateMultiTenantWarehouses(5));
  const [viewMode, setViewMode] = useState<
    "legacy" | "multi-party" | "mock-data"
  >("multi-party");

  // Initialize mock SLA data on mount
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      customers.length > 0 &&
      warehouses.length > 0
    ) {
      initializeSLAMockData(customers, warehouses);
    }
  }, [customers.length, warehouses.length]);

  const stats = [
    {
      label: "Total Customers",
      value: customers.length,
      icon: "ri-user-3-line",
      tooltip: "Total number of customers",
      trend: "up" as const,
    },
    {
      label: "Active SLAs",
      value: "0",
      icon: "ri-time-fill",
      tooltip: "Active SLA configurations",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="SLA Management"
      description="Configure and manage Service Level Agreements (SLAs) for all parties in the supply chain. Support for customers, warehouses, carriers, vendors, customs brokers, freight forwarders, and any supply chain stakeholder."
      shortDescription="Configure and manage SLAs for all supply chain parties"
      icon="ri-time-fill"
      systemInfo={{
        sap: "SLA Management",
        oracle: "SLA Configuration",
        manhattan: "SLA Management",
      }}
      examples={[
        "Create multi-party SLAs (Customer, Warehouse, Carrier, Vendor, etc.)",
        "Define SLA targets and metrics for any supply chain party",
        "Track SLA compliance across all stakeholders",
        "Configure intelligent SLA conditions and rules",
        "Monitor SLA performance with predictive analytics",
        "Generate comprehensive SLA reports",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <CustomerSelector
            customers={customers}
            className="min-w-[180px] sm:min-w-[200px]"
          />
          <ViewScopeSelector />
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode("multi-party")}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 min-h-[36px] ${
                viewMode === "multi-party"
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
              aria-label="Multi-party SLA view"
            >
              <i className="ri-global-line text-sm sm:text-base"></i>
              <span className="hidden sm:inline">Multi-Party</span>
            </button>
            <button
              onClick={() => setViewMode("legacy")}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 min-h-[36px] ${
                viewMode === "legacy"
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
              aria-label="Legacy SLA view"
            >
              <i className="ri-time-line text-sm sm:text-base"></i>
              <span className="hidden sm:inline">Legacy</span>
            </button>
            <button
              onClick={() => setViewMode("mock-data")}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 min-h-[36px] ${
                viewMode === "mock-data"
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
              aria-label="Mock data viewer"
            >
              <i className="ri-database-line text-sm sm:text-base"></i>
              <span className="hidden sm:inline">Mock Data</span>
            </button>
          </div>
        </div>
      }
    >
      {viewMode === "multi-party" ? (
        <div className="space-y-6">
          <MultiPartySLAManager />
        </div>
      ) : viewMode === "legacy" ? (
        <SLAManager />
      ) : (
        <SLAMockDataViewer />
      )}
    </PageTemplate>
  );
}
