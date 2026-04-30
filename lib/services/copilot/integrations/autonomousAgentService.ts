/**
 * Autonomous Agent Service for Copilot
 * Enables full autopilot workflows with multi-step task execution
 * 5IR Aligned • Human-AI Collaboration • Self-Directed Intelligence
 */

import { eventBus } from "../../event-store";
import { createEvent } from "../../event-store/utils";
import { copilotMCP } from "./mcpIntegration";
import { copilotRealtimeData } from "./realtimeDataService";
import { copilotMLRegistry } from "./mlRegistryIntegration";
import { copilotMLFeedback } from "../mlFeedbackService";

// ============================================================================
// TYPES
// ============================================================================

export type AgentMode = "manual" | "assisted" | "supervised" | "autonomous";

export type WorkflowStatus = 
  | "pending"
  | "planning"
  | "executing"
  | "awaiting_approval"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  userId: string;
  
  // Workflow definition
  goal: string;
  steps: AgentStep[];
  currentStepIndex: number;
  
  // Execution
  status: WorkflowStatus;
  mode: AgentMode;
  
  // Results
  results: StepResult[];
  finalOutput?: any;
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Metadata
  context: Record<string, any>;
  learnings: WorkflowLearning[];
}

export interface AgentStep {
  id: string;
  name: string;
  type: "action" | "decision" | "verification" | "communication" | "analysis";
  description: string;
  
  // Execution details
  tool?: string;
  toolInput?: Record<string, any>;
  
  // Conditions
  condition?: string;
  dependsOn?: string[];
  
  // Approval
  requiresApproval: boolean;
  approvalMessage?: string;
  
  // Fallback
  fallbackStepId?: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface StepResult {
  stepId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  output?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  approved?: boolean;
  approvedBy?: string;
}

export interface WorkflowLearning {
  stepId: string;
  observation: string;
  outcome: "success" | "failure" | "partial";
  improvement?: string;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: "data" | "action" | "communication" | "analysis" | "creation";
  examples: string[];
}

// ============================================================================
// AUTONOMOUS AGENT SERVICE
// ============================================================================

class AutonomousAgentService {
  private workflows: Map<string, AgentWorkflow> = new Map();
  private capabilities: AgentCapability[] = [];

  constructor() {
    this.initializeCapabilities();
  }

  /**
   * Initialize agent capabilities - Comprehensive platform coverage
   * Includes: WMS, TMS, ISO-IMS, QHSE, Compliance, Proposals, Trade, MaaS
   */
  private initializeCapabilities(): void {
    this.capabilities = [
      // ========================================================================
      // WMS - WAREHOUSE MANAGEMENT CAPABILITIES
      // ========================================================================
      {
        id: "cap.wms.inventory",
        name: "Inventory Management",
        description: "Access, analyze, and manage inventory data across warehouses",
        category: "data",
        examples: [
          "Check stock levels for SKU-12345",
          "Find items expiring in the next 30 days",
          "Generate inventory turnover report",
          "Run ABC analysis on warehouse inventory",
          "Find slow-moving items",
        ],
      },
      {
        id: "cap.wms.receiving",
        name: "Receiving & Inbound",
        description: "Manage ASNs, receiving, and putaway operations",
        category: "action",
        examples: [
          "Create an ASN for incoming shipment",
          "Process receiving for PO-12345",
          "Generate putaway list",
          "Validate received quantities",
        ],
      },
      {
        id: "cap.wms.picking",
        name: "Picking & Packing",
        description: "Manage picking, packing, and order fulfillment",
        category: "action",
        examples: [
          "Generate pick list for today's orders",
          "Optimize picking routes",
          "Create wave picking batch",
          "Pack order ORD-12345",
        ],
      },
      {
        id: "cap.wms.locations",
        name: "Location Management",
        description: "Manage warehouse zones, locations, and slotting",
        category: "data",
        examples: [
          "Show available locations in Zone A",
          "Optimize slotting for fast-moving items",
          "Find empty bin locations",
        ],
      },

      // ========================================================================
      // TMS - TRANSPORTATION MANAGEMENT CAPABILITIES
      // ========================================================================
      {
        id: "cap.tms.shipments",
        name: "Shipment Tracking",
        description: "Track and manage shipments from creation to delivery",
        category: "data",
        examples: [
          "Track shipment SHP-2024-001",
          "Find delayed shipments",
          "Calculate shipping costs",
          "Show all in-transit shipments",
        ],
      },
      {
        id: "cap.tms.routing",
        name: "Route Optimization",
        description: "Optimize delivery routes and carrier selection",
        category: "analysis",
        examples: [
          "Optimize today's delivery routes",
          "Compare carrier rates for this shipment",
          "Plan multi-stop route",
        ],
      },
      {
        id: "cap.tms.carriers",
        name: "Carrier Management",
        description: "Manage carrier relationships and performance",
        category: "data",
        examples: [
          "Show carrier performance metrics",
          "Compare carrier delivery times",
          "Get carrier rate quotes",
        ],
      },

      // ========================================================================
      // ISO-IMS - INTEGRATED MANAGEMENT SYSTEM CAPABILITIES
      // ========================================================================
      {
        id: "cap.iso.documents",
        name: "Document Control",
        description: "Manage ISO documents, SOPs, and controlled documents",
        category: "data",
        examples: [
          "Find all SOPs for receiving process",
          "Show documents pending review",
          "Create new SOP version",
          "List expired documents",
        ],
      },
      {
        id: "cap.iso.capa",
        name: "CAPA Management",
        description: "Create and manage Corrective/Preventive Actions",
        category: "action",
        examples: [
          "Create a CAPA for quality issue",
          "Show open CAPAs by priority",
          "Track CAPA effectiveness",
          "Generate CAPA report",
          "Escalate overdue CAPAs",
        ],
      },
      {
        id: "cap.iso.audits",
        name: "Audit Management",
        description: "Plan, execute, and track internal and external audits",
        category: "action",
        examples: [
          "Schedule internal audit for next month",
          "Generate audit checklist for ISO 9001",
          "Track audit findings",
          "Create audit report",
        ],
      },
      {
        id: "cap.iso.nonconformance",
        name: "Non-Conformance Management",
        description: "Track and resolve non-conformances and deviations",
        category: "action",
        examples: [
          "Log new non-conformance",
          "Show open NCRs by department",
          "Analyze NC trends",
          "Close NCR with corrective action",
        ],
      },
      {
        id: "cap.iso.training",
        name: "Training Management",
        description: "Manage training records, certifications, and competencies",
        category: "data",
        examples: [
          "Show overdue training for team",
          "Generate training matrix",
          "Track certification expiry dates",
          "Assign training to new employee",
        ],
      },
      {
        id: "cap.iso.management_review",
        name: "Management Review",
        description: "Prepare and conduct management reviews",
        category: "analysis",
        examples: [
          "Prepare management review inputs",
          "Generate KPI dashboard for review",
          "Track action items from last review",
        ],
      },

      // ========================================================================
      // QHSE - QUALITY, HEALTH, SAFETY & ENVIRONMENT CAPABILITIES
      // ========================================================================
      {
        id: "cap.qhse.incidents",
        name: "Incident Management",
        description: "Report, investigate, and track safety incidents",
        category: "action",
        examples: [
          "Report new safety incident",
          "Show incidents by severity",
          "Generate incident investigation report",
          "Track incident KPIs",
          "Analyze incident root causes",
        ],
      },
      {
        id: "cap.qhse.risk",
        name: "Risk Assessment",
        description: "Conduct and manage risk assessments",
        category: "analysis",
        examples: [
          "Create risk assessment for new process",
          "Show high-risk activities",
          "Update risk register",
          "Generate risk matrix",
        ],
      },
      {
        id: "cap.qhse.inspections",
        name: "Safety Inspections",
        description: "Schedule and conduct safety inspections and audits",
        category: "action",
        examples: [
          "Schedule weekly safety inspection",
          "Generate inspection checklist",
          "Track inspection findings",
          "Show overdue inspections",
        ],
      },
      {
        id: "cap.qhse.permits",
        name: "Permit to Work",
        description: "Manage work permits for hazardous activities",
        category: "action",
        examples: [
          "Create hot work permit",
          "Show active permits",
          "Close out completed permits",
          "Track permit violations",
        ],
      },
      {
        id: "cap.qhse.environmental",
        name: "Environmental Management",
        description: "Track environmental metrics and compliance",
        category: "data",
        examples: [
          "Show carbon footprint report",
          "Track waste disposal records",
          "Generate environmental KPIs",
          "Monitor emissions data",
        ],
      },
      {
        id: "cap.qhse.msds",
        name: "MSDS/SDS Management",
        description: "Manage Material Safety Data Sheets",
        category: "data",
        examples: [
          "Find MSDS for chemical XYZ",
          "Show expired MSDS records",
          "Update MSDS database",
          "Generate chemical inventory report",
        ],
      },

      // ========================================================================
      // COMPLIANCE CAPABILITIES
      // ========================================================================
      {
        id: "cap.compliance.regulatory",
        name: "Regulatory Compliance",
        description: "Track and ensure regulatory compliance",
        category: "analysis",
        examples: [
          "Check FDA compliance status",
          "Generate compliance report",
          "Track regulatory changes",
          "Show compliance gaps",
        ],
      },
      {
        id: "cap.compliance.trade",
        name: "Trade Compliance",
        description: "Manage import/export compliance and customs",
        category: "data",
        examples: [
          "Check HS code for product",
          "Validate export license requirements",
          "Screen against denied party lists",
          "Calculate duties and taxes",
        ],
      },
      {
        id: "cap.compliance.certifications",
        name: "Certifications Management",
        description: "Track and maintain certifications and accreditations",
        category: "data",
        examples: [
          "Show expiring certifications",
          "Track ISO certification status",
          "Generate certification report",
        ],
      },

      // ========================================================================
      // PROPOSALS & RFQ CAPABILITIES
      // ========================================================================
      {
        id: "cap.proposals.create",
        name: "Proposal Creation",
        description: "Create and manage proposals and quotations",
        category: "creation",
        examples: [
          "Create proposal for customer ABC",
          "Generate quote from template",
          "Calculate proposal pricing",
          "Add terms and conditions",
        ],
      },
      {
        id: "cap.proposals.rfq",
        name: "RFQ Management",
        description: "Manage Request for Quotations and bids",
        category: "action",
        examples: [
          "Create RFQ for suppliers",
          "Compare bid responses",
          "Award RFQ to winner",
          "Track RFQ deadlines",
        ],
      },

      // ========================================================================
      // ORDERS CAPABILITIES
      // ========================================================================
      {
        id: "cap.orders.sales",
        name: "Sales Orders",
        description: "View, create, and manage sales orders",
        category: "data",
        examples: [
          "Show pending orders for today",
          "Create new sales order",
          "Track order status",
          "Generate order confirmation",
        ],
      },
      {
        id: "cap.orders.purchase",
        name: "Purchase Orders",
        description: "Create and manage purchase orders",
        category: "action",
        examples: [
          "Create purchase order for supplier",
          "Show open POs by vendor",
          "Track PO receipts",
          "Generate reorder suggestions",
        ],
      },

      // ========================================================================
      // GENERAL PLATFORM CAPABILITIES
      // ========================================================================
      {
        id: "cap.action.create",
        name: "Document Creation",
        description: "Create ASNs, orders, shipments, reports, and other documents",
        category: "action",
        examples: [
          "Create an ASN for incoming shipment",
          "Generate a CAPA for quality issue",
          "Create a purchase order",
        ],
      },
      {
        id: "cap.action.workflow",
        name: "Workflow Automation",
        description: "Trigger and manage automated workflows",
        category: "action",
        examples: [
          "Start receiving workflow",
          "Trigger quality inspection",
          "Initiate shipment processing",
          "Run approval workflow",
        ],
      },
      {
        id: "cap.action.navigation",
        name: "System Navigation",
        description: "Navigate to any page or feature in the platform",
        category: "action",
        examples: [
          "Go to dashboard",
          "Open inventory management",
          "Navigate to compliance settings",
          "Show CAPA management page",
        ],
      },

      // Communication Capabilities
      {
        id: "cap.comm.notify",
        name: "Notifications",
        description: "Send notifications and alerts to users and teams",
        category: "communication",
        examples: [
          "Notify warehouse team about incoming shipment",
          "Alert supervisor about critical issue",
          "Send daily summary email",
        ],
      },
      {
        id: "cap.comm.collaborate",
        name: "Collaboration",
        description: "Facilitate communication between teams and stakeholders",
        category: "communication",
        examples: [
          "Share report with management",
          "Request approval from supervisor",
          "Coordinate with carrier",
        ],
      },

      // Analysis Capabilities
      {
        id: "cap.analysis.insights",
        name: "Data Insights",
        description: "Analyze data and generate actionable insights",
        category: "analysis",
        examples: [
          "Analyze sales trends",
          "Identify optimization opportunities",
          "Predict demand for next month",
        ],
      },
      {
        id: "cap.analysis.compliance",
        name: "Compliance Check",
        description: "Verify compliance with regulations and standards",
        category: "analysis",
        examples: [
          "Check regulatory compliance",
          "Verify quality standards",
          "Audit safety procedures",
        ],
      },

      // Creation Capabilities
      {
        id: "cap.create.report",
        name: "Report Generation",
        description: "Generate comprehensive reports and analytics",
        category: "creation",
        examples: [
          "Generate monthly performance report",
          "Create inventory valuation report",
          "Build custom dashboard",
        ],
      },
      {
        id: "cap.create.document",
        name: "Document Generation",
        description: "Create and format business documents",
        category: "creation",
        examples: [
          "Draft proposal document",
          "Generate shipping labels",
          "Create evidence packet",
        ],
      },
    ];
  }

  /**
   * Get all agent capabilities
   */
  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  /**
   * Plan a workflow from a goal
   */
  async planWorkflow(
    goal: string,
    context: {
      tenantId: string;
      userId: string;
      mode: AgentMode;
      moduleContext?: string;
    }
  ): Promise<AgentWorkflow> {
    const workflowId = `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Use ML to get recommendations for this goal
    const recommendations = await copilotMLRegistry.getRecommendations(
      context.tenantId,
      goal,
      { moduleId: context.moduleContext }
    );

    // Generate steps based on goal analysis
    const steps = await this.generateSteps(goal, recommendations);

    const workflow: AgentWorkflow = {
      id: workflowId,
      name: `Workflow: ${goal.substring(0, 50)}`,
      description: goal,
      tenantId: context.tenantId,
      userId: context.userId,
      goal,
      steps,
      currentStepIndex: 0,
      status: "pending",
      mode: context.mode,
      results: [],
      createdAt: new Date(),
      context: {
        moduleContext: context.moduleContext,
        recommendations,
      },
      learnings: [],
    };

    this.workflows.set(workflowId, workflow);

    // Publish workflow created event
    await eventBus.publish(
      createEvent(
        "agent.workflow_created",
        context.tenantId,
        "AgentWorkflow",
        {
          workflowId,
          goal,
          stepCount: steps.length,
          mode: context.mode,
        },
        1,
        { tenantId: context.tenantId, userId: context.userId }
      )
    ).catch(err => console.warn("[AutonomousAgent] Failed to publish event:", err));

    console.log(`[AutonomousAgent] 📋 Workflow planned: ${workflowId} with ${steps.length} steps`);

    return workflow;
  }

  /**
   * Generate workflow steps from goal
   */
  private async generateSteps(
    goal: string,
    recommendations: any[]
  ): Promise<AgentStep[]> {
    const lowerGoal = goal.toLowerCase();
    const steps: AgentStep[] = [];

    // Analyze goal and generate appropriate steps
    if (lowerGoal.includes("create") && lowerGoal.includes("asn")) {
      steps.push(
        {
          id: "step-1",
          name: "Gather ASN Information",
          type: "analysis",
          description: "Collect required information for ASN creation",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Validate Supplier/Vendor",
          type: "verification",
          description: "Verify supplier exists and is active",
          tool: "wms.asn.validate_supplier",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Create ASN Record",
          type: "action",
          description: "Create the ASN in the system",
          tool: "wms.asn.create",
          requiresApproval: true,
          approvalMessage: "Ready to create ASN. Proceed?",
          dependsOn: ["step-2"],
        },
        {
          id: "step-4",
          name: "Generate Documentation",
          type: "action",
          description: "Generate ASN documentation and labels",
          tool: "wms.asn.generate_docs",
          dependsOn: ["step-3"],
          requiresApproval: false,
        },
        {
          id: "step-5",
          name: "Notify Stakeholders",
          type: "communication",
          description: "Send notifications to warehouse and receiving team",
          tool: "mcp.notify.send",
          dependsOn: ["step-3"],
          requiresApproval: false,
        }
      );
    } 
    // ========================================================================
    // INCIDENT MANAGEMENT WORKFLOWS (must be before generic "report")
    // ========================================================================
    else if (lowerGoal.includes("incident") && (lowerGoal.includes("report") || lowerGoal.includes("create") || lowerGoal.includes("log") || lowerGoal.includes("new"))) {
      steps.push(
        {
          id: "step-1",
          name: "Gather Incident Details",
          type: "analysis",
          description: "Collect all relevant incident information",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Assess Severity",
          type: "analysis",
          description: "Determine incident severity and classification",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Create Incident Report",
          type: "action",
          description: "Create the incident record in the system",
          tool: "qhse.incident.create",
          requiresApproval: true,
          approvalMessage: "Ready to file incident report. Proceed?",
          dependsOn: ["step-1", "step-2"],
        },
        {
          id: "step-4",
          name: "Immediate Actions",
          type: "action",
          description: "Document any immediate containment actions taken",
          dependsOn: ["step-3"],
          requiresApproval: false,
        },
        {
          id: "step-5",
          name: "Notify Safety Team",
          type: "communication",
          description: "Alert safety personnel and management if required",
          tool: "mcp.notify.send",
          dependsOn: ["step-3"],
          requiresApproval: false,
        },
        {
          id: "step-6",
          name: "Create Follow-up CAPA",
          type: "decision",
          description: "Determine if a CAPA is needed and create if required",
          tool: "iso-ims.capa.create",
          dependsOn: ["step-3"],
          requiresApproval: true,
          approvalMessage: "Create a CAPA for this incident?",
        }
      );
    }
    // ========================================================================
    // GENERIC REPORT/ANALYSIS WORKFLOWS
    // ========================================================================
    else if ((lowerGoal.includes("report") && !lowerGoal.includes("incident")) || lowerGoal.includes("analysis")) {
      steps.push(
        {
          id: "step-1",
          name: "Identify Data Sources",
          type: "analysis",
          description: "Determine which data sources are needed",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Gather Data",
          type: "action",
          description: "Collect data from identified sources",
          tool: "analytics.dashboard.summary",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Analyze Data",
          type: "analysis",
          description: "Process and analyze the collected data",
          tool: "analytics.insights.generate",
          dependsOn: ["step-2"],
          requiresApproval: false,
        },
        {
          id: "step-4",
          name: "Generate Report",
          type: "action",
          description: "Create the final report document",
          tool: "analytics.report.generate",
          dependsOn: ["step-3"],
          requiresApproval: true,
          approvalMessage: "Ready to generate report. Proceed?",
        }
      );
    } else if (lowerGoal.includes("track") || lowerGoal.includes("status")) {
      steps.push(
        {
          id: "step-1",
          name: "Identify Item",
          type: "analysis",
          description: "Identify the item to track",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Fetch Status",
          type: "action",
          description: "Get current status from system",
          tool: "tms.shipment.track",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Present Results",
          type: "communication",
          description: "Display tracking information to user",
          dependsOn: ["step-2"],
          requiresApproval: false,
        }
      );
    } 
    // ========================================================================
    // CAPA WORKFLOWS
    // ========================================================================
    else if (lowerGoal.includes("capa") && (lowerGoal.includes("create") || lowerGoal.includes("new"))) {
      steps.push(
        {
          id: "step-1",
          name: "Identify Root Cause",
          type: "analysis",
          description: "Analyze and identify the root cause of the issue",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Assess Impact",
          type: "analysis",
          description: "Evaluate the severity and impact of the issue",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Create CAPA Record",
          type: "action",
          description: "Create the CAPA in the system with root cause and corrective actions",
          tool: "iso-ims.capa.create",
          requiresApproval: true,
          approvalMessage: "Ready to create CAPA. Review details and proceed?",
          dependsOn: ["step-1", "step-2"],
        },
        {
          id: "step-4",
          name: "Assign Owner",
          type: "action",
          description: "Assign responsible person and set due dates",
          tool: "iso-ims.capa.assign",
          dependsOn: ["step-3"],
          requiresApproval: false,
        },
        {
          id: "step-5",
          name: "Notify Stakeholders",
          type: "communication",
          description: "Send notifications to relevant parties",
          tool: "mcp.notify.send",
          dependsOn: ["step-3"],
          requiresApproval: false,
        }
      );
    }
    // ========================================================================
    // AUDIT WORKFLOWS
    // ========================================================================
    else if (lowerGoal.includes("audit") && (lowerGoal.includes("schedule") || lowerGoal.includes("plan") || lowerGoal.includes("create"))) {
      steps.push(
        {
          id: "step-1",
          name: "Define Audit Scope",
          type: "analysis",
          description: "Determine the scope, criteria, and objectives",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Select Auditors",
          type: "action",
          description: "Assign qualified auditors to the audit",
          requiresApproval: true,
          approvalMessage: "Confirm auditor selection?",
        },
        {
          id: "step-3",
          name: "Create Audit Plan",
          type: "action",
          description: "Create the audit plan with schedule and checklist",
          tool: "iso-ims.audit.create",
          dependsOn: ["step-1", "step-2"],
          requiresApproval: true,
          approvalMessage: "Ready to create audit plan. Proceed?",
        },
        {
          id: "step-4",
          name: "Generate Checklist",
          type: "action",
          description: "Generate audit checklist based on standards",
          tool: "iso-ims.audit.checklist",
          dependsOn: ["step-3"],
          requiresApproval: false,
        },
        {
          id: "step-5",
          name: "Notify Auditees",
          type: "communication",
          description: "Send audit notification to affected departments",
          tool: "mcp.notify.send",
          dependsOn: ["step-3"],
          requiresApproval: false,
        }
      );
    }
    // ========================================================================
    // RISK ASSESSMENT WORKFLOWS
    // ========================================================================
    else if (lowerGoal.includes("risk") && (lowerGoal.includes("assessment") || lowerGoal.includes("analyze"))) {
      steps.push(
        {
          id: "step-1",
          name: "Identify Hazards",
          type: "analysis",
          description: "Identify all potential hazards and risks",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Assess Likelihood & Severity",
          type: "analysis",
          description: "Evaluate probability and potential impact of each risk",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Determine Risk Level",
          type: "analysis",
          description: "Calculate risk scores and prioritize",
          dependsOn: ["step-1", "step-2"],
          requiresApproval: false,
        },
        {
          id: "step-4",
          name: "Develop Controls",
          type: "action",
          description: "Define control measures for high-risk items",
          dependsOn: ["step-3"],
          requiresApproval: true,
          approvalMessage: "Review and approve control measures?",
        },
        {
          id: "step-5",
          name: "Create Risk Assessment Record",
          type: "action",
          description: "Document the risk assessment",
          tool: "qhse.risk.create",
          dependsOn: ["step-4"],
          requiresApproval: false,
        },
        {
          id: "step-6",
          name: "Update Risk Register",
          type: "action",
          description: "Add risks to the master risk register",
          tool: "qhse.risk.register",
          dependsOn: ["step-5"],
          requiresApproval: false,
        }
      );
    }
    // ========================================================================
    // INSPECTION WORKFLOWS
    // ========================================================================
    else if (lowerGoal.includes("inspection") && (lowerGoal.includes("create") || lowerGoal.includes("schedule") || lowerGoal.includes("conduct"))) {
      steps.push(
        {
          id: "step-1",
          name: "Define Inspection Scope",
          type: "analysis",
          description: "Determine what areas/equipment to inspect",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Generate Inspection Checklist",
          type: "action",
          description: "Create or retrieve appropriate checklist",
          tool: "qhse.inspection.checklist",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Schedule Inspection",
          type: "action",
          description: "Set date, time, and assign inspector",
          tool: "qhse.inspection.schedule",
          dependsOn: ["step-2"],
          requiresApproval: true,
          approvalMessage: "Confirm inspection schedule?",
        },
        {
          id: "step-4",
          name: "Notify Relevant Parties",
          type: "communication",
          description: "Inform area managers of upcoming inspection",
          tool: "mcp.notify.send",
          dependsOn: ["step-3"],
          requiresApproval: false,
        }
      );
    }
    // ========================================================================
    // NON-CONFORMANCE WORKFLOWS
    // ========================================================================
    else if ((lowerGoal.includes("non-conformance") || lowerGoal.includes("ncr") || lowerGoal.includes("nc ")) && (lowerGoal.includes("create") || lowerGoal.includes("log"))) {
      steps.push(
        {
          id: "step-1",
          name: "Document Non-Conformance",
          type: "analysis",
          description: "Capture details of the non-conformance",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Immediate Containment",
          type: "action",
          description: "Define and implement immediate containment actions",
          requiresApproval: true,
          approvalMessage: "Approve containment actions?",
        },
        {
          id: "step-3",
          name: "Create NCR Record",
          type: "action",
          description: "Create the non-conformance record",
          tool: "iso-ims.ncr.create",
          dependsOn: ["step-1", "step-2"],
          requiresApproval: false,
        },
        {
          id: "step-4",
          name: "Root Cause Analysis",
          type: "analysis",
          description: "Determine the root cause of the non-conformance",
          dependsOn: ["step-3"],
          requiresApproval: false,
        },
        {
          id: "step-5",
          name: "Determine Disposition",
          type: "decision",
          description: "Decide on rework, scrap, or accept as-is",
          dependsOn: ["step-4"],
          requiresApproval: true,
          approvalMessage: "Approve disposition decision?",
        },
        {
          id: "step-6",
          name: "Create CAPA if Required",
          type: "decision",
          description: "Determine if a CAPA is needed for systemic issues",
          tool: "iso-ims.capa.create",
          dependsOn: ["step-4"],
          requiresApproval: true,
          approvalMessage: "Create a CAPA for this NCR?",
        }
      );
    }
    // ========================================================================
    // PROPOSAL/QUOTE WORKFLOWS
    // ========================================================================
    else if ((lowerGoal.includes("proposal") || lowerGoal.includes("quote") || lowerGoal.includes("quotation")) && (lowerGoal.includes("create") || lowerGoal.includes("new"))) {
      steps.push(
        {
          id: "step-1",
          name: "Gather Requirements",
          type: "analysis",
          description: "Collect customer requirements and specifications",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Calculate Pricing",
          type: "analysis",
          description: "Determine pricing based on requirements",
          tool: "proposals.pricing.calculate",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Draft Proposal",
          type: "creation",
          description: "Create the proposal document",
          tool: "proposals.create",
          dependsOn: ["step-1", "step-2"],
          requiresApproval: true,
          approvalMessage: "Review draft proposal before finalizing?",
        },
        {
          id: "step-4",
          name: "Add Terms & Conditions",
          type: "action",
          description: "Include relevant terms and conditions",
          dependsOn: ["step-3"],
          requiresApproval: false,
        },
        {
          id: "step-5",
          name: "Generate PDF",
          type: "action",
          description: "Generate final proposal document",
          tool: "proposals.generate_pdf",
          dependsOn: ["step-4"],
          requiresApproval: false,
        },
        {
          id: "step-6",
          name: "Send to Customer",
          type: "communication",
          description: "Email proposal to customer",
          tool: "mcp.notify.send",
          dependsOn: ["step-5"],
          requiresApproval: true,
          approvalMessage: "Send proposal to customer?",
        }
      );
    }
    // ========================================================================
    // COMPLIANCE CHECK WORKFLOWS
    // ========================================================================
    else if (lowerGoal.includes("compliance") && (lowerGoal.includes("check") || lowerGoal.includes("verify") || lowerGoal.includes("audit"))) {
      steps.push(
        {
          id: "step-1",
          name: "Identify Requirements",
          type: "analysis",
          description: "Determine applicable regulations and standards",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Run Compliance Check",
          type: "action",
          description: "Execute automated compliance verification",
          tool: "compliance.check",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Identify Gaps",
          type: "analysis",
          description: "Analyze results and identify compliance gaps",
          dependsOn: ["step-2"],
          requiresApproval: false,
        },
        {
          id: "step-4",
          name: "Generate Compliance Report",
          type: "creation",
          description: "Create comprehensive compliance report",
          tool: "analytics.report.generate",
          dependsOn: ["step-3"],
          requiresApproval: true,
          approvalMessage: "Generate compliance report?",
        },
        {
          id: "step-5",
          name: "Create Action Items",
          type: "action",
          description: "Create CAPAs or tasks for non-compliant items",
          tool: "iso-ims.capa.create",
          dependsOn: ["step-3"],
          requiresApproval: true,
          approvalMessage: "Create action items for gaps?",
        }
      );
    }
    // ========================================================================
    // PURCHASE ORDER WORKFLOWS
    // ========================================================================
    else if ((lowerGoal.includes("purchase order") || lowerGoal.includes("po ") || lowerGoal.includes("reorder")) && (lowerGoal.includes("create") || lowerGoal.includes("new"))) {
      steps.push(
        {
          id: "step-1",
          name: "Identify Requirements",
          type: "analysis",
          description: "Determine items and quantities needed",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Select Supplier",
          type: "decision",
          description: "Choose the best supplier based on criteria",
          requiresApproval: true,
          approvalMessage: "Confirm supplier selection?",
        },
        {
          id: "step-3",
          name: "Create Purchase Order",
          type: "action",
          description: "Create the PO in the system",
          tool: "orders.po.create",
          dependsOn: ["step-1", "step-2"],
          requiresApproval: true,
          approvalMessage: "Approve purchase order creation?",
        },
        {
          id: "step-4",
          name: "Send to Supplier",
          type: "communication",
          description: "Send PO to the selected supplier",
          tool: "mcp.notify.send",
          dependsOn: ["step-3"],
          requiresApproval: false,
        },
        {
          id: "step-5",
          name: "Create Expected ASN",
          type: "action",
          description: "Create expected receiving record",
          tool: "wms.asn.create",
          dependsOn: ["step-3"],
          requiresApproval: false,
        }
      );
    }
    // ========================================================================
    // MANAGEMENT REVIEW WORKFLOWS
    // ========================================================================
    else if (lowerGoal.includes("management review") && (lowerGoal.includes("prepare") || lowerGoal.includes("create") || lowerGoal.includes("conduct"))) {
      steps.push(
        {
          id: "step-1",
          name: "Gather Input Data",
          type: "analysis",
          description: "Collect all required inputs for management review",
          tool: "analytics.dashboard.summary",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Generate KPI Report",
          type: "creation",
          description: "Create KPI and performance metrics report",
          tool: "analytics.report.generate",
          dependsOn: ["step-1"],
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Compile CAPA Status",
          type: "analysis",
          description: "Summarize open and closed CAPAs",
          tool: "iso-ims.capa.list",
          dependsOn: ["step-1"],
          requiresApproval: false,
        },
        {
          id: "step-4",
          name: "Create Review Package",
          type: "creation",
          description: "Compile all inputs into review package",
          dependsOn: ["step-2", "step-3"],
          requiresApproval: true,
          approvalMessage: "Review package ready. Proceed?",
        },
        {
          id: "step-5",
          name: "Schedule Meeting",
          type: "communication",
          description: "Send calendar invites to management team",
          tool: "mcp.notify.send",
          dependsOn: ["step-4"],
          requiresApproval: true,
          approvalMessage: "Send meeting invitations?",
        }
      );
    } else {
      // Default workflow for generic goals
      steps.push(
        {
          id: "step-1",
          name: "Analyze Request",
          type: "analysis",
          description: "Understand and break down the request",
          requiresApproval: false,
        },
        {
          id: "step-2",
          name: "Gather Information",
          type: "action",
          description: "Collect necessary information",
          tool: "platform.search",
          requiresApproval: false,
        },
        {
          id: "step-3",
          name: "Execute Task",
          type: "action",
          description: "Perform the main task",
          dependsOn: ["step-2"],
          requiresApproval: true,
          approvalMessage: "Ready to execute. Proceed?",
        },
        {
          id: "step-4",
          name: "Verify Results",
          type: "verification",
          description: "Verify the task was completed successfully",
          dependsOn: ["step-3"],
          requiresApproval: false,
        }
      );
    }

    return steps;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string): Promise<AgentWorkflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.status = "executing";
    workflow.startedAt = new Date();

    console.log(`[AutonomousAgent] 🚀 Starting workflow: ${workflowId}`);

    try {
      for (let i = workflow.currentStepIndex; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        workflow.currentStepIndex = i;

        // Check dependencies
        if (step.dependsOn) {
          const dependenciesMet = step.dependsOn.every(depId => {
            const depResult = workflow.results.find(r => r.stepId === depId);
            return depResult && depResult.status === "completed";
          });

          if (!dependenciesMet) {
            console.log(`[AutonomousAgent] ⏸️ Dependencies not met for step: ${step.name}`);
            continue;
          }
        }

        // Check if approval is needed
        if (step.requiresApproval && workflow.mode !== "autonomous") {
          workflow.status = "awaiting_approval";
          
          console.log(`[AutonomousAgent] ⏳ Awaiting approval for step: ${step.name}`);
          
          // In production, this would wait for real approval
          // For demo, we auto-approve in supervised mode
          if (workflow.mode === "supervised") {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Execute step
        const result = await this.executeStep(workflow, step);
        workflow.results.push(result);

        if (result.status === "failed") {
          // Check for fallback
          if (step.fallbackStepId) {
            console.log(`[AutonomousAgent] 🔄 Executing fallback for step: ${step.name}`);
          } else if ((step.retryCount || 0) < (step.maxRetries || 0)) {
            step.retryCount = (step.retryCount || 0) + 1;
            i--; // Retry same step
          } else {
            workflow.status = "failed";
            break;
          }
        }

        // Record learning
        workflow.learnings.push({
          stepId: step.id,
          observation: `Step "${step.name}" executed`,
          outcome: result.status === "completed" ? "success" : "failure",
        });
      }

      if (workflow.status === "executing") {
        workflow.status = "completed";
        workflow.completedAt = new Date();

        // Compile final output
        workflow.finalOutput = {
          success: true,
          results: workflow.results,
          summary: `Completed ${workflow.results.filter(r => r.status === "completed").length}/${workflow.steps.length} steps`,
        };
      }

    } catch (error: any) {
      workflow.status = "failed";
      console.error(`[AutonomousAgent] ❌ Workflow failed: ${workflowId}`, error);
    }

    // Publish workflow completed event
    await eventBus.publish(
      createEvent(
        "agent.workflow_completed",
        workflow.tenantId,
        "AgentWorkflow",
        {
          workflowId,
          status: workflow.status,
          stepsCompleted: workflow.results.filter(r => r.status === "completed").length,
          totalSteps: workflow.steps.length,
        },
        1,
        { tenantId: workflow.tenantId, userId: workflow.userId }
      )
    ).catch(err => console.warn("[AutonomousAgent] Failed to publish event:", err));

    console.log(`[AutonomousAgent] ✅ Workflow ${workflow.status}: ${workflowId}`);

    return workflow;
  }

  /**
   * Execute a single step
   */
  private async executeStep(workflow: AgentWorkflow, step: AgentStep): Promise<StepResult> {
    const result: StepResult = {
      stepId: step.id,
      status: "running",
      startedAt: new Date(),
    };

    try {
      // Execute tool if specified
      if (step.tool) {
        const execution = await copilotMCP.executeTool(
          step.tool,
          step.toolInput || {},
          {
            tenantId: workflow.tenantId,
            userId: workflow.userId,
            skipApproval: workflow.mode === "autonomous",
          }
        );

        result.output = execution.output;
        result.status = execution.status === "completed" ? "completed" : "failed";
        result.error = execution.error;
      } else {
        // Simulated step execution
        await new Promise(resolve => setTimeout(resolve, 100));
        result.status = "completed";
        result.output = { message: `Step "${step.name}" completed` };
      }

    } catch (error: any) {
      result.status = "failed";
      result.error = error.message;
    }

    result.completedAt = new Date();
    return result;
  }

  /**
   * Approve a pending workflow step
   */
  async approveStep(
    workflowId: string,
    stepId: string,
    approvedBy: string,
    approved: boolean
  ): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      return false;
    }

    if (approved) {
      workflow.status = "executing";
      // Continue execution from this step
      setTimeout(() => this.executeWorkflow(workflowId), 0);
    } else {
      workflow.status = "cancelled";
      workflow.results.push({
        stepId,
        status: "skipped",
        approved: false,
        approvedBy,
      });
    }

    return true;
  }

  /**
   * Get workflow status
   */
  getWorkflow(workflowId: string): AgentWorkflow | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Get all workflows for a tenant
   */
  getWorkflows(tenantId: string): AgentWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(w => w.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancel a workflow
   */
  cancelWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    workflow.status = "cancelled";
    workflow.completedAt = new Date();
    return true;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const autonomousAgent = new AutonomousAgentService();
export default autonomousAgent;
