/**
 * Schrödinger's Truck Integration
 *
 * Integrates Cargo Psychology with Quantum Logistics
 * Psychology state influences quantum state probabilities
 *
 * @module cargo-psychology
 */

import { schrodingersTruckService } from "@/lib/services/schrodingers-truck";
import { cargoPsychologyService } from "./service";
import type { PsychologyState } from "./types";

/**
 * Apply psychology state to quantum state
 * Psychology state influences quantum probabilities
 */
export async function applyPsychologyToQuantumState(
  shipmentId: string,
): Promise<void> {
  try {
    // Get psychology state
    const psychologyState =
      await cargoPsychologyService.getPsychologyState(shipmentId);
    if (!psychologyState) {
      return; // No psychology state yet
    }

    // Get quantum state
    const quantumState =
      await schrodingersTruckService.getQuantumState(shipmentId);
    if (!quantumState) {
      return; // No quantum state yet
    }

    // Psychology state influences quantum probabilities
    // COMMITTED → increases onTime probability
    // PHANTOM → increases noShow probability
    // CONTINGENT → increases delayed probability

    const psychologyMultiplier = getPsychologyMultiplier(
      psychologyState.currentState,
    );

    // Adjust quantum probabilities based on psychology
    const adjustedProbabilities = {
      onTime: Math.min(
        0.99,
        quantumState.probabilities.onTime * psychologyMultiplier.onTime,
      ),
      delayed: Math.min(
        0.99,
        quantumState.probabilities.delayed * psychologyMultiplier.delayed,
      ),
      noShow: Math.min(
        0.99,
        quantumState.probabilities.noShow * psychologyMultiplier.noShow,
      ),
    };

    // Normalize
    const sum =
      adjustedProbabilities.onTime +
      adjustedProbabilities.delayed +
      adjustedProbabilities.noShow;
    const normalized = {
      onTime: adjustedProbabilities.onTime / sum,
      delayed: adjustedProbabilities.delayed / sum,
      noShow: adjustedProbabilities.noShow / sum,
    };

    // Update quantum state (if probabilities changed significantly)
    const changeThreshold = 0.05;
    const onTimeChange = Math.abs(
      normalized.onTime - quantumState.probabilities.onTime,
    );

    if (onTimeChange >= changeThreshold) {
      await schrodingersTruckService.updateQuantumState(
        shipmentId,
        "MANUAL_UPDATE",
        {
          trigger: "CARGO_PSYCHOLOGY_UPDATE",
          psychologyState: psychologyState.currentState,
          psychologyScore: psychologyState.currentScore.score,
          previousProbabilities: quantumState.probabilities,
          newProbabilities: normalized,
        },
      );
    }
  } catch (error) {
    console.warn("Error applying psychology to quantum state:", error);
  }
}

/**
 * Get psychology multiplier for quantum probabilities
 */
function getPsychologyMultiplier(psychologyState: PsychologyState): {
  onTime: number;
  delayed: number;
  noShow: number;
} {
  switch (psychologyState) {
    case "COMMITTED":
      return {
        onTime: 1.15, // Increase on-time probability
        delayed: 0.9, // Decrease delayed probability
        noShow: 0.7, // Decrease no-show probability
      };
    case "CONTINGENT":
      return {
        onTime: 0.95, // Slight decrease
        delayed: 1.1, // Increase delayed probability
        noShow: 1.05, // Slight increase
      };
    case "PHANTOM":
      return {
        onTime: 0.8, // Decrease on-time probability
        delayed: 1.1, // Increase delayed probability
        noShow: 1.3, // Significantly increase no-show probability
      };
  }
}

/**
 * Initialize psychology analysis when quantum state is created
 */
export async function initializePsychologyForQuantumState(
  shipmentId: string,
): Promise<void> {
  try {
    // Analyze shipment psychology
    await cargoPsychologyService.analyzeShipment(shipmentId);

    // Apply to quantum state
    await applyPsychologyToQuantumState(shipmentId);
  } catch (error) {
    console.warn("Error initializing psychology for quantum state:", error);
  }
}
