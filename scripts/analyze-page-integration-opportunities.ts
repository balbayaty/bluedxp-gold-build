/**
 * Page Integration Opportunities Analysis
 * 
 * For each page using mock data, find:
 * 1. Available services/APIs that can be connected
 * 2. Upgraded versions that exist
 * 3. Integration plan
 * 4. Only flag for removal if truly obsolete
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface IntegrationOpportunity {
  route: string;
  file: string;
  currentStatus: 'MOCK_DATA' | 'PLACEHOLDER' | 'PARTIAL' | 'CONNECTED';
  availableServices: string[];
  availableAPIs: string[];
  upgradedVersion?: string;
  integrationPlan: string;
  estimatedTime: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: 'CONNECT' | 'UPGRADE' | 'CREATE_SERVICE' | 'REMOVE' | 'KEEP_AS_IS';
  reason: string;
}

// Read audit results
const auditPath = path.join(process.cwd(), 'NAVIGATION_CONNECTIVITY_AUDIT.json');
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));

// Find all API routes
const apiRoutes: string[] = [];
const apiFiles = glob.sync('app/api/**/route.ts', { cwd: process.cwd() });
apiFiles.forEach(file => {
  const route = file
    .replace('app/api/', '/api/')
    .replace('/route.ts', '')
    .replace(/\[.*?\]/g, ':id'); // Replace [id] with :id
  apiRoutes.push(route);
});

// Find all services
const serviceFiles = glob.sync('lib/services/**/*.ts', { cwd: process.cwd() });
const services: string[] = [];
serviceFiles.forEach(file => {
  if (file.includes('index.ts') || file.includes('.test.') || file.includes('.spec.')) return;
  const serviceName = path.basename(file, '.ts');
  const module = file.split('/')[2]; // lib/services/[module]/...
  services.push(`${module}/${serviceName}`);
});

// Service/API mapping for common patterns
const serviceMappings: Record<string, { services: string[]; apis: string[] }> = {
  'purchase-orders': {
    services: ['procurement/purchaseOrderService', 'wms/InboundService'],
    apis: ['/api/wms/purchase-orders', '/api/procurement/purchase-orders'],
  },
  'task-management': {
    services: ['wms/OutboundService', 'wms/InboundService'],
    apis: ['/api/wms/picking', '/api/wms/putaway'],
  },
  'goods-receipt': {
    services: ['wms/InboundService'],
    apis: ['/api/wms/goods-receipt', '/api/wms/inbound'],
  },
  'goods-issue': {
    services: ['wms/OutboundService'],
    apis: ['/api/wms/outbound', '/api/wms/goods-issue'],
  },
  'putaway': {
    services: ['wms/InboundService'],
    apis: ['/api/wms/putaway', '/api/wms/inbound'],
  },
  'picking': {
    services: ['wms/OutboundService'],
    apis: ['/api/wms/picking', '/api/wms/outbound'],
  },
  'replenishment': {
    services: ['wms/ReplenishmentService'],
    apis: ['/api/wms/replenishment'],
  },
  'warehouse-areas': {
    services: ['wms/areaService'],
    apis: ['/api/wms/areas'],
  },
  'bins': {
    services: ['wms/binService'],
    apis: ['/api/wms/bins'],
  },
  'storage-locations': {
    services: ['wms/locationService'],
    apis: ['/api/wms/locations'],
  },
  'wave-planning': {
    services: ['wms/OutboundService'],
    apis: ['/api/wms/outbound'],
  },
  'expiry-management': {
    services: ['wms/cycleCountService'],
    apis: ['/api/wms/inventory/cycle-count'],
  },
  'inventory': {
    services: ['wms/inventoryService'],
    apis: ['/api/wms/inventory'],
  },
  'skus': {
    services: ['wms/MaterialService', 'wms/skuService'],
    apis: ['/api/wms/skus', '/api/wms/sku'],
  },
};

// Check for upgraded versions
const upgradedVersions: Record<string, string> = {
  '/users': '/settings/users',
  '/ncr': '/ncr-management',
  '/customer-dashboard': '/dashboard/customer',
  '/kpi-dashboard': '/sla-kpi',
  '/modern-sla': '/sla-kpi',
  '/stock-alerts': '/inventory?view=alerts',
};

function analyzePage(auditEntry: any): IntegrationOpportunity {
  const route = auditEntry.route;
  const routeKey = route.replace(/^\//, '').replace(/\//g, '-');
  
  const opportunity: IntegrationOpportunity = {
    route,
    file: auditEntry.file,
    currentStatus: auditEntry.status,
    availableServices: [],
    availableAPIs: [],
    integrationPlan: '',
    estimatedTime: '',
    priority: 'MEDIUM',
    recommendation: 'KEEP_AS_IS',
    reason: '',
  };

  // Check for upgraded version
  if (upgradedVersions[route]) {
    opportunity.upgradedVersion = upgradedVersions[route];
    opportunity.recommendation = 'UPGRADE';
    opportunity.reason = `Upgraded version exists: ${upgradedVersions[route]}`;
    opportunity.priority = 'HIGH';
    return opportunity;
  }

  // Check service mappings
  const mapping = serviceMappings[routeKey] || serviceMappings[route.replace(/^\//, '')];
  if (mapping) {
    opportunity.availableServices = mapping.services;
    opportunity.availableAPIs = mapping.apis.filter(api => 
      apiRoutes.some(r => r.includes(api.replace('/api', '')))
    );
    
    if (opportunity.availableAPIs.length > 0 || opportunity.availableServices.length > 0) {
      opportunity.recommendation = 'CONNECT';
      opportunity.priority = 'HIGH';
      opportunity.integrationPlan = `Connect page to ${opportunity.availableAPIs[0] || opportunity.availableServices[0]}`;
      opportunity.estimatedTime = '1-2 hours';
      opportunity.reason = 'Service/API exists - can be connected immediately';
    }
  }

  // Check if placeholder
  if (auditEntry.isPlaceholder) {
    opportunity.recommendation = 'REMOVE';
    opportunity.reason = 'Placeholder page - not implemented';
    opportunity.priority = 'LOW';
    return opportunity;
  }

  // Check if truly has no connections
  if (auditEntry.status === 'MOCK_DATA' && 
      opportunity.availableServices.length === 0 && 
      opportunity.availableAPIs.length === 0 &&
      !opportunity.upgradedVersion) {
    opportunity.recommendation = 'CREATE_SERVICE';
    opportunity.reason = 'No existing service/API - needs to be created';
    opportunity.priority = 'MEDIUM';
    opportunity.integrationPlan = 'Create service and API endpoint';
    opportunity.estimatedTime = '4-8 hours';
  }

  return opportunity;
}

// Analyze all mock data pages
const mockDataPages = audit.byStatus.MOCK_DATA || [];
const opportunities: IntegrationOpportunity[] = mockDataPages.map(analyzePage);

// Generate report
const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalAnalyzed: opportunities.length,
    canConnect: opportunities.filter(o => o.recommendation === 'CONNECT').length,
    needUpgrade: opportunities.filter(o => o.recommendation === 'UPGRADE').length,
    needService: opportunities.filter(o => o.recommendation === 'CREATE_SERVICE').length,
    shouldRemove: opportunities.filter(o => o.recommendation === 'REMOVE').length,
    keepAsIs: opportunities.filter(o => o.recommendation === 'KEEP_AS_IS').length,
  },
  byRecommendation: {
    CONNECT: opportunities.filter(o => o.recommendation === 'CONNECT'),
    UPGRADE: opportunities.filter(o => o.recommendation === 'UPGRADE'),
    CREATE_SERVICE: opportunities.filter(o => o.recommendation === 'CREATE_SERVICE'),
    REMOVE: opportunities.filter(o => o.recommendation === 'REMOVE'),
    KEEP_AS_IS: opportunities.filter(o => o.recommendation === 'KEEP_AS_IS'),
  },
  highPriority: opportunities.filter(o => o.priority === 'HIGH'),
  allOpportunities: opportunities,
};

// Write report
const reportPath = path.join(process.cwd(), 'PAGE_INTEGRATION_OPPORTUNITIES.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Generate markdown
const mdReport: string[] = [];
mdReport.push('# Page Integration Opportunities Analysis');
mdReport.push(`\n**Generated:** ${report.generatedAt}\n`);
mdReport.push('## Summary\n');
mdReport.push(`- **Total Pages Analyzed:** ${report.summary.totalAnalyzed}`);
mdReport.push(`- **✅ Can Connect Immediately:** ${report.summary.canConnect}`);
mdReport.push(`- **🔄 Need Upgrade (Better Version Exists):** ${report.summary.needUpgrade}`);
mdReport.push(`- **🔧 Need Service Creation:** ${report.summary.needService}`);
mdReport.push(`- **❌ Should Remove:** ${report.summary.shouldRemove}`);
mdReport.push(`- **✅ Keep As-Is:** ${report.summary.keepAsIs}\n`);

mdReport.push('## 🚀 HIGH PRIORITY: Can Connect Immediately\n');
report.byRecommendation.CONNECT.forEach(opp => {
  mdReport.push(`### ${opp.route}`);
  mdReport.push(`- **Available APIs:** ${opp.availableAPIs.join(', ') || 'None'}`);
  mdReport.push(`- **Available Services:** ${opp.availableServices.join(', ') || 'None'}`);
  mdReport.push(`- **Integration Plan:** ${opp.integrationPlan}`);
  mdReport.push(`- **Estimated Time:** ${opp.estimatedTime}`);
  mdReport.push(`- **Reason:** ${opp.reason}\n`);
});

mdReport.push('## 🔄 UPGRADE: Better Version Exists\n');
report.byRecommendation.UPGRADE.forEach(opp => {
  mdReport.push(`- **${opp.route}** → Redirect to **${opp.upgradedVersion}**`);
  mdReport.push(`  - Reason: ${opp.reason}\n`);
});

mdReport.push('## 🔧 CREATE SERVICE: Needs Backend Development\n');
report.byRecommendation.CREATE_SERVICE.slice(0, 20).forEach(opp => {
  mdReport.push(`- **${opp.route}** - ${opp.integrationPlan} (${opp.estimatedTime})\n`);
});

mdReport.push('## ❌ REMOVE: Placeholder Pages\n');
mdReport.push(`**Total:** ${report.summary.shouldRemove} placeholder pages\n`);
mdReport.push('These should be removed from navigation until implemented.\n');

const mdReportPath = path.join(process.cwd(), 'PAGE_INTEGRATION_OPPORTUNITIES.md');
fs.writeFileSync(mdReportPath, mdReport.join('\n'));

console.log('✅ Integration Opportunities Analysis Complete!');
console.log(`📄 JSON Report: ${reportPath}`);
console.log(`📄 Markdown Report: ${mdReportPath}`);
console.log(`\nSummary:`);
console.log(`  ✅ Can Connect: ${report.summary.canConnect}`);
console.log(`  🔄 Need Upgrade: ${report.summary.needUpgrade}`);
console.log(`  🔧 Need Service: ${report.summary.needService}`);
console.log(`  ❌ Should Remove: ${report.summary.shouldRemove}`);
