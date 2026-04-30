/**
 * Ecosystem Services
 * Universal transportation ecosystem intelligence platform
 * Source: Adapted from chemcheck-analysis/lib/ecosystem/
 */

export { UniversalAPIGateway, getUniversalAPIGateway } from "./apiGateway";
export { RealTimePriceEngine, realTimePriceEngine } from "./realtimePrice";
export { LiveRouteOptimizer, liveRouteOptimizer } from "./routeOptimizer";
export {
  MultiModalBookingEngine,
  multiModalBookingEngine,
} from "./multiModalBooking";
export { PriceIndexEngine, priceIndexEngine } from "./priceIndex";
export {
  UniversalComparisonEngine,
  universalComparisonEngine,
} from "./comparison";
export { LiveDataAggregationEngine, liveDataEngine } from "./liveData";
export {
  AIEcosystemOptimizationEngine,
  aiOptimizationEngine,
} from "./aiOptimization";

// Type exports
export type {
  PricePoint,
  PricePrediction,
  MarketInsights,
  PriceAlert,
} from "./realtimePrice";
export type {
  RouteOptimizationRequest,
  RouteOption,
  RouteUpdate,
} from "./routeOptimizer";
export type {
  UniversalBookingRequest,
  UniversalBookingResponse,
  ComprehensiveBookingOption,
} from "./multiModalBooking";
export type {
  PriceIndex,
  PriceDataPoint,
  MarketIntelligence,
  PricePrediction as PriceIndexPrediction,
} from "./priceIndex";
export type {
  UniversalComparisonRequest,
  UniversalComparisonResult,
  RankedOption,
} from "./comparison";
export type {
  LiveDataStream,
  LiveDataPoint,
  DataCategory,
  RealTimeAnalytics,
  DataAnomaly,
} from "./liveData";
export type {
  OptimizationRequest,
  OptimizationResult,
  OptimizedSolution,
  MLModel,
  OptimizationMetrics,
} from "./aiOptimization";
