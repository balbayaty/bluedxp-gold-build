const fs = require('fs');
const path = require('path');

// Test configuration
const tests = {
  pages: [],
  errors: [],
  warnings: [],
  passed: 0,
  failed: 0,
}

// Get all page files
function getAllPages(dir = 'app', fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllPages(filePath, fileList);
    } else if (file === 'page.tsx' || file === 'page.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Test a single page file
function testPage(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const issues = [];
  
  // Test 1: Check for 'use client' directive if using hooks
  const usesHooks = /useState|useEffect|useRouter|usePathname/.test(content);
  const hasClientDirective = content.includes("'use client'") || content.includes('"use client"');
  
  if (usesHooks && !hasClientDirective) {
    issues.push({
      type: 'error',
      message: 'Page uses React hooks but missing "use client" directive',
    });
  }
  
  // Test 2: Check for default export
  if (!/export\s+default\s+function/.test(content) && !/export\s+default/.test(content)) {
    issues.push({
      type: 'error',
      message: 'Page missing default export',
    });
  }
  
  // Test 3: Check for common import errors
  const importPattern = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  
  while ((match = importPattern.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Test 4: Check for remixicon-react imports (should be valid)
  if (content.includes('remixicon-react')) {
    const remixiconImports = content.match(/from\s+['"]remixicon-react['"]/g);
    if (remixiconImports && remixiconImports.length > 0) {
      // Check if icons are properly imported
      const iconImports = content.match(/import\s+\{[^}]*\}\s+from\s+['"]remixicon-react['"]/);
      if (!iconImports) {
        issues.push({
          type: 'warning',
          message: 'remixicon-react imported but no icons found',
        });
      }
    }
  }
  
  // Test 5: Check for Next.js router usage
  if (content.includes('useRouter') && !content.includes("from 'next/navigation'")) {
    issues.push({
      type: 'error',
      message: 'useRouter used but not imported from next/navigation',
    });
  }
  
  // Test 6: Check for TypeScript types
  if (filePath.endsWith('.tsx')) {
    const hasTypes = /interface\s+\w+|type\s+\w+\s*=|:\s*\w+/.test(content);
    if (!hasTypes && content.length > 500) {
      issues.push({
        type: 'warning',
        message: 'Large component file but no TypeScript types found',
      });
    }
  }
  
  return {
    file: filePath,
    issues,
    passed: issues.filter(i => i.type === 'error').length === 0,
  };
}

// Test API routes
function testAPIRoute(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const issues = [];
  
  // Check for proper exports
  const hasGET = /export\s+(async\s+)?function\s+GET/.test(content);
  const hasPOST = /export\s+(async\s+)?function\s+POST/.test(content);
  const hasPUT = /export\s+(async\s+)?function\s+PUT/.test(content);
  const hasDELETE = /export\s+(async\s+)?function\s+DELETE/.test(content);
  
  if (!hasGET && !hasPOST && !hasPUT && !hasDELETE) {
    issues.push({
      type: 'error',
      message: 'API route has no HTTP method exports',
    });
  }
  
  // Check for NextRequest/NextResponse imports
  if (!content.includes('NextRequest') && !content.includes('NextResponse')) {
    issues.push({
      type: 'warning',
      message: 'API route may be missing NextRequest/NextResponse imports',
    });
  }
  
  return {
    file: filePath,
    issues,
    passed: issues.filter(i => i.type === 'error').length === 0,
  };
}

console.log('🧪 Testing all pages and API routes...\n');

// Test all pages
const pages = getAllPages();
console.log(`Found ${pages.length} page files\n`);

pages.forEach(pagePath => {
  const result = testPage(pagePath);
  tests.pages.push(result);
  
  if (result.passed) {
    tests.passed++;
  } else {
    tests.failed++;
    result.issues.forEach(issue => {
      if (issue.type === 'error') {
        tests.errors.push({ file: pagePath, ...issue });
      } else {
        tests.warnings.push({ file: pagePath, ...issue });
      }
    });
  }
});

// Test API routes
const apiRoutes = [];
function getAllAPIRoutes(dir = 'app/api', fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllAPIRoutes(filePath, fileList);
    } else if (file === 'route.ts' || file === 'route.js') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const routes = getAllAPIRoutes();
console.log(`Found ${routes.length} API route files\n`);

routes.forEach(routePath => {
  const result = testAPIRoute(routePath);
  apiRoutes.push(result);
  
  if (result.passed) {
    tests.passed++;
  } else {
    tests.failed++;
    result.issues.forEach(issue => {
      if (issue.type === 'error') {
        tests.errors.push({ file: routePath, ...issue });
      } else {
        tests.warnings.push({ file: routePath, ...issue });
      }
    });
  }
});

// Print results
console.log('📊 TEST RESULTS\n');
console.log(`✅ Passed: ${tests.passed}`);
console.log(`❌ Failed: ${tests.failed}`);
console.log(`⚠️  Warnings: ${tests.warnings.length}\n`);

if (tests.errors.length > 0) {
  console.log('❌ ERRORS:\n');
  tests.errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error.file}`);
    console.log(`   ${error.message}\n`);
  });
}

if (tests.warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  tests.warnings.slice(0, 10).forEach((warning, index) => {
    console.log(`${index + 1}. ${warning.file}`);
    console.log(`   ${warning.message}\n`);
  });
  if (tests.warnings.length > 10) {
    console.log(`... and ${tests.warnings.length - 10} more warnings\n`);
  }
}

// Save report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalPages: pages.length,
    totalAPIRoutes: routes.length,
    passed: tests.passed,
    failed: tests.failed,
    warnings: tests.warnings.length,
  },
  errors: tests.errors,
  warnings: tests.warnings,
};

fs.writeFileSync(
  'PAGE_TEST_REPORT.json',
  JSON.stringify(report, null, 2)
);

console.log('📄 Full report saved to PAGE_TEST_REPORT.json');

if (tests.errors.length === 0) {
  console.log('\n✅ All critical tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the errors above.');
  process.exit(1);
}

