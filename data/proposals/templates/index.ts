/**
 * Comprehensive Proposal Templates Library
 * Ready-made templates for all service categories
 * Vision 2040 aligned with best practices
 */

import type { ProposalTemplate } from '@/types/proposals'

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  // ============================================================================
  // WAREHOUSING TEMPLATES
  // ============================================================================
  {
    id: 'tpl-warehousing-standard',
    name: 'Standard Warehousing Services',
    description: 'Comprehensive warehousing proposal covering storage, handling, and inventory management',
    type: 'QUOTE_PROPOSAL',
    category: 'WAREHOUSING',
    sections: [
      {
        id: 'cover',
        type: 'HEADER',
        title: 'Cover Page',
        defaultContent: 'Professional warehousing services proposal',
        order: 0,
        required: true,
      },
      {
        id: 'executive-summary',
        type: 'TEXT',
        title: 'Executive Summary',
        defaultContent: 'Our comprehensive warehousing solution provides secure, efficient, and scalable storage services tailored to your business needs.',
        order: 1,
        required: true,
      },
      {
        id: 'company-profile',
        type: 'TEXT',
        title: 'Company Profile',
        defaultContent: 'BlueDXP is a leading logistics platform with state-of-the-art facilities and proven expertise in warehousing operations.',
        order: 2,
        required: true,
      },
      {
        id: 'services',
        type: 'TEXT',
        title: 'Services Offered',
        defaultContent: '• Storage Services\n• Handling & Distribution\n• Inventory Management\n• Pick & Pack Services\n• Fulfillment Services',
        order: 3,
        required: true,
      },
      {
        id: 'facilities',
        type: 'TEXT',
        title: 'Facilities & Infrastructure',
        defaultContent: 'Our modern facilities feature:\n• Climate-controlled storage\n• Advanced security systems\n• Real-time inventory tracking\n• IoT-enabled monitoring',
        order: 4,
        required: false,
      },
      {
        id: 'pricing',
        type: 'PRICING',
        title: 'Pricing Structure',
        defaultContent: 'Competitive pricing based on storage volume and services required.',
        order: 5,
        required: true,
      },
      {
        id: 'sla',
        type: 'TEXT',
        title: 'Service Level Agreements',
        defaultContent: 'We guarantee:\n• 99.9% uptime\n• Same-day order processing\n• Real-time inventory visibility\n• 24/7 customer support',
        order: 6,
        required: true,
      },
      {
        id: 'terms',
        type: 'TERMS',
        title: 'Terms & Conditions',
        defaultContent: 'Standard terms and conditions apply.',
        order: 7,
        required: true,
      },
    ],
    defaultBranding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    isDefault: true,
    isPublic: true,
    isActive: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'tpl-warehousing-cold-chain',
    name: 'Cold Chain Warehousing',
    description: 'Specialized cold storage proposal for temperature-sensitive products',
    type: 'QUOTE_PROPOSAL',
    category: 'WAREHOUSING',
    sections: [
      {
        id: 'cover',
        type: 'HEADER',
        title: 'Cover Page',
        defaultContent: 'Cold Chain Warehousing Services',
        order: 0,
        required: true,
      },
      {
        id: 'executive-summary',
        type: 'TEXT',
        title: 'Executive Summary',
        defaultContent: 'Our state-of-the-art cold chain facilities ensure optimal temperature control for your temperature-sensitive products.',
        order: 1,
        required: true,
      },
      {
        id: 'temperature-zones',
        type: 'TEXT',
        title: 'Temperature Zones',
        defaultContent: '• Frozen: -20°C to -18°C\n• Chilled: 2°C to 8°C\n• Ambient: 15°C to 25°C',
        order: 2,
        required: true,
      },
      {
        id: 'monitoring',
        type: 'TEXT',
        title: 'IoT Monitoring & Alerts',
        defaultContent: 'Real-time temperature monitoring with automated alerts and compliance reporting.',
        order: 3,
        required: true,
      },
      {
        id: 'pricing',
        type: 'PRICING',
        title: 'Pricing Structure',
        defaultContent: 'Competitive rates for cold storage services.',
        order: 4,
        required: true,
      },
      {
        id: 'compliance',
        type: 'TEXT',
        title: 'Compliance & Certifications',
        defaultContent: '• HACCP Certified\n• ISO 22000\n• GDP Compliant\n• FDA Approved',
        order: 5,
        required: true,
      },
      {
        id: 'terms',
        type: 'TERMS',
        title: 'Terms & Conditions',
        defaultContent: 'Standard terms and conditions apply.',
        order: 6,
        required: true,
      },
    ],
    defaultBranding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    isDefault: false,
    isPublic: true,
    isActive: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  // ============================================================================
  // TRANSPORTATION TEMPLATES
  // ============================================================================
  {
    id: 'tpl-transportation-ftl',
    name: 'Full Truck Load (FTL) Services',
    description: 'Comprehensive FTL transportation proposal',
    type: 'QUOTE_PROPOSAL',
    category: 'TRANSPORTATION',
    sections: [
      {
        id: 'cover',
        type: 'HEADER',
        title: 'Cover Page',
        defaultContent: 'Full Truck Load Transportation Services',
        order: 0,
        required: true,
      },
      {
        id: 'executive-summary',
        type: 'TEXT',
        title: 'Executive Summary',
        defaultContent: 'Our FTL services provide dedicated truck capacity for your shipments with guaranteed space and priority handling.',
        order: 1,
        required: true,
      },
      {
        id: 'fleet',
        type: 'TEXT',
        title: 'Fleet & Equipment',
        defaultContent: '• Modern fleet of trucks\n• GPS tracking on all vehicles\n• Temperature-controlled options\n• Specialized equipment available',
        order: 2,
        required: true,
      },
      {
        id: 'routes',
        type: 'TEXT',
        title: 'Route Coverage',
        defaultContent: 'Comprehensive coverage across Saudi Arabia and GCC region.',
        order: 3,
        required: true,
      },
      {
        id: 'pricing',
        type: 'PRICING',
        title: 'Pricing Structure',
        defaultContent: 'Competitive FTL rates based on route and volume.',
        order: 4,
        required: true,
      },
      {
        id: 'sla',
        type: 'TEXT',
        title: 'Service Level Agreements',
        defaultContent: '• On-time delivery guarantee\n• Real-time tracking\n• 24/7 customer support\n• Insurance coverage',
        order: 5,
        required: true,
      },
      {
        id: 'terms',
        type: 'TERMS',
        title: 'Terms & Conditions',
        defaultContent: 'Standard terms and conditions apply.',
        order: 6,
        required: true,
      },
    ],
    defaultBranding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    isDefault: false,
    isPublic: true,
    isActive: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'tpl-transportation-last-mile',
    name: 'Last Mile Delivery Services',
    description: 'Efficient last-mile delivery solution',
    type: 'QUOTE_PROPOSAL',
    category: 'TRANSPORTATION',
    sections: [
      {
        id: 'cover',
        type: 'HEADER',
        title: 'Cover Page',
        defaultContent: 'Last Mile Delivery Services',
        order: 0,
        required: true,
      },
      {
        id: 'executive-summary',
        type: 'TEXT',
        title: 'Executive Summary',
        defaultContent: 'Our last-mile delivery service ensures fast, reliable delivery to your end customers.',
        order: 1,
        required: true,
      },
      {
        id: 'coverage',
        type: 'TEXT',
        title: 'Coverage Area',
        defaultContent: 'Comprehensive coverage in major cities and urban areas.',
        order: 2,
        required: true,
      },
      {
        id: 'technology',
        type: 'TEXT',
        title: 'Technology & Tracking',
        defaultContent: '• Real-time GPS tracking\n• ETA notifications\n• Proof of delivery\n• Customer communication',
        order: 3,
        required: true,
      },
      {
        id: 'pricing',
        type: 'PRICING',
        title: 'Pricing Structure',
        defaultContent: 'Competitive per-delivery rates.',
        order: 4,
        required: true,
      },
      {
        id: 'terms',
        type: 'TERMS',
        title: 'Terms & Conditions',
        defaultContent: 'Standard terms and conditions apply.',
        order: 5,
        required: true,
      },
    ],
    defaultBranding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    isDefault: false,
    isPublic: true,
    isActive: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  // ============================================================================
  // CUSTOMS CLEARANCE TEMPLATES
  // ============================================================================
  {
    id: 'tpl-customs-clearance',
    name: 'Customs Clearance Services',
    description: 'Comprehensive customs clearance proposal',
    type: 'QUOTE_PROPOSAL',
    category: 'CUSTOMS_CLEARANCE',
    sections: [
      {
        id: 'cover',
        type: 'HEADER',
        title: 'Cover Page',
        defaultContent: 'Customs Clearance Services',
        order: 0,
        required: true,
      },
      {
        id: 'executive-summary',
        type: 'TEXT',
        title: 'Executive Summary',
        defaultContent: 'Our experienced customs clearance team ensures fast, compliant processing of your imports and exports.',
        order: 1,
        required: true,
      },
      {
        id: 'services',
        type: 'TEXT',
        title: 'Services Offered',
        defaultContent: '• Import Clearance\n• Export Clearance\n• Transit Clearance\n• Duty Optimization\n• Compliance Review',
        order: 2,
        required: true,
      },
      {
        id: 'expertise',
        type: 'TEXT',
        title: 'Expertise & Experience',
        defaultContent: '• Licensed customs brokers\n• Deep knowledge of Saudi regulations\n• Strong relationships with customs authorities\n• Fast processing times',
        order: 3,
        required: true,
      },
      {
        id: 'pricing',
        type: 'PRICING',
        title: 'Pricing Structure',
        defaultContent: 'Transparent pricing with no hidden fees.',
        order: 4,
        required: true,
      },
      {
        id: 'terms',
        type: 'TERMS',
        title: 'Terms & Conditions',
        defaultContent: 'Standard terms and conditions apply.',
        order: 5,
        required: true,
      },
    ],
    defaultBranding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    isDefault: false,
    isPublic: true,
    isActive: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  // ============================================================================
  // MULTIMODAL LOGISTICS TEMPLATES
  // ============================================================================
  {
    id: 'tpl-multimodal-logistics',
    name: 'Multimodal Logistics Solution',
    description: 'End-to-end multimodal logistics proposal',
    type: 'QUOTE_PROPOSAL',
    category: 'MULTIMODAL',
    sections: [
      {
        id: 'cover',
        type: 'HEADER',
        title: 'Cover Page',
        defaultContent: 'Multimodal Logistics Solution',
        order: 0,
        required: true,
      },
      {
        id: 'executive-summary',
        type: 'TEXT',
        title: 'Executive Summary',
        defaultContent: 'Our integrated multimodal solution combines road, rail, sea, and air transport for optimal efficiency and cost-effectiveness.',
        order: 1,
        required: true,
      },
      {
        id: 'journey-analysis',
        type: 'TEXT',
        title: 'Journey Analysis',
        defaultContent: 'Comprehensive analysis of your supply chain journey with optimization recommendations.',
        order: 2,
        required: true,
      },
      {
        id: 'modes',
        type: 'TEXT',
        title: 'Transport Modes',
        defaultContent: '• Road Transport\n• Rail Freight\n• Sea Freight\n• Air Cargo\n• Intermodal Solutions',
        order: 3,
        required: true,
      },
      {
        id: 'routing',
        type: 'TEXT',
        title: 'Route Optimization',
        defaultContent: 'AI-powered route optimization for cost and time efficiency.',
        order: 4,
        required: true,
      },
      {
        id: 'pricing',
        type: 'PRICING',
        title: 'Pricing Structure',
        defaultContent: 'Competitive multimodal rates.',
        order: 5,
        required: true,
      },
      {
        id: 'sla',
        type: 'TEXT',
        title: 'Service Level Agreements',
        defaultContent: '• End-to-end visibility\n• Real-time tracking\n• Guaranteed transit times\n• 24/7 support',
        order: 6,
        required: true,
      },
      {
        id: 'terms',
        type: 'TERMS',
        title: 'Terms & Conditions',
        defaultContent: 'Standard terms and conditions apply.',
        order: 7,
        required: true,
      },
    ],
    defaultBranding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    isDefault: false,
    isPublic: true,
    isActive: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
  // ============================================================================
  // COMPLETE SUPPLY CHAIN TEMPLATES
  // ============================================================================
  {
    id: 'tpl-complete-supply-chain',
    name: 'Complete Supply Chain Solution',
    description: 'End-to-end supply chain management proposal',
    type: 'QUOTE_PROPOSAL',
    category: 'SUPPLY_CHAIN',
    sections: [
      {
        id: 'cover',
        type: 'HEADER',
        title: 'Cover Page',
        defaultContent: 'Complete Supply Chain Solution',
        order: 0,
        required: true,
      },
      {
        id: 'executive-summary',
        type: 'TEXT',
        title: 'Executive Summary',
        defaultContent: 'Our comprehensive supply chain solution integrates warehousing, transportation, customs, and value-added services for seamless operations.',
        order: 1,
        required: true,
      },
      {
        id: 'company-profile',
        type: 'TEXT',
        title: 'Company Profile',
        defaultContent: 'BlueDXP is a leading logistics platform with proven expertise in end-to-end supply chain management.',
        order: 2,
        required: true,
      },
      {
        id: 'services',
        type: 'TEXT',
        title: 'Comprehensive Services',
        defaultContent: '• Warehousing & Storage\n• Transportation & Distribution\n• Customs Clearance\n• Inventory Management\n• Value-Added Services\n• Technology Integration',
        order: 3,
        required: true,
      },
      {
        id: 'implementation',
        type: 'TEXT',
        title: 'Implementation Plan',
        defaultContent: 'Phased implementation with dedicated project management and support.',
        order: 4,
        required: true,
      },
      {
        id: 'pricing',
        type: 'PRICING',
        title: 'Pricing Structure',
        defaultContent: 'Comprehensive pricing for integrated solution.',
        order: 5,
        required: true,
      },
      {
        id: 'value-proposition',
        type: 'TEXT',
        title: 'Value Proposition',
        defaultContent: '• Cost optimization\n• Operational efficiency\n• Real-time visibility\n• Scalable solution\n• Technology-driven',
        order: 6,
        required: true,
      },
      {
        id: 'case-studies',
        type: 'TEXT',
        title: 'Case Studies',
        defaultContent: 'Success stories from similar implementations.',
        order: 7,
        required: false,
      },
      {
        id: 'terms',
        type: 'TERMS',
        title: 'Terms & Conditions',
        defaultContent: 'Standard terms and conditions apply.',
        order: 8,
        required: true,
      },
    ],
    defaultBranding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    isDefault: false,
    isPublic: true,
    isActive: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  },
]

// Template categories for organization
export const TEMPLATE_CATEGORIES = {
  WAREHOUSING: {
    name: 'Warehousing',
    icon: 'ri-building-4-line',
    color: '#6366F1',
    templates: PROPOSAL_TEMPLATES.filter(t => t.category === 'WAREHOUSING'),
  },
  TRANSPORTATION: {
    name: 'Transportation',
    icon: 'ri-truck-line',
    color: '#10B981',
    templates: PROPOSAL_TEMPLATES.filter(t => t.category === 'TRANSPORTATION'),
  },
  CUSTOMS_CLEARANCE: {
    name: 'Customs Clearance',
    icon: 'ri-shield-check-line',
    color: '#F59E0B',
    templates: PROPOSAL_TEMPLATES.filter(t => t.category === 'CUSTOMS_CLEARANCE'),
  },
  MULTIMODAL: {
    name: 'Multimodal Logistics',
    icon: 'ri-route-line',
    color: '#3B82F6',
    templates: PROPOSAL_TEMPLATES.filter(t => t.category === 'MULTIMODAL'),
  },
  SUPPLY_CHAIN: {
    name: 'Complete Supply Chain',
    icon: 'ri-stack-line',
    color: '#8B5CF6',
    templates: PROPOSAL_TEMPLATES.filter(t => t.category === 'SUPPLY_CHAIN'),
  },
}

// Helper functions
export function getTemplateById(id: string): ProposalTemplate | undefined {
  return PROPOSAL_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): ProposalTemplate[] {
  return PROPOSAL_TEMPLATES.filter(t => t.category === category)
}

export function getDefaultTemplates(): ProposalTemplate[] {
  return PROPOSAL_TEMPLATES.filter(t => t.isDefault)
}

export function searchTemplates(query: string): ProposalTemplate[] {
  const lowerQuery = query.toLowerCase()
  return PROPOSAL_TEMPLATES.filter(
    t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
  )
}


