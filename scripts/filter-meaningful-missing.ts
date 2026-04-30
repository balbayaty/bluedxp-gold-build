import * as fs from 'fs';
import * as path from 'path';

interface ComparisonResult {
  concept: {
    type: string;
    name: string;
    description: string;
    conversationTitle: string;
    keywords: string[];
  };
  status: string;
  evidence: string[];
  confidence: number;
  reasoning: string;
}

// Filter out noise and focus on real missing features
function isMeaningfulMissing(result: ComparisonResult): boolean {
  const name = result.concept.name.toLowerCase().trim();
  
  // Skip if name is too short or generic
  if (name.length < 5) return false;
  
  // Skip generic words
  const genericWords = ['the', 'a', 'an', 'your', 'this', 'that', 'with', 'from', 'into', 'onto'];
  if (genericWords.includes(name)) return false;
  
  // Skip if it's just a fragment
  if (name.startsWith('/') || name.endsWith('/')) return false;
  if (name.includes('|') && name.length < 20) return false;
  if (name.includes('**') && name.length < 15) return false;
  
  // Must be a feature, module, or integration type
  if (!['feature', 'module', 'integration'].includes(result.concept.type)) {
    // Only include if it's clearly a concept or specification
    if (result.concept.type === 'concept' && name.length > 10) return true;
    if (result.concept.type === 'specification' && name.length > 10) return true;
    return false;
  }
  
  // Check if description is meaningful
  const desc = result.concept.description.toLowerCase();
  if (desc.length < 30) return false;
  
  // Must have some context
  if (!result.concept.conversationTitle || result.concept.conversationTitle === 'Untitled') {
    return false;
  }
  
  return true;
}

function categorizeMissing(result: ComparisonResult): string {
  const name = result.concept.name.toLowerCase();
  const desc = result.concept.description.toLowerCase();
  
  // Feature Registry
  if (name.includes('feature registry') || name.includes('feature-registry') || desc.includes('feature registry')) {
    return 'Feature Registry';
  }
  
  // Product Genome
  if (name.includes('product genome') || desc.includes('product genome')) {
    return 'Product Genome';
  }
  
  // Repo Reality Map
  if (name.includes('repo reality') || name.includes('reality map') || desc.includes('repo reality map')) {
    return 'Repo Reality Map';
  }
  
  // Duplication Scanner
  if (name.includes('duplication') && (name.includes('scanner') || name.includes('detection'))) {
    return 'Duplication Scanner';
  }
  
  // Export House / SEDA
  if (name.includes('export house') || name.includes('seda') || name.includes('saudi export')) {
    return 'Export House License';
  }
  
  // DMARC
  if (name.includes('dmarc') || desc.includes('dmarc')) {
    return 'DMARC Monitoring';
  }
  
  // OPC UA / Machine Monitoring
  if (name.includes('opc') || name.includes('machine monitoring') || name.includes('injection molding')) {
    return 'OPC UA Machine Monitoring';
  }
  
  // ICT Hardware
  if (name.includes('ict hardware') || name.includes('ict ecosystem')) {
    return 'ICT Hardware Ecosystem';
  }
  
  // Local Content
  if (name.includes('local content') || name.includes('made-in-saudi') || name.includes('lcgpa')) {
    return 'Local Content Engine';
  }
  
  // RAG Domain KBs
  if (name.includes('kb_') || (name.includes('knowledge base') && (name.includes('domain') || name.includes('kb_')))) {
    return 'RAG Domain Knowledge Bases';
  }
  
  // Multi-LLM Provider
  if ((name.includes('multi-llm') || name.includes('llm provider')) && name.includes('interface')) {
    return 'Multi-LLM Provider Interface';
  }
  
  // Truth Engine / Digital Doppelgänger
  if (name.includes('truth engine') || name.includes('digital doppelgänger') || name.includes('adversarial')) {
    return 'Truth Engine (Complete)';
  }
  
  // Notary Service
  if (name.includes('notary') || desc.includes('notary service')) {
    return 'Notary Service';
  }
  
  // Boardroom Dashboard
  if (name.includes('boardroom') || (name.includes('readiness') && name.includes('dashboard'))) {
    return 'Boardroom Readiness Dashboard';
  }
  
  return 'Other';
}

async function filterMeaningfulMissing() {
  console.log('Filtering meaningful missing concepts...\n');
  
  const missingPath = path.join(process.cwd(), 'gap-analysis-results', 'codebase-missing.json');
  const allMissing: ComparisonResult[] = JSON.parse(fs.readFileSync(missingPath, 'utf-8'));
  
  console.log(`Total missing: ${allMissing.length}`);
  
  // Filter meaningful
  const meaningful = allMissing.filter(isMeaningfulMissing);
  console.log(`Meaningful missing: ${meaningful.length}\n`);
  
  // Categorize
  const byCategory: Record<string, ComparisonResult[]> = {};
  meaningful.forEach(item => {
    const category = categorizeMissing(item);
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(item);
  });
  
  // Generate report
  const report: string[] = [];
  
  report.push('# ACTUAL Missing Features from BlueDXP Codebase');
  report.push(`\n**Generated:** ${new Date().toISOString()}`);
  report.push(`**Method:** Automated codebase comparison (indexed search)`);
  report.push(`**Total Missing:** ${meaningful.length} meaningful concepts\n`);
  
  report.push('## 📊 Summary by Category\n');
  
  Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([category, items]) => {
      report.push(`- **${category}:** ${items.length} missing`);
    });
  
  report.push('\n---\n');
  
  // Detailed by category
  Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([category, items]) => {
      report.push(`## ${category} (${items.length} missing)\n`);
      
      items.forEach((item, idx) => {
        report.push(`### ${idx + 1}. ${item.concept.name}`);
        report.push(`**Type:** ${item.concept.type}`);
        report.push(`**Source:** ${item.concept.conversationTitle}`);
        report.push(`**Description:** ${item.concept.description.substring(0, 300)}...`);
        if (item.concept.keywords.length > 0) {
          report.push(`**Keywords:** ${item.concept.keywords.join(', ')}`);
        }
        report.push('');
      });
    });
  
  // Save
  const outputDir = path.join(process.cwd(), 'gap-analysis-results');
  fs.writeFileSync(
    path.join(outputDir, 'MEANINGFUL_MISSING_FEATURES.md'),
    report.join('\n')
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'meaningful-missing.json'),
    JSON.stringify(meaningful, null, 2)
  );
  
  console.log(`✅ Filtered report generated!`);
  console.log(`   Meaningful missing: ${meaningful.length}`);
  console.log(`   Categories: ${Object.keys(byCategory).length}`);
  console.log(`\n📁 Saved to:`);
  console.log(`   - gap-analysis-results/MEANINGFUL_MISSING_FEATURES.md`);
  console.log(`   - gap-analysis-results/meaningful-missing.json`);
}

filterMeaningfulMissing().catch(console.error);













