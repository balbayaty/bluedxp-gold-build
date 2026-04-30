/**
 * Decision Infrastructure Core
 * Unified Decision Ontology + Decision Primitives
 *
 * Main entry point for the decision infrastructure
 */

// Core types
export * from "./types";

// Services
export { decisionService } from "./decisionService";
export {
  controlsRegistry,
  initializeDefaultControls,
} from "./controlsRegistry";

// Primitives
export { DecisionPrimitives } from "./primitives";

// Re-export for convenience
import { decisionService } from "./decisionService";
import { DecisionPrimitives } from "./primitives";
import { controlsRegistry } from "./controlsRegistry";

export default {
  service: decisionService,
  primitives: DecisionPrimitives,
  controls: controlsRegistry,
};
