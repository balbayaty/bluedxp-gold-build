/**
 * Feature Registry - Core Registry
 * Single source of truth for all features in BlueDXP platform
 * Prevents duplication and enables governance
 */

import { FeatureDefinition, FeatureStatus, FeatureDomain, FeatureRegistryConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_CONFIG: FeatureRegistryConfig = {
  enforceRegistration: true,
  autoDiscover: false,
  storage: 'file',
  storagePath: path.join(process.cwd(), 'lib/feature-registry/features.json'),
};

class FeatureRegistry {
  private features: Map<string, FeatureDefinition> = new Map();
  private config: FeatureRegistryConfig;

  constructor(config: Partial<FeatureRegistryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFeatures();
  }

  /**
   * Register a feature
   */
  register(feature: Omit<FeatureDefinition, 'createdAt' | 'updatedAt' | 'version'> & { version?: string }): void {
    const now = Date.now();
    const existing = this.features.get(feature.id);

    const featureDef: FeatureDefinition = {
      ...feature,
      version: feature.version || '1.0.0',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    // Validate feature
    this.validateFeature(featureDef);

    // Check for duplicates
    this.checkDuplicates(featureDef);

    this.features.set(feature.id, featureDef);
    this.saveFeatures();
  }

  /**
   * Get feature by ID
   */
  getFeature(id: string): FeatureDefinition | undefined {
    return this.features.get(id);
  }

  /**
   * Get all features
   */
  getAllFeatures(): FeatureDefinition[] {
    return Array.from(this.features.values());
  }

  /**
   * Get features by domain
   */
  getFeaturesByDomain(domain: FeatureDomain): FeatureDefinition[] {
    return Array.from(this.features.values()).filter(f => f.domain === domain);
  }

  /**
   * Get features by status
   */
  getFeaturesByStatus(status: FeatureStatus): FeatureDefinition[] {
    return Array.from(this.features.values()).filter(f => f.status === status);
  }

  /**
   * Get features by module
   */
  getFeaturesByModule(moduleId: string): FeatureDefinition[] {
    return Array.from(this.features.values()).filter(f => f.moduleId === moduleId);
  }

  /**
   * Check if feature exists
   */
  hasFeature(id: string): boolean {
    return this.features.has(id);
  }

  /**
   * Update feature status
   */
  updateFeatureStatus(id: string, status: FeatureStatus): void {
    const feature = this.features.get(id);
    if (feature) {
      feature.status = status;
      feature.updatedAt = Date.now();
      this.saveFeatures();
    }
  }

  /**
   * Search features
   */
  searchFeatures(query: string): FeatureDefinition[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.features.values()).filter(f =>
      f.name.toLowerCase().includes(lowerQuery) ||
      f.description.toLowerCase().includes(lowerQuery) ||
      f.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get feature completeness by domain
   */
  getDomainCompleteness(): Record<FeatureDomain, { total: number; implemented: number; percentage: number }> {
    const domains: FeatureDomain[] = [
      'wms', 'tms', 'qhse', 'procurement', 'trade-compliance', 'truth-engine',
      'hazalyze', 'maas', 'compliance', 'finance', 'crm', 'digital-signature',
      'marketplace', 'warehouse-network', 'facility-management', 'project-management',
      'proposals-rfq', 'hr', 'iot', 'business-intelligence', 'communication', 'platform', 'other'
    ];

    const result: Record<string, { total: number; implemented: number; percentage: number }> = {};

    domains.forEach(domain => {
      const features = this.getFeaturesByDomain(domain);
      const implemented = features.filter(f => f.status === 'implemented').length;
      result[domain] = {
        total: features.length,
        implemented,
        percentage: features.length > 0 ? (implemented / features.length) * 100 : 0,
      };
    });

    return result as Record<FeatureDomain, { total: number; implemented: number; percentage: number }>;
  }

  /**
   * Validate feature definition
   */
  private validateFeature(feature: FeatureDefinition): void {
    if (!feature.id || !feature.name || !feature.description) {
      throw new Error('Feature must have id, name, and description');
    }

    if (!feature.domain) {
      throw new Error('Feature must have a domain');
    }

    // Check dependencies exist
    if (feature.dependencies) {
      const missingDeps = feature.dependencies.filter(dep => !this.features.has(dep));
      if (missingDeps.length > 0 && this.config.enforceRegistration) {
        console.warn(`Feature ${feature.id} has missing dependencies: ${missingDeps.join(', ')}`);
      }
    }
  }

  /**
   * Check for duplicate features
   */
  private checkDuplicates(feature: FeatureDefinition): void {
    // Check for duplicate names
    const duplicateName = Array.from(this.features.values()).find(
      f => f.id !== feature.id && f.name.toLowerCase() === feature.name.toLowerCase()
    );

    if (duplicateName) {
      console.warn(`Feature ${feature.id} has duplicate name with ${duplicateName.id}`);
    }

    // Check for duplicate API endpoints
    if (feature.apis) {
      feature.apis.forEach(api => {
        const duplicate = Array.from(this.features.values())
          .filter(f => f.id !== feature.id)
          .flatMap(f => f.apis || [])
          .find(a => a.endpoint === api.endpoint && a.method === api.method);

        if (duplicate) {
          throw new Error(
            `Duplicate API endpoint: ${api.method} ${api.endpoint} already registered in another feature`
          );
        }
      });
    }
  }

  /**
   * Load features from storage
   */
  private loadFeatures(): void {
    if (this.config.storage === 'file' && this.config.storagePath) {
      try {
        if (fs.existsSync(this.config.storagePath)) {
          const data = fs.readFileSync(this.config.storagePath, 'utf-8');
          const features: FeatureDefinition[] = JSON.parse(data);
          features.forEach(f => this.features.set(f.id, f));
        }
      } catch (error) {
        console.error('Error loading features:', error);
      }
    }
  }

  /**
   * Save features to storage
   */
  private saveFeatures(): void {
    if (this.config.storage === 'file' && this.config.storagePath) {
      try {
        const dir = path.dirname(this.config.storagePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const features = Array.from(this.features.values());
        fs.writeFileSync(this.config.storagePath, JSON.stringify(features, null, 2));
      } catch (error) {
        console.error('Error saving features:', error);
      }
    }
  }

  /**
   * Export features as JSON
   */
  export(): FeatureDefinition[] {
    return Array.from(this.features.values());
  }

  /**
   * Import features from JSON
   */
  import(features: FeatureDefinition[]): void {
    features.forEach(f => {
      this.features.set(f.id, f);
    });
    this.saveFeatures();
  }
}

// Singleton instance
let registryInstance: FeatureRegistry | null = null;

export function getFeatureRegistry(config?: Partial<FeatureRegistryConfig>): FeatureRegistry {
  if (!registryInstance) {
    registryInstance = new FeatureRegistry(config);
  }
  return registryInstance;
}

export function registerFeature(
  feature: Omit<FeatureDefinition, 'createdAt' | 'updatedAt' | 'version'> & { version?: string }
): void {
  getFeatureRegistry().register(feature);
}

export function getFeature(id: string): FeatureDefinition | undefined {
  return getFeatureRegistry().getFeature(id);
}

export function getAllFeatures(): FeatureDefinition[] {
  return getFeatureRegistry().getAllFeatures();
}

export function getFeaturesByDomain(domain: FeatureDomain): FeatureDefinition[] {
  return getFeatureRegistry().getFeaturesByDomain(domain);
}

export function getFeaturesByStatus(status: FeatureStatus): FeatureDefinition[] {
  return getFeatureRegistry().getFeaturesByStatus(status);
}

export function getDomainCompleteness() {
  return getFeatureRegistry().getDomainCompleteness();
}

// Export types
export * from './types';













