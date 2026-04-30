/**
 * Check for Duplicate Routes in Navigation
 * Identifies duplicate href values in navigation structure
 */

import * as fs from 'fs';
import * as path from 'path';

const navigationFile = path.join(process.cwd(), 'lib/services/navigation/defaultNavigation.ts');
const content = fs.readFileSync(navigationFile, 'utf8');

// Extract all href values
const hrefs: string[] = [];
const regex = /href:\s*['"]([^'"]+)['"]/g;
let match;

while ((match = regex.exec(content)) !== null) {
  hrefs.push(match[1]);
}

// Find duplicates
const hrefCounts: Record<string, number> = {};
hrefs.forEach(href => {
  hrefCounts[href] = (hrefCounts[href] || 0) + 1;
});

const duplicates = Object.entries(hrefCounts)
  .filter(([_, count]) => count > 1)
  .map(([href, count]) => ({ href, count }));

// Find all occurrences of duplicate hrefs
const duplicateDetails: Record<string, { count: number; locations: string[] }> = {};

duplicates.forEach(({ href }) => {
  const locations: string[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.includes(`href: "${href}"`) || line.includes(`href: '${href}'`)) {
      // Try to find the name of the navigation item
      let name = 'Unknown';
      for (let i = index; i >= Math.max(0, index - 5); i--) {
        const nameMatch = lines[i].match(/name:\s*['"]([^'"]+)['"]/);
        if (nameMatch) {
          name = nameMatch[1];
          break;
        }
      }
      locations.push(`Line ${index + 1}: "${name}"`);
    }
  });
  
  duplicateDetails[href] = {
    count: hrefCounts[href],
    locations
  };
});

// Generate report
const report = {
  summary: {
    totalHrefs: hrefs.length,
    uniqueHrefs: new Set(hrefs).size,
    duplicatesFound: duplicates.length
  },
  duplicates: duplicateDetails
};

console.log('\n📊 DUPLICATE ROUTE ANALYSIS\n');
console.log(`Total hrefs: ${report.summary.totalHrefs}`);
console.log(`Unique hrefs: ${report.summary.uniqueHrefs}`);
console.log(`Duplicates found: ${report.summary.duplicatesFound}\n`);

if (duplicates.length > 0) {
  console.log('🔍 DUPLICATE ROUTES FOUND:\n');
  Object.entries(duplicateDetails).forEach(([href, details]) => {
    console.log(`Route: ${href}`);
    console.log(`  Appears ${details.count} times:`);
    details.locations.forEach(loc => console.log(`    - ${loc}`));
    console.log('');
  });
} else {
  console.log('✅ NO DUPLICATE ROUTES FOUND!\n');
}

// Save report
const reportPath = path.join(process.cwd(), 'DUPLICATE_ROUTES_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📄 Report saved to: ${reportPath}\n`);
