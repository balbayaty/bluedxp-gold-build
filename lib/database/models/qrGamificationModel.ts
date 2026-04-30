/**
 * QR Gamification Database Model
 * Production-ready data access layer for QR gamification
 */

import { DatabaseClient } from '../client'

export interface QRAchievementDB {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  requirements: any
  reward: any
  created_at: Date
}

export interface QRLeaderboardDB {
  id: string
  name: string
  leaderboard_type: string
  period: string
  metadata: any
  updated_at: Date
  created_at: Date
}

export interface QRLeaderboardEntryDB {
  id: string
  leaderboard_id: string
  user_id: string
  user_name?: string
  score: number
  rank: number
  metrics: any
  updated_at: Date
}

export interface QRChallengeDB {
  id: string
  name: string
  description: string
  challenge_type: string
  difficulty: string
  start_date: Date
  end_date: Date
  requirements: any
  rewards: any
  metadata: any
  created_at: Date
}

export interface QRUserProgressDB {
  id: string
  user_id: string
  points: number
  level: number
  achievements: any
  badges: any
  stats: any
  updated_at: Date
  created_at: Date
}

export class QRGamificationModel {
  constructor(private db: DatabaseClient) {}

  /**
   * Create achievement
   */
  async createAchievement(achievement: {
    id?: string
    name: string
    description: string
    icon: string
    category: string
    rarity: string
    requirements: any
    reward: any
  }): Promise<QRAchievementDB> {
    const id = achievement.id || `achievement-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_achievements (id, name, description, icon, category, rarity, requirements, reward, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `

    const result = await this.db.query<QRAchievementDB>(query, [
      id,
      achievement.name,
      achievement.description,
      achievement.icon,
      achievement.category,
      achievement.rarity,
      JSON.stringify(achievement.requirements),
      JSON.stringify(achievement.reward),
      now
    ])

    return result[0]
  }

  /**
   * Get all achievements
   */
  async getAchievements(filters?: { category?: string; rarity?: string }): Promise<QRAchievementDB[]> {
    let query = 'SELECT * FROM qr_achievements WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters?.category) {
      query += ` AND category = $${paramIndex++}`
      params.push(filters.category)
    }
    if (filters?.rarity) {
      query += ` AND rarity = $${paramIndex++}`
      params.push(filters.rarity)
    }

    query += ' ORDER BY created_at DESC'
    return await this.db.query<QRAchievementDB>(query, params)
  }

  /**
   * Get user progress
   */
  async getUserProgress(userId: string): Promise<QRUserProgressDB | null> {
    const query = 'SELECT * FROM qr_user_progress WHERE user_id = $1'
    const result = await this.db.query<QRUserProgressDB>(query, [userId])
    return result[0] || null
  }

  /**
   * Create or update user progress
   */
  async upsertUserProgress(userId: string, progress: {
    points?: number
    level?: number
    achievements?: string[]
    badges?: string[]
    stats?: any
  }): Promise<QRUserProgressDB> {
    const existing = await this.getUserProgress(userId)
    const now = new Date()

    if (existing) {
      const updated: QRUserProgressDB = {
        ...existing,
        points: progress.points !== undefined ? progress.points : existing.points,
        level: progress.level !== undefined ? progress.level : existing.level,
        achievements: progress.achievements !== undefined ? progress.achievements : existing.achievements,
        badges: progress.badges !== undefined ? progress.badges : existing.badges,
        stats: progress.stats !== undefined ? progress.stats : existing.stats,
        updated_at: now
      }

      const query = `
        UPDATE qr_user_progress SET
          points = $2, level = $3, achievements = $4, badges = $5, stats = $6, updated_at = $7
        WHERE user_id = $1
        RETURNING *
      `

      const result = await this.db.query<QRUserProgressDB>(query, [
        userId,
        updated.points,
        updated.level,
        JSON.stringify(updated.achievements),
        JSON.stringify(updated.badges),
        JSON.stringify(updated.stats),
        now
      ])

      return result[0]
    } else {
      const id = `progress-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      const query = `
        INSERT INTO qr_user_progress (id, user_id, points, level, achievements, badges, stats, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `

      const result = await this.db.query<QRUserProgressDB>(query, [
        id,
        userId,
        progress.points || 0,
        progress.level || 1,
        JSON.stringify(progress.achievements || []),
        JSON.stringify(progress.badges || []),
        JSON.stringify(progress.stats || {}),
        now,
        now
      ])

      return result[0]
    }
  }

  /**
   * Create leaderboard
   */
  async createLeaderboard(leaderboard: {
    id?: string
    name: string
    type: string
    period: string
    metadata?: any
  }): Promise<QRLeaderboardDB> {
    const id = leaderboard.id || `leaderboard-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_leaderboards (id, name, leaderboard_type, period, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const result = await this.db.query<QRLeaderboardDB>(query, [
      id,
      leaderboard.name,
      leaderboard.type,
      leaderboard.period,
      JSON.stringify(leaderboard.metadata || {}),
      now,
      now
    ])

    return result[0]
  }

  /**
   * Upsert leaderboard entry
   */
  async upsertLeaderboardEntry(leaderboardId: string, entry: {
    userId: string
    userName?: string
    score: number
    rank: number
    metrics: any
  }): Promise<QRLeaderboardEntryDB> {
    const id = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_leaderboard_entries (id, leaderboard_id, user_id, user_name, score, rank, metrics, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (leaderboard_id, user_id) DO UPDATE SET
        score = EXCLUDED.score,
        rank = EXCLUDED.rank,
        metrics = EXCLUDED.metrics,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `

    const result = await this.db.query<QRLeaderboardEntryDB>(query, [
      id,
      leaderboardId,
      entry.userId,
      entry.userName || null,
      entry.score,
      entry.rank,
      JSON.stringify(entry.metrics),
      now
    ])

    return result[0]
  }

  /**
   * Get leaderboard entries
   */
  async getLeaderboardEntries(leaderboardId: string, limit?: number): Promise<QRLeaderboardEntryDB[]> {
    let query = `
      SELECT * FROM qr_leaderboard_entries
      WHERE leaderboard_id = $1
      ORDER BY score DESC, rank ASC
    `
    const params: any[] = [leaderboardId]

    if (limit) {
      query += ' LIMIT $2'
      params.push(limit)
    }

    return await this.db.query<QRLeaderboardEntryDB>(query, params)
  }

  /**
   * Create challenge
   */
  async createChallenge(challenge: {
    id?: string
    name: string
    description: string
    type: string
    difficulty: string
    startDate: Date
    endDate: Date
    requirements: any
    rewards: any
    metadata?: any
  }): Promise<QRChallengeDB> {
    const id = challenge.id || `challenge-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_challenges (
        id, name, description, challenge_type, difficulty, start_date, end_date,
        requirements, rewards, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `

    const result = await this.db.query<QRChallengeDB>(query, [
      id,
      challenge.name,
      challenge.description,
      challenge.type,
      challenge.difficulty,
      challenge.startDate,
      challenge.endDate,
      JSON.stringify(challenge.requirements),
      JSON.stringify(challenge.rewards),
      JSON.stringify(challenge.metadata || {}),
      now
    ])

    return result[0]
  }

  /**
   * Join challenge
   */
  async joinChallenge(challengeId: string, userId: string): Promise<void> {
    const query = `
      INSERT INTO qr_challenge_participants (challenge_id, user_id, joined_at)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `
    await this.db.query(query, [challengeId, userId, new Date()])
  }

  /**
   * Complete challenge
   */
  async completeChallenge(challengeId: string, userId: string, score: number): Promise<void> {
    const id = `completion-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const query = `
      INSERT INTO qr_challenge_completions (id, challenge_id, user_id, score, completed_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (challenge_id, user_id) DO UPDATE SET
        score = EXCLUDED.score,
        completed_at = EXCLUDED.completed_at
    `
    await this.db.query(query, [id, challengeId, userId, score, new Date()])
  }

  /**
   * Get active challenges
   */
  async getActiveChallenges(): Promise<QRChallengeDB[]> {
    const now = new Date()
    const query = `
      SELECT * FROM qr_challenges
      WHERE start_date <= $1 AND end_date >= $1
      ORDER BY created_at DESC
    `
    return await this.db.query<QRChallengeDB>(query, [now])
  }
}







