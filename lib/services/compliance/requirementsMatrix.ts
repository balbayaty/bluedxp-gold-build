/**
 * 📋 COMPREHENSIVE REQUIREMENTS MATRIX
 * Universal requirements mapping and cross-reference system
 *
 * Features:
 * - Requirements mapping across all standards
 * - Cross-reference between standards
 * - Requirements dependency tracking
 * - Evidence mapping
 * - Compliance gap analysis
 *
 * Source: Adapted from chemcheck-analysis/lib/compliance/ComprehensiveRequirementsMatrix.ts
 * Architecture: Deep layer integration with Event Bus and compliance services
 */

import { eventBus } from "@/lib/services/event-bus";
import { globalStandardsEngine } from "./globalStandardsEngine";
import { saudiComplianceEngine } from "./saudiEngine";
import type { RegulatoryAuthority, ComplianceStatus } from "@/types/compliance";

// ============================================================================
// REQUIREMENTS MATRIX TYPES
// ============================================================================

export interface Requirement {
  id: string;
  code: string;
  title: string;
  description: string;
  authority: RegulatoryAuthority | "ISO" | "FDA" | "EU";
  standard: string;
  category: string;
  mandatory: boolean;
  evidenceRequired: string[];
  applicableTo: string[];
  dependencies: string[]; // Other requirement IDs this depends on
  relatedRequirements: string[]; // Related requirement IDs
  crossReferences: CrossReference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrossReference {
  requirementId: string;
  relationship:
    | "equivalent"
    | "similar"
    | "superset"
    | "subset"
    | "conflicting"
    | "complementary";
  confidence: number; // 0-100
  notes?: string;
}

export interface RequirementsMatrix {
  id: string;
  tenantId: string;
  requirements: Map<string, Requirement>;
  mappings: Map<string, string[]>; // requirementId -> related requirement IDs
  gaps: GapAnalysis[];
  coverage: CoverageAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface GapAnalysis {
  requirementId: string;
  gapType: "missing" | "partial" | "outdated" | "conflicting";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendedActions: string[];
  estimatedEffort: number; // hours
}

export interface CoverageAnalysis {
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercentage: number;
  byAuthority: Record<string, number>;
  byCategory: Record<string, number>;
  byStandard: Record<string, number>;
}

export interface RequirementMapping {
  sourceRequirement: string;
  targetRequirement: string;
  relationship: CrossReference["relationship"];
  confidence: number;
  evidence: string[];
}

// ============================================================================
// COMPREHENSIVE REQUIREMENTS MATRIX
// ============================================================================

export class ComprehensiveRequirementsMatrix {
  private static instance: ComprehensiveRequirementsMatrix;
  private requirements: Map<string, Requirement> = new Map();
  private matrices: Map<string, RequirementsMatrix> = new Map();
  private mappings: Map<string, RequirementMapping[]> = new Map();

  private constructor() {
    this.initializeMatrix();
  }

  public static getInstance(): ComprehensiveRequirementsMatrix {
    if (!ComprehensiveRequirementsMatrix.instance) {
      ComprehensiveRequirementsMatrix.instance =
        new ComprehensiveRequirementsMatrix();
    }
    return ComprehensiveRequirementsMatrix.instance;
  }

  private async initializeMatrix(): Promise<void> {
    console.log("📋 Initializing Comprehensive Requirements Matrix...");

    // Load requirements from all sources
    await this.loadRequirementsFromStandards();

    // Build cross-references
    await this.buildCrossReferences();

    await eventBus.publish({
      type: "compliance.matrix.initialized",
      data: {
        timestamp: new Date(),
        service: "ComprehensiveRequirementsMatrix",
        requirementsCount: this.requirements.size,
      },
    });
  }

  /**
   * Load requirements from all standards
   */
  private async loadRequirementsFromStandards(): Promise<void> {
    // Load ISO requirements
    const isoStandards = globalStandardsEngine.getAllISOStandards();
    for (const standard of isoStandards) {
      for (const req of standard.requirements) {
        const requirement: Requirement = {
          id: req.id,
          code: `${standard.code}-${req.clause}`,
          title: req.title,
          description: req.description,
          authority: "ISO",
          standard: standard.code,
          category: standard.category,
          mandatory: req.mandatory,
          evidenceRequired: req.evidenceRequired,
          applicableTo: req.applicableTo,
          dependencies: [],
          relatedRequirements: [],
          crossReferences: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.requirements.set(requirement.id, requirement);
      }
    }

    // Load FDA requirements
    const fdaStandards = globalStandardsEngine.getAllFDAStandards();
    for (const standard of fdaStandards) {
      for (const req of standard.requirements) {
        const requirement: Requirement = {
          id: req.id,
          code: `${standard.code}-${req.section}`,
          title: req.title,
          description: req.description,
          authority: "FDA",
          standard: standard.code,
          category: standard.category,
          mandatory: req.mandatory,
          evidenceRequired: req.evidenceRequired,
          applicableTo: req.applicableTo,
          dependencies: [],
          relatedRequirements: [],
          crossReferences: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.requirements.set(requirement.id, requirement);
      }
    }

    // Load EU requirements
    const euRegulations = globalStandardsEngine.getAllEURegulations();
    for (const regulation of euRegulations) {
      for (const req of regulation.requirements) {
        const requirement: Requirement = {
          id: req.id,
          code: `${regulation.code}-${req.article}`,
          title: req.title,
          description: req.description,
          authority: "EU",
          standard: regulation.code,
          category: regulation.category,
          mandatory: req.mandatory,
          evidenceRequired: req.evidenceRequired,
          applicableTo: req.applicableTo,
          dependencies: [],
          relatedRequirements: [],
          crossReferences: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.requirements.set(requirement.id, requirement);
      }
    }
  }

  /**
   * Build cross-references between requirements
   */
  private async buildCrossReferences(): Promise<void> {
    const allRequirements = Array.from(this.requirements.values());

    for (const req of allRequirements) {
      const crossRefs: CrossReference[] = [];

      // Find similar requirements
      for (const otherReq of allRequirements) {
        if (req.id === otherReq.id) continue;

        // Check for similarity based on title and description
        const similarity = this.calculateSimilarity(req, otherReq);
        if (similarity > 0.6) {
          crossRefs.push({
            requirementId: otherReq.id,
            relationship:
              similarity > 0.9
                ? "equivalent"
                : similarity > 0.8
                  ? "similar"
                  : "complementary",
            confidence: Math.round(similarity * 100),
            notes: `Similar to ${otherReq.code}`,
          });
        }
      }

      req.crossReferences = crossRefs;
      req.relatedRequirements = crossRefs.map((ref) => ref.requirementId);
      this.requirements.set(req.id, req);
    }
  }

  /**
   * Calculate similarity between requirements
   */
  private calculateSimilarity(req1: Requirement, req2: Requirement): number {
    let score = 0;

    // Title similarity
    const title1 = req1.title.toLowerCase();
    const title2 = req2.title.toLowerCase();
    if (title1 === title2) score += 0.5;
    else if (title1.includes(title2) || title2.includes(title1)) score += 0.3;
    else {
      const words1 = title1.split(" ");
      const words2 = title2.split(" ");
      const commonWords = words1.filter((w) => words2.includes(w));
      score +=
        (commonWords.length / Math.max(words1.length, words2.length)) * 0.3;
    }

    // Description similarity
    const desc1 = req1.description.toLowerCase();
    const desc2 = req2.description.toLowerCase();
    const descWords1 = desc1.split(" ");
    const descWords2 = desc2.split(" ");
    const commonDescWords = descWords1.filter((w) => descWords2.includes(w));
    score +=
      (commonDescWords.length /
        Math.max(descWords1.length, descWords2.length)) *
      0.3;

    // Category match
    if (req1.category === req2.category) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Create requirements matrix for tenant
   */
  async createMatrix(tenantId: string): Promise<RequirementsMatrix> {
    const matrix: RequirementsMatrix = {
      id: `matrix-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId,
      requirements: new Map(this.requirements),
      mappings: new Map(),
      gaps: [],
      coverage: this.calculateCoverage(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Build mappings
    for (const req of this.requirements.values()) {
      matrix.mappings.set(req.id, req.relatedRequirements);
    }

    // Perform gap analysis
    matrix.gaps = await this.performGapAnalysis(tenantId);

    this.matrices.set(matrix.id, matrix);

    await eventBus.publish({
      type: "compliance.matrix.created",
      data: {
        matrixId: matrix.id,
        tenantId,
        requirementsCount: matrix.requirements.size,
        gapsCount: matrix.gaps.length,
        timestamp: new Date(),
      },
    });

    return matrix;
  }

  /**
   * Perform gap analysis
   */
  private async performGapAnalysis(tenantId: string): Promise<GapAnalysis[]> {
    const gaps: GapAnalysis[] = [];

    // Check for missing critical requirements
    for (const req of this.requirements.values()) {
      if (req.mandatory) {
        // Simulate checking if requirement is met
        const isMet = Math.random() > 0.3; // 70% chance of being met

        if (!isMet) {
          gaps.push({
            requirementId: req.id,
            gapType: "missing",
            severity: "critical",
            description: `Missing mandatory requirement: ${req.title}`,
            recommendedActions: [
              `Implement ${req.title}`,
              `Document evidence: ${req.evidenceRequired.join(", ")}`,
              `Assign responsibility to: ${req.applicableTo.join(", ")}`,
            ],
            estimatedEffort: 8, // hours
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Calculate coverage
   */
  private calculateCoverage(): CoverageAnalysis {
    const allRequirements = Array.from(this.requirements.values());
    const total = allRequirements.length;
    const covered = allRequirements.filter((req) => {
      // Simulate coverage check
      return Math.random() > 0.2; // 80% coverage
    }).length;

    const byAuthority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byStandard: Record<string, number> = {};

    for (const req of allRequirements) {
      byAuthority[req.authority] = (byAuthority[req.authority] || 0) + 1;
      byCategory[req.category] = (byCategory[req.category] || 0) + 1;
      byStandard[req.standard] = (byStandard[req.standard] || 0) + 1;
    }

    return {
      totalRequirements: total,
      coveredRequirements: covered,
      coveragePercentage: Math.round((covered / total) * 100),
      byAuthority,
      byCategory,
      byStandard,
    };
  }

  /**
   * Map requirements between standards
   */
  async mapRequirements(
    sourceStandard: string,
    targetStandard: string,
  ): Promise<RequirementMapping[]> {
    const sourceReqs = Array.from(this.requirements.values()).filter(
      (req) => req.standard === sourceStandard,
    );
    const targetReqs = Array.from(this.requirements.values()).filter(
      (req) => req.standard === targetStandard,
    );

    const mappings: RequirementMapping[] = [];

    for (const sourceReq of sourceReqs) {
      // Find best match in target standard
      let bestMatch: Requirement | null = null;
      let bestScore = 0;

      for (const targetReq of targetReqs) {
        const score = this.calculateSimilarity(sourceReq, targetReq);
        if (score > bestScore && score > 0.6) {
          bestScore = score;
          bestMatch = targetReq;
        }
      }

      if (bestMatch) {
        mappings.push({
          sourceRequirement: sourceReq.id,
          targetRequirement: bestMatch.id,
          relationship:
            bestScore > 0.9
              ? "equivalent"
              : bestScore > 0.8
                ? "similar"
                : "complementary",
          confidence: Math.round(bestScore * 100),
          evidence: [
            ...sourceReq.evidenceRequired,
            ...bestMatch.evidenceRequired,
          ],
        });
      }
    }

    this.mappings.set(`${sourceStandard}-${targetStandard}`, mappings);

    return mappings;
  }

  /**
   * Get requirement by ID
   */
  getRequirement(id: string): Requirement | null {
    return this.requirements.get(id) || null;
  }

  /**
   * Get all requirements
   */
  getAllRequirements(): Requirement[] {
    return Array.from(this.requirements.values());
  }

  /**
   * Get requirements by standard
   */
  getRequirementsByStandard(standard: string): Requirement[] {
    return Array.from(this.requirements.values()).filter(
      (req) => req.standard === standard,
    );
  }

  /**
   * Get requirements by authority
   */
  getRequirementsByAuthority(
    authority: RegulatoryAuthority | "ISO" | "FDA" | "EU",
  ): Requirement[] {
    return Array.from(this.requirements.values()).filter(
      (req) => req.authority === authority,
    );
  }

  /**
   * Get matrix for tenant
   */
  async getMatrix(tenantId: string): Promise<RequirementsMatrix | null> {
    const matrices = Array.from(this.matrices.values()).filter(
      (m) => m.tenantId === tenantId,
    );
    return (
      matrices.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      )[0] || null
    );
  }

  /**
   * Get requirement mappings
   */
  getMappings(
    sourceStandard: string,
    targetStandard: string,
  ): RequirementMapping[] {
    return this.mappings.get(`${sourceStandard}-${targetStandard}`) || [];
  }
}

// Singleton instance
export const comprehensiveRequirementsMatrix =
  ComprehensiveRequirementsMatrix.getInstance();
