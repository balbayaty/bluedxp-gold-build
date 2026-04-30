/**
 * Integrated Management System (IMS) Playbook
 * =============================================
 * ISO-aligned comprehensive management system
 */

import { FeaturePlaybook } from '@/types/featurePlaybook';

// =============================================================================
// 8. INTEGRATED MANAGEMENT SYSTEM (ISO-IMS)
// =============================================================================

export const imsPlaybook: FeaturePlaybook = {
  id: 'iso-ims',
  name: 'Integrated Management System (IMS)',
  description: 'Unified platform for managing quality, environment, safety, energy, and information security according to ISO standards with full certification readiness.',
  category: 'Compliance & Governance',
  modules: ['ims', 'quality', 'environment', 'safety', 'energy'],
  
  status: 'production',
  priority: 'CRITICAL',
  phase: 1,
  estimatedTime: '12-16 weeks',
  complexity: 'highly-complex',
  
  capabilities: [
    'Document Control & Management',
    'Audit Management',
    'Non-Conformance & CAPA',
    'Risk & Opportunity Management',
    'Objectives & KPI Tracking',
    'Management Review',
    'Training & Competence',
    'Change Management',
    'Supplier Quality Management',
    'Internal Communication'
  ],
  keyFeatures: [
    'Multi-standard support (ISO 9001, 14001, 45001, 50001, 27001)',
    'Unified document control with version management',
    'Automated audit scheduling and execution',
    'CAPA workflow with root cause analysis',
    'Risk register with heat map visualization',
    'Objectives cascade from corporate to operational',
    'Training matrix with competence tracking',
    'Change request workflow with impact assessment',
    'Supplier evaluation and scorecard',
    'Management review preparation and minutes'
  ],
  benefits: [
    'Achieve multi-standard certification in single audit',
    'Reduce documentation effort by 60%',
    'Improve audit readiness to 100%',
    'Reduce non-conformances by 50%',
    'Enable continuous improvement culture',
    'Streamline management reviews'
  ],

  compliance: {
    standards: [
      {
        code: 'ISO 9001:2015',
        name: 'Quality Management System',
        category: 'quality',
        description: 'The international standard for quality management systems',
        requirement: 'mandatory',
        certificationBody: 'Accredited CB',
        regions: ['global'],
        complianceContribution: 'Complete QMS implementation with all clauses addressed',
        clausesAddressed: ['Clause 4 Context', 'Clause 5 Leadership', 'Clause 6 Planning', 'Clause 7 Support', 'Clause 8 Operation', 'Clause 9 Evaluation', 'Clause 10 Improvement']
      },
      {
        code: 'ISO 14001:2015',
        name: 'Environmental Management System',
        category: 'environmental',
        description: 'The international standard for environmental management',
        requirement: 'mandatory',
        certificationBody: 'Accredited CB',
        regions: ['global'],
        complianceContribution: 'Complete EMS with aspects, impacts, and compliance obligations',
        clausesAddressed: ['Environmental aspects', 'Compliance obligations', 'Operational controls', 'Emergency preparedness']
      },
      {
        code: 'ISO 45001:2018',
        name: 'Occupational Health and Safety',
        category: 'safety',
        description: 'The international standard for OH&S management',
        requirement: 'mandatory',
        certificationBody: 'Accredited CB',
        regions: ['global'],
        complianceContribution: 'Complete OH&S MS with hazard identification and risk controls',
        clausesAddressed: ['Hazard identification', 'Risk assessment', 'Legal requirements', 'Worker participation', 'Emergency response']
      },
      {
        code: 'ISO 50001:2018',
        name: 'Energy Management System',
        category: 'energy',
        description: 'The international standard for energy management',
        requirement: 'recommended',
        certificationBody: 'Accredited CB',
        regions: ['global'],
        complianceContribution: 'Energy review, EnPIs, energy baseline, and improvement planning',
        clausesAddressed: ['Energy review', 'Energy baseline', 'EnPIs', 'Energy objectives', 'Operational control']
      },
      {
        code: 'ISO 27001:2022',
        name: 'Information Security Management System',
        category: 'security',
        description: 'The international standard for information security management',
        requirement: 'recommended',
        certificationBody: 'Accredited CB',
        regions: ['global'],
        complianceContribution: 'ISMS with 93 controls from Annex A',
        clausesAddressed: ['Information security policy', 'Risk treatment', 'Statement of Applicability', 'Controls', 'Monitoring']
      }
    ],
    governanceFrameworks: [
      {
        name: 'ISO Annex SL (High-Level Structure)',
        type: 'compliance',
        description: 'Common framework for all ISO management system standards',
        principles: ['Context', 'Leadership', 'Planning', 'Support', 'Operation', 'Performance Evaluation', 'Improvement'],
        featureContribution: 'Built on HLS for seamless integration across standards',
        maturityLevel: 5
      }
    ],
    auditRequirements: [
      {
        type: 'internal',
        frequency: 'annual (minimum)',
        scope: 'All processes and locations against all applicable standards',
        evidenceRequired: ['Audit reports', 'NCR records', 'CAPA evidence', 'Management review minutes'],
        auditTrailNeeds: ['Document revisions', 'Process changes', 'Corrective actions']
      },
      {
        type: 'external',
        frequency: 'annual surveillance, triennial recertification',
        scope: 'Certification audit against ISO standards',
        evidenceRequired: ['Complete IMS documentation', 'Records', 'Performance data'],
        auditTrailNeeds: ['All audit findings', 'Closure evidence']
      }
    ],
    complianceScoreImpact: 100,
    riskReductionPercentage: 85,
    certificationReadiness: [
      { certification: 'ISO 9001', readinessPercentage: 95, gapsToAddress: [] },
      { certification: 'ISO 14001', readinessPercentage: 90, gapsToAddress: ['Environmental aspects register completion'] },
      { certification: 'ISO 45001', readinessPercentage: 92, gapsToAddress: ['Risk assessment updates'] },
      { certification: 'ISO 50001', readinessPercentage: 85, gapsToAddress: ['Energy baseline calculation'] },
      { certification: 'ISO 27001', readinessPercentage: 88, gapsToAddress: ['Statement of Applicability update'] }
    ]
  },

  regulatory: {
    regulatoryBodies: [
      {
        code: 'IAF',
        name: 'International Accreditation Forum',
        jurisdiction: 'global',
        type: 'international',
        website: 'https://www.iaf.nu',
        keyRegulations: ['Accreditation Requirements', 'MLA Agreements'],
        complianceSupport: 'Accredited certification body management'
      },
      {
        code: 'ISO',
        name: 'International Organization for Standardization',
        jurisdiction: 'global',
        type: 'international',
        website: 'https://www.iso.org',
        keyRegulations: ['ISO Standards', 'Management System Standards'],
        complianceSupport: 'Full ISO standard implementation'
      }
    ],
    laws: [
      {
        name: 'Environmental Protection Laws (Various)',
        code: 'Environmental',
        jurisdiction: 'global',
        yearEnacted: 1970,
        category: 'environmental',
        keyProvisions: ['Emissions limits', 'Waste disposal', 'Permits'],
        penalties: 'Varies by jurisdiction',
        featureContribution: 'Compliance obligations register and tracking'
      },
      {
        name: 'Occupational Safety Laws (Various)',
        code: 'OH&S',
        jurisdiction: 'global',
        yearEnacted: 1970,
        category: 'safety',
        keyProvisions: ['Safe workplace', 'Training', 'PPE', 'Reporting'],
        penalties: 'Varies by jurisdiction',
        featureContribution: 'Legal register and compliance verification'
      }
    ],
    regulations: [
      {
        name: 'ISO 19011:2018 Audit Guidelines',
        code: 'ISO 19011',
        authority: 'ISO',
        type: 'guidance',
        effectiveDate: '2018-07-01',
        summary: 'Guidelines for auditing management systems',
        requirements: ['Audit principles', 'Audit program', 'Auditor competence'],
        documentationRequired: ['Audit program', 'Audit reports'],
        reportingObligations: ['Audit findings communication'],
        featureCompliance: 'Complete audit management aligned with ISO 19011'
      }
    ],
    tradeCompliance: [],
    upcomingChanges: [
      {
        regulation: 'ISO 9001 Revision',
        expectedDate: '2026-01-01',
        impact: 'medium',
        preparationNeeded: 'Monitor revision progress, plan transition'
      }
    ],
    jurisdictionalCoverage: ['global']
  },

  industry: {
    standards: [
      {
        code: 'IATF 16949',
        name: 'Automotive Quality Management',
        organization: 'IATF',
        category: 'quality',
        version: '2016',
        description: 'Quality management for automotive industry',
        specifications: ['Core tools', 'Customer-specific requirements', 'APQP'],
        implementationRequirements: ['PPAP', 'FMEA', 'MSA', 'SPC'],
        featureImplementation: 'IATF 16949 extension modules'
      },
      {
        code: 'AS9100',
        name: 'Aerospace Quality Management',
        organization: 'IAQG',
        category: 'quality',
        version: 'Rev D',
        description: 'Quality management for aerospace industry',
        specifications: ['Product safety', 'Configuration management', 'Special processes'],
        implementationRequirements: ['FAI', 'OASIS', 'Special process controls'],
        featureImplementation: 'AS9100 extension modules'
      }
    ],
    authorities: [
      {
        name: 'ASQ - American Society for Quality',
        type: 'professional-body',
        focusArea: 'Quality management excellence',
        keyStandards: ['Lean', 'Six Sigma', 'Quality Tools'],
        featureAlignment: 'Quality tools and methodologies'
      },
      {
        name: 'IEMA - Institute of Environmental Management',
        type: 'professional-body',
        focusArea: 'Environmental management',
        keyStandards: ['EMS best practices', 'Sustainability'],
        featureAlignment: 'Environmental management best practices'
      }
    ],
    bestPractices: [
      {
        name: 'Plan-Do-Check-Act (PDCA)',
        category: 'Management',
        description: 'Core improvement methodology underlying ISO HLS',
        principles: ['Plan objectives', 'Do implement', 'Check monitor', 'Act improve'],
        implementationGuidance: 'Apply PDCA to all management system processes',
        maturityIndicators: ['Improvement rate', 'Objective achievement', 'NCR reduction'],
        featureImplementation: 'PDCA workflow embedded in all processes'
      },
      {
        name: 'Risk-Based Thinking',
        category: 'Risk',
        description: 'Proactive risk identification and treatment',
        principles: ['Risk identification', 'Analysis', 'Evaluation', 'Treatment', 'Monitoring'],
        implementationGuidance: 'Integrate risk management into all processes',
        maturityIndicators: ['Risks identified', 'Treatments implemented', 'Incidents prevented'],
        featureImplementation: 'Comprehensive risk management module'
      }
    ],
    verticalsServed: ['Manufacturing', 'Aerospace', 'Automotive', 'Healthcare', 'Oil & Gas', 'Construction', 'Services'],
    industryRequirements: [
      {
        industry: 'Automotive',
        requirements: ['IATF 16949', 'Core tools', 'CSR management'],
        featureSupport: 'IATF 16949 extension with core tools'
      },
      {
        industry: 'Aerospace',
        requirements: ['AS9100', 'FAI', 'Special processes'],
        featureSupport: 'AS9100 extension with FAI management'
      },
      {
        industry: 'Healthcare',
        requirements: ['ISO 13485', 'FDA QSR', 'Risk management'],
        featureSupport: 'ISO 13485 extension for medical devices'
      }
    ]
  },

  strategic: {
    industrialAlignment: [
      {
        revolution: '4IR',
        alignmentScore: 75,
        pillarsAddressed: ['Cloud', 'Big Data', 'Automation'],
        technologiesLeveraged: ['Cloud platform', 'Analytics', 'Workflow automation'],
        capabilitiesEnabled: ['Digital IMS', 'Real-time dashboards', 'Automated workflows']
      },
      {
        revolution: '5IR',
        alignmentScore: 85,
        pillarsAddressed: ['Sustainability', 'Human-Centric', 'Resilience'],
        technologiesLeveraged: ['ESG integration', 'Worker engagement', 'Risk management'],
        capabilitiesEnabled: ['Sustainability management', 'Employee engagement', 'Business continuity'],
        humanCentricAspects: ['Worker participation', 'Competence development', 'Health & safety'],
        sustainabilityContributions: ['Environmental performance', 'Energy efficiency', 'Social responsibility']
      }
    ],
    platformAlignment: [
      {
        strategicPillar: 'compliance',
        alignmentStrength: 'core',
        visionContribution: 'Foundation for enterprise governance and compliance',
        crossModuleSynergies: ['QHSE integration', 'Trade compliance', 'Supplier management'],
        ecosystemValue: 'Governance backbone for enterprise operations'
      }
    ],
    valuePropositions: [
      {
        category: 'compliance',
        statement: 'Achieve multi-standard certification with unified IMS',
        quantifiedBenefit: 'Single audit for multiple certifications',
        roiTimeframe: '12 months',
        proofPoints: ['Certification success rates', 'Audit cost reduction']
      },
      {
        category: 'efficiency',
        statement: 'Reduce documentation effort by 60%',
        quantifiedBenefit: '60% reduction in document management time',
        roiTimeframe: '3 months',
        proofPoints: ['Before/after metrics', 'User feedback']
      }
    ],
    strategicImportance: 9,
    marketDifferentiation: ['Multi-standard integration', 'HLS architecture', 'Audit-ready'],
    competitiveMoat: ['ISO expertise', 'Industry extensions', 'Auditor partnerships'],
    roadmapPosition: 'foundational'
  },

  market: {
    trends: [
      {
        name: 'Integrated Management Systems',
        category: 'governance',
        maturity: 'mature',
        impact: 'significant',
        timeHorizon: 'immediate',
        description: 'Organizations seeking unified approach to multiple standards',
        featureResponse: 'Single platform for all ISO management systems',
        marketDrivers: ['Cost efficiency', 'Audit fatigue', 'Synergy realization'],
        statistics: ['60% of certified organizations seek integration']
      },
      {
        name: 'ESG & Sustainability Integration',
        category: 'sustainability',
        maturity: 'growing',
        impact: 'transformational',
        timeHorizon: 'immediate',
        description: 'Integrating ESG requirements into management systems',
        featureResponse: 'ESG framework integration with ISO standards',
        marketDrivers: ['Investor demands', 'Regulations', 'Stakeholder expectations'],
        statistics: ['ESG reporting now required for most public companies']
      }
    ],
    technologyTrends: [
      {
        name: 'AI in Audit and Compliance',
        category: 'ai-ml',
        adoptionStage: 'early-adopter',
        relevance: 'enabling',
        description: 'AI for audit planning, gap analysis, and compliance monitoring',
        featureLeverage: 'AI-assisted audit and compliance analysis'
      }
    ],
    competitiveLandscape: {
      competitorType: 'direct',
      keyCompetitors: ['SAP EHS', 'Intelex', 'ETQ', 'Sparta Systems', 'Ideagen'],
      ourDifferentiators: ['Unified platform', 'HLS native architecture', 'Industry extensions'],
      competitiveAdvantages: ['Integration depth', 'Modern UX', 'Rapid deployment'],
      areasForImprovement: ['Industry certifications', 'Auditor ecosystem'],
      marketPositioning: 'Modern integrated IMS for enterprises'
    },
    marketOpportunity: {
      totalAddressableMarket: '$15B by 2028',
      serviceableMarket: '$3B (Enterprise IMS)',
      growthRate: '9.5% CAGR',
      keySegments: ['Manufacturing', 'Healthcare', 'Aerospace', 'Automotive']
    },
    targetIndustries: ['Manufacturing', 'Aerospace', 'Automotive', 'Healthcare', 'Oil & Gas', 'Construction'],
    geographicOpportunities: ['global']
  },

  technical: {
    architecturePatterns: [
      {
        name: 'Hierarchical Document Structure',
        type: 'data',
        description: 'Multi-level document hierarchy for management system documentation',
        whenToUse: 'For organizing policies, procedures, work instructions',
        benefits: ['Clear structure', 'Easy navigation', 'Compliance mapping'],
        tradeoffs: ['Hierarchy rigidity'],
        implementationDetails: 'Tree structure with document types and versioning'
      }
    ],
    technologyStack: [
      {
        category: 'backend',
        technologies: [
          { name: 'Next.js', version: '14+', purpose: 'Full-stack framework', required: true },
          { name: 'PostgreSQL', version: '15+', purpose: 'Primary database', required: true }
        ]
      },
      {
        category: 'frontend',
        technologies: [
          { name: 'React', version: '18+', purpose: 'UI framework', required: true }
        ]
      }
    ],
    securityRequirements: [
      {
        domain: 'access',
        requirement: 'Role-based access control with document-level security',
        criticality: 'critical',
        implementation: 'RBAC with document ownership model',
        standardsAddressed: ['ISO 27001 A.9']
      },
      {
        domain: 'audit',
        requirement: 'Complete audit trail for all document and record changes',
        criticality: 'critical',
        implementation: 'Event sourcing for documents',
        standardsAddressed: ['ISO 9001 7.5', 'ISO 27001 A.12.4']
      }
    ],
    performanceRequirements: [
      {
        metricType: 'availability',
        targetValue: '99.9% uptime',
        measurementMethod: 'Health monitoring',
        slaTier: 'enterprise'
      }
    ],
    integrationPatterns: [
      {
        type: 'api',
        protocol: 'REST',
        dataFormat: 'JSON',
        description: 'Integration with ERP, HR, and operational systems',
        useCases: ['Employee sync', 'Asset integration', 'Process data']
      }
    ],
    scalabilityApproach: 'Multi-tenant with tenant-isolated storage',
    highAvailability: 'Multi-region active-passive',
    disasterRecovery: 'RPO: 15 minutes, RTO: 1 hour',
    dataArchitecture: 'Hierarchical documents with versioning'
  },

  sales: {
    targetPersonas: [
      {
        name: 'Quality Director',
        jobTitles: ['Quality Director', 'VP Quality', 'Quality Manager'],
        department: 'Quality',
        seniority: 'director',
        responsibilities: ['QMS management', 'Certifications', 'Continuous improvement'],
        painPoints: ['Multiple disconnected systems', 'Audit preparation', 'Documentation burden'],
        goals: ['Certification success', 'Efficiency', 'Continuous improvement'],
        commonObjections: ['Change management', 'User adoption', 'Migration effort'],
        keyMessaging: ['Unified IMS', 'Audit-ready', '60% documentation reduction'],
        decisionRole: 'decision-maker'
      },
      {
        name: 'EHS Director',
        jobTitles: ['EHS Director', 'VP EHS', 'HSE Manager'],
        department: 'Environment Health & Safety',
        seniority: 'director',
        responsibilities: ['EMS/OH&S management', 'Compliance', 'Incident prevention'],
        painPoints: ['Regulatory complexity', 'Incident tracking', 'Training compliance'],
        goals: ['Zero incidents', 'Regulatory compliance', 'Certification'],
        commonObjections: ['Integration with operations', 'Field adoption'],
        keyMessaging: ['Integrated EHS', 'Incident reduction', 'Compliance assurance'],
        decisionRole: 'decision-maker'
      }
    ],
    useCases: [
      {
        name: 'Multi-Standard Certification',
        industry: 'Manufacturing',
        scenario: 'Manufacturer seeking ISO 9001, 14001, and 45001 certification',
        problemAddressed: 'Separate systems, duplicated effort, audit fatigue',
        solution: 'Integrated IMS covering all three standards',
        benefits: ['Single audit', '50% effort reduction', '100% certification'],
        roiMetrics: ['$500K audit cost savings', '60% documentation reduction']
      }
    ],
    keySellingPoints: ['Multi-standard integration', 'HLS architecture', 'Audit-ready', 'Industry extensions'],
    competitiveAdvantages: ['True integration', 'Modern UX', 'Rapid deployment'],
    objectionHandling: [
      {
        objection: 'We already have separate systems for each standard',
        response: 'Integration eliminates duplication and reduces effort by 60%. One audit covers all standards.'
      }
    ],
    pricingConsiderations: {
      model: 'per-user',
      valueDrivers: ['Users', 'Standards', 'Locations'],
      costFactors: ['User licenses', 'Extensions'],
      competitivePositioning: 'Value leader for integrated IMS',
      upsellOpportunities: ['Industry extensions', 'Consulting', 'Training']
    },
    demoScenarios: ['Document control', 'Audit workflow', 'CAPA management', 'Dashboard'],
    proofPoints: ['Certification success stories', 'Audit savings'],
    salesMaterials: ['Solution brief', 'Demo', 'ROI calculator', 'Case studies']
  },

  implementation: {
    phases: [
      {
        name: 'Assessment & Planning',
        phase: 1,
        duration: '3 weeks',
        activities: ['Current state assessment', 'Gap analysis', 'Implementation planning'],
        deliverables: ['Gap analysis report', 'Implementation plan'],
        successCriteria: ['Gaps identified', 'Plan approved'],
        dependencies: ['Existing documentation access'],
        risks: ['Scope underestimation']
      },
      {
        name: 'Configuration & Migration',
        phase: 2,
        duration: '4 weeks',
        activities: ['System configuration', 'Document migration', 'Process setup'],
        deliverables: ['Configured system', 'Migrated documents'],
        successCriteria: ['Documents migrated', 'Processes configured'],
        dependencies: ['Content availability'],
        risks: ['Migration complexity']
      },
      {
        name: 'Training & Rollout',
        phase: 3,
        duration: '3 weeks',
        activities: ['User training', 'Phased rollout', 'Change management'],
        deliverables: ['Trained users', 'Live system'],
        successCriteria: ['Training complete', 'System live'],
        dependencies: ['User availability'],
        risks: ['User adoption']
      },
      {
        name: 'Certification Support',
        phase: 4,
        duration: '4 weeks',
        activities: ['Internal audit', 'Pre-certification review', 'Audit support'],
        deliverables: ['Audit-ready system', 'Certification achieved'],
        successCriteria: ['Certification obtained'],
        dependencies: ['Auditor scheduling'],
        risks: ['Audit findings']
      }
    ],
    prerequisites: [
      {
        category: 'organizational',
        requirement: 'Management commitment to IMS integration',
        criticality: 'blocking',
        validationMethod: 'Steering committee approval'
      }
    ],
    bestPractices: [
      {
        category: 'adoption',
        practice: 'Start with document control and build from there',
        rationale: 'Document control touches everyone and builds familiarity',
        guidance: 'Deploy document control first, then add audit, CAPA, etc.'
      }
    ],
    commonPitfalls: [
      {
        pitfall: 'Trying to implement all standards simultaneously',
        impact: 'Overwhelm, delays, failure',
        avoidance: 'Phased approach starting with priority standard',
        recovery: 'Prioritize and sequence'
      }
    ],
    resourceRequirements: [
      { role: 'IMS Project Manager', effort: '100%', skills: ['ISO knowledge', 'Project management'] },
      { role: 'Quality Representative', effort: '50%', skills: ['QMS expertise'] },
      { role: 'EHS Representative', effort: '50%', skills: ['EMS/OH&S expertise'] }
    ],
    trainingRequirements: ['IMS Administrator (3 days)', 'User Training (1 day)', 'Auditor Training (2 days)'],
    changeManagement: ['Leadership commitment', 'User communication', 'Training program'],
    successMetrics: ['Certification achievement', 'User adoption', 'Document compliance', 'Audit findings']
  },

  sustainability: {
    environmentalImpacts: [
      {
        category: 'resource',
        type: 'reduction',
        description: 'Paperless document management',
        metrics: ['Paper reduction', 'Digital adoption %'],
        goalContribution: 'Reduce paper usage through digital transformation'
      },
      {
        category: 'energy',
        type: 'monitoring',
        description: 'Energy performance tracking and improvement',
        metrics: ['EnPIs', 'Energy consumption', 'Efficiency'],
        goalContribution: 'Drive energy efficiency improvements'
      }
    ],
    esgAlignment: [
      {
        pillar: 'environmental',
        aspect: 'Environmental Management',
        contribution: 'Complete EMS implementation',
        reportingFrameworks: ['GRI', 'CDP', 'ISO 14001'],
        sdgAlignment: [12, 13]
      },
      {
        pillar: 'social',
        aspect: 'Occupational Health & Safety',
        contribution: 'Complete OH&S management',
        reportingFrameworks: ['GRI', 'ISO 45001'],
        sdgAlignment: [3, 8]
      },
      {
        pillar: 'governance',
        aspect: 'Quality & Compliance',
        contribution: 'Robust governance framework',
        reportingFrameworks: ['GRI', 'ISO standards'],
        sdgAlignment: [16]
      }
    ],
    carbonFootprint: {
      directImpact: 'Cloud-based reduces on-premise footprint',
      indirectBenefits: ['Paperless operations', 'Energy tracking', 'Improvement projects'],
      offsetOpportunities: []
    },
    circularEconomy: [],
    certifications: ['ISO 14001 support', 'ISO 50001 support']
  },

  documentation: {
    documentation: [
      {
        type: 'user-guide',
        title: 'IMS User Guide',
        description: 'Comprehensive guide for IMS users',
        targetAudience: ['Quality professionals', 'EHS professionals'],
        status: 'available'
      },
      {
        type: 'implementation',
        title: 'IMS Implementation Guide',
        description: 'Step-by-step implementation guidance',
        targetAudience: ['Implementation team'],
        status: 'available'
      }
    ],
    supportRequirements: {
      tier: 'enterprise',
      channels: ['24/7 Phone', 'Email', 'Chat', 'Dedicated CSM'],
      responseTimes: [
        { priority: 'Critical (P1)', responseTime: '15 minutes', resolutionTime: '2 hours' },
        { priority: 'High (P2)', responseTime: '1 hour', resolutionTime: '4 hours' }
      ],
      escalationPath: ['L1 Support', 'L2 IMS Specialist', 'L3 ISO Expert']
    },
    trainingPrograms: [
      {
        name: 'IMS Administrator Certification',
        type: 'certification',
        duration: '3 days',
        targetAudience: 'IMS administrators'
      },
      {
        name: 'Internal Auditor Training',
        type: 'professional-development',
        duration: '2 days',
        targetAudience: 'Internal auditors'
      }
    ],
    knowledgeBaseTopics: ['Document control', 'Audit management', 'CAPA', 'Risk management', 'ISO standards'],
    videoTutorials: ['System overview', 'Document management', 'Audit workflow', 'CAPA management']
  },

  moduleDependencies: ['document-management', 'workflow', 'reporting'],
  serviceDependencies: [
    'lib/services/ims/documentService.ts',
    'lib/services/ims/auditService.ts',
    'lib/services/ims/capaService.ts',
    'lib/services/ims/riskService.ts'
  ],
  externalIntegrations: ['ERP systems', 'HR systems', 'Asset management'],
  apiDependencies: ['/api/ims/documents', '/api/ims/audits', '/api/ims/capa', '/api/ims/risks'],

  lastUpdated: '2025-01-27',
  owner: 'IMS Product Team',
  contributors: ['Quality', 'EHS', 'Engineering', 'Compliance'],
  version: '3.5.0',
  tags: ['ims', 'iso', 'quality', 'environment', 'safety', 'energy', 'compliance', 'audit', 'certification']
};

// =============================================================================
// EXPORTS
// =============================================================================

export default imsPlaybook;

