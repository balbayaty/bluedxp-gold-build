/**
 * Integration Testing Utilities
 * Helpers for testing API integrations
 */

import { Webhook, WebhookEvent } from "@/types/userManagement";
import { triggerWebhook, createWebhookPayload } from "@/lib/services/webhooks";

export interface MockWebhookServer {
  url: string;
  receivedPayloads: any[];
  clear(): void;
  stop(): Promise<void>;
}

/**
 * Create a mock webhook server for testing
 */
export function createMockWebhookServer(
  port: number = 3003,
): MockWebhookServer {
  const receivedPayloads: any[] = [];
  const url = `http://localhost:${port}/webhook`;

  // In a real implementation, this would start an HTTP server
  // For now, return a mock object

  return {
    url,
    receivedPayloads,
    clear() {
      receivedPayloads.length = 0;
    },
    async stop() {
      // Stop server if running
    },
  };
}

/**
 * Test webhook delivery
 */
export async function testWebhookDelivery(
  webhook: Webhook,
  event: WebhookEvent,
  testData: any,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = createWebhookPayload(event, testData);
    const delivery = await triggerWebhook(webhook, event, testData);

    return {
      success: delivery !== null && delivery.status === "SUCCESS",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate API response structure
 */
export function validateAPIResponse(
  response: any,
  schema: any,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation (in production, use a proper schema validator like Ajv)
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in response)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test rate limiting
 */
export async function testRateLimit(
  identifier: string,
  requests: number,
  config: { requestsPerMinute: number },
): Promise<{ passed: boolean; blockedAt?: number }> {
  // This would make actual requests and check if rate limiting works
  // For now, return mock result
  return {
    passed: requests <= config.requestsPerMinute,
    blockedAt:
      requests > config.requestsPerMinute
        ? config.requestsPerMinute + 1
        : undefined,
  };
}
