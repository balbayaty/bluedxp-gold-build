/**
 * Signal Analyzer Service
 *
 * Extracts and analyzes behavioral signals from shipment data
 * Integrates with Event Store, Knowledge Base, and Arabic NLP
 *
 * @module cargo-psychology
 */

import { eventStore } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type { Shipment } from "@/types/tms";
import type {
  SignalValues,
  SignalAnalysis,
  BehavioralSignalType,
  BEHAVIORAL_SIGNALS,
  CustomerInfo,
  PaymentInfo,
  CommunicationRecord,
  DocumentStatus,
  MessageSentimentValue,
} from "./types";

// ============================================================================
// SIGNAL ANALYZER
// ============================================================================

export class SignalAnalyzer {
  /**
   * Extract all behavioral signals from shipment data
   */
  async extractSignals(
    shipment: Shipment,
    customerId?: string,
    customerInfo?: CustomerInfo,
  ): Promise<SignalValues> {
    const signals: SignalValues = {};

    // Extract each signal
    signals["Payment Timing"] = await this.extractPaymentTiming(
      shipment.id,
      shipment.bookingDate,
    );
    signals["Communication Responsiveness"] =
      await this.extractCommunicationResponsiveness(shipment.id, customerId);
    signals["Documentation Completeness"] =
      await this.extractDocumentationCompleteness(shipment);
    signals["Booking Lead Time"] = await this.extractBookingLeadTime(shipment);
    signals["Historical Reliability"] = await this.extractHistoricalReliability(
      customerId,
      customerInfo,
    );
    signals["Price Sensitivity"] = await this.extractPriceSensitivity(
      shipment.id,
      customerId,
    );
    signals["Cargo Readiness"] = await this.extractCargoReadiness(
      shipment.id,
      customerId,
    );
    signals["Relationship Depth"] = await this.extractRelationshipDepth(
      customerId,
      customerInfo,
    );
    signals["Message Sentiment"] = await this.extractMessageSentiment(
      shipment.id,
      customerId,
    );

    return signals;
  }

  /**
   * Analyze individual signal
   */
  async analyzeSignal(
    signalType: BehavioralSignalType,
    value: string,
    shipmentId: string,
  ): Promise<SignalAnalysis> {
    const signalDef = BEHAVIORAL_SIGNALS.find((s) => s.signal === signalType);
    if (!signalDef) {
      throw new Error(`Unknown signal type: ${signalType}`);
    }

    const riskScore = signalDef.riskMapping[value] || 0.5;
    const weightedRisk = riskScore * signalDef.weight;

    // Get evidence from Event Store and Knowledge Base
    const evidence = await this.getSignalEvidence(signalType, shipmentId);

    return {
      signal: signalType,
      value,
      riskScore,
      weight: signalDef.weight,
      weightedRisk,
      confidence: this.calculateSignalConfidence(signalType, value, evidence),
      evidence,
      timestamp: new Date(),
    };
  }

  // ============================================================================
  // SIGNAL EXTRACTION METHODS
  // ============================================================================

  /**
   * Extract Payment Timing signal
   */
  private async extractPaymentTiming(
    shipmentId: string,
    bookingDate?: Date | string,
  ): Promise<"within_24h" | "within_week" | "after_week" | "no_payment"> {
    if (!bookingDate) {
      return "no_payment";
    }

    // Try to get payment info from Event Store
    try {
      const events = await eventStore.getEventsByType("PaymentReceived", 0, 10);
      const paymentEvent = events.find(
        (e) => e.payload?.shipmentId === shipmentId,
      );

      if (!paymentEvent) {
        return "no_payment";
      }

      const booking = new Date(bookingDate);
      const payment = new Date(paymentEvent.timestamp);
      const hoursDiff =
        (payment.getTime() - booking.getTime()) / (1000 * 60 * 60);

      if (hoursDiff <= 24) {
        return "within_24h";
      } else if (hoursDiff <= 168) {
        // 7 days
        return "within_week";
      } else {
        return "after_week";
      }
    } catch (error) {
      console.warn("Error extracting payment timing:", error);
      return "no_payment";
    }
  }

  /**
   * Extract Communication Responsiveness signal
   */
  private async extractCommunicationResponsiveness(
    shipmentId: string,
    customerId?: string,
  ): Promise<"within_1h" | "within_day" | "within_3days" | "no_response"> {
    // Try to get communication records from Event Store
    try {
      const events = await eventStore.getEventsByType("MessageSent", 0, 50);
      const shipmentEvents = events.filter(
        (e) =>
          e.payload?.shipmentId === shipmentId ||
          e.payload?.customerId === customerId,
      );

      if (shipmentEvents.length === 0) {
        return "no_response";
      }

      // Calculate average response time
      let totalResponseTime = 0;
      let responseCount = 0;

      for (const event of shipmentEvents) {
        if (event.payload?.responseTime) {
          totalResponseTime += event.payload.responseTime;
          responseCount++;
        }
      }

      if (responseCount === 0) {
        return "no_response";
      }

      const avgResponseTimeHours =
        totalResponseTime / responseCount / (1000 * 60 * 60);

      if (avgResponseTimeHours <= 1) {
        return "within_1h";
      } else if (avgResponseTimeHours <= 24) {
        return "within_day";
      } else if (avgResponseTimeHours <= 72) {
        return "within_3days";
      } else {
        return "no_response";
      }
    } catch (error) {
      console.warn("Error extracting communication responsiveness:", error);
      return "no_response";
    }
  }

  /**
   * Extract Documentation Completeness signal
   */
  private extractDocumentationCompleteness(
    shipment: Shipment,
  ): "100%" | "75-99%" | "50-74%" | "below_50%" {
    const requiredDocs = [
      "commercial_invoice",
      "packing_list",
      "certificate_of_origin",
      "bill_of_lading",
    ];

    const submittedDocs = shipment.documents?.map((d) => d.type) || [];
    const completeness = submittedDocs.length / requiredDocs.length;

    if (completeness >= 1.0) {
      return "100%";
    } else if (completeness >= 0.75) {
      return "75-99%";
    } else if (completeness >= 0.5) {
      return "50-74%";
    } else {
      return "below_50%";
    }
  }

  /**
   * Extract Booking Lead Time signal
   */
  private extractBookingLeadTime(
    shipment: Shipment,
  ): "over_2weeks" | "1-2weeks" | "3-7days" | "under_3days" {
    if (!shipment.bookingDate || !shipment.pickupDate) {
      return "under_3days"; // Default to risky
    }

    const booking = new Date(shipment.bookingDate);
    const pickup = new Date(shipment.pickupDate);
    const daysDiff =
      (pickup.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff >= 14) {
      return "over_2weeks";
    } else if (daysDiff >= 7) {
      return "1-2weeks";
    } else if (daysDiff >= 3) {
      return "3-7days";
    } else {
      return "under_3days";
    }
  }

  /**
   * Extract Historical Reliability signal
   */
  private async extractHistoricalReliability(
    customerId: string | undefined,
    customerInfo?: CustomerInfo,
  ): Promise<"over_95%" | "80-95%" | "60-80%" | "below_60%" | "new_customer"> {
    if (!customerId) {
      return "new_customer";
    }

    // Use customer info if provided
    if (customerInfo?.historicalStats) {
      const stats = customerInfo.historicalStats;
      if (stats.totalShipments === 0) {
        return "new_customer";
      }

      const completionRate = stats.completedShipments / stats.totalShipments;
      const noShowRate = stats.noShowRate || 1 - completionRate;

      if (noShowRate <= 0.05) {
        return "over_95%";
      } else if (noShowRate <= 0.2) {
        return "80-95%";
      } else if (noShowRate <= 0.4) {
        return "60-80%";
      } else {
        return "below_60%";
      }
    }

    // Try to get from Event Store
    try {
      const events = await eventStore.getEventsByType(
        "ShipmentDelivered",
        0,
        100,
      );
      const customerEvents = events.filter(
        (e) => e.payload?.customerId === customerId,
      );

      if (customerEvents.length === 0) {
        return "new_customer";
      }

      const noShowEvents = customerEvents.filter(
        (e) => e.payload?.status === "NO_SHOW",
      );
      const noShowRate = noShowEvents.length / customerEvents.length;
      const completionRate = 1 - noShowRate;

      if (completionRate >= 0.95) {
        return "over_95%";
      } else if (completionRate >= 0.8) {
        return "80-95%";
      } else if (completionRate >= 0.6) {
        return "60-80%";
      } else {
        return "below_60%";
      }
    } catch (error) {
      console.warn("Error extracting historical reliability:", error);
      return "new_customer";
    }
  }

  /**
   * Extract Price Sensitivity signal
   */
  private async extractPriceSensitivity(
    shipmentId: string,
    customerId?: string,
  ): Promise<
    | "accepted_first"
    | "one_negotiation"
    | "multiple_negotiations"
    | "extreme_haggling"
  > {
    // Try to get negotiation events
    try {
      const events = await eventStore.getEventsByType("QuoteNegotiated", 0, 20);
      const negotiationEvents = events.filter(
        (e) =>
          e.payload?.shipmentId === shipmentId ||
          e.payload?.customerId === customerId,
      );

      const negotiationCount = negotiationEvents.length;

      if (negotiationCount === 0) {
        return "accepted_first";
      } else if (negotiationCount === 1) {
        return "one_negotiation";
      } else if (negotiationCount <= 3) {
        return "multiple_negotiations";
      } else {
        return "extreme_haggling";
      }
    } catch (error) {
      console.warn("Error extracting price sensitivity:", error);
      return "accepted_first"; // Default to positive
    }
  }

  /**
   * Extract Cargo Readiness signal
   */
  private async extractCargoReadiness(
    shipmentId: string,
    customerId?: string,
  ): Promise<
    "always_ready" | "mostly_ready" | "sometimes_ready" | "rarely_ready"
  > {
    // Try to get readiness events
    try {
      const events = await eventStore.getEventsByType(
        "CargoReadinessConfirmed",
        0,
        20,
      );
      const readinessEvents = events.filter(
        (e) =>
          e.payload?.shipmentId === shipmentId ||
          e.payload?.customerId === customerId,
      );

      if (readinessEvents.length === 0) {
        return "rarely_ready"; // No data = risky
      }

      // Check if readiness matches actual
      const onTimeCount = readinessEvents.filter((e) => {
        const reported = e.payload?.reportedReady;
        const actual = e.payload?.actualReady;
        return reported === actual;
      }).length;

      const accuracy = onTimeCount / readinessEvents.length;

      if (accuracy >= 0.9) {
        return "always_ready";
      } else if (accuracy >= 0.7) {
        return "mostly_ready";
      } else if (accuracy >= 0.5) {
        return "sometimes_ready";
      } else {
        return "rarely_ready";
      }
    } catch (error) {
      console.warn("Error extracting cargo readiness:", error);
      return "sometimes_ready"; // Default to moderate
    }
  }

  /**
   * Extract Relationship Depth signal
   */
  private async extractRelationshipDepth(
    customerId: string | undefined,
    customerInfo?: CustomerInfo,
  ): Promise<
    "strategic_partner" | "regular_customer" | "occasional" | "one_time"
  > {
    if (!customerId) {
      return "one_time";
    }

    // Use customer info if provided
    if (customerInfo?.historicalStats) {
      const stats = customerInfo.historicalStats;
      const totalShipments = stats.totalShipments || 0;
      const relationshipStart = stats.relationshipStartDate;

      if (totalShipments >= 50 && relationshipStart) {
        const years =
          (new Date().getTime() - new Date(relationshipStart).getTime()) /
          (1000 * 60 * 60 * 24 * 365);
        if (years >= 3) {
          return "strategic_partner";
        }
      }

      if (totalShipments >= 20) {
        return "regular_customer";
      } else if (totalShipments >= 5) {
        return "occasional";
      } else {
        return "one_time";
      }
    }

    // Try to get from Event Store
    try {
      const events = await eventStore.getEventsByType(
        "ShipmentCreated",
        0,
        100,
      );
      const customerEvents = events.filter(
        (e) => e.payload?.customerId === customerId,
      );
      const totalShipments = customerEvents.length;

      if (totalShipments >= 50) {
        return "strategic_partner";
      } else if (totalShipments >= 20) {
        return "regular_customer";
      } else if (totalShipments >= 5) {
        return "occasional";
      } else {
        return "one_time";
      }
    } catch (error) {
      console.warn("Error extracting relationship depth:", error);
      return "one_time";
    }
  }

  /**
   * Extract Message Sentiment signal (integrates with Arabic NLP)
   */
  private async extractMessageSentiment(
    shipmentId: string,
    customerId?: string,
  ): Promise<MessageSentimentValue> {
    // Try to get messages from Event Store
    try {
      const events = await eventStore.getEventsByType("MessageReceived", 0, 20);
      const shipmentMessages = events.filter(
        (e) =>
          e.payload?.shipmentId === shipmentId ||
          e.payload?.customerId === customerId,
      );

      if (shipmentMessages.length === 0) {
        return "neutral"; // No messages = neutral
      }

      // Try to get sentiment from Arabic NLP service
      try {
        const { arabicNLPService } =
          await import("@/lib/services/nlp/arabic-nlp");
        const lastMessage = shipmentMessages[shipmentMessages.length - 1];
        const messageText =
          lastMessage.payload?.message || lastMessage.payload?.messageAr || "";

        if (messageText) {
          const analysis = await arabicNLPService.analyzeSentiment(messageText);
          return this.mapSentimentToValue(analysis.commitmentLevel);
        }
      } catch (error) {
        console.warn("Error getting sentiment from Arabic NLP:", error);
      }

      // Fallback: Try to get sentiment from Knowledge Base
      try {
        const knowledge = await knowledgeBaseService.search({
          query: `shipment ${shipmentId} message sentiment analysis`,
          limit: 1,
        });
        if (knowledge.length > 0 && knowledge[0].entry.metadata?.sentiment) {
          const sentiment = knowledge[0].entry.metadata.sentiment;
          return this.mapSentimentToValue(sentiment);
        }
      } catch (error) {
        console.warn("Error getting sentiment from knowledge base:", error);
      }

      // Fallback: simple analysis
      const lastMessage = shipmentMessages[shipmentMessages.length - 1];
      const messageText =
        lastMessage.payload?.message || lastMessage.payload?.messageAr || "";
      return this.analyzeMessageSentimentSimple(messageText);
    } catch (error) {
      console.warn("Error extracting message sentiment:", error);
      return "neutral";
    }
  }

  /**
   * Map sentiment to MessageSentimentValue
   */
  private mapSentimentToValue(sentiment: any): MessageSentimentValue {
    if (typeof sentiment === "string") {
      if (
        sentiment.includes("highly_committed") ||
        sentiment.includes("very_positive")
      ) {
        return "highly_committed";
      } else if (
        sentiment.includes("committed") ||
        sentiment.includes("positive")
      ) {
        return "committed";
      } else if (
        sentiment.includes("uncertain") ||
        sentiment.includes("negative")
      ) {
        return sentiment.includes("highly") ? "highly_uncertain" : "uncertain";
      }
    }
    return "neutral";
  }

  /**
   * Simple message sentiment analysis (fallback)
   */
  private analyzeMessageSentimentSimple(
    message: string,
  ): MessageSentimentValue {
    const text = message.toLowerCase();

    // Check for commitment indicators
    if (
      text.includes("confirm") ||
      text.includes("yes") ||
      text.includes("نعم") ||
      text.includes("تمام")
    ) {
      return "committed";
    }

    // Check for uncertainty indicators
    if (text.includes("inshallah") || text.includes("إن شاء الله")) {
      // Count inshallah occurrences
      const inshallahCount = (text.match(/inshallah|إن شاء الله/g) || [])
        .length;
      if (inshallahCount >= 2) {
        return "highly_uncertain";
      } else {
        return "uncertain";
      }
    }

    // Check for negative indicators
    if (
      text.includes("no") ||
      text.includes("problem") ||
      text.includes("مشكلة") ||
      text.includes("لا")
    ) {
      return "uncertain";
    }

    return "neutral";
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get evidence for signal from Event Store and Knowledge Base
   */
  private async getSignalEvidence(
    signalType: BehavioralSignalType,
    shipmentId: string,
  ): Promise<string[]> {
    const evidence: string[] = [];

    try {
      // Get from Event Store
      const events = await eventStore.getEvents(shipmentId, 0, 50);
      const relevantEvents = events.filter((e) =>
        e.type
          .toLowerCase()
          .includes(signalType.toLowerCase().replace(" ", "")),
      );
      evidence.push(
        ...relevantEvents.map((e) => `${e.type} at ${e.timestamp}`),
      );
    } catch (error) {
      console.warn("Error getting evidence from event store:", error);
    }

    try {
      // Get from Knowledge Base
      const knowledge = await knowledgeBaseService.search({
        query: `shipment ${shipmentId} ${signalType}`,
        limit: 3,
      });
      evidence.push(
        ...knowledge.map(
          (k) => k.entry.summary || k.entry.content.substring(0, 50),
        ),
      );
    } catch (error) {
      console.warn("Error getting evidence from knowledge base:", error);
    }

    return evidence;
  }

  /**
   * Calculate signal confidence
   */
  private calculateSignalConfidence(
    signalType: BehavioralSignalType,
    value: string,
    evidence: string[],
  ): number {
    // Base confidence on evidence availability
    let confidence = 0.5; // Default

    if (evidence.length > 0) {
      confidence += 0.2; // Has evidence
    }

    if (evidence.length >= 3) {
      confidence += 0.2; // Multiple evidence sources
    }

    // Some signals are more reliable
    if (
      signalType === "Payment Timing" ||
      signalType === "Historical Reliability"
    ) {
      confidence += 0.1; // More reliable signals
    }

    return Math.min(1.0, confidence);
  }
}

// Export singleton instance
export const signalAnalyzer = new SignalAnalyzer();
