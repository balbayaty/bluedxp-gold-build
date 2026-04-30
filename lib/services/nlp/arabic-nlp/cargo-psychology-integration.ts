/**
 * Cargo Psychology Integration
 *
 * Integrates Arabic NLP with Cargo Psychology service
 * Provides sentiment analysis for psychology signals
 *
 * @module arabic-nlp
 */

import { arabicNLPService } from "./service";
import { cargoPsychologyService } from "@/lib/services/cargo-psychology";
import type { ArabicNLPAnalysis } from "./types";
import type { MessageSentimentValue } from "@/lib/services/cargo-psychology/types";

/**
 * Analyze message for cargo psychology
 */
export async function analyzeMessageForPsychology(
  text: string,
  shipmentId?: string,
  customerId?: string,
): Promise<{
  sentiment: MessageSentimentValue;
  analysis: ArabicNLPAnalysis;
  psychologyCompatible: boolean;
}> {
  // Analyze with Arabic NLP
  const analysis = await arabicNLPService.analyze(text, {
    includeSentiment: true,
    includeIntent: true,
    includeCulturalContext: true,
    includeInshallah: true,
    includeEntities: true,
    context: {
      shipmentId,
      customerId,
    },
  });

  // Map commitment level to MessageSentimentValue
  const sentiment: MessageSentimentValue = mapCommitmentToSentiment(
    analysis.commitmentLevel,
  );

  // Update psychology signal if shipment ID provided
  if (shipmentId) {
    try {
      await cargoPsychologyService.updateSignal(
        shipmentId,
        "Message Sentiment",
        sentiment,
      );
    } catch (error) {
      console.warn("Error updating psychology signal:", error);
    }
  }

  return {
    sentiment,
    analysis,
    psychologyCompatible: true,
  };
}

/**
 * Map commitment level to MessageSentimentValue
 */
function mapCommitmentToSentiment(
  commitmentLevel: string,
): MessageSentimentValue {
  switch (commitmentLevel) {
    case "highly_committed":
      return "highly_committed";
    case "committed":
      return "committed";
    case "uncertain":
      return "uncertain";
    case "highly_uncertain":
      return "highly_uncertain";
    default:
      return "neutral";
  }
}

/**
 * Get psychology-compatible analysis
 */
export async function getPsychologyCompatibleAnalysis(
  text: string,
  shipmentId?: string,
): Promise<ArabicNLPAnalysis> {
  return arabicNLPService.analyze(text, {
    includeSentiment: true,
    includeIntent: true,
    includeCulturalContext: true,
    includeInshallah: true,
    context: {
      shipmentId,
    },
  });
}
