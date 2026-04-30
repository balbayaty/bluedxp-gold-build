/**
 * Shipment State Machine - Export
 *
 * Formal state machine for shipment lifecycle with:
 * - 15+ defined states with transition rules
 * - Automated actions on state changes
 * - Integration with all platform modules
 * - Event-driven state transitions
 * - Validation and error handling
 */

export {
  shipmentStateMachine,
  type StateDefinition,
  type StateValidation,
  type StateAutomation,
  type TransitionResult,
  type StateContext,
} from "./shipmentStateMachine";
