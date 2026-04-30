/**
 * Parsing Pattern Library
 * Centralized pattern library for MSDS parsing
 * Self-updating based on successful extractions
 */

export interface ParsingPattern {
  id: string;
  field: string;
  pattern: RegExp | string;
  confidence: number;
  successCount: number;
  failureCount: number;
  context: string[];
  examples: string[];
  lastUpdated: string;
  source: "regex" | "ml" | "user_feedback" | "knowledge_base";
}

class ParsingPatternLibrary {
  private patterns: Map<string, ParsingPattern[]> = new Map();

  constructor() {
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default patterns
   */
  private initializeDefaultPatterns(): void {
    // CAS Number Patterns (multiple variations)
    this.addPattern({
      id: "cas-1",
      field: "casNumber",
      pattern:
        /CAS\s*(?:No|Number|Registry\s*Number)?\s*:?\s*(\d{2,7}-\d{2}-\d{1})/i,
      confidence: 0.95,
      successCount: 0,
      failureCount: 0,
      context: ["identification", "section 1", "product identification"],
      examples: [
        "CAS No: 64-17-5",
        "CAS Number: 123-45-6",
        "CAS Registry Number: 7732-18-5",
      ],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    this.addPattern({
      id: "cas-2",
      field: "casNumber",
      pattern: /(\d{2,7}-\d{2}-\d{1})(?:\s|$|,|;|\.)/,
      confidence: 0.7,
      successCount: 0,
      failureCount: 0,
      context: ["anywhere"],
      examples: ["64-17-5", "123-45-6"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    // EC Number Patterns
    this.addPattern({
      id: "ec-1",
      field: "ecNumber",
      pattern: /EC\s*(?:No|Number)?\s*:?\s*(\d{3}-\d{3}-\d{1})/i,
      confidence: 0.9,
      successCount: 0,
      failureCount: 0,
      context: ["identification", "section 1"],
      examples: ["EC No: 200-578-6", "EC Number: 231-791-2"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    this.addPattern({
      id: "ec-2",
      field: "ecNumber",
      pattern: /EINECS\s*(?:No)?\s*:?\s*(\d{3}-\d{3}-\d{1})/i,
      confidence: 0.9,
      successCount: 0,
      failureCount: 0,
      context: ["identification"],
      examples: ["EINECS No: 200-578-6"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    // UN Number Patterns
    this.addPattern({
      id: "un-1",
      field: "unNumber",
      pattern: /UN\s*(?:No|Number)?\s*:?\s*(\d{4})/i,
      confidence: 0.95,
      successCount: 0,
      failureCount: 0,
      context: ["transport", "section 14"],
      examples: ["UN No: 1203", "UN Number: 1993"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    // Molecular Formula Patterns
    this.addPattern({
      id: "formula-1",
      field: "molecularFormula",
      pattern:
        /(?:Molecular\s*Formula|Formula|Chemical\s*Formula)\s*:?\s*([A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)*)/i,
      confidence: 0.85,
      successCount: 0,
      failureCount: 0,
      context: ["composition", "section 3"],
      examples: ["Molecular Formula: H2O", "Formula: C6H12O6"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    // pH Patterns
    this.addPattern({
      id: "ph-1",
      field: "ph",
      pattern: /pH\s*(?:value|level)?\s*:?\s*(\d+\.?\d*)/i,
      confidence: 0.9,
      successCount: 0,
      failureCount: 0,
      context: ["physical properties", "section 9"],
      examples: ["pH: 7.0", "pH value: 6.5"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    // Flash Point Patterns
    this.addPattern({
      id: "flashpoint-1",
      field: "flashPoint",
      pattern: /Flash\s*Point\s*:?\s*([-]?\d+\.?\d*)\s*°?\s*C/i,
      confidence: 0.9,
      successCount: 0,
      failureCount: 0,
      context: ["physical properties", "section 9"],
      examples: ["Flash Point: 12.8 °C", "Flash Point: -40°C"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    // Boiling Point Patterns
    this.addPattern({
      id: "boilingpoint-1",
      field: "boilingPoint",
      pattern: /Boiling\s*Point\s*:?\s*(\d+\.?\d*)\s*°?\s*C/i,
      confidence: 0.9,
      successCount: 0,
      failureCount: 0,
      context: ["physical properties", "section 9"],
      examples: ["Boiling Point: 100 °C", "Boiling Point: 78.37°C"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    // Density Patterns
    this.addPattern({
      id: "density-1",
      field: "density",
      pattern: /Density\s*:?\s*(\d+\.?\d*)\s*g\/?cm³?/i,
      confidence: 0.85,
      successCount: 0,
      failureCount: 0,
      context: ["physical properties", "section 9"],
      examples: ["Density: 1.0 g/cm³", "Density: 0.789 g/cm3"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });

    // Manufacturer Patterns
    this.addPattern({
      id: "manufacturer-1",
      field: "manufacturer",
      pattern:
        /(?:Manufacturer|Supplier|Company)\s*:?\s*([A-Z][A-Za-z0-9\s&.,-]+)/i,
      confidence: 0.8,
      successCount: 0,
      failureCount: 0,
      context: ["identification", "section 1"],
      examples: ["Manufacturer: ABC Chemicals Inc.", "Supplier: XYZ Corp"],
      lastUpdated: new Date().toISOString(),
      source: "regex",
    });
  }

  /**
   * Add a new pattern
   */
  addPattern(pattern: ParsingPattern): void {
    const fieldPatterns = this.patterns.get(pattern.field) || [];
    fieldPatterns.push(pattern);
    this.patterns.set(pattern.field, fieldPatterns);
  }

  /**
   * Get patterns for a field, sorted by confidence and success rate
   */
  getPatterns(field: string, context?: string): ParsingPattern[] {
    const allPatterns = this.patterns.get(field) || [];

    // Filter by context if provided
    let filtered = allPatterns;
    if (context) {
      filtered = allPatterns.filter(
        (p) =>
          p.context.includes(context.toLowerCase()) ||
          p.context.includes("anywhere"),
      );
    }

    // Sort by: confidence * success rate
    return filtered.sort((a, b) => {
      const aScore =
        a.confidence *
        (a.successCount / Math.max(1, a.successCount + a.failureCount));
      const bScore =
        b.confidence *
        (b.successCount / Math.max(1, b.successCount + b.failureCount));
      return bScore - aScore;
    });
  }

  /**
   * Extract value using patterns
   */
  extract(field: string, text: string, context?: string): string | null {
    const patterns = this.getPatterns(field, context);

    for (const pattern of patterns) {
      try {
        const regex =
          typeof pattern.pattern === "string"
            ? new RegExp(pattern.pattern, "gi")
            : pattern.pattern;

        const match = text.match(regex);
        if (match && match[1]) {
          // Update success count
          pattern.successCount++;
          pattern.lastUpdated = new Date().toISOString();

          return match[1].trim();
        }
      } catch (error) {
        pattern.failureCount++;
        console.warn(`[pattern-library] Pattern ${pattern.id} failed:`, error);
      }
    }

    return null;
  }

  /**
   * Learn new pattern from successful extraction
   */
  learnPattern(
    field: string,
    value: string,
    context: string,
    source: ParsingPattern["source"] = "ml",
  ): void {
    // Extract pattern from context
    const pattern = this.buildPatternFromExample(value, context);

    if (pattern) {
      const newPattern: ParsingPattern = {
        id: `learned-${field}-${Date.now()}`,
        field,
        pattern,
        confidence: 0.6, // Start with lower confidence
        successCount: 1,
        failureCount: 0,
        context: [context],
        examples: [value],
        lastUpdated: new Date().toISOString(),
        source,
      };

      this.addPattern(newPattern);
      console.log(
        `[pattern-library] Learned new pattern for ${field}:`,
        pattern,
      );
    }
  }

  /**
   * Build regex pattern from example
   */
  private buildPatternFromExample(
    value: string,
    context: string,
  ): string | null {
    // Simple pattern building - in production, this would be more sophisticated
    // For CAS: extract the format
    if (/^\d{2,7}-\d{2}-\d{1}$/.test(value)) {
      return `(\\d{2,7}-\\d{2}-\\d{1})`;
    }
    // For other fields, build context-aware patterns
    return null;
  }

  /**
   * Update pattern statistics
   */
  recordSuccess(patternId: string): void {
    for (const patterns of this.patterns.values()) {
      const pattern = patterns.find((p) => p.id === patternId);
      if (pattern) {
        pattern.successCount++;
        pattern.confidence = Math.min(1, pattern.confidence + 0.01);
        pattern.lastUpdated = new Date().toISOString();
        return;
      }
    }
  }

  recordFailure(patternId: string): void {
    for (const patterns of this.patterns.values()) {
      const pattern = patterns.find((p) => p.id === patternId);
      if (pattern) {
        pattern.failureCount++;
        pattern.confidence = Math.max(0.1, pattern.confidence - 0.02);
        pattern.lastUpdated = new Date().toISOString();
        return;
      }
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalPatterns: number;
    fields: string[];
    averageConfidence: number;
    totalSuccesses: number;
    totalFailures: number;
  } {
    let totalSuccesses = 0;
    let totalFailures = 0;
    let totalConfidence = 0;
    let patternCount = 0;

    for (const patterns of this.patterns.values()) {
      for (const pattern of patterns) {
        totalSuccesses += pattern.successCount;
        totalFailures += pattern.failureCount;
        totalConfidence += pattern.confidence;
        patternCount++;
      }
    }

    return {
      totalPatterns: patternCount,
      fields: Array.from(this.patterns.keys()),
      averageConfidence: patternCount > 0 ? totalConfidence / patternCount : 0,
      totalSuccesses,
      totalFailures,
    };
  }
}

export const parsingPatternLibrary = new ParsingPatternLibrary();
