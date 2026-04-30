/**
 * Core Arabic NLP Engine
 *
 * Main engine for Arabic language processing
 * Handles tokenization, normalization, language detection
 *
 * @module arabic-nlp
 */

import { dialectProcessor } from "./dialect-processor";
import type { Language, ArabicDialect, Token } from "./types";

// ============================================================================
// ARABIC CHARACTER RANGES
// ============================================================================

/**
 * Arabic Unicode ranges
 */
const ARABIC_RANGES = [
  [0x0600, 0x06ff], // Arabic
  [0x0750, 0x077f], // Arabic Supplement
  [0x08a0, 0x08ff], // Arabic Extended-A
  [0xfb50, 0xfdff], // Arabic Presentation Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
];

/**
 * Check if character is Arabic
 */
function isArabicChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return ARABIC_RANGES.some(([start, end]) => code >= start && code <= end);
}

// ============================================================================
// CORE NLP ENGINE
// ============================================================================

export class ArabicNLPEngine {
  /**
   * Tokenize Arabic text
   */
  tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    let currentToken = "";
    let currentPosition = 0;
    let tokenStart = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isArabic = isArabicChar(char);
      const isSpace = /\s/.test(char);
      const isPunctuation = /[.,!?;:()\[\]{}\-"'،؛]/u.test(char);
      const isNumber = /\d/.test(char);
      const isEmoticon = /[\u{1F300}-\u{1F9FF}]/u.test(char);

      if (isSpace) {
        if (currentToken) {
          tokens.push(this.createToken(currentToken, tokenStart, text));
          currentToken = "";
        }
        continue;
      }

      if (isPunctuation || isEmoticon) {
        if (currentToken) {
          tokens.push(this.createToken(currentToken, tokenStart, text));
          currentToken = "";
        }
        tokens.push({
          text: char,
          normalized: char,
          position: i,
          type: isPunctuation ? "punctuation" : "emoticon",
          arabic: false,
        });
        continue;
      }

      if (!currentToken) {
        tokenStart = i;
      }

      currentToken += char;
    }

    // Add last token
    if (currentToken) {
      tokens.push(this.createToken(currentToken, tokenStart, text));
    }

    return tokens;
  }

  /**
   * Create token object
   */
  private createToken(text: string, position: number, fullText: string): Token {
    const isArabic =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
        text,
      );
    const isNumber = /^\d+$/.test(text);
    const normalized = this.normalizeToken(text);

    // Detect dialect
    const dialect = isArabic
      ? dialectProcessor.detectDialect(text).dialect
      : undefined;

    return {
      text,
      normalized,
      position,
      type: isNumber ? "number" : "word",
      arabic: isArabic,
      dialect,
    };
  }

  /**
   * Normalize token
   */
  private normalizeToken(token: string): string {
    // Remove diacritics (tashkeel)
    let normalized = token.replace(/[\u064B-\u065F\u0670]/g, "");

    // Normalize Arabic characters
    normalized = normalized
      .replace(/أ/g, "ا")
      .replace(/إ/g, "ا")
      .replace(/آ/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه");

    return normalized;
  }

  /**
   * Normalize Arabic text
   */
  normalize(text: string): string {
    // Remove diacritics
    let normalized = text.replace(/[\u064B-\u065F\u0670]/g, "");

    // Normalize Arabic characters
    normalized = normalized
      .replace(/أ/g, "ا")
      .replace(/إ/g, "ا")
      .replace(/آ/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه");

    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, " ").trim();

    return normalized;
  }

  /**
   * Detect language
   */
  detectLanguage(text: string): {
    language: Language;
    dialect: ArabicDialect;
    confidence: number;
  } {
    if (!text || text.length === 0) {
      return {
        language: "unknown",
        dialect: "unknown",
        confidence: 0,
      };
    }

    // Count Arabic characters
    let arabicCount = 0;
    let englishCount = 0;
    let totalChars = 0;

    for (const char of text) {
      if (/\s/.test(char) || /[.,!?;:()\[\]{}\-"'،؛]/u.test(char)) {
        continue;
      }

      totalChars++;

      if (isArabicChar(char)) {
        arabicCount++;
      } else if (/[a-zA-Z]/.test(char)) {
        englishCount++;
      }
    }

    if (totalChars === 0) {
      return {
        language: "unknown",
        dialect: "unknown",
        confidence: 0,
      };
    }

    const arabicRatio = arabicCount / totalChars;
    const englishRatio = englishCount / totalChars;

    // Determine language
    let language: Language;
    let confidence: number;

    if (arabicRatio > 0.7) {
      language = "ar";
      confidence = arabicRatio;
    } else if (englishRatio > 0.7) {
      language = "en";
      confidence = englishRatio;
    } else if (arabicRatio > 0.3 && englishRatio > 0.3) {
      language = "mixed";
      confidence = Math.min(arabicRatio, englishRatio);
    } else {
      language = "unknown";
      confidence = 0.1;
    }

    // Detect dialect if Arabic
    const dialect =
      language === "ar" || language === "mixed"
        ? dialectProcessor.detectDialect(text).dialect
        : "unknown";

    return {
      language,
      dialect,
      confidence,
    };
  }

  /**
   * Remove diacritics (tashkeel)
   */
  removeDiacritics(text: string): string {
    return text.replace(/[\u064B-\u065F\u0670]/g, "");
  }

  /**
   * Extract Arabic words
   */
  extractArabicWords(text: string): string[] {
    const tokens = this.tokenize(text);
    return tokens
      .filter((t) => t.arabic && t.type === "word")
      .map((t) => t.text);
  }

  /**
   * Extract English words
   */
  extractEnglishWords(text: string): string[] {
    const tokens = this.tokenize(text);
    return tokens
      .filter((t) => !t.arabic && t.type === "word" && /[a-zA-Z]/.test(t.text))
      .map((t) => t.text);
  }
}

// Export singleton
export const arabicNLPEngine = new ArabicNLPEngine();
