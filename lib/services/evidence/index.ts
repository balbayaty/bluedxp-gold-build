/**
 * Evidence Service
 *
 * Main export file - provides unified interface
 *
 * @module evidence
 */

export * from "./evidenceService";
export * from "./merkle-tree";
export * from "./contradiction-detector";
export * from "./packet-types";
export * from "./packet-generator";
export * from "./packet-service";

export { evidenceService } from "./evidenceService";
export { merkleTreeBuilder } from "./merkle-tree";
export { contradictionDetector } from "./contradiction-detector";
export { evidencePacketGenerator } from "./packet-generator";
export { evidencePacketService } from "./packet-service";
