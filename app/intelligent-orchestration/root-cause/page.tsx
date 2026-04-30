"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";
import PageTemplate from "@/components/PageTemplate";
import RootCauseAnalysis from "@/components/intelligent-orchestration/RootCauseAnalysis";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";
import ViewScopeSelector from "@/components/role-based/ViewScopeSelector";
import { generateMultiTenantCustomers } from "@/utils/mockDataGenerators";
import { RootCause } from "@/types/intelligentOrchestration";
import { orchestrationEngine } from "@/data/intelligentOrchestrationEngine";

export default function RootCauseAnalysisPage() {
  const { user } = useAuth();
  const { context } = useViewContext();
  const [customers] = useState(() =>
    generateMultiTenantCustomers(20, user?.tenantId || "tenant-1"),
  );
  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate mock root cause data
  useEffect(() => {
    const generateMockData = async () => {
      setIsLoading(true);

      // Use demo data generator for better, more realistic data
      const { generateDemoRootCauses } =
        await import("@/lib/services/demo/demoDataService");
      const { isDemoModeEnabled } =
        await import("@/lib/services/demo/demoDataService");

      if (isDemoModeEnabled()) {
        const demoRootCauses = generateDemoRootCauses(20);
        setRootCauses(demoRootCauses as RootCause[]);
        setIsLoading(false);
        return;
      }

      // Fallback to orchestration engine
      const mockRootCauses: RootCause[] = [];
      const issueTypes = [
        "SLA_BREACH",
        "QUALITY_ISSUE",
        "DELAY",
        "COST_OVERRUN",
        "COMPLIANCE_VIOLATION",
      ];

      for (let i = 0; i < 15; i++) {
        const issueType =
          issueTypes[Math.floor(Math.random() * issueTypes.length)];
        const rootCause = await orchestrationEngine.analyzeRootCause(
          `ISSUE-${String(i + 1).padStart(6, "0")}`,
          issueType,
          {
            description: `Sample ${issueType} issue for demonstration`,
            severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][
              Math.floor(Math.random() * 4)
            ] as any,
          },
        );
        mockRootCauses.push(rootCause);
      }

      setRootCauses(mockRootCauses);
      setIsLoading(false);
    };

    generateMockData();
  }, []);

  const stats = [
    {
      label: "Total Analyses",
      value: rootCauses.length,
      icon: "ri-search-line",
      tooltip: "Total root cause analyses",
      trend: "up" as const,
    },
    {
      label: "Validated",
      value: rootCauses.filter((rc) => rc.validated).length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Validated root causes",
      trend: "up" as const,
    },
    {
      label: "Avg Confidence",
      value:
        rootCauses.length > 0
          ? Math.round(
              rootCauses.reduce((sum, rc) => sum + rc.confidence, 0) /
                rootCauses.length,
            )
          : 0,
      icon: "ri-target-line",
      tooltip: "Average confidence level",
      trend: "neutral" as const,
    },
    {
      label: "Avg Effectiveness",
      value:
        rootCauses.length > 0
          ? Math.round(
              rootCauses.reduce((sum, rc) => sum + rc.effectiveness, 0) /
                rootCauses.length,
            )
          : 0,
      icon: "ri-zap-line",
      tooltip: "Average action effectiveness",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="Root Cause Analysis"
      description="Automated root cause analysis using AI-powered techniques including 5 Whys, Fishbone diagrams, FMEA, and machine learning. Identify root causes, contributing factors, and recommended actions with high confidence."
      shortDescription="AI-powered automated root cause analysis"
      icon="ri-search-line"
      systemInfo={{
        sap: "Root Cause Analysis",
        oracle: "RCA Engine",
        manhattan: "Issue Analysis",
      }}
      examples={[
        "Automatically analyze issues using multiple methods",
        "Identify root causes and contributing factors",
        "Generate evidence-based recommendations",
        "Track action effectiveness and recurrence",
        "Find similar issues across the system",
        "Validate root causes with confidence scoring",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <CustomerSelector
            customers={customers}
            className="min-w-[180px] sm:min-w-[200px]"
          />
          <ViewScopeSelector />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#9ca3af]">Analyzing root causes...</p>
          </div>
        </div>
      ) : (
        <RootCauseAnalysis rootCauses={rootCauses} />
      )}
    </PageTemplate>
  );
}
