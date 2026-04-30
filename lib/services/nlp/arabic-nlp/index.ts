/**
 * Arabic-Native NLP Service
 *
 * Main export file - provides unified interface
 *
 * @module arabic-nlp
 */

export * from "./types";
export * from "./arabic-nlp-engine";
export * from "./dialect-processor";
export * from "./inshallah-analyzer";
export * from "./cultural-context";
export * from "./intent-detector";
export * from "./sentiment-analyzer";
export * from "./service";

export { arabicNLPService as default } from "./service";
export { arabicNLPEngine } from "./arabic-nlp-engine";
export { dialectProcessor } from "./dialect-processor";
export { inshallahAnalyzer } from "./inshallah-analyzer";
export { culturalContextAnalyzer } from "./cultural-context";
export { intentDetector } from "./intent-detector";
export { sentimentAnalyzer } from "./sentiment-analyzer";
