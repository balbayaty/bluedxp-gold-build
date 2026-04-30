/**
 * Self-Learning Architecture
 *
 * Main export file - provides unified interface
 *
 * @module learning
 */

export * from "./signals";
export * from "./signal-capture";
export * from "./knowledge-updater";
export * from "./prediction-tracker";

export { signalCaptureService } from "./signal-capture";
export { knowledgeUpdaterService } from "./knowledge-updater";
export { predictionTrackerService } from "./prediction-tracker";
