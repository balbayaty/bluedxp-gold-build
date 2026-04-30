/**
 * Comprehensive Orphan Page Analysis
 * 
 * This script analyzes all orphan pages in the BlueDXP platform to determine:
 * 1. WHY each page is orphaned (not in navigation)
 * 2. Is the page a placeholder or fully functional?
 * 3. Should it be added to navigation or deleted?
 * 4. What module does it belong to?
 * 
 * Categories of orphan pages:
 * - HIDDEN_BY_DESIGN: Internal/test pages, admin tools
 * - MISSING_FROM_NAV: Should be in navigation but isn't
 * - DYNAMIC_ROUTE: Pages with [id] params accessed via links
 * - DEPRECATED: Old pages that should be deleted
 * - PLACEHOLDER: Generated placeholder pages not ready
 * - MODULE_REGISTERED: In module registry but not main nav
 * - ROLE_RESTRICTED: Pages for specific roles only
 */

import * as fs from 'fs';
import * as path from 'path';

interface OrphanAnalysis {
  route: string;
  file: string;
  category: 'HIDDEN_BY_DESIGN' | 'MISSING_FROM_NAV' | 'DYNAMIC_ROUTE' | 'DEPRECATED' | 'PLACEHOLDER' | 'MODULE_REGISTERED' | 'ROLE_RESTRICTED' | 'CALLBACK_ROUTE' | 'TEST_PAGE';
  reason: string;
  recommendation: 'ADD_TO_NAV' | 'KEEP_AS_IS' | 'DELETE' | 'REVIEW' | 'LINK_FROM_PARENT';
  moduleGroup: string;
  isPlaceholder: boolean;
  isWorking: 'UNKNOWN' | 'YES' | 'NO' | 'NEEDS_TEST';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// All orphan routes from the report
const orphanRoutes = [
  "/ai-vision-demo",
  "/ai-vision-unified-enhanced",
  "/ai-vision/history/history",
  "/ai-vision/integration/actions",
  "/ai-vision/integration/map",
  "/ai-vision/integration/settings",
  "/ai-vision/integration/workflows",
  "/ai-vision/learning",
  "/ai-vision/learning/accuracy",
  "/ai-vision/learning/feedback",
  "/ai-vision/learning/how-it-works",
  "/ai-vision/learning/patterns",
  "/ai-vision/learning/rules",
  "/bluedxp-test",
  "/boardroom-readiness",
  "/brand-messaging/test",
  "/business-intelligence/dashboard",
  "/business-intelligence/data-warehouse",
  "/business-intelligence/reports",
  "/crm/accounts",
  "/crm/activities",
  "/crm/contacts",
  "/crm/dashboard",
  "/crm/forecast",
  "/crm/leads",
  "/crm/opportunities",
  "/customer-portal/approval-success",
  "/customer-portal/approve",
  "/d/sales-orders",
  "/dashboard",
  "/dashboard/account-manager",
  "/dashboard/business-development",
  "/dashboard/customer",
  "/dashboard/operations",
  "/dashboard/supervisor",
  "/dashboard/system-admin",
  "/dashboard/transport-general-manager",
  "/dashboard/warehouse-head",
  "/demo/notifications",
  "/digital-signatures/dashboard",
  "/digital-signatures/documents",
  "/facility/utility-bills",
  "/facility/utility-bills/analytics",
  "/facility/utility-bills/comparison",
  "/feature-demo",
  "/feature-registry",
  "/ict-hardware-ecosystem",
  "/ict-hardware-ecosystem/manufacturing",
  "/ict-hardware-ecosystem/partnerships",
  "/ict-hardware-ecosystem/products",
  "/integration",
  "/integrations/callback",
  "/iot/network/topology",
  "/jobs/analytics",
  "/jobs/quick-start",
  "/liability/assessments",
  "/liability/calculator",
  "/liability/claims",
  "/liability/claims/new",
  "/liability/compliance",
  "/liability/dashboard",
  "/liability/rules",
  "/liability/rules/new",
  "/login",
  "/maas",
  "/marketplace/analytics",
  "/marketplace/compare",
  "/marketplace/contracts",
  "/marketplace/favorites",
  "/marketplace/forecasting",
  "/marketplace/listings/new",
  "/marketplace/messages",
  "/marketplace/payment",
  "/marketplace/providers/verify",
  "/marketplace/sustainability",
  "/ncr",
  "/page.tsx",
  "/process-lifecycle/workflows/builder",
  "/projects",
  "/proposals/analytics/enhanced",
  "/proposals/compare",
  "/proposals/enhanced",
  "/proposals/marketplace",
  "/pulse/admin/redemptions",
  "/pulse/admin/rulesets",
  "/purchase-orders",
  "/qhse-dashboard",
  "/qhse/comprehensive",
  "/qhse/incidents/new",
  "/qhse/inspections/new",
  "/qhse/training/new",
  "/settings/currency",
  "/task-management",
  "/test-notifications",
  "/test-page",
  "/trade-compliance/licenses/apply",
  "/transportation/analytics/digital-twins",
  "/transportation/analytics/scenario",
  "/transportation/audit",
  "/transportation/blockchain",
  "/transportation/carrier-portal",
  "/transportation/carriers",
  "/transportation/collaboration",
  "/transportation/compliance",
  "/transportation/control-tower",
  "/transportation/corridors",
  "/transportation/customization",
  "/transportation/digital-twins",
  "/transportation/edge-computing",
  "/transportation/emissions",
  "/transportation/exports",
  "/transportation/fleet",
  "/transportation/incidents",
  "/transportation/intelligent-routing",
  "/transportation/iot",
  "/transportation/load-matching",
  "/transportation/multi-enterprise",
  "/transportation/payments",
  "/transportation/pricing",
  "/transportation/psychology",
  "/transportation/quantum",
  "/transportation/quotes",
  "/transportation/route-comparison",
  "/transportation/scenario-simulation",
  "/transportation/test",
  "/truth-engine/claims",
  "/truth-engine/dashboard",
  "/truth-engine/knowledge-graph",
  "/users",
  "/warehouse-network/cross-docking",
  "/warehouse-network/optimization",
  "/websocket/streams"
];

function analyzeOrphanPage(route: string): OrphanAnalysis {
  const file = `app${route}/page.tsx`;
  const moduleGroup = route.split('/')[1] || 'root';
  
  // Check if file exists and read content
  let isPlaceholder = false;
  let fileContent = '';
  const fullPath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(fullPath)) {
      fileContent = fs.readFileSync(fullPath, 'utf8');
      isPlaceholder = fileContent.includes('Coming Soon') || 
                      fileContent.includes('Under Development') ||
                      fileContent.includes('Under Construction') ||
                      fileContent.includes('Placeholder') ||
                      fileContent.length < 500;
    }
  } catch (e) {
    // File might not exist or be readable
  }
  
  // Categorize based on route patterns
  
  // 1. Test/Demo pages - HIDDEN BY DESIGN
  if (route.includes('/test') || route.includes('/demo') || route.includes('-test') || route.includes('-demo')) {
    return {
      route,
      file,
      category: 'TEST_PAGE',
      reason: 'Test/demo page for internal development and testing',
      recommendation: 'KEEP_AS_IS',
      moduleGroup,
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'LOW'
    };
  }
  
  // 2. Callback routes - OAuth/Integration callbacks
  if (route.includes('/callback') || route.includes('/approve') || route.includes('/success')) {
    return {
      route,
      file,
      category: 'CALLBACK_ROUTE',
      reason: 'OAuth callback or approval redirect page - accessed via external links',
      recommendation: 'KEEP_AS_IS',
      moduleGroup,
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 3. Login page - special case
  if (route === '/login') {
    return {
      route,
      file,
      category: 'HIDDEN_BY_DESIGN',
      reason: 'Login page - accessed when not authenticated, redirected from all protected routes',
      recommendation: 'KEEP_AS_IS',
      moduleGroup: 'auth',
      isPlaceholder: false,
      isWorking: 'YES',
      priority: 'HIGH'
    };
  }
  
  // 4. Dashboard role-specific pages
  if (route.startsWith('/dashboard/')) {
    return {
      route,
      file,
      category: 'ROLE_RESTRICTED',
      reason: 'Role-specific dashboard - users are redirected here based on their role after login',
      recommendation: 'REVIEW',
      moduleGroup: 'dashboard',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'HIGH'
    };
  }
  
  // 5. Main dashboard
  if (route === '/dashboard') {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Main dashboard exists but navigation uses "/" instead - duplicate or backup',
      recommendation: 'REVIEW',
      moduleGroup: 'dashboard',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 6. Feature registry - internal tool
  if (route === '/feature-registry' || route === '/feature-demo') {
    return {
      route,
      file,
      category: 'HIDDEN_BY_DESIGN',
      reason: 'Internal feature registry/demo for development team',
      recommendation: 'KEEP_AS_IS',
      moduleGroup: 'internal',
      isPlaceholder: false,
      isWorking: 'NEEDS_TEST',
      priority: 'LOW'
    };
  }
  
  // 7. AI Vision sub-pages - should be linked from main AI Vision page
  if (route.startsWith('/ai-vision/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'AI Vision sub-page - exists in module but not accessible from navigation. Should be sub-menu items.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'ai-vision',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'HIGH'
    };
  }
  
  // 8. Transportation sub-pages - massive module with many features
  if (route.startsWith('/transportation/')) {
    const isInModuleRegistry = true; // Most TMS pages are registered
    return {
      route,
      file,
      category: isInModuleRegistry ? 'MODULE_REGISTERED' : 'MISSING_FROM_NAV',
      reason: 'TMS sub-page - registered in module but navigation menu is collapsed. Many TMS features are hidden.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'transportation',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'HIGH'
    };
  }
  
  // 9. CRM pages - entire module missing from nav
  if (route.startsWith('/crm/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'CRM module exists but entire module is not in main navigation. Module needs to be added to nav.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'crm',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'HIGH'
    };
  }
  
  // 10. Business Intelligence - entire module missing
  if (route.startsWith('/business-intelligence/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Business Intelligence module exists but not in navigation. Should be under Analytics or Reports.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'business-intelligence',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'HIGH'
    };
  }
  
  // 11. Liability module - entire module missing
  if (route.startsWith('/liability/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Liability module exists but not in navigation. Should be under Finance or Compliance.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'liability',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'HIGH'
    };
  }
  
  // 12. Marketplace sub-pages
  if (route.startsWith('/marketplace/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Marketplace sub-page - main marketplace is in nav but sub-pages are hidden.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'marketplace',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 13. Digital Signatures
  if (route.startsWith('/digital-signatures/')) {
    return {
      route,
      file,
      category: 'MODULE_REGISTERED',
      reason: 'Digital Signatures module registered but not accessible from main nav.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'digital-signatures',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 14. Truth Engine
  if (route.startsWith('/truth-engine/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Truth Engine module exists but not in navigation. Advanced AI/verification system.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'truth-engine',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 15. Pulse admin pages
  if (route.startsWith('/pulse/admin/')) {
    return {
      route,
      file,
      category: 'ROLE_RESTRICTED',
      reason: 'Pulse admin pages - should only be visible to admins. May need role-based nav filtering.',
      recommendation: 'REVIEW',
      moduleGroup: 'pulse',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 16. QHSE sub-pages
  if (route.startsWith('/qhse/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'QHSE sub-page - should be accessible from QHSE section.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'qhse',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'HIGH'
    };
  }
  
  // 17. Proposals sub-pages
  if (route.startsWith('/proposals/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Proposals sub-page - enhanced/marketplace features not in main nav.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'proposals',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 18. Facility utility bills
  if (route.startsWith('/facility/')) {
    return {
      route,
      file,
      category: 'MODULE_REGISTERED',
      reason: 'Facility management sub-page - registered in module but not in main nav.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'facility',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 19. ICT Hardware Ecosystem - entire module
  if (route.startsWith('/ict-hardware-ecosystem')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'ICT Hardware Ecosystem module - entire module not in navigation.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'ict-hardware-ecosystem',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 20. Jobs pages
  if (route.startsWith('/jobs/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Jobs module pages - analytics and quick-start not accessible.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'jobs',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 21. Warehouse network
  if (route.startsWith('/warehouse-network/')) {
    return {
      route,
      file,
      category: 'MODULE_REGISTERED',
      reason: 'Warehouse Network sub-pages in module registry but not main nav.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'warehouse-network',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 22. Projects page
  if (route === '/projects') {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Projects page exists but not in navigation. May be for project management feature.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'projects',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 23. Process lifecycle workflow builder
  if (route.includes('/process-lifecycle/')) {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Process Lifecycle sub-page - workflow builder should be accessible.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'process-lifecycle',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 24. Settings currency
  if (route === '/settings/currency') {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Currency settings page not in settings menu.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'settings',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 25. Task management duplicate
  if (route === '/task-management') {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Task management page exists but /tasks is used in nav instead. May be duplicate.',
      recommendation: 'REVIEW',
      moduleGroup: 'wms',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 26. NCR page
  if (route === '/ncr') {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'NCR page exists but /ncr-management is used in nav. May be duplicate or old.',
      recommendation: 'REVIEW',
      moduleGroup: 'iso-ims',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 27. Purchase orders
  if (route === '/purchase-orders') {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Purchase Orders page exists but /orders is used in nav. May be duplicate.',
      recommendation: 'REVIEW',
      moduleGroup: 'wms',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 28. Users page
  if (route === '/users') {
    return {
      route,
      file,
      category: 'MODULE_REGISTERED',
      reason: 'Users page registered in WMS module but nav uses /settings/users instead.',
      recommendation: 'REVIEW',
      moduleGroup: 'admin',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 29. MaaS page
  if (route === '/maas') {
    return {
      route,
      file,
      category: 'MODULE_REGISTERED',
      reason: 'MaaS dashboard exists but /manufacturing is used in nav. May be entry point.',
      recommendation: 'REVIEW',
      moduleGroup: 'maas',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 30. Integration page
  if (route === '/integration') {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Integration dashboard page exists but not directly accessible.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'integration',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 31. IoT topology
  if (route === '/iot/network/topology') {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'IoT network topology page - advanced feature not in nav.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'iot',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 32. WebSocket streams
  if (route === '/websocket/streams') {
    return {
      route,
      file,
      category: 'HIDDEN_BY_DESIGN',
      reason: 'WebSocket streams debugging/monitoring page - developer tool.',
      recommendation: 'KEEP_AS_IS',
      moduleGroup: 'internal',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'LOW'
    };
  }
  
  // 33. Boardroom readiness
  if (route === '/boardroom-readiness') {
    return {
      route,
      file,
      category: 'MISSING_FROM_NAV',
      reason: 'Boardroom readiness assessment page - executive feature not in nav.',
      recommendation: 'ADD_TO_NAV',
      moduleGroup: 'executive',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 34. D/sales-orders (short URL)
  if (route === '/d/sales-orders') {
    return {
      route,
      file,
      category: 'HIDDEN_BY_DESIGN',
      reason: 'Short URL for sales orders dashboard - used for quick access/mobile.',
      recommendation: 'KEEP_AS_IS',
      moduleGroup: 'shortcuts',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'LOW'
    };
  }
  
  // 35. Trade compliance license apply
  if (route === '/trade-compliance/licenses/apply') {
    return {
      route,
      file,
      category: 'DYNAMIC_ROUTE',
      reason: 'License application form - accessed from license management page.',
      recommendation: 'LINK_FROM_PARENT',
      moduleGroup: 'trade-compliance',
      isPlaceholder,
      isWorking: 'NEEDS_TEST',
      priority: 'MEDIUM'
    };
  }
  
  // 36. QHSE dashboard legacy
  if (route === '/qhse-dashboard') {
    return {
      route,
      file,
      category: 'DEPRECATED',
      reason: 'Legacy QHSE dashboard - redirects to new location. Keep for backwards compatibility.',
      recommendation: 'KEEP_AS_IS',
      moduleGroup: 'qhse',
      isPlaceholder: false,
      isWorking: 'YES',
      priority: 'LOW'
    };
  }
  
  // Default case
  return {
    route,
    file,
    category: 'MISSING_FROM_NAV',
    reason: 'Page exists but is not accessible from navigation. Needs investigation.',
    recommendation: 'REVIEW',
    moduleGroup,
    isPlaceholder,
    isWorking: 'NEEDS_TEST',
    priority: 'MEDIUM'
  };
}

async function runAnalysis() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         COMPREHENSIVE ORPHAN PAGE ANALYSIS                     ║');
  console.log('║         BlueDXP Platform - Production Audit                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const analyses: OrphanAnalysis[] = orphanRoutes.map(route => analyzeOrphanPage(route));
  
  // Group by category
  const byCategory: Record<string, OrphanAnalysis[]> = {};
  const byRecommendation: Record<string, OrphanAnalysis[]> = {};
  const byModule: Record<string, OrphanAnalysis[]> = {};
  const byPriority: Record<string, OrphanAnalysis[]> = {};
  
  analyses.forEach(a => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    byCategory[a.category].push(a);
    
    if (!byRecommendation[a.recommendation]) byRecommendation[a.recommendation] = [];
    byRecommendation[a.recommendation].push(a);
    
    if (!byModule[a.moduleGroup]) byModule[a.moduleGroup] = [];
    byModule[a.moduleGroup].push(a);
    
    if (!byPriority[a.priority]) byPriority[a.priority] = [];
    byPriority[a.priority].push(a);
  });
  
  // Print summary
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                           SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  console.log('📊 BY CATEGORY:');
  Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length).forEach(([cat, items]) => {
    console.log(`   ${cat}: ${items.length} pages`);
  });
  
  console.log('\n🎯 BY RECOMMENDATION:');
  Object.entries(byRecommendation).sort((a, b) => b[1].length - a[1].length).forEach(([rec, items]) => {
    console.log(`   ${rec}: ${items.length} pages`);
  });
  
  console.log('\n🔥 BY PRIORITY:');
  Object.entries(byPriority).forEach(([pri, items]) => {
    console.log(`   ${pri}: ${items.length} pages`);
  });
  
  console.log('\n📦 BY MODULE GROUP:');
  Object.entries(byModule).sort((a, b) => b[1].length - a[1].length).forEach(([mod, items]) => {
    console.log(`   ${mod}: ${items.length} pages`);
  });
  
  // Print detailed analysis
  console.log('\n\n═══════════════════════════════════════════════════════════════════');
  console.log('                    DETAILED ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  // HIGH PRIORITY - Pages that should be in navigation
  console.log('\n🔴 HIGH PRIORITY - MUST FIX (Add to Navigation):');
  console.log('─────────────────────────────────────────────────────────────────\n');
  
  byPriority['HIGH']?.filter(a => a.recommendation === 'ADD_TO_NAV').forEach(a => {
    console.log(`  📍 ${a.route}`);
    console.log(`     Category: ${a.category}`);
    console.log(`     Reason: ${a.reason}`);
    console.log(`     Placeholder: ${a.isPlaceholder ? '⚠️ YES' : '✅ NO'}`);
    console.log('');
  });
  
  // MEDIUM PRIORITY - Review needed
  console.log('\n🟡 MEDIUM PRIORITY - REVIEW NEEDED:');
  console.log('─────────────────────────────────────────────────────────────────\n');
  
  byPriority['MEDIUM']?.forEach(a => {
    console.log(`  📍 ${a.route}`);
    console.log(`     Category: ${a.category}`);
    console.log(`     Recommendation: ${a.recommendation}`);
    console.log(`     Reason: ${a.reason}`);
    console.log('');
  });
  
  // LOW PRIORITY - Keep as is
  console.log('\n🟢 LOW PRIORITY - KEEP AS IS (Hidden by Design):');
  console.log('─────────────────────────────────────────────────────────────────\n');
  
  byPriority['LOW']?.forEach(a => {
    console.log(`  📍 ${a.route} - ${a.reason}`);
  });
  
  // Generate report files
  const report = {
    generatedAt: new Date().toISOString(),
    totalOrphans: analyses.length,
    summary: {
      byCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length])),
      byRecommendation: Object.fromEntries(Object.entries(byRecommendation).map(([k, v]) => [k, v.length])),
      byPriority: Object.fromEntries(Object.entries(byPriority).map(([k, v]) => [k, v.length])),
      byModule: Object.fromEntries(Object.entries(byModule).map(([k, v]) => [k, v.length])),
    },
    analyses,
    actionItems: {
      mustAddToNav: analyses.filter(a => a.recommendation === 'ADD_TO_NAV' && a.priority === 'HIGH'),
      needsReview: analyses.filter(a => a.recommendation === 'REVIEW'),
      shouldDelete: analyses.filter(a => a.recommendation === 'DELETE'),
      keepAsIs: analyses.filter(a => a.recommendation === 'KEEP_AS_IS'),
    }
  };
  
  fs.writeFileSync('ORPHAN_ANALYSIS_REPORT.json', JSON.stringify(report, null, 2));
  console.log('\n\n📄 Full report saved to ORPHAN_ANALYSIS_REPORT.json');
  
  // Generate navigation fix suggestions
  console.log('\n\n═══════════════════════════════════════════════════════════════════');
  console.log('                    NAVIGATION FIX SUGGESTIONS');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  const modulesToFix = Object.entries(byModule)
    .filter(([_, items]) => items.some(i => i.recommendation === 'ADD_TO_NAV'))
    .sort((a, b) => b[1].length - a[1].length);
  
  modulesToFix.forEach(([module, items]) => {
    const toAdd = items.filter(i => i.recommendation === 'ADD_TO_NAV');
    if (toAdd.length > 0) {
      console.log(`\n📦 ${module.toUpperCase()} MODULE (${toAdd.length} pages to add):`);
      toAdd.forEach(item => {
        console.log(`   + ${item.route}`);
      });
    }
  });
  
  console.log('\n\n✅ Analysis complete!');
  console.log(`   Total orphan pages: ${analyses.length}`);
  console.log(`   Need to add to nav: ${analyses.filter(a => a.recommendation === 'ADD_TO_NAV').length}`);
  console.log(`   Need review: ${analyses.filter(a => a.recommendation === 'REVIEW').length}`);
  console.log(`   Keep as is: ${analyses.filter(a => a.recommendation === 'KEEP_AS_IS').length}`);
}

runAnalysis().catch(console.error);
