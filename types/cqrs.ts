/**
 * CQRS & Event Sourcing Type Definitions
 * Command-Query Responsibility Segregation with Event Store
 * Supports domain events, sagas, and process managers
 */

// ============================================================================
// COMMANDS
// ============================================================================

export interface Command<TPayload = Record<string, any>> {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  payload: TPayload
  metadata: CommandMetadata
  timestamp: Date | string
}

export interface CommandMetadata {
  correlationId: string
  causationId?: string // ID of command/event that caused this
  userId?: string
  tenantId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  traceId?: string
  spanId?: string
  tags?: Record<string, string>
}

export interface CommandResult<TResult = any> {
  success: boolean
  commandId: string
  aggregateId: string
  aggregateVersion?: number
  result?: TResult
  error?: CommandError
  events?: DomainEvent[] // Events produced by the command
  executionTime: number // ms
  timestamp: Date | string
}

export interface CommandError {
  code: string
  message: string
  details?: Record<string, any>
  stack?: string
  retryable: boolean
}

export type CommandHandler<TCommand extends Command, TResult = void> = (
  command: TCommand,
  context: CommandContext
) => Promise<TResult>

export interface CommandContext {
  userId?: string
  tenantId?: string
  correlationId: string
  eventStore: EventStore
  getAggregate: <T extends AggregateRoot>(id: string, type: string) => Promise<T | null>
}

// ============================================================================
// QUERIES
// ============================================================================

export interface Query<TFilters = Record<string, any>> {
  id: string
  type: string
  filters: TFilters
  pagination?: PaginationParams
  sorting?: SortingParams[]
  projection?: string[] // Fields to include
  metadata: QueryMetadata
  timestamp: Date | string
}

export interface QueryMetadata {
  correlationId: string
  userId?: string
  tenantId?: string
  cacheHint?: 'no-cache' | 'cache-first' | 'network-first'
  timeout?: number // ms
}

export interface PaginationParams {
  offset: number
  limit: number
  cursor?: string // For cursor-based pagination
}

export interface SortingParams {
  field: string
  direction: 'asc' | 'desc'
}

export interface QueryResult<TData = any> {
  success: boolean
  queryId: string
  data?: TData
  pagination?: {
    total: number
    offset: number
    limit: number
    hasMore: boolean
    nextCursor?: string
  }
  error?: QueryError
  executionTime: number
  cached: boolean
  timestamp: Date | string
}

export interface QueryError {
  code: string
  message: string
  details?: Record<string, any>
}

export type QueryHandler<TQuery extends Query, TResult = any> = (
  query: TQuery,
  context: QueryContext
) => Promise<TResult>

export interface QueryContext {
  userId?: string
  tenantId?: string
  correlationId: string
  readModel: ReadModel
}

// ============================================================================
// DOMAIN EVENTS
// ============================================================================

export interface DomainEvent<TPayload = Record<string, any>> {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  payload: TPayload
  metadata: EventMetadata
  version: number // Aggregate version after this event
  timestamp: Date | string
}

export interface EventMetadata {
  correlationId: string
  causationId?: string
  userId?: string
  tenantId?: string
  traceId?: string
  spanId?: string
  schemaVersion: number // Event schema version
  tags?: Record<string, string>
}

export type EventHandler<TEvent extends DomainEvent> = (
  event: TEvent,
  context: EventContext
) => Promise<void>

export interface EventContext {
  eventStore: EventStore
  projectionStore: ProjectionStore
  sagaRunner: SagaRunner
}

// ============================================================================
// AGGREGATE ROOT
// ============================================================================

export interface AggregateRoot {
  id: string
  type: string
  version: number
  tenantId?: string
  createdAt: Date | string
  updatedAt: Date | string
  
  // State
  state: Record<string, any>
  
  // Uncommitted events
  uncommittedEvents: DomainEvent[]
  
  // Methods
  applyEvent: (event: DomainEvent) => void
  loadFromHistory: (events: DomainEvent[]) => void
  getUncommittedEvents: () => DomainEvent[]
  markEventsAsCommitted: () => void
}

export interface AggregateFactory<T extends AggregateRoot> {
  create: (id: string, tenantId?: string) => T
  type: string
}

// ============================================================================
// EVENT STORE
// ============================================================================

export interface EventStore {
  // Write
  append: (events: DomainEvent[], expectedVersion?: number) => Promise<void>
  
  // Read
  getEvents: (aggregateId: string, fromVersion?: number, toVersion?: number) => Promise<DomainEvent[]>
  getAllEvents: (fromPosition?: number, limit?: number) => Promise<DomainEvent[]>
  getEventsByType: (eventType: string, fromPosition?: number, limit?: number) => Promise<DomainEvent[]>
  
  // Subscriptions
  subscribe: (handler: EventHandler<any>, filter?: EventFilter) => Subscription
  subscribeToAggregate: (aggregateId: string, handler: EventHandler<any>) => Subscription
  
  // Snapshots
  saveSnapshot: (aggregateId: string, snapshot: AggregateSnapshot) => Promise<void>
  getSnapshot: (aggregateId: string) => Promise<AggregateSnapshot | null>
  
  // Position tracking
  getPosition: () => Promise<number>
}

export interface EventFilter {
  eventTypes?: string[]
  aggregateTypes?: string[]
  tenantIds?: string[]
  fromPosition?: number
  fromTimestamp?: Date | string
}

export interface Subscription {
  id: string
  unsubscribe: () => void
  pause: () => void
  resume: () => void
}

export interface AggregateSnapshot {
  aggregateId: string
  aggregateType: string
  version: number
  state: Record<string, any>
  timestamp: Date | string
  metadata?: {
    tenantId?: string
    [key: string]: any
  }
}

// ============================================================================
// READ MODEL / PROJECTIONS
// ============================================================================

export interface ReadModel {
  get: <T>(collection: string, id: string) => Promise<T | null>
  find: <T>(collection: string, query: ReadModelQuery) => Promise<T[]>
  count: (collection: string, query?: ReadModelQuery) => Promise<number>
}

export interface ReadModelQuery {
  filters?: Record<string, any>
  pagination?: PaginationParams
  sorting?: SortingParams[]
}

export interface Projection {
  name: string
  handles: string[] // Event types this projection handles
  
  // Handlers for each event type
  apply: (event: DomainEvent, projectionStore: ProjectionStore) => Promise<void>
  
  // Rebuild from scratch
  rebuild: (events: DomainEvent[]) => Promise<void>
}

export interface ProjectionStore {
  upsert: (collection: string, id: string, data: Record<string, any>) => Promise<void>
  delete: (collection: string, id: string) => Promise<boolean>
  get: <T>(collection: string, id: string) => Promise<T | null>
  find: <T>(collection: string, query: ReadModelQuery) => Promise<T[]>
}

// ============================================================================
// SAGA / PROCESS MANAGER
// ============================================================================

export interface Saga {
  id: string
  type: string
  
  // Configuration
  startsWith: string[] // Event types that start this saga
  
  // State
  state: SagaState
  data: Record<string, any>
  
  // Handlers
  handle: (event: DomainEvent, context: SagaContext) => Promise<SagaAction[]>
  
  // Compensation
  compensate?: (error: Error, context: SagaContext) => Promise<SagaAction[]>
}

export type SagaState = 'pending' | 'running' | 'completed' | 'failed' | 'compensating' | 'compensated'

export interface SagaContext {
  sagaId: string
  correlationId: string
  eventStore: EventStore
  commandBus: CommandBus
}

export type SagaAction =
  | { type: 'dispatch_command'; command: Command }
  | { type: 'schedule'; command: Command; delay: number }
  | { type: 'complete' }
  | { type: 'fail'; error: string }
  | { type: 'compensate' }

export interface SagaRunner {
  start: (saga: Saga, triggerEvent: DomainEvent) => Promise<string>
  getState: (sagaId: string) => Promise<SagaState | null>
  pause: (sagaId: string) => Promise<void>
  resume: (sagaId: string) => Promise<void>
  cancel: (sagaId: string) => Promise<void>
}

// ============================================================================
// BUSES
// ============================================================================

export interface CommandBus {
  dispatch: <TResult = void>(command: Command) => Promise<CommandResult<TResult>>
  register: <TCommand extends Command, TResult = void>(
    commandType: string,
    handler: CommandHandler<TCommand, TResult>
  ) => void
}

export interface QueryBus {
  execute: <TResult = any>(query: Query) => Promise<QueryResult<TResult>>
  register: <TQuery extends Query, TResult = any>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>
  ) => void
}

export interface EventBus {
  publish: (event: DomainEvent) => Promise<void>
  publishMany: (events: DomainEvent[]) => Promise<void>
  subscribe: (eventType: string, handler: EventHandler<any>) => Subscription
  subscribeMany: (eventTypes: string[], handler: EventHandler<any>) => Subscription
}

// ============================================================================
// COMMON EVENT TYPES
// ============================================================================

// These are example domain events that would be used across the platform

export interface EntityCreatedEvent extends DomainEvent<{
  entityType: string
  entityId: string
  data: Record<string, any>
}> {
  type: 'EntityCreated'
}

export interface EntityUpdatedEvent extends DomainEvent<{
  entityType: string
  entityId: string
  changes: Record<string, { from: any; to: any }>
}> {
  type: 'EntityUpdated'
}

export interface EntityDeletedEvent extends DomainEvent<{
  entityType: string
  entityId: string
  reason?: string
}> {
  type: 'EntityDeleted'
}

export interface WorkflowStartedEvent extends DomainEvent<{
  workflowType: string
  workflowId: string
  input: Record<string, any>
}> {
  type: 'WorkflowStarted'
}

export interface WorkflowCompletedEvent extends DomainEvent<{
  workflowType: string
  workflowId: string
  output: Record<string, any>
}> {
  type: 'WorkflowCompleted'
}

export interface ApprovalRequestedEvent extends DomainEvent<{
  approvalType: string
  entityId: string
  requestedBy: string
  approvers: string[]
}> {
  type: 'ApprovalRequested'
}

export interface ApprovalGrantedEvent extends DomainEvent<{
  approvalType: string
  entityId: string
  approvedBy: string
  notes?: string
}> {
  type: 'ApprovalGranted'
}

export interface ApprovalDeniedEvent extends DomainEvent<{
  approvalType: string
  entityId: string
  deniedBy: string
  reason: string
}> {
  type: 'ApprovalDenied'
}

export interface ComplianceViolationDetectedEvent extends DomainEvent<{
  violationType: string
  entityId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: string
}> {
  type: 'ComplianceViolationDetected'
}

export interface AlertTriggeredEvent extends DomainEvent<{
  alertType: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  source: string
}> {
  type: 'AlertTriggered'
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DomainEvent

