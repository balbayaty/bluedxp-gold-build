/**
 * Navigation Connectivity Audit
 * 
 * Checks all pages in navigation for:
 * 1. Mock data usage (not connected to real services)
 * 2. Real API/database connections
 * 3. Duplicate pages
 * 4. Integration status
 */

import * as fs from 'fs';
import * as path from 'path';

interface PageAudit {
  route: string;
  file: string;
  exists: boolean;
  hasMockData: boolean;
  hasRealAPI: boolean;
  hasDatabase: boolean;
  hasService: boolean;
  isPlaceholder: boolean;
  mockDataIndicators: string[];
  apiEndpoints: string[];
  serviceConnections: string[];
  duplicateOf?: string;
  status: 'CONNECTED' | 'MOCK_DATA' | 'PLACEHOLDER' | 'MISSING' | 'PARTIAL';
  recommendation: string;
}

const navigationFile = path.join(process.cwd(), 'lib/services/navigation/defaultNavigation.ts');
const navContent = fs.readFileSync(navigationFile, 'utf-8');

// Extract all hrefs from navigation
const hrefRegex = /href:\s*['"]([^'"]+)['"]/g;
const hrefs: string[] = [];
let match: RegExpExecArray | null;
while ((match = hrefRegex.exec(navContent)) !== null) {
  if (match[1].startsWith('/') && !match[1].startsWith('//')) {
    hrefs.push(match[1]);
  }
}

// Remove duplicates but track them
const uniqueHrefs = new Set<string>();
const duplicates: Map<string, string[]> = new Map();

hrefs.forEach(href => {
  if (uniqueHrefs.has(href)) {
    const existing = Array.from(duplicates.keys()).find(k => k === href) || href;
    if (!duplicates.has(existing)) {
      duplicates.set(existing, [href]);
    } else {
      duplicates.get(existing)!.push(href);
    }
  } else {
    uniqueHrefs.add(href);
  }
});

function auditPage(route: string): PageAudit {
  const file = route === '/' ? 'app/page.tsx' : `app${route}/page.tsx`;
  const fullPath = path.join(process.cwd(), file);
  
  const audit: PageAudit = {
    route,
    file,
    exists: fs.existsSync(fullPath),
    hasMockData: false,
    hasRealAPI: false,
    hasDatabase: false,
    hasService: false,
    isPlaceholder: false,
    mockDataIndicators: [],
    apiEndpoints: [],
    serviceConnections: [],
    status: 'MISSING',
    recommendation: '',
  };

  if (!audit.exists) {
    audit.recommendation = 'Page file does not exist - remove from navigation';
    return audit;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check for placeholder indicators
  const placeholderPatterns = [
    /Coming Soon/i,
    /Under Development/i,
    /Under Construction/i,
    /Placeholder/i,
    /Auto-generated page for/i,
    /This page is ready for implementation/i,
  ];
  
  audit.isPlaceholder = placeholderPatterns.some(pattern => pattern.test(content));

  // Check for mock data indicators
  const mockDataPatterns = [
    /generateMock|generateTasks|generatePurchaseOrders|generateMaterialMaster|generateVendorMaster|generateDemo|mockData|MOCK_|mock:/i,
    /from.*mockDataGenerators/i,
    /from.*demoDataService/i,
    /\/\/ Mock/i,
    /\/\/ TODO.*mock/i,
  ];

  mockDataPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      audit.hasMockData = true;
      const matches = content.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        audit.mockDataIndicators.push(...matches.slice(0, 3));
      }
    }
  });

  // Check for real API connections
  const apiPatterns = [
    /fetch\(['"]\/api\//g,
    /axios\.(get|post|put|delete)\(['"]\/api\//g,
    /useSWR\(['"]\/api\//g,
    /useQuery\(['"]\/api\//g,
  ];

  apiPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      audit.hasRealAPI = true;
      matches.forEach(m => {
        const apiMatch = m.match(/\/api\/[^'"]+/);
        if (apiMatch) {
          audit.apiEndpoints.push(apiMatch[0]);
        }
      });
    }
  });

  // Check for database connections
  const dbPatterns = [
    /prisma\./,
    /await prisma/,
    /@prisma\/client/,
    /PrismaClient/,
    /\.findMany|\.findFirst|\.create|\.update|\.delete/,
  ];

  dbPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      audit.hasDatabase = true;
    }
  });

  // Check for service connections
  const servicePatterns = [
    /from ['"]@\/lib\/services\//,
    /from ['"].*\/services\//,
    /Service\./,
    /service\./,
  ];

  servicePatterns.forEach(pattern => {
    if (pattern.test(content)) {
      audit.hasService = true;
      const matches = content.match(/from ['"](.*\/services\/[^'"]+)/g);
      if (matches) {
        matches.forEach(m => {
          const serviceMatch = m.match(/['"](.*)['"]/);
          if (serviceMatch) {
            audit.serviceConnections.push(serviceMatch[1]);
          }
        });
      }
    }
  });

  // Determine status
  if (audit.isPlaceholder) {
    audit.status = 'PLACEHOLDER';
    audit.recommendation = 'Placeholder page - remove from navigation until implemented';
  } else if (audit.hasMockData && !audit.hasRealAPI && !audit.hasDatabase) {
    audit.status = 'MOCK_DATA';
    audit.recommendation = 'Uses mock data only - remove from navigation until connected to real services';
  } else if (audit.hasDatabase || (audit.hasRealAPI && audit.hasService)) {
    audit.status = 'CONNECTED';
    audit.recommendation = 'Connected to real infrastructure - keep in navigation';
  } else if (audit.hasRealAPI || audit.hasService) {
    audit.status = 'PARTIAL';
    audit.recommendation = 'Partially connected - review and complete integration';
  } else {
    audit.status = 'MOCK_DATA';
    audit.recommendation = 'No real connections detected - remove from navigation';
  }

  return audit;
}

// Audit all pages
const audits: PageAudit[] = Array.from(uniqueHrefs).map(route => auditPage(route));

// Add duplicate information
duplicates.forEach((dups, original) => {
  const audit = audits.find(a => a.route === original);
  if (audit) {
    audit.duplicateOf = dups.join(', ');
  }
});

// Generate report
const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalPages: audits.length,
    connected: audits.filter(a => a.status === 'CONNECTED').length,
    mockData: audits.filter(a => a.status === 'MOCK_DATA').length,
    placeholder: audits.filter(a => a.status === 'PLACEHOLDER').length,
    missing: audits.filter(a => a.status === 'MISSING').length,
    partial: audits.filter(a => a.status === 'PARTIAL').length,
    duplicates: duplicates.size,
  },
  byStatus: {
    CONNECTED: audits.filter(a => a.status === 'CONNECTED'),
    MOCK_DATA: audits.filter(a => a.status === 'MOCK_DATA'),
    PLACEHOLDER: audits.filter(a => a.status === 'PLACEHOLDER'),
    MISSING: audits.filter(a => a.status === 'MISSING'),
    PARTIAL: audits.filter(a => a.status === 'PARTIAL'),
  },
  duplicates: Array.from(duplicates.entries()).map(([route, dups]) => ({
    route,
    duplicateRoutes: dups,
  })),
  allAudits: audits,
};

// Write report
const reportPath = path.join(process.cwd(), 'NAVIGATION_CONNECTIVITY_AUDIT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Generate markdown report
const mdReport: string[] = [];
mdReport.push('# Navigation Connectivity Audit Report');
mdReport.push(`\n**Generated:** ${report.generatedAt}\n`);
mdReport.push('## Summary\n');
mdReport.push(`- **Total Pages:** ${report.summary.totalPages}`);
mdReport.push(`- **✅ Connected:** ${report.summary.connected}`);
mdReport.push(`- **❌ Mock Data:** ${report.summary.mockData}`);
mdReport.push(`- **⚠️ Placeholder:** ${report.summary.placeholder}`);
mdReport.push(`- **🔴 Missing:** ${report.summary.missing}`);
mdReport.push(`- **🟡 Partial:** ${report.summary.partial}`);
mdReport.push(`- **🔄 Duplicates:** ${report.summary.duplicates}\n`);

mdReport.push('## ❌ Pages Using Mock Data (Remove from Navigation)\n');
report.byStatus.MOCK_DATA.forEach(audit => {
  mdReport.push(`### ${audit.route}`);
  mdReport.push(`- **File:** \`${audit.file}\``);
  mdReport.push(`- **Mock Indicators:** ${audit.mockDataIndicators.join(', ') || 'None detected'}`);
  mdReport.push(`- **Recommendation:** ${audit.recommendation}\n`);
});

mdReport.push('## ⚠️ Placeholder Pages (Remove from Navigation)\n');
report.byStatus.PLACEHOLDER.forEach(audit => {
  mdReport.push(`- \`${audit.route}\` - ${audit.recommendation}\n`);
});

mdReport.push('## 🔴 Missing Pages (Remove from Navigation)\n');
report.byStatus.MISSING.forEach(audit => {
  mdReport.push(`- \`${audit.route}\` - ${audit.recommendation}\n`);
});

mdReport.push('## 🔄 Duplicate Routes\n');
report.duplicates.forEach(dup => {
  mdReport.push(`- \`${dup.route}\` appears multiple times in navigation\n`);
});

mdReport.push('## 🟡 Partially Connected (Review Needed)\n');
report.byStatus.PARTIAL.forEach(audit => {
  mdReport.push(`### ${audit.route}`);
  mdReport.push(`- **API Endpoints:** ${audit.apiEndpoints.join(', ') || 'None'}`);
  mdReport.push(`- **Service Connections:** ${audit.serviceConnections.slice(0, 3).join(', ') || 'None'}`);
  mdReport.push(`- **Recommendation:** ${audit.recommendation}\n`);
});

const mdReportPath = path.join(process.cwd(), 'NAVIGATION_CONNECTIVITY_AUDIT.md');
fs.writeFileSync(mdReportPath, mdReport.join('\n'));

console.log('✅ Navigation Connectivity Audit Complete!');
console.log(`📄 JSON Report: ${reportPath}`);
console.log(`📄 Markdown Report: ${mdReportPath}`);
console.log(`\nSummary:`);
console.log(`  ✅ Connected: ${report.summary.connected}`);
console.log(`  ❌ Mock Data: ${report.summary.mockData}`);
console.log(`  ⚠️ Placeholder: ${report.summary.placeholder}`);
console.log(`  🔴 Missing: ${report.summary.missing}`);
console.log(`  🔄 Duplicates: ${report.summary.duplicates}`);
