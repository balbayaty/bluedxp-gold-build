/**
 * Sentiment Analyzer
 *
 * Analyzes sentiment in Arabic text
 * Determines commitment level for cargo psychology
 *
 * @module arabic-nlp
 */

import type {
  Sentiment,
  SentimentAnalysis,
  SentimentIndicator,
  CommitmentLevel,
} from "./types";

// ============================================================================
// SENTIMENT PATTERNS
// ============================================================================

/**
 * Positive sentiment patterns
 */
const POSITIVE_PATTERNS = [
  // Arabic positive words
  /(ممتاز|رائع|جميل|حلو|زين|كويس)/gi,
  /(شكراً|مشكور|مشكورين|نشكركم)/gi,
  /(تمام|ماشي|زين)/gi,
  /(ما شاء الله|بارك الله)/gi,
  /(الله يوفقك|الله يعطيك)/gi,
  // English positive words
  /(excellent|great|good|perfect|wonderful|amazing)/gi,
  /(thank|thanks|appreciate)/gi,
  // Positive emoticons
  /(😊|😄|😃|😁|👍|❤️|✅)/g,
];

/**
 * Negative sentiment patterns
 */
const NEGATIVE_PATTERNS = [
  // Arabic negative words
  /(مشكلة|مشاكل|خطأ|خطأ|غلط)/gi,
  /(غير راض|غير راضين|مستاء|مستاءين)/gi,
  /(تأخير|متأخر|متأخرة)/gi,
  /(لا|لا نريد|لا نحتاج)/gi,
  // English negative words
  /(problem|issue|error|wrong|bad|terrible|awful)/gi,
  /(not satisfied|unhappy|disappointed)/gi,
  /(delay|late|delayed)/gi,
  // Negative emoticons
  /(😞|😟|😠|😡|👎|❌)/g,
];

/**
 * Intensifiers (amplify sentiment)
 */
const INTENSIFIERS = [
  /(جداً|كثير|أكثر|أكثر من)/gi,
  /(very|extremely|really|so|too)/gi,
];

/**
 * Commitment level indicators
 */
const COMMITMENT_INDICATORS = {
  highly_committed: [
    /(نعم|أجل|موافق|موافقين|تمام)/gi,
    /(تأكيد|تأكد|نؤكد)/gi,
    /(yes|confirmed|agree|okay)/gi,
  ],
  committed: [/(ماشي|زين|حسناً)/gi, /(ok|okay|fine)/gi],
  uncertain: [/(إن شاء الله|إنشاء الله)/gi, /(inshallah|maybe|perhaps)/gi],
  highly_uncertain: [
    /(إن شاء الله إن شاء الله|إنشاء الله إنشاء الله)/gi,
    /(inshallah inshallah)/gi,
  ],
};

// ============================================================================
// SENTIMENT ANALYZER
// ============================================================================

export class SentimentAnalyzer {
  /**
   * Analyze sentiment
   */
  analyze(text: string): SentimentAnalysis {
    const indicators: SentimentIndicator[] = [];
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    // Analyze positive patterns
    for (const pattern of POSITIVE_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        positiveScore += 1;
        indicators.push({
          type: "positive_word",
          text: match[0],
          position: match.index,
          impact: 0.3,
        });
      }
    }

    // Analyze negative patterns
    for (const pattern of NEGATIVE_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        negativeScore += 1;
        indicators.push({
          type: "negative_word",
          text: match[0],
          position: match.index,
          impact: -0.3,
        });
      }
    }

    // Check for intensifiers
    for (const pattern of INTENSIFIERS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Find nearby sentiment indicators
        const nearbyIndicator = indicators.find(
          (i) => Math.abs(i.position - match.index) < 20,
        );
        if (nearbyIndicator) {
          nearbyIndicator.impact *= 1.5; // Amplify impact
        }
      }
    }

    // Check for emoticons
    const emoticonPattern = /(😊|😄|😃|😁|👍|❤️|✅|😞|😟|😠|😡|👎|❌)/g;
    let emoticonMatch;
    while ((emoticonMatch = emoticonPattern.exec(text)) !== null) {
      const isPositive = /(😊|😄|😃|😁|👍|❤️|✅)/.test(emoticonMatch[0]);
      indicators.push({
        type: "emoticon",
        text: emoticonMatch[0],
        position: emoticonMatch.index,
        impact: isPositive ? 0.2 : -0.2,
      });
      if (isPositive) {
        positiveScore += 0.5;
      } else {
        negativeScore += 0.5;
      }
    }

    // Calculate sentiment
    const totalScore = positiveScore + negativeScore + neutralScore;
    const sentiment: Sentiment =
      positiveScore > negativeScore
        ? "positive"
        : negativeScore > positiveScore
          ? "negative"
          : positiveScore === 0 && negativeScore === 0
            ? "neutral"
            : "mixed";

    // Calculate confidence
    const confidence =
      totalScore > 0
        ? Math.max(positiveScore, negativeScore) / totalScore
        : 0.5;

    // Calculate scores
    const scores = {
      positive: totalScore > 0 ? positiveScore / totalScore : 0.33,
      neutral: totalScore > 0 ? neutralScore / totalScore : 0.33,
      negative: totalScore > 0 ? negativeScore / totalScore : 0.33,
    };

    // Determine commitment level
    const commitmentLevel = this.determineCommitmentLevel(
      text,
      sentiment,
      indicators,
    );

    return {
      sentiment,
      confidence,
      scores,
      commitmentLevel,
      indicators: indicators.sort((a, b) => a.position - b.position),
    };
  }

  /**
   * Determine commitment level
   */
  private determineCommitmentLevel(
    text: string,
    sentiment: Sentiment,
    indicators: SentimentIndicator[],
  ): CommitmentLevel {
    // Check for highly committed indicators
    for (const pattern of COMMITMENT_INDICATORS.highly_committed) {
      if (pattern.test(text)) {
        return "highly_committed";
      }
    }

    // Check for committed indicators
    for (const pattern of COMMITMENT_INDICATORS.committed) {
      if (pattern.test(text)) {
        return "committed";
      }
    }

    // Check for uncertain indicators
    for (const pattern of COMMITMENT_INDICATORS.uncertain) {
      if (pattern.test(text)) {
        return "uncertain";
      }
    }

    // Check for highly uncertain indicators
    for (const pattern of COMMITMENT_INDICATORS.highly_uncertain) {
      if (pattern.test(text)) {
        return "highly_uncertain";
      }
    }

    // Default based on sentiment
    if (sentiment === "positive") {
      return "committed";
    } else if (sentiment === "negative") {
      return "uncertain";
    }

    return "neutral";
  }
}

// Export singleton
export const sentimentAnalyzer = new SentimentAnalyzer();
