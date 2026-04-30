/**
 * Schrödinger's Truck Quantum Logistics Service
 *
 * Main service for quantum state management
 * Integrates seamlessly with Event Store, Knowledge Base, and all modules
 *
 * @module schrodingers-truck
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { probabilityEngine } from "./probability-engine";
import { quantumIntegrations } from "./integrations";
import type { Shipment } from "@/types/tms";
import type {
  ShipmentQuantumState,
  CollapseTrigger,
  CollapseEvent,
  DriverInfo,
  RouteInfo,
  CargoInfo,
  SchrodingersTruckService,
  WhatsAppMessage,
  GeofenceEvent,
  GPSUpdate,
  WeatherAlert,
  TrafficAlert,
} from "./types";

// ============================================================================
// IN-MEMORY STORE (Will be replaced with database)
// ============================================================================

class QuantumStateStore {
  private states: Map<string, ShipmentQuantumState> = new Map();
  private subscriptions: Map<
    string,
    Set<(state: ShipmentQuantumState) => void>
  > = new Map();

  get(shipmentId: string): ShipmentQuantumState | undefined {
    return this.states.get(shipmentId);
  }

  set(shipmentId: string, state: ShipmentQuantumState): void {
    this.states.set(shipmentId, state);

    // Notify subscribers
    const subscribers = this.subscriptions.get(shipmentId);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(state);
        } catch (error) {
          console.error("Error in quantum state subscriber:", error);
        }
      });
    }
  }

  subscribe(
    shipmentId: string,
    callback: (state: ShipmentQuantumState) => void,
  ): () => void {
    if (!this.subscriptions.has(shipmentId)) {
      this.subscriptions.set(shipmentId, new Set());
    }
    this.subscriptions.get(shipmentId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(shipmentId);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  getAll(): ShipmentQuantumState[] {
    return Array.from(this.states.values());
  }

  getByTenant(tenantId: string): ShipmentQuantumState[] {
    return this.getAll().filter((s) => s.tenantId === tenantId);
  }
}

const store = new QuantumStateStore();

// ============================================================================
// MAIN SERVICE
// ============================================================================

class SchrodingersTruckServiceImpl implements SchrodingersTruckService {
  /**
   * Initialize quantum state for a new shipment
   * Called automatically when shipment is created
   */
  async initializeQuantumState(
    shipment: Shipment,
    driver?: DriverInfo,
    route?: RouteInfo,
    cargo?: CargoInfo,
  ): Promise<ShipmentQuantumState> {
    // Check if already exists
    const existing = await this.getQuantumState(shipment.id);
    if (existing) {
      return existing;
    }

    // Calculate initial probabilities
    const quantumState = await probabilityEngine.calculateInitialProbabilities(
      shipment,
      driver,
      route,
      cargo,
    );

    // Store state
    store.set(shipment.id, quantumState);

    // Publish event
    await eventBus.publish(
      createEvent(
        "ShipmentQuantumStateInitialized",
        shipment.id,
        "Shipment",
        quantumState,
        1,
        {
          tenantId: shipment.tenantId,
          correlationId: `init-${Date.now()}`,
          userId: shipment.createdBy || "system",
        },
      ),
    );

    // Initialize Cargo Psychology (if available) and apply to quantum state
    try {
      const { initializePsychologyForQuantumState } =
        await import("@/lib/services/cargo-psychology/schrodingers-integration");
      await initializePsychologyForQuantumState(shipment.id);
      // Psychology state will influence quantum probabilities
    } catch (error) {
      // Don't fail if psychology service not available
      console.warn("Cargo Psychology service not available:", error);
    }

    return quantumState;
  }

  /**
   * Get current quantum state for a shipment
   */
  async getQuantumState(
    shipmentId: string,
  ): Promise<ShipmentQuantumState | null> {
    // Check in-memory store first
    const state = store.get(shipmentId);
    if (state) {
      return state;
    }

    // Try to reconstruct from Event Store
    try {
      const events = await eventStore.getEvents(shipmentId);
      const quantumEvents = events.filter(
        (e) =>
          e.type === "ShipmentQuantumStateInitialized" ||
          e.type === "QuantumStateCollapsed",
      );

      if (quantumEvents.length > 0) {
        // Reconstruct state from events
        const lastEvent = quantumEvents[quantumEvents.length - 1];
        return lastEvent.payload as ShipmentQuantumState;
      }
    } catch (error) {
      console.warn("Error reconstructing quantum state from events:", error);
    }

    return null;
  }

  /**
   * Update quantum state based on observation
   * This is the main method for waveform collapse
   */
  async updateQuantumState(
    shipmentId: string,
    trigger: CollapseTrigger,
    triggerData?: Record<string, any>,
  ): Promise<ShipmentQuantumState> {
    // Get current state
    const currentState = await this.getQuantumState(shipmentId);
    if (!currentState) {
      throw new Error(`Quantum state not found for shipment ${shipmentId}`);
    }

    if (currentState.collapsed) {
      // Already collapsed, but we can still update if needed
      console.log(`Quantum state already collapsed for shipment ${shipmentId}`);
    }

    // Collapse waveform
    const updatedState = await probabilityEngine.collapseWaveform(
      currentState,
      trigger,
      triggerData || {},
    );

    // Store updated state
    store.set(shipmentId, updatedState);

    // Publish event
    await eventBus.publish(
      createEvent(
        "QuantumStateCollapsed",
        shipmentId,
        "Shipment",
        {
          trigger,
          previousState: currentState.currentState,
          newState: updatedState.currentState,
          probabilities: updatedState.probabilities,
          triggerData,
        },
        updatedState.observationCount,
        {
          tenantId: updatedState.tenantId,
          correlationId: `collapse-${Date.now()}`,
          userId: "quantum-service",
        },
      ),
    );

    // Store learning signal
    await this.storeLearningSignal(updatedState, currentState, trigger);

    return updatedState;
  }

  /**
   * Get collapse history for a shipment
   */
  async getCollapseHistory(
    shipmentId: string,
    limit: number = 50,
  ): Promise<CollapseEvent[]> {
    const state = await this.getQuantumState(shipmentId);
    if (!state) {
      return [];
    }

    return state.collapseHistory.slice(-limit);
  }

  /**
   * Get quantum state history (time series)
   * Reconstructs from Event Store
   */
  async getStateHistory(
    shipmentId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<ShipmentQuantumState[]> {
    try {
      const events = await eventStore.getEvents(shipmentId);
      const quantumEvents = events.filter((e) => {
        if (
          e.type !== "ShipmentQuantumStateInitialized" &&
          e.type !== "QuantumStateCollapsed"
        ) {
          return false;
        }
        const eventDate = new Date(e.timestamp);
        if (fromDate && eventDate < fromDate) return false;
        if (toDate && eventDate > toDate) return false;
        return true;
      });

      // Reconstruct states from events
      const states: ShipmentQuantumState[] = [];
      for (const event of quantumEvents) {
        if (event.type === "ShipmentQuantumStateInitialized") {
          states.push(event.payload as ShipmentQuantumState);
        } else if (event.type === "QuantumStateCollapsed") {
          // Get the last state and update it
          const lastState = states[states.length - 1];
          if (lastState) {
            const updatedState = await probabilityEngine.collapseWaveform(
              lastState,
              event.payload.trigger,
              event.payload.triggerData || {},
            );
            states.push(updatedState);
          }
        }
      }

      return states;
    } catch (error) {
      console.error("Error getting state history:", error);
      return [];
    }
  }

  /**
   * Subscribe to quantum state updates
   */
  subscribeToUpdates(
    shipmentId: string,
    callback: (state: ShipmentQuantumState) => void,
  ): () => void {
    return store.subscribe(shipmentId, callback);
  }

  /**
   * Get factor weights (learned over time)
   */
  async getFactorWeights(tenantId: string): Promise<Record<string, number>> {
    return probabilityEngine.getFactorWeights(tenantId);
  }

  /**
   * Update factor weights based on learning
   */
  async updateFactorWeights(
    tenantId: string,
    weights: Partial<Record<string, number>>,
  ): Promise<void> {
    const currentWeights = await this.getFactorWeights(tenantId);
    const updatedWeights = { ...currentWeights, ...weights };

    // Normalize weights to sum to 1.0
    const sum = Object.values(updatedWeights).reduce((a, b) => a + b, 0);
    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(updatedWeights)) {
      normalized[key] = value / sum;
    }

    // Store in Knowledge Base
    try {
      await knowledgeBaseService.create({
        tenantId,
        agentId: "schrodingers-truck",
        type: "configuration",
        category: "transportation",
        content: JSON.stringify(normalized),
        summary: "Quantum logistics factor weights",
        metadata: {
          factorWeights: normalized,
          updatedAt: new Date().toISOString(),
        },
        keywords: ["quantum", "logistics", "factor-weights", tenantId],
        searchableText: `quantum logistics factor weights for tenant ${tenantId}`,
        source: "quantum_service",
        confidence: 1.0,
        verified: true,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
      });
    } catch (error) {
      console.error("Error updating factor weights:", error);
    }
  }

  /**
   * Get AI insights for quantum state
   */
  async getAIInsights(
    shipmentId: string,
  ): Promise<ShipmentQuantumState["aiInsights"]> {
    const state = await this.getQuantumState(shipmentId);
    if (!state) {
      return undefined;
    }

    // Return cached insights if available
    if (state.aiInsights) {
      return state.aiInsights;
    }

    // Get from Knowledge Base
    try {
      const results = await knowledgeBaseService.search({
        query: `shipment quantum state ${state.currentState} recommendations risk factors`,
        tenantId: state.tenantId,
        limit: 5,
      });

      return {
        recommendations: results
          .slice(0, 3)
          .map((r) => r.entry.summary || r.entry.content.substring(0, 100)),
        riskFactors: Object.entries(state.factors)
          .filter(([_, value]) => value < 0.6)
          .map(([key, _]) => key),
        similarHistoricalCases: results.map((r) => r.entry.id),
      };
    } catch (error) {
      console.warn("Error getting AI insights:", error);
      return undefined;
    }
  }

  // ============================================================================
  // INTEGRATION METHODS (Delegate to integrations layer)
  // ============================================================================

  /**
   * Handle WhatsApp message
   */
  async handleWhatsAppMessage(
    message: WhatsAppMessage,
  ): Promise<ShipmentQuantumState | null> {
    // Find shipment by phone number (would integrate with shipment service)
    const shipmentId = await this.findShipmentByPhone(message.from);
    if (!shipmentId) {
      return null;
    }

    const state = await this.getQuantumState(shipmentId);
    if (!state) {
      return null;
    }

    const updatedState = await quantumIntegrations.handleWhatsAppMessage(
      message,
      state,
    );
    if (updatedState) {
      store.set(shipmentId, updatedState);
    }
    return updatedState;
  }

  /**
   * Handle geofence event
   */
  async handleGeofenceEvent(
    event: GeofenceEvent,
  ): Promise<ShipmentQuantumState | null> {
    const state = await this.getQuantumState(event.shipmentId);
    if (!state) {
      return null;
    }

    const updatedState = await quantumIntegrations.handleGeofenceEvent(
      event,
      state,
    );
    if (updatedState) {
      store.set(event.shipmentId, updatedState);
    }
    return updatedState;
  }

  /**
   * Handle GPS update
   */
  async handleGPSUpdate(
    update: GPSUpdate,
  ): Promise<ShipmentQuantumState | null> {
    const state = await this.getQuantumState(update.shipmentId);
    if (!state) {
      return null;
    }

    const updatedState = await quantumIntegrations.handleGPSUpdate(
      update,
      state,
    );
    if (updatedState) {
      store.set(update.shipmentId, updatedState);
    }
    return updatedState;
  }

  /**
   * Handle weather alert
   */
  async handleWeatherAlert(alert: WeatherAlert): Promise<void> {
    // Find all active shipments in the affected area
    const activeStates = store.getAll().filter((s) => !s.collapsed);

    for (const state of activeStates) {
      // Check if shipment route passes through alert location
      // (Simplified - in production would check route waypoints)
      const updatedState = await quantumIntegrations.handleWeatherAlert(
        alert,
        state,
      );
      if (updatedState) {
        store.set(state.shipmentId, updatedState);
      }
    }
  }

  /**
   * Handle traffic alert
   */
  async handleTrafficAlert(alert: TrafficAlert): Promise<void> {
    // Find all active shipments in the affected area
    const activeStates = store.getAll().filter((s) => !s.collapsed);

    for (const state of activeStates) {
      const updatedState = await quantumIntegrations.handleTrafficAlert(
        alert,
        state,
      );
      if (updatedState) {
        store.set(state.shipmentId, updatedState);
      }
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Find shipment by driver phone number
   */
  private async findShipmentByPhone(phone: string): Promise<string | null> {
    // In production, would query shipment service
    // For now, try to get from Event Store
    try {
      const events = await eventStore.getEventsByType(
        "ShipmentCreated",
        0,
        100,
      );
      const shipmentEvent = events.find(
        (e) =>
          e.payload?.driverPhone === phone ||
          e.payload?.roadFreightDetails?.driverPhone === phone,
      );
      return shipmentEvent?.aggregateId || null;
    } catch (error) {
      console.warn("Error finding shipment by phone:", error);
      return null;
    }
  }

  /**
   * Store learning signal in Knowledge Base
   */
  private async storeLearningSignal(
    newState: ShipmentQuantumState,
    oldState: ShipmentQuantumState,
    trigger: CollapseTrigger,
  ): Promise<void> {
    try {
      const lastCollapse =
        newState.collapseHistory[newState.collapseHistory.length - 1];
      if (!lastCollapse) return;

      await knowledgeBaseService.learn({
        tenantId: newState.tenantId,
        agentId: "schrodingers-truck",
        type: "waveform_collapse",
        trigger: `Quantum state updated via ${trigger}`,
        input: {
          previousState: oldState.currentState,
          previousProbabilities: oldState.probabilities,
          trigger,
        },
        output: {
          newState: newState.currentState,
          newProbabilities: newState.probabilities,
        },
        confidence: lastCollapse.confidence,
        success: true,
      });
    } catch (error) {
      console.warn("Error storing learning signal:", error);
    }
  }
}

// Export singleton instance
export const schrodingersTruckService: SchrodingersTruckService =
  new SchrodingersTruckServiceImpl();

// Export for convenience
export default schrodingersTruckService;
