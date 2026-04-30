/**
 * Product Genome Generator
 * Creates complete product capability map from codebase
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { getAllFeatures, getDomainCompleteness } from '@/lib/feature-registry';
import { getEnabledModules } from '@/lib/modules/registry';

interface Capability {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: 'implemented' | 'partial' | 'stub' | 'missing';
  canonicalServicePath?: string;
  apiEndpoints: string[];
  uiSurfaces: string[];
  dataEntities: string[];
  events: string[];
  complianceTags: string[];
  tests: string[];
}

interface Domain {
  id: string;
  name: string;
  description: string;
  capabilities: Capability[];
  completeness: number;
}

interface ProductGenome {
  version: string;
  generatedAt: string;
  vision: string;
  mission: string;
  principles: string[];
  domains: Domain[];
  summary: {
    totalDomains: number;
    totalCapabilities: number;
    implemented: number;
    partial: number;
    missing: number;
  };
}

/**
 * Generate Product Genome
 */
export async function generateProductGenome(): Promise<ProductGenome> {
  console.log('Generating Product Genome...\n');

  // Load features from registry
  const features = getAllFeatures();
  const completeness = getDomainCompleteness();
  const modules = getEnabledModules();

  // Load additional concepts from gap analysis (optional)
  let additionalConcepts: any[] = [];
  try {
    const conceptsPath = path.join(process.cwd(), 'gap-analysis-results', 'meaningful-missing.json');
    if (fs.existsSync(conceptsPath)) {
      additionalConcepts = JSON.parse(fs.readFileSync(conceptsPath, 'utf-8'));
    }
  } catch (error) {
    // Optional: gap analysis concepts not required
  }

  const genome: ProductGenome = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    vision: 'BlueDXP - Enterprise Intelligence Operating System',
    mission: 'Provide intelligent, integrated, and compliant enterprise operations platform',
    principles: [
      'Integration-first mindset',
      'Deep layer architecture',
      'Security mandatory',
      'Multi-tenant isolation',
      'RBAC with 11 roles',
      '4IR & 5IR aligned',
      'Evidence-grade auditability',
      'No duplication',
    ],
    domains: [],
    summary: {
      totalDomains: 0,
      totalCapabilities: 0,
      implemented: 0,
      partial: 0,
      missing: 0,
    },
  };

  // Build domains from modules
  const domainMap: Record<string, Domain> = {};

  modules.forEach(module => {
    const domainId = module.category || 'other';
    
    if (!domainMap[domainId]) {
      domainMap[domainId] = {
        id: domainId,
        name: module.name,
        description: module.description,
        capabilities: [],
        completeness: 0,
      };
    }

    // Add capabilities from module
    const moduleFeatures = features.filter(f => f.moduleId === module.id);
    
    moduleFeatures.forEach(feature => {
      domainMap[domainId].capabilities.push({
        id: feature.id,
        name: feature.name,
        description: feature.description,
        domain: feature.domain,
        status: feature.status,
        canonicalServicePath: feature.canonicalServicePath,
        apiEndpoints: feature.apis?.map(a => `${a.method} ${a.endpoint}`) || [],
        uiSurfaces: feature.uiSurfaces?.map(u => u.route) || [],
        dataEntities: feature.entities?.map(e => e.name) || [],
        events: feature.events?.map(e => e.name) || [],
        complianceTags: feature.complianceTags || [],
        tests: feature.tests?.map(t => t.filePath) || [],
      });
    });
  });

  // Add missing capabilities from gap analysis (if available)
  additionalConcepts.forEach(concept => {
    const domainId = mapConceptToDomain(concept.concept.name, concept.concept.description);
    
    if (!domainMap[domainId]) {
      domainMap[domainId] = {
        id: domainId,
        name: domainId,
        description: '',
        capabilities: [],
        completeness: 0,
      };
    }

    // Check if already exists
    const exists = domainMap[domainId].capabilities.some(c => 
      c.name.toLowerCase() === concept.concept.name.toLowerCase()
    );

    if (!exists) {
      domainMap[domainId].capabilities.push({
        id: `missing.${domainId}.${concept.concept.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: concept.concept.name,
        description: concept.concept.description,
        domain: domainId,
        status: 'missing',
        apiEndpoints: [],
        uiSurfaces: [],
        dataEntities: [],
        events: [],
        complianceTags: [],
        tests: [],
      });
    }
  });

  // Calculate completeness for each domain
  Object.values(domainMap).forEach(domain => {
    const total = domain.capabilities.length;
    const implemented = domain.capabilities.filter(c => c.status === 'implemented').length;
    domain.completeness = total > 0 ? (implemented / total) * 100 : 0;
  });

  genome.domains = Object.values(domainMap);

  // Calculate summary
  genome.summary = {
    totalDomains: genome.domains.length,
    totalCapabilities: genome.domains.reduce((sum, d) => sum + d.capabilities.length, 0),
    implemented: genome.domains.reduce((sum, d) => 
      sum + d.capabilities.filter(c => c.status === 'implemented').length, 0),
    partial: genome.domains.reduce((sum, d) => 
      sum + d.capabilities.filter(c => c.status === 'partial').length, 0),
    missing: genome.domains.reduce((sum, d) => 
      sum + d.capabilities.filter(c => c.status === 'missing').length, 0),
  };

  return genome;
}

function mapConceptToDomain(name: string, description: string): string {
  const lower = (name + ' ' + description).toLowerCase();
  
  if (lower.includes('warehouse') || lower.includes('wms')) return 'wms';
  if (lower.includes('transport') || lower.includes('tms') || lower.includes('shipment')) return 'tms';
  if (lower.includes('qhse') || lower.includes('safety') || lower.includes('health')) return 'qhse';
  if (lower.includes('procurement') || lower.includes('purchase')) return 'procurement';
  if (lower.includes('trade') || lower.includes('compliance') || lower.includes('customs')) return 'trade-compliance';
  if (lower.includes('truth') || lower.includes('evidence')) return 'truth-engine';
  if (lower.includes('hazalyze') || lower.includes('chemical') || lower.includes('msds')) return 'hazalyze';
  if (lower.includes('maas') || lower.includes('manufacturing')) return 'maas';
  if (lower.includes('finance') || lower.includes('invoice') || lower.includes('payment')) return 'finance';
  if (lower.includes('crm') || lower.includes('customer') || lower.includes('sales')) return 'crm';
  if (lower.includes('digital-signature') || lower.includes('signature')) return 'digital-signature';
  if (lower.includes('marketplace')) return 'marketplace';
  if (lower.includes('warehouse-network')) return 'warehouse-network';
  if (lower.includes('facility')) return 'facility-management';
  if (lower.includes('project')) return 'project-management';
  if (lower.includes('proposal') || lower.includes('rfq')) return 'proposals-rfq';
  if (lower.includes('hr') || lower.includes('human resource')) return 'hr';
  if (lower.includes('iot')) return 'iot';
  if (lower.includes('business-intelligence') || lower.includes('bi') || lower.includes('analytics')) return 'business-intelligence';
  if (lower.includes('communication')) return 'communication';
  
  return 'other';
}

function generateMarkdownReport(genome: ProductGenome): string {
  const report: string[] = [];

  report.push('# Product Genome');
  report.push(`\n**Generated:** ${genome.generatedAt}`);
  report.push(`**Version:** ${genome.version}\n`);

  report.push('## Vision & Mission\n');
  report.push(`**Vision:** ${genome.vision}`);
  report.push(`**Mission:** ${genome.mission}\n`);

  report.push('## Principles\n');
  genome.principles.forEach(principle => {
    report.push(`- ${principle}`);
  });

  report.push('\n## Summary\n');
  report.push(`- **Total Domains:** ${genome.summary.totalDomains}`);
  report.push(`- **Total Capabilities:** ${genome.summary.totalCapabilities}`);
  report.push(`- **Implemented:** ${genome.summary.implemented} (${((genome.summary.implemented / genome.summary.totalCapabilities) * 100).toFixed(1)}%)`);
  report.push(`- **Partial:** ${genome.summary.partial} (${((genome.summary.partial / genome.summary.totalCapabilities) * 100).toFixed(1)}%)`);
  report.push(`- **Missing:** ${genome.summary.missing} (${((genome.summary.missing / genome.summary.totalCapabilities) * 100).toFixed(1)}%)\n`);

  // Domains
  report.push('## Domains\n');
  
  genome.domains
    .sort((a, b) => b.capabilities.length - a.capabilities.length)
    .forEach(domain => {
      report.push(`### ${domain.name.toUpperCase()} (${domain.id})`);
      report.push(`**Completeness:** ${domain.completeness.toFixed(1)}%`);
      report.push(`**Capabilities:** ${domain.capabilities.length}\n`);

      // Group by status
      const byStatus: Record<string, Capability[]> = {};
      domain.capabilities.forEach(cap => {
        if (!byStatus[cap.status]) {
          byStatus[cap.status] = [];
        }
        byStatus[cap.status].push(cap);
      });

      Object.entries(byStatus)
        .sort((a, b) => {
          const order = { 'implemented': 0, 'partial': 1, 'stub': 2, 'missing': 3 };
          return (order[a[0] as keyof typeof order] || 99) - (order[b[0] as keyof typeof order] || 99);
        })
        .forEach(([status, caps]) => {
          report.push(`#### ${status.toUpperCase()} (${caps.length})`);
          caps.slice(0, 20).forEach(cap => {
            report.push(`- **${cap.name}**`);
            report.push(`  - ${cap.description.substring(0, 150)}...`);
            if (cap.apiEndpoints.length > 0) {
              report.push(`  - APIs: ${cap.apiEndpoints.slice(0, 3).join(', ')}`);
            }
          });
          if (caps.length > 20) {
            report.push(`  - ... and ${caps.length - 20} more\n`);
          }
          report.push('');
        });
    });

  return report.join('\n');
}

// CLI execution
if (require.main === module) {
  generateProductGenome()
    .then(genome => {
      const outputDir = path.join(process.cwd(), 'docs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save JSON
      const jsonPath = path.join(outputDir, 'PRODUCT_GENOME.json');
      fs.writeFileSync(jsonPath, JSON.stringify(genome, null, 2));

      // Save Markdown
      const mdReport = generateMarkdownReport(genome);
      const mdPath = path.join(outputDir, 'PRODUCT_GENOME.md');
      fs.writeFileSync(mdPath, mdReport);

      console.log(`\n✅ Product Genome generated!`);
      console.log(`   Domains: ${genome.summary.totalDomains}`);
      console.log(`   Capabilities: ${genome.summary.totalCapabilities}`);
      console.log(`   Implemented: ${genome.summary.implemented} (${((genome.summary.implemented / genome.summary.totalCapabilities) * 100).toFixed(1)}%)`);
      console.log(`   Missing: ${genome.summary.missing} (${((genome.summary.missing / genome.summary.totalCapabilities) * 100).toFixed(1)}%)`);
      console.log(`\n📁 Saved to:`);
      console.log(`   - ${jsonPath}`);
      console.log(`   - ${mdPath}`);
    })
    .catch(console.error);
}

// Functions are already exported above












