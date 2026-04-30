/**
 * Event Store utilities
 * Shared helper(s) for creating well-formed DomainEvents.
 */

import type { DomainEvent, EventMetadata } from "@/types/cqrs";

export function createEvent<TPayload = unknown>(
  type: string,
  aggregateId: string,
  aggregateType: string,
  payload: TPayload,
  version: number,
  metadata: Partial<EventMetadata> & { tenantId: string },
): DomainEvent<TPayload> {
  const now = new Date();
  return {
    id: `evt-${now.getTime()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    aggregateId,
    aggregateType,
    version,
    timestamp: now.toISOString(),
    payload,
    metadata: {
      tenantId: metadata.tenantId,
      userId: metadata.userId,
      correlationId: metadata.correlationId,
      causationId: metadata.causationId,
      source: metadata.source,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      // keep any extra metadata fields without losing type safety at runtime
      ...(metadata as Record<string, unknown>),
    } as EventMetadata,
  };
}
