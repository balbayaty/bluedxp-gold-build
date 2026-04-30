/**
 * Feature Registry - Auto-Discovery
 * Automatically discovers features from codebase
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { FeatureDefinition, FeatureDomain, FeatureStatus } from './types';
import { registerFeature } from './registry';

interface DiscoveryConfig {
  scanModules: boolean;
  scanServices: boolean;
  scanRoutes: boolean;
  scanTypes: boolean;
}

/**
 * Auto-discover features from codebase
 */
export async function discoverFeaturesFromCodebase(
  config: Partial<DiscoveryConfig> = {}
): Promise<FeatureDefinition[]> {
  const fullConfig: DiscoveryConfig = {
    scanModules: true,
    scanServices: true,
    scanRoutes: true,
    scanTypes: true,
    ...config,
  };

  const discovered: FeatureDefinition[] = [];

  // Discover from modules
  if (fullConfig.scanModules) {
    const modules = await discoverFromModules();
    discovered.push(...modules);
  }

  // Discover from services
  if (fullConfig.scanServices) {
    const services = await discoverFromServices();
    discovered.push(...services);
  }

  // Discover from API routes
  if (fullConfig.scanRoutes) {
    const routes = await discoverFromRoutes();
    discovered.push(...routes);
  }

  // Discover from types
  if (fullConfig.scanTypes) {
    const types = await discoverFromTypes();
    discovered.push(...types);
  }

  return discovered;
}

/**
 * Discover features from module definitions
 */
async function discoverFromModules(): Promise<FeatureDefinition[]> {
  const features: FeatureDefinition[] = [];
  const moduleFiles = await glob('lib/modules/*.ts', { ignore: ['**/index.ts', '**/registry.ts'] });

  for (const file of moduleFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const moduleName = path.basename(file, '.ts');
      const domain = mapModuleToDomain(moduleName);

      // Extract module info
      const moduleMatch = content.match(/export\s+const\s+\w+Module:\s*ModuleDefinition\s*=\s*\{([\s\S]*?)\}/);
      if (moduleMatch) {
        const moduleContent = moduleMatch[1];

        // Extract routes
        const routesMatch = moduleContent.match(/routes:\s*\[([\s\S]*?)\]/);
        if (routesMatch) {
          const routes = routesMatch[1];
          const routeMatches = routes.matchAll(/path:\s*['"]([^'"]+)['"]/g);
          
          for (const match of routeMatches) {
            const routePath = match[1];
            const featureId = `module.${moduleName}.route.${routePath.replace(/\//g, '.')}`;
            
            features.push({
              id: featureId,
              name: `${moduleName} - ${routePath}`,
              description: `Route ${routePath} in ${moduleName} module`,
              domain,
              status: 'implemented',
              moduleId: moduleName,
              apis: [],
              uiSurfaces: [{
                route: routePath,
                componentPath: '',
                title: routePath,
              }],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              version: '1.0.0',
            });
          }
        }

        // Extract APIs
        const apisMatch = moduleContent.match(/apis:\s*\[([\s\S]*?)\]/);
        if (apisMatch) {
          const apis = apisMatch[1];
          const apiMatches = apis.matchAll(/endpoint:\s*['"]([^'"]+)['"].*?method:\s*['"]([^'"]+)['"]/gs);
          
          for (const match of apiMatches) {
            const endpoint = match[1];
            const method = match[2] as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
            const featureId = `module.${moduleName}.api.${method.toLowerCase()}.${endpoint.replace(/\//g, '.')}`;
            
            features.push({
              id: featureId,
              name: `${moduleName} - ${method} ${endpoint}`,
              description: `API endpoint ${method} ${endpoint} in ${moduleName} module`,
              domain,
              status: 'implemented',
              moduleId: moduleName,
              apis: [{
                endpoint,
                method,
                description: '',
                requiresAuth: true,
              }],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              version: '1.0.0',
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error discovering from module ${file}:`, error);
    }
  }

  return features;
}

/**
 * Discover features from services
 */
async function discoverFromServices(): Promise<FeatureDefinition[]> {
  const features: FeatureDefinition[] = [];
  const serviceDirs = await glob('lib/services/*/', { ignore: ['node_modules/**'] });

  for (const dir of serviceDirs) {
    try {
      const serviceName = path.basename(dir);
      const indexFile = path.join(dir, 'index.ts');
      
      if (fs.existsSync(indexFile)) {
        const content = fs.readFileSync(indexFile, 'utf-8');
        const domain = mapServiceToDomain(serviceName);

        // Extract exported functions
        const exportMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
        
        for (const match of exportMatches) {
          const functionName = match[1];
          const featureId = `service.${serviceName}.${functionName}`;
          
          features.push({
            id: featureId,
            name: `${serviceName} - ${functionName}`,
            description: `Service function ${functionName} in ${serviceName} service`,
            domain,
            status: 'implemented',
            canonicalServicePath: `${dir}index.ts`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: '1.0.0',
          });
        }
      }
    } catch (error) {
      console.error(`Error discovering from service ${dir}:`, error);
    }
  }

  return features;
}

/**
 * Discover features from API routes
 */
async function discoverFromRoutes(): Promise<FeatureDefinition[]> {
  const features: FeatureDefinition[] = [];
  const routeFiles = await glob('app/api/**/route.ts');

  for (const file of routeFiles) {
    try {
      const parts = file.split(path.sep);
      const apiIndex = parts.indexOf('api');
      const routePath = '/' + parts.slice(apiIndex + 1, -1).join('/');
      
      const content = fs.readFileSync(file, 'utf-8');
      const domain = mapRouteToDomain(routePath);

      // Extract HTTP methods
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].filter(method =>
        content.includes(`export async function ${method.toLowerCase()}`) ||
        content.includes(`export const ${method.toLowerCase()}`)
      );

      methods.forEach(method => {
        const featureId = `api.${routePath.replace(/\//g, '.')}.${method.toLowerCase()}`;
        
        features.push({
          id: featureId,
          name: `${method} ${routePath}`,
          description: `API endpoint ${method} ${routePath}`,
          domain,
          status: 'implemented',
          apis: [{
            endpoint: routePath,
            method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
            description: '',
            requiresAuth: true,
            routePath: file,
          }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
        });
      });
    } catch (error) {
      console.error(`Error discovering from route ${file}:`, error);
    }
  }

  return features;
}

/**
 * Discover features from types
 */
async function discoverFromTypes(): Promise<FeatureDefinition[]> {
  const features: FeatureDefinition[] = [];
  const typeFiles = await glob('types/**/*.ts');

  for (const file of typeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const typeName = path.basename(file, '.ts');
      const domain = mapTypeToDomain(typeName);

      // Extract interfaces and types
      const interfaceMatches = content.matchAll(/(?:export\s+)?(?:interface|type)\s+(\w+)/g);
      
      for (const match of interfaceMatches) {
        const interfaceName = match[1];
        if (interfaceName.length > 2 && !interfaceName.startsWith('_')) {
          const featureId = `type.${typeName}.${interfaceName}`;
          
          features.push({
            id: featureId,
            name: `${typeName} - ${interfaceName}`,
            description: `Type definition ${interfaceName} in ${typeName}`,
            domain,
            status: 'implemented',
            entities: [{
              name: interfaceName,
              typePath: file,
            }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: '1.0.0',
          });
        }
      }
    } catch (error) {
      console.error(`Error discovering from type ${file}:`, error);
    }
  }

  return features;
}

/**
 * Map module name to domain
 */
function mapModuleToDomain(moduleName: string): FeatureDomain {
  const mapping: Record<string, FeatureDomain> = {
    'wms': 'wms',
    'tms': 'tms',
    'qhse': 'qhse',
    'procurement': 'procurement',
    'trade-compliance': 'trade-compliance',
    'truth-engine': 'truth-engine',
    'hazalyze': 'hazalyze',
    'maas': 'maas',
    'compliance': 'compliance',
    'finance': 'finance',
    'crm': 'crm',
    'digital-signature': 'digital-signature',
    'marketplace': 'marketplace',
    'warehouse-network': 'warehouse-network',
    'facility-management': 'facility-management',
    'project-management': 'project-management',
    'proposals-rfq': 'proposals-rfq',
    'hr': 'hr',
    'iot': 'iot',
    'business-intelligence': 'business-intelligence',
    'communication': 'communication',
  };

  return mapping[moduleName] || 'other';
}

/**
 * Map service name to domain
 */
function mapServiceToDomain(serviceName: string): FeatureDomain {
  // Try to infer from service name
  if (serviceName.includes('wms') || serviceName.includes('warehouse')) return 'wms';
  if (serviceName.includes('tms') || serviceName.includes('transport')) return 'tms';
  if (serviceName.includes('qhse')) return 'qhse';
  if (serviceName.includes('procurement')) return 'procurement';
  if (serviceName.includes('trade') || serviceName.includes('compliance')) return 'trade-compliance';
  if (serviceName.includes('truth')) return 'truth-engine';
  if (serviceName.includes('hazalyze') || serviceName.includes('chemical')) return 'hazalyze';
  if (serviceName.includes('maas') || serviceName.includes('manufacturing')) return 'maas';
  if (serviceName.includes('finance')) return 'finance';
  if (serviceName.includes('crm')) return 'crm';
  if (serviceName.includes('digital-signature')) return 'digital-signature';
  if (serviceName.includes('marketplace')) return 'marketplace';
  if (serviceName.includes('warehouse-network')) return 'warehouse-network';
  if (serviceName.includes('facility')) return 'facility-management';
  if (serviceName.includes('project')) return 'project-management';
  if (serviceName.includes('proposal')) return 'proposals-rfq';
  if (serviceName.includes('hr')) return 'hr';
  if (serviceName.includes('iot')) return 'iot';
  if (serviceName.includes('business-intelligence') || serviceName.includes('bi')) return 'business-intelligence';
  if (serviceName.includes('communication')) return 'communication';
  
  return 'other';
}

/**
 * Map route path to domain
 */
function mapRouteToDomain(routePath: string): FeatureDomain {
  if (routePath.includes('/warehouse') || routePath.includes('/wms')) return 'wms';
  if (routePath.includes('/transportation') || routePath.includes('/tms') || routePath.includes('/shipment')) return 'tms';
  if (routePath.includes('/qhse')) return 'qhse';
  if (routePath.includes('/procurement')) return 'procurement';
  if (routePath.includes('/trade') || routePath.includes('/compliance')) return 'trade-compliance';
  if (routePath.includes('/truth')) return 'truth-engine';
  if (routePath.includes('/hazalyze') || routePath.includes('/msds') || routePath.includes('/chemical')) return 'hazalyze';
  if (routePath.includes('/maas') || routePath.includes('/manufacturing')) return 'maas';
  if (routePath.includes('/finance')) return 'finance';
  if (routePath.includes('/crm')) return 'crm';
  if (routePath.includes('/digital-signature')) return 'digital-signature';
  if (routePath.includes('/marketplace')) return 'marketplace';
  if (routePath.includes('/warehouse-network')) return 'warehouse-network';
  if (routePath.includes('/facility')) return 'facility-management';
  if (routePath.includes('/project')) return 'project-management';
  if (routePath.includes('/proposal')) return 'proposals-rfq';
  if (routePath.includes('/hr')) return 'hr';
  if (routePath.includes('/iot')) return 'iot';
  if (routePath.includes('/business-intelligence') || routePath.includes('/bi')) return 'business-intelligence';
  if (routePath.includes('/communication')) return 'communication';
  
  return 'other';
}

/**
 * Map type name to domain
 */
function mapTypeToDomain(typeName: string): FeatureDomain {
  return mapServiceToDomain(typeName);
}













