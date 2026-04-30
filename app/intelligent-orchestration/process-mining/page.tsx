"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";
import PageTemplate from "@/components/PageTemplate";
import ProcessMiningVisualization from "@/components/intelligent-orchestration/ProcessMiningVisualization";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";
import ViewScopeSelector from "@/components/role-based/ViewScopeSelector";
import {
  generateMultiTenantCustomers,
  generateMultiTenantWarehouses,
} from "@/utils/mockDataGenerators";
import {
  ProcessMiningCase,
  ProcessVariant,
} from "@/types/intelligentOrchestration";
import { orchestrationEngine } from "@/data/intelligentOrchestrationEngine";
import { DataCaptureEvent } from "@/types/intelligentOrchestration";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

export default function ProcessMiningPage() {
  const { user } = useAuth();
  const { context } = useViewContext();
  const [customers] = useState(() =>
    generateMultiTenantCustomers(20, user?.tenantId || "tenant-1"),
  );
  const [warehouses] = useState(() => generateMultiTenantWarehouses(5));
  const [cases, setCases] = useState<ProcessMiningCase[]>([]);
  const [variants, setVariants] = useState<ProcessVariant[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalCases: 0,
    processVariants: 0,
    optimalVariants: 0,
    deviationsDetected: 0,
  });

  // Generate mock process mining data
  useEffect(() => {
    const generateMockData = async () => {
      setIsLoading(true);

      // Use demo data generator for better, more realistic data
      const {
        generateDemoProcessCases,
        generateDemoProcessVariants,
        isDemoModeEnabled,
      } = await import("@/lib/services/demo/demoDataService");

      if (isDemoModeEnabled()) {
        // Generate demo cases and variants
        const demoCases = generateDemoProcessCases("ORDER", 100);
        const demoVariants = generateDemoProcessVariants("ORDER");

        // Store demo cases in orchestration engine for compatibility
        for (const demoCase of demoCases) {
          await orchestrationEngine.captureBatch(
            demoCase.events.map((e: any) => ({
              id: e.id,
              sourceType: "WMS_TRANSACTION",
              sourceId: "WMS-001",
              sourceName: "Warehouse Management System",
              eventType: e.activity,
              eventCategory:
                e.activity.includes("ASN") || e.activity.includes("GRN")
                  ? "INBOUND"
                  : "OUTBOUND",
              timestamp: e.timestamp,
              data: {
                caseId: demoCase.caseId,
                orderId: `ORDER-${demoCase.caseId}`,
              },
              metadata: {
                tenantId: user?.tenantId || "tenant-1",
                customerId:
                  customers[Math.floor(Math.random() * customers.length)]?.id ||
                  "customer-1",
                warehouseId:
                  warehouses[Math.floor(Math.random() * warehouses.length)]
                    ?.id || "warehouse-1",
              },
              processed: false,
              version: "1.0",
            })),
          );
        }

        setCases(demoCases as ProcessMiningCase[]);
        setVariants(demoVariants as ProcessVariant[]);
        setIsLoading(false);
        return;
      }

      // Fallback to original mock data generation
      // Generate mock events
      const mockEvents: DataCaptureEvent[] = [];
      for (let i = 0; i < 50; i++) {
        const caseId = `CASE-${String(i + 1).padStart(6, "0")}`;
        const startTime = new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        );

        // Generate events for each case
        const eventTypes = [
          "ASN_RECEIVED",
          "GRN_ISSUED",
          "PUTAWAY_COMPLETE",
          "ORDER_PICKED",
          "ORDER_PACKED",
          "SHIPPED",
        ];
        eventTypes.forEach((eventType, index) => {
          const eventTime = new Date(
            startTime.getTime() +
              index * 3600 * 1000 +
              Math.random() * 2 * 3600 * 1000,
          );
          mockEvents.push({
            id: `event-${caseId}-${index}`,
            sourceType: "WMS_TRANSACTION",
            sourceId: "WMS-001",
            sourceName: "Warehouse Management System",
            eventType,
            eventCategory:
              eventType.includes("ASN") || eventType.includes("GRN")
                ? "INBOUND"
                : "OUTBOUND",
            timestamp: eventTime.toISOString(),
            data: {
              caseId,
              orderId: `ORDER-${i + 1}`,
              asnId: eventType.includes("ASN") ? `ASN-${i + 1}` : undefined,
              delay: Math.random() > 0.7 ? Math.random() * 3600 : 0,
            },
            metadata: {
              tenantId: user?.tenantId || "tenant-1",
              customerId:
                customers[Math.floor(Math.random() * customers.length)].id,
              warehouseId:
                warehouses[Math.floor(Math.random() * warehouses.length)].id,
            },
            processed: false,
            version: "1.0",
          });
        });
      }

      // Capture events
      await orchestrationEngine.captureBatch(mockEvents);

      // Discover processes
      const discoveredVariants =
        await orchestrationEngine.discoverProcess("ORDER");
      setVariants(discoveredVariants);

      // Get cases
      const allCases: ProcessMiningCase[] = [];
      for (let i = 0; i < 50; i++) {
        const caseId = `CASE-${String(i + 1).padStart(6, "0")}`;
        const case_ = await orchestrationEngine.analyzeCase(caseId);
        if (case_) {
          allCases.push(case_);
        }
      }
      setCases(allCases);

      setIsLoading(false);
    };

    generateMockData();
  }, [user?.tenantId, customers.length, warehouses.length]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled || cases.length === 0) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "process-mining-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "process-mining-stats",
      () => ({
        totalCases: simulateKPIUpdates(cases.length, 0),
        processVariants: simulateKPIUpdates(variants.length, 0),
        optimalVariants: simulateKPIUpdates(
          variants.filter((v) => v.isOptimal).length,
          0.1,
        ),
        deviationsDetected: simulateKPIUpdates(
          cases.reduce((sum, c) => sum + c.deviations.length, 0),
          0.1,
        ),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [realTimeEnabled, cases.length, variants.length]);

  // Simulate real-time case updates
  useEffect(() => {
    if (!realTimeEnabled || cases.length === 0) return;

    const interval = setInterval(async () => {
      // Simulate new case being processed
      if (Math.random() < 0.1) {
        const newCaseId = `CASE-${String(cases.length + 1).padStart(6, "0")}`;
        const newCase = await orchestrationEngine.analyzeCase(newCaseId);
        if (newCase) {
          setCases((prev) => [newCase, ...prev.slice(0, 49)]);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [realTimeEnabled, cases.length]);

  const stats = [
    {
      label: "Total Cases",
      value: realTimeEnabled ? realTimeStats.totalCases : cases.length,
      icon: "ri-file-list-line",
      tooltip: "Total process cases analyzed",
      trend: "up" as const,
    },
    {
      label: "Process Variants",
      value: realTimeEnabled ? realTimeStats.processVariants : variants.length,
      icon: "ri-flow-chart-line",
      tooltip: "Discovered process variants",
      trend: "up" as const,
    },
    {
      label: "Optimal Variants",
      value: realTimeEnabled
        ? realTimeStats.optimalVariants
        : variants.filter((v) => v.isOptimal).length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Optimal process variants",
      trend: "neutral" as const,
    },
    {
      label: "Deviations Detected",
      value: realTimeEnabled
        ? realTimeStats.deviationsDetected
        : cases.reduce((sum, c) => sum + c.deviations.length, 0),
      icon: "ri-alert-line",
      tooltip: "Total deviations detected",
      trend: "down" as const,
    },
  ];

  return (
    <PageTemplate
      title="Process Mining"
      description="Discover, analyze, and optimize business processes through AI-powered process mining. Automatically detect process variants, bottlenecks, deviations, and optimization opportunities from real-time event data."
      shortDescription="AI-powered process discovery and optimization"
      icon="ri-flow-chart-line"
      systemInfo={{
        sap: "Process Mining",
        oracle: "Process Discovery",
        manhattan: "Process Intelligence",
      }}
      examples={[
        "Automatically discover process variants from event logs",
        "Detect bottlenecks and inefficiencies in real-time",
        "Identify process deviations and exceptions",
        "Compare actual vs optimal process flows",
        "Predict process outcomes and risks",
        "Optimize processes based on data-driven insights",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <CustomerSelector
            customers={customers}
            className="min-w-[180px] sm:min-w-[200px]"
          />
          <ViewScopeSelector />
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#9ca3af]">Analyzing processes...</p>
          </div>
        </div>
      ) : (
        <ProcessMiningVisualization
          cases={cases}
          variants={variants}
          selectedCaseId={selectedCaseId}
          onCaseSelect={setSelectedCaseId}
        />
      )}
    </PageTemplate>
  );
}
