"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";
import PageTemplate from "@/components/PageTemplate";
import AutonomousCompliance from "@/components/intelligent-orchestration/AutonomousCompliance";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";
import ViewScopeSelector from "@/components/role-based/ViewScopeSelector";
import { generateMultiTenantCustomers } from "@/utils/mockDataGenerators";
import {
  ComplianceRule,
  ComplianceViolation,
} from "@/types/intelligentOrchestration";
import { orchestrationEngine } from "@/data/intelligentOrchestrationEngine";

export default function AutonomousCompliancePage() {
  const { user } = useAuth();
  const { context } = useViewContext();
  const [customers] = useState(() =>
    generateMultiTenantCustomers(20, user?.tenantId || "tenant-1"),
  );
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate mock compliance data
  useEffect(() => {
    const generateMockData = async () => {
      setIsLoading(true);

      // Generate mock rules
      const mockRules: ComplianceRule[] = [
        {
          id: "rule-1",
          name: "ASN Receiving SLA",
          description:
            "ASN must be received and processed within 4 hours of arrival",
          ruleType: "SLA",
          ruleCategory: "INBOUND",
          conditions: [
            {
              id: "cond-1",
              field: "eventType",
              operator: "equals",
              value: "ASN_RECEIVED",
            },
          ],
          actions: [
            {
              id: "action-1",
              actionType: "ALERT",
              target: "WAREHOUSE_MANAGER",
              parameters: {
                message: "ASN receiving SLA at risk",
              },
            },
          ],
          isActive: true,
          priority: "HIGH",
          autoEnforce: true,
          escalationRules: [
            {
              id: "escalation-1",
              level: "WARNING",
              threshold: 80,
              actions: ["Notify warehouse manager"],
              timeframe: "Within 1 hour",
              stakeholders: ["WAREHOUSE_MANAGER"],
              autoTrigger: true,
            },
            {
              id: "escalation-2",
              level: "CRITICAL",
              threshold: 100,
              actions: ["Escalate to operations director"],
              timeframe: "Immediately",
              stakeholders: ["OPERATIONS_DIRECTOR"],
              autoTrigger: true,
            },
          ],
        },
        {
          id: "rule-2",
          name: "Order Fulfillment SLA",
          description: "Orders must be fulfilled within 24 hours",
          ruleType: "SLA",
          ruleCategory: "OUTBOUND",
          conditions: [
            {
              id: "cond-2",
              field: "eventType",
              operator: "equals",
              value: "ORDER_RECEIVED",
            },
          ],
          actions: [
            {
              id: "action-2",
              actionType: "ALERT",
              target: "OUTBOUND_MANAGER",
              parameters: {
                message: "Order fulfillment SLA at risk",
              },
            },
          ],
          isActive: true,
          priority: "HIGH",
          autoEnforce: true,
        },
        {
          id: "rule-3",
          name: "Quality Compliance",
          description: "All received goods must pass quality inspection",
          ruleType: "QUALITY",
          ruleCategory: "QUALITY",
          conditions: [
            {
              id: "cond-3",
              field: "qualityStatus",
              operator: "equals",
              value: "FAILED",
            },
          ],
          actions: [
            {
              id: "action-3",
              actionType: "BLOCK",
              target: "PUTAWAY",
              parameters: {
                message: "Quality inspection failed - block putaway",
              },
            },
          ],
          isActive: true,
          priority: "CRITICAL",
          autoEnforce: true,
        },
      ];

      setRules(mockRules);

      // Generate mock violations
      const mockViolations: ComplianceViolation[] = [];
      for (let i = 0; i < 20; i++) {
        const rule = mockRules[Math.floor(Math.random() * mockRules.length)];
        const detectedAt = new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        );
        const resolved = Math.random() > 0.4;

        mockViolations.push({
          id: `violation-${i + 1}`,
          ruleId: rule.id,
          ruleName: rule.name,
          caseId: `CASE-${i + 1}`,
          entityId: `ENTITY-${i + 1}`,
          entityType: rule.ruleCategory,
          violationType: ["BREACH", "AT_RISK", "WARNING", "EXCEPTION"][
            Math.floor(Math.random() * 4)
          ] as any,
          severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][
            Math.floor(Math.random() * 4)
          ] as any,
          detectedAt: detectedAt.toISOString(),
          resolved,
          resolvedAt: resolved
            ? new Date(
                detectedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000,
              ).toISOString()
            : undefined,
          resolvedBy: resolved
            ? `User ${Math.floor(Math.random() * 10) + 1}`
            : undefined,
          actions: rule.actions,
          impact: {
            duration: Math.random() * 3600,
            cost: Math.random() * 1000,
            quality: Math.random() * 10,
            reputation: Math.random() * 5,
          },
        });
      }

      setViolations(mockViolations);
      setIsLoading(false);
    };

    generateMockData();
  }, []);

  const handleViolationResolve = (violationId: string) => {
    setViolations((prev) =>
      prev.map((v) =>
        v.id === violationId
          ? {
              ...v,
              resolved: true,
              resolvedAt: new Date().toISOString(),
              resolvedBy: user?.name || "Current User",
            }
          : v,
      ),
    );
  };

  const stats = [
    {
      label: "Total Rules",
      value: rules.length,
      icon: "ri-file-list-line",
      tooltip: "Total compliance rules",
      trend: "up" as const,
    },
    {
      label: "Active Rules",
      value: rules.filter((r) => r.isActive).length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active compliance rules",
      trend: "neutral" as const,
    },
    {
      label: "Total Violations",
      value: violations.length,
      icon: "ri-alert-line",
      tooltip: "Total compliance violations",
      trend: "down" as const,
    },
    {
      label: "Resolution Rate",
      value:
        violations.length > 0
          ? Math.round(
              (violations.filter((v) => v.resolved).length /
                violations.length) *
                100,
            )
          : 0,
      icon: "ri-checkbox-circle-line",
      tooltip: "Violation resolution rate",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="Autonomous Compliance"
      description="Self-monitoring compliance system that automatically detects violations, enforces rules, and escalates issues. Real-time monitoring, auto-enforcement, and intelligent escalation for all compliance requirements."
      shortDescription="Self-monitoring compliance system with auto-enforcement"
      icon="ri-shield-check-line"
      systemInfo={{
        sap: "Compliance Management",
        oracle: "Compliance Monitoring",
        manhattan: "Compliance System",
      }}
      examples={[
        "Automatically detect compliance violations",
        "Auto-enforce compliance rules",
        "Intelligent escalation based on severity",
        "Real-time compliance monitoring",
        "Track violation resolution",
        "Generate compliance reports",
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
            <p className="text-[#9ca3af]">Loading compliance data...</p>
          </div>
        </div>
      ) : (
        <AutonomousCompliance
          rules={rules}
          violations={violations}
          onViolationResolve={handleViolationResolve}
        />
      )}
    </PageTemplate>
  );
}
