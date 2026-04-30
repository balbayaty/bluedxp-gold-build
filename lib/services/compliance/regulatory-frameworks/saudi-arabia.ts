/**
 * Saudi Arabia Regulatory Framework Modules
 * Comprehensive coverage of all Saudi regulatory authorities
 */

import {
  RegulatoryRequirement,
  RegulatoryAuthority,
  ComplianceCategory,
  RegulatoryRegion,
  APIEndpoint,
  DocumentRequirement,
  RequirementDetail,
} from "@/types/compliance";
import { complianceService } from "../complianceService";

// ============================================================================
// TGA (Transport General Authority) Requirements
// ============================================================================

export const tgaRequirements: RegulatoryRequirement[] = [
  {
    id: "TGA-TRANS-001",
    code: "TGA-TRANS-001",
    title: "Commercial Vehicle Registration",
    description:
      "All commercial vehicles must be registered with TGA and display valid registration certificates",
    authority: "TGA",
    region: "SAUDI_ARABIA",
    category: "TRANSPORTATION",
    requirements: [
      {
        id: "req-001",
        section: "Vehicle Registration",
        requirement: "Valid TGA vehicle registration certificate",
        description:
          "Commercial vehicles must have valid registration certificate issued by TGA",
        mandatory: true,
        priority: "CRITICAL",
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
      },
      {
        id: "req-002",
        section: "Vehicle Registration",
        requirement: "Vehicle inspection certificate",
        description:
          "Annual vehicle inspection must be completed and certificate must be valid",
        mandatory: true,
        priority: "HIGH",
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
      },
    ],
    applicableTo: [{ entityType: "VEHICLE" }, { entityType: "TENANT" }],
    rules: [
      {
        id: "rule-001",
        name: "Registration Expiry Check",
        description:
          "Block operations if vehicle registration expires within 30 days",
        ruleType: "BLOCKING",
        condition: '{"<": [{"var": "expiryDays"}, 30]}',
        action: {
          type: "BLOCK",
          target: ["vehicle_operations"],
        },
        priority: "HIGH",
        enabled: true,
      },
    ],
    validationCriteria: [
      {
        id: "val-001",
        field: "registrationNumber",
        validationType: "REQUIRED",
        errorMessage: "Vehicle registration number is required",
      },
      {
        id: "val-002",
        field: "expiryDate",
        validationType: "REQUIRED",
        errorMessage: "Registration expiry date is required",
      },
    ],
    requiredDocuments: [
      {
        id: "doc-001",
        documentType: "TGA_REGISTRATION_CERTIFICATE",
        name: "TGA Vehicle Registration Certificate",
        description: "Official TGA registration certificate",
        mandatory: true,
        format: ["PDF"],
        maxSize: 5 * 1024 * 1024, // 5MB
        validityPeriod: 365,
        renewalRequired: true,
      },
    ],
    apiEndpoints: [
      {
        id: "api-001",
        name: "TGA Vehicle Registration Check",
        url: "/api/tga/vehicles/verify",
        method: "POST",
        authentication: {
          type: "API_KEY",
          credentials: {
            apiKey: "${TGA_API_KEY}",
          },
        },
        status: "ACTIVE",
      },
    ],
    effectiveDate: "2020-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["transportation", "vehicle", "registration", "tga"],
    keywords: [
      "TGA",
      "vehicle registration",
      "commercial vehicle",
      "transport",
    ],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "CRITICAL",
    autoComplianceCheck: true,
    requiresManualReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "TGA-DRIVER-001",
    code: "TGA-DRIVER-001",
    title: "Commercial Driver License",
    description:
      "All commercial drivers must hold valid commercial driver license issued by TGA",
    authority: "TGA",
    region: "SAUDI_ARABIA",
    category: "TRANSPORTATION",
    requirements: [
      {
        id: "req-003",
        section: "Driver License",
        requirement: "Valid commercial driver license",
        description: "Driver must hold valid TGA commercial driver license",
        mandatory: true,
        priority: "CRITICAL",
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
      },
    ],
    applicableTo: [{ entityType: "USER" }],
    rules: [],
    validationCriteria: [],
    requiredDocuments: [
      {
        id: "doc-002",
        documentType: "TGA_COMMERCIAL_LICENSE",
        name: "TGA Commercial Driver License",
        description: "Valid commercial driver license",
        mandatory: true,
        format: ["PDF", "JPG"],
        maxSize: 2 * 1024 * 1024, // 2MB
        validityPeriod: 365,
        renewalRequired: true,
      },
    ],
    apiEndpoints: [
      {
        id: "api-002",
        name: "TGA Driver License Verification",
        url: "/api/tga/drivers/verify",
        method: "POST",
        authentication: {
          type: "API_KEY",
        },
        status: "ACTIVE",
      },
    ],
    effectiveDate: "2020-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["transportation", "driver", "license", "tga"],
    keywords: ["TGA", "driver license", "commercial driver"],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "CRITICAL",
    autoComplianceCheck: true,
    requiresManualReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// MOT (Ministry of Transport) Requirements
// ============================================================================

export const motRequirements: RegulatoryRequirement[] = [
  {
    id: "MOT-LOGISTICS-001",
    code: "MOT-LOGISTICS-001",
    title: "Logistics License",
    description:
      "All logistics companies must hold valid license from Ministry of Transport",
    authority: "MOT",
    region: "SAUDI_ARABIA",
    category: "LICENSING",
    requirements: [
      {
        id: "req-004",
        section: "Company License",
        requirement: "Valid MOT logistics license",
        description: "Company must hold valid logistics license from MOT",
        mandatory: true,
        priority: "CRITICAL",
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
      },
    ],
    applicableTo: [{ entityType: "TENANT" }],
    rules: [],
    validationCriteria: [],
    requiredDocuments: [
      {
        id: "doc-003",
        documentType: "MOT_LOGISTICS_LICENSE",
        name: "MOT Logistics License",
        description: "Valid logistics license from Ministry of Transport",
        mandatory: true,
        format: ["PDF"],
        maxSize: 5 * 1024 * 1024,
        validityPeriod: 365,
        renewalRequired: true,
      },
    ],
    apiEndpoints: [
      {
        id: "api-003",
        name: "MOT License Verification",
        url: "/api/mot/licenses/verify",
        method: "POST",
        authentication: {
          type: "API_KEY",
        },
        status: "ACTIVE",
      },
    ],
    effectiveDate: "2020-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["licensing", "logistics", "mot"],
    keywords: ["MOT", "logistics license", "transport license"],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "CRITICAL",
    autoComplianceCheck: true,
    requiresManualReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// ABSHER Requirements
// ============================================================================

export const absherRequirements: RegulatoryRequirement[] = [
  {
    id: "ABSHER-IDENTITY-001",
    code: "ABSHER-IDENTITY-001",
    title: "Absher Identity Verification",
    description:
      "All employees must have verified identity through Absher platform",
    authority: "ABSHER",
    region: "SAUDI_ARABIA",
    category: "IDENTITY_VERIFICATION",
    requirements: [
      {
        id: "req-005",
        section: "Identity Verification",
        requirement: "Absher verified identity",
        description: "Employee identity must be verified through Absher",
        mandatory: true,
        priority: "CRITICAL",
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
      },
    ],
    applicableTo: [{ entityType: "USER" }],
    rules: [],
    validationCriteria: [],
    requiredDocuments: [],
    apiEndpoints: [
      {
        id: "api-004",
        name: "Absher Identity Verification",
        url: "/api/absher/identity/verify",
        method: "POST",
        authentication: {
          type: "OAUTH2",
          credentials: {
            clientId: "${ABSHER_CLIENT_ID}",
            clientSecret: "${ABSHER_CLIENT_SECRET}",
          },
        },
        status: "ACTIVE",
      },
    ],
    effectiveDate: "2020-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["identity", "verification", "absher"],
    keywords: ["Absher", "identity verification", "Saudi ID"],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "CRITICAL",
    autoComplianceCheck: true,
    requiresManualReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// NAFATH Requirements
// ============================================================================

export const nafathRequirements: RegulatoryRequirement[] = [
  {
    id: "NAFATH-AUTH-001",
    code: "NAFATH-AUTH-001",
    title: "NAFATH National Authentication",
    description:
      "All users must authenticate using NAFATH national authentication framework",
    authority: "NAFATH",
    region: "SAUDI_ARABIA",
    category: "AUTHENTICATION",
    requirements: [
      {
        id: "req-006",
        section: "Authentication",
        requirement: "NAFATH authentication enabled",
        description:
          "System must integrate with NAFATH for user authentication",
        mandatory: true,
        priority: "CRITICAL",
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
      },
    ],
    applicableTo: [{ entityType: "TENANT" }],
    rules: [],
    validationCriteria: [],
    requiredDocuments: [],
    apiEndpoints: [
      {
        id: "api-005",
        name: "NAFATH Authentication",
        url: "/api/nafath/auth",
        method: "POST",
        authentication: {
          type: "OAUTH2",
        },
        status: "ACTIVE",
      },
    ],
    effectiveDate: "2021-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["authentication", "nafath", "national"],
    keywords: ["NAFATH", "authentication", "national framework"],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "CRITICAL",
    autoComplianceCheck: true,
    requiresManualReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// NAJIZ Requirements
// ============================================================================

export const najizRequirements: RegulatoryRequirement[] = [
  {
    id: "NAJIZ-GOV-001",
    code: "NAJIZ-GOV-001",
    title: "NAJIZ Governance Compliance",
    description: "Compliance with NAJIZ platform governance requirements",
    authority: "NAJIZ",
    region: "SAUDI_ARABIA",
    category: "GOVERNANCE",
    requirements: [
      {
        id: "req-007",
        section: "Governance",
        requirement: "NAJIZ platform integration",
        description:
          "System must integrate with NAJIZ platform for governance compliance",
        mandatory: true,
        priority: "HIGH",
        evidenceRequired: true,
        validationMethod: "HYBRID",
      },
    ],
    applicableTo: [{ entityType: "TENANT" }],
    rules: [],
    validationCriteria: [],
    requiredDocuments: [],
    apiEndpoints: [
      {
        id: "api-006",
        name: "NAJIZ Governance API",
        url: "/api/najiz/governance",
        method: "POST",
        authentication: {
          type: "API_KEY",
        },
        status: "ACTIVE",
      },
    ],
    effectiveDate: "2021-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["governance", "najiz"],
    keywords: ["NAJIZ", "governance", "compliance"],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "HIGH",
    autoComplianceCheck: true,
    requiresManualReview: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// SABER Requirements
// ============================================================================

export const saberRequirements: RegulatoryRequirement[] = [
  {
    id: "SABER-PRODUCT-001",
    code: "SABER-PRODUCT-001",
    title: "SABER Product Conformity",
    description: "Products must have SABER conformity certificates",
    authority: "SABER",
    region: "SAUDI_ARABIA",
    category: "PRODUCT_SAFETY",
    requirements: [
      {
        id: "req-008",
        section: "Product Conformity",
        requirement: "SABER conformity certificate",
        description: "Products must have valid SABER conformity certificate",
        mandatory: true,
        priority: "CRITICAL",
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
      },
    ],
    applicableTo: [{ entityType: "PRODUCT" }],
    rules: [
      {
        id: "rule-002",
        name: "SABER Certificate Check",
        description:
          "Block product operations if SABER certificate is missing or expired",
        ruleType: "BLOCKING",
        condition:
          '{"or": [{"==": [{"var": "saberCertificate"}, null]}, {"<": [{"var": "certificateExpiryDays"}, 0]}]}',
        action: {
          type: "BLOCK",
          target: ["product_operations"],
        },
        priority: "CRITICAL",
        enabled: true,
      },
    ],
    validationCriteria: [],
    requiredDocuments: [
      {
        id: "doc-004",
        documentType: "SABER_CONFORMITY_CERTIFICATE",
        name: "SABER Conformity Certificate",
        description: "Valid SABER product conformity certificate",
        mandatory: true,
        format: ["PDF"],
        maxSize: 5 * 1024 * 1024,
        validityPeriod: 365,
        renewalRequired: true,
      },
    ],
    apiEndpoints: [
      {
        id: "api-007",
        name: "SABER Certificate Verification",
        url: "/api/saber/certificates/verify",
        method: "POST",
        authentication: {
          type: "API_KEY",
        },
        status: "ACTIVE",
      },
    ],
    effectiveDate: "2019-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["product", "safety", "saber", "conformity"],
    keywords: ["SABER", "product conformity", "certificate"],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "CRITICAL",
    autoComplianceCheck: true,
    requiresManualReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// SFDA Requirements
// ============================================================================

export const sfdaRequirements: RegulatoryRequirement[] = [
  {
    id: "SFDA-FOOD-001",
    code: "SFDA-FOOD-001",
    title: "SFDA Food Safety License",
    description: "Food storage and handling facilities must have SFDA license",
    authority: "SFDA",
    region: "SAUDI_ARABIA",
    category: "FOOD_DRUG",
    requirements: [
      {
        id: "req-009",
        section: "Food License",
        requirement: "Valid SFDA food safety license",
        description: "Warehouse handling food products must have SFDA license",
        mandatory: true,
        priority: "CRITICAL",
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
      },
    ],
    applicableTo: [{ entityType: "WAREHOUSE" }],
    rules: [],
    validationCriteria: [],
    requiredDocuments: [
      {
        id: "doc-005",
        documentType: "SFDA_FOOD_LICENSE",
        name: "SFDA Food Safety License",
        description: "Valid SFDA food safety license",
        mandatory: true,
        format: ["PDF"],
        maxSize: 5 * 1024 * 1024,
        validityPeriod: 365,
        renewalRequired: true,
      },
    ],
    apiEndpoints: [
      {
        id: "api-008",
        name: "SFDA License Verification",
        url: "/api/sfda/licenses/verify",
        method: "POST",
        authentication: {
          type: "API_KEY",
        },
        status: "ACTIVE",
      },
    ],
    effectiveDate: "2020-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["food", "safety", "sfda", "license"],
    keywords: ["SFDA", "food safety", "license"],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "CRITICAL",
    autoComplianceCheck: true,
    requiresManualReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// DATA SECURITY & AI STRATEGY Requirements
// ============================================================================

export const dataSecurityRequirements: RegulatoryRequirement[] = [
  {
    id: "NCSC-CYBER-001",
    code: "NCSC-CYBER-001",
    title: "NCSC Cybersecurity Framework",
    description: "Compliance with National Cybersecurity Authority framework",
    authority: "NCSC",
    region: "SAUDI_ARABIA",
    category: "CYBERSECURITY",
    requirements: [
      {
        id: "req-010",
        section: "Cybersecurity",
        requirement: "NCSC cybersecurity compliance",
        description: "System must comply with NCSC cybersecurity framework",
        mandatory: true,
        priority: "CRITICAL",
        evidenceRequired: true,
        validationMethod: "HYBRID",
      },
    ],
    applicableTo: [{ entityType: "TENANT" }],
    rules: [],
    validationCriteria: [],
    requiredDocuments: [],
    apiEndpoints: [],
    effectiveDate: "2020-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["cybersecurity", "ncsc", "data security"],
    keywords: ["NCSC", "cybersecurity", "data protection"],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "CRITICAL",
    autoComplianceCheck: true,
    requiresManualReview: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "SDAIA-AI-001",
    code: "SDAIA-AI-001",
    title: "SDAIA AI Strategy Compliance",
    description:
      "Compliance with Saudi Data and AI Authority AI strategy and governance",
    authority: "SDAIA",
    region: "SAUDI_ARABIA",
    category: "AI_STRATEGY",
    requirements: [
      {
        id: "req-011",
        section: "AI Governance",
        requirement: "SDAIA AI strategy compliance",
        description:
          "AI systems must comply with SDAIA AI strategy and governance framework",
        mandatory: true,
        priority: "HIGH",
        evidenceRequired: true,
        validationMethod: "HYBRID",
      },
    ],
    applicableTo: [{ entityType: "TENANT" }],
    rules: [],
    validationCriteria: [],
    requiredDocuments: [],
    apiEndpoints: [],
    effectiveDate: "2021-01-01",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: ["ai", "strategy", "sdaia", "governance"],
    keywords: ["SDAIA", "AI strategy", "artificial intelligence", "governance"],
    relatedRequirements: [],
    status: "ACTIVE",
    priority: "HIGH",
    autoComplianceCheck: true,
    requiresManualReview: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// INITIALIZATION FUNCTION
// ============================================================================

/**
 * Initialize all Saudi Arabia regulatory requirements
 */
export async function initializeSaudiArabiaRequirements(): Promise<void> {
  const allRequirements = [
    ...tgaRequirements,
    ...motRequirements,
    ...absherRequirements,
    ...nafathRequirements,
    ...najizRequirements,
    ...saberRequirements,
    ...sfdaRequirements,
    ...dataSecurityRequirements,
  ];

  for (const requirement of allRequirements) {
    await complianceService.createOrUpdateRequirement(requirement);
  }

  console.log(
    `Initialized ${allRequirements.length} Saudi Arabia regulatory requirements`,
  );
}

// ============================================================================
// EXPORTS
// ============================================================================
