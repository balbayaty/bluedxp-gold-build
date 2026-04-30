/**
 * Unified Event Bus (in-app)
 *
 * IMPORTANT:
 * - Inside the Next.js app (client/server), we use the in-process CQRS Event Bus from `lib/services/event-store`.
 * - The old Express/RabbitMQ bus has been moved to `lib/services/event-bus/server.ts` and must be started explicitly.
 *
 * This prevents “ghost subscriptions” where modules publish/subscribe on different buses and KPIs/automation appear empty.
 */

export { eventBus, eventStore, createEvent } from "@/lib/services/event-store";
