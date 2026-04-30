/**
 * Email Service Event Bus Integration
 *
 * Listens to email.send events from any module and handles them
 * Publishes email status events for other modules to consume
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type {
  EmailMessage,
  EmailSendEvent,
  EmailStatusEvent,
  EmailStatusUpdate,
} from "../types";
import { emailService } from "../emailService";

/**
 * Initialize email event integration
 * Subscribes to email.send events and handles them
 * Only runs on server side (email service uses Node.js modules)
 */
export function initializeEmailEventIntegration(): void {
  // Only initialize on server side
  if (typeof window !== "undefined") {
    return;
  }

  console.log("📧 Initializing Email Service Event Integration...");

  // Subscribe to email.send events from any module
  eventBus.subscribe("email.send", async (event: DomainEvent) => {
    try {
      const emailMessage = event.payload as EmailMessage;

      // Validate required fields
      if (!emailMessage.tenantId || !emailMessage.to || !emailMessage.subject) {
        console.error("Invalid email message:", emailMessage);
        return;
      }

      // Send email via email service
      const result = await emailService.sendEmail(emailMessage);

      // Publish email status event
      await eventBus.publish({
        type: "email.status",
        payload: {
          messageId: result.messageId || emailMessage.id || "unknown",
          status: result.success ? "sent" : "failed",
          timestamp: new Date(),
          details: result,
          provider: result.provider,
        } as EmailStatusUpdate,
        timestamp: new Date(),
        source: "email-service",
      });

      if (result.success) {
        console.log(`✅ Email sent successfully: ${result.messageId}`);
      } else {
        console.error(`❌ Email send failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error handling email.send event:", error);

      // Publish failure event
      await eventBus.publish({
        type: "email.status",
        payload: {
          messageId: (event.payload as EmailMessage).id || "unknown",
          status: "failed",
          timestamp: new Date(),
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        } as EmailStatusUpdate,
        timestamp: new Date(),
        source: "email-service",
      });
    }
  });

  // Subscribe to module-specific email events (for backward compatibility)
  // Modules can publish events like: wms.email.send, tms.email.send, etc.
  const moduleEmailPatterns = [
    "wms.email.send",
    "tms.email.send",
    "msds.email.send",
    "qhse.email.send",
    "compliance.email.send",
    "proposals.email.send",
    "finance.email.send",
    "hr.email.send",
    "facility.email.send",
    "marketplace.email.send",
    "procurement.email.send",
    "asn.email.send",
    "hazalyze.email.send",
  ];

  moduleEmailPatterns.forEach((pattern) => {
    eventBus.subscribe(pattern, async (event: DomainEvent) => {
      try {
        // Extract module ID from event type
        const moduleId = pattern.split(".")[0];

        const emailMessage = {
          ...(event.payload as EmailMessage),
          moduleId: moduleId,
        } as EmailMessage;

        // Publish as generic email.send event
        await eventBus.publish({
          type: "email.send",
          payload: emailMessage,
          timestamp: new Date(),
          source: moduleId,
        });
      } catch (error) {
        console.error(`Error handling ${pattern} event:`, error);
      }
    });
  });

  console.log("✅ Email Service Event Integration initialized");
}

/**
 * Helper function for modules to send emails via event bus
 */
export async function sendEmailViaEvent(
  message: EmailMessage,
  moduleId: string,
): Promise<void> {
  await eventBus.publish({
    type: "email.send",
    payload: {
      ...message,
      moduleId,
    },
    timestamp: new Date(),
    source: moduleId,
  });
}
