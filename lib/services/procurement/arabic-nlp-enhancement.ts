/**
 * Procurement Arabic NLP Enhancement
 *
 * Complete Arabic NLP integration for procurement
 * Vendor communication analysis, intent detection
 *
 * @module procurement
 */

import { arabicNLPService } from "@/lib/services/nlp/arabic-nlp";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

/**
 * Analyze vendor communication
 */
export async function analyzeVendorCommunication(
  vendorId: string,
  tenantId: string,
  messages: Array<{ text: string; timestamp: Date; source: string }>,
): Promise<{
  overallSentiment: "positive" | "negative" | "neutral" | "mixed";
  commitmentLevel: "HIGH" | "MEDIUM" | "LOW";
  intents: Array<{ intent: string; confidence: number }>;
  insights: string[];
  recommendations: string[];
}> {
  if (messages.length === 0) {
    return {
      overallSentiment: "neutral",
      commitmentLevel: "MEDIUM",
      intents: [],
      insights: [],
      recommendations: [],
    };
  }

  // Analyze all messages
  const analyses = await Promise.all(
    messages
      .filter((m) => m.text)
      .map((msg) => arabicNLPService.analyze(msg.text)),
  );

  // Aggregate sentiment
  const sentiments = analyses.map((a) => a.sentiment.sentiment);
  const positiveCount = sentiments.filter((s) => s === "positive").length;
  const negativeCount = sentiments.filter((s) => s === "negative").length;

  const overallSentiment: "positive" | "negative" | "neutral" | "mixed" =
    positiveCount > negativeCount
      ? "positive"
      : negativeCount > positiveCount
        ? "negative"
        : positiveCount > 0 && negativeCount > 0
          ? "mixed"
          : "neutral";

  // Aggregate commitment level
  const commitmentScores = analyses.map((a) =>
    a.commitmentLevel === "HIGH" ? 1 : a.commitmentLevel === "MEDIUM" ? 0.5 : 0,
  );
  const avgCommitment =
    commitmentScores.reduce((sum, s) => sum + s, 0) / commitmentScores.length;
  const commitmentLevel: "HIGH" | "MEDIUM" | "LOW" =
    avgCommitment > 0.7 ? "HIGH" : avgCommitment > 0.4 ? "MEDIUM" : "LOW";

  // Extract intents
  const intents = analyses
    .map((a) => ({ intent: a.intent.intent, confidence: a.intent.confidence }))
    .filter(
      (intent, index, self) =>
        index === self.findIndex((i) => i.intent === intent.intent),
    );

  const insights: string[] = [];
  if (overallSentiment === "negative") {
    insights.push("Vendor communication shows negative sentiment");
  }
  if (commitmentLevel === "LOW") {
    insights.push("Vendor commitment level is low");
  }

  const recommendations: string[] = [];
  if (overallSentiment === "negative") {
    recommendations.push("Schedule vendor meeting to address concerns");
  }
  if (commitmentLevel === "LOW") {
    recommendations.push("Review vendor relationship and contract terms");
  }

  return {
    overallSentiment,
    commitmentLevel,
    intents,
    insights,
    recommendations,
  };
}

/**
 * Enhance vendor scoring with Arabic NLP
 */
export async function enhanceVendorScore(
  vendorId: string,
  tenantId: string,
  baseScore: number,
  communicationAnalysis: {
    overallSentiment: string;
    commitmentLevel: string;
  },
): Promise<{
  enhancedScore: number;
  adjustments: Array<{ factor: string; adjustment: number }>;
  recommendations: string[];
}> {
  let enhancedScore = baseScore;
  const adjustments: Array<{ factor: string; adjustment: number }> = [];

  // Adjust based on sentiment
  if (communicationAnalysis.overallSentiment === "positive") {
    enhancedScore += 5;
    adjustments.push({ factor: "Positive communication", adjustment: 5 });
  } else if (communicationAnalysis.overallSentiment === "negative") {
    enhancedScore -= 10;
    adjustments.push({ factor: "Negative communication", adjustment: -10 });
  }

  // Adjust based on commitment
  if (communicationAnalysis.commitmentLevel === "HIGH") {
    enhancedScore += 5;
    adjustments.push({ factor: "High commitment", adjustment: 5 });
  } else if (communicationAnalysis.commitmentLevel === "LOW") {
    enhancedScore -= 10;
    adjustments.push({ factor: "Low commitment", adjustment: -10 });
  }

  enhancedScore = Math.min(100, Math.max(0, enhancedScore));

  const recommendations: string[] = [];
  if (enhancedScore < 60) {
    recommendations.push("Review vendor performance and consider alternatives");
  }

  return {
    enhancedScore,
    adjustments,
    recommendations,
  };
}
