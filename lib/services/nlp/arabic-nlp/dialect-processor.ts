/**
 * Gulf Dialect Processor
 *
 * Handles Gulf Arabic dialect variations and regional differences
 * Supports: Saudi, UAE, Kuwait, Qatar, Bahrain, Oman
 *
 * @module arabic-nlp
 */

import type {
  ArabicDialect,
  GulfDialectPattern,
  RegionalVariation,
} from "./types";

// ============================================================================
// GULF DIALECT PATTERNS
// ============================================================================

/**
 * Common Gulf dialect patterns
 */
export const GULF_DIALECT_PATTERNS: GulfDialectPattern[] = [
  // Common Gulf words
  {
    pattern: /وين|وينك|وينه|وينها/gi,
    meaning: "where",
    msaEquivalent: "أين",
    examples: ["وين الشحنة؟", "وينك؟"],
  },
  {
    pattern: /شلون|شلونك|كيفك/gi,
    meaning: "how",
    msaEquivalent: "كيف",
    examples: ["شلون الحال؟", "شلونك؟"],
  },
  {
    pattern: /وين|وينه|وينها/gi,
    meaning: "where",
    msaEquivalent: "أين",
    examples: ["وين الشحنة؟"],
  },
  {
    pattern: /شبيك|شبيكم/gi,
    meaning: "what about you",
    msaEquivalent: "ماذا عنك",
    examples: ["شبيك؟", "شبيكم؟"],
  },
  {
    pattern: /يالله|يلا/gi,
    meaning: "let's go or come on",
    msaEquivalent: "هيا",
    examples: ["يالله نروح", "يلا"],
  },
  {
    pattern: /عساك|عساكم|عساها/gi,
    meaning: "may you be",
    examples: ["عساك بخير", "عساكم بخير"],
  },
  {
    pattern: /الله يعطيك|الله يعطيكم/gi,
    meaning: "may God give you",
    examples: ["الله يعطيك العافية"],
  },
  {
    pattern: /ما شاء الله|ما شاء الله عليك/gi,
    meaning: "what God has willed",
    examples: ["ما شاء الله", "ما شاء الله عليك"],
  },
  {
    pattern: /بس|بس/gi,
    meaning: "but or only",
    msaEquivalent: "لكن أو فقط",
    examples: ["بس شوي", "بس"],
  },
  {
    pattern: /شوي|شوية/gi,
    meaning: "a little",
    msaEquivalent: "قليلاً",
    examples: ["شوي", "شوية"],
  },
  {
    pattern: /زين|زينة/gi,
    meaning: "good or nice",
    msaEquivalent: "جيد أو حسن",
    examples: ["زين", "زينة"],
  },
  {
    pattern: /ماشي|ماشي/gi,
    meaning: "okay or alright",
    msaEquivalent: "حسناً",
    examples: ["ماشي", "ماشي تمام"],
  },
  {
    pattern: /تمام|تماماً/gi,
    meaning: "okay or perfect",
    msaEquivalent: "حسناً أو ممتاز",
    examples: ["تمام", "تماماً"],
  },
  {
    pattern: /على راسي|على راسي/gi,
    meaning: "on my head (I'll do it)",
    examples: ["على راسي"],
  },
  {
    pattern: /الله يوفقك|الله يوفقكم/gi,
    meaning: "may God grant you success",
    examples: ["الله يوفقك"],
  },
];

/**
 * Regional variations (Saudi, UAE, Kuwait, etc.)
 */
export const REGIONAL_VARIATIONS: RegionalVariation[] = [
  {
    region: "saudi",
    variations: [
      {
        gulf: "وين",
        regional: "وين",
        meaning: "where",
      },
      {
        gulf: "شلون",
        regional: "كيف",
        meaning: "how",
      },
      {
        gulf: "زين",
        regional: "حلو أو كويس",
        meaning: "good",
      },
    ],
  },
  {
    region: "uae",
    variations: [
      {
        gulf: "وين",
        regional: "وين",
        meaning: "where",
      },
      {
        gulf: "شلون",
        regional: "شلون",
        meaning: "how",
      },
    ],
  },
  {
    region: "kuwait",
    variations: [
      {
        gulf: "وين",
        regional: "وين",
        meaning: "where",
      },
    ],
  },
];

// ============================================================================
// DIALECT PROCESSOR
// ============================================================================

export class DialectProcessor {
  /**
   * Detect Gulf dialect
   */
  detectDialect(text: string): {
    dialect: ArabicDialect;
    confidence: number;
    indicators: string[];
  } {
    const indicators: string[] = [];
    let gulfScore = 0;
    let totalMatches = 0;

    // Check for Gulf dialect patterns
    for (const pattern of GULF_DIALECT_PATTERNS) {
      const regex =
        typeof pattern.pattern === "string"
          ? new RegExp(pattern.pattern, "gi")
          : pattern.pattern;

      const matches = text.match(regex);
      if (matches) {
        totalMatches += matches.length;
        gulfScore += matches.length;
        indicators.push(...matches);
      }
    }

    // Check for specific regional markers
    const saudiMarkers = ["وين", "شلون", "زين", "ماشي", "تمام"];
    const uaeMarkers = ["وين", "شلون"];
    const kuwaitMarkers = ["وين"];

    const saudiCount = saudiMarkers.filter((m) => text.includes(m)).length;
    const uaeCount = uaeMarkers.filter((m) => text.includes(m)).length;
    const kuwaitCount = kuwaitMarkers.filter((m) => text.includes(m)).length;

    // Determine dialect
    if (gulfScore > 0) {
      const confidence = Math.min(
        1.0,
        gulfScore / Math.max(1, text.length / 10),
      );

      // Determine specific Gulf dialect
      if (saudiCount >= uaeCount && saudiCount >= kuwaitCount) {
        return {
          dialect: "gulf", // Could be more specific: 'saudi'
          confidence,
          indicators: [...new Set(indicators)],
        };
      } else if (uaeCount >= kuwaitCount) {
        return {
          dialect: "gulf", // Could be more specific: 'uae'
          confidence,
          indicators: [...new Set(indicators)],
        };
      } else {
        return {
          dialect: "gulf",
          confidence,
          indicators: [...new Set(indicators)],
        };
      }
    }

    // Check for MSA indicators
    const msaIndicators = ["التي", "الذي", "التي", "اللذان", "اللتان"];
    const msaCount = msaIndicators.filter((m) => text.includes(m)).length;

    if (msaCount > 0) {
      return {
        dialect: "msa",
        confidence: Math.min(1.0, msaCount / 5),
        indicators: [],
      };
    }

    // Default to unknown
    return {
      dialect: "unknown",
      confidence: 0.1,
      indicators: [],
    };
  }

  /**
   * Normalize Gulf dialect to MSA (for analysis)
   */
  normalizeToMSA(text: string): string {
    let normalized = text;

    // Replace common Gulf patterns with MSA equivalents
    for (const pattern of GULF_DIALECT_PATTERNS) {
      if (pattern.msaEquivalent) {
        const regex =
          typeof pattern.pattern === "string"
            ? new RegExp(pattern.pattern, "gi")
            : pattern.pattern;

        normalized = normalized.replace(regex, pattern.msaEquivalent);
      }
    }

    return normalized;
  }

  /**
   * Extract dialect-specific phrases
   */
  extractDialectPhrases(text: string): Array<{
    phrase: string;
    dialect: ArabicDialect;
    meaning: string;
    position: number;
  }> {
    const phrases: Array<{
      phrase: string;
      dialect: ArabicDialect;
      meaning: string;
      position: number;
    }> = [];

    for (const pattern of GULF_DIALECT_PATTERNS) {
      const regex =
        typeof pattern.pattern === "string"
          ? new RegExp(pattern.pattern, "gi")
          : pattern.pattern;

      let match;
      while ((match = regex.exec(text)) !== null) {
        phrases.push({
          phrase: match[0],
          dialect: "gulf",
          meaning: pattern.meaning,
          position: match.index,
        });
      }
    }

    return phrases.sort((a, b) => a.position - b.position);
  }

  /**
   * Identify regional variation
   */
  identifyRegion(
    text: string,
  ): "saudi" | "uae" | "kuwait" | "qatar" | "bahrain" | "oman" | "unknown" {
    // Check for region-specific markers
    const saudiMarkers = ["وين", "شلون", "زين", "ماشي", "تمام", "على راسي"];
    const uaeMarkers = ["وين", "شلون"];
    const kuwaitMarkers = ["وين"];

    const saudiCount = saudiMarkers.filter((m) => text.includes(m)).length;
    const uaeCount = uaeMarkers.filter((m) => text.includes(m)).length;
    const kuwaitCount = kuwaitMarkers.filter((m) => text.includes(m)).length;

    if (saudiCount > uaeCount && saudiCount > kuwaitCount) {
      return "saudi";
    } else if (uaeCount > kuwaitCount) {
      return "uae";
    } else if (kuwaitCount > 0) {
      return "kuwait";
    }

    return "unknown";
  }
}

// Export singleton
export const dialectProcessor = new DialectProcessor();
