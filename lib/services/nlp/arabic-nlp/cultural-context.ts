/**
 * Cultural Context Analyzer
 *
 * Analyzes cultural context in Arabic business communication
 * Detects honorifics, formality, business patterns, relationship depth
 *
 * @module arabic-nlp
 */

import type {
  CulturalContext,
  Honorific,
  HonorificType,
  FormalityLevel,
  BusinessPattern,
  CulturalIndicator,
} from "./types";

// ============================================================================
// HONORIFICS PATTERNS
// ============================================================================

/**
 * Honorific patterns
 */
const HONORIFIC_PATTERNS: Array<{
  pattern: RegExp;
  type: HonorificType;
  examples: string[];
}> = [
  {
    pattern: /(سيدي|أستاذ|أستاذي|سيدنا)/gi,
    type: "sir",
    examples: ["سيدي", "أستاذ", "أستاذي"],
  },
  {
    pattern: /(سيدتي|أستاذة|أستاذتي|سيدتنا)/gi,
    type: "madam",
    examples: ["سيدتي", "أستاذة"],
  },
  {
    pattern: /(أخي|أخ|أخي الكريم|أخي العزيز)/gi,
    type: "brother",
    examples: ["أخي", "أخ", "أخي الكريم"],
  },
  {
    pattern: /(أختي|أخت|أختي الكريمة|أختي العزيزة)/gi,
    type: "sister",
    examples: ["أختي", "أخت"],
  },
  {
    pattern: /(عمي|عم|عمي الكريم)/gi,
    type: "uncle",
    examples: ["عمي", "عم"],
  },
  {
    pattern: /(عمتي|عمة|عمتي الكريمة)/gi,
    type: "aunt",
    examples: ["عمتي", "عمة"],
  },
  {
    pattern: /(معالي|فضيلة|معاليه)/gi,
    type: "excellency",
    examples: ["معالي", "فضيلة"],
  },
  {
    pattern: /(فخامة|فخامته)/gi,
    type: "honorable",
    examples: ["فخامة"],
  },
];

// ============================================================================
// FORMALITY INDICATORS
// ============================================================================

/**
 * Formal indicators
 */
const FORMAL_INDICATORS = [
  /(تحية طيبة|السلام عليكم ورحمة الله|أطيب التحيات)/gi,
  /(نشكركم|نشكرك|نشكر لكم)/gi,
  /(نرجو|نرجوكم|نرجوك)/gi,
  /(يرجى|يرجى منكم|يرجى منك)/gi,
  /(نود|نود أن|نود إعلامكم)/gi,
  /(نحيطكم علماً|نحيطك علماً)/gi,
  /(نفيدكم|نفيدك)/gi,
  /(مع فائق الاحترام|مع أطيب التحيات)/gi,
];

/**
 * Informal indicators
 */
const INFORMAL_INDICATORS = [
  /(مرحبا|أهلاً|أهلاً وسهلاً)/gi,
  /(شلونك|كيفك|وينك)/gi,
  /(ماشي|تمام|زين)/gi,
  /(يالله|يلا)/gi,
  /(على راسي|على راسك)/gi,
];

// ============================================================================
// BUSINESS PATTERNS
// ============================================================================

/**
 * Business pattern indicators
 */
const BUSINESS_PATTERN_INDICATORS = {
  direct: [/(نريد|نحتاج|نطلب)/gi, /(نحتاج|نريد)/gi, /(مباشرة|فوراً|عاجل)/gi],
  indirect: [/(نرجو|نود|نتمنى)/gi, /(إذا أمكن|إن أمكن)/gi, /(نأمل|نتمنى)/gi],
  polite: [
    /(من فضلك|لو سمحت|إذا سمحت)/gi,
    /(نشكركم|نشكرك)/gi,
    /(مع الشكر|مع التقدير)/gi,
  ],
  urgent: [
    /(عاجل|فوري|مستعجل|مستعجلة)/gi,
    /(أولوية|أولوية عالية)/gi,
    /(ASAP|urgent|immediate)/gi,
  ],
  casual: [/(ماشي|تمام|زين)/gi, /(يالله|يلا)/gi, /(على راسي)/gi],
  formal: [/(تحية طيبة)/gi, /(مع فائق الاحترام)/gi, /(نحيطكم علماً)/gi],
};

// ============================================================================
// CULTURAL INDICATORS
// ============================================================================

/**
 * Cultural indicator patterns
 */
const CULTURAL_INDICATOR_PATTERNS = {
  greeting: [
    /(السلام عليكم|السلام عليكم ورحمة الله|السلام عليكم ورحمة الله وبركاته)/gi,
    /(صباح الخير|مساء الخير)/gi,
    /(أهلاً وسهلاً|مرحباً)/gi,
  ],
  blessing: [
    /(بارك الله فيك|بارك الله فيكم)/gi,
    /(الله يبارك|الله يبارك فيك)/gi,
    /(جزاك الله خير|جزاكم الله خير)/gi,
  ],
  prayer: [
    /(الله يعطيك|الله يعطيكم)/gi,
    /(الله يوفقك|الله يوفقكم)/gi,
    /(الله يسهل|الله يسهل عليك)/gi,
    /(عساك|عساكم|عساها)/gi,
  ],
  proverb: [/(في التأني السلامة|في العجلة الندامة)/gi, /(الصبر مفتاح الفرج)/gi],
  expression: [
    /(ما شاء الله|ما شاء الله عليك)/gi,
    /(الحمد لله|الحمدلله)/gi,
    /(إن شاء الله|إنشاء الله)/gi,
  ],
};

// ============================================================================
// CULTURAL CONTEXT ANALYZER
// ============================================================================

export class CulturalContextAnalyzer {
  /**
   * Analyze cultural context
   */
  analyze(text: string): CulturalContext {
    const honorifics = this.detectHonorifics(text);
    const formality = this.detectFormality(text);
    const businessPattern = this.detectBusinessPattern(text);
    const relationshipDepth = this.detectRelationshipDepth(
      text,
      honorifics,
      formality,
    );
    const culturalIndicators = this.detectCulturalIndicators(text);

    return {
      honorifics,
      formality,
      businessPattern,
      relationshipDepth,
      culturalIndicators,
    };
  }

  /**
   * Detect honorifics
   */
  private detectHonorifics(text: string): Honorific[] {
    const honorifics: Honorific[] = [];

    for (const patternInfo of HONORIFIC_PATTERNS) {
      let match;
      while ((match = patternInfo.pattern.exec(text)) !== null) {
        honorifics.push({
          type: patternInfo.type,
          text: match[0],
          position: match.index,
          confidence: 0.9, // High confidence for pattern matching
        });
      }
    }

    return honorifics.sort((a, b) => a.position - b.position);
  }

  /**
   * Detect formality level
   */
  private detectFormality(text: string): FormalityLevel {
    let formalScore = 0;
    let informalScore = 0;

    // Check formal indicators
    for (const pattern of FORMAL_INDICATORS) {
      const matches = text.match(pattern);
      if (matches) {
        formalScore += matches.length;
      }
    }

    // Check informal indicators
    for (const pattern of INFORMAL_INDICATORS) {
      const matches = text.match(pattern);
      if (matches) {
        informalScore += matches.length;
      }
    }

    // Determine formality
    if (formalScore > informalScore && formalScore > 0) {
      return "formal";
    } else if (informalScore > formalScore && informalScore > 0) {
      return "informal";
    } else if (formalScore > 0 || informalScore > 0) {
      return "mixed";
    }

    // Default to formal for business communication
    return "formal";
  }

  /**
   * Detect business pattern
   */
  private detectBusinessPattern(text: string): BusinessPattern {
    const patternScores: Record<string, number> = {
      direct: 0,
      indirect: 0,
      polite: 0,
      urgent: 0,
      casual: 0,
      formal: 0,
    };

    // Score each pattern type
    for (const [patternType, patterns] of Object.entries(
      BUSINESS_PATTERN_INDICATORS,
    )) {
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          patternScores[patternType] += matches.length;
        }
      }
    }

    // Find dominant pattern
    let maxScore = 0;
    let dominantPattern:
      | "direct"
      | "indirect"
      | "polite"
      | "urgent"
      | "casual"
      | "formal" = "polite";

    for (const [patternType, score] of Object.entries(patternScores)) {
      if (score > maxScore) {
        maxScore = score;
        dominantPattern = patternType as any;
      }
    }

    // Get indicators for this pattern
    const indicators: string[] = [];
    for (const pattern of BUSINESS_PATTERN_INDICATORS[dominantPattern]) {
      const matches = text.match(pattern);
      if (matches) {
        indicators.push(...matches);
      }
    }

    return {
      type: dominantPattern,
      indicators: [...new Set(indicators)],
      confidence: Math.min(1.0, maxScore / 5),
    };
  }

  /**
   * Detect relationship depth
   */
  private detectRelationshipDepth(
    text: string,
    honorifics: Honorific[],
    formality: FormalityLevel,
  ): "strategic" | "regular" | "occasional" | "one_time" | "unknown" {
    // Strategic: Excellency/Honorable + formal
    if (
      honorifics.some(
        (h) => h.type === "excellency" || h.type === "honorable",
      ) &&
      formality === "formal"
    ) {
      return "strategic";
    }

    // Regular: Sir/Madam + formal
    if (
      honorifics.some((h) => h.type === "sir" || h.type === "madam") &&
      formality === "formal"
    ) {
      return "regular";
    }

    // Occasional: Brother/Sister + mixed
    if (
      honorifics.some((h) => h.type === "brother" || h.type === "sister") &&
      formality === "mixed"
    ) {
      return "occasional";
    }

    // One time: No honorifics + informal
    if (honorifics.length === 0 && formality === "informal") {
      return "one_time";
    }

    return "unknown";
  }

  /**
   * Detect cultural indicators
   */
  private detectCulturalIndicators(text: string): CulturalIndicator[] {
    const indicators: CulturalIndicator[] = [];

    for (const [indicatorType, patterns] of Object.entries(
      CULTURAL_INDICATOR_PATTERNS,
    )) {
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          indicators.push({
            type: indicatorType as any,
            text: match[0],
            meaning: this.getCulturalMeaning(match[0], indicatorType),
            position: match.index,
          });
        }
      }
    }

    return indicators.sort((a, b) => a.position - b.position);
  }

  /**
   * Get cultural meaning
   */
  private getCulturalMeaning(text: string, type: string): string {
    const meanings: Record<string, Record<string, string>> = {
      greeting: {
        "السلام عليكم": "Peace be upon you",
        "صباح الخير": "Good morning",
        "مساء الخير": "Good evening",
      },
      blessing: {
        "بارك الله فيك": "May God bless you",
        "جزاك الله خير": "May God reward you with good",
      },
      prayer: {
        "الله يعطيك": "May God give you",
        "الله يوفقك": "May God grant you success",
        عساك: "May you be",
      },
      expression: {
        "ما شاء الله": "What God has willed",
        "الحمد لله": "Praise be to God",
      },
    };

    return meanings[type]?.[text] || "Cultural expression";
  }
}

// Export singleton
export const culturalContextAnalyzer = new CulturalContextAnalyzer();
