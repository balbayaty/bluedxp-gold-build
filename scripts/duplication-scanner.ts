/**
 * Duplication Scanner
 * Finds near-duplicate logic across modules/services
 * Prevents code duplication
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface DuplicateFinding {
  file1: string;
  file2: string;
  similarity: number;
  type: 'exact' | 'near' | 'structural';
  description: string;
  recommendation: string;
}

interface CodeBlock {
  file: string;
  hash: string;
  content: string;
  normalized: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Scan codebase for duplicates
 */
export async function scanForDuplicates(
  minSimilarity: number = 0.8,
  minLines: number = 10
): Promise<DuplicateFinding[]> {
  console.log('Scanning codebase for duplicates...\n');

  const codeFiles = await glob([
    'lib/**/*.ts',
    'lib/**/*.tsx',
    'app/**/*.ts',
    'app/**/*.tsx',
  ], {
    ignore: ['node_modules/**', '.next/**', 'dist/**', '**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
  });

  console.log(`Scanning ${codeFiles.length} files...`);

  const blocks: CodeBlock[] = [];
  const duplicates: DuplicateFinding[] = [];

  // Extract code blocks from files
  for (const file of codeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileBlocks = extractCodeBlocks(file, content, minLines);
      blocks.push(...fileBlocks);
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  console.log(`Extracted ${blocks.length} code blocks\n`);

  // Compare blocks
  console.log('Comparing blocks...');
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const block1 = blocks[i];
      const block2 = blocks[j];

      // Skip if same file
      if (block1.file === block2.file) continue;

      const similarity = calculateSimilarity(block1.normalized, block2.normalized);

      if (similarity >= minSimilarity) {
        const type = similarity === 1.0 ? 'exact' : similarity >= 0.9 ? 'near' : 'structural';
        
        duplicates.push({
          file1: block1.file,
          file2: block2.file,
          similarity,
          type,
          description: `Similar code blocks found (${similarity * 100}% similar)`,
          recommendation: `Consider consolidating into a shared service or utility function`,
        });
      }
    }

    if ((i + 1) % 100 === 0) {
      console.log(`  Compared ${i + 1}/${blocks.length} blocks...`);
    }
  }

  console.log(`\nFound ${duplicates.length} potential duplicates\n`);

  return duplicates;
}

/**
 * Extract code blocks from file
 */
function extractCodeBlocks(file: string, content: string, minLines: number): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');

  // Extract functions
  let inFunction = false;
  let functionStart = 0;
  let functionLines: string[] = [];
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Function start
    if (trimmed.match(/^(export\s+)?(async\s+)?function\s+\w+/) || 
        trimmed.match(/^(export\s+)?const\s+\w+\s*[:=]\s*(async\s+)?\(/)) {
      if (inFunction && functionLines.length >= minLines) {
        blocks.push(createBlock(file, functionLines, functionStart, i - 1));
      }
      inFunction = true;
      functionStart = i;
      functionLines = [line];
      braceCount = countBraces(line);
    } else if (inFunction) {
      functionLines.push(line);
      braceCount += countBraces(line);

      if (braceCount === 0 && trimmed) {
        // Function ended
        if (functionLines.length >= minLines) {
          blocks.push(createBlock(file, functionLines, functionStart, i));
        }
        inFunction = false;
        functionLines = [];
      }
    }
  }

  // Extract class methods
  let inClass = false;
  let inMethod = false;
  let methodStart = 0;
  let methodLines: string[] = [];
  let methodBraceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.match(/^(export\s+)?class\s+\w+/)) {
      inClass = true;
    } else if (inClass && trimmed.match(/^\w+\s*\(/)) {
      if (inMethod && methodLines.length >= minLines) {
        blocks.push(createBlock(file, methodLines, methodStart, i - 1));
      }
      inMethod = true;
      methodStart = i;
      methodLines = [line];
      methodBraceCount = countBraces(line);
    } else if (inMethod) {
      methodLines.push(line);
      methodBraceCount += countBraces(line);

      if (methodBraceCount === 0 && trimmed && !trimmed.match(/^\w+\s*\(/)) {
        if (methodLines.length >= minLines) {
          blocks.push(createBlock(file, methodLines, methodStart, i));
        }
        inMethod = false;
        methodLines = [];
      }
    }
  }

  return blocks;
}

/**
 * Create code block
 */
function createBlock(file: string, lines: string[], startLine: number, endLine: number): CodeBlock {
  const content = lines.join('\n');
  const normalized = normalizeCode(content);
  const hash = crypto.createHash('md5').update(normalized).digest('hex');

  return {
    file,
    hash,
    content,
    normalized,
    lineStart: startLine + 1,
    lineEnd: endLine + 1,
  };
}

/**
 * Normalize code for comparison
 */
function normalizeCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/['"]/g, '"') // Normalize quotes
    .replace(/\b\w+\b/g, (match) => {
      // Normalize variable names (optional - can be more aggressive)
      const common = ['id', 'name', 'data', 'result', 'error', 'value', 'item', 'list', 'array'];
      return common.includes(match.toLowerCase()) ? match.toLowerCase() : match;
    })
    .trim();
}

/**
 * Count braces to track function boundaries
 */
function countBraces(line: string): number {
  let count = 0;
  let inString = false;
  let stringChar = '';

  for (const char of line) {
    if ((char === '"' || char === "'" || char === '`') && !inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar && inString) {
      inString = false;
      stringChar = '';
    } else if (!inString) {
      if (char === '{') count++;
      if (char === '}') count--;
    }
  }

  return count;
}

/**
 * Calculate similarity between two code blocks
 */
function calculateSimilarity(code1: string, code2: string): number {
  // Exact match
  if (code1 === code2) return 1.0;

  // Use Levenshtein distance for similarity
  const distance = levenshteinDistance(code1, code2);
  const maxLength = Math.max(code1.length, code2.length);
  
  if (maxLength === 0) return 1.0;

  return 1 - (distance / maxLength);
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Generate duplication report
 */
export async function generateDuplicationReport(): Promise<string> {
  const duplicates = await scanForDuplicates(0.8, 10);

  const report: string[] = [];
  
  report.push('# Duplication Report');
  report.push(`\n**Generated:** ${new Date().toISOString()}`);
  report.push(`**Total Duplicates Found:** ${duplicates.length}\n`);

  // Group by type
  const byType: Record<string, DuplicateFinding[]> = {};
  duplicates.forEach(dup => {
    if (!byType[dup.type]) {
      byType[dup.type] = [];
    }
    byType[dup.type].push(dup);
  });

  Object.entries(byType)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, items]) => {
      report.push(`## ${type.toUpperCase()} Duplicates (${items.length})\n`);
      
      items
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 50)
        .forEach((item, idx) => {
          report.push(`### ${idx + 1}. ${item.description}`);
          report.push(`**Similarity:** ${(item.similarity * 100).toFixed(1)}%`);
          report.push(`**File 1:** ${item.file1}`);
          report.push(`**File 2:** ${item.file2}`);
          report.push(`**Recommendation:** ${item.recommendation}`);
          report.push('');
        });
    });

  return report.join('\n');
}

// CLI execution
if (require.main === module) {
  generateDuplicationReport()
    .then(report => {
      const outputPath = path.join(process.cwd(), 'docs', 'AUDIT', 'DUPLICATION_REPORT.md');
      const outputDir = path.dirname(outputPath);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, report);
      console.log(`\n✅ Duplication report saved to ${outputPath}`);
    })
    .catch(console.error);
}













