/**
 * Schrödinger's Truck Quantum Logistics Service
 *
 * Main export file - provides unified interface
 *
 * @module schrodingers-truck
 */

export * from "./types";
export * from "./probability-engine";
export * from "./integrations";
export * from "./service";

export { schrodingersTruckService as default } from "./service";
export { probabilityEngine } from "./probability-engine";
export { quantumIntegrations } from "./integrations";
