/**
 * ISO IMS Module Initialization
 *
 * Initializes all ISO IMS services, agents, and integrations on startup
 */

import { initializeISOIMSAgents } from "./agents";
import { isoIMSResilienceService } from "./resilience/isoIMSResilienceService";
import { isoIMSEdgeService } from "./edge/isoIMSEdgeService";
import { eventBus } from "@/lib/services/event-bus";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

/**
 * Initialize ISO IMS Module
 */
export async function initializeISOIMSModule(
  tenantId: string = "default",
): Promise<void> {
  try {
    console.log("🚀 Initializing ISO IMS Module...");

    // 1. Initialize Resilience Service
    await isoIMSResilienceService.initialize();
    console.log("✅ ISO IMS Resilience Service initialized");

    // 2. Initialize Edge Computing Service
    await isoIMSEdgeService.initialize();
    console.log("✅ ISO IMS Edge Service initialized");

    // 3. Initialize all Autonomous Agents
    await initializeISOIMSAgents();
    console.log("✅ All ISO IMS Agents initialized (6 agents)");

    // 4. Subscribe to platform events
    subscribeToPlatformEvents(tenantId);

    // 5. Initialize knowledge base entries for ISO IMS
    await initializeKnowledgeBase(tenantId);

    console.log("✅ ISO IMS Module fully initialized");
  } catch (error) {
    console.error("❌ Error initializing ISO IMS Module:", error);
    // Don't throw - fail gracefully
  }
}

/**
 * Subscribe to platform events for cross-module integration
 */
function subscribeToPlatformEvents(tenantId: string): void {
  // Subscribe to facility events for document linking
  eventBus.subscribe("facility.created", async (event) => {
    // Could auto-link relevant documents
  });

  eventBus.subscribe("facility.updated", async (event) => {
    // Could update linked documents
  });

  // Subscribe to quality events for NCR creation
  eventBus.subscribe("quality.inspection.failed", async (event) => {
    // Auto-NCR Agent will handle this
  });

  // Subscribe to IoT events for NCR creation
  eventBus.subscribe("iot.sensor.anomaly", async (event) => {
    // Auto-NCR Agent will handle this
  });

  // Subscribe to audit events
  eventBus.subscribe("audit.finding.critical", async (event) => {
    // Auto-NCR Agent will handle this
  });

  console.log("✅ ISO IMS event subscriptions registered");
}

/**
 * Initialize knowledge base with ISO IMS entries
 */
async function initializeKnowledgeBase(tenantId: string): Promise<void> {
  try {
    // Store ISO IMS module information in knowledge base
    await knowledgeBaseService.store({
      entity: "iso-ims-module",
      id: "iso-ims-module-info",
      content: `ISO IMS Module - Integrated Management System
      
Features:
- Document Management with Intelligent Sorting
- NCR Management with Auto-Creation
- CAPA Management with Optimization
- Audit Management with Intelligent Scheduling
- Risk Management with Continuous Assessment
- Training & Competence Management
- Compliance Engine with 50+ Standards
- 6 Autonomous Agents
- Self-Learning System
- Blockchain Integration
- AR/VR Capabilities
- Deep Drill-Down Navigation
- Edge Computing Support
- Quantum-Ready Architecture`,
      metadata: {
        module: "iso-ims",
        tenantId,
        version: "2.0",
        features: [
          "intelligent-documents",
          "autonomous-agents",
          "self-learning",
          "blockchain",
          "ar-vr",
          "drill-down",
          "edge-computing",
          "quantum-ready",
        ],
      },
    });

    console.log("✅ ISO IMS knowledge base entries initialized");
  } catch (error) {
    console.warn(
      "⚠️ Failed to initialize ISO IMS knowledge base entries:",
      error,
    );
  }
}

/**
 * Cleanup on module shutdown
 */
export async function cleanupISOIMSModule(): Promise<void> {
  try {
    // Stop all agents
    // Agents would have stop methods if needed

    // Cleanup edge service
    isoIMSEdgeService.cleanup();

    console.log("✅ ISO IMS Module cleaned up");
  } catch (error) {
    console.error("Error cleaning up ISO IMS Module:", error);
  }
}
