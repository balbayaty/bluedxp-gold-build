/**
 * MSDS Duplicate Detection Service
 * Detects if an MSDS already exists in the database based on various criteria
 */

import { MSDSSubmission, ExtractedMSDSData } from "@/types/msds";

export interface DuplicateMatch {
  submission: MSDSSubmission;
  similarity: number;
  matchType: "exact" | "cas" | "name" | "similar";
  matchedFields: string[];
  confidence: "high" | "medium" | "low";
}

export class MSDSDuplicateDetectionService {
  /**
   * Check if MSDS is duplicate based on CAS number
   */
  async checkDuplicateByCAS(
    newSubmission: MSDSSubmission,
    existingSubmissions: MSDSSubmission[],
  ): Promise<DuplicateMatch | null> {
    const newCAS = newSubmission.extractedData?.casNumber;

    if (!newCAS || newCAS === "CAS not found") {
      return null;
    }

    // Normalize CAS number (remove spaces, dashes)
    const normalizedNewCAS = newCAS.replace(/[\s-]/g, "");

    for (const existing of existingSubmissions) {
      const existingCAS = existing.extractedData?.casNumber;

      if (existingCAS && existingCAS !== "CAS not found") {
        const normalizedExistingCAS = existingCAS.replace(/[\s-]/g, "");

        if (normalizedNewCAS === normalizedExistingCAS) {
          return {
            submission: existing,
            similarity: 100,
            matchType: "cas",
            matchedFields: ["casNumber"],
            confidence: "high",
          };
        }
      }
    }

    return null;
  }

  /**
   * Check if MSDS is duplicate based on product name
   */
  async checkDuplicateByName(
    newSubmission: MSDSSubmission,
    existingSubmissions: MSDSSubmission[],
  ): Promise<DuplicateMatch | null> {
    const newName = newSubmission.extractedData?.productName
      ?.toLowerCase()
      .trim();

    if (
      !newName ||
      newName === "unknown product" ||
      newName === "unknown chemical"
    ) {
      return null;
    }

    for (const existing of existingSubmissions) {
      const existingName = existing.extractedData?.productName
        ?.toLowerCase()
        .trim();

      if (
        existingName &&
        existingName !== "unknown product" &&
        existingName !== "unknown chemical"
      ) {
        // Exact match
        if (newName === existingName) {
          return {
            submission: existing,
            similarity: 100,
            matchType: "name",
            matchedFields: ["productName"],
            confidence: "high",
          };
        }

        // Similar match (fuzzy)
        const similarity = this.calculateStringSimilarity(
          newName,
          existingName,
        );
        if (similarity >= 0.9) {
          return {
            submission: existing,
            similarity: Math.round(similarity * 100),
            matchType: "similar",
            matchedFields: ["productName"],
            confidence: similarity >= 0.95 ? "high" : "medium",
          };
        }
      }
    }

    return null;
  }

  /**
   * Check if MSDS is exact duplicate (multiple fields match)
   */
  async checkExactDuplicate(
    newSubmission: MSDSSubmission,
    existingSubmissions: MSDSSubmission[],
  ): Promise<DuplicateMatch | null> {
    const newData = newSubmission.extractedData;

    if (!newData) return null;

    for (const existing of existingSubmissions) {
      const existingData = existing.extractedData;
      if (!existingData) continue;

      const matchedFields: string[] = [];
      let matchCount = 0;
      let totalFields = 0;

      // Check key fields
      const fieldsToCheck = [
        "casNumber",
        "productName",
        "manufacturer",
        "molecularFormula",
        "ecNumber",
        "unNumber",
      ];

      for (const field of fieldsToCheck) {
        const newValue = (newData as any)[field];
        const existingValue = (existingData as any)[field];

        if (
          newValue &&
          existingValue &&
          newValue !== "CAS not found" &&
          newValue !== "Unknown" &&
          newValue !== "N/A"
        ) {
          totalFields++;

          if (field === "casNumber") {
            const normalizedNew = newValue.replace(/[\s-]/g, "");
            const normalizedExisting = existingValue.replace(/[\s-]/g, "");
            if (normalizedNew === normalizedExisting) {
              matchCount++;
              matchedFields.push(field);
            }
          } else if (field === "productName") {
            const similarity = this.calculateStringSimilarity(
              newValue.toLowerCase(),
              existingValue.toLowerCase(),
            );
            if (similarity >= 0.9) {
              matchCount++;
              matchedFields.push(field);
            }
          } else if (newValue === existingValue) {
            matchCount++;
            matchedFields.push(field);
          }
        }
      }

      if (totalFields > 0 && matchCount >= Math.ceil(totalFields * 0.8)) {
        return {
          submission: existing,
          similarity: Math.round((matchCount / totalFields) * 100),
          matchType: "exact",
          matchedFields,
          confidence:
            matchCount === totalFields
              ? "high"
              : matchCount >= Math.ceil(totalFields * 0.9)
                ? "high"
                : "medium",
        };
      }
    }

    return null;
  }

  /**
   * Check for all types of duplicates
   */
  async checkDuplicates(
    newSubmission: MSDSSubmission,
    existingSubmissions: MSDSSubmission[],
  ): Promise<DuplicateMatch[]> {
    const matches: DuplicateMatch[] = [];

    // Check exact duplicate first
    const exactMatch = await this.checkExactDuplicate(
      newSubmission,
      existingSubmissions,
    );
    if (exactMatch) {
      matches.push(exactMatch);
      return matches; // Exact match is definitive
    }

    // Check CAS number match
    const casMatch = await this.checkDuplicateByCAS(
      newSubmission,
      existingSubmissions,
    );
    if (casMatch) {
      matches.push(casMatch);
    }

    // Check name match (if CAS didn't match)
    if (!casMatch) {
      const nameMatch = await this.checkDuplicateByName(
        newSubmission,
        existingSubmissions,
      );
      if (nameMatch) {
        matches.push(nameMatch);
      }
    }

    return matches;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get recommendation based on duplicate match
   */
  getRecommendation(match: DuplicateMatch): {
    action: "auto-approve" | "review" | "reject";
    message: string;
    reason: string;
  } {
    if (match.matchType === "exact" && match.confidence === "high") {
      return {
        action: "auto-approve",
        message: "Exact duplicate found - Auto-approve recommended",
        reason: `This MSDS is identical to an existing approved MSDS (${match.similarity}% match). All key fields match.`,
      };
    }

    if (match.matchType === "cas" && match.confidence === "high") {
      return {
        action: "review",
        message: "CAS number match found - Quick review recommended",
        reason: `This MSDS has the same CAS number as an existing MSDS. Review for any differences.`,
      };
    }

    if (match.matchType === "name" && match.confidence === "high") {
      return {
        action: "review",
        message: "Product name match found - Review recommended",
        reason: `This MSDS has a similar product name to an existing MSDS. Verify if it's the same product.`,
      };
    }

    return {
      action: "review",
      message: "Similar MSDS found - Manual review required",
      reason: `Similar MSDS found with ${match.similarity}% similarity. Please review for differences.`,
    };
  }
}

export const msdsDuplicateDetectionService =
  new MSDSDuplicateDetectionService();
