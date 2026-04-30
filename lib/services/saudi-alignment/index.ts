/**
 * Saudi Alignment Service
 *
 * Main export file - provides unified interface
 *
 * @module saudi-alignment
 */

export * from "./types";
export * from "./vision-2030-mapper";
export * from "./regulatory-tracker";
export * from "./compliance-scorer";
export * from "./report-generator";
export * from "./service";

export { saudiAlignmentService as default } from "./service";
export { vision2030Mapper } from "./vision-2030-mapper";
export { regulatoryTracker } from "./regulatory-tracker";
export { complianceScorer } from "./compliance-scorer";
export { reportGenerator } from "./report-generator";
