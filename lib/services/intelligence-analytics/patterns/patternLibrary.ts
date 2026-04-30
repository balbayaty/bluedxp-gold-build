/**
 * Pattern Library
 *
 * Stores and manages discovered patterns across modules
 */

import type { Pattern } from "@/types/intelligence-analytics";

export class PatternLibrary {
  private static instance: PatternLibrary;
  private patterns: Map<string, Pattern> = new Map();

  private constructor() {}

  static getInstance(): PatternLibrary {
    if (!PatternLibrary.instance) {
      PatternLibrary.instance = new PatternLibrary();
    }
    return PatternLibrary.instance;
  }

  /**
   * Store a pattern
   */
  storePattern(pattern: Pattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): Pattern | undefined {
    return this.patterns.get(id);
  }

  /**
   * Get all patterns
   */
  getAllPatterns(filters?: {
    type?: Pattern["patternType"];
    module?: string;
    minConfidence?: number;
  }): Pattern[] {
    let patterns = Array.from(this.patterns.values());

    if (filters) {
      if (filters.type) {
        patterns = patterns.filter((p) => p.patternType === filters.type);
      }
      if (filters.module) {
        patterns = patterns.filter((p) =>
          p.affectedModules.includes(filters.module!),
        );
      }
      if (filters.minConfidence) {
        patterns = patterns.filter(
          (p) => p.confidence >= filters.minConfidence!,
        );
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find similar patterns
   */
  findSimilarPatterns(pattern: Pattern, threshold: number = 0.7): Pattern[] {
    const similar: Pattern[] = [];

    for (const storedPattern of this.patterns.values()) {
      if (storedPattern.id === pattern.id) continue;

      // Calculate similarity
      const similarity = this.calculateSimilarity(pattern, storedPattern);
      if (similarity >= threshold) {
        similar.push(storedPattern);
      }
    }

    return similar.sort((a, b) => {
      const simA = this.calculateSimilarity(pattern, a);
      const simB = this.calculateSimilarity(pattern, b);
      return simB - simA;
    });
  }

  /**
   * Calculate similarity between patterns
   */
  private calculateSimilarity(pattern1: Pattern, pattern2: Pattern): number {
    let similarity = 0;

    // Type similarity
    if (pattern1.patternType === pattern2.patternType) {
      similarity += 0.3;
    }

    // Module overlap
    const commonModules = pattern1.affectedModules.filter((m) =>
      pattern2.affectedModules.includes(m),
    );
    const moduleOverlap =
      commonModules.length /
      Math.max(
        pattern1.affectedModules.length,
        pattern2.affectedModules.length,
      );
    similarity += moduleOverlap * 0.3;

    // Description similarity (simple)
    const desc1 = pattern1.description.toLowerCase();
    const desc2 = pattern2.description.toLowerCase();
    if (desc1.includes(desc2) || desc2.includes(desc1)) {
      similarity += 0.2;
    }

    // Frequency similarity
    const freqSimilarity =
      1 -
      Math.abs(pattern1.frequency - pattern2.frequency) /
        Math.max(pattern1.frequency, pattern2.frequency);
    similarity += freqSimilarity * 0.2;

    return Math.min(similarity, 1.0);
  }

  /**
   * Get patterns by module
   */
  getPatternsByModule(moduleId: string): Pattern[] {
    return Array.from(this.patterns.values()).filter((p) =>
      p.affectedModules.includes(moduleId),
    );
  }

  /**
   * Get patterns by type
   */
  getPatternsByType(type: Pattern["patternType"]): Pattern[] {
    return Array.from(this.patterns.values()).filter(
      (p) => p.patternType === type,
    );
  }

  /**
   * Clear patterns
   */
  clear(): void {
    this.patterns.clear();
  }
}

// Export singleton instance
export const patternLibrary = PatternLibrary.getInstance();
