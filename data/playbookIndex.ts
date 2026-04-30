/**
 * Playbook Master Index
 * ======================
 * Central index combining all feature playbooks with search and filtering
 */

import { FeaturePlaybook } from '@/types/featurePlaybook';
import { iotManagementPlaybook } from './featurePlaybooks';
import { dashboardManagementPlaybook, qhseDashboardPlaybook, playbookTooltips } from './allPlaybooks';
import { tradeCompliancePlaybook, wmsPlaybook, additionalTooltips } from './morePlaybooks';
import { tmsPlaybook, edgeAIPlaybook } from './logisticsPlaybooks';
import imsPlaybook from './imsPlaybook';

// =============================================================================
// MASTER PLAYBOOK COLLECTION
// =============================================================================

export const masterPlaybooks: FeaturePlaybook[] = [
  iotManagementPlaybook,
  dashboardManagementPlaybook,
  qhseDashboardPlaybook,
  tradeCompliancePlaybook,
  wmsPlaybook,
  tmsPlaybook,
  edgeAIPlaybook,
  imsPlaybook,
];

// =============================================================================
// MASTER TOOLTIP REGISTRY
// =============================================================================

export const masterTooltips = {
  ...playbookTooltips,
  ...additionalTooltips,
  // Common tooltips used across all playbooks
  common: {
    'critical-priority': {
      summary: 'Highest priority - requires immediate attention',
      details: 'Critical priority features are foundational to platform operations and must be implemented first.',
      keyPoints: ['Blocking for other features', 'Core business capability', 'Regulatory requirement']
    },
    'high-priority': {
      summary: 'High priority - implement in current phase',
      details: 'High priority features provide significant business value and should be implemented promptly.',
      keyPoints: ['Significant business impact', 'Customer demand', 'Competitive advantage']
    },
    'iso-27001': {
      summary: 'Information Security Management Standard',
      details: 'ISO 27001 is the international standard for information security management systems (ISMS).',
      keyPoints: ['Risk-based security', '114 controls', 'Continuous improvement', 'Third-party certification']
    },
    'gdpr': {
      summary: 'EU General Data Protection Regulation',
      details: 'GDPR is the EU regulation governing the protection of personal data and privacy.',
      keyPoints: ['Data subject rights', 'Lawful processing', 'Data minimization', 'Privacy by design']
    },
    '4ir': {
      summary: 'Fourth Industrial Revolution',
      details: 'Industry 4.0 encompasses IoT, AI, cloud computing, and cyber-physical systems.',
      keyPoints: ['IoT connectivity', 'AI/ML integration', 'Big data analytics', 'Automation']
    },
    '5ir': {
      summary: 'Fifth Industrial Revolution',
      details: 'Industry 5.0 focuses on human-machine collaboration, sustainability, and resilience.',
      keyPoints: ['Human-centric AI', 'Sustainability', 'Personalization', 'Resilience']
    },
    'soc2': {
      summary: 'Service Organization Control 2',
      details: 'SOC 2 is an auditing framework for service organizations based on trust principles.',
      keyPoints: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy']
    },
    'wcag': {
      summary: 'Web Content Accessibility Guidelines',
      details: 'WCAG provides guidelines for making web content accessible to people with disabilities.',
      keyPoints: ['Perceivable', 'Operable', 'Understandable', 'Robust']
    }
  }
};

// =============================================================================
// PLAYBOOK CATEGORIES
// =============================================================================

export const playbookCategories = [
  { id: 'iot', name: 'IoT & Edge Computing', icon: '📡', count: 2 },
  { id: 'bi', name: 'Business Intelligence', icon: '📊', count: 1 },
  { id: 'qhse', name: 'Quality & Safety', icon: '🛡️', count: 1 },
  { id: 'compliance', name: 'Compliance & Regulatory', icon: '⚖️', count: 1 },
  { id: 'operations', name: 'Operations', icon: '🏭', count: 2 },
  { id: 'ai', name: 'AI & Machine Learning', icon: '🤖', count: 1 },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getAllPlaybooks(): FeaturePlaybook[] {
  return masterPlaybooks;
}

export function getPlaybookById(id: string): FeaturePlaybook | undefined {
  return masterPlaybooks.find(p => p.id === id);
}

export function getPlaybooksByCategory(category: string): FeaturePlaybook[] {
  return masterPlaybooks.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
}

export function getPlaybooksByPriority(priority: string): FeaturePlaybook[] {
  return masterPlaybooks.filter(p => p.priority === priority);
}

export function getPlaybooksByStatus(status: string): FeaturePlaybook[] {
  return masterPlaybooks.filter(p => p.status === status);
}

export function getPlaybooksByPhase(phase: number): FeaturePlaybook[] {
  return masterPlaybooks.filter(p => p.phase === phase);
}

export function getPlaybooksByModule(module: string): FeaturePlaybook[] {
  return masterPlaybooks.filter(p => p.modules.includes(module));
}

export function searchPlaybooks(query: string): FeaturePlaybook[] {
  const lowerQuery = query.toLowerCase();
  return masterPlaybooks.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
    p.category.toLowerCase().includes(lowerQuery)
  );
}

export function getTooltip(playbookId: string, itemId: string): { summary: string; details: string; keyPoints: string[] } | undefined {
  const playbookTooltips = masterTooltips[playbookId as keyof typeof masterTooltips];
  if (playbookTooltips && typeof playbookTooltips === 'object') {
    return (playbookTooltips as Record<string, { summary: string; details: string; keyPoints: string[] }>)[itemId];
  }
  return masterTooltips.common[itemId as keyof typeof masterTooltips.common];
}

export function getPlaybookStats() {
  const stats = {
    total: masterPlaybooks.length,
    byPriority: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    byPhase: {} as Record<number, number>,
    byCategory: {} as Record<string, number>,
    totalCapabilities: 0,
    totalCompliance: 0,
    averageComplianceScore: 0,
  };

  masterPlaybooks.forEach(p => {
    stats.byPriority[p.priority] = (stats.byPriority[p.priority] || 0) + 1;
    stats.byStatus[p.status] = (stats.byStatus[p.status] || 0) + 1;
    stats.byPhase[p.phase] = (stats.byPhase[p.phase] || 0) + 1;
    stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
    stats.totalCapabilities += p.capabilities.length;
    stats.totalCompliance += p.compliance.standards.length;
    stats.averageComplianceScore += p.compliance.complianceScoreImpact;
  });

  stats.averageComplianceScore = Math.round(stats.averageComplianceScore / masterPlaybooks.length);

  return stats;
}

// =============================================================================
// PLAYBOOK SECTIONS FOR UI NAVIGATION
// =============================================================================

export const playbookSections = [
  { id: 'overview', name: 'Overview', icon: '📋', description: 'Core capabilities and features' },
  { id: 'compliance', name: 'Compliance & Governance', icon: '✅', description: 'Standards, certifications, and audit requirements' },
  { id: 'regulatory', name: 'Regulatory & Legal', icon: '⚖️', description: 'Laws, regulations, and jurisdictional coverage' },
  { id: 'industry', name: 'Industry Standards', icon: '🏭', description: 'Technical standards and best practices' },
  { id: 'strategic', name: 'Vision & Strategy', icon: '🎯', description: '4IR/5IR alignment and value propositions' },
  { id: 'market', name: 'Market & Trends', icon: '📈', description: 'Market opportunity and competitive landscape' },
  { id: 'technical', name: 'Technical Architecture', icon: '🔧', description: 'Patterns, stack, and requirements' },
  { id: 'sales', name: 'Sales & Business', icon: '💼', description: 'Personas, use cases, and pricing' },
  { id: 'implementation', name: 'Implementation', icon: '🚀', description: 'Phases, prerequisites, and best practices' },
  { id: 'sustainability', name: 'Sustainability & ESG', icon: '🌱', description: 'Environmental and social impact' },
  { id: 'documentation', name: 'Documentation', icon: '📚', description: 'Guides, training, and support' },
];

// =============================================================================
// LAYER DEPTH SUMMARY
// =============================================================================

export const layerDepthSummary = {
  totalLayers: 11,
  layers: [
    { name: 'Compliance & Governance', items: ['Standards', 'Frameworks', 'Audits', 'Certifications'] },
    { name: 'Regulatory & Legal', items: ['Bodies', 'Laws', 'Regulations', 'Trade Compliance'] },
    { name: 'Industry Standards', items: ['Technical Standards', 'Authorities', 'Best Practices', 'Verticals'] },
    { name: 'Vision & Strategy', items: ['4IR/5IR Alignment', 'Platform Alignment', 'Value Props', 'Differentiation'] },
    { name: 'Market & Trends', items: ['Trends', 'Technology', 'Competition', 'Opportunity'] },
    { name: 'Technical Architecture', items: ['Patterns', 'Stack', 'Security', 'Performance'] },
    { name: 'Sales & Business', items: ['Personas', 'Use Cases', 'Pricing', 'Objections'] },
    { name: 'Implementation', items: ['Phases', 'Prerequisites', 'Best Practices', 'Pitfalls'] },
    { name: 'Sustainability & ESG', items: ['Environmental', 'Social', 'Governance', 'SDGs'] },
    { name: 'Documentation', items: ['Guides', 'Training', 'Support', 'Knowledge Base'] },
    { name: 'Extended Layers', items: ['Privacy', 'AI Ethics', 'Risk Matrix', 'Accessibility', 'Localization'] },
  ]
};

