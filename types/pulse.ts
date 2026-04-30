/**
 * Pulse Module Types
 * Wellbeing + Gamified Execution + Tokens + Scoreboards + Benchmarking
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type PulsePillar = 'Move' | 'Execute' | 'Safe' | 'Grow'
export type PulseEventType = 
  | 'MISSION_COMPLETED'
  | 'TASK_CLOSED'
  | 'TRAINING_COMPLETED'
  | 'SAFETY_OBSERVATION'
  | 'RECOGNITION_GIVEN'
  | 'REWARD_REDEEMED'
  | 'WELLNESS_LOGGED'
  | 'CAPA_CLOSED'
  | 'NCR_CLOSED'

export type MissionType = 'DAILY' | 'WEEKLY'
export type MissionScope = 'individual' | 'team' | 'site' | 'company'
export type MissionStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED'

export type RedemptionStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED'
export type ScopeType = 'TEAM' | 'SITE' | 'SHIFT' | 'COMPANY'
export type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

// ============================================================================
// CONSENT & PRIVACY
// ============================================================================

export interface PulseConsent {
  id: string
  tenantId: string
  userId: string
  wellnessOptIn: boolean
  consentVersion: string
  consentTextHash: string
  consentedAt?: Date | string
  revokedAt?: Date | string
  dataRetentionDays: number
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// WELLNESS (AGGREGATE ONLY)
// ============================================================================

export interface PulseDailyWellness {
  id: string
  tenantId: string
  userId: string
  date: Date | string
  steps?: number
  activeMinutes?: number
  calories?: number
  sourceType?: 'google_fit' | 'apple_health' | 'manual'
  confidenceScore: number // 0-100
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// EVENTS & LEDGER
// ============================================================================

export interface PulseEvent {
  id: string
  tenantId: string
  userId: string
  occurredAt: Date | string
  eventType: PulseEventType
  sourceModule?: string
  sourceRef?: string
  pointsAwardedPP: number
  creditsAwardedIC: number
  metadataJson?: Record<string, any>
  createdAt: Date | string
}

export interface PulseBalance {
  tenantId: string
  userId: string
  balancePP: number
  balanceIC: number
  lifetimePP: number
  lifetimeIC: number
  updatedAt: Date | string
}

// ============================================================================
// RULESETS & SCORING
// ============================================================================

export interface PulseRuleset {
  id: string
  tenantId: string
  name: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  roleCluster: string // warehouse, office, driver, custom
  weightsJson: {
    Move: number
    Execute: number
    Safe: number
    Grow: number
  }
  capsJson: {
    daily: Record<PulsePillar, number>
    weekly: Record<PulsePillar, number>
    monthly: Record<PulsePillar, number>
  }
  antiGamingJson?: {
    spikeDetection?: {
      threshold: number
      action: 'reduce' | 'flag' | 'reject'
    }
    maxEventCounts?: Record<string, number>
  }
  evaluationPolicyJson?: {
    icWeight: number // Max 10% default
    allowedUses: string[]
  }
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// MISSIONS
// ============================================================================

export interface MissionRequirement {
  type: 'task' | 'training' | 'safety' | 'wellness' | 'manual'
  source?: string // tasks, training, ims, manual
  count?: number
  status?: string
  priority?: string
  category?: string
  activeMinutes?: number
  steps?: number
  description?: string
}

export interface MissionReward {
  PP: number
  IC: number
  badge?: string
}

export interface PulseMission {
  id: string
  tenantId: string
  missionType: MissionType
  title: string
  description?: string
  startAt: Date | string
  endAt: Date | string
  targetScope: MissionScope
  requirementsJson: MissionRequirement[]
  rewardJson: MissionReward
  createdAt: Date | string
  updatedAt: Date | string
}

export interface PulseMissionProgress {
  id: string
  tenantId: string
  missionId: string
  userId?: string
  teamId?: string
  siteId?: string
  shiftId?: string
  progressJson: Record<string, any>
  status: MissionStatus
  completedAt?: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// BADGES
// ============================================================================

export interface PulseBadge {
  id: string
  tenantId: string
  name: string
  icon?: string
  criteriaJson: Record<string, any>
  rarity: BadgeRarity
  createdAt: Date | string
}

export interface PulseUserBadge {
  tenantId: string
  userId: string
  badgeId: string
  awardedAt: Date | string
}

// ============================================================================
// REWARDS
// ============================================================================

export interface PulseRewardsCatalog {
  id: string
  tenantId: string
  name: string
  description?: string
  category: string
  costPP: number
  monthlyLimitPerUser?: number
  approvalRequired: boolean
  inventoryCount?: number
  active: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface PulseRedemption {
  id: string
  tenantId: string
  userId: string
  rewardId: string
  status: RedemptionStatus
  requestedAt: Date | string
  decisionAt?: Date | string
  fulfilledAt?: Date | string
  approverUserId?: string
  notes?: string
  costPP: number
}

// ============================================================================
// RECOGNITION
// ============================================================================

export interface PulseRecognition {
  id: string
  tenantId: string
  fromUserId: string
  toUserId: string
  pointsPP: number
  reason: string
  tagsJson?: string[] // ["Teamwork", "Safety", "Innovation", etc.]
  createdAt: Date | string
}

// ============================================================================
// SCOREBOARDS
// ============================================================================

export interface PulseScoreSnapshot {
  id: string
  tenantId: string
  scopeType: ScopeType
  scopeId: string
  periodStart: Date | string
  periodEnd: Date | string
  participationRate: number // 0-100
  pillarScoresJson: Record<PulsePillar, number>
  compositeScore: number // 0-100
  createdAt: Date | string
}

// ============================================================================
// BENCHMARKING
// ============================================================================

export interface PulseBenchmarkIndex {
  id: string
  benchmarkGroup: string // industry=logistics, region=GCC, size=SME/ENT
  periodStart: Date | string
  periodEnd: Date | string
  metricKey: string // SAFE_PARTICIPATION, EXECUTE_ONTIME, etc.
  medianValue: number
  p75Value: number
  p90Value: number
  createdAt: Date | string
}

export interface PulseTenantBenchmarkSubmission {
  id: string
  tenantId: string
  periodStart: Date | string
  periodEnd: Date | string
  benchmarkGroup: string
  metricsJson: Record<string, number>
  anonymizedHash: string
  optInPublicLeague: boolean
  createdAt: Date | string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface PulseOverview {
  balance: PulseBalance
  todayProgress: {
    missions: number
    completed: number
    pointsEarned: number
    creditsEarned: number
  }
  activeMissions: PulseMission[]
  recentEvents: PulseEvent[]
  pillarScores: Record<PulsePillar, number>
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  compositeScore: number
  pillarScores: Record<PulsePillar, number>
  participationRate: number
  rank: number
}

export interface BenchmarkPercentile {
  metricKey: string
  tenantValue: number
  percentile: number
  median: number
  p75: number
  p90: number
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IPulseScoringService {
  processEvent(event: Omit<PulseEvent, 'id' | 'createdAt'>): Promise<PulseEvent>
  calculatePillarScores(userId: string, tenantId: string, period: { start: Date; end: Date }): Promise<Record<PulsePillar, number>>
  applyCaps(userId: string, tenantId: string, pillar: PulsePillar, points: number): Promise<number>
  normalizeByRole(userId: string, tenantId: string, scores: Record<PulsePillar, number>): Promise<Record<PulsePillar, number>>
}

export interface IPulseMissionService {
  generateDailyMissions(userId: string, tenantId: string, date: Date): Promise<PulseMission[]>
  createWeeklyMission(mission: Omit<PulseMission, 'id' | 'createdAt' | 'updatedAt'>): Promise<PulseMission>
  claimMission(missionId: string, userId: string, tenantId: string): Promise<PulseMissionProgress>
  validateMissionRequirements(missionId: string, userId: string, tenantId: string): Promise<boolean>
}

export interface IPulseLedgerService {
  recordEvent(event: Omit<PulseEvent, 'id' | 'createdAt'>): Promise<PulseEvent>
  updateBalance(userId: string, tenantId: string, deltaPP: number, deltaIC: number): Promise<PulseBalance>
  getBalance(userId: string, tenantId: string): Promise<PulseBalance>
  getEventHistory(userId: string, tenantId: string, filters?: { start?: Date; end?: Date; eventType?: PulseEventType }): Promise<PulseEvent[]>
}

export interface IPulseRewardsService {
  getCatalog(tenantId: string, filters?: { active?: boolean; category?: string }): Promise<PulseRewardsCatalog[]>
  redeemReward(userId: string, tenantId: string, rewardId: string): Promise<PulseRedemption>
  approveRedemption(redemptionId: string, approverUserId: string, tenantId: string, approved: boolean, notes?: string): Promise<PulseRedemption>
  getRedemptions(userId: string, tenantId: string, filters?: { status?: RedemptionStatus }): Promise<PulseRedemption[]>
}

export interface IPulseRecognitionService {
  giveRecognition(fromUserId: string, toUserId: string, tenantId: string, pointsPP: number, reason: string, tags?: string[]): Promise<PulseRecognition>
  checkDailyCap(userId: string, tenantId: string): Promise<{ remaining: number; limit: number }>
  checkWeeklyCap(userId: string, tenantId: string): Promise<{ remaining: number; limit: number }>
  detectAbuse(fromUserId: string, toUserId: string, tenantId: string): Promise<boolean>
}

export interface IPulseScoreboardService {
  calculateSnapshot(scopeType: ScopeType, scopeId: string, tenantId: string, period: { start: Date; end: Date }): Promise<PulseScoreSnapshot>
  getLeaderboard(scopeType: ScopeType, scopeId: string, tenantId: string, period: { start: Date; end: Date }, limit?: number): Promise<LeaderboardEntry[]>
  getScoreboard(scopeType: ScopeType, scopeId: string, tenantId: string, period: { start: Date; end: Date }): Promise<PulseScoreSnapshot>
}

export interface IPulseBenchmarkService {
  submitMetrics(tenantId: string, period: { start: Date; end: Date }, benchmarkGroup: string, optInPublicLeague: boolean): Promise<PulseTenantBenchmarkSubmission>
  getPercentiles(tenantId: string, metricKey: string, benchmarkGroup: string): Promise<BenchmarkPercentile>
  updateBenchmarkIndex(benchmarkGroup: string, period: { start: Date; end: Date }, metricKey: string): Promise<PulseBenchmarkIndex>
}













