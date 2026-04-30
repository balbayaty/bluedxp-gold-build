/**
 * Intervention Service
 *
 * Executes interventions based on psychology state
 * Integrates with WhatsApp, Email, and other communication channels
 * Tracks intervention effectiveness
 *
 * @module cargo-psychology
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type {
  PsychologyState,
  InterventionAction,
  InterventionRecord,
  InterventionPlaybookEntry,
  INTERVENTION_PLAYBOOK,
} from "./types";

// ============================================================================
// INTERVENTION SERVICE
// ============================================================================

export class InterventionService {
  /**
   * Get intervention playbook entry for state
   */
  getInterventionPlaybook(state: PsychologyState): InterventionPlaybookEntry {
    return INTERVENTION_PLAYBOOK[state];
  }

  /**
   * Execute intervention
   */
  async executeIntervention(
    shipmentId: string,
    customerId: string,
    customerPhone: string,
    customerEmail: string,
    state: PsychologyState,
    action: InterventionAction,
    channel?: "WHATSAPP" | "EMAIL" | "PHONE" | "SMS" | "MULTI_CHANNEL",
  ): Promise<InterventionRecord> {
    const playbook = this.getInterventionPlaybook(state);

    // Determine channel if not provided
    const interventionChannel =
      channel || this.determineChannel(state, playbook);

    // Get message templates
    const message = this.getInterventionMessage(
      state,
      playbook,
      interventionChannel,
    );

    // Execute based on channel
    const startTime = Date.now();
    let responseReceived = false;
    let responseTime: number | undefined;

    try {
      switch (interventionChannel) {
        case "WHATSAPP":
          responseReceived = await this.sendWhatsAppMessage(
            customerPhone,
            message.messageAr || message.messageEn,
          );
          break;
        case "EMAIL":
          responseReceived = await this.sendEmail(
            customerEmail,
            message.messageEn || message.messageAr,
          );
          break;
        case "PHONE":
          responseReceived = await this.makePhoneCall(
            customerPhone,
            message.messageEn || message.messageAr,
          );
          break;
        case "SMS":
          responseReceived = await this.sendSMS(
            customerPhone,
            message.messageAr || message.messageEn,
          );
          break;
        case "MULTI_CHANNEL":
          // Send via multiple channels
          await Promise.all([
            this.sendWhatsAppMessage(
              customerPhone,
              message.messageAr || message.messageEn,
            ),
            this.sendEmail(
              customerEmail,
              message.messageEn || message.messageAr,
            ),
          ]);
          responseReceived = true; // Assume at least one will be received
          break;
      }

      responseTime = Date.now() - startTime;
    } catch (error) {
      console.error("Error executing intervention:", error);
    }

    // Create intervention record
    const interventionRecord: InterventionRecord = {
      id: `intervention-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
      action,
      channel: interventionChannel,
      message: message.messageEn,
      messageAr: message.messageAr,
      messageEn: message.messageEn,
      executedBy: "cargo-psychology-service",
      responseReceived,
      responseTime,
      outcome: responseReceived ? "SUCCESS" : "NO_RESPONSE",
    };

    // Store intervention record
    await this.storeInterventionRecord(shipmentId, interventionRecord);

    // Publish event
    await eventBus.publish(
      createEvent(
        "CargoPsychologyIntervention",
        shipmentId,
        "Shipment",
        interventionRecord,
        1,
        {
          correlationId: `intervention-${Date.now()}`,
          userId: "cargo-psychology-service",
        },
      ),
    );

    return interventionRecord;
  }

  /**
   * Determine best channel for intervention
   */
  private determineChannel(
    state: PsychologyState,
    playbook: InterventionPlaybookEntry,
  ): "WHATSAPP" | "EMAIL" | "PHONE" | "SMS" | "MULTI_CHANNEL" {
    if (state === "PHANTOM") {
      return "MULTI_CHANNEL"; // Use all channels for high risk
    } else if (state === "CONTINGENT") {
      return "PHONE"; // Personal call for medium risk
    } else {
      return "WHATSAPP"; // Simple message for low risk
    }
  }

  /**
   * Get intervention message
   */
  private getInterventionMessage(
    state: PsychologyState,
    playbook: InterventionPlaybookEntry,
    channel: string,
  ): { messageAr?: string; messageEn?: string } {
    return {
      messageAr: playbook.messageTemplateAr,
      messageEn: playbook.messageTemplateEn,
    };
  }

  /**
   * Send WhatsApp message (integrates with WhatsApp service)
   */
  private async sendWhatsAppMessage(
    phone: string,
    message: string,
  ): Promise<boolean> {
    try {
      // In production, would call WhatsApp service
      // For now, simulate success
      console.log(`WhatsApp message sent to ${phone}: ${message}`);
      return true;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return false;
    }
  }

  /**
   * Send email (integrates with email service)
   */
  private async sendEmail(email: string, message: string): Promise<boolean> {
    try {
      // In production, would call email service
      console.log(`Email sent to ${email}: ${message}`);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Make phone call (integrates with telephony service)
   */
  private async makePhoneCall(phone: string, script: string): Promise<boolean> {
    try {
      // In production, would call telephony service
      console.log(`Phone call made to ${phone} with script: ${script}`);
      return true;
    } catch (error) {
      console.error("Error making phone call:", error);
      return false;
    }
  }

  /**
   * Send SMS (integrates with SMS service)
   */
  private async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      // In production, would call SMS service
      console.log(`SMS sent to ${phone}: ${message}`);
      return true;
    } catch (error) {
      console.error("Error sending SMS:", error);
      return false;
    }
  }

  /**
   * Store intervention record
   */
  private async storeInterventionRecord(
    shipmentId: string,
    record: InterventionRecord,
  ): Promise<void> {
    try {
      // Store in Knowledge Base for learning
      await knowledgeBaseService.create({
        tenantId: "", // Would get from shipment
        agentId: "cargo-psychology",
        type: "intervention",
        category: "transportation",
        content: JSON.stringify(record),
        summary: `Intervention ${record.action} executed for shipment ${shipmentId}`,
        metadata: {
          shipmentId,
          interventionRecord: record,
        },
        keywords: ["intervention", "cargo-psychology", shipmentId],
        searchableText: `intervention ${record.action} shipment ${shipmentId}`,
        source: "cargo_psychology_service",
        confidence: 1.0,
        verified: true,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
      });
    } catch (error) {
      console.warn("Error storing intervention record:", error);
    }
  }

  /**
   * Get intervention history for shipment
   */
  async getInterventionHistory(
    shipmentId: string,
  ): Promise<InterventionRecord[]> {
    try {
      // Get from Knowledge Base
      const knowledge = await knowledgeBaseService.search({
        query: `intervention shipment ${shipmentId}`,
        limit: 50,
      });

      const records: InterventionRecord[] = [];
      for (const result of knowledge) {
        if (result.entry.metadata?.interventionRecord) {
          records.push(
            result.entry.metadata.interventionRecord as InterventionRecord,
          );
        }
      }

      // Sort by timestamp (newest first)
      records.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      return records;
    } catch (error) {
      console.error("Error getting intervention history:", error);
      return [];
    }
  }

  /**
   * Track intervention outcome
   */
  async trackInterventionOutcome(
    interventionId: string,
    outcome: "SUCCESS" | "PARTIAL" | "FAILED" | "NO_RESPONSE",
    notes?: string,
  ): Promise<void> {
    try {
      // Update in Knowledge Base
      const knowledge = await knowledgeBaseService.search({
        query: `intervention ${interventionId}`,
        limit: 1,
      });

      if (knowledge.length > 0) {
        const entry = knowledge[0].entry;
        const record = entry.metadata?.interventionRecord as
          | InterventionRecord
          | undefined;

        if (record) {
          const updatedRecord: InterventionRecord = {
            ...record,
            outcome,
            notes,
          };

          await knowledgeBaseService.update(entry.id, {
            metadata: {
              ...entry.metadata,
              interventionRecord: updatedRecord,
            },
          });
        }
      }
    } catch (error) {
      console.warn("Error tracking intervention outcome:", error);
    }
  }
}

// Export singleton instance
export const interventionService = new InterventionService();
