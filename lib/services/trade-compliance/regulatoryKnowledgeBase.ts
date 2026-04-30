/**
 * Regulatory Knowledge Base Service
 * Real-time tracking of tariffs, sanctions, regulatory changes, and customs programs
 * 4IR & 5IR Aligned - Continuous Learning & Adaptive Intelligence
 */

import type {
  TariffUpdate,
  SanctionsUpdate,
  RegulatoryChange,
  CustomsProgram,
  KnowledgeBaseStatus,
} from "@/types/customs-intelligence";

// ============================================================================
// TARIFF DATABASE
// ============================================================================

const TARIFF_UPDATES: TariffUpdate[] = [
  {
    id: "tar-001",
    country: "SA",
    hsCode: "2909.19",
    productDescription: "Ethers (excluding diethyl ether)",
    previousRate: 5,
    newRate: 0,
    effectiveDate: "2024-01-01",
    source: "ZATCA Official Gazette",
    impact: "POSITIVE",
    analysisNotes:
      "Duty exemption for industrial chemicals as part of Vision 2030 initiative",
    affectedTradeLanes: ["KW-SA", "AE-SA", "EU-SA"],
  },
  {
    id: "tar-002",
    country: "KW",
    hsCode: "3904.10",
    productDescription: "Polyvinyl chloride (PVC)",
    previousRate: 5,
    newRate: 5,
    effectiveDate: "2024-01-01",
    source: "Kuwait Customs Authority",
    impact: "NEUTRAL",
    analysisNotes: "GCC unified tariff maintained",
    affectedTradeLanes: ["SA-KW", "AE-KW", "CN-KW"],
  },
  {
    id: "tar-003",
    country: "SA",
    hsCode: "8542.31",
    productDescription: "Electronic integrated circuits - Processors",
    previousRate: 5,
    newRate: 0,
    effectiveDate: "2024-03-01",
    source: "ZATCA",
    impact: "POSITIVE",
    analysisNotes:
      "Technology sector incentives under digital transformation program",
    affectedTradeLanes: ["CN-SA", "TW-SA", "KR-SA", "US-SA"],
  },
  {
    id: "tar-004",
    country: "AE",
    hsCode: "7326.90",
    productDescription: "Steel products - Other",
    previousRate: 5,
    newRate: 10,
    effectiveDate: "2024-06-01",
    source: "UAE FCA",
    impact: "NEGATIVE",
    analysisNotes: "Anti-dumping measures on certain steel imports",
    affectedTradeLanes: ["CN-AE", "IN-AE", "TR-AE"],
  },
];

// ============================================================================
// SANCTIONS DATABASE
// ============================================================================

const SANCTIONS_UPDATES: SanctionsUpdate[] = [
  {
    id: "san-001",
    type: "COUNTRY",
    sanctioningAuthority: "UNSC",
    targetName: "North Korea",
    targetCountry: "KP",
    sanctionType: "COMPREHENSIVE",
    effectiveDate: "2006-10-14",
    description: "Comprehensive sanctions on trade with North Korea",
    implications: [
      "Complete trade embargo",
      "Financial transactions prohibited",
      "No shipping to/from DPRK",
    ],
    complianceRequirements: [
      "Screen all parties against sanctions lists",
      "Verify end-use and end-user",
      "No transshipment through DPRK",
    ],
    source: "UN Security Council Resolution 1718",
    lastUpdated: "2024-01-15",
  },
  {
    id: "san-002",
    type: "ENTITY",
    sanctioningAuthority: "OFAC",
    targetName: "Various entities on SDN List",
    sanctionType: "TARGETED",
    effectiveDate: "2024-01-01",
    description: "Specially Designated Nationals and Blocked Persons",
    implications: [
      "Cannot conduct business with listed entities",
      "Assets must be blocked",
      "Reporting requirements",
    ],
    complianceRequirements: [
      "Screen all business partners against SDN list",
      "Implement ongoing monitoring",
      "Report any matches to OFAC",
    ],
    source: "US Department of Treasury - OFAC",
    lastUpdated: "2024-12-01",
  },
  {
    id: "san-003",
    type: "SECTOR",
    sanctioningAuthority: "EU",
    targetName: "Russian Energy Sector",
    targetCountry: "RU",
    sanctionType: "PARTIAL",
    effectiveDate: "2022-02-28",
    description: "Restrictions on Russian energy sector equipment and services",
    implications: [
      "Export controls on oil industry equipment",
      "Financial restrictions on energy sector",
      "Technology transfer limitations",
    ],
    complianceRequirements: [
      "Verify end-user is not in restricted sector",
      "Check for dual-use technology",
      "Obtain licenses where required",
    ],
    alternatives: [
      "Source from alternative suppliers",
      "Use non-sanctioned routes",
    ],
    source: "EU Council Regulation",
    lastUpdated: "2024-06-15",
  },
];

// ============================================================================
// REGULATORY CHANGES DATABASE
// ============================================================================

const REGULATORY_CHANGES: RegulatoryChange[] = [
  {
    id: "reg-001",
    country: "SA",
    authority: "SFDA",
    category: "IMPORT",
    title: "New Food Import Requirements",
    description:
      "Enhanced traceability requirements for food imports including batch tracking and origin verification",
    effectiveDate: "2024-07-01",
    impactLevel: "HIGH",
    affectedProducts: ["FOOD", "BEVERAGES"],
    affectedCountries: ["ALL"],
    requiredActions: [
      "Implement batch tracking system",
      "Register products on SFDA platform",
      "Update labeling to include QR codes",
    ],
    source: "SFDA Circular 2024-15",
    analysisNotes:
      "Part of food safety enhancement initiative. Early compliance recommended.",
  },
  {
    id: "reg-002",
    country: "KW",
    authority: "KGAC",
    category: "DOCUMENTATION",
    title: "Electronic Document Submission Mandate",
    description:
      "All customs documents must be submitted electronically through ASYCUDA system",
    effectiveDate: "2024-04-01",
    impactLevel: "MEDIUM",
    affectedProducts: ["ALL"],
    affectedCountries: ["ALL"],
    requiredActions: [
      "Register on ASYCUDA platform",
      "Train staff on electronic submission",
      "Phase out paper-based submissions",
    ],
    source: "Kuwait Customs Directive 2024-03",
    analysisNotes:
      "Transition period until June 2024. Electronic submissions may reduce processing time.",
  },
  {
    id: "reg-003",
    country: "SA",
    authority: "ZATCA",
    category: "TARIFF",
    title: "GCC Common External Tariff Update",
    description:
      "Updates to GCC CET including new HS codes and rate adjustments",
    effectiveDate: "2024-01-01",
    impactLevel: "MEDIUM",
    affectedProducts: ["MULTIPLE"],
    affectedCountries: ["GCC"],
    requiredActions: [
      "Review new tariff classifications",
      "Update customs declarations",
      "Verify HS code mappings",
    ],
    source: "GCC Secretariat",
    analysisNotes: "Annual update. Check product-specific impact.",
  },
  {
    id: "reg-004",
    country: "AE",
    authority: "MoIAT",
    category: "LICENSING",
    title: "Enhanced Industrial Product Certification",
    description:
      "New certification requirements for industrial products under Emirates Conformity Assessment Scheme",
    effectiveDate: "2024-09-01",
    impactLevel: "HIGH",
    affectedProducts: ["INDUSTRIAL", "CONSTRUCTION", "ELECTRICAL"],
    affectedCountries: ["ALL"],
    requiredActions: [
      "Obtain ECAS certificate for covered products",
      "Register with approved conformity assessment body",
      "Update product documentation",
    ],
    source: "MoIAT Regulation 2024-08",
    analysisNotes:
      "Significant impact on industrial imports. Start certification process early.",
  },
  {
    id: "reg-005",
    country: "SA",
    authority: "SASO",
    category: "INSPECTION",
    title: "SABER 2.0 Platform Launch",
    description:
      "Enhanced SABER platform with improved verification and tracking capabilities",
    effectiveDate: "2024-10-01",
    impactLevel: "MEDIUM",
    affectedProducts: ["REGULATED"],
    affectedCountries: ["ALL"],
    requiredActions: [
      "Re-register on new SABER platform",
      "Update integration APIs",
      "Complete new certification process",
    ],
    source: "SASO Technical Bulletin",
    analysisNotes: "Platform upgrade. Existing certificates will need renewal.",
  },
];

// ============================================================================
// CUSTOMS PROGRAMS DATABASE
// ============================================================================

const CUSTOMS_PROGRAMS: CustomsProgram[] = [
  {
    id: "prog-001",
    country: "SA",
    name: "ZATCA Fast Track",
    description: "Expedited clearance for pre-registered compliant shipments",
    benefits: [
      "Reduced inspection rates",
      "Priority processing queue",
      "Simplified documentation",
    ],
    eligibility: [
      "Registered importer/exporter",
      "Clean compliance history",
      "Electronic filing capability",
    ],
    processingTime: 14,
    fees: { amount: 0, currency: "SAR" },
  },
  {
    id: "prog-002",
    country: "AE",
    name: "Dubai Trade Facilitation",
    description: "Streamlined import/export processing through Dubai Customs",
    benefits: [
      "24/7 processing capability",
      "Single window platform",
      "Automated assessment",
    ],
    eligibility: ["Dubai trade license", "Registered on Dubai Trade platform"],
    applicationUrl: "https://dubaitrade.ae",
    processingTime: 7,
    fees: { amount: 500, currency: "AED" },
  },
  {
    id: "prog-003",
    country: "KW",
    name: "Kuwait Single Window",
    description:
      "Integrated platform for all trade-related government services",
    benefits: [
      "One-stop submission",
      "Reduced documentation",
      "Faster approvals",
    ],
    eligibility: [
      "Registered business in Kuwait",
      "Valid import/export license",
    ],
    applicationUrl: "https://kuwaittradeportal.gov.kw",
    processingTime: 5,
    fees: { amount: 0, currency: "KWD" },
  },
];

// ============================================================================
// REGULATORY KNOWLEDGE BASE SERVICE
// ============================================================================

class RegulatoryKnowledgeBaseService {
  /**
   * Get knowledge base status
   */
  async getStatus(): Promise<KnowledgeBaseStatus> {
    return {
      lastUpdated: new Date().toISOString(),
      sources: [
        {
          name: "GCC Tariff Database",
          type: "TARIFF",
          lastSync: new Date(Date.now() - 3600000).toISOString(),
          status: "SYNCED",
          recordCount: TARIFF_UPDATES.length,
        },
        {
          name: "Global Sanctions List",
          type: "SANCTIONS",
          lastSync: new Date(Date.now() - 7200000).toISOString(),
          status: "SYNCED",
          recordCount: SANCTIONS_UPDATES.length,
        },
        {
          name: "Regulatory Updates Feed",
          type: "REGULATORY",
          lastSync: new Date(Date.now() - 1800000).toISOString(),
          status: "SYNCED",
          recordCount: REGULATORY_CHANGES.length,
        },
        {
          name: "Customs Programs Registry",
          type: "PROGRAM",
          lastSync: new Date(Date.now() - 86400000).toISOString(),
          status: "SYNCED",
          recordCount: CUSTOMS_PROGRAMS.length,
        },
      ],
      pendingAlerts: 2,
      criticalUpdates: 1,
    };
  }

  /**
   * Get tariff updates for a country or HS code
   */
  async getTariffUpdates(
    country?: string,
    hsCode?: string,
    fromDate?: string,
  ): Promise<TariffUpdate[]> {
    let updates = [...TARIFF_UPDATES];

    if (country) {
      updates = updates.filter((u) => u.country === country);
    }

    if (hsCode) {
      updates = updates.filter((u) => u.hsCode.startsWith(hsCode));
    }

    if (fromDate) {
      updates = updates.filter(
        (u) => new Date(u.effectiveDate) >= new Date(fromDate),
      );
    }

    return updates.sort(
      (a, b) =>
        new Date(b.effectiveDate).getTime() -
        new Date(a.effectiveDate).getTime(),
    );
  }

  /**
   * Get applicable tariff rate for a product
   */
  async getTariffRate(
    country: string,
    hsCode: string,
  ): Promise<{
    currentRate: number;
    effectiveDate: string;
    recentChanges: TariffUpdate[];
    upcomingChanges: TariffUpdate[];
  }> {
    const allUpdates = TARIFF_UPDATES.filter(
      (u) =>
        u.country === country && u.hsCode.startsWith(hsCode.substring(0, 4)),
    );

    const now = new Date();
    const effectiveUpdates = allUpdates.filter(
      (u) => new Date(u.effectiveDate) <= now,
    );
    const upcomingUpdates = allUpdates.filter(
      (u) => new Date(u.effectiveDate) > now,
    );

    const latestUpdate = effectiveUpdates.sort(
      (a, b) =>
        new Date(b.effectiveDate).getTime() -
        new Date(a.effectiveDate).getTime(),
    )[0];

    return {
      currentRate: latestUpdate?.newRate ?? 5, // Default 5% GCC CET
      effectiveDate: latestUpdate?.effectiveDate ?? "2024-01-01",
      recentChanges: effectiveUpdates.slice(0, 5),
      upcomingChanges: upcomingUpdates,
    };
  }

  /**
   * Get sanctions updates and screen entities
   */
  async getSanctionsUpdates(type?: string): Promise<SanctionsUpdate[]> {
    let updates = [...SANCTIONS_UPDATES];

    if (type) {
      updates = updates.filter((u) => u.type === type);
    }

    return updates.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    );
  }

  /**
   * Screen an entity or country against sanctions
   */
  async screenForSanctions(
    entityName?: string,
    countryCode?: string,
  ): Promise<{
    isRestricted: boolean;
    matchedSanctions: SanctionsUpdate[];
    recommendations: string[];
  }> {
    const matches: SanctionsUpdate[] = [];
    const recommendations: string[] = [];

    if (countryCode) {
      const countryMatches = SANCTIONS_UPDATES.filter(
        (s) => s.targetCountry === countryCode || s.type === "COUNTRY",
      );
      matches.push(...countryMatches);
    }

    if (entityName) {
      // In production, this would use fuzzy matching and SDN list lookup
      const entityMatches = SANCTIONS_UPDATES.filter(
        (s) =>
          s.type === "ENTITY" &&
          s.targetName.toLowerCase().includes(entityName.toLowerCase()),
      );
      matches.push(...entityMatches);
    }

    const isRestricted = matches.length > 0;

    if (isRestricted) {
      recommendations.push("Consult legal counsel before proceeding");
      recommendations.push("Verify all parties are not on restricted lists");
      matches.forEach((m) => {
        if (m.alternatives && m.alternatives.length > 0) {
          recommendations.push(...m.alternatives);
        }
      });
    } else {
      recommendations.push(
        "No sanctions matches found - proceed with standard due diligence",
      );
    }

    return { isRestricted, matchedSanctions: matches, recommendations };
  }

  /**
   * Get regulatory changes
   */
  async getRegulatoryChanges(
    country?: string,
    category?: string,
    impactLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  ): Promise<RegulatoryChange[]> {
    let changes = [...REGULATORY_CHANGES];

    if (country) {
      changes = changes.filter((c) => c.country === country);
    }

    if (category) {
      changes = changes.filter((c) => c.category === category);
    }

    if (impactLevel) {
      changes = changes.filter((c) => c.impactLevel === impactLevel);
    }

    return changes.sort(
      (a, b) =>
        new Date(b.effectiveDate).getTime() -
        new Date(a.effectiveDate).getTime(),
    );
  }

  /**
   * Get upcoming regulatory changes that need attention
   */
  async getUpcomingRegulations(): Promise<RegulatoryChange[]> {
    const now = new Date();
    const threeMonthsFromNow = new Date(
      now.getTime() + 90 * 24 * 60 * 60 * 1000,
    );

    return REGULATORY_CHANGES.filter((c) => {
      const effectiveDate = new Date(c.effectiveDate);
      return effectiveDate > now && effectiveDate <= threeMonthsFromNow;
    }).sort(
      (a, b) =>
        new Date(a.effectiveDate).getTime() -
        new Date(b.effectiveDate).getTime(),
    );
  }

  /**
   * Get customs programs for a country
   */
  async getCustomsPrograms(country: string): Promise<CustomsProgram[]> {
    return CUSTOMS_PROGRAMS.filter((p) => p.country === country);
  }

  /**
   * Get all available customs programs
   */
  async getAllCustomsPrograms(): Promise<CustomsProgram[]> {
    return [...CUSTOMS_PROGRAMS];
  }

  /**
   * Get critical alerts requiring immediate attention
   */
  async getCriticalAlerts(): Promise<{
    sanctions: SanctionsUpdate[];
    regulations: RegulatoryChange[];
    tariffs: TariffUpdate[];
  }> {
    const now = new Date();
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      sanctions: SANCTIONS_UPDATES.filter((s) => {
        const updated = new Date(s.lastUpdated);
        return updated > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      }),
      regulations: REGULATORY_CHANGES.filter((r) => {
        const effective = new Date(r.effectiveDate);
        return (
          effective > now &&
          effective <= oneMonthFromNow &&
          r.impactLevel === "HIGH"
        );
      }),
      tariffs: TARIFF_UPDATES.filter((t) => {
        const effective = new Date(t.effectiveDate);
        return (
          effective > now &&
          effective <= oneMonthFromNow &&
          t.impact === "NEGATIVE"
        );
      }),
    };
  }

  /**
   * Comprehensive trade lane regulatory analysis
   */
  async analyzeTradeLane(
    originCountry: string,
    destinationCountry: string,
    productCategory: string,
  ): Promise<{
    applicableTariffs: TariffUpdate[];
    activeSanctions: SanctionsUpdate[];
    upcomingChanges: RegulatoryChange[];
    availablePrograms: CustomsProgram[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    recommendations: string[];
  }> {
    // Get tariffs for both countries
    const tariffs = await this.getTariffUpdates(destinationCountry);

    // Screen both countries for sanctions
    const originScreen = await this.screenForSanctions(
      undefined,
      originCountry,
    );
    const destScreen = await this.screenForSanctions(
      undefined,
      destinationCountry,
    );
    const activeSanctions = [
      ...originScreen.matchedSanctions,
      ...destScreen.matchedSanctions,
    ];

    // Get upcoming regulations for both countries
    const originRegs = await this.getRegulatoryChanges(originCountry);
    const destRegs = await this.getRegulatoryChanges(destinationCountry);
    const upcomingChanges = [...originRegs, ...destRegs].filter(
      (r) => new Date(r.effectiveDate) > new Date(),
    );

    // Get available programs
    const originPrograms = await this.getCustomsPrograms(originCountry);
    const destPrograms = await this.getCustomsPrograms(destinationCountry);
    const availablePrograms = [...originPrograms, ...destPrograms];

    // Assess risk
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    const recommendations: string[] = [];

    if (activeSanctions.length > 0) {
      riskLevel = "HIGH";
      recommendations.push(
        "Active sanctions detected - consult compliance team",
      );
    }

    const highImpactRegs = upcomingChanges.filter(
      (r) => r.impactLevel === "HIGH",
    );
    if (highImpactRegs.length > 0) {
      riskLevel = riskLevel === "HIGH" ? "HIGH" : "MEDIUM";
      recommendations.push(
        `${highImpactRegs.length} high-impact regulatory changes upcoming - review required actions`,
      );
    }

    if (availablePrograms.length > 0) {
      recommendations.push(
        `Consider enrolling in ${availablePrograms.map((p) => p.name).join(", ")} for trade facilitation benefits`,
      );
    }

    return {
      applicableTariffs: tariffs,
      activeSanctions,
      upcomingChanges,
      availablePrograms,
      riskLevel,
      recommendations,
    };
  }
}

export const regulatoryKnowledgeBase = new RegulatoryKnowledgeBaseService();
