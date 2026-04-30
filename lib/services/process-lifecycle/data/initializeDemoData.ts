/**
 * Process Lifecycle Demo Data Initializer
 * Populates the system with realistic sample data to demonstrate all features
 *
 * This initializes:
 * - Lifecycle configurations
 * - Sample entities with lifecycles
 * - Stage transitions
 * - Process mining events
 * - Analytics data
 */

import { lifecycleService } from "../lifecycle/lifecycleService";
import { workflowService } from "../workflow/workflowService";
import { processMiningService } from "../process-mining/processMiningService";
import { processOrchestrator } from "../core/processOrchestrator";
import { initializeLifecycleSystem } from "../lifecycle/configurations/initialize";
import type { EntityType } from "@/types/lifecycle";

// ============================================================================
// DEMO DATA TYPES
// ============================================================================

interface DemoEntity {
  id: string;
  entityType: EntityType;
  name: string;
  stages: string[]; // Stage IDs to transition through
  createdAt: Date;
  metadata: Record<string, any>;
}

// ============================================================================
// DEMO ENTITIES
// ============================================================================

const DEMO_ASNS: DemoEntity[] = [
  {
    id: "ASN-2025-001",
    entityType: "ASN",
    name: "Samsung Electronics - Electronics Components",
    stages: [
      "ASN_CREATED",
      "ASN_VALIDATED",
      "RECEIVING_SCHEDULED",
      "IN_TRANSIT",
      "ARRIVED_AT_DOCK",
      "RECEIVING_IN_PROGRESS",
      "PUTAWAY_REQUIRED",
      "PUTAWAY_IN_PROGRESS",
      "PUTAWAY_COMPLETED",
      "GOODS_RECEIPT_POSTED",
      "ASN_COMPLETED",
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    metadata: {
      vendorId: "V001",
      vendorName: "Samsung Electronics",
      poNumber: "PO-2025-001",
      items: 150,
      value: 125000,
    },
  },
  {
    id: "ASN-2025-002",
    entityType: "ASN",
    name: "SABIC - Chemical Materials",
    stages: [
      "ASN_CREATED",
      "ASN_VALIDATED",
      "RECEIVING_SCHEDULED",
      "IN_TRANSIT",
      "ARRIVED_AT_DOCK",
      "RECEIVING_IN_PROGRESS",
      "QUALITY_INSPECTION",
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    metadata: {
      vendorId: "V002",
      vendorName: "SABIC",
      poNumber: "PO-2025-002",
      items: 50,
      value: 85000,
      hazardous: true,
    },
  },
  {
    id: "ASN-2025-003",
    entityType: "ASN",
    name: "Aramco Logistics - Industrial Parts",
    stages: [
      "ASN_CREATED",
      "ASN_VALIDATED",
      "RECEIVING_SCHEDULED",
      "IN_TRANSIT",
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    metadata: {
      vendorId: "V003",
      vendorName: "Aramco Logistics",
      poNumber: "PO-2025-003",
      items: 200,
      value: 250000,
    },
  },
  {
    id: "ASN-2025-004",
    entityType: "ASN",
    name: "Almarai - Food Products",
    stages: ["ASN_CREATED", "ASN_VALIDATED"],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    metadata: {
      vendorId: "V004",
      vendorName: "Almarai",
      poNumber: "PO-2025-004",
      items: 500,
      value: 35000,
      temperatureControlled: true,
    },
  },
  {
    id: "ASN-2025-005",
    entityType: "ASN",
    name: "STC - Telecom Equipment",
    stages: ["ASN_CREATED"],
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    metadata: {
      vendorId: "V005",
      vendorName: "STC",
      poNumber: "PO-2025-005",
      items: 75,
      value: 180000,
    },
  },
];

const DEMO_TASKS: DemoEntity[] = [
  {
    id: "TASK-2025-001",
    entityType: "TASK",
    name: "Picking - Order SO-2025-100",
    stages: [
      "TASK_CREATED",
      "TASK_ASSIGNED",
      "TASK_STARTED",
      "TASK_IN_PROGRESS",
      "TASK_COMPLETED",
      "TASK_VERIFIED",
      "TASK_CLOSED",
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    metadata: {
      taskType: "PICKING",
      orderId: "SO-2025-100",
      assignedTo: "Ahmed Al-Hassan",
      items: 25,
    },
  },
  {
    id: "TASK-2025-002",
    entityType: "TASK",
    name: "Putaway - ASN-2025-001",
    stages: [
      "TASK_CREATED",
      "TASK_ASSIGNED",
      "TASK_STARTED",
      "TASK_IN_PROGRESS",
      "TASK_COMPLETED",
    ],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    metadata: {
      taskType: "PUTAWAY",
      asnId: "ASN-2025-001",
      assignedTo: "Mohammed Al-Rashid",
      items: 50,
    },
  },
  {
    id: "TASK-2025-003",
    entityType: "TASK",
    name: "Cycle Count - Zone A",
    stages: [
      "TASK_CREATED",
      "TASK_ASSIGNED",
      "TASK_STARTED",
      "TASK_IN_PROGRESS",
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    metadata: {
      taskType: "CYCLE_COUNT",
      zone: "A",
      assignedTo: "Khalid Al-Fahad",
      locations: 15,
    },
  },
  {
    id: "TASK-2025-004",
    entityType: "TASK",
    name: "Picking - Order SO-2025-101",
    stages: ["TASK_CREATED", "TASK_ASSIGNED"],
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    metadata: {
      taskType: "PICKING",
      orderId: "SO-2025-101",
      assignedTo: "Ali Al-Sharif",
      items: 12,
    },
  },
];

const DEMO_PICKINGS: DemoEntity[] = [
  {
    id: "PICK-2025-001",
    entityType: "PICKING",
    name: "Wave W-001 Pick Task 1",
    stages: [
      "PICK_RELEASED",
      "PICK_ASSIGNED",
      "PICKING_STARTED",
      "PICKING_IN_PROGRESS",
      "PICKING_COMPLETED",
      "PICK_VERIFIED",
      "READY_FOR_PACKING",
    ],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    metadata: {
      waveId: "W-001",
      orderId: "SO-2025-100",
      picker: "Ahmed Al-Hassan",
      items: 25,
      accuracy: 100,
    },
  },
  {
    id: "PICK-2025-002",
    entityType: "PICKING",
    name: "Wave W-001 Pick Task 2",
    stages: [
      "PICK_RELEASED",
      "PICK_ASSIGNED",
      "PICKING_STARTED",
      "PICKING_IN_PROGRESS",
      "PICKING_COMPLETED",
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    metadata: {
      waveId: "W-001",
      orderId: "SO-2025-102",
      picker: "Fahad Al-Otaibi",
      items: 18,
      accuracy: 98,
    },
  },
  {
    id: "PICK-2025-003",
    entityType: "PICKING",
    name: "Wave W-002 Pick Task 1",
    stages: [
      "PICK_RELEASED",
      "PICK_ASSIGNED",
      "PICKING_STARTED",
      "PICKING_IN_PROGRESS",
    ],
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    metadata: {
      waveId: "W-002",
      orderId: "SO-2025-103",
      picker: "Omar Al-Said",
      items: 30,
    },
  },
];

const DEMO_CYCLE_COUNTS: DemoEntity[] = [
  {
    id: "CC-2025-001",
    entityType: "CYCLE_COUNT",
    name: "Monthly Cycle Count - Zone A",
    stages: [
      "CYCLE_COUNT_PLANNED",
      "CYCLE_COUNT_ASSIGNED",
      "COUNTING_IN_PROGRESS",
      "COUNTING_COMPLETED",
      "RECONCILIATION_REQUIRED",
      "RECONCILIATION_COMPLETED",
      "INVENTORY_ADJUSTED",
      "CYCLE_COUNT_CLOSED",
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    metadata: { zone: "A", locations: 50, accuracy: 99.2, discrepancies: 4 },
  },
  {
    id: "CC-2025-002",
    entityType: "CYCLE_COUNT",
    name: "Monthly Cycle Count - Zone B",
    stages: [
      "CYCLE_COUNT_PLANNED",
      "CYCLE_COUNT_ASSIGNED",
      "COUNTING_IN_PROGRESS",
      "COUNTING_COMPLETED",
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    metadata: { zone: "B", locations: 35, accuracy: 99.8, discrepancies: 1 },
  },
];

const DEMO_GOODS_RECEIPTS: DemoEntity[] = [
  {
    id: "GR-2025-001",
    entityType: "GOODS_RECEIPT",
    name: "Goods Receipt - ASN-2025-001",
    stages: [
      "GR_CREATED",
      "DOCK_ASSIGNED",
      "RECEIVING_STARTED",
      "RECEIVING_IN_PROGRESS",
      "RECEIVING_COMPLETED",
      "GR_POSTED",
    ],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    metadata: {
      asnId: "ASN-2025-001",
      dock: "DOCK-A1",
      items: 150,
      postedBy: "System",
    },
  },
  {
    id: "GR-2025-002",
    entityType: "GOODS_RECEIPT",
    name: "Goods Receipt - ASN-2025-002",
    stages: [
      "GR_CREATED",
      "DOCK_ASSIGNED",
      "RECEIVING_STARTED",
      "RECEIVING_IN_PROGRESS",
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    metadata: { asnId: "ASN-2025-002", dock: "DOCK-B2", items: 50 },
  },
];

const DEMO_WAVES: DemoEntity[] = [
  {
    id: "WAVE-2025-001",
    entityType: "WAVE",
    name: "Morning Wave - Jan 27",
    stages: [
      "WAVE_CREATED",
      "WAVE_PLANNED",
      "WAVE_APPROVED",
      "PICK_TASKS_CREATED",
      "WAVE_RELEASED",
      "WAVE_COMPLETED",
    ],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    metadata: { orders: 15, items: 250, pickers: 5 },
  },
  {
    id: "WAVE-2025-002",
    entityType: "WAVE",
    name: "Afternoon Wave - Jan 27",
    stages: [
      "WAVE_CREATED",
      "WAVE_PLANNED",
      "WAVE_APPROVED",
      "PICK_TASKS_CREATED",
      "WAVE_RELEASED",
    ],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    metadata: { orders: 20, items: 180, pickers: 4 },
  },
  {
    id: "WAVE-2025-003",
    entityType: "WAVE",
    name: "Evening Wave - Jan 27",
    stages: ["WAVE_CREATED", "WAVE_PLANNED"],
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    metadata: { orders: 12, items: 100, pickers: 3 },
  },
];

const DEMO_SALES_ORDERS: DemoEntity[] = [
  {
    id: "SO-2025-100",
    entityType: "SALES_ORDER",
    name: "Sales Order - Al Faisaliah Group",
    stages: ["CREATED", "CONFIRMED", "PICKING", "DISPATCHED", "DELIVERED"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    metadata: {
      customer: "Al Faisaliah Group",
      items: 25,
      value: 45000,
      currency: "SAR",
    },
  },
  {
    id: "SO-2025-101",
    entityType: "SALES_ORDER",
    name: "Sales Order - SABIC Distribution",
    stages: ["CREATED", "CONFIRMED", "PICKING"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    metadata: {
      customer: "SABIC Distribution",
      items: 12,
      value: 28000,
      currency: "SAR",
    },
  },
  {
    id: "SO-2025-102",
    entityType: "SALES_ORDER",
    name: "Sales Order - Saudi Aramco",
    stages: ["CREATED", "CONFIRMED"],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    metadata: {
      customer: "Saudi Aramco",
      items: 50,
      value: 125000,
      currency: "SAR",
    },
  },
];

const DEMO_PURCHASE_ORDERS: DemoEntity[] = [
  {
    id: "PO-2025-001",
    entityType: "PURCHASE_ORDER",
    name: "PO - Samsung Electronics",
    stages: ["CREATED", "APPROVED", "SENT", "ACKNOWLEDGED", "DELIVERED"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    metadata: {
      vendor: "Samsung Electronics",
      items: 150,
      value: 125000,
      currency: "SAR",
    },
  },
  {
    id: "PO-2025-002",
    entityType: "PURCHASE_ORDER",
    name: "PO - SABIC Materials",
    stages: ["CREATED", "APPROVED", "SENT", "ACKNOWLEDGED"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    metadata: { vendor: "SABIC", items: 50, value: 85000, currency: "SAR" },
  },
  {
    id: "PO-2025-003",
    entityType: "PURCHASE_ORDER",
    name: "PO - Aramco Logistics",
    stages: ["CREATED", "APPROVED", "SENT"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    metadata: {
      vendor: "Aramco Logistics",
      items: 200,
      value: 250000,
      currency: "SAR",
    },
  },
];

// ============================================================================
// DEMO WORKFLOWS
// ============================================================================

const DEMO_WORKFLOWS = [
  {
    name: "ASN Approval Workflow",
    description: "Automated approval workflow for high-value ASNs",
    steps: [
      {
        id: "step-1",
        name: "Validate ASN",
        type: "action" as const,
        config: { action: "validate_asn" },
        position: { x: 100, y: 100 },
        connections: ["step-2"],
      },
      {
        id: "step-2",
        name: "Check Value",
        type: "condition" as const,
        config: { condition: "value > 100000" },
        position: { x: 250, y: 100 },
        connections: ["step-3", "step-4"],
      },
      {
        id: "step-3",
        name: "Manager Approval",
        type: "approval" as const,
        config: { approver: "manager" },
        position: { x: 400, y: 50 },
        connections: ["step-5"],
      },
      {
        id: "step-4",
        name: "Auto Approve",
        type: "action" as const,
        config: { action: "auto_approve" },
        position: { x: 400, y: 150 },
        connections: ["step-5"],
      },
      {
        id: "step-5",
        name: "Notify Warehouse",
        type: "notification" as const,
        config: { notification: "asn_approved" },
        position: { x: 550, y: 100 },
        connections: [],
      },
    ],
    triggers: [{ event: "asn.validated", conditions: {} }],
    status: "active" as const,
  },
  {
    name: "Quality Inspection Workflow",
    description: "Quality inspection workflow for received goods",
    steps: [
      {
        id: "step-1",
        name: "Create Inspection",
        type: "action" as const,
        config: { action: "create_inspection" },
        position: { x: 100, y: 100 },
        connections: ["step-2"],
      },
      {
        id: "step-2",
        name: "Assign Inspector",
        type: "action" as const,
        config: { action: "assign_inspector" },
        position: { x: 250, y: 100 },
        connections: ["step-3"],
      },
      {
        id: "step-3",
        name: "Wait for Inspection",
        type: "action" as const,
        config: { action: "await_inspection" },
        position: { x: 400, y: 100 },
        connections: ["step-4"],
      },
      {
        id: "step-4",
        name: "Check Result",
        type: "condition" as const,
        config: { condition: "inspection_passed" },
        position: { x: 550, y: 100 },
        connections: ["step-5", "step-6"],
      },
      {
        id: "step-5",
        name: "Approve for Putaway",
        type: "action" as const,
        config: { action: "approve_putaway" },
        position: { x: 700, y: 50 },
        connections: [],
      },
      {
        id: "step-6",
        name: "Create NCR",
        type: "action" as const,
        config: { action: "create_ncr" },
        position: { x: 700, y: 150 },
        connections: [],
      },
    ],
    triggers: [{ event: "goods_receipt.quality_required", conditions: {} }],
    status: "active" as const,
  },
  {
    name: "Order Fulfillment Workflow",
    description: "End-to-end order fulfillment automation",
    steps: [
      {
        id: "step-1",
        name: "Validate Order",
        type: "action" as const,
        config: { action: "validate_order" },
        position: { x: 100, y: 100 },
        connections: ["step-2"],
      },
      {
        id: "step-2",
        name: "Check Inventory",
        type: "condition" as const,
        config: { condition: "inventory_available" },
        position: { x: 250, y: 100 },
        connections: ["step-3", "step-7"],
      },
      {
        id: "step-3",
        name: "Create Wave",
        type: "action" as const,
        config: { action: "create_wave" },
        position: { x: 400, y: 100 },
        connections: ["step-4"],
      },
      {
        id: "step-4",
        name: "Release Picks",
        type: "action" as const,
        config: { action: "release_picks" },
        position: { x: 550, y: 100 },
        connections: ["step-5"],
      },
      {
        id: "step-5",
        name: "Wait for Completion",
        type: "action" as const,
        config: { action: "await_picking" },
        position: { x: 700, y: 100 },
        connections: ["step-6"],
      },
      {
        id: "step-6",
        name: "Dispatch Order",
        type: "action" as const,
        config: { action: "dispatch" },
        position: { x: 850, y: 100 },
        connections: [],
      },
      {
        id: "step-7",
        name: "Backorder",
        type: "action" as const,
        config: { action: "create_backorder" },
        position: { x: 400, y: 200 },
        connections: [],
      },
    ],
    triggers: [{ event: "sales_order.confirmed", conditions: {} }],
    status: "active" as const,
  },
];

// ============================================================================
// INITIALIZATION FUNCTION
// ============================================================================

export async function initializeDemoData(): Promise<{
  success: boolean;
  message: string;
  stats: {
    lifecycleConfigs: number;
    entities: number;
    transitions: number;
    workflows: number;
    processMiningEvents: number;
  };
}> {
  const stats = {
    lifecycleConfigs: 0,
    entities: 0,
    transitions: 0,
    workflows: 0,
    processMiningEvents: 0,
  };

  try {
    console.log("🚀 Initializing Process Lifecycle Demo Data...");

    // 1. Initialize lifecycle configurations
    console.log("📋 Registering lifecycle configurations...");
    initializeLifecycleSystem();
    const configs = lifecycleService.getAllConfigs();
    stats.lifecycleConfigs = configs.size;
    console.log(`   ✅ ${stats.lifecycleConfigs} lifecycle configs registered`);

    // 2. Create demo entities with lifecycles
    console.log("📦 Creating demo entities...");

    const allDemoEntities: DemoEntity[] = [
      ...DEMO_ASNS,
      ...DEMO_TASKS,
      ...DEMO_PICKINGS,
      ...DEMO_CYCLE_COUNTS,
      ...DEMO_GOODS_RECEIPTS,
      ...DEMO_WAVES,
      ...DEMO_SALES_ORDERS,
      ...DEMO_PURCHASE_ORDERS,
    ];

    for (const entity of allDemoEntities) {
      try {
        // Initialize lifecycle
        await lifecycleService.initializeLifecycle(
          entity.id,
          entity.entityType,
          {
            ...entity.metadata,
            name: entity.name,
            createdAt: entity.createdAt.toISOString(),
          },
        );
        stats.entities++;

        // Transition through stages
        for (let i = 1; i < entity.stages.length; i++) {
          const toStageId = entity.stages[i];
          const transitionTime = new Date(
            entity.createdAt.getTime() + i * 30 * 60 * 1000, // 30 minutes per stage
          );

          await lifecycleService.transitionStage(
            entity.id,
            entity.entityType,
            toStageId,
            {
              transitionTime: transitionTime.toISOString(),
              userId: "demo-user",
              reason: "Demo data initialization",
            },
          );
          stats.transitions++;

          // Capture process mining event
          await processMiningService.captureEvent({
            caseId: entity.id,
            caseType: entity.entityType,
            event: {
              id: `evt-${entity.id}-${i}`,
              activity: toStageId,
              timestamp: transitionTime.toISOString(),
              resource: entity.metadata.assignedTo || "System",
              data: entity.metadata,
            },
          });
          stats.processMiningEvents++;
        }

        console.log(
          `   ✅ ${entity.id} (${entity.entityType}): ${entity.stages.length} stages`,
        );
      } catch (error) {
        console.error(`   ❌ Failed to create ${entity.id}:`, error);
      }
    }

    // 3. Create demo workflows
    console.log("🔄 Creating demo workflows...");
    for (const workflow of DEMO_WORKFLOWS) {
      try {
        await workflowService.createWorkflow(workflow);
        stats.workflows++;
        console.log(`   ✅ Workflow: ${workflow.name}`);
      } catch (error) {
        console.error(
          `   ❌ Failed to create workflow ${workflow.name}:`,
          error,
        );
      }
    }

    console.log("");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log("✅ DEMO DATA INITIALIZATION COMPLETE");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log(`   📋 Lifecycle Configs: ${stats.lifecycleConfigs}`);
    console.log(`   📦 Entities Created: ${stats.entities}`);
    console.log(`   🔄 Stage Transitions: ${stats.transitions}`);
    console.log(`   ⚡ Workflows: ${stats.workflows}`);
    console.log(`   📊 Process Mining Events: ${stats.processMiningEvents}`);
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log("");

    return {
      success: true,
      message: "Demo data initialized successfully",
      stats,
    };
  } catch (error) {
    console.error("❌ Error initializing demo data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      stats,
    };
  }
}

// ============================================================================
// RESET FUNCTION (for testing)
// ============================================================================

export async function resetDemoData(): Promise<void> {
  console.log("🗑️ Resetting demo data...");
  // Note: Since we use in-memory storage, this would require clearing the Maps
  // In a real implementation, this would call database delete operations
  console.log("   ⚠️ In-memory storage - restart server to reset");
}

// ============================================================================
// EXPORT
// ============================================================================

export default initializeDemoData;
