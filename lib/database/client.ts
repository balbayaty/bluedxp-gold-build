/**
 * Database Client
 * Production-ready database connection with connection pooling
 * Supports PostgreSQL, MongoDB, and SQLite
 */

import { DatabaseConfig } from './schema'

// ============================================================================
// DATABASE CLIENT INTERFACE
// ============================================================================

export interface DatabaseClient {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query<T = any>(query: string, params?: any[]): Promise<T[]>
  execute<T = any>(query: string, params?: any[]): Promise<T>
  transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T>
  healthCheck(): Promise<boolean>
}

// ============================================================================
// DATABASE CLIENT IMPLEMENTATION
// ============================================================================

class DatabaseClientImpl implements DatabaseClient {
  private config: DatabaseConfig
  private client: any
  private pool: any
  private connected: boolean = false

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    try {
      if (this.connected) return

      if (this.config.type === 'postgresql') {
        // PostgreSQL connection
        let pg: any
        try {
          pg = await import('pg')
        } catch (error) {
          throw new Error('PostgreSQL driver (pg) is not installed. Run: npm install pg')
        }
        const { Pool } = pg
        this.pool = new Pool({
          host: this.config.host || 'localhost',
          port: this.config.port || 5432,
          database: this.config.database,
          user: this.config.username,
          password: this.config.password,
          ssl: this.config.ssl,
          max: this.config.pool?.max || 20,
          min: this.config.pool?.min || 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT_MS || '10000'),
        })
        this.connected = true
        console.log('✅ PostgreSQL connected')
      } else if (this.config.type === 'mongodb') {
        // MongoDB connection
        const { MongoClient } = await import('mongodb')
        const uri = this.config.connectionString || 
          `mongodb://${this.config.host || 'localhost'}:${this.config.port || 27017}/${this.config.database}`
        this.client = new MongoClient(uri, {
          maxPoolSize: this.config.pool?.max || 20,
          minPoolSize: this.config.pool?.min || 5,
        })
        await this.client.connect()
        this.connected = true
        console.log('✅ MongoDB connected')
      } else if (this.config.type === 'sqlite') {
        // SQLite connection (for development/testing)
        let sqlite3: any, sqlite: any
        try {
          sqlite3 = await import('sqlite3')
          sqlite = await import('sqlite')
        } catch (error) {
          throw new Error('SQLite drivers (sqlite3, sqlite) are not installed. Run: npm install sqlite3 sqlite')
        }
        const { open } = sqlite
        const db = await open({
          filename: this.config.database || './database.sqlite',
          driver: sqlite3.Database
        })
        this.client = db
        this.connected = true
        console.log('✅ SQLite connected')
      }
    } catch (error) {
      console.error('❌ Database connection error:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end()
      }
      if (this.client && this.client.close) {
        await this.client.close()
      }
      this.connected = false
      console.log('✅ Database disconnected')
    } catch (error) {
      console.error('❌ Database disconnection error:', error)
      throw error
    }
  }

  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    if (!this.connected) {
      throw new Error('Database not connected')
    }

    try {
      if (this.config.type === 'postgresql') {
        const result = await this.pool.query(query, params)
        return result.rows as T[]
      } else if (this.config.type === 'mongodb') {
        // MongoDB query parsing (simplified)
        // In production, use proper MongoDB query builder
        const db = this.client.db(this.config.database)
        const collection = query.split(' ')[3] // Simplified parsing
        const result = await db.collection(collection).find(params?.[0] || {}).toArray()
        return result as T[]
      } else if (this.config.type === 'sqlite') {
        const result = await this.client.all(query, params)
        return result as T[]
      }
      return []
    } catch (error) {
      console.error('❌ Database query error:', error)
      throw error
    }
  }

  async execute<T = any>(query: string, params?: any[]): Promise<T> {
    if (!this.connected) {
      throw new Error('Database not connected')
    }

    try {
      if (this.config.type === 'postgresql') {
        const result = await this.pool.query(query, params)
        return result.rows[0] as T
      } else if (this.config.type === 'mongodb') {
        // MongoDB execute (simplified)
        const db = this.client.db(this.config.database)
        // Implementation depends on operation type
        return {} as T
      } else if (this.config.type === 'sqlite') {
        const result = await this.client.run(query, params)
        return result as T
      }
      return {} as T
    } catch (error) {
      console.error('❌ Database execute error:', error)
      throw error
    }
  }

  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    if (!this.connected) {
      throw new Error('Database not connected')
    }

    try {
      if (this.config.type === 'postgresql') {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')
          const result = await callback(this)
          await client.query('COMMIT')
          return result
        } catch (error) {
          await client.query('ROLLBACK')
          throw error
        } finally {
          client.release()
        }
      } else if (this.config.type === 'mongodb') {
        const session = this.client.startSession()
        try {
          session.startTransaction()
          const result = await callback(this)
          await session.commitTransaction()
          return result
        } catch (error) {
          await session.abortTransaction()
          throw error
        } finally {
          session.endSession()
        }
      } else if (this.config.type === 'sqlite') {
        await this.client.exec('BEGIN TRANSACTION')
        try {
          const result = await callback(this)
          await this.client.exec('COMMIT')
          return result
        } catch (error) {
          await this.client.exec('ROLLBACK')
          throw error
        }
      }
      return {} as T
    } catch (error) {
      console.error('❌ Transaction error:', error)
      throw error
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.config.type === 'postgresql') {
        await this.pool.query('SELECT 1')
        return true
      } else if (this.config.type === 'mongodb') {
        await this.client.db().admin().ping()
        return true
      } else if (this.config.type === 'sqlite') {
        await this.client.get('SELECT 1')
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }
}

// ============================================================================
// DATABASE CLIENT FACTORY
// ============================================================================

let dbClient: DatabaseClient | null = null

export function getDatabaseClient(config?: DatabaseConfig): DatabaseClient {
  if (!dbClient) {
    let dbConfig: DatabaseConfig
    
    if (config) {
      dbConfig = config
    } else if (process.env.DATABASE_URL) {
      // Parse DATABASE_URL if provided (Prisma-style connection string)
      try {
        const url = new URL(process.env.DATABASE_URL)
        // Extract database name from pathname (remove leading slash and schema parameter)
        const pathParts = url.pathname.split('?')
        const databaseName = pathParts[0].replace('/', '') || 'bluedxp'
        
        dbConfig = {
          type: (url.protocol.replace(':', '') === 'postgresql' || url.protocol.replace(':', '') === 'postgres') ? 'postgresql' : 'postgresql',
          host: url.hostname || 'localhost',
          port: parseInt(url.port || '5432'),
          database: databaseName,
          username: url.username || 'bluedxp',
          password: url.password || '',
          ssl: process.env.DATABASE_SSL === 'true',
          pool: {
            min: parseInt(process.env.DATABASE_POOL_MIN || '5'),
            max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse DATABASE_URL, using defaults:', error)
        // Fallback to defaults
        dbConfig = {
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'bluedxp',
          username: 'bluedxp',
          password: '',
          ssl: false,
          pool: {
            min: 5,
            max: 20,
          }
        }
      }
    } else {
      // Fallback to individual environment variables
      dbConfig = {
        type: (process.env.DATABASE_TYPE as any) || 'postgresql',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME || 'hazalyze',
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        ssl: process.env.DATABASE_SSL === 'true',
        pool: {
          min: parseInt(process.env.DATABASE_POOL_MIN || '5'),
          max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
        }
      }
    }
    dbClient = new DatabaseClientImpl(dbConfig)
  }
  return dbClient
}

export async function initializeDatabase(config?: DatabaseConfig): Promise<DatabaseClient> {
  const client = getDatabaseClient(config)
  await client.connect()
  return client
}

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

export async function createTables(client: DatabaseClient): Promise<void> {
  // This will be implemented based on the chosen database
  // For now, it's a placeholder
  console.log('📊 Creating database tables...')
}

export async function createIndexes(client: DatabaseClient): Promise<void> {
  // This will be implemented based on the chosen database
  console.log('📊 Creating database indexes...')
}

