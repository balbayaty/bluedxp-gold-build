/**
 * MSDS Production Readiness Check
 * Ensures all components are working correctly for end-user production use
 */

import { msdsExtractionValidator } from "./extraction/msdsExtractionValidator";
import type { ExtractedMSDSData } from "@/types/chemical";

export interface ProductionCheckResult {
  ready: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  score: number;
}

export class MSDSProductionChecker {
  /**
   * Run comprehensive production readiness checks
   */
  async checkProductionReadiness(
    extractedData: ExtractedMSDSData,
  ): Promise<ProductionCheckResult> {
    const checks: ProductionCheckResult["checks"] = [];
    let passedChecks = 0;
    const totalChecks = 8;

    // Check 1: Required fields
    const hasProductName = !!(
      extractedData.productName && extractedData.productName !== "Unknown"
    );
    checks.push({
      name: "Product Name",
      passed: hasProductName,
      message: hasProductName
        ? "Product name extracted successfully"
        : "Product name is missing or could not be extracted",
    });
    if (hasProductName) passedChecks++;

    // Check 2: CAS Number
    const hasCAS = !!(
      extractedData.casNumber && extractedData.casNumber.trim().length > 0
    );
    checks.push({
      name: "CAS Number",
      passed: hasCAS,
      message: hasCAS
        ? "CAS number extracted successfully"
        : "CAS number is missing - may affect chemical identification",
    });
    if (hasCAS) passedChecks++;

    // Check 3: NFPA Ratings
    const hasNFPA = !!(
      extractedData.healthRating &&
      extractedData.flammabilityRating &&
      extractedData.reactivityRating
    );
    checks.push({
      name: "NFPA Diamond",
      passed: hasNFPA,
      message: hasNFPA
        ? "NFPA diamond ratings extracted successfully"
        : "NFPA diamond ratings are missing",
    });
    if (hasNFPA) passedChecks++;

    // Check 4: Hazard Statements
    const hasHazards = !!(
      extractedData.hazardStatements &&
      extractedData.hazardStatements.length > 0
    );
    checks.push({
      name: "Hazard Statements",
      passed: hasHazards,
      message: hasHazards
        ? `${extractedData.hazardStatements.length} hazard statements found`
        : "No hazard statements found - GHS compliance incomplete",
    });
    if (hasHazards) passedChecks++;

    // Check 5: Storage Conditions
    const hasStorage = !!(
      extractedData.storageConditions &&
      extractedData.storageConditions.length > 0
    );
    checks.push({
      name: "Storage Conditions",
      passed: hasStorage,
      message: hasStorage
        ? "Storage conditions specified"
        : "Storage conditions not specified",
    });
    if (hasStorage) passedChecks++;

    // Check 6: First Aid
    const hasFirstAid = !!(
      extractedData.firstAid && extractedData.firstAid.trim().length > 0
    );
    checks.push({
      name: "First Aid Measures",
      passed: hasFirstAid,
      message: hasFirstAid
        ? "First aid measures specified"
        : "First aid measures not specified",
    });
    if (hasFirstAid) passedChecks++;

    // Check 7: Confidence Score
    const aiConfidence = extractedData.aiConfidence || 0;
    const hasGoodConfidence = aiConfidence >= 50;
    checks.push({
      name: "AI Confidence",
      passed: hasGoodConfidence,
      message: hasGoodConfidence
        ? `AI confidence: ${aiConfidence}%`
        : `Low AI confidence: ${aiConfidence}% - manual review recommended`,
    });
    if (hasGoodConfidence) passedChecks++;

    // Check 8: Validation Score
    const validation = msdsExtractionValidator.validate(extractedData);
    const hasGoodValidation =
      validation.score >= 70 && validation.errors.length === 0;
    checks.push({
      name: "Data Validation",
      passed: hasGoodValidation,
      message: hasGoodValidation
        ? `Validation score: ${validation.score}/100`
        : `Validation score: ${validation.score}/100 - ${validation.errors.length} errors found`,
    });
    if (hasGoodValidation) passedChecks++;

    const score = Math.round((passedChecks / totalChecks) * 100);
    const ready = passedChecks >= 6 && validation.errors.length === 0;

    return {
      ready,
      checks,
      score,
    };
  }
}

export const msdsProductionChecker = new MSDSProductionChecker();
