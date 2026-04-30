/**
 * Cargo Psychology Service
 *
 * Main service for behavioral intelligence and psychology analysis
 * Integrates seamlessly with Schrödinger's Truck, Event Store, and Knowledge Base
 *
 * @module cargo-psychology
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { signalAnalyzer } from "./signal-analyzer";
import { psychologyEngine } from "./psychology-engine";
import { interventionService } from "./intervention-service";
import { temporalModifierService } from "./temporal-modifiers";
import type { Shipment } from "@/types/tms";
import type {
  ShipmentPsychologyState,
  SignalValues,
  PsychologyScore,
  PsychologyState,
  SignalAnalysis,
  InterventionRecord,
  InterventionAction,
  CustomerInfo,
  CargoPsychologyService,
} from "./types";

// ============================================================================
// IN-MEMORY STORE (Will be replaced with database)
// ============================================================================

class PsychologyStateStore {
  private states: Map<string, ShipmentPsychologyState> = new Map();

  get(shipmentId: string): ShipmentPsychologyState | undefined {
    return this.states.get(shipmentId);
  }

  set(shipmentId: string, state: ShipmentPsychologyState): void {
    this.states.set(shipmentId, state);
  }

  getAll(): ShipmentPsychologyState[] {
    return Array.from(this.states.values());
  }

  getByTenant(tenantId: string): ShipmentPsychologyState[] {
    return this.getAll().filter((s) => s.tenantId === tenantId);
  }
}

const store = new PsychologyStateStore();

// ============================================================================
// MAIN SERVICE
// ============================================================================

class CargoPsychologyServiceImpl implements CargoPsychologyService {
  /**
   * Analyze shipment and calculate psychology score
   */
  async analyzeShipment(shipmentId: string): Promise<ShipmentPsychologyState> {
    // Check if already exists
    const existing = await this.getPsychologyState(shipmentId);
    if (existing) {
      // Re-analyze with latest data
      return this.reanalyzeShipment(shipmentId, existing);
    }

    // Get shipment data (would come from shipment service)
    // For now, we'll extract from Event Store
    const shipment = await this.getShipmentFromEvents(shipmentId);
    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    // Get customer info
    const customerId = shipment.customerId || shipment.customerReference;
    const customerInfo = await this.getCustomerInfo(customerId);

    // Extract signals
    const signals = await signalAnalyzer.extractSignals(
      shipment,
      customerId,
      customerInfo,
    );

    // Get temporal context
    const temporalContext = temporalModifierService.getTemporalContext(
      shipment.pickupDate ? new Date(shipment.pickupDate) : new Date(),
    );

    // Calculate psychology score
    const psychologyScore = await psychologyEngine.calculatePsychologyScore(
      signals,
      temporalContext,
    );

    // Analyze all signals
    const signalAnalyses: SignalAnalysis[] = [];
    for (const signalDef of Object.keys(signals) as Array<keyof SignalValues>) {
      if (signals[signalDef]) {
        const analysis = await signalAnalyzer.analyzeSignal(
          signalDef as any,
          signals[signalDef]!,
          shipmentId,
        );
        signalAnalyses.push(analysis);
      }
    }

    // Create psychology state
    const psychologyState: ShipmentPsychologyState = {
      id: `psychology-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      shipmentId,
      tenantId: shipment.tenantId || "default",
      currentState: psychologyScore.state,
      currentScore: psychologyScore,
      signalHistory: signalAnalyses,
      interventionHistory: [],
      temporalContext,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalysis: new Date(),
      analysisCount: 1,
      quantumStateId: shipment.id, // Link to quantum state
      journeyId: shipment.journeyId,
    };

    // Store state
    store.set(shipmentId, psychologyState);

    // Publish event
    await eventBus.publish(
      createEvent(
        "ShipmentPsychologyStateAnalyzed",
        shipmentId,
        "Shipment",
        {
          state: psychologyScore.state,
          score: psychologyScore.score,
          signals: Object.keys(signals).length,
        },
        1,
        {
          tenantId: shipment.tenantId,
          correlationId: `psychology-${Date.now()}`,
          userId: shipment.createdBy || "system",
        },
      ),
    );

    // Store learning signal
    await this.storeLearningSignal(shipment.tenantId || "default", {
      type: "psychology_analysis",
      shipmentId,
      state: psychologyScore.state,
      score: psychologyScore.score,
      signals,
      confidence: psychologyScore.confidence,
    });

    return psychologyState;
  }

  /**
   * Get current psychology state
   */
  async getPsychologyState(
    shipmentId: string,
  ): Promise<ShipmentPsychologyState | null> {
    // Check in-memory store
    const state = store.get(shipmentId);
    if (state) {
      return state;
    }

    // Try to reconstruct from Event Store
    try {
      const events = await eventStore.getEvents(shipmentId);
      const psychologyEvents = events.filter(
        (e) =>
          e.type === "ShipmentPsychologyStateAnalyzed" ||
          e.type === "CargoPsychologyIntervention",
      );

      if (psychologyEvents.length > 0) {
        // Reconstruct state from events
        const lastEvent = psychologyEvents[psychologyEvents.length - 1];
        // Would reconstruct full state from events
        // For now, return null and trigger new analysis
      }
    } catch (error) {
      console.warn("Error reconstructing psychology state from events:", error);
    }

    return null;
  }

  /**
   * Extract signals from shipment data
   */
  async extractSignals(
    shipment: Shipment,
    customerId?: string,
  ): Promise<SignalValues> {
    const customerInfo = await this.getCustomerInfo(customerId);
    return signalAnalyzer.extractSignals(shipment, customerId, customerInfo);
  }

  /**
   * Calculate psychology score from signals
   */
  async calculatePsychologyScore(
    signals: SignalValues,
    temporalContext?: any,
  ): Promise<PsychologyScore> {
    return psychologyEngine.calculatePsychologyScore(signals, temporalContext);
  }

  /**
   * Get recommended intervention
   */
  getRecommendedIntervention(state: PsychologyState) {
    return interventionService.getInterventionPlaybook(state);
  }

  /**
   * Execute intervention
   */
  async executeIntervention(
    shipmentId: string,
    action: InterventionAction,
    channel?: string,
  ): Promise<InterventionRecord> {
    // Get shipment and customer info
    const shipment = await this.getShipmentFromEvents(shipmentId);
    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    const customerId = shipment.customerId || shipment.customerReference;
    const customerInfo = await this.getCustomerInfo(customerId);

    // Get current psychology state
    const psychologyState = await this.getPsychologyState(shipmentId);
    if (!psychologyState) {
      throw new Error(`Psychology state not found for shipment ${shipmentId}`);
    }

    // Execute intervention
    const record = await interventionService.executeIntervention(
      shipmentId,
      customerId || "",
      customerInfo?.phone || "",
      customerInfo?.email || "",
      psychologyState.currentState,
      action,
      channel as any,
    );

    // Update intervention history
    psychologyState.interventionHistory.push(record);
    psychologyState.updatedAt = new Date();
    store.set(shipmentId, psychologyState);

    return record;
  }

  /**
   * Get intervention history
   */
  async getInterventionHistory(
    shipmentId: string,
  ): Promise<InterventionRecord[]> {
    const state = await this.getPsychologyState(shipmentId);
    if (state) {
      return state.interventionHistory;
    }

    // Try to get from service
    return interventionService.getInterventionHistory(shipmentId);
  }

  /**
   * Update signal value and re-analyze
   */
  async updateSignal(
    shipmentId: string,
    signal: any,
    value: string,
  ): Promise<ShipmentPsychologyState> {
    const state = await this.getPsychologyState(shipmentId);
    if (!state) {
      throw new Error(`Psychology state not found for shipment ${shipmentId}`);
    }

    // Analyze new signal
    const newSignalAnalysis = await signalAnalyzer.analyzeSignal(
      signal,
      value,
      shipmentId,
    );

    // Update score with new signal
    const updatedScore = await psychologyEngine.updateScoreWithNewSignal(
      state.currentScore,
      newSignalAnalysis,
    );

    // Update state
    const updatedState: ShipmentPsychologyState = {
      ...state,
      currentState: updatedScore.state,
      currentScore: updatedScore,
      signalHistory: [
        ...state.signalHistory.filter((s) => s.signal !== signal),
        newSignalAnalysis,
      ],
      updatedAt: new Date(),
      lastAnalysis: new Date(),
      analysisCount: state.analysisCount + 1,
    };

    store.set(shipmentId, updatedState);

    // Publish event
    await eventBus.publish(
      createEvent(
        "CargoPsychologySignalUpdated",
        shipmentId,
        "Shipment",
        {
          signal,
          value,
          newState: updatedScore.state,
          newScore: updatedScore.score,
        },
        state.analysisCount + 1,
        {
          tenantId: state.tenantId,
          correlationId: `signal-update-${Date.now()}`,
          userId: "cargo-psychology-service",
        },
      ),
    );

    return updatedState;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Re-analyze shipment with latest data
   */
  private async reanalyzeShipment(
    shipmentId: string,
    existing: ShipmentPsychologyState,
  ): Promise<ShipmentPsychologyState> {
    const shipment = await this.getShipmentFromEvents(shipmentId);
    if (!shipment) {
      return existing;
    }

    // Re-extract signals
    const customerId = shipment.customerId || shipment.customerReference;
    const customerInfo = await this.getCustomerInfo(customerId);
    const signals = await signalAnalyzer.extractSignals(
      shipment,
      customerId,
      customerInfo,
    );

    // Recalculate score
    const temporalContext = temporalModifierService.getTemporalContext(
      shipment.pickupDate ? new Date(shipment.pickupDate) : new Date(),
    );
    const psychologyScore = await psychologyEngine.calculatePsychologyScore(
      signals,
      temporalContext,
    );

    // Update state
    const updatedState: ShipmentPsychologyState = {
      ...existing,
      currentState: psychologyScore.state,
      currentScore: psychologyScore,
      temporalContext,
      updatedAt: new Date(),
      lastAnalysis: new Date(),
      analysisCount: existing.analysisCount + 1,
    };

    store.set(shipmentId, updatedState);
    return updatedState;
  }

  /**
   * Get shipment from Event Store
   */
  private async getShipmentFromEvents(
    shipmentId: string,
  ): Promise<Shipment | null> {
    try {
      const events = await eventStore.getEvents(shipmentId);
      const createEvent = events.find((e) => e.type === "ShipmentCreated");
      if (createEvent) {
        return createEvent.payload as Shipment;
      }
    } catch (error) {
      console.warn("Error getting shipment from events:", error);
    }
    return null;
  }

  /**
   * Get customer info
   */
  private async getCustomerInfo(
    customerId: string | undefined,
  ): Promise<CustomerInfo | undefined> {
    if (!customerId) {
      return undefined;
    }

    // Try to get from Knowledge Base
    try {
      const knowledge = await knowledgeBaseService.search({
        query: `customer ${customerId} historical statistics`,
        limit: 1,
      });
      if (knowledge.length > 0 && knowledge[0].entry.metadata?.customerInfo) {
        return knowledge[0].entry.metadata.customerInfo as CustomerInfo;
      }
    } catch (error) {
      console.warn("Error getting customer info from knowledge base:", error);
    }

    // Try to get from Event Store
    try {
      const events = await eventStore.getEventsByType(
        "ShipmentDelivered",
        0,
        100,
      );
      const customerEvents = events.filter(
        (e) => e.payload?.customerId === customerId,
      );

      if (customerEvents.length > 0) {
        const completed = customerEvents.filter(
          (e) => e.payload?.status !== "NO_SHOW",
        ).length;
        return {
          id: customerId,
          historicalStats: {
            totalShipments: customerEvents.length,
            completedShipments: completed,
            noShowRate:
              (customerEvents.length - completed) / customerEvents.length,
          },
        };
      }
    } catch (error) {
      console.warn("Error getting customer info from events:", error);
    }

    return undefined;
  }

  /**
   * Store learning signal
   */
  private async storeLearningSignal(
    tenantId: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await knowledgeBaseService.learn({
        tenantId,
        agentId: "cargo-psychology",
        type: data.type,
        trigger: `Psychology analysis for shipment ${data.shipmentId}`,
        input: data,
        output: { state: data.state, score: data.score },
        confidence: data.confidence || 0.6,
        success: true,
      });
    } catch (error) {
      console.warn("Error storing learning signal:", error);
    }
  }
}

// Export singleton instance
export const cargoPsychologyService: CargoPsychologyService =
  new CargoPsychologyServiceImpl();

// Export for convenience
export default cargoPsychologyService;
