/**
 * Advanced Workflow Templates Library
 * Pre-built workflow templates with categories and marketplace
 * More advanced than ServiceNow and Power Automate
 */

import type { Workflow, WorkflowStep } from "./workflowService";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  workflow: Partial<Workflow>;
  author: string;
  version: string;
  rating: number; // 0-5
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    entityTypes: string[];
    complexity: "simple" | "moderate" | "complex";
    estimatedSetupTime: string;
    prerequisites?: string[];
  };
  preview?: {
    screenshot?: string;
    demo?: string;
  };
}

export type TemplateCategory =
  | "approval"
  | "notification"
  | "integration"
  | "data-processing"
  | "automation"
  | "compliance"
  | "reporting"
  | "custom";

export interface TemplateSearchFilters {
  category?: TemplateCategory;
  tags?: string[];
  entityType?: string;
  complexity?: "simple" | "moderate" | "complex";
  minRating?: number;
  searchQuery?: string;
}

export class AdvancedTemplateLibrary {
  private templates: Map<string, WorkflowTemplate> = new Map();
  private categories: Map<TemplateCategory, WorkflowTemplate[]> = new Map();

  /**
   * Initialize with default templates
   */
  initialize(): void {
    // Approval templates
    this.registerTemplate(this.createApprovalTemplate());
    this.registerTemplate(this.createMultiLevelApprovalTemplate());
    this.registerTemplate(this.createMSDSReviewApprovalTemplate());

    // Notification templates
    this.registerTemplate(this.createEmailNotificationTemplate());
    this.registerTemplate(this.createSMSNotificationTemplate());

    // Integration templates
    this.registerTemplate(this.createAPIIntegrationTemplate());
    this.registerTemplate(this.createWebhookTemplate());

    // Automation templates
    this.registerTemplate(this.createDataSyncTemplate());
    this.registerTemplate(this.createReportGenerationTemplate());

    // Compliance templates
    this.registerTemplate(this.createAuditTrailTemplate());
    this.registerTemplate(this.createComplianceCheckTemplate());

    // Transportation / TMS templates
    this.registerTemplate(this.createTransportationIncidentResponseTemplate());

    console.log(
      `✅ Template library initialized with ${this.templates.size} templates`,
    );
  }

  /**
   * Register template
   */
  registerTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);

    // Add to category
    if (!this.categories.has(template.category)) {
      this.categories.set(template.category, []);
    }
    this.categories.get(template.category)!.push(template);

    console.log(`✅ Registered template: ${template.name}`);
  }

  /**
   * Get template
   */
  getTemplate(templateId: string): WorkflowTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Search templates
   */
  searchTemplates(filters: TemplateSearchFilters = {}): WorkflowTemplate[] {
    let results = Array.from(this.templates.values());

    // Filter by category
    if (filters.category) {
      results = results.filter((t) => t.category === filters.category);
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((t) =>
        filters.tags!.some((tag) => t.tags.includes(tag)),
      );
    }

    // Filter by entity type
    if (filters.entityType) {
      results = results.filter((t) =>
        t.metadata.entityTypes.includes(filters.entityType!),
      );
    }

    // Filter by complexity
    if (filters.complexity) {
      results = results.filter(
        (t) => t.metadata.complexity === filters.complexity,
      );
    }

    // Filter by rating
    if (filters.minRating) {
      results = results.filter((t) => t.rating >= filters.minRating!);
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Sort by rating and usage
    return results.sort((a, b) => {
      const scoreA = a.rating * 0.7 + (a.usageCount / 100) * 0.3;
      const scoreB = b.rating * 0.7 + (b.usageCount / 100) * 0.3;
      return scoreB - scoreA;
    });
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): WorkflowTemplate[] {
    return this.categories.get(category) || [];
  }

  /**
   * Get popular templates
   */
  getPopularTemplates(limit: number = 10): WorkflowTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Get recommended templates
   */
  getRecommendedTemplates(
    entityType: string,
    limit: number = 5,
  ): WorkflowTemplate[] {
    return this.searchTemplates({ entityType })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Instantiate template
   */
  async instantiateTemplate(
    templateId: string,
    customizations?: {
      name?: string;
      steps?: Partial<WorkflowStep>[];
      triggers?: any[];
    },
  ): Promise<Workflow> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Increment usage count
    template.usageCount++;

    // Create workflow from template
    const workflow: Workflow = {
      id: `wf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: customizations?.name || `${template.name} (Instance)`,
      description: template.description,
      steps:
        (customizations?.steps as WorkflowStep[]) ||
        template.workflow.steps ||
        [],
      triggers: customizations?.triggers || template.workflow.triggers || [],
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return workflow;
  }

  /**
   * Rate template
   */
  rateTemplate(templateId: string, rating: number): void {
    const template = this.templates.get(templateId);
    if (!template) return;

    // Update rating (weighted average)
    const totalRatings = template.usageCount;
    template.rating =
      (template.rating * totalRatings + rating) / (totalRatings + 1);
  }

  /**
   * Create approval template
   */
  private createApprovalTemplate(): WorkflowTemplate {
    return {
      id: "template-approval-single",
      name: "Single Approval Workflow",
      description: "Simple approval workflow with one approver",
      category: "approval",
      tags: ["approval", "simple", "single-approver"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Submit for Approval",
            type: "action",
            config: { action: "submit" },
            position: { x: 100, y: 100 },
            connections: ["step-2"],
          },
          {
            id: "step-2",
            name: "Approve",
            type: "approval",
            config: { approver: "${approver}" },
            position: { x: 300, y: 100 },
            connections: ["step-3"],
          },
          {
            id: "step-3",
            name: "Notify",
            type: "notification",
            config: { notification: "approved" },
            position: { x: 500, y: 100 },
            connections: [],
          },
        ],
        triggers: [{ event: "workflow.triggered", conditions: {} }],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.5,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["SALES_ORDER", "PURCHASE_ORDER"],
        complexity: "simple",
        estimatedSetupTime: "5 minutes",
      },
    };
  }

  /**
   * Create multi-level approval template
   */
  private createMultiLevelApprovalTemplate(): WorkflowTemplate {
    return {
      id: "template-approval-multi",
      name: "Multi-Level Approval Workflow",
      description: "Approval workflow with multiple approval levels",
      category: "approval",
      tags: ["approval", "multi-level", "complex"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Submit",
            type: "action",
            config: { action: "submit" },
            position: { x: 100, y: 100 },
            connections: ["step-2"],
          },
          {
            id: "step-2",
            name: "Level 1 Approval",
            type: "approval",
            config: { approver: "${level1Approver}" },
            position: { x: 300, y: 100 },
            connections: ["step-3"],
          },
          {
            id: "step-3",
            name: "Level 2 Approval",
            type: "approval",
            config: { approver: "${level2Approver}" },
            position: { x: 500, y: 100 },
            connections: ["step-4"],
          },
          {
            id: "step-4",
            name: "Final Approval",
            type: "approval",
            config: { approver: "${finalApprover}" },
            position: { x: 700, y: 100 },
            connections: ["step-5"],
          },
          {
            id: "step-5",
            name: "Notify",
            type: "notification",
            config: { notification: "approved" },
            position: { x: 900, y: 100 },
            connections: [],
          },
        ],
        triggers: [
          {
            event: "workflow.triggered",
            conditions: { amount: { $gt: 10000 } },
          },
        ],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.8,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["SALES_ORDER", "PURCHASE_ORDER"],
        complexity: "complex",
        estimatedSetupTime: "15 minutes",
      },
    };
  }

  /**
   * Create MSDS review/approval template (tenant-safe; triggers via msds.* events)
   */
  private createMSDSReviewApprovalTemplate(): WorkflowTemplate {
    return {
      id: "template-msds-review-approval",
      name: "MSDS Review & Approval",
      description:
        "Automates MSDS extraction → compliance check → human approval → publish/notify",
      category: "approval",
      tags: ["msds", "chemical", "compliance", "approval"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Extract & Normalize",
            type: "action",
            config: { action: "msds.extract" },
            position: { x: 100, y: 120 },
            connections: ["step-2"],
          },
          {
            id: "step-2",
            name: "Compliance Check",
            type: "action",
            config: { action: "msds.compliance_check" },
            position: { x: 300, y: 120 },
            connections: ["step-3"],
          },
          {
            id: "step-3",
            name: "Human Approval",
            type: "approval",
            config: { approver: "${approver}" },
            position: { x: 520, y: 120 },
            connections: ["step-4"],
          },
          {
            id: "step-4",
            name: "Publish for Modules",
            type: "action",
            config: { action: "msds.publish" },
            position: { x: 720, y: 120 },
            connections: ["step-5"],
          },
          {
            id: "step-5",
            name: "Notify Stakeholders",
            type: "notification",
            config: { notification: "msds.approved" },
            position: { x: 920, y: 120 },
            connections: [],
          },
        ],
        triggers: [{ event: "msds.uploaded", conditions: {} }],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.8,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["MSDS"],
        complexity: "moderate",
        estimatedSetupTime: "15 minutes",
        prerequisites: ["MSDS module enabled", "Tenant context enabled"],
      },
    };
  }

  /**
   * Transportation: Control Tower Incident Response
   *
   * This is intentionally “production-shaped”:
   * - Triage (assign/label)
   * - Notify stakeholders
   * - Evidence packet verification step (tamper-evident)
   * - Resolution approval
   * - Postmortem report (learning loop)
   */
  private createTransportationIncidentResponseTemplate(): WorkflowTemplate {
    return {
      id: "template-transportation-incident-response",
      name: "Transportation Incident Response (Control Tower)",
      description:
        "Automates incident triage → notifications → evidence packet verification → resolution approval → postmortem",
      category: "automation",
      tags: [
        "transportation",
        "tms",
        "incident",
        "control-tower",
        "evidence",
        "sla",
        "operations",
      ],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Triage & Assign Owner",
            type: "action",
            config: {
              action: "transportation.incident.triage",
              owner: "${owner}",
              priority: "${priority}",
            },
            position: { x: 100, y: 120 },
            connections: ["step-2"],
          },
          {
            id: "step-2",
            name: "Notify Carrier & Customer",
            type: "notification",
            config: {
              notification: "transportation.incident.notify",
              channels: ["email", "sms"],
            },
            position: { x: 320, y: 120 },
            connections: ["step-3"],
          },
          {
            id: "step-3",
            name: "Verify Evidence Packet Integrity",
            type: "action",
            config: {
              action: "evidence.packet.verify",
              packetId: "${packetId}",
            },
            position: { x: 560, y: 120 },
            connections: ["step-4"],
          },
          {
            id: "step-4",
            name: "Resolution Approval",
            type: "approval",
            config: { approver: "${approver}" },
            position: { x: 800, y: 120 },
            connections: ["step-5"],
          },
          {
            id: "step-5",
            name: "Generate Postmortem (Lessons Learned)",
            type: "action",
            config: { action: "transportation.incident.postmortem" },
            position: { x: 1020, y: 120 },
            connections: [],
          },
        ],
        triggers: [
          {
            event: "transportation.control_tower.incident.created",
            conditions: {},
          },
        ],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.9,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: [
          "TRANSPORTATION_INCIDENT",
          "SHIPMENT",
          "CUSTOMS_DECLARATION",
        ],
        complexity: "moderate",
        estimatedSetupTime: "5 minutes",
        prerequisites: [
          "Transportation module enabled",
          "Tenant context enabled",
          "Evidence service enabled",
        ],
      },
    };
  }

  /**
   * Create email notification template
   */
  private createEmailNotificationTemplate(): WorkflowTemplate {
    return {
      id: "template-notification-email",
      name: "Email Notification",
      description: "Send email notification on event",
      category: "notification",
      tags: ["notification", "email", "simple"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Send Email",
            type: "notification",
            config: {
              notification: "email",
              to: "${recipient}",
              subject: "${subject}",
              body: "${body}",
            },
            position: { x: 100, y: 100 },
            connections: [],
          },
        ],
        triggers: [{ event: "lifecycle.stage_transitioned", conditions: {} }],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.2,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["*"],
        complexity: "simple",
        estimatedSetupTime: "2 minutes",
      },
    };
  }

  /**
   * Create SMS notification template
   */
  private createSMSNotificationTemplate(): WorkflowTemplate {
    return {
      id: "template-notification-sms",
      name: "SMS Notification",
      description: "Send SMS notification on event",
      category: "notification",
      tags: ["notification", "sms", "mobile"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Send SMS",
            type: "notification",
            config: {
              notification: "sms",
              to: "${phoneNumber}",
              message: "${message}",
            },
            position: { x: 100, y: 100 },
            connections: [],
          },
        ],
        triggers: [{ event: "lifecycle.stage_transitioned", conditions: {} }],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.0,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["*"],
        complexity: "simple",
        estimatedSetupTime: "2 minutes",
      },
    };
  }

  /**
   * Create API integration template
   */
  private createAPIIntegrationTemplate(): WorkflowTemplate {
    return {
      id: "template-integration-api",
      name: "API Integration",
      description: "Call external API and process response",
      category: "integration",
      tags: ["integration", "api", "rest"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Call API",
            type: "integration",
            config: {
              integration: "rest",
              method: "POST",
              url: "${apiUrl}",
              headers: {},
              body: "${payload}",
            },
            position: { x: 100, y: 100 },
            connections: ["step-2"],
          },
          {
            id: "step-2",
            name: "Process Response",
            type: "action",
            config: { action: "process_response" },
            position: { x: 300, y: 100 },
            connections: [],
          },
        ],
        triggers: [{ event: "workflow.triggered", conditions: {} }],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.3,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["*"],
        complexity: "moderate",
        estimatedSetupTime: "10 minutes",
      },
    };
  }

  /**
   * Create webhook template
   */
  private createWebhookTemplate(): WorkflowTemplate {
    return {
      id: "template-integration-webhook",
      name: "Webhook Integration",
      description: "Trigger webhook on event",
      category: "integration",
      tags: ["integration", "webhook", "simple"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Trigger Webhook",
            type: "integration",
            config: {
              integration: "webhook",
              url: "${webhookUrl}",
              method: "POST",
              payload: "${data}",
            },
            position: { x: 100, y: 100 },
            connections: [],
          },
        ],
        triggers: [{ event: "lifecycle.stage_transitioned", conditions: {} }],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.1,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["*"],
        complexity: "simple",
        estimatedSetupTime: "3 minutes",
      },
    };
  }

  /**
   * Create data sync template
   */
  private createDataSyncTemplate(): WorkflowTemplate {
    return {
      id: "template-automation-data-sync",
      name: "Data Synchronization",
      description: "Synchronize data between systems",
      category: "automation",
      tags: ["automation", "data-sync", "integration"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Fetch Source Data",
            type: "action",
            config: { action: "fetch_data", source: "${source}" },
            position: { x: 100, y: 100 },
            connections: ["step-2"],
          },
          {
            id: "step-2",
            name: "Transform Data",
            type: "action",
            config: { action: "transform" },
            position: { x: 300, y: 100 },
            connections: ["step-3"],
          },
          {
            id: "step-3",
            name: "Sync to Target",
            type: "integration",
            config: { integration: "sync", target: "${target}" },
            position: { x: 500, y: 100 },
            connections: [],
          },
        ],
        triggers: [{ event: "schedule.daily", conditions: {} }],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.5,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["*"],
        complexity: "moderate",
        estimatedSetupTime: "15 minutes",
      },
    };
  }

  /**
   * Create report generation template
   */
  private createReportGenerationTemplate(): WorkflowTemplate {
    return {
      id: "template-automation-report",
      name: "Automated Report Generation",
      description: "Generate and distribute reports automatically",
      category: "automation",
      tags: ["automation", "reporting", "scheduled"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Collect Data",
            type: "action",
            config: { action: "collect_data" },
            position: { x: 100, y: 100 },
            connections: ["step-2"],
          },
          {
            id: "step-2",
            name: "Generate Report",
            type: "action",
            config: { action: "generate_report", format: "${format}" },
            position: { x: 300, y: 100 },
            connections: ["step-3"],
          },
          {
            id: "step-3",
            name: "Distribute",
            type: "notification",
            config: { notification: "email", attachment: "report" },
            position: { x: 500, y: 100 },
            connections: [],
          },
        ],
        triggers: [{ event: "schedule.weekly", conditions: {} }],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.4,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["*"],
        complexity: "moderate",
        estimatedSetupTime: "20 minutes",
      },
    };
  }

  /**
   * Create audit trail template
   */
  private createAuditTrailTemplate(): WorkflowTemplate {
    return {
      id: "template-compliance-audit",
      name: "Audit Trail",
      description: "Maintain comprehensive audit trail",
      category: "compliance",
      tags: ["compliance", "audit", "logging"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Log Event",
            type: "action",
            config: { action: "audit_log", level: "info" },
            position: { x: 100, y: 100 },
            connections: [],
          },
        ],
        triggers: [
          { event: "lifecycle.stage_transitioned", conditions: {} },
          { event: "workflow.executed", conditions: {} },
        ],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.6,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["*"],
        complexity: "simple",
        estimatedSetupTime: "5 minutes",
      },
    };
  }

  /**
   * Create compliance check template
   */
  private createComplianceCheckTemplate(): WorkflowTemplate {
    return {
      id: "template-compliance-check",
      name: "Compliance Check",
      description: "Automated compliance validation",
      category: "compliance",
      tags: ["compliance", "validation", "check"],
      workflow: {
        steps: [
          {
            id: "step-1",
            name: "Run Compliance Check",
            type: "action",
            config: { action: "compliance_check", rules: "${rules}" },
            position: { x: 100, y: 100 },
            connections: ["step-2"],
          },
          {
            id: "step-2",
            name: "Check Result",
            type: "condition",
            config: { condition: '${result} === "pass"' },
            position: { x: 300, y: 100 },
            connections: ["step-3", "step-4"],
          },
          {
            id: "step-3",
            name: "Approve",
            type: "action",
            config: { action: "approve" },
            position: { x: 500, y: 50 },
            connections: [],
          },
          {
            id: "step-4",
            name: "Reject",
            type: "action",
            config: { action: "reject", reason: "Compliance check failed" },
            position: { x: 500, y: 150 },
            connections: [],
          },
        ],
        triggers: [
          {
            event: "lifecycle.stage_transitioned",
            conditions: { stageId: "compliance" },
          },
        ],
      },
      author: "system",
      version: "1.0.0",
      rating: 4.7,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        entityTypes: ["SALES_ORDER", "PURCHASE_ORDER"],
        complexity: "moderate",
        estimatedSetupTime: "15 minutes",
      },
    };
  }

  /**
   * Get all templates
   */
  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template count
   */
  getTemplateCount(): number {
    return this.templates.size;
  }
}

// Singleton instance
export const templateLibrary = new AdvancedTemplateLibrary();

// Initialize on import
templateLibrary.initialize();

export default templateLibrary;
