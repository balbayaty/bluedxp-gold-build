/**
 * ALL Feature Playbooks - Complete Collection
 * =============================================
 * Comprehensive, deeply-layered playbooks for every BlueDXP feature.
 * Each playbook covers 20+ layers of information.
 */

import { FeaturePlaybook } from '@/types/featurePlaybook';
import { 
  regulatoryBodies, 
  laws, 
  complianceStandards, 
  industryStandards,
  industryVerticals,
  commonTooltips 
} from './complianceReference';

// =============================================================================
// 1. ADVANCED IoT MANAGEMENT SYSTEM
// =============================================================================
// (Already created in featurePlaybooks.ts - importing reference)

// =============================================================================
// 2. DASHBOARD MANAGEMENT SYSTEM
// =============================================================================

export const dashboardManagementPlaybook: FeaturePlaybook = {
  id: 'dashboard-management',
  name: 'Dashboard Management System',
  description: 'Centralized dashboard management platform with widget library, role-based access, real-time updates, and customizable layouts for enterprise visualization needs.',
  category: 'Business Intelligence',
  modules: ['dashboards', 'analytics', 'reporting'],
  
  status: 'development',
  priority: 'HIGH',
  phase: 2,
  estimatedTime: '3-4 weeks',
  complexity: 'complex',
  
  capabilities: [
    'Centralized Dashboard Management',
    'Layout Templates & Themes',
    'Widget Library (50+ widgets)',
    'Role-Based Widget Access',
    'Real-time WebSocket Updates',
    'Drag-and-Drop Customization',
    'Multi-Tenant Dashboard Isolation',
    'Dashboard Analytics & Usage Tracking',
    'Export & Sharing Capabilities',
    'Mobile-Responsive Design'
  ],
  keyFeatures: [
    'Single source of truth for all dashboards',
    'Pre-configured layout templates',
    'Widget-level RBAC permissions',
    'Live data streaming via WebSocket/SSE',
    'User-customizable dashboard layouts',
    'Usage analytics and heatmaps',
    'Dynamic theming support',
    'Route consolidation for 38+ dashboard routes',
    'Embeddable widgets for external use',
    'PDF/Excel export capabilities'
  ],
  benefits: [
    'Reduce dashboard development time by 70%',
    'Improve data accessibility across organization',
    'Enable self-service analytics for business users',
    'Ensure consistent branding and UX',
    'Reduce IT support tickets for reporting',
    'Enable real-time decision making'
  ],

  compliance: {
    standards: [
      {
        code: 'SOC 2 Type II',
        name: 'Service Organization Control 2',
        category: 'security',
        description: 'Trust services criteria for security and availability',
        requirement: 'recommended',
        certificationBody: 'AICPA',
        regions: ['global'],
        complianceContribution: 'Role-based access control, audit logging, and data encryption',
        clausesAddressed: ['CC6 Logical Access', 'CC7 System Operations']
      },
      {
        code: 'WCAG 2.1',
        name: 'Web Content Accessibility Guidelines',
        category: 'operational',
        description: 'Accessibility standards for web content',
        requirement: 'mandatory',
        certificationBody: 'W3C',
        regions: ['global'],
        complianceContribution: 'Accessible dashboard components, keyboard navigation, screen reader support',
        clausesAddressed: ['Perceivable', 'Operable', 'Understandable', 'Robust']
      }
    ],
    governanceFrameworks: [
      {
        name: 'Data Governance Framework',
        type: 'data',
        description: 'Framework for managing data quality and access',
        principles: ['Data Quality', 'Data Security', 'Data Accessibility', 'Data Lineage'],
        featureContribution: 'Widget-level data governance with source tracking'
      }
    ],
    auditRequirements: [
      {
        type: 'internal',
        frequency: 'monthly',
        scope: 'Dashboard access logs, widget usage, data access patterns',
        evidenceRequired: ['Access logs', 'Usage reports', 'Permission audits'],
        auditTrailNeeds: ['User access', 'Data queries', 'Configuration changes']
      }
    ],
    complianceScoreImpact: 65,
    riskReductionPercentage: 45,
    certificationReadiness: [
      { certification: 'SOC 2', readinessPercentage: 85, gapsToAddress: ['Formal audit logging'] },
      { certification: 'WCAG 2.1 AA', readinessPercentage: 90, gapsToAddress: ['Color contrast in some themes'] }
    ]
  },

  regulatory: {
    regulatoryBodies: [
      {
        code: 'FTC',
        name: 'Federal Trade Commission',
        jurisdiction: 'us',
        type: 'government',
        website: 'https://www.ftc.gov',
        keyRegulations: ['Fair Information Practices', 'Data Security'],
        complianceSupport: 'Transparent data usage in dashboards'
      }
    ],
    laws: [
      {
        name: 'Americans with Disabilities Act',
        code: 'ADA',
        jurisdiction: 'us',
        yearEnacted: 1990,
        category: 'consumer-protection',
        keyProvisions: ['Accessibility Requirements', 'Equal Access'],
        penalties: 'Lawsuits and settlements',
        featureContribution: 'WCAG 2.1 AA compliant dashboards'
      }
    ],
    regulations: [],
    tradeCompliance: [],
    upcomingChanges: [
      {
        regulation: 'European Accessibility Act',
        expectedDate: '2025-06-28',
        impact: 'medium',
        preparationNeeded: 'Ensure all widgets meet EN 301 549 accessibility requirements'
      }
    ],
    jurisdictionalCoverage: ['global', 'us', 'eu', 'uk', 'saudi-arabia']
  },

  industry: {
    standards: [
      {
        code: 'BIRT',
        name: 'Business Intelligence and Reporting Tools',
        organization: 'Eclipse Foundation',
        category: 'interoperability',
        version: '4.x',
        description: 'Open source reporting framework',
        specifications: ['Report Design', 'Data Visualization', 'Charting'],
        implementationRequirements: ['Report templates', 'Data connectors'],
        featureImplementation: 'Compatible report formats and visualizations'
      }
    ],
    authorities: [
      {
        name: 'Data Management Association (DAMA)',
        type: 'trade-association',
        focusArea: 'Data Management',
        keyStandards: ['DMBOK', 'Data Governance'],
        featureAlignment: 'DMBOK-aligned data management practices'
      }
    ],
    bestPractices: [
      {
        name: 'Dashboard Design Best Practices',
        category: 'UX',
        description: 'Industry-standard dashboard design principles',
        principles: ['Progressive Disclosure', 'Data-Ink Ratio', 'Cognitive Load'],
        implementationGuidance: 'Follow data visualization best practices',
        maturityIndicators: ['User satisfaction', 'Task completion rate'],
        featureImplementation: 'All widgets follow visualization best practices'
      }
    ],
    verticalsServed: ['All Industries'],
    industryRequirements: [
      {
        industry: 'Financial Services',
        requirements: ['Audit Trail', 'Data Lineage', 'Access Controls'],
        featureSupport: 'Complete audit logging and data lineage tracking'
      },
      {
        industry: 'Healthcare',
        requirements: ['HIPAA Compliance', 'PHI Protection', 'Access Logging'],
        featureSupport: 'HIPAA-compliant data handling in widgets'
      }
    ]
  },

  strategic: {
    industrialAlignment: [
      {
        revolution: '4IR',
        alignmentScore: 80,
        pillarsAddressed: ['Big Data Analytics', 'Cloud Computing', 'Real-time Processing'],
        technologiesLeveraged: ['WebSocket', 'Real-time Streaming', 'Cloud Dashboards'],
        capabilitiesEnabled: ['Real-time Monitoring', 'Self-Service Analytics', 'Data Democratization']
      },
      {
        revolution: '5IR',
        alignmentScore: 75,
        pillarsAddressed: ['Human-Centric Design', 'Personalization', 'Accessibility'],
        technologiesLeveraged: ['Adaptive UI', 'AI Recommendations', 'Accessibility Tools'],
        capabilitiesEnabled: ['Personalized Dashboards', 'Inclusive Design', 'AI-Assisted Insights'],
        humanCentricAspects: ['User preference learning', 'Cognitive load optimization', 'Accessibility-first design'],
        sustainabilityContributions: ['Reduced paper reports', 'Energy-efficient rendering']
      }
    ],
    platformAlignment: [
      {
        strategicPillar: 'analytics',
        alignmentStrength: 'core',
        visionContribution: 'Central hub for all platform analytics and visualizations',
        crossModuleSynergies: ['WMS dashboards', 'TMS analytics', 'QHSE reporting'],
        ecosystemValue: 'Unified visualization layer across all modules'
      }
    ],
    valuePropositions: [
      {
        category: 'efficiency',
        statement: 'Reduce time to insight by 60% with pre-built dashboards',
        quantifiedBenefit: '40 hours saved per month per analyst',
        roiTimeframe: '3 months',
        proofPoints: ['Template library', 'Drag-and-drop builder']
      }
    ],
    strategicImportance: 8,
    marketDifferentiation: ['Integrated with all BlueDXP modules', 'Real-time without complexity', 'Enterprise-grade with self-service'],
    competitiveMoat: ['Deep platform integration', 'Industry-specific templates', 'Multi-tenant architecture'],
    roadmapPosition: 'growth'
  },

  market: {
    trends: [
      {
        name: 'Self-Service BI',
        category: 'business',
        maturity: 'mature',
        impact: 'significant',
        timeHorizon: 'immediate',
        description: 'Business users creating their own reports without IT',
        featureResponse: 'Drag-and-drop dashboard builder with pre-built widgets',
        marketDrivers: ['IT backlog reduction', 'Faster decision making', 'User empowerment'],
        statistics: ['70% of enterprises will prioritize self-service BI by 2025']
      },
      {
        name: 'Embedded Analytics',
        category: 'technology',
        maturity: 'growing',
        impact: 'significant',
        timeHorizon: 'short-term',
        description: 'Analytics embedded directly in operational applications',
        featureResponse: 'Embeddable widget library for external integration',
        marketDrivers: ['Contextual insights', 'Reduced context switching'],
        statistics: ['Embedded analytics market to reach $77B by 2026']
      }
    ],
    technologyTrends: [
      {
        name: 'Augmented Analytics',
        category: 'ai-ml',
        adoptionStage: 'early-majority',
        relevance: 'complementary',
        description: 'AI-powered insights and recommendations',
        featureLeverage: 'AI-powered insight generation in widgets'
      }
    ],
    competitiveLandscape: {
      competitorType: 'direct',
      keyCompetitors: ['Tableau', 'Power BI', 'Looker', 'Qlik', 'Sisense'],
      ourDifferentiators: ['Integrated with operational data', 'Industry-specific widgets', 'Lower TCO'],
      competitiveAdvantages: ['No separate BI license needed', 'Real-time operational data', 'Built for supply chain'],
      areasForImprovement: ['Advanced visualization library', 'Natural language queries'],
      marketPositioning: 'Embedded analytics for supply chain operations'
    },
    marketOpportunity: {
      totalAddressableMarket: '$45B by 2028',
      serviceableMarket: '$5B (Supply Chain BI)',
      growthRate: '12.5% CAGR',
      keySegments: ['3PL', 'Manufacturing', 'Retail', 'Distribution']
    },
    targetIndustries: ['Third-Party Logistics', 'Manufacturing', 'Retail', 'Distribution', 'Healthcare'],
    geographicOpportunities: ['global']
  },

  technical: {
    architecturePatterns: [
      {
        name: 'Micro-Frontend Architecture',
        type: 'architectural',
        description: 'Independent widget deployment and updates',
        whenToUse: 'For scalable, independently deployable dashboard components',
        benefits: ['Independent deployment', 'Technology flexibility', 'Team autonomy'],
        tradeoffs: ['Initial complexity', 'Bundle size management'],
        implementationDetails: 'Module federation with lazy loading'
      }
    ],
    technologyStack: [
      {
        category: 'frontend',
        technologies: [
          { name: 'React', version: '18+', purpose: 'UI framework', required: true },
          { name: 'Recharts', purpose: 'Charting library', required: true },
          { name: 'Framer Motion', purpose: 'Animations', required: false },
          { name: 'TailwindCSS', purpose: 'Styling', required: true }
        ]
      },
      {
        category: 'backend',
        technologies: [
          { name: 'Next.js', version: '14+', purpose: 'API routes and SSR', required: true },
          { name: 'WebSocket', purpose: 'Real-time updates', required: true }
        ]
      }
    ],
    securityRequirements: [
      {
        domain: 'authorization',
        requirement: 'Widget-level role-based access control',
        criticality: 'high',
        implementation: 'RBAC with 11 roles, widget-level permissions',
        standardsAddressed: ['SOC 2 CC6']
      }
    ],
    performanceRequirements: [
      {
        metricType: 'latency',
        targetValue: 'Dashboard load <2 seconds, Widget refresh <500ms',
        measurementMethod: 'Real User Monitoring (RUM)',
        slaTier: 'gold'
      }
    ],
    integrationPatterns: [
      {
        type: 'real-time',
        protocol: 'WebSocket, SSE',
        dataFormat: 'JSON',
        description: 'Real-time widget updates',
        useCases: ['Live KPIs', 'Streaming charts', 'Alerts']
      }
    ],
    scalabilityApproach: 'Horizontal scaling with CDN for static assets',
    highAvailability: 'Multi-region deployment with edge caching',
    disasterRecovery: 'Configuration backup, RPO: 1 hour',
    dataArchitecture: 'Data virtualization with caching layer'
  },

  sales: {
    targetPersonas: [
      {
        name: 'Business Analyst',
        jobTitles: ['Business Analyst', 'Data Analyst', 'BI Analyst'],
        department: 'Business Intelligence',
        seniority: 'analyst',
        responsibilities: ['Report creation', 'Data analysis', 'Stakeholder communication'],
        painPoints: ['IT dependency', 'Slow report turnaround', 'Multiple tools'],
        goals: ['Self-service reporting', 'Faster insights', 'Single source of truth'],
        commonObjections: ['Learning curve', 'Data accuracy concerns'],
        keyMessaging: ['No coding required', 'Real-time data', 'Pre-built templates'],
        decisionRole: 'user'
      },
      {
        name: 'IT Director',
        jobTitles: ['IT Director', 'VP IT', 'CTO'],
        department: 'Information Technology',
        seniority: 'director',
        responsibilities: ['Technology strategy', 'Vendor management', 'Security'],
        painPoints: ['Multiple BI tools', 'Integration challenges', 'Support burden'],
        goals: ['Consolidation', 'Reduced maintenance', 'Security compliance'],
        commonObjections: ['Integration effort', 'Security concerns'],
        keyMessaging: ['Integrated solution', 'Enterprise security', 'Reduced TCO'],
        decisionRole: 'decision-maker'
      }
    ],
    useCases: [
      {
        name: 'Executive KPI Dashboard',
        industry: 'Logistics',
        scenario: 'C-suite needs real-time visibility into operations',
        problemAddressed: 'Executives rely on weekly reports that are outdated',
        solution: 'Real-time executive dashboard with key metrics',
        benefits: ['Real-time visibility', 'Faster decision making', 'Mobile access'],
        roiMetrics: ['10% faster decision making', 'Reduced executive meetings']
      }
    ],
    keySellingPoints: ['Pre-built supply chain templates', 'Real-time without complexity', 'Integrated with operations'],
    competitiveAdvantages: ['No separate BI license', 'Operational data context', 'Lower TCO'],
    objectionHandling: [
      {
        objection: 'We already have Power BI/Tableau',
        response: 'BlueDXP dashboards complement existing tools with operational context and real-time data that traditional BI tools cannot provide.'
      }
    ],
    pricingConsiderations: {
      model: 'per-user',
      valueDrivers: ['Number of users', 'Dashboard complexity', 'Real-time requirements'],
      costFactors: ['User licenses', 'Data volume'],
      competitivePositioning: 'Included with platform, no separate BI license',
      upsellOpportunities: ['Premium widgets', 'Custom development', 'Training']
    },
    demoScenarios: ['Executive dashboard walkthrough', 'Widget customization', 'Real-time data demo'],
    proofPoints: ['Customer testimonials', 'Dashboard templates gallery'],
    salesMaterials: ['Solution brief', 'Widget catalog', 'Template gallery', 'Demo environment']
  },

  implementation: {
    phases: [
      {
        name: 'Requirements & Design',
        phase: 1,
        duration: '1 week',
        activities: ['Dashboard requirements gathering', 'Widget selection', 'Layout design'],
        deliverables: ['Dashboard specifications', 'Widget list', 'Mockups'],
        successCriteria: ['Stakeholder approval'],
        dependencies: ['Business requirements'],
        risks: ['Scope creep']
      },
      {
        name: 'Configuration & Setup',
        phase: 2,
        duration: '1 week',
        activities: ['Dashboard configuration', 'Data source connections', 'Widget setup'],
        deliverables: ['Configured dashboards', 'Connected data sources'],
        successCriteria: ['Data flowing correctly'],
        dependencies: ['Data access', 'API connections'],
        risks: ['Data quality issues']
      },
      {
        name: 'Testing & Training',
        phase: 3,
        duration: '1 week',
        activities: ['User acceptance testing', 'Training delivery', 'Feedback incorporation'],
        deliverables: ['Tested dashboards', 'Trained users'],
        successCriteria: ['UAT sign-off', 'Training completion'],
        dependencies: ['User availability'],
        risks: ['User adoption']
      }
    ],
    prerequisites: [
      {
        category: 'data',
        requirement: 'Data sources accessible via API or database',
        criticality: 'blocking',
        validationMethod: 'Connection test'
      }
    ],
    bestPractices: [
      {
        category: 'adoption',
        practice: 'Start with executive dashboards for visibility and buy-in',
        rationale: 'Top-down adoption drives organization-wide usage',
        guidance: 'Identify 3-5 key executive metrics for initial dashboard'
      }
    ],
    commonPitfalls: [
      {
        pitfall: 'Too many widgets on a single dashboard',
        impact: 'Information overload, poor performance',
        avoidance: 'Limit to 6-8 widgets per dashboard',
        recovery: 'Split into multiple focused dashboards'
      }
    ],
    resourceRequirements: [
      { role: 'Dashboard Designer', effort: '100%', skills: ['BI experience', 'Data visualization'] },
      { role: 'Data Analyst', effort: '50%', skills: ['SQL', 'Data modeling'] }
    ],
    trainingRequirements: ['Dashboard Builder Training (4 hours)', 'Widget Configuration (2 hours)'],
    changeManagement: ['User communication', 'Champions program', 'Feedback loop'],
    successMetrics: ['Dashboard adoption rate', 'User satisfaction', 'Time to insight']
  },

  sustainability: {
    environmentalImpacts: [
      {
        category: 'resources',
        type: 'reduction',
        description: 'Reduce paper reports through digital dashboards',
        metrics: ['Paper saved', 'Print costs reduced'],
        goalContribution: 'Paperless operations'
      }
    ],
    esgAlignment: [
      {
        pillar: 'environmental',
        aspect: 'Resource Efficiency',
        contribution: 'Digital-first reporting reduces paper waste',
        reportingFrameworks: ['GRI'],
        sdgAlignment: [12, 13]
      }
    ],
    carbonFootprint: {
      directImpact: 'Minimal - cloud-based solution',
      indirectBenefits: ['Reduced paper usage', 'Fewer printed reports'],
      offsetOpportunities: []
    },
    circularEconomy: ['Digital-first approach'],
    certifications: []
  },

  documentation: {
    documentation: [
      {
        type: 'user-guide',
        title: 'Dashboard User Guide',
        description: 'Guide for dashboard users and viewers',
        targetAudience: ['All users'],
        status: 'planned'
      },
      {
        type: 'admin-guide',
        title: 'Dashboard Administration Guide',
        description: 'Guide for dashboard administrators',
        targetAudience: ['Administrators'],
        status: 'planned'
      }
    ],
    supportRequirements: {
      tier: 'standard',
      channels: ['Email', 'Chat', 'Documentation'],
      responseTimes: [
        { priority: 'High (P2)', responseTime: '4 hours', resolutionTime: '24 hours' },
        { priority: 'Medium (P3)', responseTime: '8 hours', resolutionTime: '48 hours' }
      ],
      escalationPath: ['L1 Support', 'L2 Dashboard Specialist', 'Product Team']
    },
    trainingPrograms: [
      {
        name: 'Dashboard Builder Fundamentals',
        type: 'self-paced',
        duration: '4 hours',
        targetAudience: 'Business users'
      }
    ],
    knowledgeBaseTopics: ['Dashboard creation', 'Widget configuration', 'Data connections', 'Sharing dashboards'],
    videoTutorials: ['Quick start', 'Building your first dashboard', 'Advanced customization']
  },

  moduleDependencies: ['analytics', 'rbac'],
  serviceDependencies: [
    'lib/services/dashboards/dashboardManager.ts',
    'lib/services/dashboards/widgetService.ts',
    'lib/services/dashboards/layoutService.ts'
  ],
  externalIntegrations: ['Any data source via API', 'REST APIs', 'GraphQL'],
  apiDependencies: ['/api/dashboards', '/api/widgets', '/api/layouts'],

  lastUpdated: '2025-01-27',
  owner: 'Analytics Team',
  contributors: ['UX', 'Frontend', 'Product'],
  version: '1.0.0',
  tags: ['dashboards', 'analytics', 'visualization', 'bi', 'reporting', 'self-service']
};

// =============================================================================
// 3. QHSE DASHBOARD SYSTEM
// =============================================================================

export const qhseDashboardPlaybook: FeaturePlaybook = {
  id: 'qhse-dashboard',
  name: 'QHSE Dashboard System',
  description: 'Comprehensive Quality, Health, Safety, and Environment management dashboard with incident tracking, inspection management, training compliance, and regulatory reporting.',
  category: 'Quality & Safety',
  modules: ['qhse', 'compliance', 'reporting'],
  
  status: 'production',
  priority: 'CRITICAL',
  phase: 3,
  estimatedTime: '4-5 weeks',
  complexity: 'complex',
  
  capabilities: [
    'Safety Performance Tracking (TRIR, LTIFR)',
    'Incident Management & Investigation',
    'Inspection & Audit Management',
    'Training Compliance Tracking',
    'Environmental Metrics Monitoring',
    'Regulatory Audit Scheduling',
    'CAPA Management',
    'Multi-Facility Support',
    'Real-time Safety Alerts',
    'ESG Reporting'
  ],
  keyFeatures: [
    'TRIR, LTIFR, and other safety KPI tracking',
    'Incident reporting with investigation workflow',
    'Inspection scheduling and tracking',
    'Training completion and certification tracking',
    'Environmental impact monitoring',
    'Regulatory compliance calendar',
    'Corrective and Preventive Actions (CAPA)',
    'Multi-customer, multi-facility hierarchy',
    'Mobile incident reporting',
    'Automated ESG report generation'
  ],
  benefits: [
    'Reduce workplace incidents by 50%',
    'Achieve 100% training compliance',
    'Cut audit preparation time by 70%',
    'Improve regulatory compliance scores',
    'Enable proactive safety management',
    'Support ESG reporting requirements'
  ],

  compliance: {
    standards: [
      {
        code: 'ISO 45001',
        name: 'Occupational Health and Safety Management',
        category: 'safety',
        description: 'International standard for OH&S management systems',
        requirement: 'mandatory',
        certificationBody: 'ISO',
        regions: ['global'],
        complianceContribution: 'Complete OH&S management system support',
        clausesAddressed: ['Clause 6 Planning', 'Clause 8 Operation', 'Clause 9 Performance Evaluation', 'Clause 10 Improvement']
      },
      {
        code: 'ISO 14001',
        name: 'Environmental Management System',
        category: 'environmental',
        description: 'International standard for environmental management',
        requirement: 'mandatory',
        certificationBody: 'ISO',
        regions: ['global'],
        complianceContribution: 'Environmental aspect tracking and impact monitoring',
        clausesAddressed: ['Clause 6.1 Environmental Aspects', 'Clause 9 Performance Evaluation']
      },
      {
        code: 'ISO 9001',
        name: 'Quality Management System',
        category: 'quality',
        description: 'International standard for quality management',
        requirement: 'mandatory',
        certificationBody: 'ISO',
        regions: ['global'],
        complianceContribution: 'Quality metrics tracking, NCR management, CAPA',
        clausesAddressed: ['Clause 8 Operation', 'Clause 9 Performance Evaluation', 'Clause 10 Improvement']
      }
    ],
    governanceFrameworks: [
      {
        name: 'QHSE Management System',
        type: 'operational',
        description: 'Integrated QHSE management framework',
        principles: ['Leadership Commitment', 'Risk-Based Thinking', 'Continuous Improvement', 'Worker Participation'],
        featureContribution: 'Complete digital QHSE management system',
        maturityLevel: 4
      }
    ],
    auditRequirements: [
      {
        type: 'external',
        frequency: 'annual',
        scope: 'Full QHSE system audit for certification',
        evidenceRequired: ['Incident records', 'Training records', 'Inspection reports', 'CAPA documentation', 'Management reviews'],
        auditTrailNeeds: ['All QHSE activities', 'Approvals', 'Changes']
      },
      {
        type: 'regulatory',
        frequency: 'on-demand',
        scope: 'OSHA/HSE regulatory inspections',
        evidenceRequired: ['Safety records', 'Training certifications', 'Hazard assessments'],
        auditTrailNeeds: ['Complete safety history']
      }
    ],
    complianceScoreImpact: 95,
    riskReductionPercentage: 75,
    certificationReadiness: [
      { certification: 'ISO 45001', readinessPercentage: 95, gapsToAddress: ['Management review documentation'] },
      { certification: 'ISO 14001', readinessPercentage: 90, gapsToAddress: ['Environmental aspect register'] },
      { certification: 'ISO 9001', readinessPercentage: 95, gapsToAddress: ['Process documentation'] }
    ]
  },

  regulatory: {
    regulatoryBodies: [
      {
        code: 'OSHA',
        name: 'Occupational Safety and Health Administration',
        jurisdiction: 'us',
        type: 'government',
        website: 'https://www.osha.gov',
        keyRegulations: ['29 CFR 1910', '29 CFR 1926', 'PSM', 'Recordkeeping'],
        complianceSupport: 'OSHA recordkeeping, incident tracking, and reporting'
      },
      {
        code: 'EPA',
        name: 'Environmental Protection Agency',
        jurisdiction: 'us',
        type: 'government',
        website: 'https://www.epa.gov',
        keyRegulations: ['RCRA', 'CERCLA', 'CAA', 'CWA', 'RMP'],
        complianceSupport: 'Environmental compliance tracking and reporting'
      },
      {
        code: 'HSE',
        name: 'Health and Safety Executive',
        jurisdiction: 'uk',
        type: 'government',
        website: 'https://www.hse.gov.uk',
        keyRegulations: ['HSWA', 'RIDDOR', 'COSHH', 'Management Regs'],
        complianceSupport: 'UK H&S compliance and RIDDOR reporting'
      }
    ],
    laws: [
      {
        name: 'Occupational Safety and Health Act',
        code: 'OSH Act',
        jurisdiction: 'us',
        yearEnacted: 1970,
        category: 'safety',
        keyProvisions: ['General Duty Clause', 'Standards Compliance', 'Recordkeeping', 'Inspections'],
        penalties: 'Up to $156,259 per willful violation',
        featureContribution: 'OSHA 300 log automation, incident tracking, hazard management'
      },
      {
        name: 'Health and Safety at Work Act',
        code: 'HSWA',
        jurisdiction: 'uk',
        yearEnacted: 1974,
        category: 'safety',
        keyProvisions: ['Employer Duties', 'Employee Duties', 'Risk Assessment'],
        penalties: 'Unlimited fines, imprisonment for serious breaches',
        featureContribution: 'Risk assessment management, safety documentation'
      }
    ],
    regulations: [
      {
        name: 'OSHA Recordkeeping',
        code: '29 CFR 1904',
        authority: 'OSHA',
        type: 'standard',
        effectiveDate: '2001-01-01',
        summary: 'Requirements for recording and reporting occupational injuries and illnesses',
        requirements: ['OSHA 300 Log', 'OSHA 301 Form', 'OSHA 300A Summary', 'Electronic Submission'],
        documentationRequired: ['Injury logs', 'Incident forms', 'Annual summary'],
        reportingObligations: ['Annual electronic submission', 'Severe injury reporting within 24 hours'],
        featureCompliance: 'Automated OSHA log generation and electronic submission'
      },
      {
        name: 'RIDDOR',
        code: 'RIDDOR 2013',
        authority: 'HSE',
        type: 'standard',
        effectiveDate: '2013-10-01',
        summary: 'Reporting of Injuries, Diseases and Dangerous Occurrences',
        requirements: ['Report specific injuries', 'Report occupational diseases', 'Report dangerous occurrences'],
        documentationRequired: ['Accident records', 'Investigation reports'],
        reportingObligations: ['Online F2508 reporting', 'Telephone for fatalities'],
        featureCompliance: 'RIDDOR-compliant incident classification and reporting'
      }
    ],
    tradeCompliance: [],
    upcomingChanges: [
      {
        regulation: 'EU Corporate Sustainability Due Diligence Directive',
        expectedDate: '2026-01-01',
        impact: 'high',
        preparationNeeded: 'Enhanced supply chain H&S due diligence tracking'
      }
    ],
    jurisdictionalCoverage: ['global', 'us', 'uk', 'eu', 'saudi-arabia', 'uae', 'gcc']
  },

  industry: {
    standards: [
      {
        code: 'ANSI Z10',
        name: 'Occupational Health and Safety Management Systems',
        organization: 'ANSI/ASSP',
        category: 'safety',
        version: '2019',
        description: 'American national standard for OH&S management',
        specifications: ['Management Leadership', 'Worker Participation', 'Hazard Assessment', 'Prevention'],
        implementationRequirements: ['Policy', 'Planning', 'Implementation', 'Evaluation', 'Improvement'],
        featureImplementation: 'Full ANSI Z10 framework support'
      },
      {
        code: 'NEBOSH',
        name: 'National Examination Board in Occupational Safety and Health',
        organization: 'NEBOSH',
        category: 'safety',
        version: 'Current',
        description: 'Health and safety qualifications',
        specifications: ['Risk Assessment', 'Hazard Control', 'Safety Culture'],
        implementationRequirements: ['Training programs', 'Competency tracking'],
        featureImplementation: 'NEBOSH-aligned training tracking'
      }
    ],
    authorities: [
      {
        name: 'National Safety Council (NSC)',
        type: 'trade-association',
        focusArea: 'Workplace Safety',
        keyStandards: ['Safety Training', 'Best Practices'],
        featureAlignment: 'NSC best practices implemented'
      },
      {
        name: 'American Society of Safety Professionals (ASSP)',
        type: 'trade-association',
        focusArea: 'Safety Professional Development',
        keyStandards: ['ANSI Z10', 'Safety Standards'],
        featureAlignment: 'ASSP standards compliance'
      }
    ],
    bestPractices: [
      {
        name: 'Behavior-Based Safety (BBS)',
        category: 'Safety',
        description: 'Focus on observable safety behaviors',
        principles: ['Observation', 'Feedback', 'Positive Reinforcement'],
        implementationGuidance: 'Implement safety observation program',
        maturityIndicators: ['Observation frequency', 'At-risk behavior reduction'],
        featureImplementation: 'Safety observation tracking and analytics'
      }
    ],
    verticalsServed: ['Manufacturing', 'Construction', 'Oil & Gas', 'Logistics', 'Chemical', 'Mining'],
    industryRequirements: [
      {
        industry: 'Construction',
        requirements: ['OSHA 29 CFR 1926', 'Fall Protection', 'Scaffolding', 'Excavation'],
        featureSupport: 'Construction-specific safety checklists and tracking'
      },
      {
        industry: 'Oil & Gas',
        requirements: ['PSM', 'RMP', 'API Standards', 'Life-Saving Rules'],
        featureSupport: 'PSM compliance tracking, life-saving rules monitoring'
      },
      {
        industry: 'Chemical',
        requirements: ['PSM', 'RMP', 'REACH', 'GHS', 'Chemical Safety'],
        featureSupport: 'Chemical-specific hazard tracking and SDS management'
      }
    ]
  },

  strategic: {
    industrialAlignment: [
      {
        revolution: '4IR',
        alignmentScore: 85,
        pillarsAddressed: ['IoT', 'Big Data', 'Cloud Computing', 'Real-time Analytics'],
        technologiesLeveraged: ['IoT Safety Sensors', 'Predictive Analytics', 'Mobile Apps', 'Cloud'],
        capabilitiesEnabled: ['Real-time Safety Monitoring', 'Predictive Incident Prevention', 'Automated Reporting']
      },
      {
        revolution: '5IR',
        alignmentScore: 90,
        pillarsAddressed: ['Human-Centric', 'Sustainability', 'Wellbeing'],
        technologiesLeveraged: ['Wearable Safety Devices', 'AI Safety Assistants', 'ESG Reporting'],
        capabilitiesEnabled: ['Worker Wellbeing Monitoring', 'Proactive Safety Culture', 'Sustainability Tracking'],
        humanCentricAspects: ['Worker safety prioritization', 'Mental health tracking', 'Ergonomic monitoring'],
        sustainabilityContributions: ['Environmental impact reduction', 'Carbon footprint tracking', 'Waste reduction monitoring']
      }
    ],
    platformAlignment: [
      {
        strategicPillar: 'compliance',
        alignmentStrength: 'core',
        visionContribution: 'Core compliance pillar for regulatory adherence',
        crossModuleSynergies: ['WMS safety integration', 'TMS driver safety', 'Chemical management'],
        ecosystemValue: 'Foundation for safe operations across all modules'
      },
      {
        strategicPillar: 'sustainability',
        alignmentStrength: 'core',
        visionContribution: 'ESG reporting and environmental management',
        crossModuleSynergies: ['Carbon tracking', 'Waste management', 'Resource efficiency'],
        ecosystemValue: 'Comprehensive sustainability management'
      }
    ],
    valuePropositions: [
      {
        category: 'risk-mitigation',
        statement: 'Reduce workplace incidents by 50% through proactive safety management',
        quantifiedBenefit: 'Average savings of $1M+ per prevented serious incident',
        roiTimeframe: '6 months',
        proofPoints: ['Industry statistics', 'Case studies']
      },
      {
        category: 'compliance',
        statement: 'Achieve and maintain 100% regulatory compliance',
        quantifiedBenefit: 'Avoid fines up to $156K per violation',
        roiTimeframe: 'Immediate',
        proofPoints: ['Compliance dashboards', 'Audit results']
      }
    ],
    strategicImportance: 10,
    marketDifferentiation: ['Integrated QHSE across supply chain', 'Real-time safety monitoring', 'ESG-ready reporting'],
    competitiveMoat: ['Deep regulatory expertise', 'Industry-specific templates', 'Operational integration'],
    roadmapPosition: 'foundational'
  },

  market: {
    trends: [
      {
        name: 'ESG Reporting Requirements',
        category: 'regulatory',
        maturity: 'growing',
        impact: 'transformational',
        timeHorizon: 'immediate',
        description: 'Mandatory ESG disclosure requirements increasing globally',
        featureResponse: 'Built-in ESG reporting with GRI, SASB, TCFD frameworks',
        marketDrivers: ['Investor pressure', 'Regulatory mandates', 'Stakeholder expectations'],
        statistics: ['80% of S&P 500 publish sustainability reports']
      },
      {
        name: 'Connected Worker Safety',
        category: 'technology',
        maturity: 'growing',
        impact: 'significant',
        timeHorizon: 'short-term',
        description: 'Wearable devices and IoT for worker safety monitoring',
        featureResponse: 'Integration with wearable safety devices and IoT sensors',
        marketDrivers: ['Technology availability', 'Real-time monitoring needs', 'Insurance incentives'],
        statistics: ['Connected worker market to reach $8.5B by 2027']
      }
    ],
    technologyTrends: [
      {
        name: 'Predictive Safety Analytics',
        category: 'ai-ml',
        adoptionStage: 'early-adopters',
        relevance: 'core',
        description: 'AI to predict and prevent safety incidents',
        featureLeverage: 'ML models for incident prediction'
      }
    ],
    competitiveLandscape: {
      competitorType: 'direct',
      keyCompetitors: ['Intelex', 'VelocityEHS', 'Enablon', 'Sphera', 'SAP EHS'],
      ourDifferentiators: ['Integrated with operations', 'Supply chain focus', 'Lower TCO'],
      competitiveAdvantages: ['Operational data integration', 'Multi-tenant for 3PL', 'Mobile-first'],
      areasForImprovement: ['Advanced analytics', 'Broader EHS scope'],
      marketPositioning: 'QHSE for supply chain operations'
    },
    marketOpportunity: {
      totalAddressableMarket: '$7.2B by 2028',
      serviceableMarket: '$1.5B (Supply Chain EHS)',
      growthRate: '9.2% CAGR',
      keySegments: ['Manufacturing', 'Logistics', 'Chemical', 'Construction']
    },
    targetIndustries: ['Manufacturing', 'Logistics', 'Chemical', 'Construction', 'Oil & Gas'],
    geographicOpportunities: ['global', 'us', 'eu', 'middle-east']
  },

  technical: {
    architecturePatterns: [
      {
        name: 'Event-Sourced Safety Records',
        type: 'data',
        description: 'Immutable audit trail for all safety events',
        whenToUse: 'For regulatory-compliant safety recordkeeping',
        benefits: ['Complete audit trail', 'Regulatory compliance', 'Historical analysis'],
        tradeoffs: ['Storage requirements', 'Query complexity'],
        implementationDetails: 'Event Store with CQRS for reporting'
      }
    ],
    technologyStack: [
      {
        category: 'backend',
        technologies: [
          { name: 'Next.js', version: '14+', purpose: 'API and SSR', required: true },
          { name: 'PostgreSQL', version: '15+', purpose: 'Primary database', required: true }
        ]
      },
      {
        category: 'frontend',
        technologies: [
          { name: 'React', version: '18+', purpose: 'UI framework', required: true },
          { name: 'React Native', purpose: 'Mobile incident reporting', required: false }
        ]
      }
    ],
    securityRequirements: [
      {
        domain: 'data',
        requirement: 'Immutable safety records with tamper-evident logging',
        criticality: 'critical',
        implementation: 'Event sourcing with cryptographic hashing',
        standardsAddressed: ['OSHA Recordkeeping', 'ISO 45001']
      }
    ],
    performanceRequirements: [
      {
        metricType: 'availability',
        targetValue: '99.9% uptime',
        measurementMethod: 'Health monitoring',
        slaTier: 'platinum'
      }
    ],
    integrationPatterns: [
      {
        type: 'event-driven',
        protocol: 'Webhooks, Event Bus',
        dataFormat: 'JSON',
        description: 'Real-time safety alerts and notifications',
        useCases: ['Incident alerts', 'Inspection reminders', 'Training expiry']
      }
    ],
    scalabilityApproach: 'Horizontal scaling with multi-tenant isolation',
    highAvailability: 'Multi-region with automatic failover',
    disasterRecovery: 'RPO: 5 minutes, RTO: 30 minutes',
    dataArchitecture: 'Event sourced with read replicas for reporting'
  },

  sales: {
    targetPersonas: [
      {
        name: 'EHS Director',
        jobTitles: ['EHS Director', 'VP EHS', 'Safety Director'],
        department: 'Environment, Health & Safety',
        seniority: 'director',
        responsibilities: ['Safety program management', 'Regulatory compliance', 'Incident reduction'],
        painPoints: ['Manual processes', 'Scattered data', 'Audit preparation', 'Reporting burden'],
        goals: ['Zero incidents', 'Regulatory compliance', 'Safety culture', 'ESG reporting'],
        commonObjections: ['Implementation effort', 'User adoption', 'Data migration'],
        keyMessaging: ['Reduce incidents by 50%', 'Automated compliance', 'ESG-ready'],
        decisionRole: 'decision-maker'
      }
    ],
    useCases: [
      {
        name: 'Manufacturing Safety Excellence',
        industry: 'Manufacturing',
        scenario: 'Manufacturer with 5 facilities and 2000 employees needs unified safety management',
        problemAddressed: 'Inconsistent safety practices, manual tracking, audit struggles',
        solution: 'Centralized QHSE platform with mobile incident reporting',
        benefits: ['40% incident reduction', '70% faster audits', '100% training compliance'],
        roiMetrics: ['$500K annual savings', '50% reduction in recordable incidents']
      }
    ],
    keySellingPoints: ['Integrated with operations', 'Mobile-first', 'ESG-ready', 'Multi-site support'],
    competitiveAdvantages: ['Operational data context', '3PL multi-tenant', 'Supply chain integration'],
    objectionHandling: [
      {
        objection: 'We have a safety spreadsheet that works',
        response: 'Spreadsheets create compliance risk and cannot support proactive safety management, real-time alerts, or audit readiness that regulators now expect.'
      }
    ],
    pricingConsiderations: {
      model: 'per-user',
      valueDrivers: ['Number of facilities', 'Employees', 'Industry complexity'],
      costFactors: ['User licenses', 'Mobile users'],
      competitivePositioning: 'Premium positioned for enterprise',
      upsellOpportunities: ['Mobile', 'Advanced analytics', 'ESG reporting']
    },
    demoScenarios: ['Incident reporting workflow', 'Dashboard walkthrough', 'Audit preparation'],
    proofPoints: ['Case studies', 'Compliance certifications', 'ROI calculator'],
    salesMaterials: ['Solution brief', 'Industry guides', 'ROI calculator', 'Demo']
  },

  implementation: {
    phases: [
      {
        name: 'Discovery & Configuration',
        phase: 1,
        duration: '2 weeks',
        activities: ['Requirements gathering', 'Process mapping', 'Configuration'],
        deliverables: ['Configured system', 'Process documentation'],
        successCriteria: ['System configured', 'Test data validated'],
        dependencies: ['Business requirements', 'Org structure'],
        risks: ['Process complexity']
      },
      {
        name: 'Data Migration',
        phase: 2,
        duration: '1 week',
        activities: ['Historical data migration', 'Validation'],
        deliverables: ['Migrated data', 'Validation report'],
        successCriteria: ['Data accuracy verified'],
        dependencies: ['Source data access'],
        risks: ['Data quality']
      },
      {
        name: 'Training & Rollout',
        phase: 3,
        duration: '2 weeks',
        activities: ['User training', 'Phased rollout', 'Support'],
        deliverables: ['Trained users', 'Live system'],
        successCriteria: ['User adoption', 'System stability'],
        dependencies: ['User availability'],
        risks: ['User adoption']
      }
    ],
    prerequisites: [
      {
        category: 'organizational',
        requirement: 'Executive sponsor from EHS leadership',
        criticality: 'blocking',
        validationMethod: 'Sponsor identified and committed'
      }
    ],
    bestPractices: [
      {
        category: 'adoption',
        practice: 'Start with incident reporting to demonstrate immediate value',
        rationale: 'Quick wins build momentum for broader adoption',
        guidance: 'Deploy mobile incident reporting first'
      }
    ],
    commonPitfalls: [
      {
        pitfall: 'Trying to implement everything at once',
        impact: 'User overwhelm, delayed value realization',
        avoidance: 'Phased rollout starting with core modules',
        recovery: 'Prioritize and simplify'
      }
    ],
    resourceRequirements: [
      { role: 'EHS Lead', effort: '50%', skills: ['EHS expertise', 'Change management'] },
      { role: 'System Administrator', effort: '25%', skills: ['System configuration'] }
    ],
    trainingRequirements: ['EHS Administrator Training (2 days)', 'User Training (4 hours)', 'Mobile Training (1 hour)'],
    changeManagement: ['Leadership commitment', 'User communication', 'Champions network'],
    successMetrics: ['Incident reporting rate', 'Training compliance', 'Audit readiness score']
  },

  sustainability: {
    environmentalImpacts: [
      {
        category: 'emissions',
        type: 'monitoring',
        description: 'Track and reduce greenhouse gas emissions',
        metrics: ['Scope 1, 2, 3 emissions', 'Carbon intensity'],
        goalContribution: 'Net-zero progress tracking'
      },
      {
        category: 'waste',
        type: 'reduction',
        description: 'Monitor and reduce waste generation',
        metrics: ['Waste diversion rate', 'Recycling rate'],
        goalContribution: 'Zero waste to landfill tracking'
      }
    ],
    esgAlignment: [
      {
        pillar: 'environmental',
        aspect: 'Environmental Management',
        contribution: 'Complete environmental monitoring and reporting',
        reportingFrameworks: ['GRI', 'CDP', 'TCFD', 'SASB'],
        sdgAlignment: [3, 6, 7, 12, 13, 14, 15]
      },
      {
        pillar: 'social',
        aspect: 'Worker Health & Safety',
        contribution: 'Comprehensive worker safety management',
        reportingFrameworks: ['GRI', 'SASB'],
        sdgAlignment: [3, 8]
      },
      {
        pillar: 'governance',
        aspect: 'Risk Management',
        contribution: 'EHS risk identification and management',
        reportingFrameworks: ['GRI'],
        sdgAlignment: [16]
      }
    ],
    carbonFootprint: {
      directImpact: 'Minimal cloud-based solution',
      indirectBenefits: ['Energy efficiency monitoring', 'Emissions reduction tracking', 'Paperless operations'],
      offsetOpportunities: ['Carbon offset tracking', 'Renewable energy tracking']
    },
    circularEconomy: ['Waste tracking', 'Recycling programs', 'Resource efficiency'],
    certifications: ['ISO 14001', 'ISO 50001', 'Carbon Trust']
  },

  documentation: {
    documentation: [
      {
        type: 'user-guide',
        title: 'QHSE User Guide',
        description: 'Comprehensive guide for QHSE system users',
        targetAudience: ['EHS staff', 'Supervisors', 'Employees'],
        status: 'available'
      },
      {
        type: 'compliance',
        title: 'Regulatory Compliance Guide',
        description: 'Guide for meeting regulatory requirements',
        targetAudience: ['EHS Directors', 'Compliance Officers'],
        status: 'available'
      }
    ],
    supportRequirements: {
      tier: 'enterprise',
      channels: ['24/7 Phone', 'Email', 'Chat', 'Dedicated CSM'],
      responseTimes: [
        { priority: 'Critical (P1)', responseTime: '15 minutes', resolutionTime: '4 hours' },
        { priority: 'High (P2)', responseTime: '1 hour', resolutionTime: '8 hours' }
      ],
      escalationPath: ['L1 Support', 'L2 EHS Specialist', 'L3 Engineering', 'Product']
    },
    trainingPrograms: [
      {
        name: 'QHSE Administrator Certification',
        type: 'certification',
        duration: '2 days',
        targetAudience: 'EHS Administrators'
      },
      {
        name: 'Mobile Incident Reporting',
        type: 'self-paced',
        duration: '1 hour',
        targetAudience: 'All employees'
      }
    ],
    knowledgeBaseTopics: ['Incident reporting', 'Inspection management', 'Training tracking', 'ESG reporting'],
    videoTutorials: ['System overview', 'Incident workflow', 'Mobile app', 'Reporting']
  },

  moduleDependencies: ['compliance', 'reporting', 'notifications'],
  serviceDependencies: [
    'lib/services/qhse/incidentService.ts',
    'lib/services/qhse/inspectionService.ts',
    'lib/services/qhse/trainingService.ts'
  ],
  externalIntegrations: ['OSHA electronic submission', 'Wearable devices', 'IoT sensors'],
  apiDependencies: ['/api/qhse/incidents', '/api/qhse/inspections', '/api/qhse/training'],

  lastUpdated: '2025-01-27',
  owner: 'QHSE Product Team',
  contributors: ['Compliance', 'Operations', 'Sustainability'],
  version: '2.0.0',
  tags: ['qhse', 'safety', 'environment', 'quality', 'compliance', 'esg', 'sustainability', 'incidents']
};

// =============================================================================
// COLLECTION OF ALL PLAYBOOKS
// =============================================================================

export const allPlaybooks: FeaturePlaybook[] = [
  dashboardManagementPlaybook,
  qhseDashboardPlaybook,
  // Additional playbooks will be added
];

// =============================================================================
// PLAYBOOK REGISTRY WITH TOOLTIPS
// =============================================================================

export const playbookTooltips: Record<string, Record<string, { summary: string; details: string; keyPoints: string[] }>> = {
  'dashboard-management': {
    'widget-library': {
      summary: '50+ pre-built visualization widgets',
      details: 'Comprehensive library of charts, tables, KPIs, and custom widgets optimized for supply chain analytics.',
      keyPoints: ['Charts (line, bar, pie, area)', 'KPI cards', 'Tables with sorting/filtering', 'Maps and geospatial', 'Custom widgets']
    },
    'real-time-updates': {
      summary: 'Live data streaming without page refresh',
      details: 'WebSocket and Server-Sent Events enable real-time data updates to dashboards without manual refresh.',
      keyPoints: ['Sub-second latency', 'Automatic reconnection', 'Bandwidth optimization', 'Configurable refresh rates']
    },
    'role-based-access': {
      summary: 'Widget-level permissions based on user role',
      details: 'Granular access control ensures users only see widgets and data appropriate for their role.',
      keyPoints: ['11 predefined roles', 'Widget-level permissions', 'Data-level filtering', 'Audit logging']
    }
  },
  'qhse-dashboard': {
    'incident-management': {
      summary: 'Complete incident lifecycle management',
      details: 'From initial report to investigation, root cause analysis, and corrective actions.',
      keyPoints: ['Mobile reporting', 'Investigation workflow', 'Root cause analysis', 'CAPA tracking', 'Regulatory reporting']
    },
    'safety-metrics': {
      summary: 'Industry-standard safety performance indicators',
      details: 'Track TRIR, LTIFR, and other safety KPIs aligned with OSHA and industry standards.',
      keyPoints: ['TRIR calculation', 'LTIFR tracking', 'Near-miss rates', 'Leading indicators', 'Trend analysis']
    },
    'esg-reporting': {
      summary: 'Environmental, Social, and Governance reporting',
      details: 'Automated ESG report generation aligned with GRI, SASB, and TCFD frameworks.',
      keyPoints: ['GRI Standards', 'SASB metrics', 'TCFD disclosures', 'UN SDG alignment', 'Automated reports']
    }
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getAllPlaybooks(): FeaturePlaybook[] {
  return allPlaybooks;
}

export function getPlaybookCount(): number {
  return allPlaybooks.length;
}

export function getPlaybooksByCategory(category: string): FeaturePlaybook[] {
  return allPlaybooks.filter(p => p.category === category);
}

export function getPlaybookTooltip(playbookId: string, itemId: string) {
  return playbookTooltips[playbookId]?.[itemId];
}

export function searchPlaybooks(query: string): FeaturePlaybook[] {
  const lowerQuery = query.toLowerCase();
  return allPlaybooks.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

