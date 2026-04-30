/**
 * Voice Picking Service
 * Hands-free voice-directed picking workflows
 * NO DUPLICATION - New service for voice operations
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { eventBus } from "@/lib/services/event-store";
import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";

// ============================================================================
// VOICE PICKING TYPES
// ============================================================================

export interface VoicePickingSession {
  id: string;
  pickerId: string;
  warehouseId: string;
  taskId: string;
  status: "INITIALIZING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ERROR";
  currentLocation?: string;
  currentItem?: {
    skuId: string;
    quantity: number;
    location: string;
  };
  progress: {
    totalItems: number;
    completedItems: number;
    percentage: number;
  };
  startedAt: Date;
  completedAt?: Date;
  language: string;
  deviceId?: string;
}

export interface VoiceCommand {
  sessionId: string;
  command: string;
  recognizedText: string;
  confidence: number;
  intent:
    | "PICK"
    | "CONFIRM"
    | "QUANTITY"
    | "LOCATION"
    | "HELP"
    | "PAUSE"
    | "RESUME"
    | "COMPLETE"
    | "ERROR";
  parameters?: Record<string, any>;
  timestamp: Date;
}

export interface VoicePickingDevice {
  id: string;
  deviceId: string;
  model: string;
  manufacturer: "ZEBRA" | "HONEYWELL" | "VUFOX" | "OTHER";
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  batteryLevel?: number;
  firmwareVersion?: string;
  lastSeen?: Date;
  assignedTo?: string;
}

export interface VoicePickingWorkflow {
  taskId: string;
  items: Array<{
    skuId: string;
    quantity: number;
    location: string;
    sequence: number;
  }>;
  instructions: Array<{
    step: number;
    type: "NAVIGATE" | "PICK" | "CONFIRM" | "VERIFY";
    location?: string;
    skuId?: string;
    quantity?: number;
    voicePrompt: string;
    expectedResponse?: string[];
  }>;
}

// ============================================================================
// VOICE PICKING SERVICE
// ============================================================================

class VoicePickingService {
  private sessions: Map<string, VoicePickingSession> = new Map();
  private devices: Map<string, VoicePickingDevice> = new Map();
  private commands: Map<string, VoiceCommand[]> = new Map();
  private workflows: Map<string, VoicePickingWorkflow> = new Map();

  /**
   * Register voice picking device
   */
  async registerDevice(
    device: Partial<VoicePickingDevice>,
  ): Promise<VoicePickingDevice> {
    const deviceRecord: VoicePickingDevice = {
      id:
        device.id ||
        `device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      deviceId: device.deviceId || `VOICE-${Date.now()}`,
      model: device.model || "Unknown",
      manufacturer: device.manufacturer || "OTHER",
      status: "CONNECTED",
      batteryLevel: device.batteryLevel,
      firmwareVersion: device.firmwareVersion,
      lastSeen: new Date(),
      assignedTo: device.assignedTo,
    };

    this.devices.set(deviceRecord.deviceId, deviceRecord);

    // Publish event
    await eventBus.publish({
      id: `voice-device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "voice.device.registered",
      aggregateId: deviceRecord.id,
      aggregateType: "VOICE_DEVICE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        deviceId: deviceRecord.deviceId,
        device: deviceRecord,
      },
    });

    return deviceRecord;
  }

  /**
   * Start voice picking session
   */
  async startSession(
    pickerId: string,
    warehouseId: string,
    taskId: string,
    deviceId?: string,
    language: string = "en",
  ): Promise<VoicePickingSession> {
    // Create workflow for task
    const workflow = await this.createWorkflow(taskId, warehouseId);
    this.workflows.set(taskId, workflow);

    const session: VoicePickingSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      pickerId,
      warehouseId,
      taskId,
      status: "INITIALIZING",
      progress: {
        totalItems: workflow.items.length,
        completedItems: 0,
        percentage: 0,
      },
      startedAt: new Date(),
      language,
      deviceId,
    };

    this.sessions.set(session.id, session);
    this.commands.set(session.id, []);

    // Initialize voice session
    await this.initializeVoiceSession(session, workflow);

    // Publish event
    await eventBus.publish({
      id: `voice-session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "voice.session.started",
      aggregateId: session.id,
      aggregateType: "VOICE_PICKING_SESSION",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        sessionId: session.id,
        session,
      },
    });

    return session;
  }

  /**
   * Process voice command
   */
  async processCommand(
    sessionId: string,
    recognizedText: string,
    confidence: number,
  ): Promise<VoiceCommand> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Use AI to interpret command
    const intent = await this.interpretCommand(
      recognizedText,
      session.language,
    );

    const command: VoiceCommand = {
      sessionId,
      command: recognizedText,
      recognizedText,
      confidence,
      intent: intent.intent,
      parameters: intent.parameters,
      timestamp: new Date(),
    };

    // Store command
    const commands = this.commands.get(sessionId) || [];
    commands.push(command);
    this.commands.set(sessionId, commands);

    // Process command
    await this.executeCommand(session, command);

    // Publish event
    await eventBus.publish({
      id: `voice-command-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "voice.command.processed",
      aggregateId: sessionId,
      aggregateType: "VOICE_PICKING_SESSION",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        sessionId,
        command,
      },
    });

    return command;
  }

  /**
   * Interpret voice command using AI
   */
  private async interpretCommand(
    text: string,
    language: string,
  ): Promise<{
    intent: VoiceCommand["intent"];
    parameters?: Record<string, any>;
  }> {
    try {
      // Use AI agent for natural language understanding
      const agentTask = await agentOrchestrator.assignTask({
        id: `voice-interpret-${Date.now()}`,
        type: "voice_command_interpretation",
        description: `Interpret voice command: ${text}`,
        input: {
          text,
          language,
          context: "warehouse_picking",
        },
        requiredCapabilities: [
          "natural_language_understanding",
          "voice_processing",
        ],
        priority: "HIGH",
        tenantId: undefined,
        userId: undefined,
      });

      // For now, use pattern matching
      // In production, use NLP/ML models
      const lowerText = text.toLowerCase();

      if (
        lowerText.includes("pick") ||
        lowerText.includes("got it") ||
        lowerText.includes("done")
      ) {
        return { intent: "PICK", parameters: { action: "pick" } };
      } else if (
        lowerText.includes("confirm") ||
        lowerText.includes("yes") ||
        lowerText.includes("correct")
      ) {
        return { intent: "CONFIRM", parameters: { confirmed: true } };
      } else if (lowerText.match(/\d+/)) {
        const quantity = parseInt(lowerText.match(/\d+/)?.[0] || "0");
        return { intent: "QUANTITY", parameters: { quantity } };
      } else if (
        lowerText.includes("location") ||
        lowerText.includes("where")
      ) {
        return { intent: "LOCATION", parameters: { action: "location_query" } };
      } else if (lowerText.includes("help") || lowerText.includes("repeat")) {
        return { intent: "HELP", parameters: { action: "help" } };
      } else if (lowerText.includes("pause") || lowerText.includes("stop")) {
        return { intent: "PAUSE", parameters: { action: "pause" } };
      } else if (
        lowerText.includes("resume") ||
        lowerText.includes("continue")
      ) {
        return { intent: "RESUME", parameters: { action: "resume" } };
      } else if (
        lowerText.includes("complete") ||
        lowerText.includes("finish")
      ) {
        return { intent: "COMPLETE", parameters: { action: "complete" } };
      }

      return { intent: "ERROR", parameters: { error: "Unrecognized command" } };
    } catch (error) {
      console.error("Error interpreting command:", error);
      return {
        intent: "ERROR",
        parameters: { error: "Interpretation failed" },
      };
    }
  }

  /**
   * Execute voice command
   */
  private async executeCommand(
    session: VoicePickingSession,
    command: VoiceCommand,
  ): Promise<void> {
    const workflow = this.workflows.get(session.taskId);
    if (!workflow) return;

    switch (command.intent) {
      case "PICK":
        await this.handlePick(session, workflow);
        break;
      case "CONFIRM":
        await this.handleConfirm(session, workflow);
        break;
      case "QUANTITY":
        if (command.parameters?.quantity) {
          await this.handleQuantity(session, command.parameters.quantity);
        }
        break;
      case "LOCATION":
        await this.handleLocationQuery(session, workflow);
        break;
      case "HELP":
        await this.handleHelp(session, workflow);
        break;
      case "PAUSE":
        session.status = "PAUSED";
        break;
      case "RESUME":
        if (session.status === "PAUSED") {
          session.status = "ACTIVE";
        }
        break;
      case "COMPLETE":
        await this.handleComplete(session);
        break;
    }

    this.sessions.set(session.id, session);
  }

  /**
   * Handle pick command
   */
  private async handlePick(
    session: VoicePickingSession,
    workflow: VoicePickingWorkflow,
  ): Promise<void> {
    const nextItem = workflow.items[session.progress.completedItems];
    if (nextItem) {
      session.currentItem = nextItem;
      session.currentLocation = nextItem.location;
      session.status = "ACTIVE";
    }
  }

  /**
   * Handle confirm command
   */
  private async handleConfirm(
    session: VoicePickingSession,
    workflow: VoicePickingWorkflow,
  ): Promise<void> {
    if (session.currentItem) {
      session.progress.completedItems++;
      session.progress.percentage =
        (session.progress.completedItems / session.progress.totalItems) * 100;

      if (session.progress.completedItems >= session.progress.totalItems) {
        await this.handleComplete(session);
      } else {
        // Move to next item
        const nextItem = workflow.items[session.progress.completedItems];
        session.currentItem = nextItem;
        session.currentLocation = nextItem?.location;
      }
    }
  }

  /**
   * Handle quantity
   */
  private async handleQuantity(
    session: VoicePickingSession,
    quantity: number,
  ): Promise<void> {
    if (session.currentItem) {
      session.currentItem.quantity = quantity;
    }
  }

  /**
   * Handle location query
   */
  private async handleLocationQuery(
    session: VoicePickingSession,
    workflow: VoicePickingWorkflow,
  ): Promise<void> {
    // Provide location information via voice
    if (session.currentItem) {
      // In production, this would trigger voice response
      console.log(`Location: ${session.currentItem.location}`);
    }
  }

  /**
   * Handle help
   */
  private async handleHelp(
    session: VoicePickingSession,
    workflow: VoicePickingWorkflow,
  ): Promise<void> {
    // Provide help instructions via voice
    const currentInstruction =
      workflow.instructions[session.progress.completedItems];
    if (currentInstruction) {
      // In production, this would trigger voice response
      console.log(`Help: ${currentInstruction.voicePrompt}`);
    }
  }

  /**
   * Handle complete
   */
  private async handleComplete(session: VoicePickingSession): Promise<void> {
    session.status = "COMPLETED";
    session.completedAt = new Date();

    // Publish completion event
    await eventBus.publish({
      id: `voice-complete-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "voice.session.completed",
      aggregateId: session.id,
      aggregateType: "VOICE_PICKING_SESSION",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        sessionId: session.id,
        session,
      },
    });
  }

  /**
   * Create workflow for task
   */
  private async createWorkflow(
    taskId: string,
    warehouseId: string,
  ): Promise<VoicePickingWorkflow> {
    // In production, fetch task details from task service
    // For now, create mock workflow
    const workflow: VoicePickingWorkflow = {
      taskId,
      items: [
        { skuId: "SKU-001", quantity: 5, location: "A-01-02-03", sequence: 1 },
        { skuId: "SKU-002", quantity: 3, location: "A-02-03-04", sequence: 2 },
        { skuId: "SKU-003", quantity: 10, location: "B-01-01-01", sequence: 3 },
      ],
      instructions: [
        {
          step: 1,
          type: "NAVIGATE",
          location: "A-01-02-03",
          voicePrompt: "Navigate to location A zero one, zero two, zero three",
          expectedResponse: ["arrived", "here", "ready"],
        },
        {
          step: 2,
          type: "PICK",
          skuId: "SKU-001",
          quantity: 5,
          voicePrompt: "Pick five units of SKU zero zero one",
          expectedResponse: ["picked", "done", "got it"],
        },
        {
          step: 3,
          type: "CONFIRM",
          voicePrompt: "Confirm quantity five",
          expectedResponse: ["yes", "correct", "confirmed"],
        },
      ],
    };

    return workflow;
  }

  /**
   * Initialize voice session
   */
  private async initializeVoiceSession(
    session: VoicePickingSession,
    workflow: VoicePickingWorkflow,
  ): Promise<void> {
    // In production, this would:
    // 1. Connect to voice device
    // 2. Initialize voice recognition
    // 3. Provide welcome message
    // 4. Start first instruction

    session.status = "ACTIVE";
    if (workflow.instructions.length > 0) {
      const firstInstruction = workflow.instructions[0];
      // Trigger voice prompt
      console.log(`Voice: ${firstInstruction.voicePrompt}`);
    }
  }

  /**
   * Get session
   */
  async getSession(sessionId: string): Promise<VoicePickingSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get device
   */
  async getDevice(deviceId: string): Promise<VoicePickingDevice | null> {
    return this.devices.get(deviceId) || null;
  }

  /**
   * Get workflow
   */
  async getWorkflow(taskId: string): Promise<VoicePickingWorkflow | null> {
    return this.workflows.get(taskId) || null;
  }
}

export const voicePickingService = new VoicePickingService();
