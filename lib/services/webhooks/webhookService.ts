/**
 * Webhook Service
 * Handles webhook registration, delivery, and retry logic
 */

import { Webhook, WebhookEvent } from "@/types/userManagement";

// Crypto utilities (works in both Node.js and browser)
function getCrypto(): any {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  if (typeof require !== "undefined") {
    return require("crypto");
  }
  throw new Error("Crypto not available");
}

function createHmac(algorithm: string, secret: string): any {
  const crypto = getCrypto();
  if (crypto.createHmac) {
    return crypto.createHmac(algorithm, secret);
  }
  // Browser fallback (would need Web Crypto API implementation)
  throw new Error("HMAC not available in browser context");
}

function randomUUID(): string {
  const crypto = getCrypto();
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomBytes(length: number): Buffer | Uint8Array {
  const crypto = getCrypto();
  if (crypto.randomBytes) {
    return crypto.randomBytes(length);
  }
  if (crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(length));
  }
  throw new Error("Random bytes not available");
}

function timingSafeEqual(
  a: Buffer | Uint8Array,
  b: Buffer | Uint8Array,
): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a[i] as number) ^ (b[i] as number);
  }
  return result === 0;
}

export interface WebhookPayload {
  event: WebhookEvent;
  data: any;
  timestamp: string;
  id: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  status: "PENDING" | "SUCCESS" | "FAILED";
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  deliveredAt?: Date;
  createdAt: Date;
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  const sigBuf =
    typeof Buffer !== "undefined"
      ? Buffer.from(signature)
      : new TextEncoder().encode(signature);
  const expectedBuf =
    typeof Buffer !== "undefined"
      ? Buffer.from(expectedSignature)
      : new TextEncoder().encode(expectedSignature);
  return timingSafeEqual(sigBuf, expectedBuf);
}

/**
 * Create webhook payload
 */
export function createWebhookPayload(
  event: WebhookEvent,
  data: any,
): WebhookPayload {
  return {
    event,
    data,
    timestamp: new Date().toISOString(),
    id: randomUUID(),
  };
}

/**
 * Deliver webhook (with retry logic)
 */
export async function deliverWebhook(
  webhook: Webhook,
  payload: WebhookPayload,
): Promise<WebhookDelivery> {
  const delivery: WebhookDelivery = {
    id: randomUUID(),
    webhookId: webhook.id,
    event: payload.event,
    payload,
    status: "PENDING",
    attempts: 0,
    createdAt: new Date(),
  };

  const payloadString = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadString, webhook.secret);

  const maxAttempts = webhook.retryPolicy.maxRetries + 1;
  let delay = webhook.retryPolicy.retryDelay * 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    delivery.attempts = attempt;
    delivery.lastAttemptAt = new Date();

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": payload.event,
          "X-Webhook-Signature": signature,
          "X-Webhook-Timestamp": payload.timestamp,
          "X-Webhook-Id": payload.id,
          "User-Agent": "Hazalyze-Webhooks/1.0",
        },
        body: payloadString,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      delivery.responseCode = response.status;
      delivery.responseBody = await response.text().catch(() => "");

      if (response.ok) {
        delivery.status = "SUCCESS";
        delivery.deliveredAt = new Date();

        // Update webhook statistics (in production, update database)
        // await updateWebhookStats(webhook.id, true)

        return delivery;
      } else {
        // Non-2xx response, retry if not last attempt
        if (attempt < maxAttempts) {
          delivery.nextRetryAt = new Date(Date.now() + delay);
          delay *= webhook.retryPolicy.backoffMultiplier;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        delivery.status = "FAILED";
        delivery.error = `HTTP ${response.status}: ${delivery.responseBody}`;
      }
    } catch (error) {
      delivery.error = error instanceof Error ? error.message : "Unknown error";

      if (attempt < maxAttempts) {
        delivery.nextRetryAt = new Date(Date.now() + delay);
        delay *= webhook.retryPolicy.backoffMultiplier;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      delivery.status = "FAILED";
    }
  }

  // Update webhook statistics (in production, update database)
  // await updateWebhookStats(webhook.id, false)

  // Mark webhook as failing if too many failures
  // if (webhook.failedDeliveries > 10) {
  //   await updateWebhookStatus(webhook.id, 'FAILING')
  // }

  return delivery;
}

/**
 * Trigger webhook for event
 */
export async function triggerWebhook(
  webhook: Webhook,
  event: WebhookEvent,
  data: any,
): Promise<WebhookDelivery | null> {
  // Check if webhook subscribes to this event
  if (!webhook.events.includes(event)) {
    return null;
  }

  // Check if webhook is active
  if (webhook.status !== "ACTIVE") {
    return null;
  }

  // Create payload
  const payload = createWebhookPayload(event, data);

  // Deliver webhook
  return await deliverWebhook(webhook, payload);
}

/**
 * Trigger webhooks for all subscribers of an event
 */
export async function triggerWebhooksForEvent(
  webhooks: Webhook[],
  event: WebhookEvent,
  data: any,
): Promise<WebhookDelivery[]> {
  const deliveries: WebhookDelivery[] = [];

  // Filter webhooks that subscribe to this event
  const subscribers = webhooks.filter(
    (wh) => wh.events.includes(event) && wh.status === "ACTIVE",
  );

  // Deliver to all subscribers (in parallel)
  const promises = subscribers.map((webhook) =>
    triggerWebhook(webhook, event, data),
  );

  const results = await Promise.allSettled(promises);

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      deliveries.push(result.value);
    } else if (result.status === "rejected") {
      console.error(
        `Webhook delivery failed for ${subscribers[index].id}:`,
        result.reason,
      );
    }
  });

  return deliveries;
}

/**
 * Validate webhook URL
 */
export function validateWebhookURL(url: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS in production
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "Webhook URL must use HTTPS in production",
      };
    }

    // Check for localhost/private IPs in production
    if (process.env.NODE_ENV === "production") {
      const hostname = parsed.hostname;
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.")
      ) {
        return {
          valid: false,
          error: "Webhook URL cannot be a private IP address in production",
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Invalid URL format",
    };
  }
}
