/**
 * Trade Program Advisor Service
 * Intelligent recommendation engine for AEO, Trusted Trader, and customs programs
 * 4IR & 5IR Aligned - AI-Powered Trade Facilitation Optimization
 */

import type {
  TradeProgram,
  TradeProgramType,
  ProgramTier,
  ProgramBenefit,
  UnlockedCapability,
  EligibilityCriterion,
  ApplicationStep,
  MutualRecognitionAgreement,
  TradeProgramRecommendation,
  ProgramComparison,
  ROIAnalysis,
} from "@/types/customs-intelligence";

// ============================================================================
// TRADE PROGRAMS DATABASE
// ============================================================================

const TRADE_PROGRAMS: TradeProgram[] = [
  // Saudi Arabia Programs
  {
    id: "sa-aeo",
    type: "AEO",
    name: "Saudi AEO",
    fullName: "Saudi Authorized Economic Operator Program",
    country: "SA",
    region: "GCC",
    authority: "ZATCA",
    authorityFullName: "Zakat, Tax and Customs Authority",
    tier: "ADVANCED",
    description:
      "The Saudi AEO program provides trusted traders with expedited customs clearance, reduced inspections, and priority processing at all Saudi ports and borders.",

    eligibilityCriteria: [
      {
        id: "sa-aeo-1",
        category: "COMPLIANCE",
        requirement: "Clean customs record for 3 years",
        description: "No major violations or penalties in the last 3 years",
        isMandatory: true,
        verificationMethod: "ZATCA database check",
        estimatedEffort: "LOW",
      },
      {
        id: "sa-aeo-2",
        category: "FINANCIAL",
        requirement: "Minimum annual trade volume of SAR 10 million",
        description: "Demonstrated significant trade volume with Saudi Arabia",
        isMandatory: true,
        verificationMethod: "Financial statements and customs records",
        estimatedEffort: "LOW",
      },
      {
        id: "sa-aeo-3",
        category: "SECURITY",
        requirement: "Comprehensive security management system",
        description:
          "Physical security, personnel security, and supply chain security measures",
        isMandatory: true,
        verificationMethod: "On-site audit",
        estimatedEffort: "HIGH",
      },
      {
        id: "sa-aeo-4",
        category: "OPERATIONAL",
        requirement: "Electronic record-keeping system",
        description:
          "Ability to maintain and provide electronic records for customs purposes",
        isMandatory: true,
        verificationMethod: "System demonstration",
        estimatedEffort: "MEDIUM",
      },
    ],

    applicationProcess: [
      {
        order: 1,
        name: "Self-Assessment",
        description: "Complete self-assessment questionnaire and gap analysis",
        duration: { min: 1, max: 2, unit: "WEEKS" },
        dependencies: [],
        documents: ["Self-assessment form", "Gap analysis report"],
        authority: "Internal",
        tips: [
          "Use the official ZATCA self-assessment tool",
          "Identify gaps early for remediation",
        ],
      },
      {
        order: 2,
        name: "Application Submission",
        description: "Submit formal application with all required documents",
        duration: { min: 1, max: 2, unit: "WEEKS" },
        dependencies: ["Self-Assessment"],
        documents: [
          "Application form",
          "Company registration",
          "Financial statements",
          "Security policy",
        ],
        authority: "ZATCA",
        tips: [
          "Ensure all documents are certified",
          "Include 3 years of customs history",
        ],
      },
      {
        order: 3,
        name: "Document Review",
        description: "ZATCA reviews submitted documentation",
        duration: { min: 2, max: 4, unit: "WEEKS" },
        dependencies: ["Application Submission"],
        documents: [],
        authority: "ZATCA",
        tips: [
          "Respond promptly to any queries",
          "Keep documentation organized",
        ],
      },
      {
        order: 4,
        name: "On-Site Audit",
        description: "ZATCA conducts physical audit of facilities",
        duration: { min: 1, max: 3, unit: "WEEKS" },
        dependencies: ["Document Review"],
        documents: ["Audit preparation checklist"],
        authority: "ZATCA",
        tips: [
          "Prepare staff for interviews",
          "Have all records readily accessible",
        ],
      },
      {
        order: 5,
        name: "Approval & Certification",
        description: "Final approval and certificate issuance",
        duration: { min: 1, max: 2, unit: "WEEKS" },
        dependencies: ["On-Site Audit"],
        documents: ["AEO Certificate"],
        authority: "ZATCA",
        tips: ["Plan for certificate renewal 6 months before expiry"],
      },
    ],

    estimatedProcessingTime: { min: 60, max: 120, average: 90 },

    applicationFee: { amount: 5000, currency: "SAR" },
    annualFee: { amount: 2500, currency: "SAR" },
    auditCosts: { amount: 15000, currency: "SAR" },
    totalFirstYearCost: { amount: 22500, currency: "SAR" },

    benefits: [
      {
        id: "sa-aeo-b1",
        category: "REDUCED_INSPECTIONS",
        title: "Reduced Physical Inspections",
        description: "Up to 80% reduction in physical inspection rate",
        quantifiableImpact: {
          metric: "Inspection Rate",
          reduction: 80,
          annualSavings: { amount: 50000, currency: "SAR" },
        },
        applicableCountries: ["SA"],
      },
      {
        id: "sa-aeo-b2",
        category: "TIME_SAVINGS",
        title: "Expedited Customs Clearance",
        description: "Priority processing with dedicated lanes",
        quantifiableImpact: {
          metric: "Clearance Time",
          reduction: 70,
          annualSavings: { amount: 100000, currency: "SAR" },
        },
        applicableCountries: ["SA"],
      },
      {
        id: "sa-aeo-b3",
        category: "DEFERRED_PAYMENTS",
        title: "Deferred Duty Payment",
        description:
          "Pay customs duties on a monthly basis instead of per shipment",
        quantifiableImpact: {
          metric: "Cash Flow Improvement",
          reduction: 0,
          annualSavings: { amount: 200000, currency: "SAR" },
        },
        applicableCountries: ["SA"],
      },
      {
        id: "sa-aeo-b4",
        category: "SIMPLIFIED_PROCEDURES",
        title: "Simplified Documentation",
        description: "Reduced documentation requirements for routine shipments",
        quantifiableImpact: {
          metric: "Documentation Time",
          reduction: 50,
        },
        applicableCountries: ["SA"],
      },
      {
        id: "sa-aeo-b5",
        category: "PRIORITY_ACCESS",
        title: "Dedicated Account Manager",
        description: "Direct contact with ZATCA for issue resolution",
        applicableCountries: ["SA"],
      },
    ],

    unlockedCapabilities: [
      {
        id: "sa-aeo-u1",
        name: "Green Lane Access",
        description: "Access to dedicated green lane at all Saudi ports",
        category: "CLEARANCE",
        impact: "CRITICAL",
        beforeProgram: "Standard lane processing (4-8 hours average)",
        afterProgram: "Green lane processing (30-60 minutes average)",
        timeSavings: 6,
        costSavings: { amount: 500, currency: "SAR" },
      },
      {
        id: "sa-aeo-u2",
        name: "Self-Assessment Authorization",
        description: "Ability to self-assess duties for low-risk shipments",
        category: "CLEARANCE",
        impact: "HIGH",
        beforeProgram: "All shipments require customs assessment",
        afterProgram: "Self-assess routine shipments",
        timeSavings: 4,
      },
      {
        id: "sa-aeo-u3",
        name: "Release Before Payment",
        description: "Release goods before duty payment is processed",
        category: "PAYMENT",
        impact: "HIGH",
        beforeProgram: "Payment required before release",
        afterProgram: "Monthly consolidated payment",
        costSavings: { amount: 5000, currency: "SAR" },
      },
    ],

    mutualRecognitionAgreements: [
      {
        countryCode: "KR",
        countryName: "South Korea",
        program: "Korea AEO",
        status: "ACTIVE",
        benefits: ["Reduced inspections", "Priority processing"],
        effectiveDate: "2020-01-01",
      },
      {
        countryCode: "CN",
        countryName: "China",
        program: "China AEO",
        status: "NEGOTIATING",
        benefits: ["Expected reduced inspections"],
      },
      {
        countryCode: "AE",
        countryName: "UAE",
        program: "UAE AEO",
        status: "ACTIVE",
        benefits: ["Mutual recognition within GCC"],
        effectiveDate: "2021-06-01",
      },
    ],

    requirements: [
      {
        id: "sa-aeo-r1",
        category: "CERTIFICATION",
        name: "ISO 28000 Certification",
        description: "Supply chain security management system certification",
        mandatory: false,
        estimatedCost: { amount: 25000, currency: "SAR" },
        estimatedTime: 90,
        provider: "Accredited certification bodies",
      },
      {
        id: "sa-aeo-r2",
        category: "AUDIT",
        name: "Internal Audit",
        description: "Conduct internal audit before application",
        mandatory: true,
        estimatedCost: { amount: 10000, currency: "SAR" },
        estimatedTime: 14,
      },
      {
        id: "sa-aeo-r3",
        category: "TRAINING",
        name: "Staff Training",
        description: "Train key personnel on AEO requirements",
        mandatory: true,
        estimatedCost: { amount: 5000, currency: "SAR" },
        estimatedTime: 7,
      },
    ],

    renewalPeriod: 3,
    renewalProcess:
      "Submit renewal application 6 months before expiry with updated documentation",

    successMetrics: {
      approvalRate: 78,
      averageProcessingTime: 85,
      memberCount: 450,
      satisfactionScore: 4.2,
    },
  },

  // Kuwait Programs
  {
    id: "kw-golden-list",
    type: "GOLDEN_LIST",
    name: "Kuwait Golden List",
    fullName: "Kuwait Customs Golden List Program",
    country: "KW",
    region: "GCC",
    authority: "KGC",
    authorityFullName: "Kuwait General Customs",
    tier: "STANDARD",
    description:
      "The Kuwait Golden List program provides trusted importers with priority clearance and reduced inspection rates at Kuwait customs.",

    eligibilityCriteria: [
      {
        id: "kw-gl-1",
        category: "COMPLIANCE",
        requirement: "Clean customs record for 2 years",
        description: "No major violations in the last 2 years",
        isMandatory: true,
        verificationMethod: "KGC database check",
        estimatedEffort: "LOW",
      },
      {
        id: "kw-gl-2",
        category: "FINANCIAL",
        requirement: "Minimum 50 import transactions per year",
        description: "Regular importer with established trade pattern",
        isMandatory: true,
        verificationMethod: "Import records review",
        estimatedEffort: "LOW",
      },
      {
        id: "kw-gl-3",
        category: "OPERATIONAL",
        requirement: "Valid trade license",
        description: "Active Kuwait trade license in good standing",
        isMandatory: true,
        verificationMethod: "License verification",
        estimatedEffort: "LOW",
      },
    ],

    applicationProcess: [
      {
        order: 1,
        name: "Application Submission",
        description: "Submit application through KGC online portal",
        duration: { min: 1, max: 3, unit: "DAYS" },
        dependencies: [],
        documents: ["Application form", "Trade license", "Import history"],
        authority: "KGC",
        tips: ["Ensure all documents are in Arabic or officially translated"],
      },
      {
        order: 2,
        name: "Background Check",
        description: "Verification of customs history and compliance",
        duration: { min: 1, max: 2, unit: "WEEKS" },
        dependencies: ["Application Submission"],
        documents: [],
        authority: "KGC",
        tips: ["Resolve any outstanding issues before applying"],
      },
      {
        order: 3,
        name: "Approval",
        description: "Committee review and approval",
        duration: { min: 1, max: 2, unit: "WEEKS" },
        dependencies: ["Background Check"],
        documents: ["Golden List Certificate"],
        authority: "KGC",
        tips: ["Follow up regularly with the assigned officer"],
      },
    ],

    estimatedProcessingTime: { min: 21, max: 45, average: 30 },

    applicationFee: { amount: 0, currency: "KWD" },
    annualFee: { amount: 0, currency: "KWD" },
    auditCosts: { amount: 0, currency: "KWD" },
    totalFirstYearCost: { amount: 0, currency: "KWD" },

    benefits: [
      {
        id: "kw-gl-b1",
        category: "REDUCED_INSPECTIONS",
        title: "Minimal Physical Inspections",
        description: "Significantly reduced inspection rate for shipments",
        quantifiableImpact: {
          metric: "Inspection Rate",
          reduction: 60,
          annualSavings: { amount: 5000, currency: "KWD" },
        },
        applicableCountries: ["KW"],
      },
      {
        id: "kw-gl-b2",
        category: "TIME_SAVINGS",
        title: "Priority Customs Processing",
        description: "Expedited clearance with priority queue access",
        quantifiableImpact: {
          metric: "Clearance Time",
          reduction: 50,
          annualSavings: { amount: 10000, currency: "KWD" },
        },
        applicableCountries: ["KW"],
      },
      {
        id: "kw-gl-b3",
        category: "SIMPLIFIED_PROCEDURES",
        title: "Simplified Documentation",
        description: "Reduced documentation requirements",
        applicableCountries: ["KW"],
      },
    ],

    unlockedCapabilities: [
      {
        id: "kw-gl-u1",
        name: "Priority Processing Queue",
        description: "Jump the queue at Kuwait customs",
        category: "PRIORITY",
        impact: "CRITICAL",
        beforeProgram: "Standard queue (55+ hours average at Kuwait customs)",
        afterProgram: "Priority queue (8-12 hours average)",
        timeSavings: 45,
        costSavings: { amount: 500, currency: "KWD" },
      },
      {
        id: "kw-gl-u2",
        name: "Extended Operating Hours",
        description: "Access to extended processing windows",
        category: "ACCESS",
        impact: "HIGH",
        beforeProgram: "Limited to 8am-1pm (5 hours)",
        afterProgram: "Extended hours access until 3pm",
        timeSavings: 10,
      },
    ],

    mutualRecognitionAgreements: [
      {
        countryCode: "SA",
        countryName: "Saudi Arabia",
        program: "Saudi AEO",
        status: "ACTIVE",
        benefits: ["Mutual recognition within GCC"],
        effectiveDate: "2021-06-01",
      },
    ],

    requirements: [],

    renewalPeriod: 1,
    renewalProcess: "Automatic renewal based on compliance performance",

    successMetrics: {
      approvalRate: 85,
      averageProcessingTime: 30,
      memberCount: 320,
      satisfactionScore: 4.0,
    },
  },

  // GCC-Wide Program
  {
    id: "gcc-trusted-trader",
    type: "TRUSTED_TRADER",
    name: "GCC Trusted Trader",
    fullName: "GCC Customs Union Trusted Trader Program",
    country: "GCC",
    region: "GCC",
    authority: "GCC Customs Union",
    authorityFullName: "Secretariat General of the Gulf Cooperation Council",
    tier: "ELITE",
    description:
      "The GCC Trusted Trader program provides comprehensive benefits across all 6 GCC member states with a single certification.",

    eligibilityCriteria: [
      {
        id: "gcc-tt-1",
        category: "COMPLIANCE",
        requirement: "AEO status in at least one GCC country",
        description: "Must hold valid AEO or equivalent certification",
        isMandatory: true,
        verificationMethod: "Certificate verification",
        estimatedEffort: "HIGH",
      },
      {
        id: "gcc-tt-2",
        category: "FINANCIAL",
        requirement: "Annual GCC trade volume of $50 million+",
        description: "Significant trade presence across GCC",
        isMandatory: true,
        verificationMethod: "Customs records from all GCC countries",
        estimatedEffort: "MEDIUM",
      },
    ],

    applicationProcess: [
      {
        order: 1,
        name: "Pre-Application",
        description: "Submit pre-application through home country customs",
        duration: { min: 2, max: 4, unit: "WEEKS" },
        dependencies: [],
        documents: ["Pre-application form", "Existing AEO certificate"],
        authority: "Home country customs",
        tips: ["Ensure your home country AEO is in good standing"],
      },
      {
        order: 2,
        name: "GCC-Wide Verification",
        description: "Verification process across all GCC countries",
        duration: { min: 4, max: 8, unit: "WEEKS" },
        dependencies: ["Pre-Application"],
        documents: ["Trade records from all GCC countries"],
        authority: "GCC Customs Union",
        tips: ["Proactively gather records from all GCC operations"],
      },
      {
        order: 3,
        name: "Certification",
        description: "GCC Trusted Trader certificate issuance",
        duration: { min: 2, max: 4, unit: "WEEKS" },
        dependencies: ["GCC-Wide Verification"],
        documents: ["GCC Trusted Trader Certificate"],
        authority: "GCC Customs Union",
        tips: ["Certificate is valid in all 6 GCC member states"],
      },
    ],

    estimatedProcessingTime: { min: 60, max: 120, average: 90 },

    applicationFee: { amount: 5000, currency: "USD" },
    annualFee: { amount: 2000, currency: "USD" },
    auditCosts: { amount: 10000, currency: "USD" },
    totalFirstYearCost: { amount: 17000, currency: "USD" },

    benefits: [
      {
        id: "gcc-tt-b1",
        category: "RECOGNITION",
        title: "GCC-Wide Recognition",
        description: "Single certification valid across all 6 GCC countries",
        applicableCountries: ["SA", "AE", "KW", "BH", "OM", "QA"],
      },
      {
        id: "gcc-tt-b2",
        category: "REDUCED_INSPECTIONS",
        title: "Minimal Inspections GCC-Wide",
        description: "Reduced inspection rates at all GCC borders",
        quantifiableImpact: {
          metric: "Inspection Rate",
          reduction: 85,
          annualSavings: { amount: 100000, currency: "USD" },
        },
        applicableCountries: ["SA", "AE", "KW", "BH", "OM", "QA"],
      },
      {
        id: "gcc-tt-b3",
        category: "TIME_SAVINGS",
        title: "Fast-Track at All GCC Borders",
        description: "Priority processing at every GCC border crossing",
        quantifiableImpact: {
          metric: "Border Crossing Time",
          reduction: 75,
          annualSavings: { amount: 150000, currency: "USD" },
        },
        applicableCountries: ["SA", "AE", "KW", "BH", "OM", "QA"],
      },
    ],

    unlockedCapabilities: [
      {
        id: "gcc-tt-u1",
        name: "GCC Fast Lane",
        description: "Dedicated fast lane at all GCC border crossings",
        category: "CLEARANCE",
        impact: "CRITICAL",
        beforeProgram: "Standard processing at each border",
        afterProgram: "Fast lane access across all GCC",
        timeSavings: 50,
        costSavings: { amount: 2000, currency: "USD" },
      },
    ],

    mutualRecognitionAgreements: [],

    requirements: [
      {
        id: "gcc-tt-r1",
        category: "CERTIFICATION",
        name: "Existing AEO Status",
        description: "Must have AEO status in at least one GCC country",
        mandatory: true,
        estimatedCost: { amount: 0, currency: "USD" },
        estimatedTime: 0,
      },
    ],

    renewalPeriod: 3,
    renewalProcess:
      "Renewal coordinated through home country customs authority",

    successMetrics: {
      approvalRate: 65,
      averageProcessingTime: 90,
      memberCount: 120,
      satisfactionScore: 4.5,
    },
  },
];

// ============================================================================
// TRADE PROGRAM ADVISOR SERVICE
// ============================================================================

class TradeProgramAdvisorService {
  /**
   * Get all available trade programs for a country or region
   */
  async getAvailablePrograms(
    country: string,
    region?: string,
  ): Promise<TradeProgram[]> {
    return TRADE_PROGRAMS.filter(
      (p) =>
        p.country === country || p.country === region || p.region === region,
    );
  }

  /**
   * Get a specific program by ID
   */
  async getProgramById(programId: string): Promise<TradeProgram | null> {
    return TRADE_PROGRAMS.find((p) => p.id === programId) || null;
  }

  /**
   * Analyze and recommend programs based on trade lane and bottlenecks
   */
  async recommendPrograms(
    originCountry: string,
    destinationCountry: string,
    bottlenecks: {
      touchpoint: string;
      avgDelayHours: number;
      category: string;
    }[],
    annualShipmentVolume: number,
    annualTradeValue: number,
  ): Promise<TradeProgramRecommendation[]> {
    const recommendations: TradeProgramRecommendation[] = [];

    // Get relevant programs
    const relevantPrograms = TRADE_PROGRAMS.filter(
      (p) =>
        p.country === originCountry ||
        p.country === destinationCountry ||
        p.region === "GCC",
    );

    for (const program of relevantPrograms) {
      // Calculate relevance score based on bottlenecks
      let relevanceScore = 0;
      const unlocksPotential: string[] = [];

      // Check if program addresses any bottlenecks
      for (const bottleneck of bottlenecks) {
        if (bottleneck.category === "Customs") {
          // Customs programs are highly relevant for customs bottlenecks
          if (
            program.country === destinationCountry ||
            program.region === "GCC"
          ) {
            relevanceScore += 30;

            // Calculate potential time savings
            const capability = program.unlockedCapabilities.find(
              (u) => u.category === "CLEARANCE" || u.category === "PRIORITY",
            );
            if (capability && capability.timeSavings) {
              const potentialSavings = Math.min(
                capability.timeSavings,
                bottleneck.avgDelayHours * 0.7,
              );
              unlocksPotential.push(
                `Reduce ${bottleneck.touchpoint} by ~${potentialSavings.toFixed(1)} hours`,
              );
            }
          }
        }
      }

      // Bonus for volume eligibility
      if (annualShipmentVolume >= 50) {
        relevanceScore += 10;
      }

      // Bonus for value eligibility
      if (annualTradeValue >= 10000000) {
        // 10M
        relevanceScore += 15;
      }

      // Bonus for mutual recognition
      if (
        program.mutualRecognitionAgreements.some(
          (mra) =>
            mra.countryCode === originCountry ||
            mra.countryCode === destinationCountry,
        )
      ) {
        relevanceScore += 20;
        unlocksPotential.push(
          "Mutual recognition benefits with partner countries",
        );
      }

      // Only recommend if score is meaningful
      if (relevanceScore >= 20) {
        // Calculate implementation details
        const totalBenefits = program.benefits.reduce((sum, b) => {
          return sum + (b.quantifiableImpact?.annualSavings?.amount || 0);
        }, 0);

        recommendations.push({
          program,
          relevanceScore: Math.min(100, relevanceScore),
          matchReason: this.generateMatchReason(
            program,
            bottlenecks,
            destinationCountry,
          ),
          expectedBenefit:
            totalBenefits > 0
              ? `Potential annual savings of ${totalBenefits.toLocaleString()} ${program.benefits[0]?.quantifiableImpact?.annualSavings?.currency || "USD"}`
              : "Priority processing and reduced inspections",
          implementation: {
            effort: program.eligibilityCriteria.length > 3 ? "HIGH" : "MEDIUM",
            timeline: Math.ceil(program.estimatedProcessingTime.average / 30),
            cost: program.totalFirstYearCost,
          },
          unlocksPotential,
        });
      }
    }

    // Sort by relevance score
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate a detailed comparison of multiple programs
   */
  async comparePrograms(programIds: string[]): Promise<ProgramComparison> {
    const programs = programIds
      .map((id) => TRADE_PROGRAMS.find((p) => p.id === id))
      .filter((p): p is TradeProgram => p !== null);

    const comparisonMatrix: ProgramComparison["comparisonMatrix"] = [
      {
        criterion: "Application Time",
        category: "TIMELINE",
        values: programs.map((p) => ({
          programId: p.id,
          value: `${p.estimatedProcessingTime.average} days`,
          score: 100 - p.estimatedProcessingTime.average / 2,
        })),
      },
      {
        criterion: "First Year Cost",
        category: "COST",
        values: programs.map((p) => ({
          programId: p.id,
          value: `${p.totalFirstYearCost.amount.toLocaleString()} ${p.totalFirstYearCost.currency}`,
          score: 100 - p.totalFirstYearCost.amount / 500,
        })),
      },
      {
        criterion: "Inspection Reduction",
        category: "BENEFIT",
        values: programs.map((p) => {
          const inspectionBenefit = p.benefits.find(
            (b) => b.category === "REDUCED_INSPECTIONS",
          );
          return {
            programId: p.id,
            value: inspectionBenefit?.quantifiableImpact?.reduction
              ? `${inspectionBenefit.quantifiableImpact.reduction}%`
              : "N/A",
            score: inspectionBenefit?.quantifiableImpact?.reduction || 0,
          };
        }),
      },
      {
        criterion: "Time Savings",
        category: "BENEFIT",
        values: programs.map((p) => {
          const timeBenefit = p.benefits.find(
            (b) => b.category === "TIME_SAVINGS",
          );
          return {
            programId: p.id,
            value: timeBenefit?.quantifiableImpact?.reduction
              ? `${timeBenefit.quantifiableImpact.reduction}%`
              : "N/A",
            score: timeBenefit?.quantifiableImpact?.reduction || 0,
          };
        }),
      },
      {
        criterion: "Countries Covered",
        category: "COVERAGE",
        values: programs.map((p) => {
          const countries = new Set([
            p.country,
            ...p.mutualRecognitionAgreements.map((m) => m.countryCode),
          ]);
          return {
            programId: p.id,
            value: countries.size.toString(),
            score: countries.size * 10,
          };
        }),
      },
      {
        criterion: "Approval Rate",
        category: "RISK",
        values: programs.map((p) => ({
          programId: p.id,
          value: `${p.successMetrics.approvalRate}%`,
          score: p.successMetrics.approvalRate,
        })),
      },
    ];

    // Calculate overall scores
    const overallScores = programs.map((p) => {
      const programScores = comparisonMatrix.map(
        (row) => row.values.find((v) => v.programId === p.id)?.score || 0,
      );
      const avgScore =
        programScores.reduce((a, b) => a + b, 0) / programScores.length;
      return { programId: p.id, score: avgScore, rank: 0 };
    });

    // Assign ranks
    overallScores.sort((a, b) => b.score - a.score);
    overallScores.forEach((s, i) => (s.rank = i + 1));

    // Generate recommendation
    const bestOverall = overallScores[0]?.programId || "";
    const bestForSpeed =
      [...overallScores].sort((a, b) => {
        const aTime =
          programs.find((p) => p.id === a.programId)?.estimatedProcessingTime
            .average || 999;
        const bTime =
          programs.find((p) => p.id === b.programId)?.estimatedProcessingTime
            .average || 999;
        return aTime - bTime;
      })[0]?.programId || "";

    const bestForCost =
      [...overallScores].sort((a, b) => {
        const aCost =
          programs.find((p) => p.id === a.programId)?.totalFirstYearCost
            .amount || 999999;
        const bCost =
          programs.find((p) => p.id === b.programId)?.totalFirstYearCost
            .amount || 999999;
        return aCost - bCost;
      })[0]?.programId || "";

    return {
      programs,
      comparisonMatrix,
      overallScores,
      recommendation: {
        bestOverall,
        bestForSpeed,
        bestForCost,
        bestForCoverage: programs.reduce((best, p) => {
          const currentCoverage = 1 + p.mutualRecognitionAgreements.length;
          const bestCoverage =
            1 +
            (programs.find((x) => x.id === best)?.mutualRecognitionAgreements
              .length || 0);
          return currentCoverage > bestCoverage ? p.id : best;
        }, programs[0]?.id || ""),
        reasoning: this.generateComparisonReasoning(programs, overallScores),
      },
    };
  }

  /**
   * Calculate detailed ROI for a program
   */
  async calculateROI(
    programId: string,
    annualShipments: number,
    averageShipmentValue: number,
    currentAvgClearanceHours: number,
    currentInspectionRate: number,
  ): Promise<ROIAnalysis | null> {
    const program = await this.getProgramById(programId);
    if (!program) return null;

    // Calculate time savings value
    const timeBenefit = program.benefits.find(
      (b) => b.category === "TIME_SAVINGS",
    );
    const timeReduction = timeBenefit?.quantifiableImpact?.reduction || 50;
    const hoursSavedPerShipment =
      currentAvgClearanceHours * (timeReduction / 100);
    const hourlyOpsCost = 50; // USD per hour
    const annualTimeSavingsValue =
      hoursSavedPerShipment * hourlyOpsCost * annualShipments;

    // Calculate inspection reduction value
    const inspectionBenefit = program.benefits.find(
      (b) => b.category === "REDUCED_INSPECTIONS",
    );
    const inspectionReduction =
      inspectionBenefit?.quantifiableImpact?.reduction || 60;
    const inspectionCost = 500; // USD per inspection
    const currentInspections = annualShipments * (currentInspectionRate / 100);
    const reducedInspections =
      currentInspections * (1 - inspectionReduction / 100);
    const inspectionSavings =
      (currentInspections - reducedInspections) * inspectionCost;

    // Calculate penalty avoidance (estimated)
    const penaltyAvoidance = averageShipmentValue * annualShipments * 0.001; // 0.1% of trade value

    // Calculate opportunity costs (faster clearance = faster revenue)
    const opportunityCosts =
      hoursSavedPerShipment * averageShipmentValue * 0.0001 * annualShipments;

    // Total annual benefits
    const totalAnnualBenefits =
      annualTimeSavingsValue +
      inspectionSavings +
      penaltyAvoidance +
      opportunityCosts;

    // Costs (convert to USD if needed)
    const conversionRate =
      program.totalFirstYearCost.currency === "SAR"
        ? 0.27
        : program.totalFirstYearCost.currency === "KWD"
          ? 3.25
          : 1;
    const initialInvestment =
      program.totalFirstYearCost.amount * conversionRate;
    const annualCosts = program.annualFee.amount * conversionRate;

    // Net benefit
    const netAnnualBenefit = totalAnnualBenefits - annualCosts;

    // Payback period
    const paybackPeriod = Math.ceil(
      initialInvestment / (netAnnualBenefit / 12),
    );

    // 5-year ROI
    const fiveYearBenefits = totalAnnualBenefits * 5;
    const fiveYearCosts = initialInvestment + annualCosts * 5;
    const fiveYearROI =
      ((fiveYearBenefits - fiveYearCosts) / fiveYearCosts) * 100;

    return {
      programId,
      initialInvestment: { amount: initialInvestment, currency: "USD" },
      annualCosts: { amount: annualCosts, currency: "USD" },
      annualBenefits: {
        timeSavings: {
          hours: hoursSavedPerShipment * annualShipments,
          monetaryValue: { amount: annualTimeSavingsValue, currency: "USD" },
        },
        costReductions: { amount: 0, currency: "USD" },
        inspectionReductions: {
          percentage: inspectionReduction,
          monetaryValue: { amount: inspectionSavings, currency: "USD" },
        },
        penaltyAvoidance: { amount: penaltyAvoidance, currency: "USD" },
        opportunityCosts: { amount: opportunityCosts, currency: "USD" },
      },
      netAnnualBenefit: { amount: netAnnualBenefit, currency: "USD" },
      paybackPeriod,
      fiveYearROI: Math.round(fiveYearROI),
      breakEvenPoint: this.calculateBreakEvenDate(paybackPeriod),
    };
  }

  /**
   * Get programs that address a specific bottleneck
   */
  async getProgramsForBottleneck(
    bottleneckType: string,
    country: string,
  ): Promise<TradeProgram[]> {
    return TRADE_PROGRAMS.filter((p) => {
      if (p.country !== country && p.region !== "GCC") return false;

      // Check if program has capabilities that address the bottleneck
      return p.unlockedCapabilities.some((u) => {
        if (bottleneckType === "customs_delay") {
          return u.category === "CLEARANCE" || u.category === "PRIORITY";
        }
        if (bottleneckType === "inspection") {
          return u.category === "INSPECTION";
        }
        return false;
      });
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateMatchReason(
    program: TradeProgram,
    bottlenecks: {
      touchpoint: string;
      avgDelayHours: number;
      category: string;
    }[],
    destinationCountry: string,
  ): string {
    const reasons: string[] = [];

    if (program.country === destinationCountry) {
      reasons.push(`Direct ${program.name} membership in destination country`);
    }

    const customsBottleneck = bottlenecks.find((b) => b.category === "Customs");
    if (customsBottleneck && customsBottleneck.avgDelayHours > 20) {
      reasons.push(
        `Addresses critical ${customsBottleneck.avgDelayHours.toFixed(0)}-hour customs delay`,
      );
    }

    if (program.mutualRecognitionAgreements.length > 0) {
      reasons.push(
        `Mutual recognition with ${program.mutualRecognitionAgreements.length} countries`,
      );
    }

    return (
      reasons.join(". ") ||
      `Provides trade facilitation benefits for ${program.country}`
    );
  }

  private generateComparisonReasoning(
    programs: TradeProgram[],
    scores: { programId: string; score: number; rank: number }[],
  ): string {
    const best = programs.find((p) => p.id === scores[0]?.programId);
    if (!best) return "Unable to generate recommendation";

    const reasons: string[] = [];

    if (best.successMetrics.approvalRate > 75) {
      reasons.push(
        `${best.name} has a high approval rate of ${best.successMetrics.approvalRate}%`,
      );
    }

    const timeBenefit = best.benefits.find(
      (b) => b.category === "TIME_SAVINGS",
    );
    if (timeBenefit?.quantifiableImpact?.reduction) {
      reasons.push(
        `offers ${timeBenefit.quantifiableImpact.reduction}% reduction in clearance time`,
      );
    }

    if (best.mutualRecognitionAgreements.length > 0) {
      reasons.push(
        `includes mutual recognition with ${best.mutualRecognitionAgreements.length} countries`,
      );
    }

    return `Recommended: ${best.name}. ${reasons.join(", ")}.`;
  }

  private calculateBreakEvenDate(paybackMonths: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + paybackMonths);
    return date.toISOString().split("T")[0];
  }
}

export const tradeProgramAdvisorService = new TradeProgramAdvisorService();
