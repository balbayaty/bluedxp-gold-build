/**
 * Scalability Services Index
 *
 * Exports all scalability services
 */

export { databaseShardingService } from "../../database/shardingService";
export { cdnService } from "../cdn/cdnService";
export { performanceOptimizationService } from "../performance/optimizationService";
export { advancedCacheService } from "../caching/advancedCacheService";

export type {
  Shard,
  ShardAssignment,
  ReplicationLag,
} from "../../database/shardingService";

export type { CDNConfig, EdgeFunction, CacheRule } from "../cdn/cdnService";

export type {
  OptimizationRecommendation,
  QueryOptimization,
  CacheStrategy,
} from "../performance/optimizationService";
