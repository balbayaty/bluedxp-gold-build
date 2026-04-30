/**
 * Feature Playbooks Data
 * ======================
 * Comprehensive, deeply-layered playbook data for all features.
 * This is the master reference for development, sales, compliance, and strategy.
 * 
 * Each playbook covers 10+ layers of information including:
 * - Compliance & Governance
 * - Regulatory & Legal
 * - Industry Standards
 * - Strategic Vision
 * - Market Trends
 * - Technical Architecture
 * - Sales & Business
 * - Implementation
 * - Sustainability
 * - Documentation
 */

import { FeaturePlaybook } from '@/types/featurePlaybook';

// =============================================================================
// IOT MANAGEMENT SYSTEM - COMPLETE PLAYBOOK
// =============================================================================

export const iotManagementPlaybook: FeaturePlaybook = {
  // ===== CORE IDENTIFICATION =====
  id: 'iot-management',
  name: 'Advanced IoT Management System',
  description: 'Comprehensive IoT device management platform with AI-powered analytics, predictive maintenance, edge computing, and multi-protocol support for industrial environments.',
  category: 'IoT & Edge Computing',
  modules: ['iot', 'wms', 'tms', 'qhse'],
  
  // ===== STATUS & PRIORITY =====
  status: 'planned',
  priority: 'CRITICAL',
  phase: 1,
  estimatedTime: '4-6 weeks',
  complexity: 'highly-complex',
  
  // ===== KEY CAPABILITIES =====
  capabilities: [
    'Device Discovery & Auto-Registration',
    'AI Model Deployment to Edge Devices',
    'Predictive Maintenance & Failure Prediction',
    'Real-time Network Optimization',
    'Security Vulnerability Scanning',
    'Multi-Protocol Support (WiFi, LoRa, Zigbee, 5G, Satellite)',
    'Edge AI Processing & Inference',
    'Device Groups & Fleet Management',
    'Automation Rules Engine',
    'Real-time Analytics & Dashboards'
  ],
  keyFeatures: [
    'Auto-discovery of IoT devices on network',
    'Deploy TensorFlow Lite, ONNX, OpenVINO models to edge',
    'Predict device failures before they occur',
    'Optimize network routing and load balancing',
    'Continuous security scanning and threat assessment',
    'Support for 10+ communication protocols',
    'Run AI inference at the edge with <100ms latency',
    'Group devices for collective management',
    'Create if-then automation rules',
    'Real-time dashboards with 30+ metrics'
  ],
  benefits: [
    'Reduce downtime by 80% with predictive maintenance',
    'Cut operational costs by 40% through automation',
    'Improve security posture with continuous monitoring',
    'Enable real-time decision making at the edge',
    'Scale to 100,000+ devices per deployment',
    'Reduce network latency by 60% with optimization'
  ],

  // ===== 1. COMPLIANCE & GOVERNANCE LAYER =====
  compliance: {
    standards: [
      {
        code: 'ISO 27001',
        name: 'Information Security Management',
        category: 'security',
        description: 'International standard for information security management systems',
        requirement: 'mandatory',
        certificationBody: 'ISO',
        regions: ['global'],
        officialUrl: 'https://www.iso.org/isoiec-27001-information-security.html',
        complianceContribution: 'IoT security controls, encryption, access management, and audit trails',
        clausesAddressed: ['A.8 Asset Management', 'A.9 Access Control', 'A.12 Operations Security', 'A.13 Communications Security']
      },
      {
        code: 'IEC 62443',
        name: 'Industrial Automation and Control Systems Security',
        category: 'security',
        description: 'Security for industrial automation and control systems',
        requirement: 'mandatory',
        certificationBody: 'IEC',
        regions: ['global'],
        officialUrl: 'https://www.iec.ch/industrial-cybersecurity',
        complianceContribution: 'Secure IoT device management, network segmentation, and security zones',
        clausesAddressed: ['Zone and Conduit Model', 'Security Levels', 'Component Security']
      },
      {
        code: 'ISO 22301',
        name: 'Business Continuity Management',
        category: 'operational',
        description: 'Requirements for planning, implementing, and maintaining business continuity',
        requirement: 'recommended',
        certificationBody: 'ISO',
        regions: ['global'],
        complianceContribution: 'Device redundancy, failover mechanisms, and disaster recovery',
        clausesAddressed: ['Clause 8 Operation', 'Clause 9 Performance Evaluation']
      },
      {
        code: 'SOC 2 Type II',
        name: 'Service Organization Control 2',
        category: 'security',
        description: 'Trust services criteria for security, availability, processing integrity, confidentiality, and privacy',
        requirement: 'recommended',
        certificationBody: 'AICPA',
        regions: ['global', 'north-america'],
        complianceContribution: 'Comprehensive security controls, audit logging, and access management',
        clausesAddressed: ['CC6 Logical and Physical Access', 'CC7 System Operations', 'CC8 Change Management']
      },
      {
        code: 'NIST CSF',
        name: 'NIST Cybersecurity Framework',
        category: 'security',
        description: 'Framework for improving critical infrastructure cybersecurity',
        requirement: 'recommended',
        certificationBody: 'NIST',
        regions: ['us', 'global'],
        complianceContribution: 'IoT security controls aligned with Identify, Protect, Detect, Respond, Recover functions',
        clausesAddressed: ['ID.AM Asset Management', 'PR.AC Access Control', 'DE.CM Security Continuous Monitoring']
      }
    ],
    governanceFrameworks: [
      {
        name: 'COBIT 2019',
        type: 'it',
        description: 'Framework for IT governance and management',
        principles: ['Meeting Stakeholder Needs', 'Covering the Enterprise End-to-End', 'Applying a Single Integrated Framework'],
        featureContribution: 'IoT governance, risk management, and alignment with business objectives',
        maturityLevel: 4
      },
      {
        name: 'ITIL 4',
        type: 'operational',
        description: 'IT service management framework',
        principles: ['Focus on Value', 'Start Where You Are', 'Progress Iteratively', 'Collaborate and Promote Visibility'],
        featureContribution: 'IoT service management, incident management, and change management',
        maturityLevel: 3
      }
    ],
    auditRequirements: [
      {
        type: 'internal',
        frequency: 'quarterly',
        scope: 'IoT device inventory, security configurations, and access logs',
        evidenceRequired: ['Device inventory reports', 'Security scan results', 'Access logs', 'Configuration baselines'],
        auditTrailNeeds: ['Device registration/deregistration', 'Configuration changes', 'Security events', 'User access']
      },
      {
        type: 'external',
        frequency: 'annual',
        scope: 'Full IoT security assessment and compliance verification',
        evidenceRequired: ['Penetration test results', 'Vulnerability assessments', 'Compliance certifications', 'Third-party audits'],
        auditTrailNeeds: ['Complete audit trail for all IoT operations']
      }
    ],
    complianceScoreImpact: 85,
    riskReductionPercentage: 70,
    certificationReadiness: [
      { certification: 'ISO 27001', readinessPercentage: 90, gapsToAddress: ['Formal ISMS documentation', 'Management review process'] },
      { certification: 'IEC 62443', readinessPercentage: 80, gapsToAddress: ['Zone segmentation documentation', 'Formal risk assessment'] },
      { certification: 'SOC 2 Type II', readinessPercentage: 85, gapsToAddress: ['Independent audit', 'Control documentation'] }
    ]
  },

  // ===== 2. REGULATORY & LEGAL LAYER =====
  regulatory: {
    regulatoryBodies: [
      {
        code: 'CISA',
        name: 'Cybersecurity and Infrastructure Security Agency',
        jurisdiction: 'us',
        type: 'government',
        website: 'https://www.cisa.gov',
        keyRegulations: ['Critical Infrastructure Protection', 'IoT Security Guidelines'],
        complianceSupport: 'Secure IoT deployment guidelines, vulnerability management, and incident response'
      },
      {
        code: 'ENISA',
        name: 'European Union Agency for Cybersecurity',
        jurisdiction: 'eu',
        type: 'government',
        website: 'https://www.enisa.europa.eu',
        keyRegulations: ['NIS2 Directive', 'Cybersecurity Act', 'IoT Security Guidelines'],
        complianceSupport: 'EU IoT security baseline, risk assessment, and certification schemes'
      },
      {
        code: 'FCC',
        name: 'Federal Communications Commission',
        jurisdiction: 'us',
        type: 'government',
        website: 'https://www.fcc.gov',
        keyRegulations: ['Radio Frequency Regulations', 'IoT Device Certification'],
        complianceSupport: 'RF compliance for wireless IoT devices, spectrum management'
      },
      {
        code: 'SAMA',
        name: 'Saudi Arabian Monetary Authority',
        jurisdiction: 'saudi-arabia',
        type: 'government',
        website: 'https://www.sama.gov.sa',
        keyRegulations: ['Cybersecurity Framework', 'Third Party Risk Management'],
        complianceSupport: 'Financial sector IoT security requirements in Saudi Arabia'
      },
      {
        code: 'NCA',
        name: 'National Cybersecurity Authority (Saudi Arabia)',
        jurisdiction: 'saudi-arabia',
        type: 'government',
        website: 'https://nca.gov.sa',
        keyRegulations: ['Essential Cybersecurity Controls', 'Critical Systems Cybersecurity Controls'],
        complianceSupport: 'Saudi national cybersecurity requirements for IoT systems'
      }
    ],
    laws: [
      {
        name: 'General Data Protection Regulation',
        code: 'GDPR',
        jurisdiction: 'eu',
        yearEnacted: 2016,
        lastAmended: 2018,
        category: 'data-privacy',
        keyProvisions: ['Data Protection by Design', 'Right to Erasure', 'Data Portability', 'Breach Notification'],
        penalties: 'Up to €20 million or 4% of global annual turnover',
        featureContribution: 'Privacy-by-design IoT data handling, consent management, and data subject rights'
      },
      {
        name: 'California Consumer Privacy Act',
        code: 'CCPA',
        jurisdiction: 'us',
        yearEnacted: 2018,
        lastAmended: 2020,
        category: 'data-privacy',
        keyProvisions: ['Right to Know', 'Right to Delete', 'Right to Opt-Out', 'Non-Discrimination'],
        penalties: 'Up to $7,500 per intentional violation',
        featureContribution: 'Consumer data rights management for IoT-collected data'
      },
      {
        name: 'IoT Cybersecurity Improvement Act',
        code: 'IoTCIA',
        jurisdiction: 'us',
        yearEnacted: 2020,
        category: 'safety',
        keyProvisions: ['Security Standards for IoT', 'Vulnerability Disclosure', 'Secure Development'],
        penalties: 'Federal procurement restrictions',
        featureContribution: 'NIST-aligned IoT security standards implementation'
      },
      {
        name: 'Personal Data Protection Law',
        code: 'PDPL',
        jurisdiction: 'saudi-arabia',
        yearEnacted: 2021,
        category: 'data-privacy',
        keyProvisions: ['Consent Requirements', 'Data Transfer Restrictions', 'Data Subject Rights'],
        penalties: 'Up to SAR 5 million per violation',
        featureContribution: 'Saudi data protection compliance for IoT data processing'
      },
      {
        name: 'Cyber Resilience Act',
        code: 'CRA',
        jurisdiction: 'eu',
        yearEnacted: 2024,
        category: 'safety',
        keyProvisions: ['Security by Design', 'Vulnerability Handling', 'CE Marking for IoT'],
        penalties: 'Up to €15 million or 2.5% of global turnover',
        featureContribution: 'EU IoT security requirements, secure development lifecycle'
      }
    ],
    regulations: [
      {
        name: 'NIS2 Directive',
        code: 'NIS2',
        authority: 'European Commission',
        type: 'directive',
        effectiveDate: '2024-10-17',
        summary: 'Network and Information Security requirements for essential and important entities',
        requirements: ['Risk Management', 'Incident Reporting', 'Supply Chain Security', 'Encryption'],
        documentationRequired: ['Risk Assessment', 'Security Policies', 'Incident Response Plan'],
        reportingObligations: ['24-hour early warning', '72-hour incident notification', 'Final report within 1 month'],
        featureCompliance: 'IoT security risk management, incident detection, and reporting capabilities'
      },
      {
        name: 'Radio Equipment Directive',
        code: 'RED',
        authority: 'European Commission',
        type: 'directive',
        effectiveDate: '2014-05-22',
        summary: 'Requirements for radio equipment including IoT devices',
        requirements: ['Safety', 'EMC Compliance', 'Efficient Use of Spectrum', 'Cybersecurity (from 2025)'],
        documentationRequired: ['Technical Documentation', 'EU Declaration of Conformity', 'CE Marking'],
        reportingObligations: ['Market surveillance cooperation'],
        featureCompliance: 'Wireless IoT device compliance and documentation management'
      }
    ],
    tradeCompliance: [
      {
        type: 'export-control',
        regime: 'Wassenaar Arrangement',
        affectedRegions: ['global'],
        requirements: ['Dual-use technology assessment', 'Export license determination', 'End-user verification'],
        screeningRequirements: ['Denied party screening', 'End-use screening', 'Destination screening'],
        licenseTypes: ['General License', 'Individual License', 'Global License'],
        featureSupport: 'IoT device export classification, license management, and screening automation'
      },
      {
        type: 'sanctions',
        regime: 'OFAC Sanctions',
        affectedRegions: ['global'],
        requirements: ['Sanctions screening', 'Transaction monitoring', 'Blocking requirements'],
        screeningRequirements: ['SDN List screening', 'Sectoral sanctions', 'Secondary sanctions'],
        featureSupport: 'Automated screening for IoT device destinations and end-users'
      }
    ],
    upcomingChanges: [
      {
        regulation: 'EU Cyber Resilience Act - Full Implementation',
        expectedDate: '2027-01-01',
        impact: 'high',
        preparationNeeded: 'Implement secure development lifecycle, vulnerability handling, and CE marking for all IoT products'
      },
      {
        regulation: 'RED Cybersecurity Requirements',
        expectedDate: '2025-08-01',
        impact: 'high',
        preparationNeeded: 'Ensure all wireless IoT devices meet new cybersecurity requirements'
      }
    ],
    jurisdictionalCoverage: ['global', 'us', 'eu', 'uk', 'saudi-arabia', 'uae', 'gcc']
  },

  // ===== 3. INDUSTRY STANDARDS & AUTHORITIES LAYER =====
  industry: {
    standards: [
      {
        code: 'MQTT',
        name: 'Message Queuing Telemetry Transport',
        organization: 'OASIS',
        category: 'communication',
        version: '5.0',
        description: 'Lightweight messaging protocol for IoT',
        specifications: ['QoS Levels', 'Retained Messages', 'Session Management', 'Topic Aliases'],
        implementationRequirements: ['MQTT Broker', 'TLS Encryption', 'Authentication'],
        featureImplementation: 'Native MQTT 5.0 support with all QoS levels and security features'
      },
      {
        code: 'OPC UA',
        name: 'Open Platform Communications Unified Architecture',
        organization: 'OPC Foundation',
        category: 'interoperability',
        version: '1.05',
        description: 'Industrial interoperability standard',
        specifications: ['Information Model', 'Security', 'Discovery', 'PubSub'],
        implementationRequirements: ['OPC UA Server/Client', 'Certificate Management', 'Security Policies'],
        featureImplementation: 'OPC UA client/server for industrial device integration'
      },
      {
        code: 'EPCIS',
        name: 'Electronic Product Code Information Services',
        organization: 'GS1',
        category: 'data-exchange',
        version: '2.0',
        description: 'Standard for sharing supply chain event data',
        specifications: ['Event Types', 'Master Data', 'Query Interface', 'Capture Interface'],
        implementationRequirements: ['EPCIS Repository', 'CBV Vocabulary', 'Digital Link'],
        featureImplementation: 'EPCIS event generation for IoT tracking events'
      },
      {
        code: 'Matter',
        name: 'Matter Smart Home Standard',
        organization: 'Connectivity Standards Alliance',
        category: 'interoperability',
        version: '1.2',
        description: 'Unified smart home connectivity standard',
        specifications: ['Device Types', 'Network Protocols', 'Security', 'Multi-Admin'],
        implementationRequirements: ['Thread', 'WiFi', 'Ethernet', 'Bluetooth LE'],
        featureImplementation: 'Matter compatibility for smart building IoT devices'
      }
    ],
    authorities: [
      {
        name: 'Industrial Internet Consortium (IIC)',
        type: 'consortium',
        focusArea: 'Industrial IoT',
        keyStandards: ['IIoT Security Framework', 'Industrial Internet Reference Architecture'],
        membershipType: 'member',
        featureAlignment: 'Architecture aligned with IIRA, security per IIC Security Framework'
      },
      {
        name: 'LoRa Alliance',
        type: 'trade-association',
        focusArea: 'Long-range, low-power IoT',
        keyStandards: ['LoRaWAN Specification', 'LoRaWAN Certification'],
        membershipType: 'certified',
        featureAlignment: 'Full LoRaWAN 1.1 support with certified devices'
      },
      {
        name: 'Zigbee Alliance (CSA)',
        type: 'trade-association',
        focusArea: 'Low-power mesh networking',
        keyStandards: ['Zigbee 3.0', 'Green Power', 'Matter'],
        membershipType: 'member',
        featureAlignment: 'Zigbee 3.0 and Matter protocol support'
      }
    ],
    bestPractices: [
      {
        name: 'IoT Security Foundation Best Practices',
        category: 'Security',
        description: 'Comprehensive IoT security guidelines',
        principles: ['Secure by Design', 'Defense in Depth', 'Secure Lifecycle', 'Transparency'],
        implementationGuidance: 'Implement all 13 security best practices categories',
        maturityIndicators: ['Security certification', 'Vulnerability disclosure program', 'Secure update mechanism'],
        featureImplementation: 'All IoT Security Foundation best practices implemented'
      },
      {
        name: 'NIST IoT Device Cybersecurity Guidance',
        category: 'Security',
        description: 'NIST recommendations for IoT device manufacturers',
        principles: ['Device Identification', 'Device Configuration', 'Data Protection', 'Logical Access', 'Software Update', 'Cybersecurity State Awareness'],
        implementationGuidance: 'Implement all six core cybersecurity capabilities',
        maturityIndicators: ['NIST compliance assessment', 'Third-party verification'],
        featureImplementation: 'All NIST SP 800-183 recommendations implemented'
      }
    ],
    verticalsServed: [
      'Manufacturing',
      'Logistics & Supply Chain',
      'Warehousing',
      'Transportation',
      'Energy & Utilities',
      'Healthcare',
      'Smart Buildings',
      'Agriculture',
      'Retail',
      'Mining'
    ],
    industryRequirements: [
      {
        industry: 'Pharmaceutical',
        requirements: ['21 CFR Part 11 Compliance', 'Temperature Monitoring', 'Chain of Custody', 'Validation'],
        featureSupport: 'FDA-compliant IoT monitoring with electronic signatures and audit trails'
      },
      {
        industry: 'Food & Beverage',
        requirements: ['FSMA Compliance', 'HACCP Monitoring', 'Traceability', 'Cold Chain'],
        featureSupport: 'Food safety monitoring, automated HACCP logging, and traceability'
      },
      {
        industry: 'Chemical',
        requirements: ['OSHA PSM Compliance', 'EPA RMP', 'Hazardous Material Monitoring'],
        featureSupport: 'Hazmat monitoring, leak detection, and safety system integration'
      }
    ]
  },

  // ===== 4. VISION & STRATEGIC ALIGNMENT LAYER =====
  strategic: {
    industrialAlignment: [
      {
        revolution: '4IR',
        alignmentScore: 95,
        pillarsAddressed: [
          'Internet of Things',
          'Cyber-Physical Systems',
          'Cloud Computing',
          'Big Data Analytics',
          'Artificial Intelligence'
        ],
        technologiesLeveraged: [
          'IoT Sensors & Actuators',
          'Edge Computing',
          'Machine Learning',
          'Predictive Analytics',
          '5G Connectivity',
          'Digital Twins'
        ],
        capabilitiesEnabled: [
          'Real-time Monitoring',
          'Predictive Maintenance',
          'Autonomous Operations',
          'Data-Driven Decision Making',
          'Remote Management'
        ]
      },
      {
        revolution: '5IR',
        alignmentScore: 85,
        pillarsAddressed: [
          'Human-Machine Collaboration',
          'Sustainability',
          'Personalization',
          'Resilience'
        ],
        technologiesLeveraged: [
          'Explainable AI',
          'Collaborative Robots',
          'Sustainable IoT',
          'Adaptive Systems'
        ],
        capabilitiesEnabled: [
          'Human-AI Teaming',
          'Sustainable Operations',
          'Personalized Monitoring',
          'Resilient Infrastructure'
        ],
        humanCentricAspects: [
          'Augmented worker capabilities',
          'Safety enhancement',
          'Ergonomic monitoring',
          'Stress reduction through automation'
        ],
        sustainabilityContributions: [
          'Energy optimization',
          'Waste reduction',
          'Resource efficiency',
          'Carbon footprint monitoring'
        ]
      }
    ],
    platformAlignment: [
      {
        strategicPillar: 'intelligence',
        alignmentStrength: 'core',
        visionContribution: 'Edge AI and predictive analytics for intelligent operations',
        crossModuleSynergies: ['WMS real-time inventory', 'TMS fleet tracking', 'QHSE safety monitoring'],
        ecosystemValue: 'Foundation for AI-driven platform intelligence'
      },
      {
        strategicPillar: 'automation',
        alignmentStrength: 'core',
        visionContribution: 'Autonomous device management and automated responses',
        crossModuleSynergies: ['WMS automated workflows', 'TMS route optimization'],
        ecosystemValue: 'Enables end-to-end supply chain automation'
      },
      {
        strategicPillar: 'integration',
        alignmentStrength: 'core',
        visionContribution: 'Multi-protocol connectivity for heterogeneous environments',
        crossModuleSynergies: ['ERP integration', 'Third-party device support'],
        ecosystemValue: 'Universal connectivity layer for the platform'
      }
    ],
    valuePropositions: [
      {
        category: 'cost-reduction',
        statement: 'Reduce operational costs by 40% through predictive maintenance and automation',
        quantifiedBenefit: '$500K-$2M annual savings for mid-size operations',
        roiTimeframe: '6-12 months',
        proofPoints: ['Industry benchmarks', 'Case studies', 'ROI calculator']
      },
      {
        category: 'risk-mitigation',
        statement: 'Reduce unplanned downtime by 80% with predictive failure detection',
        quantifiedBenefit: 'Prevent $1M+ in downtime costs annually',
        roiTimeframe: '3-6 months',
        proofPoints: ['Predictive accuracy rates', 'Downtime reduction metrics']
      },
      {
        category: 'compliance',
        statement: 'Achieve and maintain IoT security compliance automatically',
        quantifiedBenefit: 'Reduce compliance audit costs by 60%',
        roiTimeframe: '12 months',
        proofPoints: ['Compliance dashboards', 'Audit trail automation']
      }
    ],
    strategicImportance: 10,
    marketDifferentiation: [
      'Only platform with integrated edge AI deployment',
      'Multi-protocol support in single solution',
      'Built-in compliance automation',
      'Predictive maintenance with 95%+ accuracy'
    ],
    competitiveMoat: [
      'Deep integration with BlueDXP ecosystem',
      'Industry-specific templates and configurations',
      'AI models trained on industry data',
      'Regulatory expertise embedded in product'
    ],
    roadmapPosition: 'foundational'
  },

  // ===== 5. MARKET TRENDS & INTELLIGENCE LAYER =====
  market: {
    trends: [
      {
        name: 'Industrial IoT Expansion',
        category: 'technology',
        maturity: 'growing',
        impact: 'transformational',
        timeHorizon: 'immediate',
        description: 'Rapid adoption of IoT in industrial settings for monitoring and automation',
        featureResponse: 'Comprehensive IIoT platform with enterprise-grade capabilities',
        marketDrivers: ['Digital transformation', 'Operational efficiency', 'Predictive maintenance needs'],
        statistics: ['IIoT market expected to reach $1.1T by 2028', 'CAGR of 22.8%']
      },
      {
        name: 'Edge Computing Growth',
        category: 'technology',
        maturity: 'growing',
        impact: 'significant',
        timeHorizon: 'short-term',
        description: 'Processing data at the edge for latency reduction and bandwidth optimization',
        featureResponse: 'Built-in edge AI capabilities with local processing',
        marketDrivers: ['Real-time requirements', 'Bandwidth constraints', 'Data sovereignty'],
        statistics: ['Edge computing market to reach $87B by 2026']
      },
      {
        name: 'IoT Security Regulations',
        category: 'regulatory',
        maturity: 'emerging',
        impact: 'significant',
        timeHorizon: 'short-term',
        description: 'Increasing regulatory requirements for IoT device security',
        featureResponse: 'Built-in compliance features for NIST, EU CRA, and regional regulations',
        marketDrivers: ['Security breaches', 'Government mandates', 'Customer demands'],
        statistics: ['80% of enterprises will require IoT security certification by 2025']
      },
      {
        name: 'Sustainability & Green IoT',
        category: 'environmental',
        maturity: 'emerging',
        impact: 'significant',
        timeHorizon: 'medium-term',
        description: 'Focus on energy-efficient IoT and environmental monitoring',
        featureResponse: 'Energy optimization features and sustainability dashboards',
        marketDrivers: ['ESG requirements', 'Cost optimization', 'Regulatory pressure'],
        statistics: ['Green IoT market to reach $35B by 2030']
      }
    ],
    technologyTrends: [
      {
        name: 'AI at the Edge',
        category: 'ai-ml',
        adoptionStage: 'early-majority',
        relevance: 'core',
        description: 'Running AI models directly on edge devices',
        featureLeverage: 'TensorFlow Lite, ONNX, and OpenVINO model deployment to edge devices'
      },
      {
        name: '5G Private Networks',
        category: 'iot',
        adoptionStage: 'early-adopters',
        relevance: 'enabling',
        description: 'Enterprise private 5G networks for industrial IoT',
        featureLeverage: '5G connectivity support with network slicing integration'
      },
      {
        name: 'Digital Twins',
        category: 'iot',
        adoptionStage: 'early-majority',
        relevance: 'complementary',
        description: 'Virtual replicas of physical devices and systems',
        featureLeverage: 'Device digital twin capabilities with real-time synchronization'
      }
    ],
    competitiveLandscape: {
      competitorType: 'direct',
      keyCompetitors: ['AWS IoT', 'Azure IoT Hub', 'Google Cloud IoT', 'PTC ThingWorx', 'Siemens MindSphere'],
      ourDifferentiators: [
        'Integrated supply chain context',
        'Built-in compliance automation',
        'Multi-protocol support out-of-box',
        'Industry-specific templates'
      ],
      competitiveAdvantages: [
        'Part of comprehensive BlueDXP platform',
        'No need for separate IoT platform integration',
        'Regulatory expertise for logistics industry',
        'Lower total cost of ownership'
      ],
      areasForImprovement: [
        'Broader device ecosystem',
        'More third-party integrations',
        'Developer community growth'
      ],
      marketPositioning: 'Industry-specific IoT platform for supply chain and logistics'
    },
    marketOpportunity: {
      totalAddressableMarket: '$1.1 Trillion by 2028',
      serviceableMarket: '$50 Billion (Supply Chain IoT)',
      growthRate: '22.8% CAGR',
      keySegments: ['Manufacturing', 'Logistics', 'Warehousing', 'Transportation', 'Cold Chain']
    },
    targetIndustries: [
      'Third-Party Logistics (3PL)',
      'Manufacturing',
      'Pharmaceutical',
      'Food & Beverage',
      'Automotive',
      'Retail',
      'Chemical'
    ],
    geographicOpportunities: ['gcc', 'middle-east', 'europe', 'asia-pacific', 'north-america']
  },

  // ===== 6. TECHNICAL ARCHITECTURE LAYER =====
  technical: {
    architecturePatterns: [
      {
        name: 'Event-Driven Architecture',
        type: 'architectural',
        description: 'Asynchronous event-based communication between IoT devices and platform',
        whenToUse: 'For real-time IoT data streaming and processing',
        benefits: ['Scalability', 'Loose coupling', 'Real-time processing', 'Resilience'],
        tradeoffs: ['Complexity', 'Eventual consistency', 'Debugging challenges'],
        implementationDetails: 'Event Bus with topic-based routing, CQRS for read/write separation'
      },
      {
        name: 'Microservices Architecture',
        type: 'architectural',
        description: 'Decomposed services for device management, analytics, and security',
        whenToUse: 'For scalable, independently deployable IoT services',
        benefits: ['Independent scaling', 'Technology flexibility', 'Fault isolation'],
        tradeoffs: ['Operational complexity', 'Network latency', 'Data consistency'],
        implementationDetails: 'Kubernetes-based deployment with service mesh'
      },
      {
        name: 'Edge-Cloud Hybrid',
        type: 'deployment',
        description: 'Processing at edge with cloud synchronization',
        whenToUse: 'For latency-sensitive and bandwidth-constrained scenarios',
        benefits: ['Low latency', 'Bandwidth efficiency', 'Offline capability'],
        tradeoffs: ['Edge management complexity', 'Synchronization challenges'],
        implementationDetails: 'Edge runtime with periodic cloud sync and conflict resolution'
      }
    ],
    technologyStack: [
      {
        category: 'backend',
        technologies: [
          { name: 'Node.js', version: '20+', purpose: 'API services and real-time processing', required: true },
          { name: 'Go', version: '1.21+', purpose: 'High-performance edge services', required: true },
          { name: 'Python', version: '3.11+', purpose: 'AI/ML model development', required: true }
        ]
      },
      {
        category: 'messaging',
        technologies: [
          { name: 'Apache Kafka', version: '3.x', purpose: 'Event streaming', required: true },
          { name: 'MQTT Broker', version: '5.0', purpose: 'IoT messaging', required: true },
          { name: 'Redis', version: '7.x', purpose: 'Caching and pub/sub', required: true }
        ]
      },
      {
        category: 'database',
        technologies: [
          { name: 'TimescaleDB', purpose: 'Time-series IoT data', required: true },
          { name: 'PostgreSQL', version: '15+', purpose: 'Device metadata and configuration', required: true },
          { name: 'InfluxDB', purpose: 'Metrics and monitoring', required: false }
        ]
      },
      {
        category: 'ai-ml',
        technologies: [
          { name: 'TensorFlow', version: '2.x', purpose: 'ML model training', required: true },
          { name: 'TensorFlow Lite', purpose: 'Edge inference', required: true },
          { name: 'ONNX Runtime', purpose: 'Cross-platform inference', required: true }
        ]
      }
    ],
    securityRequirements: [
      {
        domain: 'authentication',
        requirement: 'Device identity and authentication using X.509 certificates',
        criticality: 'critical',
        implementation: 'PKI infrastructure with certificate lifecycle management',
        standardsAddressed: ['ISO 27001 A.9', 'IEC 62443']
      },
      {
        domain: 'encryption',
        requirement: 'End-to-end encryption for all IoT data in transit and at rest',
        criticality: 'critical',
        implementation: 'TLS 1.3 for transit, AES-256 for storage',
        standardsAddressed: ['ISO 27001 A.10', 'NIST CSF PR.DS']
      },
      {
        domain: 'authorization',
        requirement: 'Role-based access control for device operations',
        criticality: 'high',
        implementation: 'RBAC with 11 predefined roles plus custom roles',
        standardsAddressed: ['ISO 27001 A.9.2', 'SOC 2 CC6']
      }
    ],
    performanceRequirements: [
      {
        metricType: 'latency',
        targetValue: '<100ms for edge inference, <500ms for cloud round-trip',
        measurementMethod: 'End-to-end latency monitoring',
        slaTier: 'platinum'
      },
      {
        metricType: 'throughput',
        targetValue: '100,000 messages/second per cluster',
        measurementMethod: 'Kafka consumer lag monitoring',
        slaTier: 'gold'
      },
      {
        metricType: 'availability',
        targetValue: '99.95% uptime',
        measurementMethod: 'Synthetic monitoring and health checks',
        slaTier: 'platinum'
      }
    ],
    integrationPatterns: [
      {
        type: 'event-driven',
        protocol: 'MQTT, Kafka',
        dataFormat: 'JSON, Protocol Buffers',
        description: 'Real-time event streaming for IoT data',
        useCases: ['Sensor data ingestion', 'Device state changes', 'Alerts']
      },
      {
        type: 'api',
        protocol: 'REST, GraphQL',
        dataFormat: 'JSON',
        description: 'Synchronous API for device management',
        useCases: ['Device provisioning', 'Configuration', 'Queries']
      }
    ],
    scalabilityApproach: 'Horizontal scaling with Kubernetes, auto-scaling based on message throughput',
    highAvailability: 'Multi-region deployment with active-passive failover, 3-node Kafka clusters',
    disasterRecovery: 'RPO: 5 minutes, RTO: 15 minutes with automated failover',
    dataArchitecture: 'Lambda architecture with real-time and batch processing paths'
  },

  // ===== 7. SALES & BUSINESS LAYER =====
  sales: {
    targetPersonas: [
      {
        name: 'Operations Director',
        jobTitles: ['VP Operations', 'Director of Operations', 'COO'],
        department: 'Operations',
        seniority: 'director',
        responsibilities: ['Operational efficiency', 'Cost management', 'Process optimization'],
        painPoints: ['Unplanned downtime', 'Lack of visibility', 'Manual processes', 'Reactive maintenance'],
        goals: ['Reduce operational costs', 'Improve efficiency', 'Enable data-driven decisions'],
        commonObjections: ['Integration complexity', 'ROI uncertainty', 'Security concerns'],
        keyMessaging: ['Reduce downtime by 80%', 'ROI in 6 months', 'Enterprise-grade security'],
        decisionRole: 'decision-maker'
      },
      {
        name: 'IT Director',
        jobTitles: ['CIO', 'IT Director', 'VP IT'],
        department: 'Information Technology',
        seniority: 'director',
        responsibilities: ['Technology strategy', 'Security', 'Integration'],
        painPoints: ['Security vulnerabilities', 'Integration challenges', 'Scalability concerns'],
        goals: ['Secure infrastructure', 'Seamless integration', 'Future-proof technology'],
        commonObjections: ['Security compliance', 'Vendor lock-in', 'Technical complexity'],
        keyMessaging: ['ISO 27001 aligned', 'Open standards', 'Multi-cloud support'],
        decisionRole: 'influencer'
      },
      {
        name: 'Plant Manager',
        jobTitles: ['Plant Manager', 'Facility Manager', 'Site Director'],
        department: 'Manufacturing',
        seniority: 'manager',
        responsibilities: ['Production efficiency', 'Safety', 'Equipment uptime'],
        painPoints: ['Equipment failures', 'Safety incidents', 'Production delays'],
        goals: ['Zero unplanned downtime', 'Improved safety', 'Higher productivity'],
        commonObjections: ['Learning curve', 'Disruption to operations', 'Staff resistance'],
        keyMessaging: ['Predictive alerts before failure', 'Safety monitoring', 'Easy to use'],
        decisionRole: 'champion'
      }
    ],
    useCases: [
      {
        name: 'Predictive Maintenance for Conveyor Systems',
        industry: 'Logistics',
        scenario: 'Large 3PL with 50+ conveyor systems experiencing frequent breakdowns',
        problemAddressed: '$2M annual downtime costs, reactive maintenance model',
        solution: 'IoT sensors on all conveyors with predictive failure detection',
        benefits: ['80% reduction in unplanned downtime', '50% reduction in maintenance costs', 'Extended equipment life'],
        roiMetrics: ['$1.6M annual savings', 'Payback in 4 months']
      },
      {
        name: 'Cold Chain Monitoring',
        industry: 'Pharmaceutical',
        scenario: 'Pharma distributor needing 24/7 temperature monitoring for compliance',
        problemAddressed: 'Product spoilage, compliance violations, manual logging',
        solution: 'IoT temperature sensors with automated compliance reporting',
        benefits: ['100% compliance', '90% reduction in spoilage', 'Automated documentation'],
        roiMetrics: ['$500K annual savings in product loss', 'Zero compliance violations']
      }
    ],
    keySellingPoints: [
      'Only platform combining IoT with supply chain expertise',
      'Built-in compliance for GDPR, NIST, ISO 27001',
      'Predictive maintenance with 95%+ accuracy',
      '10x faster deployment than building custom',
      'Edge AI with <100ms inference latency'
    ],
    competitiveAdvantages: [
      'Integrated with BlueDXP ecosystem - no separate integration needed',
      'Industry-specific templates for logistics and supply chain',
      'Multi-protocol support out of the box',
      'Compliance automation built-in'
    ],
    objectionHandling: [
      {
        objection: 'We already use AWS IoT / Azure IoT',
        response: 'BlueDXP IoT integrates with existing cloud IoT while adding supply chain context, compliance automation, and industry-specific features. Many customers use both.'
      },
      {
        objection: 'Security is a major concern for us',
        response: 'We are ISO 27001 aligned and IEC 62443 compliant. All data is encrypted end-to-end, and we support your existing security policies.'
      },
      {
        objection: 'The ROI is unclear',
        response: 'We offer a free ROI assessment and pilot program. Typical customers see 6-month payback with 40% cost reduction.'
      }
    ],
    pricingConsiderations: {
      model: 'per-device',
      valueDrivers: ['Number of devices', 'Data volume', 'AI features', 'Support tier'],
      costFactors: ['Infrastructure', 'Data storage', 'AI compute'],
      competitivePositioning: 'Premium positioned with best value for enterprise',
      upsellOpportunities: ['Additional devices', 'Advanced AI', 'Premium support', 'Professional services']
    },
    demoScenarios: [
      'Live device discovery and registration',
      'Predictive maintenance alert demonstration',
      'Compliance dashboard walkthrough',
      'Edge AI deployment demo'
    ],
    proofPoints: [
      'Customer case studies',
      'ROI calculator',
      'Third-party security audit results',
      'Performance benchmarks'
    ],
    salesMaterials: [
      'Solution brief',
      'Technical architecture guide',
      'ROI calculator',
      'Customer case studies',
      'Competitive comparison',
      'Demo environment'
    ]
  },

  // ===== 8. IMPLEMENTATION & OPERATIONS LAYER =====
  implementation: {
    phases: [
      {
        name: 'Discovery & Planning',
        phase: 1,
        duration: '2 weeks',
        activities: ['Requirements gathering', 'Current state assessment', 'Architecture design', 'Success criteria definition'],
        deliverables: ['Solution design document', 'Implementation plan', 'Success metrics'],
        successCriteria: ['Stakeholder sign-off', 'Clear requirements documented'],
        dependencies: ['Customer stakeholder availability', 'Network access for assessment'],
        risks: ['Scope creep', 'Incomplete requirements']
      },
      {
        name: 'Infrastructure Setup',
        phase: 2,
        duration: '2 weeks',
        activities: ['Cloud environment setup', 'Network configuration', 'Security configuration', 'Integration setup'],
        deliverables: ['Production environment', 'Network diagrams', 'Security configuration'],
        successCriteria: ['All infrastructure tests passed', 'Security review completed'],
        dependencies: ['Cloud account access', 'Network team involvement'],
        risks: ['Network compatibility issues', 'Security policy conflicts']
      },
      {
        name: 'Device Onboarding',
        phase: 3,
        duration: '3 weeks',
        activities: ['Device registration', 'Protocol configuration', 'Data mapping', 'Testing'],
        deliverables: ['Registered devices', 'Data flowing', 'Test results'],
        successCriteria: ['All pilot devices online', 'Data quality validated'],
        dependencies: ['Device access', 'Device documentation'],
        risks: ['Unsupported devices', 'Connectivity issues']
      },
      {
        name: 'AI/ML Configuration',
        phase: 4,
        duration: '2 weeks',
        activities: ['Model training', 'Threshold configuration', 'Alert setup', 'Testing'],
        deliverables: ['Trained models', 'Alert rules', 'Test results'],
        successCriteria: ['Prediction accuracy >90%', 'Alerts functioning'],
        dependencies: ['Historical data', 'Domain expert input'],
        risks: ['Insufficient data', 'Model accuracy']
      },
      {
        name: 'Go-Live & Optimization',
        phase: 5,
        duration: '2 weeks',
        activities: ['Production cutover', 'User training', 'Monitoring setup', 'Optimization'],
        deliverables: ['Production system', 'Trained users', 'Runbook'],
        successCriteria: ['System stable', 'Users trained', 'SLAs met'],
        dependencies: ['User availability', 'Support team readiness'],
        risks: ['User adoption', 'Performance issues']
      }
    ],
    prerequisites: [
      {
        category: 'technical',
        requirement: 'Network connectivity for IoT devices (WiFi, Ethernet, or cellular)',
        criticality: 'blocking',
        validationMethod: 'Network assessment'
      },
      {
        category: 'technical',
        requirement: 'Cloud environment (AWS, Azure, GCP, or on-premise Kubernetes)',
        criticality: 'blocking',
        validationMethod: 'Environment provisioning test'
      },
      {
        category: 'data',
        requirement: 'Device inventory with specifications',
        criticality: 'important',
        validationMethod: 'Inventory review'
      },
      {
        category: 'organizational',
        requirement: 'Designated project sponsor and team',
        criticality: 'blocking',
        validationMethod: 'Kickoff meeting attendance'
      }
    ],
    bestPractices: [
      {
        category: 'security',
        practice: 'Implement network segmentation for IoT devices',
        rationale: 'Reduces attack surface and contains potential breaches',
        guidance: 'Create dedicated IoT VLAN with strict firewall rules'
      },
      {
        category: 'performance',
        practice: 'Start with edge processing for latency-critical use cases',
        rationale: 'Reduces bandwidth and improves response times',
        guidance: 'Deploy edge nodes near device clusters'
      },
      {
        category: 'governance',
        practice: 'Establish device lifecycle management process',
        rationale: 'Ensures devices remain secure and functional',
        guidance: 'Define processes for provisioning, updates, and decommissioning'
      }
    ],
    commonPitfalls: [
      {
        pitfall: 'Underestimating network requirements',
        impact: 'Connectivity issues, data loss, poor performance',
        avoidance: 'Conduct thorough network assessment before deployment',
        recovery: 'Upgrade network infrastructure, implement edge caching'
      },
      {
        pitfall: 'Ignoring security during rapid deployment',
        impact: 'Security vulnerabilities, compliance failures',
        avoidance: 'Follow security checklist for every deployment',
        recovery: 'Security audit and remediation sprint'
      },
      {
        pitfall: 'Insufficient training for operators',
        impact: 'Poor adoption, missed alerts, incorrect configuration',
        avoidance: 'Comprehensive training program with hands-on exercises',
        recovery: 'Remedial training and ongoing support'
      }
    ],
    resourceRequirements: [
      { role: 'Project Manager', effort: '50%', skills: ['IoT experience', 'Agile methodology'] },
      { role: 'Solution Architect', effort: '100%', skills: ['IoT architecture', 'Cloud platforms', 'Security'] },
      { role: 'IoT Engineer', effort: '100%', skills: ['Device protocols', 'Edge computing', 'Integration'] },
      { role: 'Data Engineer', effort: '50%', skills: ['Data pipelines', 'ML/AI', 'Analytics'] },
      { role: 'Customer IT Representative', effort: '25%', skills: ['Network', 'Security', 'Infrastructure'] }
    ],
    trainingRequirements: [
      'IoT Platform Administrator Training (2 days)',
      'IoT Device Management Training (1 day)',
      'AI/ML Configuration Training (1 day)',
      'Security Best Practices (0.5 day)'
    ],
    changeManagement: [
      'Executive sponsor communication',
      'Stakeholder impact assessment',
      'User communication plan',
      'Training and certification program',
      'Feedback and improvement loop'
    ],
    successMetrics: [
      'Device onboarding time < 30 minutes',
      'System availability > 99.5%',
      'Prediction accuracy > 90%',
      'User adoption > 80%',
      'Incident resolution time < 4 hours'
    ]
  },

  // ===== 9. SUSTAINABILITY & ESG LAYER =====
  sustainability: {
    environmentalImpacts: [
      {
        category: 'energy',
        type: 'optimization',
        description: 'Optimize energy consumption through smart monitoring and automation',
        metrics: ['Energy consumption per device', 'Peak load reduction', 'Idle energy savings'],
        goalContribution: 'Reduce energy consumption by 20-30%'
      },
      {
        category: 'carbon',
        type: 'reduction',
        description: 'Reduce carbon footprint through predictive maintenance and optimization',
        metrics: ['CO2 emissions avoided', 'Energy efficiency improvements'],
        goalContribution: 'Contribute to net-zero goals through operational efficiency'
      },
      {
        category: 'waste',
        type: 'reduction',
        description: 'Extend equipment life through predictive maintenance',
        metrics: ['Equipment lifespan extension', 'Waste reduction from premature replacement'],
        goalContribution: 'Reduce e-waste by extending device lifecycles'
      }
    ],
    esgAlignment: [
      {
        pillar: 'environmental',
        aspect: 'Climate Action',
        contribution: 'Energy optimization and carbon footprint monitoring',
        reportingFrameworks: ['GRI', 'CDP', 'TCFD'],
        sdgAlignment: [7, 9, 12, 13]
      },
      {
        pillar: 'social',
        aspect: 'Worker Safety',
        contribution: 'Environmental monitoring for worker safety',
        reportingFrameworks: ['GRI', 'SASB'],
        sdgAlignment: [3, 8]
      },
      {
        pillar: 'governance',
        aspect: 'Risk Management',
        contribution: 'Comprehensive risk monitoring and compliance',
        reportingFrameworks: ['GRI', 'SASB'],
        sdgAlignment: [16]
      }
    ],
    carbonFootprint: {
      directImpact: 'Low power IoT devices and edge computing reduce data center load',
      indirectBenefits: [
        'Optimized logistics reduces transportation emissions',
        'Predictive maintenance reduces waste and replacement',
        'Energy monitoring enables optimization'
      ],
      offsetOpportunities: [
        'Solar-powered IoT sensors',
        'Energy harvesting devices',
        'Carbon offset integration'
      ]
    },
    circularEconomy: [
      'Device lifecycle management for proper recycling',
      'Refurbishment programs for edge devices',
      'Modular design for component reuse',
      'Tracking of materials through supply chain'
    ],
    certifications: ['ISO 14001', 'ISO 50001', 'EcoVadis']
  },

  // ===== 10. DOCUMENTATION & SUPPORT LAYER =====
  documentation: {
    documentation: [
      {
        type: 'user-guide',
        title: 'IoT Management User Guide',
        description: 'Comprehensive guide for IoT platform users',
        targetAudience: ['Operators', 'Administrators'],
        status: 'planned',
        path: '/docs/iot/user-guide'
      },
      {
        type: 'admin-guide',
        title: 'IoT Administration Guide',
        description: 'Technical guide for system administrators',
        targetAudience: ['IT Administrators', 'DevOps'],
        status: 'planned',
        path: '/docs/iot/admin-guide'
      },
      {
        type: 'api-docs',
        title: 'IoT API Reference',
        description: 'Complete API documentation for developers',
        targetAudience: ['Developers', 'Integrators'],
        status: 'planned',
        path: '/docs/api/iot'
      },
      {
        type: 'integration-guide',
        title: 'IoT Integration Guide',
        description: 'Guide for integrating with third-party systems',
        targetAudience: ['Solution Architects', 'Developers'],
        status: 'planned',
        path: '/docs/iot/integration'
      }
    ],
    supportRequirements: {
      tier: 'enterprise',
      channels: ['24/7 Phone', 'Email', 'Chat', 'Dedicated TAM'],
      responseTimes: [
        { priority: 'Critical (P1)', responseTime: '15 minutes', resolutionTime: '4 hours' },
        { priority: 'High (P2)', responseTime: '1 hour', resolutionTime: '8 hours' },
        { priority: 'Medium (P3)', responseTime: '4 hours', resolutionTime: '24 hours' },
        { priority: 'Low (P4)', responseTime: '24 hours', resolutionTime: '72 hours' }
      ],
      escalationPath: ['L1 Support', 'L2 IoT Specialist', 'L3 Engineering', 'Product Management']
    },
    trainingPrograms: [
      {
        name: 'IoT Platform Fundamentals',
        type: 'self-paced',
        duration: '4 hours',
        targetAudience: 'All users'
      },
      {
        name: 'IoT Administration Certification',
        type: 'certification',
        duration: '2 days',
        targetAudience: 'Administrators'
      },
      {
        name: 'IoT Security Best Practices',
        type: 'instructor-led',
        duration: '1 day',
        targetAudience: 'Security team'
      }
    ],
    knowledgeBaseTopics: [
      'Device onboarding troubleshooting',
      'Network configuration guide',
      'Security best practices',
      'Performance optimization tips',
      'Common error codes and solutions'
    ],
    videoTutorials: [
      'Quick start guide',
      'Device discovery walkthrough',
      'Dashboard customization',
      'Alert configuration',
      'Report generation'
    ]
  },

  // ===== DEPENDENCIES & INTEGRATIONS =====
  moduleDependencies: ['wms', 'compliance', 'event-bus'],
  serviceDependencies: [
    'lib/services/iot/iotManager.ts',
    'lib/services/iot/iotAnalyticsService.ts',
    'lib/services/iot/edgeAIService.ts',
    'lib/services/iot/iotSecurityService.ts'
  ],
  externalIntegrations: [
    'ERP Systems (SAP, Oracle)',
    'SCADA/PLC Systems',
    'Cloud IoT Platforms (AWS IoT, Azure IoT)',
    'CMMS Systems',
    'Building Management Systems'
  ],
  apiDependencies: [
    '/api/iot/devices',
    '/api/iot/telemetry',
    '/api/iot/analytics',
    '/api/iot/security'
  ],

  // ===== METADATA =====
  lastUpdated: '2025-01-27',
  owner: 'IoT Platform Team',
  contributors: ['Architecture', 'Security', 'Compliance', 'Product'],
  version: '1.0.0',
  tags: ['iot', 'edge', 'ai', 'predictive-maintenance', 'security', '4ir', '5ir', 'compliance']
};

// =============================================================================
// FEATURE PLAYBOOKS COLLECTION
// =============================================================================

export const featurePlaybooks: FeaturePlaybook[] = [
  iotManagementPlaybook
  // Additional playbooks will be added here
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getPlaybookById(id: string): FeaturePlaybook | undefined {
  return featurePlaybooks.find(p => p.id === id);
}

export function getPlaybooksByModule(module: string): FeaturePlaybook[] {
  return featurePlaybooks.filter(p => p.modules.includes(module));
}

export function getPlaybooksByStatus(status: FeaturePlaybook['status']): FeaturePlaybook[] {
  return featurePlaybooks.filter(p => p.status === status);
}

export function getPlaybooksByPriority(priority: FeaturePlaybook['priority']): FeaturePlaybook[] {
  return featurePlaybooks.filter(p => p.priority === priority);
}

export function getPlaybooksByPhase(phase: number): FeaturePlaybook[] {
  return featurePlaybooks.filter(p => p.phase === phase);
}

export function getPlaybooksByTag(tag: string): FeaturePlaybook[] {
  return featurePlaybooks.filter(p => p.tags.includes(tag));
}

export function getPlaybooksByRegion(region: string): FeaturePlaybook[] {
  return featurePlaybooks.filter(p => 
    p.regulatory.jurisdictionalCoverage.includes(region as any)
  );
}

export function getPlaybooksByIndustry(industry: string): FeaturePlaybook[] {
  return featurePlaybooks.filter(p => 
    p.market.targetIndustries.includes(industry)
  );
}

export function getPlaybookSummary(): {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byPhase: Record<number, number>;
} {
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byPhase: Record<number, number> = {};

  featurePlaybooks.forEach(p => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    byPhase[p.phase] = (byPhase[p.phase] || 0) + 1;
  });

  return {
    total: featurePlaybooks.length,
    byStatus,
    byPriority,
    byPhase
  };
}

