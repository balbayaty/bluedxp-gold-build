/**
 * Repo Reality Map Generator
 * Generates complete codebase inventory per master prompt PHASE 0
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface ModuleMap {
  moduleName: string;
  pages: string[];
  components: string[];
  services: string[];
  routes: string[];
  apis: string[];
}

interface ServiceMap {
  serviceName: string;
  exportedFunctions: string[];
  usedBy: string[];
  filePath: string;
}

interface APIMap {
  route: string;
  handler: string;
  servicesCalled: string[];
  dataModels: string[];
}

interface DataMap {
  typeName: string;
  schema: string;
  persistedLocation: string;
  ownership: string;
}

interface RepoRealityMap {
  generatedAt: string;
  moduleMap: ModuleMap[];
  serviceMap: ServiceMap[];
  apiMap: APIMap[];
  dataMap: DataMap[];
}

/**
 * Generate Repo Reality Map
 */
export async function generateRepoRealityMap(): Promise<RepoRealityMap> {
  console.log('Generating Repo Reality Map...\n');

  const map: RepoRealityMap = {
    generatedAt: new Date().toISOString(),
    moduleMap: [],
    serviceMap: [],
    apiMap: [],
    dataMap: [],
  };

  // A) Module Map
  console.log('Building module map...');
  map.moduleMap = await buildModuleMap();

  // B) Service Map
  console.log('Building service map...');
  map.serviceMap = await buildServiceMap();

  // C) API Map
  console.log('Building API map...');
  map.apiMap = await buildAPIMap();

  // D) Data Map
  console.log('Building data map...');
  map.dataMap = await buildDataMap();

  console.log('\n✅ Repo Reality Map generated!');
  console.log(`  Modules: ${map.moduleMap.length}`);
  console.log(`  Services: ${map.serviceMap.length}`);
  console.log(`  APIs: ${map.apiMap.length}`);
  console.log(`  Data Types: ${map.dataMap.length}`);

  return map;
}

/**
 * Build module map
 */
async function buildModuleMap(): Promise<ModuleMap[]> {
  const modules: ModuleMap[] = [];
  const moduleFiles = await glob('lib/modules/*.ts', { ignore: ['**/index.ts', '**/registry.ts'] });

  for (const file of moduleFiles) {
    try {
      const moduleName = path.basename(file, '.ts');
      const content = fs.readFileSync(file, 'utf-8');

      // Extract routes
      const routesMatch = content.match(/routes:\s*\[([\s\S]*?)\]/);
      const routes: string[] = [];
      if (routesMatch) {
        const routeMatches = routesMatch[1].matchAll(/path:\s*['"]([^'"]+)['"]/g);
        for (const match of routeMatches) {
          routes.push(match[1]);
        }
      }

      // Extract components
      const componentsMatch = content.match(/components:\s*\[([\s\S]*?)\]/);
      const components: string[] = [];
      if (componentsMatch) {
        const componentMatches = componentsMatch[1].matchAll(/['"]([^'"]+)['"]/g);
        for (const match of componentMatches) {
          components.push(match[1]);
        }
      }

      // Extract services
      const servicesMatch = content.match(/services:\s*\[([\s\S]*?)\]/);
      const services: string[] = [];
      if (servicesMatch) {
        const serviceMatches = servicesMatch[1].matchAll(/['"]([^'"]+)['"]/g);
        for (const match of serviceMatches) {
          services.push(match[1]);
        }
      }

      // Extract APIs
      const apisMatch = content.match(/apis:\s*\[([\s\S]*?)\]/);
      const apis: string[] = [];
      if (apisMatch) {
        const apiMatches = apisMatch[1].matchAll(/endpoint:\s*['"]([^'"]+)['"]/g);
        for (const match of apiMatches) {
          apis.push(match[1]);
        }
      }

      // Find pages for this module
      const pages: string[] = [];
      const pageFiles = await glob(`app/**/page.tsx`);
      for (const pageFile of pageFiles) {
        const pageContent = fs.readFileSync(pageFile, 'utf-8');
        if (pageContent.includes(moduleName) || pageContent.includes(`/${moduleName}/`)) {
          const pagePath = pageFile.replace(/^app\//, '/').replace(/\/page\.tsx$/, '');
          pages.push(pagePath);
        }
      }

      modules.push({
        moduleName,
        pages,
        components,
        services,
        routes,
        apis,
      });
    } catch (error) {
      console.error(`Error processing module ${file}:`, error);
    }
  }

  return modules;
}

/**
 * Build service map
 */
async function buildServiceMap(): Promise<ServiceMap[]> {
  const services: ServiceMap[] = [];
  const serviceFiles = await glob('lib/services/**/*.ts', {
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
  });

  for (const file of serviceFiles) {
    try {
      const serviceName = path.basename(file, '.ts');
      const content = fs.readFileSync(file, 'utf-8');

      // Extract exported functions
      const exportedFunctions: string[] = [];
      const functionMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
      for (const match of functionMatches) {
        exportedFunctions.push(match[1]);
      }

      const constMatches = content.matchAll(/export\s+const\s+(\w+)\s*[:=]\s*(?:async\s+)?\(/g);
      for (const match of constMatches) {
        exportedFunctions.push(match[1]);
      }

      // Find where this service is used
      const usedBy: string[] = [];
      const allFiles = await glob(['lib/**/*.ts', 'app/**/*.ts', 'app/**/*.tsx']);
      for (const otherFile of allFiles) {
        if (otherFile === file) continue;
        try {
          const otherContent = fs.readFileSync(otherFile, 'utf-8');
          if (otherContent.includes(serviceName) || otherContent.includes(`from '${file}'`) || otherContent.includes(`from "${file}"`)) {
            usedBy.push(otherFile);
          }
        } catch {
          // Skip files that can't be read
        }
      }

      services.push({
        serviceName,
        exportedFunctions,
        usedBy,
        filePath: file,
      });
    } catch (error) {
      console.error(`Error processing service ${file}:`, error);
    }
  }

  return services;
}

/**
 * Build API map
 */
async function buildAPIMap(): Promise<APIMap[]> {
  const apis: APIMap[] = [];
  const routeFiles = await glob('app/api/**/route.ts');

  for (const file of routeFiles) {
    try {
      const parts = file.split(path.sep);
      const apiIndex = parts.indexOf('api');
      const route = '/' + parts.slice(apiIndex + 1, -1).join('/');
      
      const content = fs.readFileSync(file, 'utf-8');

      // Extract handler function
      const handlerMatch = content.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?const\s+(\w+)\s*[:=]/);
      const handler = handlerMatch ? (handlerMatch[1] || handlerMatch[2]) : 'unknown';

      // Extract service calls
      const servicesCalled: string[] = [];
      const importMatches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
      for (const match of importMatches) {
        const importPath = match[1];
        if (importPath.includes('services/')) {
          servicesCalled.push(importPath);
        }
      }

      // Extract data models (types)
      const dataModels: string[] = [];
      const typeMatches = content.matchAll(/(?::\s*)(\w+)(?:\[\]|,|;|\s|$)/g);
      for (const match of typeMatches) {
        const typeName = match[1];
        if (typeName[0] === typeName[0].toUpperCase() && typeName.length > 2) {
          dataModels.push(typeName);
        }
      }

      apis.push({
        route,
        handler,
        servicesCalled,
        dataModels: [...new Set(dataModels)],
      });
    } catch (error) {
      console.error(`Error processing API route ${file}:`, error);
    }
  }

  return apis;
}

/**
 * Build data map
 */
async function buildDataMap(): Promise<DataMap[]> {
  const dataTypes: DataMap[] = [];
  const typeFiles = await glob('types/**/*.ts');

  for (const file of typeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Extract interfaces and types
      const interfaceMatches = content.matchAll(/(?:export\s+)?(?:interface|type)\s+(\w+)/g);
      
      for (const match of interfaceMatches) {
        const typeName = match[1];
        
        // Try to find where it's persisted
        let persistedLocation = 'unknown';
        let ownership = path.dirname(file);

        // Check Prisma schema
        try {
          const prismaSchema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
          if (prismaSchema.includes(typeName)) {
            persistedLocation = 'prisma/schema.prisma';
          }
        } catch {
          // Prisma schema might not exist
        }

        dataTypes.push({
          typeName,
          schema: file,
          persistedLocation,
          ownership,
        });
      }
    } catch (error) {
      console.error(`Error processing type file ${file}:`, error);
    }
  }

  return dataTypes;
}

/**
 * Generate markdown report
 */
export async function generateRepoRealityMapReport(): Promise<string> {
  const map = await generateRepoRealityMap();

  const report: string[] = [];

  report.push('# Repo Reality Map');
  report.push(`\n**Generated:** ${map.generatedAt}`);
  report.push(`**Purpose:** Complete codebase inventory per master prompt PHASE 0\n`);

  // A) Module Map
  report.push('## A) Module Map\n');
  report.push('Module name → pages/components/services used\n\n');
  
  map.moduleMap.forEach(module => {
    report.push(`### ${module.moduleName}`);
    report.push(`- **Pages:** ${module.pages.length > 0 ? module.pages.join(', ') : 'None'}`);
    report.push(`- **Components:** ${module.components.length > 0 ? module.components.join(', ') : 'None'}`);
    report.push(`- **Services:** ${module.services.length > 0 ? module.services.join(', ') : 'None'}`);
    report.push(`- **Routes:** ${module.routes.length > 0 ? module.routes.join(', ') : 'None'}`);
    report.push(`- **APIs:** ${module.apis.length > 0 ? module.apis.join(', ') : 'None'}`);
    report.push('');
  });

  // B) Service Map
  report.push('## B) Service Map\n');
  report.push('Service → exported functions → used by what\n\n');
  
  map.serviceMap.slice(0, 50).forEach(service => {
    report.push(`### ${service.serviceName}`);
    report.push(`- **File:** ${service.filePath}`);
    report.push(`- **Exported Functions:** ${service.exportedFunctions.length > 0 ? service.exportedFunctions.join(', ') : 'None'}`);
    report.push(`- **Used By:** ${service.usedBy.length > 0 ? service.usedBy.slice(0, 5).join(', ') + (service.usedBy.length > 5 ? ` (+${service.usedBy.length - 5} more)` : '') : 'None'}`);
    report.push('');
  });

  if (map.serviceMap.length > 50) {
    report.push(`\n... and ${map.serviceMap.length - 50} more services\n`);
  }

  // C) API Map
  report.push('## C) API Map\n');
  report.push('Route → handler → services called → data models used\n\n');
  
  map.apiMap.slice(0, 100).forEach(api => {
    report.push(`### ${api.route}`);
    report.push(`- **Handler:** ${api.handler}`);
    report.push(`- **Services Called:** ${api.servicesCalled.length > 0 ? api.servicesCalled.join(', ') : 'None'}`);
    report.push(`- **Data Models:** ${api.dataModels.length > 0 ? api.dataModels.slice(0, 5).join(', ') : 'None'}`);
    report.push('');
  });

  if (map.apiMap.length > 100) {
    report.push(`\n... and ${map.apiMap.length - 100} more API routes\n`);
  }

  // D) Data Map
  report.push('## D) Data Map\n');
  report.push('Types + schemas → where persisted → ownership\n\n');
  
  map.dataMap.slice(0, 100).forEach(data => {
    report.push(`### ${data.typeName}`);
    report.push(`- **Schema:** ${data.schema}`);
    report.push(`- **Persisted Location:** ${data.persistedLocation}`);
    report.push(`- **Ownership:** ${data.ownership}`);
    report.push('');
  });

  if (map.dataMap.length > 100) {
    report.push(`\n... and ${map.dataMap.length - 100} more data types\n`);
  }

  // Summary
  report.push('## Summary\n');
  report.push(`- **Total Modules:** ${map.moduleMap.length}`);
  report.push(`- **Total Services:** ${map.serviceMap.length}`);
  report.push(`- **Total API Routes:** ${map.apiMap.length}`);
  report.push(`- **Total Data Types:** ${map.dataMap.length}`);

  return report.join('\n');
}

// CLI execution
if (require.main === module) {
  generateRepoRealityMapReport()
    .then(report => {
      const outputPath = path.join(process.cwd(), 'docs', 'AUDIT', 'REPO_REALITY_MAP.md');
      const outputDir = path.dirname(outputPath);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, report);
      
      // Also save JSON
      generateRepoRealityMap()
        .then(map => {
          const jsonPath = path.join(process.cwd(), 'docs', 'AUDIT', 'REPO_REALITY_MAP.json');
          fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2));
          console.log(`\n✅ Repo Reality Map saved to:`);
          console.log(`   - ${outputPath}`);
          console.log(`   - ${jsonPath}`);
        });
    })
    .catch(console.error);
}













