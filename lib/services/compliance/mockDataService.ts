/**
 * Comprehensive Mock Data Service
 * Real-world Saudi Arabia regulatory data with references and links
 * Intelligent compliance data for testing and demonstration
 */

import {
  RegulatoryRequirement,
  ComplianceRecord,
  ComplianceDashboard,
  RegulatoryAuthority,
  ComplianceCategory,
  RegulatoryRegion,
  ComplianceStatus,
  CompliancePriority,
} from "@/types/compliance";
import {
  RegulatoryAuthorityNode,
  LocalRegulation,
  LocalKnowledgeEntry,
  AuthorityType,
} from "@/types/compliance-hierarchy";

// ============================================================================
// REAL REGULATORY AUTHORITY DATA WITH REFERENCES
// ============================================================================

export const saudiRegulatoryAuthorities: RegulatoryAuthorityNode[] = [
  {
    id: "tga",
    code: "TGA",
    name: "Transport General Authority",
    shortName: "TGA",
    description:
      "Saudi Arabia's national authority for transportation regulation, vehicle registration, and commercial driver licensing. Established to regulate and develop the transport sector.",
    parentId: undefined,
    parent: undefined,
    children: [],
    siblingIds: [],
    level: 0,
    type: "FEDERAL",
    region: "SAUDI_ARABIA",
    categories: ["TRANSPORTATION", "LICENSING"],
    localKnowledgeBaseId: "kb-tga",
    localRegulations: [],
    jurisdiction: {
      geographic: {
        country: "Saudi Arabia",
        regions: ["All Regions"],
      },
      functional: {
        industries: ["Transportation", "Logistics", "Freight"],
        entityTypes: ["TENANT", "VEHICLE", "USER"],
        activities: [
          "Vehicle Registration",
          "Driver Licensing",
          "Commercial Transport",
        ],
      },
    },
    contactInfo: {
      address: {
        city: "Riyadh",
        country: "Saudi Arabia",
      },
      website: "https://tga.gov.sa",
      email: ["info@tga.gov.sa"],
      phone: ["920000123"],
    },
    officialWebsite: "https://tga.gov.sa",
    apiDocumentation: "https://tga.gov.sa/api",
    status: "ACTIVE",
    effectiveDate: "2020-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    relatedAuthorities: ["mot"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sfda",
    code: "SFDA",
    name: "Saudi Food and Drug Authority",
    shortName: "SFDA",
    description:
      "Regulatory authority responsible for food and drug safety, medical device regulation, and public health protection in Saudi Arabia.",
    parentId: undefined,
    parent: undefined,
    children: [],
    siblingIds: [],
    level: 0,
    type: "FEDERAL",
    region: "SAUDI_ARABIA",
    categories: ["FOOD_DRUG", "PRODUCT_SAFETY", "HEALTH"],
    localKnowledgeBaseId: "kb-sfda",
    localRegulations: [],
    jurisdiction: {
      geographic: {
        country: "Saudi Arabia",
        regions: ["All Regions"],
      },
      functional: {
        industries: [
          "Food & Beverage",
          "Pharmaceuticals",
          "Medical Devices",
          "Cosmetics",
        ],
        entityTypes: ["TENANT", "WAREHOUSE", "PRODUCT"],
        activities: [
          "Food Storage",
          "Drug Distribution",
          "Medical Device Import",
        ],
      },
    },
    contactInfo: {
      address: {
        city: "Riyadh",
        country: "Saudi Arabia",
      },
      website: "https://sfda.gov.sa",
      email: ["info@sfda.gov.sa"],
      phone: ["19999"],
    },
    officialWebsite: "https://sfda.gov.sa",
    apiDocumentation: "https://sfda.gov.sa/en/electronic-services",
    status: "ACTIVE",
    effectiveDate: "2003-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    relatedAuthorities: ["saso", "zatca"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "zatca",
    code: "ZATCA",
    name: "Zakat, Tax and Customs Authority",
    shortName: "ZATCA",
    description:
      "Saudi Arabia's unified authority for zakat, tax, and customs administration. Handles import/export regulations, customs clearance, and tax compliance.",
    parentId: undefined,
    parent: undefined,
    children: [],
    siblingIds: [],
    level: 0,
    type: "FEDERAL",
    region: "SAUDI_ARABIA",
    categories: ["CUSTOMS", "TRADE", "TAX"],
    localKnowledgeBaseId: "kb-zatca",
    localRegulations: [],
    jurisdiction: {
      geographic: {
        country: "Saudi Arabia",
        regions: ["All Regions"],
        zones: ["Free Zones", "Special Economic Zones"],
      },
      functional: {
        industries: ["All Industries"],
        entityTypes: ["TENANT", "CUSTOMER", "PRODUCT"],
        activities: ["Import", "Export", "Customs Clearance", "Tax Filing"],
      },
    },
    contactInfo: {
      address: {
        city: "Riyadh",
        country: "Saudi Arabia",
      },
      website: "https://zatca.gov.sa",
      email: ["info@zatca.gov.sa"],
      phone: ["19993"],
    },
    officialWebsite: "https://zatca.gov.sa",
    apiDocumentation: "https://zatca.gov.sa/en/e-services",
    status: "ACTIVE",
    effectiveDate: "2021-05-04",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    relatedAuthorities: ["sfda", "saso", "moc"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "saso",
    code: "SASO",
    name: "Saudi Standards, Metrology and Quality Organization",
    shortName: "SASO",
    description:
      "National standards body responsible for developing and enforcing technical standards, quality control, and conformity assessment in Saudi Arabia.",
    parentId: undefined,
    parent: undefined,
    children: [],
    siblingIds: [],
    level: 0,
    type: "FEDERAL",
    region: "SAUDI_ARABIA",
    categories: ["PRODUCT_SAFETY", "QUALITY_MANAGEMENT", "STANDARDS"],
    localKnowledgeBaseId: "kb-saso",
    localRegulations: [],
    jurisdiction: {
      geographic: {
        country: "Saudi Arabia",
        regions: ["All Regions"],
      },
      functional: {
        industries: ["All Industries"],
        entityTypes: ["PRODUCT", "TENANT"],
        activities: [
          "Product Certification",
          "Quality Testing",
          "Standards Compliance",
        ],
      },
    },
    contactInfo: {
      address: {
        city: "Riyadh",
        country: "Saudi Arabia",
      },
      website: "https://saso.gov.sa",
      email: ["info@saso.gov.sa"],
      phone: ["0112655555"],
    },
    officialWebsite: "https://saso.gov.sa",
    apiDocumentation: "https://saso.gov.sa/en/services",
    status: "ACTIVE",
    effectiveDate: "1972-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    relatedAuthorities: ["sfda", "saber"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ncsc",
    code: "NCSC",
    name: "National Cybersecurity Authority",
    shortName: "NCSC",
    description:
      "Saudi Arabia's national authority for cybersecurity, responsible for protecting critical infrastructure and ensuring cybersecurity compliance across all sectors.",
    parentId: undefined,
    parent: undefined,
    children: [],
    siblingIds: [],
    level: 0,
    type: "FEDERAL",
    region: "SAUDI_ARABIA",
    categories: ["CYBERSECURITY", "DATA_SECURITY"],
    localKnowledgeBaseId: "kb-ncsc",
    localRegulations: [],
    jurisdiction: {
      geographic: {
        country: "Saudi Arabia",
        regions: ["All Regions"],
      },
      functional: {
        industries: ["All Industries"],
        entityTypes: ["TENANT", "CUSTOMER"],
        activities: [
          "Data Protection",
          "Cybersecurity Compliance",
          "Incident Reporting",
        ],
      },
    },
    contactInfo: {
      address: {
        city: "Riyadh",
        country: "Saudi Arabia",
      },
      website: "https://ncsc.gov.sa",
      email: ["info@ncsc.gov.sa"],
      phone: ["920001111"],
    },
    officialWebsite: "https://ncsc.gov.sa",
    apiDocumentation: "https://ncsc.gov.sa/en/services",
    status: "ACTIVE",
    effectiveDate: "2017-10-31",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    relatedAuthorities: ["sdaia"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sdaia",
    code: "SDAIA",
    name: "Saudi Data and AI Authority",
    shortName: "SDAIA",
    description:
      "National authority responsible for data governance, artificial intelligence strategy, and digital transformation initiatives in Saudi Arabia.",
    parentId: undefined,
    parent: undefined,
    children: [],
    siblingIds: [],
    level: 0,
    type: "FEDERAL",
    region: "SAUDI_ARABIA",
    categories: ["DATA_PRIVACY", "AI_STRATEGY", "DATA_SECURITY"],
    localKnowledgeBaseId: "kb-sdaia",
    localRegulations: [],
    jurisdiction: {
      geographic: {
        country: "Saudi Arabia",
        regions: ["All Regions"],
      },
      functional: {
        industries: ["All Industries"],
        entityTypes: ["TENANT", "CUSTOMER"],
        activities: [
          "Data Governance",
          "AI Implementation",
          "Digital Transformation",
        ],
      },
    },
    contactInfo: {
      address: {
        city: "Riyadh",
        country: "Saudi Arabia",
      },
      website: "https://sdaia.gov.sa",
      email: ["info@sdaia.gov.sa"],
      phone: ["920000111"],
    },
    officialWebsite: "https://sdaia.gov.sa",
    apiDocumentation: "https://sdaia.gov.sa/en/services",
    status: "ACTIVE",
    effectiveDate: "2019-08-30",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    relatedAuthorities: ["ncsc"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// COMPREHENSIVE MOCK REGULATIONS WITH REFERENCES
// ============================================================================

export const mockLocalRegulations: LocalRegulation[] = [
  {
    id: "reg-tga-vehicle-001",
    authorityId: "tga",
    regulationCode: "TGA-VEH-2024-001",
    title: "Commercial Vehicle Registration Requirements",
    description:
      "Comprehensive requirements for commercial vehicle registration including mandatory inspections, insurance, and documentation.",
    fullText:
      "All commercial vehicles operating in Saudi Arabia must be registered with TGA. Registration requires valid insurance, vehicle inspection certificate, and commercial license. Vehicles must undergo annual inspection and maintain valid registration at all times.",
    summary:
      "Commercial vehicles must be registered with TGA, have valid insurance and inspection certificates, and undergo annual inspections.",
    keyPoints: [
      "Valid TGA registration certificate required",
      "Annual vehicle inspection mandatory",
      "Commercial insurance coverage required",
      "Registration renewal before expiry",
      "Vehicle must meet safety standards",
    ],
    category: "TRANSPORTATION",
    subCategory: "Vehicle Registration",
    priority: "CRITICAL",
    applicableRegions: ["All Regions"],
    applicableIndustries: ["Transportation", "Logistics", "Freight"],
    applicableEntityTypes: ["VEHICLE", "TENANT"],
    requirements: [
      {
        id: "req-tga-veh-001",
        regulationId: "reg-tga-vehicle-001",
        section: "Registration",
        requirementNumber: "1",
        title: "TGA Registration Certificate",
        description:
          "Valid TGA registration certificate must be obtained and maintained",
        mandatory: true,
        priority: "CRITICAL",
        evidenceRequired: true,
        validationMethod: "API_CHECK",
        complianceCriteria: [
          {
            id: "crit-001",
            field: "registrationNumber",
            validationType: "REQUIRED",
            errorMessage: "Registration number is required",
          },
          {
            id: "crit-002",
            field: "expiryDate",
            validationType: "REQUIRED",
            errorMessage: "Expiry date is required",
          },
        ],
        documentsRequired: [
          {
            id: "doc-tga-001",
            documentType: "TGA_REGISTRATION_CERTIFICATE",
            name: "TGA Vehicle Registration Certificate",
            description: "Official TGA registration certificate",
            mandatory: true,
            format: ["PDF"],
            maxSize: 5 * 1024 * 1024,
            validityPeriod: 365,
            renewalRequired: true,
          },
        ],
        apiChecks: [
          {
            id: "api-tga-001",
            name: "TGA Registration Verification",
            endpoint: "https://tga.gov.sa/api/vehicles/verify",
            method: "POST",
            authentication: {
              type: "API_KEY",
            },
            status: "ACTIVE",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    exemptions: [],
    effectiveDate: "2024-01-01",
    lastAmended: "2024-01-15",
    amendmentHistory: [
      {
        id: "amend-001",
        amendmentDate: "2024-01-15",
        amendmentType: "MODIFIED",
        description: "Updated inspection requirements",
        affectedSections: ["Inspection"],
        impact: "MEDIUM",
        actionRequired: true,
      },
    ],
    knowledgeBaseEntryId: "kb-reg-tga-001",
    relatedRegulations: [],
    localInterpretations: [
      {
        id: "interp-001",
        title: "Commercial Vehicle Definition",
        interpretation:
          "Commercial vehicles include all vehicles used for business purposes including trucks, vans, and delivery vehicles with commercial license plates.",
        source: "TGA Official Guidelines",
        sourceType: "AUTHORITY",
        confidence: 100,
        applicableTo: ["All"],
        examples: ["Delivery trucks", "Freight vehicles", "Commercial vans"],
        createdAt: new Date().toISOString(),
        verified: true,
        verifiedBy: "TGA",
      },
    ],
    caseStudies: [
      {
        id: "case-001",
        title: "Successful Registration Process",
        description:
          "A logistics company successfully registered 50 commercial vehicles within 2 weeks by preparing all required documents in advance.",
        caseType: "COMPLIANCE_SUCCESS",
        outcome: "All vehicles registered and operational",
        lessonsLearned: [
          "Prepare documents in advance",
          "Schedule inspections early",
          "Maintain organized records",
        ],
        applicableScenarios: ["Bulk vehicle registration", "New fleet setup"],
        date: "2024-02-01",
        anonymized: true,
      },
    ],
    commonViolations: [
      {
        id: "viol-001",
        violationType: "Expired Registration",
        description: "Operating vehicle with expired TGA registration",
        frequency: "COMMON",
        severity: "HIGH",
        commonCauses: [
          "Forgot renewal date",
          "Delayed renewal process",
          "Missing documents",
        ],
        preventionTips: [
          "Set renewal reminders 30 days before expiry",
          "Maintain calendar of all expiry dates",
          "Prepare renewal documents in advance",
        ],
        remediationSteps: [
          "Immediately stop vehicle operations",
          "Complete renewal process",
          "Update registration in system",
        ],
      },
    ],
    bestPractices: [
      "Maintain digital copies of all registration documents",
      "Set up automated renewal reminders",
      "Keep vehicle inspection records organized",
      "Regular compliance audits",
      "Train drivers on compliance requirements",
    ],
    enforcementAgency: "TGA",
    penalties: [
      {
        id: "penalty-001",
        violationType: "Operating without valid registration",
        penaltyType: "FINE",
        amount: {
          min: 1000,
          max: 5000,
          currency: "SAR",
        },
        description:
          "Fine for operating commercial vehicle without valid TGA registration",
        conditions: ["Per vehicle", "Per day of violation"],
      },
    ],
    tags: ["transportation", "vehicle", "registration", "tga", "commercial"],
    keywords: [
      "TGA",
      "vehicle registration",
      "commercial vehicle",
      "transport",
    ],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    verifiedBy: "TGA",
    verifiedAt: new Date().toISOString(),
  },
];

// ============================================================================
// MOCK COMPLIANCE RECORDS
// ============================================================================

const createMockRequirement = (
  id: string,
  code: string,
  title: string,
  authority: RegulatoryAuthority,
  category: ComplianceCategory,
): RegulatoryRequirement => ({
  id,
  code,
  title,
  description: `${title} - Compliance requirement`,
  authority,
  region: "SAUDI_ARABIA",
  category,
  requirements: [],
  applicableTo: [{ entityType: "TENANT" }],
  rules: [],
  validationCriteria: [],
  requiredDocuments: [],
  effectiveDate: "2024-01-01",
  lastUpdated: new Date().toISOString(),
  version: "1.0.0",
  tags: [authority.toLowerCase(), category.toLowerCase()],
  keywords: [title, authority],
  relatedRequirements: [],
  status: "ACTIVE",
  priority: "HIGH",
  autoComplianceCheck: true,
  requiresManualReview: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const mockComplianceRecords: ComplianceRecord[] = [
  {
    id: "record-001",
    tenantId: "tenant-1",
    requirementId: "req-tga-vehicle-001",
    requirement: createMockRequirement(
      "req-tga-vehicle-001",
      "TGA-VEH-001",
      "Commercial Vehicle Registration",
      "TGA",
      "TRANSPORTATION",
    ),
    status: "COMPLIANT",
    complianceScore: 95,
    lastChecked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    nextCheckDue: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
    evidence: [
      {
        id: "ev-001",
        type: "DOCUMENT",
        source: "upload",
        data: { documentId: "doc-001" },
        timestamp: new Date().toISOString(),
        verified: true,
        verifiedBy: "system",
        verifiedAt: new Date().toISOString(),
        confidence: 100,
      },
    ],
    documents: [
      {
        id: "doc-001",
        requirementId: "req-tga-vehicle-001",
        documentType: "TGA_REGISTRATION_CERTIFICATE",
        name: "Vehicle Registration Certificate",
        fileUrl: "/documents/tga-reg-001.pdf",
        fileSize: 1024000,
        mimeType: "application/pdf",
        uploadedBy: "user-1",
        uploadedAt: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        expiryDate: new Date(
          Date.now() + 335 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: "VALID",
      },
    ],
    certificates: [],
    findings: [],
    violations: [],
    actions: [],
    recommendations: [],
    approvalStatus: "APPROVED",
    approvedBy: "compliance-manager-1",
    approvedAt: new Date().toISOString(),
    auditTrail: [],
    tags: ["vehicle", "transportation"],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-1",
    updatedBy: "system",
  },
  {
    id: "record-002",
    tenantId: "tenant-1",
    requirementId: "req-sfda-food-001",
    requirement: createMockRequirement(
      "req-sfda-food-001",
      "SFDA-FOOD-001",
      "SFDA Food Safety License",
      "SFDA",
      "FOOD_DRUG",
    ),
    status: "AT_RISK",
    complianceScore: 75,
    lastChecked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    nextCheckDue: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    evidence: [],
    documents: [
      {
        id: "doc-002",
        requirementId: "req-sfda-food-001",
        documentType: "SFDA_FOOD_LICENSE",
        name: "SFDA Food Safety License",
        fileUrl: "/documents/sfda-food-001.pdf",
        fileSize: 2048000,
        mimeType: "application/pdf",
        uploadedBy: "user-1",
        uploadedAt: new Date(
          Date.now() - 180 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        expiryDate: new Date(
          Date.now() + 25 * 24 * 60 * 60 * 1000,
        ).toISOString(), // Expiring soon
        status: "VALID",
      },
    ],
    certificates: [],
    findings: [
      {
        id: "find-001",
        type: "RISK",
        severity: "MEDIUM",
        description: "Food safety license expiring within 30 days",
        requirementId: "req-sfda-food-001",
        evidence: [],
        status: "OPEN",
      },
    ],
    violations: [],
    actions: [],
    recommendations: [],
    approvalStatus: "APPROVED",
    auditTrail: [],
    tags: ["food", "sfda"],
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-1",
    updatedBy: "system",
  },
  {
    id: "record-003",
    tenantId: "tenant-1",
    requirementId: "req-zatca-customs-001",
    requirement: createMockRequirement(
      "req-zatca-customs-001",
      "ZATCA-CUST-001",
      "ZATCA Customs Compliance",
      "ZATCA",
      "CUSTOMS",
    ),
    status: "NON_COMPLIANT",
    complianceScore: 45,
    lastChecked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    nextCheckDue: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
    evidence: [],
    documents: [],
    certificates: [],
    findings: [],
    violations: [
      {
        id: "viol-001",
        requirementId: "req-zatca-customs-001",
        violationType: "MISSING_DOCUMENT",
        description: "Missing customs declaration documents",
        severity: "CRITICAL",
        detectedAt: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: "OPEN",
      },
    ],
    actions: [
      {
        id: "action-001",
        type: "REMEDIATION",
        title: "Upload Missing Customs Documents",
        description: "Upload required customs declaration documents",
        priority: "CRITICAL",
        status: "PENDING",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    recommendations: [],
    approvalStatus: "PENDING",
    auditTrail: [],
    tags: ["customs", "zatca"],
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-1",
    updatedBy: "system",
  },
];

// ============================================================================
// MOCK KNOWLEDGE ENTRIES WITH REFERENCES
// ============================================================================

export const mockKnowledgeEntries: LocalKnowledgeEntry[] = [
  {
    id: "kb-001",
    authorityId: "tga",
    regulationId: "reg-tga-vehicle-001",
    title: "TGA Vehicle Registration Best Practices",
    content: `Best practices for TGA vehicle registration:
1. Start registration process 45 days before vehicle delivery
2. Prepare all required documents in advance
3. Schedule inspection appointment early
4. Maintain digital copies of all certificates
5. Set up renewal reminders 30 days before expiry
6. Keep organized records for audits
7. Train staff on compliance requirements

Reference: TGA Official Guidelines - https://tga.gov.sa`,
    summary: "Comprehensive guide to TGA vehicle registration best practices",
    type: "BEST_PRACTICE",
    category: "TRANSPORTATION",
    knowledgeBaseId: "kb-main-001",
    keywords: ["TGA", "vehicle registration", "best practices", "compliance"],
    tags: ["transportation", "registration", "guide"],
    localContext: {
      region: "Saudi Arabia",
      industry: "Transportation",
      specificScenario: "Fleet Management",
    },
    source: "TGA Official Guidelines",
    sourceType: "AUTHORITY",
    verified: true,
    verifiedBy: "TGA",
    verifiedAt: new Date().toISOString(),
    confidence: 100,
    relatedEntries: [],
    relatedRegulations: ["reg-tga-vehicle-001"],
    usageCount: 245,
    lastAccessed: new Date().toISOString(),
    feedbackScore: 4.8,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-002",
    authorityId: "sfda",
    title: "SFDA Food Storage Requirements",
    content: `SFDA food storage requirements for warehouses:
1. Temperature-controlled storage areas
2. Proper ventilation systems
3. Pest control measures
4. Regular inspections
5. Documentation of storage conditions
6. Staff training on food safety
7. Compliance with SFDA standards

Reference: SFDA Food Safety Regulations - https://sfda.gov.sa`,
    summary: "SFDA requirements for food storage facilities",
    type: "REGULATION",
    category: "FOOD_DRUG",
    knowledgeBaseId: "kb-main-002",
    keywords: ["SFDA", "food storage", "warehouse", "safety"],
    tags: ["food", "storage", "sfda"],
    localContext: {
      region: "Saudi Arabia",
      industry: "Food & Beverage",
      specificScenario: "Warehouse Storage",
    },
    source: "SFDA Official Regulations",
    sourceType: "AUTHORITY",
    verified: true,
    verifiedBy: "SFDA",
    verifiedAt: new Date().toISOString(),
    confidence: 100,
    relatedEntries: [],
    relatedRegulations: [],
    usageCount: 189,
    lastAccessed: new Date().toISOString(),
    feedbackScore: 4.7,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-003",
    authorityId: "zatca",
    title: "ZATCA Customs Clearance Process",
    content: `ZATCA customs clearance best practices:
1. Prepare all required documents before shipment
2. Use ZATCA electronic systems (FASAH)
3. Ensure accurate HS codes
4. Complete customs declarations accurately
5. Pay duties and taxes on time
6. Maintain import/export records
7. Comply with trade agreements

Reference: ZATCA Customs Guide - https://zatca.gov.sa`,
    summary: "Guide to ZATCA customs clearance process",
    type: "GUIDANCE",
    category: "CUSTOMS",
    knowledgeBaseId: "kb-main-003",
    keywords: ["ZATCA", "customs", "clearance", "import", "export"],
    tags: ["customs", "zatca", "clearance"],
    localContext: {
      region: "Saudi Arabia",
      industry: "Import/Export",
      specificScenario: "Customs Clearance",
    },
    source: "ZATCA Official Guide",
    sourceType: "AUTHORITY",
    verified: true,
    verifiedBy: "ZATCA",
    verifiedAt: new Date().toISOString(),
    confidence: 100,
    relatedEntries: [],
    relatedRegulations: [],
    usageCount: 312,
    lastAccessed: new Date().toISOString(),
    feedbackScore: 4.9,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const mockDataService = {
  getAuthorities: () => saudiRegulatoryAuthorities,
  getRegulations: () => mockLocalRegulations,
  getComplianceRecords: () => mockComplianceRecords,
  getKnowledgeEntries: () => mockKnowledgeEntries,

  // Initialize all mock data
  initialize: async () => {
    console.log("Initializing comprehensive compliance mock data...");
    // This would be called during module initialization
    return {
      authorities: saudiRegulatoryAuthorities.length,
      regulations: mockLocalRegulations.length,
      records: mockComplianceRecords.length,
      knowledgeEntries: mockKnowledgeEntries.length,
    };
  },
};

export default mockDataService;
