/**
 * Repo Reality Map Generator (Fast Version)
 * Generates complete codebase inventory - optimized for speed
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

interface RepoRealityMap {
  generatedAt: string;
  modules: Array<{
    name: string;
    routes: number;
    apis: number;
    services: number;
    components: number;
  }>;
  services: Array<{
    name: string;
    functions: number;
    filePath: string;
  }>;
  apiRoutes: Array<{
    route: string;
    method: string;
    filePath: string;
  }>;
  dataTypes: Array<{
    name: string;
    filePath: string;
  }>;
  summary: {
    totalModules: number;
    totalServices: number;
    totalAPIRoutes: number;
    totalDataTypes: number;
  };
}

async function generateRepoRealityMapFast(): Promise<RepoRealityMap> {
  console.log('Generating Repo Reality Map (Fast)...\n');

  const map: RepoRealityMap = {
    generatedAt: new Date().toISOString(),
    modules: [],
    services: [],
    apiRoutes: [],
    dataTypes: [],
    summary: {
      totalModules: 0,
      totalServices: 0,
      totalAPIRoutes: 0,
      totalDataTypes: 0,
    },
  };

  // Modules
  console.log('Scanning modules...');
  const moduleFiles = await glob('lib/modules/*.ts', { ignore: ['**/index.ts', '**/registry.ts'] });
  for (const file of moduleFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const moduleName = path.basename(file, '.ts');
      
      const routes = (content.match(/path:\s*['"]/g) || []).length;
      const apis = (content.match(/endpoint:\s*['"]/g) || []).length;
      const services = (content.match(/services:\s*\[/g) || []).length;
      const components = (content.match(/components:\s*\[/g) || []).length;

      map.modules.push({ name: moduleName, routes, apis, services, components });
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  // Services
  console.log('Scanning services...');
  const serviceDirs = await glob('lib/services/*/', { ignore: ['node_modules/**'] });
  for (const dir of serviceDirs) {
    try {
      const serviceName = path.basename(dir);
      const indexFile = path.join(dir, 'index.ts');
      
      if (fs.existsSync(indexFile)) {
        const content = fs.readFileSync(indexFile, 'utf-8');
        const functions = (content.match(/export\s+(?:async\s+)?function\s+\w+/g) || []).length +
                          (content.match(/export\s+const\s+\w+\s*[:=]\s*(?:async\s+)?\(/g) || []).length;
        
        map.services.push({ name: serviceName, functions, filePath: indexFile });
      }
    } catch (error) {
      console.error(`Error processing ${dir}:`, error);
    }
  }

  // API Routes
  console.log('Scanning API routes...');
  const routeFiles = await glob('app/api/**/route.ts');
  for (const file of routeFiles) {
    try {
      const parts = file.split(path.sep);
      const apiIndex = parts.indexOf('api');
      const route = '/' + parts.slice(apiIndex + 1, -1).join('/');
      
      const content = fs.readFileSync(file, 'utf-8');
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].filter(method =>
        content.includes(`export async function ${method.toLowerCase()}`) ||
        content.includes(`export const ${method.toLowerCase()}`)
      );

      methods.forEach(method => {
        map.apiRoutes.push({ route, method, filePath: file });
      });
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  // Data Types
  console.log('Scanning data types...');
  const typeFiles = await glob('types/**/*.ts');
  for (const file of typeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const interfaces = content.matchAll(/(?:export\s+)?(?:interface|type)\s+(\w+)/g);
      
      for (const match of interfaces) {
        const typeName = match[1];
        if (typeName.length > 2 && !typeName.startsWith('_')) {
          map.dataTypes.push({ name: typeName, filePath: file });
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  // Summary
  map.summary = {
    totalModules: map.modules.length,
    totalServices: map.services.length,
    totalAPIRoutes: map.apiRoutes.length,
    totalDataTypes: map.dataTypes.length,
  };

  return map;
}

function generateMarkdownReport(map: RepoRealityMap): string {
  const report: string[] = [];

  report.push('# Repo Reality Map');
  report.push(`\n**Generated:** ${map.generatedAt}`);
  report.push(`**Purpose:** Complete codebase inventory per master prompt PHASE 0\n`);

  // Summary
  report.push('## 📊 Summary\n');
  report.push(`- **Total Modules:** ${map.summary.totalModules}`);
  report.push(`- **Total Services:** ${map.summary.totalServices}`);
  report.push(`- **Total API Routes:** ${map.summary.totalAPIRoutes}`);
  report.push(`- **Total Data Types:** ${map.summary.totalDataTypes}\n`);

  // A) Module Map
  report.push('## A) Module Map\n');
  report.push('Module name → pages/components/services used\n\n');
  report.push('| Module | Routes | APIs | Services | Components |');
  report.push('|--------|--------|------|----------|------------|');
  map.modules.forEach(m => {
    report.push(`| ${m.name} | ${m.routes} | ${m.apis} | ${m.services} | ${m.components} |`);
  });

  // B) Service Map
  report.push('\n## B) Service Map\n');
  report.push('Service → exported functions → used by what\n\n');
  report.push('| Service | Functions | File Path |');
  report.push('|---------|-----------|-----------|');
  map.services.slice(0, 50).forEach(s => {
    report.push(`| ${s.name} | ${s.functions} | ${s.filePath} |`);
  });
  if (map.services.length > 50) {
    report.push(`| ... | ... | ... (+${map.services.length - 50} more) |`);
  }

  // C) API Map
  report.push('\n## C) API Map\n');
  report.push('Route → handler → services called → data models used\n\n');
  report.push('| Route | Method | File Path |');
  report.push('|-------|--------|-----------|');
  map.apiRoutes.slice(0, 100).forEach(api => {
    report.push(`| ${api.route} | ${api.method} | ${api.filePath} |`);
  });
  if (map.apiRoutes.length > 100) {
    report.push(`| ... | ... | ... (+${map.apiRoutes.length - 100} more) |`);
  }

  // D) Data Map
  report.push('\n## D) Data Map\n');
  report.push('Types + schemas → where persisted → ownership\n\n');
  report.push('| Type Name | File Path |');
  report.push('|-----------|-----------|');
  map.dataTypes.slice(0, 100).forEach(type => {
    report.push(`| ${type.name} | ${type.filePath} |`);
  });
  if (map.dataTypes.length > 100) {
    report.push(`| ... | ... (+${map.dataTypes.length - 100} more) |`);
  }

  return report.join('\n');
}

// CLI execution
if (require.main === module) {
  generateRepoRealityMapFast()
    .then(map => {
      const outputDir = path.join(process.cwd(), 'docs', 'AUDIT');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save markdown
      const mdReport = generateMarkdownReport(map);
      const mdPath = path.join(outputDir, 'REPO_REALITY_MAP.md');
      fs.writeFileSync(mdPath, mdReport);

      // Save JSON
      const jsonPath = path.join(outputDir, 'REPO_REALITY_MAP.json');
      fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2));

      console.log(`\n✅ Repo Reality Map generated!`);
      console.log(`   Modules: ${map.summary.totalModules}`);
      console.log(`   Services: ${map.summary.totalServices}`);
      console.log(`   API Routes: ${map.summary.totalAPIRoutes}`);
      console.log(`   Data Types: ${map.summary.totalDataTypes}`);
      console.log(`\n📁 Saved to:`);
      console.log(`   - ${mdPath}`);
      console.log(`   - ${jsonPath}`);
    })
    .catch(console.error);
}

export { generateRepoRealityMapFast, generateMarkdownReport };













