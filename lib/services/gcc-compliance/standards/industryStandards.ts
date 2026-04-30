/**
 * Industry Standards Compliance Service
 *
 * Validates shipments against international and regional industry standards.
 * Covers GS1, IATA, IMO, ADR, ATP, and GCC-specific standards.
 *
 * @module gcc-compliance/standards/industryStandards
 */

// ============================================================================
// TYPES
// ============================================================================

export interface IndustryStandard {
  /** Standard code */
  code: string;
  /** Standard name */
  name: string;
  /** Governing body */
  governingBody: string;
  /** Applicable sectors */
  sectors: IndustrySector[];
  /** Version */
  version: string;
  /** Effective date */
  effectiveDate: Date;
  /** Is mandatory in GCC */
  mandatoryInGCC: boolean;
  /** Compliance requirements */
  requirements: StandardRequirement[];
  /** Reference URL */
  referenceUrl: string;
  /** Confidence score */
  confidenceScore: number;
}

export type IndustrySector =
  | 'ALL'
  | 'FOOD_BEVERAGE'
  | 'PHARMACEUTICALS'
  | 'CHEMICALS'
  | 'HAZMAT'
  | 'AUTOMOTIVE'
  | 'ELECTRONICS'
  | 'TEXTILES'
  | 'CONSTRUCTION'
  | 'OIL_GAS'
  | 'RETAIL'
  | 'HEALTHCARE';

export interface StandardRequirement {
  /** Requirement ID */
  id: string;
  /** Description */
  description: string;
  /** Validation type */
  validationType: 'DOCUMENT' | 'DATA' | 'EQUIPMENT' | 'PROCESS' | 'CERTIFICATION';
  /** Validation rule */
  validationRule: string;
  /** Penalty for non-compliance */
  penalty?: number;
  /** Is critical (blocks shipment) */
  isCritical: boolean;
}

export interface StandardsComplianceResult {
  /** Overall compliant */
  isCompliant: boolean;
  /** Compliance score (0-100) */
  complianceScore: number;
  /** Standards checked */
  standardsChecked: StandardCheckResult[];
  /** Recommendations */
  recommendations: string[];
  /** Certification eligibility */
  certificationEligible: boolean;
  /** Timestamp */
  timestamp: Date;
}

export interface StandardCheckResult {
  /** Standard code */
  standardCode: string;
  /** Standard name */
  standardName: string;
  /** Is compliant */
  isCompliant: boolean;
  /** Requirements met */
  requirementsMet: number;
  /** Total requirements */
  totalRequirements: number;
  /** Failed requirements */
  failedRequirements: string[];
  /** Warnings */
  warnings: string[];
}

// ============================================================================
// GS1 STANDARDS (Supply Chain Visibility)
// ============================================================================

export const GS1_STANDARDS: IndustryStandard[] = [
  {
    code: 'GS1-SSCC',
    name: 'Serial Shipping Container Code',
    governingBody: 'GS1 Global',
    sectors: ['ALL'],
    version: '2024.1',
    effectiveDate: new Date('2024-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'GS1-SSCC-01',
        description: 'Each logistics unit must have unique 18-digit SSCC',
        validationType: 'DATA',
        validationRule: 'SSCC matches regex: ^[0-9]{18}$',
        isCritical: true,
      },
      {
        id: 'GS1-SSCC-02',
        description: 'SSCC must include valid GS1 Company Prefix',
        validationType: 'DATA',
        validationRule: 'Company prefix registered with GS1',
        isCritical: true,
      },
      {
        id: 'GS1-SSCC-03',
        description: 'Barcode must be scannable (GS1-128 or DataMatrix)',
        validationType: 'EQUIPMENT',
        validationRule: 'Barcode scan success rate > 99%',
        isCritical: false,
      },
    ],
    referenceUrl: 'https://www.gs1.org/standards/id-keys/sscc',
    confidenceScore: 0.99,
  },
  {
    code: 'GS1-GTIN',
    name: 'Global Trade Item Number',
    governingBody: 'GS1 Global',
    sectors: ['RETAIL', 'FOOD_BEVERAGE', 'PHARMACEUTICALS', 'HEALTHCARE'],
    version: '2024.1',
    effectiveDate: new Date('2024-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'GS1-GTIN-01',
        description: 'Each product must have valid 14-digit GTIN',
        validationType: 'DATA',
        validationRule: 'GTIN matches regex: ^[0-9]{14}$ and check digit valid',
        isCritical: true,
      },
      {
        id: 'GS1-GTIN-02',
        description: 'GTIN must be registered in GS1 Global Registry',
        validationType: 'DATA',
        validationRule: 'GTIN lookup returns valid product',
        isCritical: false,
      },
    ],
    referenceUrl: 'https://www.gs1.org/standards/id-keys/gtin',
    confidenceScore: 0.99,
  },
  {
    code: 'GS1-EPCIS',
    name: 'Electronic Product Code Information Services',
    governingBody: 'GS1 Global',
    sectors: ['PHARMACEUTICALS', 'FOOD_BEVERAGE', 'HEALTHCARE'],
    version: '2.0',
    effectiveDate: new Date('2022-01-01'),
    mandatoryInGCC: false,
    requirements: [
      {
        id: 'GS1-EPCIS-01',
        description: 'Event data must follow EPCIS 2.0 schema',
        validationType: 'DATA',
        validationRule: 'XML/JSON validates against EPCIS 2.0 XSD',
        isCritical: true,
      },
      {
        id: 'GS1-EPCIS-02',
        description: 'Events must include What/When/Where/Why dimensions',
        validationType: 'DATA',
        validationRule: 'All required dimensions present',
        isCritical: true,
      },
    ],
    referenceUrl: 'https://www.gs1.org/standards/epcis',
    confidenceScore: 0.97,
  },
];

// ============================================================================
// HAZMAT STANDARDS (ADR, IMDG, IATA-DGR)
// ============================================================================

export const HAZMAT_STANDARDS: IndustryStandard[] = [
  {
    code: 'ADR-2025',
    name: 'European Agreement Concerning the International Carriage of Dangerous Goods by Road',
    governingBody: 'UNECE',
    sectors: ['HAZMAT', 'CHEMICALS', 'OIL_GAS'],
    version: '2025',
    effectiveDate: new Date('2025-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'ADR-01',
        description: 'Dangerous goods must have valid UN number classification',
        validationType: 'DATA',
        validationRule: 'UN number exists in ADR dangerous goods list',
        penalty: 50000,
        isCritical: true,
      },
      {
        id: 'ADR-02',
        description: 'Transport document must include all 11 mandatory items',
        validationType: 'DOCUMENT',
        validationRule: 'Document contains: UN number, proper shipping name, class, PG, quantity, etc.',
        penalty: 25000,
        isCritical: true,
      },
      {
        id: 'ADR-03',
        description: 'Vehicle must display correct hazard placards',
        validationType: 'EQUIPMENT',
        validationRule: 'Placards match cargo class and are visible',
        penalty: 15000,
        isCritical: true,
      },
      {
        id: 'ADR-04',
        description: 'Driver must hold valid ADR training certificate',
        validationType: 'CERTIFICATION',
        validationRule: 'ADR certificate valid and not expired',
        penalty: 20000,
        isCritical: true,
      },
      {
        id: 'ADR-05',
        description: 'Vehicle must carry required safety equipment',
        validationType: 'EQUIPMENT',
        validationRule: 'Fire extinguisher, wheel chocks, warning signs, PPE present',
        penalty: 10000,
        isCritical: true,
      },
    ],
    referenceUrl: 'https://unece.org/transport/dangerous-goods/adr-2025',
    confidenceScore: 0.99,
  },
  {
    code: 'IMDG-2024',
    name: 'International Maritime Dangerous Goods Code',
    governingBody: 'IMO',
    sectors: ['HAZMAT', 'CHEMICALS'],
    version: '41-22',
    effectiveDate: new Date('2024-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'IMDG-01',
        description: 'Container must have valid CSC plate',
        validationType: 'EQUIPMENT',
        validationRule: 'CSC plate present and inspection date valid',
        isCritical: true,
      },
      {
        id: 'IMDG-02',
        description: 'Dangerous goods declaration (DGD) required',
        validationType: 'DOCUMENT',
        validationRule: 'DGD signed and contains all mandatory information',
        isCritical: true,
      },
      {
        id: 'IMDG-03',
        description: 'Container packing certificate required for FCL',
        validationType: 'DOCUMENT',
        validationRule: 'Certificate confirms proper packing and securing',
        isCritical: true,
      },
    ],
    referenceUrl: 'https://www.imo.org/en/OurWork/Safety/Pages/DangerousGoods-default.aspx',
    confidenceScore: 0.98,
  },
  {
    code: 'IATA-DGR',
    name: 'IATA Dangerous Goods Regulations',
    governingBody: 'IATA',
    sectors: ['HAZMAT', 'CHEMICALS', 'PHARMACEUTICALS'],
    version: '66th Edition',
    effectiveDate: new Date('2025-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'IATA-DGR-01',
        description: 'Shipper\'s Declaration for Dangerous Goods required',
        validationType: 'DOCUMENT',
        validationRule: 'IATA DGD form completed correctly',
        isCritical: true,
      },
      {
        id: 'IATA-DGR-02',
        description: 'Packaging must meet UN specification',
        validationType: 'EQUIPMENT',
        validationRule: 'UN packaging mark present and valid',
        isCritical: true,
      },
    ],
    referenceUrl: 'https://www.iata.org/en/publications/dgr/',
    confidenceScore: 0.98,
  },
];

// ============================================================================
// COLD CHAIN STANDARDS (ATP, GDP)
// ============================================================================

export const COLD_CHAIN_STANDARDS: IndustryStandard[] = [
  {
    code: 'ATP-2024',
    name: 'Agreement on the International Carriage of Perishable Foodstuffs',
    governingBody: 'UNECE',
    sectors: ['FOOD_BEVERAGE'],
    version: '2024',
    effectiveDate: new Date('2024-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'ATP-01',
        description: 'Vehicle must have valid ATP certificate',
        validationType: 'CERTIFICATION',
        validationRule: 'ATP certificate class matches cargo requirements',
        penalty: 30000,
        isCritical: true,
      },
      {
        id: 'ATP-02',
        description: 'Temperature must be maintained within required range',
        validationType: 'EQUIPMENT',
        validationRule: 'Temperature logger shows continuous compliance',
        penalty: 50000,
        isCritical: true,
      },
      {
        id: 'ATP-03',
        description: 'Temperature recording equipment must be calibrated',
        validationType: 'EQUIPMENT',
        validationRule: 'Calibration certificate valid within 12 months',
        isCritical: false,
      },
    ],
    referenceUrl: 'https://unece.org/transport/standards/transport/perishable-foodstuffs',
    confidenceScore: 0.97,
  },
  {
    code: 'GDP-2024',
    name: 'Good Distribution Practice for Medicinal Products',
    governingBody: 'WHO/EMA',
    sectors: ['PHARMACEUTICALS', 'HEALTHCARE'],
    version: '2024',
    effectiveDate: new Date('2024-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'GDP-01',
        description: 'Qualified Person must approve distribution',
        validationType: 'CERTIFICATION',
        validationRule: 'Release approved by authorized QP',
        isCritical: true,
      },
      {
        id: 'GDP-02',
        description: 'Temperature excursion protocol must be followed',
        validationType: 'PROCESS',
        validationRule: 'Excursions documented and assessed',
        isCritical: true,
      },
      {
        id: 'GDP-03',
        description: 'Validated cold chain packaging required',
        validationType: 'EQUIPMENT',
        validationRule: 'Packaging validated for journey duration',
        isCritical: true,
      },
      {
        id: 'GDP-04',
        description: 'Traceability from manufacturer to patient',
        validationType: 'DATA',
        validationRule: 'Batch and serial numbers tracked at each point',
        isCritical: true,
      },
    ],
    referenceUrl: 'https://www.who.int/medicines/areas/quality_safety/quality_assurance/GDP/en/',
    confidenceScore: 0.98,
  },
];

// ============================================================================
// GCC-SPECIFIC STANDARDS
// ============================================================================

export const GCC_STANDARDS: IndustryStandard[] = [
  {
    code: 'GSO-ISO-22000',
    name: 'GCC Food Safety Management System',
    governingBody: 'GSO (GCC Standardization Organization)',
    sectors: ['FOOD_BEVERAGE'],
    version: '2018',
    effectiveDate: new Date('2018-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'GSO-FS-01',
        description: 'Food transport vehicles must be GSO certified',
        validationType: 'CERTIFICATION',
        validationRule: 'GSO-ISO-22000 certification valid',
        isCritical: true,
      },
      {
        id: 'GSO-FS-02',
        description: 'SFDA import permit for regulated products',
        validationType: 'DOCUMENT',
        validationRule: 'Valid SFDA import permit number',
        isCritical: true,
      },
    ],
    referenceUrl: 'https://gso.org.sa/en/',
    confidenceScore: 0.96,
  },
  {
    code: 'SASO-2024',
    name: 'Saudi Standards, Metrology and Quality Organization',
    governingBody: 'SASO',
    sectors: ['ALL'],
    version: '2024',
    effectiveDate: new Date('2024-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'SASO-01',
        description: 'Products must have SABER certificate of conformity',
        validationType: 'CERTIFICATION',
        validationRule: 'Valid SABER CoC for product HS code',
        penalty: 100000,
        isCritical: true,
      },
      {
        id: 'SASO-02',
        description: 'Arabic labeling required for consumer products',
        validationType: 'EQUIPMENT',
        validationRule: 'Labels include Arabic product information',
        isCritical: false,
      },
    ],
    referenceUrl: 'https://www.saso.gov.sa/',
    confidenceScore: 0.98,
  },
  {
    code: 'GCC-CUSTOMS-UNION',
    name: 'GCC Customs Union Unified Procedures',
    governingBody: 'GCC Secretariat General',
    sectors: ['ALL'],
    version: '2015',
    effectiveDate: new Date('2015-01-01'),
    mandatoryInGCC: true,
    requirements: [
      {
        id: 'GCC-CU-01',
        description: 'Unified customs declaration for GCC transit',
        validationType: 'DOCUMENT',
        validationRule: 'GCC unified customs form completed',
        isCritical: true,
      },
      {
        id: 'GCC-CU-02',
        description: 'Certificate of origin for preferential treatment',
        validationType: 'DOCUMENT',
        validationRule: 'GCC-origin certificate from chamber of commerce',
        isCritical: false,
      },
    ],
    referenceUrl: 'https://www.gcc-sg.org/',
    confidenceScore: 0.95,
  },
];

// ============================================================================
// ALL STANDARDS
// ============================================================================

export const ALL_INDUSTRY_STANDARDS: IndustryStandard[] = [
  ...GS1_STANDARDS,
  ...HAZMAT_STANDARDS,
  ...COLD_CHAIN_STANDARDS,
  ...GCC_STANDARDS,
];

// ============================================================================
// STANDARDS COMPLIANCE SERVICE
// ============================================================================

export interface ComplianceCheckRequest {
  /** Shipment ID */
  shipmentId: string;
  /** Cargo type */
  cargoType: string;
  /** Industry sector */
  sector: IndustrySector;
  /** Available documents */
  documents: {
    type: string;
    number?: string;
    valid: boolean;
    expiryDate?: Date;
  }[];
  /** Available certifications */
  certifications: {
    type: string;
    number: string;
    valid: boolean;
    expiryDate: Date;
  }[];
  /** Equipment details */
  equipment: {
    type: string;
    hasTemperatureLogger?: boolean;
    hasGPS?: boolean;
    hasSafetyEquipment?: boolean;
    atpCertified?: boolean;
  };
  /** Product identifiers */
  productIdentifiers?: {
    gtin?: string;
    sscc?: string;
    unNumber?: string;
    hazClass?: string;
  };
}

class IndustryStandardsService {
  /**
   * Check compliance against all applicable standards
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<StandardsComplianceResult> {
    const applicableStandards = this.getApplicableStandards(request.sector, request.cargoType);
    const results: StandardCheckResult[] = [];
    const recommendations: string[] = [];

    for (const standard of applicableStandards) {
      const result = await this.checkStandard(standard, request);
      results.push(result);

      if (!result.isCompliant) {
        recommendations.push(
          `[${standard.code}] Fix: ${result.failedRequirements.join(', ')}`
        );
      }

      if (result.warnings.length > 0) {
        recommendations.push(
          `[${standard.code}] Warning: ${result.warnings.join(', ')}`
        );
      }
    }

    const totalMet = results.reduce((sum, r) => sum + r.requirementsMet, 0);
    const totalReqs = results.reduce((sum, r) => sum + r.totalRequirements, 0);
    const complianceScore = totalReqs > 0 ? Math.round((totalMet / totalReqs) * 100) : 100;

    return {
      isCompliant: results.every((r) => r.isCompliant),
      complianceScore,
      standardsChecked: results,
      recommendations,
      certificationEligible: complianceScore >= 95,
      timestamp: new Date(),
    };
  }

  /**
   * Get applicable standards for a sector and cargo type
   */
  private getApplicableStandards(sector: IndustrySector, cargoType: string): IndustryStandard[] {
    return ALL_INDUSTRY_STANDARDS.filter(
      (standard) =>
        standard.sectors.includes('ALL') || standard.sectors.includes(sector)
    );
  }

  /**
   * Check a single standard
   */
  private async checkStandard(
    standard: IndustryStandard,
    request: ComplianceCheckRequest
  ): Promise<StandardCheckResult> {
    const failedRequirements: string[] = [];
    const warnings: string[] = [];
    let requirementsMet = 0;

    for (const requirement of standard.requirements) {
      const passed = this.evaluateRequirement(requirement, request);
      if (passed) {
        requirementsMet++;
      } else if (requirement.isCritical) {
        failedRequirements.push(requirement.description);
      } else {
        warnings.push(requirement.description);
        requirementsMet++; // Non-critical still counts as partial compliance
      }
    }

    return {
      standardCode: standard.code,
      standardName: standard.name,
      isCompliant: failedRequirements.length === 0,
      requirementsMet,
      totalRequirements: standard.requirements.length,
      failedRequirements,
      warnings,
    };
  }

  /**
   * Evaluate a single requirement
   */
  private evaluateRequirement(
    requirement: StandardRequirement,
    request: ComplianceCheckRequest
  ): boolean {
    switch (requirement.validationType) {
      case 'DOCUMENT':
        return this.checkDocumentRequirement(requirement, request);
      case 'CERTIFICATION':
        return this.checkCertificationRequirement(requirement, request);
      case 'EQUIPMENT':
        return this.checkEquipmentRequirement(requirement, request);
      case 'DATA':
        return this.checkDataRequirement(requirement, request);
      case 'PROCESS':
        return true; // Process requirements need manual verification
      default:
        return true;
    }
  }

  private checkDocumentRequirement(
    requirement: StandardRequirement,
    request: ComplianceCheckRequest
  ): boolean {
    // Check if required document type exists and is valid
    const docType = requirement.id.split('-')[0].toLowerCase();
    const doc = request.documents.find(
      (d) => d.type.toLowerCase().includes(docType) || d.type.toLowerCase().includes(requirement.description.toLowerCase().split(' ')[0])
    );
    return doc?.valid === true;
  }

  private checkCertificationRequirement(
    requirement: StandardRequirement,
    request: ComplianceCheckRequest
  ): boolean {
    const certType = requirement.id.split('-')[0].toLowerCase();
    const cert = request.certifications.find(
      (c) => c.type.toLowerCase().includes(certType) && c.valid && c.expiryDate > new Date()
    );
    return cert !== undefined;
  }

  private checkEquipmentRequirement(
    requirement: StandardRequirement,
    request: ComplianceCheckRequest
  ): boolean {
    if (requirement.id.includes('TEMP') || requirement.description.toLowerCase().includes('temperature')) {
      return request.equipment.hasTemperatureLogger === true;
    }
    if (requirement.id.includes('ATP') || requirement.description.toLowerCase().includes('atp')) {
      return request.equipment.atpCertified === true;
    }
    if (requirement.description.toLowerCase().includes('safety')) {
      return request.equipment.hasSafetyEquipment === true;
    }
    return true; // Default to true for unmatched requirements
  }

  private checkDataRequirement(
    requirement: StandardRequirement,
    request: ComplianceCheckRequest
  ): boolean {
    if (requirement.id.includes('SSCC') && request.productIdentifiers?.sscc) {
      return /^[0-9]{18}$/.test(request.productIdentifiers.sscc);
    }
    if (requirement.id.includes('GTIN') && request.productIdentifiers?.gtin) {
      return /^[0-9]{14}$/.test(request.productIdentifiers.gtin);
    }
    if (requirement.id.includes('UN') && request.productIdentifiers?.unNumber) {
      return /^UN[0-9]{4}$/.test(request.productIdentifiers.unNumber);
    }
    return true;
  }

  /**
   * Get all standards for a sector
   */
  getStandardsForSector(sector: IndustrySector): IndustryStandard[] {
    return ALL_INDUSTRY_STANDARDS.filter(
      (s) => s.sectors.includes('ALL') || s.sectors.includes(sector)
    );
  }

  /**
   * Get mandatory GCC standards
   */
  getMandatoryGCCStandards(): IndustryStandard[] {
    return ALL_INDUSTRY_STANDARDS.filter((s) => s.mandatoryInGCC);
  }
}

export const industryStandardsService = new IndustryStandardsService();
export default industryStandardsService;
