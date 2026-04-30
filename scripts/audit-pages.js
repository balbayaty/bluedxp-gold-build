const fs = require('fs');
const path = require('path');

// Extract all routes from Layout.tsx navigation structure
const routes = [
  // Dashboard & Showcase
  { href: '/', name: 'Dashboard' },
  { href: '/showcase', name: 'Showcase' },
  
  // Warehouse Management
  { href: '/inbound', name: 'Inbound Operations' },
  { href: '/outbound', name: 'Outbound Operations' },
  { href: '/goods-receipt', name: 'Goods Receipt' },
  { href: '/goods-issue', name: 'Goods Issue' },
  { href: '/transfer-posting', name: 'Transfer Posting' },
  { href: '/putaway', name: 'Putaway' },
  { href: '/picking', name: 'Picking' },
  { href: '/cycle-counting', name: 'Cycle Counting' },
  { href: '/cross-docking', name: 'Cross-Docking' },
  { href: '/task-management', name: 'Task Management' },
  
  // Inventory Management
  { href: '/inventory', name: 'Stock Overview' },
  { href: '/skus', name: 'Material Master' },
  { href: '/batches', name: 'Batch Management' },
  { href: '/serials', name: 'Serial Number' },
  { href: '/valuation', name: 'Stock Valuation' },
  { href: '/abc-analysis', name: 'ABC Analysis' },
  { href: '/stock-alerts', name: 'Stock Alerts' },
  { href: '/expiry-management', name: 'Expiry Management' },
  { href: '/reservations', name: 'Reservations' },
  { href: '/replenishment', name: 'Replenishment' },
  
  // Order Management
  { href: '/orders', name: 'Purchase Orders' },
  { href: '/sales-orders', name: 'Sales Orders' },
  { href: '/order-confirmation', name: 'Order Confirmation' },
  { href: '/pick-release', name: 'Pick Release' },
  { href: '/wave-planning', name: 'Wave Planning' },
  { href: '/load-planning', name: 'Load Planning' },
  { href: '/ship-confirmation', name: 'Ship Confirmation' },
  { href: '/delivery-note', name: 'Delivery Note' },
  { href: '/return-management', name: 'Return Management' },
  
  // Transportation
  { href: '/carriers', name: 'Carrier Management' },
  { href: '/pickup-requests', name: 'Pickup Requests' },
  { href: '/tracking', name: 'Shipment Tracking' },
  { href: '/routes', name: 'Route Optimization' },
  { href: '/freight', name: 'Freight Management' },
  { href: '/pod', name: 'Proof of Delivery' },
  { href: '/transportation', name: 'Transportation Dashboard' },
  { href: '/transportation/multimodal', name: 'Multi-Modal Transport' },
  { href: '/transportation/sea', name: 'Sea Freight' },
  { href: '/transportation/air', name: 'Air Freight' },
  { href: '/transportation/rail', name: 'Rail Freight' },
  { href: '/transportation/customs', name: 'Customs Management' },
  { href: '/transportation/customs/declarations', name: 'Customs Declarations' },
  { href: '/transportation/customs/brokers', name: 'Customs Brokers' },
  { href: '/transportation/ports', name: 'Ports & Terminals' },
  { href: '/transportation/insurance', name: 'Insurance' },
  { href: '/transportation/analytics', name: 'Transportation Analytics' },
  { href: '/transportation/integration', name: 'Integration Settings' },
  { href: '/transportation/proposals', name: 'Proposals & Reports' },
  
  // Proposals & RFQ
  { href: '/proposals', name: 'Proposals Dashboard' },
  { href: '/proposals/rfq', name: 'RFQ Management' },
  { href: '/proposals/rfq/new', name: 'New RFQ' },
  { href: '/proposals/new', name: 'Create Proposal' },
  { href: '/proposals/templates', name: 'Templates' },
  { href: '/proposals/services', name: 'Service Catalog' },
  { href: '/proposals/rate-cards', name: 'Rate Cards' },
  { href: '/proposals/journey', name: 'Journey Analysis' },
  { href: '/proposals/train-schedules', name: 'Train Schedules' },
  { href: '/proposals/analytics', name: 'Analytics' },
  
  // ISO IMS
  { href: '/iso-ims', name: 'ISO IMS Dashboard' },
  { href: '/capa-management', name: 'CAPA Management' },
  { href: '/ncr-management', name: 'NCR Management' },
  { href: '/audit-management', name: 'Audit Management' },
  { href: '/document-center', name: 'Document Center' },
  { href: '/risk-management', name: 'Risk Management' },
  { href: '/training-management', name: 'Training Management' },
  { href: '/my-tasks', name: 'My Tasks' },
  { href: '/approvals', name: 'Approvals' },
  
  // Quality Management
  { href: '/inspection-lots', name: 'Inspection Lots' },
  { href: '/damage', name: 'Damage Reports' },
  { href: '/certificates', name: 'Quality Certificates' },
  { href: '/holds', name: 'Hold Management' },
  
  // Master Data
  { href: '/materials', name: 'Material Master' },
  { href: '/vendors', name: 'Vendor Master' },
  { href: '/customers', name: 'Customer Master' },
  { href: '/storage-locations', name: 'Storage Location' },
  { href: '/bins', name: 'Bin Master' },
  { href: '/work-centers', name: 'Work Center' },
  { href: '/resources', name: 'Resource Master' },
  
  // AI Vision
  { href: '/ai-vision', name: 'AI Vision Inspector' },
  { href: '/ai-vision/history', name: 'Analysis History' },
  
  // Chemical Management
  { href: '/msds', name: 'MSDS Complete' },
  { href: '/msds-intelligence', name: 'MSDS Intelligence' },
  
  // QHSE - Redirects to /qhse/dashboard
  { href: '/qhse-dashboard', name: 'QHSE Dashboard (Legacy - Redirects)' },
  
  // Intelligent Orchestration
  { href: '/intelligent-orchestration/process-mining', name: 'Process Mining' },
  { href: '/intelligent-orchestration/root-cause', name: 'Root Cause Analysis' },
  { href: '/intelligent-orchestration/predictive', name: 'Predictive Analytics' },
  { href: '/intelligent-orchestration/communication', name: 'Communication Orchestration' },
  { href: '/intelligent-orchestration/compliance', name: 'Autonomous Compliance' },
  { href: '/intelligent-orchestration/insights', name: 'Automated Insights' },
  
  // SLA & Performance
  { href: '/sla-kpi', name: 'SLA Management' },
  { href: '/kpi-dashboard', name: 'KPI Dashboard' },
  { href: '/reports', name: 'SLA Reports' },
  { href: '/modern-sla', name: 'Modern SLA Framework' },
  { href: '/customer-dashboard', name: 'Customer Dashboard' },
  { href: '/overtime', name: 'Overtime Tracking' },
  
  // Reporting & Analytics
  { href: '/reports/operational', name: 'Operational Reports' },
  { href: '/reports/inventory', name: 'Inventory Reports' },
  { href: '/reports/orders', name: 'Order Reports' },
  { href: '/reports/performance', name: 'Performance Reports' },
  { href: '/reports/financial', name: 'Financial Reports' },
  { href: '/reports/custom', name: 'Custom Reports' },
  { href: '/data-mining', name: 'Data Mining' },
  
  // Integration
  { href: '/integration/erp', name: 'ERP Integration' },
  { href: '/integration/edi', name: 'EDI Integration' },
  { href: '/integration/api', name: 'API Management' },
  { href: '/integration/carriers', name: 'Carrier Integration' },
  { href: '/integration/benchmarks', name: 'Benchmarks' },
  { href: '/integration/labels', name: 'Label Printing' },
  
  // Manufacturing (MaaS)
  { href: '/manufacturing', name: 'MaaS Dashboard' },
  { href: '/manufacturing/production-orders', name: 'Production Orders' },
  { href: '/manufacturing/work-orders', name: 'Work Orders' },
  { href: '/manufacturing/capacity-planning', name: 'Capacity Planning' },
  { href: '/manufacturing/shop-floor', name: 'Shop Floor Control' },
  { href: '/manufacturing/quality-control', name: 'Quality Control' },
  { href: '/manufacturing/bom', name: 'Bill of Materials' },
  { href: '/manufacturing/routing', name: 'Routing & Operations' },
  { href: '/manufacturing/analytics', name: 'MaaS Analytics' },
  
  // Compliance Management
  { href: '/compliance', name: 'Compliance Dashboard' },
  
  // Trade Compliance
  { href: '/trade-compliance', name: 'Trade Compliance Dashboard' },
  { href: '/trade-compliance/records', name: 'Compliance Records' },
  { href: '/trade-compliance/create', name: 'Create Record' },
  { href: '/trade-compliance/licenses', name: 'License Management' },
  { href: '/trade-compliance/civil-defense', name: 'Civil Defense' },
  { href: '/trade-compliance/sfda', name: 'SFDA Licenses' },
  { href: '/trade-compliance/landed-costs', name: 'Landed Cost Calculator' },
  { href: '/trade-compliance/process-flows', name: 'Process Flows' },
  
  // Configuration
  { href: '/settings/warehouse', name: 'Warehouse Setup' },
  { href: '/settings/users', name: 'User Management' },
  { href: '/settings/workflow', name: 'Workflow Engine' },
  { href: '/settings/notifications', name: 'Notification Rules' },
  { href: '/settings/templates', name: 'Print Templates' },
  { href: '/settings/parameters', name: 'System Parameters' },
  { href: '/settings/ai', name: 'AI & Agents' },
  { href: '/settings/accessibility', name: 'Adaptive Accessibility' },
  { href: '/settings', name: 'All Settings' },
];

function getPagePath(href) {
  if (href === '/') {
    return 'app/page.tsx';
  }
  const pathParts = href.split('/').filter(Boolean);
  return `app/${pathParts.join('/')}/page.tsx`;
}

function checkPageExists(route) {
  const pagePath = getPagePath(route.href);
  const fullPath = path.join(process.cwd(), pagePath);
  return {
    route,
    pagePath,
    exists: fs.existsSync(fullPath),
    fullPath
  };
}

console.log('🔍 Auditing all pages...\n');

const results = routes.map(checkPageExists);
const existing = results.filter(r => r.exists);
const missing = results.filter(r => !r.exists);

console.log(`✅ Found: ${existing.length} pages`);
console.log(`❌ Missing: ${missing.length} pages\n`);

if (missing.length > 0) {
  console.log('📋 MISSING PAGES:\n');
  missing.forEach(({ route, pagePath }) => {
    console.log(`  ❌ ${route.name}`);
    console.log(`     Route: ${route.href}`);
    console.log(`     Expected: ${pagePath}\n`);
  });
}

// Write results to file
const report = {
  total: routes.length,
  existing: existing.length,
  missing: missing.length,
  missingPages: missing.map(({ route, pagePath }) => ({
    name: route.name,
    href: route.href,
    expectedPath: pagePath
  })),
  existingPages: existing.map(({ route }) => ({
    name: route.name,
    href: route.href
  }))
};

fs.writeFileSync(
  'PAGE_AUDIT_REPORT.json',
  JSON.stringify(report, null, 2)
);

console.log('\n📄 Full report saved to PAGE_AUDIT_REPORT.json');

