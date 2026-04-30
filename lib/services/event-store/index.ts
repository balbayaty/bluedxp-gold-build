/**
 * Event Store Implementation
 * Append-only event log with subscriptions and snapshots
 * Foundation for CQRS and Event Sourcing
 */

import {
  DomainEvent,
  EventMetadata,
  EventStore,
  EventFilter,
  Subscription,
  AggregateSnapshot,
  EventHandler,
  CommandBus,
  Command,
  CommandResult,
  CommandHandler,
  CommandContext,
  CommandMetadata,
  QueryBus,
  Query,
  QueryResult,
  QueryHandler,
  QueryContext,
  QueryMetadata,
  EventBus,
  ReadModel,
  ReadModelQuery,
  ProjectionStore,
  Projection,
} from "@/types/cqrs";

import { prisma } from "@/lib/services/database/prismaClient";

// ============================================================================
// STORE BACKENDS
// ============================================================================

class InMemoryEventStore {
  private events: DomainEvent[] = [];
  private snapshots: Map<string, AggregateSnapshot> = new Map();
  private subscriptions: Map<
    string,
    { handler: EventHandler<any>; filter?: EventFilter }
  > = new Map();
  private position: number = 0;

  append(events: DomainEvent[]): void {
    for (const event of events) {
      this.position++;
      this.events.push(event);

      // Notify subscribers
      for (const [, sub] of this.subscriptions) {
        if (this.matchesFilter(event, sub.filter)) {
          sub
            .handler(event, {} as any)
            .catch((err) => console.error("Event handler error:", err));
        }
      }
    }
  }

  getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number,
  ): DomainEvent[] {
    return this.events.filter((e) => {
      if (e.aggregateId !== aggregateId) return false;
      if (fromVersion !== undefined && e.version < fromVersion) return false;
      if (toVersion !== undefined && e.version > toVersion) return false;
      return true;
    });
  }

  getAllEvents(fromPosition?: number, limit?: number): DomainEvent[] {
    let events = this.events;
    if (fromPosition !== undefined) {
      events = events.slice(fromPosition);
    }
    if (limit !== undefined) {
      events = events.slice(0, limit);
    }
    return events;
  }

  getEventsByType(
    eventType: string,
    fromPosition?: number,
    limit?: number,
  ): DomainEvent[] {
    let events = this.events.filter((e) => e.type === eventType);
    if (fromPosition !== undefined) {
      events = events.slice(fromPosition);
    }
    if (limit !== undefined) {
      events = events.slice(0, limit);
    }
    return events;
  }

  subscribe(handler: EventHandler<any>, filter?: EventFilter): string {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.subscriptions.set(id, { handler, filter });
    return id;
  }

  unsubscribe(id: string): void {
    this.subscriptions.delete(id);
  }

  saveSnapshot(aggregateId: string, snapshot: AggregateSnapshot): void {
    this.snapshots.set(aggregateId, snapshot);
  }

  getSnapshot(aggregateId: string): AggregateSnapshot | undefined {
    return this.snapshots.get(aggregateId);
  }

  getPosition(): number {
    return this.position;
  }

  private matchesFilter(event: DomainEvent, filter?: EventFilter): boolean {
    if (!filter) return true;

    if (filter.eventTypes?.length && !filter.eventTypes.includes(event.type)) {
      return false;
    }
    if (
      filter.aggregateTypes?.length &&
      !filter.aggregateTypes.includes(event.aggregateType)
    ) {
      return false;
    }
    if (
      filter.tenantIds?.length &&
      !filter.tenantIds.includes(event.metadata.tenantId || "")
    ) {
      return false;
    }
    if (
      filter.fromTimestamp &&
      new Date(event.timestamp) < new Date(filter.fromTimestamp)
    ) {
      return false;
    }

    return true;
  }
}

/**
 * Prisma-backed store (PostgreSQL)
 * Uses Prisma models: Event, Snapshot (see prisma/schema.prisma)
 *
 * Notes:
 * - Subscriptions remain in-process (handlers run in this node instance)
 * - Durability: events/snapshots are persisted in Postgres
 */
class PrismaEventStoreBackend {
  private subscriptions: Map<
    string,
    { handler: EventHandler<any>; filter?: EventFilter }
  > = new Map();

  async append(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Persist first (durable), then notify local subscribers.
    await prisma.event.createMany({
      data: events.map((e) => ({
        id: e.id,
        aggregateId: e.aggregateId,
        aggregateType: e.aggregateType,
        eventType: e.type,
        version: e.version,
        payload: e.payload as any,
        metadata: e.metadata as any,
        timestamp: new Date(e.timestamp),
        tenantId: e.metadata?.tenantId || null,
      })),
      skipDuplicates: true,
    });

    for (const event of events) {
      for (const [, sub] of this.subscriptions) {
        if (this.matchesFilter(event, sub.filter)) {
          sub
            .handler(event, {} as any)
            .catch((err) => console.error("Event handler error:", err));
        }
      }
    }
  }

  async getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<DomainEvent[]> {
    const where: any = { aggregateId };
    if (fromVersion !== undefined || toVersion !== undefined) {
      where.version = {};
      if (fromVersion !== undefined) where.version.gte = fromVersion;
      if (toVersion !== undefined) where.version.lte = toVersion;
    }

    const rows = await prisma.event.findMany({
      where,
      orderBy: [{ version: "asc" }],
    });

    return rows.map((r: any) => ({
      id: r.id,
      type: r.eventType,
      aggregateId: r.aggregateId,
      aggregateType: r.aggregateType,
      version: r.version,
      payload: r.payload as any,
      metadata: (r.metadata as any) || {},
      timestamp: r.timestamp.toISOString(),
    }));
  }

  async getAllEvents(
    fromPosition?: number,
    limit?: number,
  ): Promise<DomainEvent[]> {
    // This backend doesn't track a stable "position" column; use created order by timestamp+id.
    // fromPosition maps to offset.
    const rows = await prisma.event.findMany({
      orderBy: [{ timestamp: "asc" }, { id: "asc" }],
      skip: fromPosition || 0,
      take: limit,
    });
    return rows.map((r: any) => ({
      id: r.id,
      type: r.eventType,
      aggregateId: r.aggregateId,
      aggregateType: r.aggregateType,
      version: r.version,
      payload: r.payload as any,
      metadata: (r.metadata as any) || {},
      timestamp: r.timestamp.toISOString(),
    }));
  }

  async getEventsByType(
    eventType: string,
    fromPosition?: number,
    limit?: number,
  ): Promise<DomainEvent[]> {
    const rows = await prisma.event.findMany({
      where: { eventType },
      orderBy: [{ timestamp: "asc" }, { id: "asc" }],
      skip: fromPosition || 0,
      take: limit,
    });
    return rows.map((r: any) => ({
      id: r.id,
      type: r.eventType,
      aggregateId: r.aggregateId,
      aggregateType: r.aggregateType,
      version: r.version,
      payload: r.payload as any,
      metadata: (r.metadata as any) || {},
      timestamp: r.timestamp.toISOString(),
    }));
  }

  subscribe(handler: EventHandler<any>, filter?: EventFilter): string {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.subscriptions.set(id, { handler, filter });
    return id;
  }

  unsubscribe(id: string): void {
    this.subscriptions.delete(id);
  }

  async saveSnapshot(
    aggregateId: string,
    snapshot: AggregateSnapshot,
  ): Promise<void> {
    const stableId = `${snapshot.aggregateType}:${aggregateId}`;
    await prisma.snapshot.upsert({
      where: { id: stableId },
      create: {
        id: stableId,
        aggregateId,
        aggregateType: snapshot.aggregateType,
        version: snapshot.version,
        state: snapshot.state as any,
        timestamp: new Date(snapshot.timestamp),
        tenantId: snapshot.metadata?.tenantId || null,
      },
      update: {
        version: snapshot.version,
        state: snapshot.state as any,
        timestamp: new Date(snapshot.timestamp),
        tenantId: snapshot.metadata?.tenantId || null,
      },
    });
  }

  async getSnapshot(
    aggregateId: string,
  ): Promise<AggregateSnapshot | undefined> {
    // We don't know aggregateType, so search by aggregateId and take the latest timestamp.
    const row = await prisma.snapshot.findFirst({
      where: { aggregateId },
      orderBy: [{ timestamp: "desc" }],
    });
    if (!row) return undefined;
    return {
      aggregateId: row.aggregateId,
      aggregateType: row.aggregateType,
      version: row.version,
      state: row.state as any,
      timestamp: row.timestamp.toISOString(),
      metadata: row.tenantId
        ? ({ tenantId: row.tenantId } as any)
        : ({} as any),
    };
  }

  async getPosition(): Promise<number> {
    return prisma.event.count();
  }

  private matchesFilter(event: DomainEvent, filter?: EventFilter): boolean {
    if (!filter) return true;
    if (filter.eventTypes?.length && !filter.eventTypes.includes(event.type))
      return false;
    if (
      filter.aggregateTypes?.length &&
      !filter.aggregateTypes.includes(event.aggregateType)
    )
      return false;
    if (
      filter.tenantIds?.length &&
      !filter.tenantIds.includes(event.metadata.tenantId || "")
    )
      return false;
    if (
      filter.fromTimestamp &&
      new Date(event.timestamp) < new Date(filter.fromTimestamp)
    )
      return false;
    return true;
  }
}

type BackendKind = "memory" | "prisma";

function resolveBackendKind(): BackendKind {
  const v = (process.env.EVENT_STORE_BACKEND || "").trim().toLowerCase();
  if (v === "prisma") return "prisma";
  // Sensible default: if the app is configured for Postgres (Prisma schema requires DATABASE_URL),
  // use durable event storage by default. This enables Activity Timeline + auditability in dev
  // without forcing users to discover EVENT_STORE_BACKEND.
  const dbUrl = (process.env.DATABASE_URL || "").trim();
  if (dbUrl.length > 0) return "prisma";
  return "memory";
}

const backendKind: BackendKind = resolveBackendKind();
const inMemoryBackend = new InMemoryEventStore();
const prismaBackend = new PrismaEventStoreBackend();

// ============================================================================
// EVENT STORE SERVICE
// ============================================================================

class EventStoreService implements EventStore {
  async append(events: DomainEvent[], expectedVersion?: number): Promise<void> {
    if (expectedVersion !== undefined && events.length > 0) {
      const aggregateId = events[0].aggregateId;
      const existing =
        backendKind === "prisma"
          ? await prismaBackend.getEvents(aggregateId)
          : inMemoryBackend.getEvents(aggregateId);
      const currentVersion =
        existing.length > 0 ? existing[existing.length - 1].version : 0;

      if (currentVersion !== expectedVersion) {
        throw new Error(
          `Concurrency conflict: expected version ${expectedVersion}, but got ${currentVersion}`,
        );
      }
    }

    if (backendKind === "prisma") {
      await prismaBackend.append(events);
    } else {
      inMemoryBackend.append(events);
    }
  }

  async getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<DomainEvent[]> {
    if (backendKind === "prisma")
      return prismaBackend.getEvents(aggregateId, fromVersion, toVersion);
    return inMemoryBackend.getEvents(aggregateId, fromVersion, toVersion);
  }

  async getAllEvents(
    fromPosition?: number,
    limit?: number,
  ): Promise<DomainEvent[]> {
    if (backendKind === "prisma")
      return prismaBackend.getAllEvents(fromPosition, limit);
    return inMemoryBackend.getAllEvents(fromPosition, limit);
  }

  async getEventsByType(
    eventType: string,
    fromPosition?: number,
    limit?: number,
  ): Promise<DomainEvent[]> {
    if (backendKind === "prisma")
      return prismaBackend.getEventsByType(eventType, fromPosition, limit);
    return inMemoryBackend.getEventsByType(eventType, fromPosition, limit);
  }

  subscribe(handler: EventHandler<any>, filter?: EventFilter): Subscription {
    const id =
      backendKind === "prisma"
        ? prismaBackend.subscribe(handler, filter)
        : inMemoryBackend.subscribe(handler, filter);
    let paused = false;

    return {
      id,
      unsubscribe: () =>
        backendKind === "prisma"
          ? prismaBackend.unsubscribe(id)
          : inMemoryBackend.unsubscribe(id),
      pause: () => {
        paused = true;
      },
      resume: () => {
        paused = false;
      },
    };
  }

  subscribeToAggregate(
    aggregateId: string,
    handler: EventHandler<any>,
  ): Subscription {
    return this.subscribe(handler, {
      aggregateTypes: [], // Will match by aggregateId in handler
    });
  }

  async saveSnapshot(
    aggregateId: string,
    snapshot: AggregateSnapshot,
  ): Promise<void> {
    if (backendKind === "prisma") {
      await prismaBackend.saveSnapshot(aggregateId, snapshot);
      return;
    }
    inMemoryBackend.saveSnapshot(aggregateId, snapshot);
  }

  async getSnapshot(aggregateId: string): Promise<AggregateSnapshot | null> {
    if (backendKind === "prisma") {
      return (await prismaBackend.getSnapshot(aggregateId)) || null;
    }
    return inMemoryBackend.getSnapshot(aggregateId) || null;
  }

  async getPosition(): Promise<number> {
    if (backendKind === "prisma") return prismaBackend.getPosition();
    return inMemoryBackend.getPosition();
  }
}

export const eventStore: EventStore = new EventStoreService();

// ============================================================================
// COMMAND BUS IMPLEMENTATION
// ============================================================================

class CommandBusService implements CommandBus {
  private handlers: Map<string, CommandHandler<any, any>> = new Map();

  async dispatch<TResult = void>(
    command: Command,
  ): Promise<CommandResult<TResult>> {
    const startTime = Date.now();

    const handler = this.handlers.get(command.type);
    if (!handler) {
      return {
        success: false,
        commandId: command.id,
        aggregateId: command.aggregateId,
        error: {
          code: "HANDLER_NOT_FOUND",
          message: `No handler registered for command type: ${command.type}`,
          retryable: false,
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    const context: CommandContext = {
      userId: command.metadata.userId,
      tenantId: command.metadata.tenantId,
      correlationId: command.metadata.correlationId,
      eventStore,
      getAggregate: async () => null, // Implement based on aggregate factories
    };

    try {
      const result = await handler(command, context);

      return {
        success: true,
        commandId: command.id,
        aggregateId: command.aggregateId,
        result: result as TResult,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        commandId: command.id,
        aggregateId: command.aggregateId,
        error: {
          code: "EXECUTION_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          retryable: true,
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  register<TCommand extends Command, TResult = void>(
    commandType: string,
    handler: CommandHandler<TCommand, TResult>,
  ): void {
    this.handlers.set(commandType, handler);
  }
}

export const commandBus: CommandBus = new CommandBusService();

// ============================================================================
// QUERY BUS IMPLEMENTATION
// ============================================================================

class QueryBusService implements QueryBus {
  private handlers: Map<string, QueryHandler<any, any>> = new Map();

  async execute<TResult = any>(query: Query): Promise<QueryResult<TResult>> {
    const startTime = Date.now();

    const handler = this.handlers.get(query.type);
    if (!handler) {
      return {
        success: false,
        queryId: query.id,
        error: {
          code: "HANDLER_NOT_FOUND",
          message: `No handler registered for query type: ${query.type}`,
        },
        executionTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString(),
      };
    }

    const context: QueryContext = {
      userId: query.metadata.userId,
      tenantId: query.metadata.tenantId,
      correlationId: query.metadata.correlationId,
      readModel: readModelService,
    };

    try {
      const result = await handler(query, context);

      return {
        success: true,
        queryId: query.id,
        data: result as TResult,
        executionTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        queryId: query.id,
        error: {
          code: "EXECUTION_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        executionTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  register<TQuery extends Query, TResult = any>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>,
  ): void {
    this.handlers.set(queryType, handler);
  }
}

export const queryBus: QueryBus = new QueryBusService();

// ============================================================================
// EVENT BUS IMPLEMENTATION
// ============================================================================

class EventBusService implements EventBus {
  private subscriptions: Map<string, EventHandler<any>[]> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    await eventStore.append([event]);

    const handlers = this.subscriptions.get(event.type) || [];
    const allHandlers = this.subscriptions.get("*") || [];

    // Support prefix wildcards like "msds.*" used throughout the platform.
    const wildcardHandlers: EventHandler<any>[] = [];
    for (const [key, list] of this.subscriptions.entries()) {
      if (key.endsWith(".*")) {
        const prefix = key.slice(0, -2);
        if (event.type.startsWith(prefix + ".")) {
          wildcardHandlers.push(...list);
        }
      }
    }

    for (const handler of [...handlers, ...wildcardHandlers, ...allHandlers]) {
      try {
        await handler(event, {} as any);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe(eventType: string, handler: EventHandler<any>): Subscription {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType)!.push(handler);

    const id = `event-sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    return {
      id,
      unsubscribe: () => {
        const handlers = this.subscriptions.get(eventType) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      },
      pause: () => {},
      resume: () => {},
    };
  }

  subscribeMany(
    eventTypes: string[],
    handler: EventHandler<any>,
  ): Subscription {
    const subscriptions = eventTypes.map((type) =>
      this.subscribe(type, handler),
    );

    return {
      id: `multi-sub-${Date.now()}`,
      unsubscribe: () => subscriptions.forEach((s) => s.unsubscribe()),
      pause: () => subscriptions.forEach((s) => s.pause()),
      resume: () => subscriptions.forEach((s) => s.resume()),
    };
  }

  /**
   * Clear all event bus subscriptions
   * WARNING: This will remove all active subscriptions. Use with caution.
   */
  async clear(): Promise<void> {
    this.subscriptions.clear();
    console.log("[EventBus] All subscriptions cleared");
  }

  /**
   * Get subscription count for monitoring
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const handlers of this.subscriptions.values()) {
      count += handlers.length;
    }
    return count;
  }
}

export const eventBus: EventBus = new EventBusService();

// ============================================================================
// READ MODEL / PROJECTION STORE
// ============================================================================

class InMemoryProjectionStore implements ProjectionStore {
  private collections: Map<string, Map<string, Record<string, any>>> =
    new Map();

  async upsert(
    collection: string,
    id: string,
    data: Record<string, any>,
  ): Promise<void> {
    if (!this.collections.has(collection)) {
      this.collections.set(collection, new Map());
    }
    this.collections.get(collection)!.set(id, { ...data, _id: id });
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const col = this.collections.get(collection);
    if (col) {
      return col.delete(id);
    }
    return false;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const col = this.collections.get(collection);
    if (col) {
      return (col.get(id) as T) || null;
    }
    return null;
  }

  async find<T>(collection: string, query: ReadModelQuery): Promise<T[]> {
    const col = this.collections.get(collection);
    if (!col) return [];

    let results = Array.from(col.values()) as T[];

    // Apply filters
    if (query.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        results = results.filter((item) => (item as any)[key] === value);
      }
    }

    // Apply sorting
    if (query.sorting?.length) {
      results.sort((a, b) => {
        for (const sort of query.sorting!) {
          const aVal = (a as any)[sort.field];
          const bVal = (b as any)[sort.field];
          if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply pagination
    if (query.pagination) {
      results = results.slice(
        query.pagination.offset,
        query.pagination.offset + query.pagination.limit,
      );
    }

    return results;
  }
}

export const projectionStore: ProjectionStore = new InMemoryProjectionStore();

// ============================================================================
// READ MODEL SERVICE
// ============================================================================

class ReadModelService implements ReadModel {
  async get<T>(collection: string, id: string): Promise<T | null> {
    return projectionStore.get<T>(collection, id);
  }

  async find<T>(collection: string, query: ReadModelQuery): Promise<T[]> {
    return projectionStore.find<T>(collection, query);
  }

  async count(collection: string, query?: ReadModelQuery): Promise<number> {
    const results = await this.find(collection, query || {});
    return results.length;
  }
}

const readModelService: ReadModel = new ReadModelService();

// ============================================================================
// PROJECTION MANAGER
// ============================================================================

class ProjectionManager {
  private projections: Map<string, Projection> = new Map();

  register(projection: Projection): void {
    this.projections.set(projection.name, projection);

    // Subscribe to events
    for (const eventType of projection.handles) {
      eventBus.subscribe(eventType, async (event) => {
        await projection.apply(event, projectionStore);
      });
    }
  }

  async rebuild(projectionName: string): Promise<void> {
    const projection = this.projections.get(projectionName);
    if (!projection) {
      throw new Error(`Projection ${projectionName} not found`);
    }

    const events = await eventStore.getAllEvents();
    const relevantEvents = events.filter((e) =>
      projection.handles.includes(e.type),
    );

    await projection.rebuild(relevantEvents);
  }

  getProjection(name: string): Projection | undefined {
    return this.projections.get(name);
  }

  getAllProjections(): Projection[] {
    return Array.from(this.projections.values());
  }
}

export const projectionManager = new ProjectionManager();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createCommand<TPayload>(
  type: string,
  aggregateId: string,
  aggregateType: string,
  payload: TPayload,
  metadata: Partial<CommandMetadata> = {},
): Command<TPayload> {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    aggregateId,
    aggregateType,
    payload,
    metadata: {
      correlationId: metadata.correlationId || `corr-${Date.now()}`,
      ...metadata,
    },
    timestamp: new Date().toISOString(),
  };
}

export function createEvent<TPayload>(
  type: string,
  aggregateId: string,
  aggregateType: string,
  payload: TPayload,
  version: number,
  metadata: Partial<EventMetadata> = {},
): DomainEvent<TPayload> {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    aggregateId,
    aggregateType,
    payload,
    version,
    metadata: {
      correlationId: metadata.correlationId || `corr-${Date.now()}`,
      schemaVersion: metadata.schemaVersion || 1,
      ...metadata,
    },
    timestamp: new Date().toISOString(),
  };
}

export function createQuery<TFilters>(
  type: string,
  filters: TFilters,
  metadata: Partial<QueryMetadata> = {},
): Query<TFilters> {
  return {
    id: `qry-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    filters,
    metadata: {
      correlationId: metadata.correlationId || `corr-${Date.now()}`,
      ...metadata,
    },
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  EventStoreService,
  CommandBusService,
  QueryBusService,
  EventBusService,
  ReadModelService,
  InMemoryProjectionStore,
  ProjectionManager,
};

export default eventStore;
