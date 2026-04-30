/**
 * MSDS Extraction Validator
 * Production-ready validation for extracted MSDS data
 */

import type { ExtractedMSDSData } from "@/types/chemical";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

export class MSDSExtractionValidator {
  /**
   * Validate extracted MSDS data for production use
   */
  validate(extractedData: ExtractedMSDSData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Required fields validation
    if (
      !extractedData.productName ||
      extractedData.productName.trim().length === 0
    ) {
      errors.push("Product name is required");
      score -= 20;
    } else if (
      extractedData.productName === "Unknown" ||
      extractedData.productName === "Unknown Chemical"
    ) {
      warnings.push(
        "Product name could not be extracted - manual review required",
      );
      score -= 10;
    }

    if (
      !extractedData.manufacturer ||
      extractedData.manufacturer.trim().length === 0
    ) {
      warnings.push("Manufacturer information is missing");
      score -= 5;
    } else if (extractedData.manufacturer === "Unknown") {
      warnings.push("Manufacturer could not be extracted");
      score -= 5;
    }

    // CAS number validation
    if (extractedData.casNumber) {
      const casPattern = /^\d{2,7}-\d{2}-\d$/;
      if (!casPattern.test(extractedData.casNumber)) {
        warnings.push(
          `CAS number format may be invalid: ${extractedData.casNumber}`,
        );
        score -= 5;
      }
    } else {
      warnings.push(
        "CAS number is missing - may affect chemical identification",
      );
      score -= 10;
    }

    // UN number validation
    if (extractedData.unNumber) {
      const unPattern = /^UN\d{4}$/i;
      if (!unPattern.test(extractedData.unNumber)) {
        warnings.push(
          `UN number format may be invalid: ${extractedData.unNumber}`,
        );
        score -= 5;
      }
    }

    // NFPA ratings validation
    const health = parseInt(extractedData.healthRating || "0");
    const flammability = parseInt(extractedData.flammabilityRating || "0");
    const reactivity = parseInt(extractedData.reactivityRating || "0");

    if (health < 0 || health > 4) {
      warnings.push(
        `NFPA health rating out of range: ${health} (should be 0-4)`,
      );
      score -= 2;
    }
    if (flammability < 0 || flammability > 4) {
      warnings.push(
        `NFPA flammability rating out of range: ${flammability} (should be 0-4)`,
      );
      score -= 2;
    }
    if (reactivity < 0 || reactivity > 4) {
      warnings.push(
        `NFPA reactivity rating out of range: ${reactivity} (should be 0-4)`,
      );
      score -= 2;
    }

    // High hazard validation
    if (health >= 3 || flammability >= 3 || reactivity >= 3) {
      if (!extractedData.casNumber) {
        errors.push(
          "High hazard chemical missing CAS number - required for safety",
        );
        score -= 15;
      }
      if (
        !extractedData.hazardStatements ||
        extractedData.hazardStatements.length === 0
      ) {
        warnings.push("High hazard chemical missing hazard statements");
        score -= 10;
      }
    }

    // Hazard statements validation
    if (
      !extractedData.hazardStatements ||
      extractedData.hazardStatements.length === 0
    ) {
      warnings.push(
        "No hazard statements found - GHS compliance may be incomplete",
      );
      score -= 10;
    }

    // Storage conditions validation
    if (
      !extractedData.storageConditions ||
      extractedData.storageConditions.length === 0
    ) {
      warnings.push("Storage conditions not specified");
      score -= 5;
    }

    // First aid validation
    if (!extractedData.firstAid || extractedData.firstAid.trim().length === 0) {
      warnings.push("First aid measures not specified");
      score -= 5;
    }

    // Confidence score validation
    const aiConfidence = extractedData.aiConfidence || 0;
    if (aiConfidence < 50) {
      warnings.push(
        `Low AI confidence (${aiConfidence}%) - manual review strongly recommended`,
      );
      score -= 5;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
    };
  }

  /**
   * Check if MSDS data is complete enough for production use
   */
  isProductionReady(
    extractedData: ExtractedMSDSData,
    minScore: number = 70,
  ): boolean {
    const validation = this.validate(extractedData);
    return validation.isValid && validation.score >= minScore;
  }
}

export const msdsExtractionValidator = new MSDSExtractionValidator();
