/**
 * Feature Registry - Public API
 * Single source of truth for all features in BlueDXP platform
 */

export * from './types';
export * from './registry';

// Re-export for convenience
export {
  getFeatureRegistry,
  registerFeature,
  getFeature,
  getAllFeatures,
  getFeaturesByDomain,
  getFeaturesByStatus,
  getDomainCompleteness,
} from './registry';













