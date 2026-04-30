/**
 * Comprehensive Code Analysis Script
 * Analyzes entire codebase for unused, hidden, or inaccessible code
 */

const fs = require('fs');
const path = require('path');

const results = {
  unusedExports: [],
  unusedFiles: [],
  commentedCode: [],
  missingRoutes: [],
  unusedServices: [],
  duplicateCode: [],
  missingImports: []
};

// Directories to analyze
const directories = {
  app: './app',
  components: './components',
  lib: './lib',
  utils: './utils',
  types: './types'
};

// Get all TypeScript files recursively
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Extract exports from file
function extractExports(content) {
  const exports = [];
  
  // Match export statements
  const exportPatterns = [
    /^export\s+(default\s+)?(const|function|class|interface|type|enum)\s+(\w+)/gm,
    /^export\s+{([^}]+)}/gm,
    /^export\s+\*\s+from/gm
  ];
  
  exportPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[3]) {
        exports.push(match[3]);
      } else if (match[1]) {
        const namedExports = match[1].split(',').map(e => e.trim().split(' as ')[0]);
        exports.push(...namedExports);
      }
    }
  });
  
  return exports;
}

// Check if export is used
function isExportUsed(exportName, allFiles) {
  const usagePatterns = [
    new RegExp(`import.*${exportName}.*from`, 'g'),
    new RegExp(`from.*['"]@/.*${exportName}`, 'g'),
    new RegExp(`<${exportName}`, 'g'),
    new RegExp(`\\b${exportName}\\b`, 'g')
  ];
  
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      // Skip the file itself
      if (content.includes(exportName)) {
        // Check if it's actually used (not just defined)
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.includes(exportName) && !line.trim().startsWith('export')) {
            return true;
          }
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }
  
  return false;
}

// Find commented code blocks
function findCommentedCode(content, filePath) {
  const commented = [];
  
  // Find large commented blocks (more than 5 lines)
  const blockCommentPattern = /\/\*[\s\S]{100,}?\*\//g;
  const matches = content.matchAll(blockCommentPattern);
  
  for (const match of matches) {
    const lines = match[0].split('\n').length;
    if (lines > 5) {
      commented.push({
        file: filePath,
        lines: lines,
        preview: match[0].substring(0, 200)
      });
    }
  }
  
  return commented;
}

// Main analysis
function analyzeCodebase() {
  console.log('🔍 Starting comprehensive code analysis...\n');
  
  const allFiles = [];
  Object.values(directories).forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir);
      allFiles.push(...files);
    }
  });
  
  console.log(`📁 Found ${allFiles.length} TypeScript files\n`);
  
  // Analyze each file
  allFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Find commented code
      const commented = findCommentedCode(content, file);
      results.commentedCode.push(...commented);
      
      // Extract exports
      const exports = extractExports(content);
      
      // Check if exports are used
      exports.forEach(exp => {
        if (!isExportUsed(exp, allFiles.filter(f => f !== file))) {
          results.unusedExports.push({
            file,
            export: exp
          });
        }
      });
      
    } catch (e) {
      console.warn(`⚠️  Error analyzing ${file}:`, e.message);
    }
  });
  
  // Generate report
  generateReport();
}

function generateReport() {
  const report = `# 🔍 COMPREHENSIVE CODE ANALYSIS REPORT
## Deep Analysis of Entire Codebase

**Generated:** ${new Date().toISOString()}
**Platform:** BlueDXP Platform (Hazalyze Module)

---

## 📊 SUMMARY

- **Unused Exports:** ${results.unusedExports.length}
- **Commented Code Blocks:** ${results.commentedCode.length}
- **Files Analyzed:** ${getAllFiles('./app').length + getAllFiles('./components').length + getAllFiles('./lib').length}

---

## 🔴 UNUSED EXPORTS

These exports are defined but never imported or used:

${results.unusedExports.slice(0, 50).map(item => `- **${item.export}** in \`${item.file}\``).join('\n')}

${results.unusedExports.length > 50 ? `\n... and ${results.unusedExports.length - 50} more\n` : ''}

---

## 💬 COMMENTED CODE BLOCKS

Large commented code blocks that might need attention:

${results.commentedCode.slice(0, 20).map(item => `- **${item.file}** (${item.lines} lines)\n  \`\`\`\n  ${item.preview}...\n  \`\`\``).join('\n\n')}

${results.commentedCode.length > 20 ? `\n... and ${results.commentedCode.length - 20} more\n` : ''}

---

## 📝 RECOMMENDATIONS

1. **Review Unused Exports:** Consider removing or documenting why they exist
2. **Review Commented Code:** Decide if it should be removed or uncommented
3. **Check for Dead Code:** Files that are never imported
4. **Verify Route Registration:** Ensure all pages are in navigation

---

**Note:** This is an automated analysis. Manual review recommended.
`;

  fs.writeFileSync('./COMPREHENSIVE_CODE_ANALYSIS_REPORT.md', report);
  console.log('\n✅ Analysis complete! Report saved to COMPREHENSIVE_CODE_ANALYSIS_REPORT.md');
  console.log(`\n📊 Results:`);
  console.log(`   - Unused Exports: ${results.unusedExports.length}`);
  console.log(`   - Commented Code Blocks: ${results.commentedCode.length}`);
}

// Run analysis
analyzeCodebase();





