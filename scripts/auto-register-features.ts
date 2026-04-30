/**
 * Auto-register features from codebase
 * Discovers and registers all features automatically
 */

import { discoverFeaturesFromCodebase } from '@/lib/feature-registry/auto-discovery';
import { getFeatureRegistry } from '@/lib/feature-registry';
import * as fs from 'fs';
import * as path from 'path';

async function autoRegisterFeatures() {
  console.log('Auto-discovering and registering features from codebase...\n');

  // Discover features
  const discovered = await discoverFeaturesFromCodebase({
    scanModules: true,
    scanServices: true,
    scanRoutes: true,
    scanTypes: true,
  });

  console.log(`Discovered ${discovered.length} features\n`);

  // Register all discovered features
  const registry = getFeatureRegistry();
  let registered = 0;
  let skipped = 0;

  for (const feature of discovered) {
    try {
      if (!registry.hasFeature(feature.id)) {
        registry.register(feature);
        registered++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Error registering feature ${feature.id}:`, error);
    }
  }

  console.log(`\n✅ Auto-registration complete!`);
  console.log(`   Registered: ${registered}`);
  console.log(`   Skipped (already exists): ${skipped}`);
  console.log(`   Total features: ${registry.getAllFeatures().length}`);
}

// Run if called directly
if (require.main === module) {
  autoRegisterFeatures().catch(console.error);
}

export { autoRegisterFeatures };













