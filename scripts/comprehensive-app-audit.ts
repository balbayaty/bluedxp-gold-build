/**
 * Comprehensive Application Audit Script (v2)
 *
 * Produces a practical, page-by-page scorecard to reach production faster without
 * sacrificing enterprise architecture.
 *
 * Audits every Next.js App Router page (for example: `app/<route>/page.tsx`) and reports:
 * - Existence and basic UI signals (buttons/forms)
 * - Data sources (mock vs API vs DB signals)
 * - TODO/FIXME density
 * - Registration coverage (is the page referenced by a module route definition?)
 * - Auth expectations (module route requiresAuth/roles) vs what the page appears to enforce
 * - Tenant isolation signals (tenantId in API calls, contexts)
 * - API auth coverage for endpoints the page calls (best-effort mapping)
 *
 * Output:
 * - reports/APP_PAGE_SCORECARD.json
 * - reports/APP_PAGE_SCORECARD.md
 */

import fs from 'fs';
import path from 'path';

type RouteAuthExpectation = {
  requiresAuth?: boolean;
  roles?: string[];
};

interface ModuleRouteDef {
  moduleId: string;
  routePath: string;
  component: string;
  title: string;
  icon?: string;
  auth: RouteAuthExpectation;
}

interface PageAudit {
  path: string;
  exists: boolean;
  hasErrors: boolean;
  dataSource: 'mock' | 'database' | 'api' | 'mixed' | 'unknown';
  buttonsFunctional: number;
  buttonsTotal: number;
  formsFunctional: number;
  formsTotal: number;
  databaseIntegration: 'none' | 'partial' | 'full';
  readiness: number; // 0-100
  issues: string[];
  warnings: string[];

  // Module registry alignment (best-effort via regex parsing of lib/modules/*.ts)
  registeredRoutes?: Array<{
    moduleId: string;
    routePath: string;
    title: string;
    requiresAuth?: boolean;
    roles?: string[];
  }>;

  // Auth & tenant readiness (heuristics)
  auth?: {
    requiredByModule: boolean;
    rolesDeclaredByModule: string[];
    pageUsesAuthHook: boolean;
    pageHasLoginRedirect: boolean;
    likelyProtected: boolean;
    notes: string[];
  };

  tenant?: {
    usesTenantIdInApiCalls: boolean;
    usesTenantContextSignals: boolean;
    notes: string[];
  };

  api?: {
    endpoints: string[];
    endpointsWithAuthMiddleware: string[];
    endpointsWithoutAuthMiddleware: string[];
    notes: string[];
  };

  // Code-level dependency hints (best-effort)
  deps?: {
    imports: string[];
    services: string[]; // imports matching lib/services or service-like clients
    adapters: string[]; // imports matching lib/adapters
    types: string[]; // imports matching types
  };
}

interface ModuleAudit {
  moduleName: string;
  pages: PageAudit[];
  totalReadiness: number;
  issues: string[];
}

interface AppAuditReport {
  timestamp: string;
  totalPages: number;
  pagesAudited: number;
  overallReadiness: number;
  modules: ModuleAudit[];
  criticalIssues: string[];
  recommendations: string[];
  coverage?: {
    registeredPageCount: number;
    unregisteredPageCount: number;
    moduleRouteCount: number;
    moduleRoutesMissingPages: number;
  };
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readTextSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Parse module route definitions from lib/modules/*.ts (regex, best-effort).
 * We avoid importing modules to keep the audit deterministic and fast.
 */
function loadModuleRoutes(): ModuleRouteDef[] {
  const modulesDir = path.join(process.cwd(), 'lib', 'modules');
  const moduleFiles = fs
    .readdirSync(modulesDir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'registry.ts')
    .map((f) => path.join(modulesDir, f));

  const routes: ModuleRouteDef[] = [];

  for (const file of moduleFiles) {
    const moduleId = path.basename(file, '.ts');
    const content = readTextSafe(file);
    if (!content) continue;

    // Extract routes array content
    const routesMatch = content.match(/routes:\s*\[([\s\S]*?)\]\s*,?\s*\n/);
    if (!routesMatch) continue;
    const routesContent = routesMatch[1];

    // Extract each route object (best-effort)
    const objectMatches = routesContent.matchAll(/\{[\s\S]*?\}/g);
    for (const m of objectMatches) {
      const obj = m[0];
      const pathMatch = obj.match(/path:\s*['"]([^'"]+)['"]/);
      const componentMatch = obj.match(/component:\s*['"]([^'"]+)['"]/);
      const titleMatch = obj.match(/title:\s*['"]([^'"]+)['"]/);
      if (!pathMatch || !componentMatch || !titleMatch) continue;

      const iconMatch = obj.match(/icon:\s*['"]([^'"]+)['"]/);
      const requiresAuthMatch = obj.match(/requiresAuth:\s*(true|false)/);
      const rolesMatch = obj.match(/roles:\s*\[([\s\S]*?)\]/);

      const roles: string[] = [];
      if (rolesMatch?.[1]) {
        const roleStrings = rolesMatch[1].matchAll(/['"]([^'"]+)['"]/g);
        for (const r of roleStrings) roles.push(r[1]);
      }

      routes.push({
        moduleId,
        routePath: pathMatch[1],
        component: componentMatch[1],
        title: titleMatch[1],
        icon: iconMatch?.[1],
        auth: {
          requiresAuth: requiresAuthMatch ? requiresAuthMatch[1] === 'true' : undefined,
          roles: roles.length ? roles : undefined,
        },
      });
    }
  }

  return routes;
}

function componentToPagePath(component: string): string {
  // module definitions use "app/x/y/page" and we want "x/y"
  return component.replace(/^app\//, '').replace(/\/page$/, '');
}

function extractApiEndpointsFromPage(content: string): string[] {
  const endpoints = new Set<string>();

  // fetch('/api/...') or fetch("/api/...")
  for (const m of content.matchAll(/fetch\(\s*(['"])(\/api\/[^'"]+)\1/g)) {
    endpoints.add(m[2]);
  }

  // fetch(`/api/...`) (best-effort, simple scan)
  {
    let idx = 0;
    while (idx < content.length) {
      const start = content.indexOf('fetch(`', idx);
      if (start === -1) break;
      const s = start + 'fetch(`'.length;
      const end = content.indexOf('`', s);
      if (end === -1) break;
      const candidate = content.slice(s, end);
      if (candidate.startsWith('/api/')) endpoints.add(candidate);
      idx = end + 1;
    }
  }

  // axios.get('/api/...') / axios.post('/api/...') (single/double quotes)
  for (const m of content.matchAll(/axios\.(get|post|put|patch|delete)\(\s*(['"])(\/api\/[^'"]+)\2/g)) {
    endpoints.add(m[3]);
  }

  // axios.get(`/api/...`) (best-effort, simple scan)
  {
    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
    for (const method of methods) {
      let idx = 0;
      const needle = `axios.${method}(\``;
      while (idx < content.length) {
        const start = content.indexOf(needle, idx);
        if (start === -1) break;
        const s = start + needle.length;
        const end = content.indexOf('`', s);
        if (end === -1) break;
        const candidate = content.slice(s, end);
        if (candidate.startsWith('/api/')) endpoints.add(candidate);
        idx = end + 1;
      }
    }
  }

  return Array.from(endpoints).sort();
}

function extractImportPaths(content: string): string[] {
  const imports = new Set<string>();

  // import ... from 'x'
  for (const m of content.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    imports.add(m[1]);
  }

  // require('x')
  for (const m of content.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    imports.add(m[1]);
  }

  return Array.from(imports).sort();
}

function resolveApiRouteFile(endpoint: string): string {
  // Best-effort mapping: /api/foo/bar -> app/api/foo/bar/route.ts
  const clean = endpoint.split('?')[0].split('#')[0];
  const withoutPrefix = clean.replace(/^\/api\//, '');
  return path.join(process.cwd(), 'app', 'api', ...withoutPrefix.split('/'), 'route.ts');
}

function apiRouteUsesAuthMiddleware(apiRouteFile: string): boolean | null {
  if (!fs.existsSync(apiRouteFile)) return null;
  const content = readTextSafe(apiRouteFile);
  if (!content) return null;

  // Patterns in this repo (best-effort)
  return (
    content.includes('apiAuthMiddleware(') ||
    content.includes('createAuthContext(') ||
    content.includes('authenticateRequest(')
  );
}

// Get all page files
function getAllPages(): string[] {
  const pages: string[] = [];
  const appDir = path.join(process.cwd(), 'app');
  
  function walkDir(dir: string, basePath: string = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, path.join(basePath, file));
      } else if (file === 'page.tsx' || file === 'page.ts') {
        const route = basePath.replace(/\\/g, '/');
        pages.push(route || '/');
      }
    }
  }
  
  walkDir(appDir);
  return pages;
}

// Analyze a page file
function auditPage(pagePath: string, componentRouteMap: Map<string, ModuleRouteDef[]>): PageAudit {
  const fullPath = path.join(process.cwd(), 'app', pagePath, 'page.tsx');
  const altPath = path.join(process.cwd(), 'app', pagePath, 'page.ts');

  const exists = fs.existsSync(fullPath) || fs.existsSync(altPath);
  const filePath = fs.existsSync(fullPath) ? fullPath : altPath;

  const componentKey = pagePath ? `app/${pagePath.replace(/\\/g, '/')}/page` : 'app/page';
  const registered = componentRouteMap.get(componentKey) || [];
  const requiresAuthByModule = registered.some(r => r.auth.requiresAuth === true);
  const rolesByModule = Array.from(new Set(registered.flatMap(r => r.auth.roles || [])));

  const audit: PageAudit = {
    path: pagePath || '/',
    exists,
    hasErrors: false,
    dataSource: 'unknown',
    buttonsFunctional: 0,
    buttonsTotal: 0,
    formsFunctional: 0,
    formsTotal: 0,
    databaseIntegration: 'none',
    readiness: 0,
    issues: [],
    warnings: [],

    registeredRoutes: registered.map(r => ({
      moduleId: r.moduleId,
      routePath: r.routePath,
      title: r.title,
      requiresAuth: r.auth.requiresAuth,
      roles: r.auth.roles,
    })),

    auth: {
      requiredByModule: requiresAuthByModule,
      rolesDeclaredByModule: rolesByModule,
      pageUsesAuthHook: false,
      pageHasLoginRedirect: false,
      likelyProtected: false,
      notes: [],
    },

    tenant: {
      usesTenantIdInApiCalls: false,
      usesTenantContextSignals: false,
      notes: [],
    },

    api: {
      endpoints: [],
      endpointsWithAuthMiddleware: [],
      endpointsWithoutAuthMiddleware: [],
      notes: [],
    },

    deps: {
      imports: [],
      services: [],
      adapters: [],
      types: [],
    },
  };

  if (!exists) {
    audit.issues.push('Page file does not exist');
    return audit;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // === Dependency mapping (best-effort, static imports) ===
    const imports = extractImportPaths(content);
    audit.deps!.imports = imports;
    audit.deps!.services = imports.filter(p =>
      p.startsWith('@/lib/services/') ||
      p.includes('/lib/services/') ||
      p.startsWith('@/utils/') ||
      p.includes('/utils/')
    );
    audit.deps!.adapters = imports.filter(p =>
      p.startsWith('@/lib/adapters/') ||
      p.includes('/lib/adapters/')
    );
    audit.deps!.types = imports.filter(p =>
      p.startsWith('@/types/') ||
      p.includes('/types/')
    );

    // Check for errors
    if (content.includes('Error') || content.includes('error') || content.includes('throw new Error')) {
      audit.hasErrors = true;
      audit.warnings.push('Contains error handling (review for user-friendly messaging and safe logging)');
    }

    // Check data sources
    const hasMockData = content.includes('mockData') ||
      content.includes('generateMock') ||
      content.includes('MOCK_') ||
      content.includes('// Mock') ||
      content.includes('mock:');

    const hasDatabase = content.includes('prisma') ||
      content.includes('PrismaClient') ||
      content.includes('await prisma') ||
      content.includes('@prisma/client');

    const hasAPI = content.includes('fetch(') ||
      content.includes('axios') ||
      content.includes('/api/') ||
      content.includes('useSWR') ||
      content.includes('useQuery');

    if (hasDatabase && !hasMockData) {
      audit.dataSource = 'database';
      audit.databaseIntegration = 'full';
    } else if (hasDatabase && hasMockData) {
      audit.dataSource = 'mixed';
      audit.databaseIntegration = 'partial';
      audit.warnings.push('Uses both database and mock data');
    } else if (hasAPI && !hasMockData) {
      audit.dataSource = 'api';
      audit.databaseIntegration = 'partial';
    } else if (hasMockData) {
      audit.dataSource = 'mock';
      audit.databaseIntegration = 'none';
      audit.issues.push('Uses mock data instead of real database');
    }

    // Count buttons
    const buttonMatches = content.match(/onClick|onSubmit|onChange|button|Button/g) || [];
    audit.buttonsTotal = buttonMatches.length;

    // Check if buttons are functional (not disabled, have handlers)
    const functionalButtons = (content.match(/onClick=\{/g) || []).length;
    const disabledButtons = (content.match(/disabled/g) || []).length;
    audit.buttonsFunctional = functionalButtons - disabledButtons;

    // Count forms
    const formMatches = content.match(/<form|Form|useForm|formState/g) || [];
    audit.formsTotal = formMatches.length;

    // Check TODO/FIXME
    const todos = (content.match(/TODO|FIXME|XXX|HACK/g) || []).length;
    if (todos > 0) {
      audit.warnings.push(`Contains ${todos} TODO/FIXME comments`);
    }

    // Check for placeholder text
    if (content.includes('placeholder') || content.includes('Placeholder') || content.includes('PLACEHOLDER')) {
      audit.warnings.push('Contains placeholder text');
    }

    // === Auth heuristics ===
    audit.auth!.pageUsesAuthHook = content.includes('useAuth(') || content.includes('useAuth()');
    audit.auth!.pageHasLoginRedirect = content.includes("'/login'") || content.includes('"/login"') || content.includes('`/login`');

    const gatesOnUser =
      /if\s*\(\s*!user\s*\)/.test(content) ||
      /if\s*\(\s*user\s*\)/.test(content) ||
      /return\s+.*login/i.test(content);

    audit.auth!.likelyProtected = audit.auth!.pageHasLoginRedirect || (audit.auth!.pageUsesAuthHook && gatesOnUser);

    if (audit.auth!.requiredByModule && !audit.auth!.likelyProtected) {
      audit.issues.push('Route requires auth (per module definition) but page does not appear to enforce auth/redirect');
      audit.auth!.notes.push('Add a standard AuthGate / route guard (client + API) for this route');
    } else if (!audit.auth!.requiredByModule && audit.auth!.likelyProtected) {
      audit.warnings.push('Page appears protected but module route does not declare requiresAuth (verify expected behavior)');
    }

    if (audit.auth!.rolesDeclaredByModule.length > 0) {
      audit.auth!.notes.push(`Module declares roles: ${audit.auth!.rolesDeclaredByModule.join(', ')}`);
      if (!content.includes('canPerformAction(') && !content.includes('hasPermission(') && !content.includes('filterNavigationByPermissions')) {
        audit.warnings.push('Module route declares roles but page has no obvious role-based gating (verify RBAC enforcement)');
      }
    }

    // === Tenant heuristics ===
    const tenantSignals =
      content.includes('tenantId') ||
      content.includes('x-tenant-id') ||
      content.includes('useCustomer(') ||
      content.includes('useCustomer()') ||
      content.includes('ViewContextProvider') ||
      content.includes('currentCustomer');

    audit.tenant!.usesTenantContextSignals = tenantSignals;

    // Extract API endpoints and check auth middleware coverage (best-effort)
    const endpoints = extractApiEndpointsFromPage(content);
    audit.api!.endpoints = endpoints;

    const endpointsWithAuth: string[] = [];
    const endpointsWithoutAuth: string[] = [];

    for (const ep of endpoints) {
      if (ep.includes('tenantId=')) {
        audit.tenant!.usesTenantIdInApiCalls = true;
      }

      const apiRouteFile = resolveApiRouteFile(ep);
      const usesAuth = apiRouteUsesAuthMiddleware(apiRouteFile);

      if (usesAuth === true) endpointsWithAuth.push(ep);
      else if (usesAuth === false) endpointsWithoutAuth.push(ep);
      else audit.api!.notes.push(`Could not map endpoint to route.ts: ${ep}`);
    }

    audit.api!.endpointsWithAuthMiddleware = endpointsWithAuth;
    audit.api!.endpointsWithoutAuthMiddleware = endpointsWithoutAuth;

    if (audit.api!.endpointsWithoutAuthMiddleware.length > 0 && audit.auth!.requiredByModule) {
      audit.issues.push('Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth');
      audit.api!.notes.push('Add apiAuthMiddleware() to those API routes or route behind authenticated gateway');
    }

    if (audit.auth!.requiredByModule && !audit.tenant!.usesTenantContextSignals) {
      audit.warnings.push('Route requires auth but has no obvious tenant context signals (verify tenant isolation)');
    }

    // Calculate readiness
    let readiness = 100;

    if (!exists) readiness = 0;
    else {
      if (audit.dataSource === 'mock') readiness -= 30;
      if (audit.databaseIntegration === 'none') readiness -= 20;
      if (audit.databaseIntegration === 'partial') readiness -= 10;
      if (audit.hasErrors) readiness -= 10;
      if (audit.buttonsTotal > 0 && audit.buttonsFunctional / audit.buttonsTotal < 0.5) readiness -= 15;
      if (audit.issues.length > 0) readiness -= (audit.issues.length * 5);
      if (audit.warnings.length > 0) readiness -= (audit.warnings.length * 2);

      // Penalize mismatch between module auth expectations and page behavior
      if (audit.auth!.requiredByModule && !audit.auth!.likelyProtected) readiness -= 20;
      if (audit.auth!.requiredByModule && audit.api!.endpointsWithoutAuthMiddleware.length > 0) readiness -= 15;
      if (audit.auth!.requiredByModule && !audit.tenant!.usesTenantContextSignals) readiness -= 5;
    }

    audit.readiness = Math.max(0, Math.min(100, readiness));

  } catch (error) {
    audit.issues.push(`Error reading file: ${error}`);
    audit.readiness = 0;
  }

  return audit;
}

// Group pages by module
function groupByModule(pages: PageAudit[]): Map<string, PageAudit[]> {
  const modules = new Map<string, PageAudit[]>();
  
  for (const page of pages) {
    const parts = page.path.split('/').filter(p => p);
    const module = parts[0] || 'root';
    
    if (!modules.has(module)) {
      modules.set(module, []);
    }
    modules.get(module)!.push(page);
  }
  
  return modules;
}

// Generate report
function generateReport(): AppAuditReport {
  console.log('🔍 Starting comprehensive application audit...\n');

  const moduleRoutes = loadModuleRoutes();
  const componentRouteMap = new Map<string, ModuleRouteDef[]>();
  for (const r of moduleRoutes) {
    const pagePath = componentToPagePath(r.component);
    const key = pagePath ? `app/${pagePath}/page` : 'app/page';
    if (!componentRouteMap.has(key)) componentRouteMap.set(key, []);
    componentRouteMap.get(key)!.push(r);
  }

  const allPages = getAllPages();
  console.log(`📄 Found ${allPages.length} pages to audit\n`);
  
  const pageAudits: PageAudit[] = [];
  
  for (const pagePath of allPages) {
    process.stdout.write(`Auditing ${pagePath || '/'}... `);
    const audit = auditPage(pagePath, componentRouteMap);
    pageAudits.push(audit);
    console.log(`${audit.readiness}% ready`);
  }
  
  const modules = groupByModule(pageAudits);
  const moduleAudits: ModuleAudit[] = [];
  
  for (const [moduleName, pages] of modules.entries()) {
    const totalReadiness = pages.reduce((sum, p) => sum + p.readiness, 0) / pages.length;
    const allIssues = pages.flatMap(p => p.issues);
    
    moduleAudits.push({
      moduleName,
      pages,
      totalReadiness,
      issues: allIssues,
    });
  }
  
  const overallReadiness = pageAudits.reduce((sum, p) => sum + p.readiness, 0) / pageAudits.length;
  
  const criticalIssues = pageAudits
    .filter(p => p.readiness < 50 || p.issues.length > 3)
    .map(p => `${p.path}: ${p.issues.join(', ')}`);
  
  const recommendations: string[] = [];
  
  // Generate recommendations
  const mockDataPages = pageAudits.filter(p => p.dataSource === 'mock');
  if (mockDataPages.length > 0) {
    recommendations.push(`Replace mock data with database in ${mockDataPages.length} pages`);
  }
  
  const noDatabasePages = pageAudits.filter(p => p.databaseIntegration === 'none');
  if (noDatabasePages.length > 0) {
    recommendations.push(`Add database integration to ${noDatabasePages.length} pages`);
  }
  
  const lowReadinessPages = pageAudits.filter(p => p.readiness < 50);
  if (lowReadinessPages.length > 0) {
    recommendations.push(`Fix critical issues in ${lowReadinessPages.length} pages`);
  }
  
  const report: AppAuditReport = {
    timestamp: new Date().toISOString(),
    totalPages: allPages.length,
    pagesAudited: pageAudits.length,
    overallReadiness: overallReadiness,
    modules: moduleAudits.sort((a, b) => b.totalReadiness - a.totalReadiness),
    criticalIssues,
    recommendations,
    coverage: {
      registeredPageCount: pageAudits.filter(p => (p.registeredRoutes?.length || 0) > 0).length,
      unregisteredPageCount: pageAudits.filter(p => (p.registeredRoutes?.length || 0) === 0).length,
      moduleRouteCount: moduleRoutes.length,
      moduleRoutesMissingPages: moduleRoutes.filter(r => {
        const p = componentToPagePath(r.component);
        const f1 = path.join(process.cwd(), 'app', p, 'page.tsx');
        const f2 = path.join(process.cwd(), 'app', p, 'page.ts');
        return !(fs.existsSync(f1) || fs.existsSync(f2));
      }).length,
    },
  };
  
  return report;
}

// Main execution
if (require.main === module) {
  const report = generateReport();
  
  // Save report
  const reportsDir = path.join(process.cwd(), 'reports');
  ensureDir(reportsDir);

  const reportPath = path.join(reportsDir, 'APP_PAGE_SCORECARD.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Save a small markdown summary for non-technical stakeholders
  const mdPath = path.join(reportsDir, 'APP_PAGE_SCORECARD.md');
  const worstPages = [...report.modules]
    .flatMap(m => m.pages.map(p => ({ module: m.moduleName, page: p })))
    .sort((a, b) => a.page.readiness - b.page.readiness)
    .slice(0, 25);

  const issueCounts = new Map<string, number>();
  for (const m of report.modules) {
    for (const p of m.pages) {
      for (const i of p.issues) issueCounts.set(i, (issueCounts.get(i) || 0) + 1);
    }
  }
  const topIssues = [...issueCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

  const md: string[] = [];
  md.push(`# BlueDXP - App Page Scorecard`);
  md.push('');
  md.push(`- Timestamp: ${report.timestamp}`);
  md.push(`- Pages audited: ${report.pagesAudited}`);
  md.push(`- Overall readiness: ${report.overallReadiness.toFixed(1)}%`);
  if (report.coverage) {
    md.push(`- Coverage: ${report.coverage.registeredPageCount} registered pages, ${report.coverage.unregisteredPageCount} unregistered pages`);
    md.push(`- Module routes: ${report.coverage.moduleRouteCount} (missing pages: ${report.coverage.moduleRoutesMissingPages})`);
  }
  md.push('');
  md.push(`## Top gaps (most frequent issues)`);
  md.push('');
  for (const [issue, count] of topIssues) {
    md.push(`- ${count}× ${issue}`);
  }
  md.push('');
  md.push(`## Lowest readiness pages (top 25)`);
  md.push('');
  md.push(`| Module | Page | Score | Key issues |`);
  md.push(`|---|---|---:|---|`);
  for (const row of worstPages) {
    const keyIssues = row.page.issues.slice(0, 2).join('; ') || '—';
    md.push(`| ${row.module} | \`${row.page.path}\` | ${row.page.readiness} | ${keyIssues} |`);
  }
  md.push('');
  md.push(`## Recommendations (auto-generated)`);
  md.push('');
  for (const rec of report.recommendations) {
    md.push(`- ${rec}`);
  }

  fs.writeFileSync(mdPath, md.join('\n'));
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE APPLICATION AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`\n📅 Timestamp: ${report.timestamp}`);
  console.log(`📄 Total Pages: ${report.totalPages}`);
  console.log(`✅ Pages Audited: ${report.pagesAudited}`);
  console.log(`\n🎯 OVERALL READINESS: ${report.overallReadiness.toFixed(1)}%`);
  console.log(`\n📦 Modules: ${report.modules.length}`);
  if (report.coverage) {
    console.log(`\n🧩 Coverage: ${report.coverage.registeredPageCount} registered pages, ${report.coverage.unregisteredPageCount} unregistered pages`);
    console.log(`🧭 Module routes: ${report.coverage.moduleRouteCount} (missing pages: ${report.coverage.moduleRoutesMissingPages})`);
  }
  
  console.log('\n📊 Module Readiness:');
  for (const module of report.modules.slice(0, 20)) {
    console.log(`  ${module.moduleName.padEnd(30)} ${module.totalReadiness.toFixed(1)}% (${module.pages.length} pages)`);
  }
  
  console.log(`\n🔴 Critical Issues: ${report.criticalIssues.length}`);
  if (report.criticalIssues.length > 0) {
    console.log('\nTop 10 Critical Issues:');
    report.criticalIssues.slice(0, 10).forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }
  
  console.log(`\n💡 Recommendations: ${report.recommendations.length}`);
  report.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  console.log(`🧾 Markdown summary saved to: ${mdPath}`);
  console.log('='.repeat(80));
}

export { generateReport, auditPage, getAllPages };











