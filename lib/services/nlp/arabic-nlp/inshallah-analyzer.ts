/**
 * Inshallah Analyzer
 *
 * Analyzes "Inshallah" usage in Arabic text
 * Critical for cargo psychology - indicates commitment level
 *
 * @module arabic-nlp
 */

import type { InshallahAnalysis, InshallahContext } from "./types";

// ============================================================================
// INSHALLAH PATTERNS
// ============================================================================

/**
 * Inshallah variations
 */
const INSHALLAH_VARIANTS = [
  /إن شاء الله/gi, // MSA
  /إنشاء الله/gi, // Common misspelling
  /إن شا الله/gi, // Dialect variation
  /إنشالله/gi, // Combined
  /إنشاءالله/gi, // Combined misspelling
  /إن شاءالله/gi, // Mixed
  /inshallah/gi, // English transliteration
  /insha'allah/gi, // English transliteration with apostrophe
  /insha allah/gi, // English transliteration spaced
];

/**
 * Date/time patterns (for "inshallah with date")
 */
const DATE_TIME_PATTERNS = [
  /\d{1,2}\/\d{1,2}\/\d{4}/g, // DD/MM/YYYY
  /\d{4}-\d{2}-\d{2}/g, // YYYY-MM-DD
  /\d{1,2}:\d{2}/g, // HH:MM
  /(غداً|بعد غد|اليوم|الآن|الليلة|صباح|مساء|عصر)/g, // Arabic time words
  /(tomorrow|today|now|tonight|morning|evening|afternoon)/gi, // English time words
  /(يوم|ساعة|دقيقة|أسبوع|شهر)/g, // Arabic time units
];

/**
 * Conditional patterns (for "inshallah with condition")
 */
const CONDITIONAL_PATTERNS = [
  /(إذا|لو|إن|في حالة)/g, // Arabic conditionals
  /(if|when|in case)/gi, // English conditionals
];

// ============================================================================
// INSHALLAH ANALYZER
// ============================================================================

export class InshallahAnalyzer {
  /**
   * Analyze Inshallah usage in text
   */
  analyze(text: string): InshallahAnalysis {
    // Find all Inshallah occurrences
    const positions: number[] = [];
    const surroundingText: string[] = [];
    let count = 0;

    for (const variant of INSHALLAH_VARIANTS) {
      let match;
      while ((match = variant.exec(text)) !== null) {
        positions.push(match.index);
        count++;

        // Extract surrounding text (20 chars before and after)
        const start = Math.max(0, match.index - 20);
        const end = Math.min(text.length, match.index + match[0].length + 20);
        surroundingText.push(text.substring(start, end));
      }
    }

    // Determine context
    const context = this.determineContext(text, positions);

    // Calculate commitment score
    const commitmentScore = this.calculateCommitmentScore(context, count);

    return {
      detected: count > 0,
      count,
      context,
      commitmentScore,
      positions: [...new Set(positions)].sort((a, b) => a - b),
      surroundingText: [...new Set(surroundingText)],
    };
  }

  /**
   * Determine Inshallah context
   */
  private determineContext(
    text: string,
    positions: number[],
  ): InshallahContext {
    if (positions.length === 0) {
      return "none";
    }

    // Check for repeated Inshallah
    if (positions.length >= 2) {
      // Check if they're close together (within 50 chars)
      for (let i = 0; i < positions.length - 1; i++) {
        if (positions[i + 1] - positions[i] < 50) {
          return "repeated";
        }
      }
    }

    // Check each occurrence for context
    for (const position of positions) {
      // Extract context around this position
      const contextStart = Math.max(0, position - 100);
      const contextEnd = Math.min(text.length, position + 100);
      const context = text.substring(contextStart, contextEnd);

      // Check for date/time
      for (const pattern of DATE_TIME_PATTERNS) {
        if (pattern.test(context)) {
          // Check if date/time is close to Inshallah (within 30 chars)
          const matches = context.matchAll(pattern);
          for (const match of matches) {
            const matchPos = contextStart + (match.index || 0);
            if (Math.abs(matchPos - position) < 30) {
              return "with_date";
            }
          }
        }
      }

      // Check for time specifically
      if (/\d{1,2}:\d{2}/.test(context)) {
        const timeMatch = context.match(/\d{1,2}:\d{2}/);
        if (timeMatch) {
          const timePos = contextStart + (timeMatch.index || 0);
          if (Math.abs(timePos - position) < 30) {
            return "with_time";
          }
        }
      }

      // Check for conditional
      for (const pattern of CONDITIONAL_PATTERNS) {
        if (pattern.test(context)) {
          const matches = context.matchAll(pattern);
          for (const match of matches) {
            const matchPos = contextStart + (match.index || 0);
            if (Math.abs(matchPos - position) < 30) {
              return "with_condition";
            }
          }
        }
      }
    }

    // If multiple Inshallahs but not repeated pattern
    if (positions.length >= 2) {
      return "repeated";
    }

    // Default: alone
    return "alone";
  }

  /**
   * Calculate commitment score based on context
   */
  private calculateCommitmentScore(
    context: InshallahContext,
    count: number,
  ): number {
    // Base scores by context (from specification)
    const contextScores: Record<InshallahContext, number> = {
      with_time: 0.8, // High commitment
      with_date: 0.7, // Relatively committed
      with_condition: 0.5, // Conditional
      alone: 0.4, // Uncertain
      repeated: 0.2, // Very uncertain
      none: 1.0, // No Inshallah = high commitment
    };

    let score = contextScores[context];

    // Penalize for multiple Inshallahs
    if (count > 1 && context !== "none") {
      score *= Math.max(0.5, 1 - (count - 1) * 0.1);
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Extract Inshallah phrases with context
   */
  extractInshallahPhrases(text: string): Array<{
    phrase: string;
    position: number;
    context: InshallahContext;
    commitmentScore: number;
  }> {
    const analysis = this.analyze(text);
    const phrases: Array<{
      phrase: string;
      position: number;
      context: InshallahContext;
      commitmentScore: number;
    }> = [];

    for (let i = 0; i < analysis.positions.length; i++) {
      const position = analysis.positions[i];
      const start = Math.max(0, position - 10);
      const end = Math.min(text.length, position + 20);
      const phrase = text.substring(start, end);

      phrases.push({
        phrase,
        position,
        context: analysis.context,
        commitmentScore: analysis.commitmentScore,
      });
    }

    return phrases;
  }
}

// Export singleton
export const inshallahAnalyzer = new InshallahAnalyzer();
