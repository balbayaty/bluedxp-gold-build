"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";
import PageTemplate from "@/components/PageTemplate";
import CommunicationOrchestrationComponent from "@/components/intelligent-orchestration/CommunicationOrchestration";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";
import ViewScopeSelector from "@/components/role-based/ViewScopeSelector";
import { generateMultiTenantCustomers } from "@/utils/mockDataGenerators";
import {
  CommunicationOrchestration,
  CommunicationLog,
  CommunicationTemplate,
  CommunicationChannel,
} from "@/types/intelligentOrchestration";
import { orchestrationEngine } from "@/data/intelligentOrchestrationEngine";

export default function CommunicationOrchestrationPage() {
  const { user } = useAuth();
  const { context } = useViewContext();
  const [customers] = useState(() =>
    generateMultiTenantCustomers(20, user?.tenantId || "tenant-1"),
  );
  const [orchestrations, setOrchestrations] = useState<
    CommunicationOrchestration[]
  >([]);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate mock communication data
  useEffect(() => {
    const generateMockData = async () => {
      setIsLoading(true);

      // Generate mock orchestrations
      const mockOrchestrations: CommunicationOrchestration[] = [
        {
          id: "orch-1",
          trigger: {
            type: "EVENT",
            eventType: "SLA_BREACH",
          },
          recipients: [
            {
              id: "rec-1",
              type: "ROLE",
              identifier: "WAREHOUSE_HEAD",
              channel: "WHATSAPP",
            },
            {
              id: "rec-2",
              type: "ROLE",
              identifier: "OPERATIONS_MANAGER",
              channel: "EMAIL",
            },
          ],
          channels: ["WHATSAPP", "EMAIL"],
          templates: ["alert-template"],
          conditions: [],
          priority: "HIGH",
          isActive: true,
          effectiveness: 85,
        },
        {
          id: "orch-2",
          trigger: {
            type: "SCHEDULE",
            schedule: "DAILY",
          },
          recipients: [
            {
              id: "rec-3",
              type: "CUSTOMER",
              identifier: "CUSTOMER-001",
              channel: "EMAIL",
            },
          ],
          channels: ["EMAIL"],
          templates: ["daily-report-template"],
          schedule: {
            frequency: "DAILY",
            time: "09:00",
            timezone: "UTC",
          },
          conditions: [],
          priority: "MEDIUM",
          isActive: true,
          effectiveness: 92,
        },
      ];

      setOrchestrations(mockOrchestrations);

      // Generate mock logs
      const mockLogs: CommunicationLog[] = [];
      const channels: CommunicationChannel[] = [
        "EMAIL",
        "WHATSAPP",
        "SMS",
        "PUSH_NOTIFICATION",
      ];
      const statuses: CommunicationLog["status"][] = [
        "SENT",
        "DELIVERED",
        "READ",
        "FAILED",
      ];

      for (let i = 0; i < 50; i++) {
        const channel = channels[Math.floor(Math.random() * channels.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const sentAt = new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        );

        mockLogs.push({
          id: `log-${i + 1}`,
          orchestrationId:
            mockOrchestrations[
              Math.floor(Math.random() * mockOrchestrations.length)
            ].id,
          recipient: {
            id: `rec-${i}`,
            type: "USER",
            identifier: `user-${i}`,
            channel,
          },
          channel,
          templateId: "template-1",
          message: `Sample communication message ${i + 1}`,
          sentAt: sentAt.toISOString(),
          deliveredAt:
            status === "DELIVERED" || status === "READ"
              ? new Date(
                  sentAt.getTime() + Math.random() * 300000,
                ).toISOString()
              : undefined,
          readAt:
            status === "READ"
              ? new Date(
                  sentAt.getTime() + Math.random() * 600000,
                ).toISOString()
              : undefined,
          status,
          metadata: {},
        });
      }

      setLogs(mockLogs);

      // Generate mock templates
      const mockTemplates: CommunicationTemplate[] = [
        {
          id: "alert-template",
          name: "Alert Template",
          description: "Template for alert notifications",
          channel: "WHATSAPP",
          template: "Alert: {{eventType}} detected at {{timestamp}}",
          variables: ["eventType", "timestamp"],
          conditions: [],
          priority: "HIGH",
          isActive: true,
        },
        {
          id: "daily-report-template",
          name: "Daily Report Template",
          description: "Template for daily reports",
          channel: "EMAIL",
          template: "Daily report for {{date}}",
          variables: ["date"],
          conditions: [],
          priority: "MEDIUM",
          isActive: true,
        },
      ];

      setTemplates(mockTemplates);
      setIsLoading(false);
    };

    generateMockData();
  }, []);

  const stats = [
    {
      label: "Total Communications",
      value: logs.length,
      icon: "ri-message-3-line",
      tooltip: "Total communications sent",
      trend: "up" as const,
    },
    {
      label: "Delivery Rate",
      value:
        logs.length > 0
          ? Math.round(
              (logs.filter(
                (l) => l.status === "DELIVERED" || l.status === "READ",
              ).length /
                logs.length) *
                100,
            )
          : 0,
      icon: "ri-checkbox-circle-line",
      tooltip: "Message delivery rate",
      trend: "up" as const,
    },
    {
      label: "Active Orchestrations",
      value: orchestrations.filter((o) => o.isActive).length,
      icon: "ri-settings-3-line",
      tooltip: "Active communication orchestrations",
      trend: "neutral" as const,
    },
    {
      label: "Templates",
      value: templates.length,
      icon: "ri-file-text-line",
      tooltip: "Communication templates",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Communication Orchestration"
      description="Intelligent communication orchestration across multiple channels (Email, WhatsApp, SMS, Voice, Push, In-App). Automatically route messages, personalize content, track delivery, and optimize communication effectiveness."
      shortDescription="Intelligent multi-channel communication"
      icon="ri-message-3-line"
      systemInfo={{
        sap: "Communication Management",
        oracle: "Message Orchestration",
        manhattan: "Communication Hub",
      }}
      examples={[
        "Orchestrate communications across multiple channels",
        "Automatically route messages based on context",
        "Personalize content using templates and variables",
        "Track delivery and read rates in real-time",
        "Optimize communication timing and channels",
        "A/B test message effectiveness",
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
            <p className="text-[#9ca3af]">Loading communications...</p>
          </div>
        </div>
      ) : (
        <CommunicationOrchestrationComponent
          orchestrations={orchestrations}
          logs={logs}
          templates={templates}
        />
      )}
    </PageTemplate>
  );
}
