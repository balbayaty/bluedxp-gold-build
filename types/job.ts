/**
 * Background Job Processing Types
 * 
 * Enables long-running operations that persist across page navigation.
 * Jobs run server-side and can be monitored from any page/module.
 */

// ============================================================================
// JOB STATUS & TYPES
// ============================================================================

export type JobStatus = 
  | 'PENDING'      // Job queued, waiting to start
  | 'QUEUED'       // Job in queue, ready to process
  | 'RUNNING'      // Job currently executing
  | 'PAUSED'       // Job paused (can be resumed)
  | 'COMPLETED'    // Job finished successfully
  | 'FAILED'       // Job failed with error
  | 'CANCELLED'    // Job cancelled by user
  | 'RETRYING'     // Job failed, retrying

export type JobType = 
  | 'BATCH_PROCESSING'      // Batch data processing
  | 'DATA_EXPORT'           // Export large datasets
  | 'DATA_IMPORT'           // Import large datasets
  | 'REPORT_GENERATION'     // Generate reports
  | 'ANALYTICS_PROCESSING' // Process analytics
  | 'SYNC_OPERATION'        // Sync with external systems
  | 'BACKUP_OPERATION'      // Backup operations
  | 'CLEANUP_OPERATION'     // Cleanup operations
  | 'CUSTOM'                // Custom job type

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

// ============================================================================
// JOB INTERFACE
// ============================================================================

export interface Job {
  id: string
  tenantId: string
  userId: string
  
  // Job identification
  type: JobType
  name: string
  description?: string
  
  // Status tracking
  status: JobStatus
  priority: JobPriority
  
  // Progress tracking
  progress: JobProgress
  
  // Execution details
  startedAt?: Date | string
  completedAt?: Date | string
  estimatedCompletion?: Date | string
  duration?: number // milliseconds
  
  // Error handling
  error?: JobError
  retryCount: number
  maxRetries: number
  
  // Job data
  input: Record<string, any> // Job input parameters
  output?: Record<string, any> // Job output/result
  metadata?: Record<string, any> // Additional metadata
  
  // Module/context
  moduleId?: string // Which module created this job
  context?: Record<string, any> // Context information
  
  // Timestamps
  createdAt: Date | string
  updatedAt: Date | string
}

export interface JobProgress {
  current: number // Current step/item
  total: number // Total steps/items
  percentage: number // 0-100
  message?: string // Current status message
  stage?: string // Current processing stage
  details?: Record<string, any> // Additional progress details
}

export interface JobError {
  code: string
  message: string
  stack?: string
  details?: Record<string, any>
  timestamp: Date | string
}

// ============================================================================
// JOB CREATION
// ============================================================================

export interface CreateJobRequest {
  type: JobType
  name: string
  description?: string
  priority?: JobPriority
  input: Record<string, any>
  moduleId?: string
  context?: Record<string, any>
  maxRetries?: number
  estimatedDuration?: number // milliseconds
}

export interface CreateJobResponse {
  job: Job
  success: boolean
  error?: string
}

// ============================================================================
// JOB QUERY
// ============================================================================

export interface JobQuery {
  status?: JobStatus[]
  type?: JobType[]
  moduleId?: string
  userId?: string
  createdAfter?: Date | string
  createdBefore?: Date | string
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface JobListResponse {
  jobs: Job[]
  total: number
  limit: number
  offset: number
}

// ============================================================================
// JOB OPERATIONS
// ============================================================================

export interface JobOperationResponse {
  success: boolean
  job?: Job
  error?: string
}

// ============================================================================
// JOB HANDLER INTERFACE
// ============================================================================

export interface JobHandler {
  /**
   * Unique job type this handler processes
   */
  type: JobType
  
  /**
   * Process the job
   * @param job The job to process
   * @param onProgress Callback to report progress
   * @returns Job output/result
   */
  process(
    job: Job,
    onProgress: (progress: JobProgress) => Promise<void>
  ): Promise<Record<string, any>>
  
  /**
   * Validate job input before processing
   * @param input Job input
   * @returns Validation result
   */
  validate?(input: Record<string, any>): Promise<{ valid: boolean; error?: string }>
  
  /**
   * Cleanup resources after job completion/failure
   * @param job The job
   */
  cleanup?(job: Job): Promise<void>
  
  /**
   * Estimate job duration
   * @param input Job input
   * @returns Estimated duration in milliseconds
   */
  estimateDuration?(input: Record<string, any>): Promise<number>
}

// ============================================================================
// JOB NOTIFICATION
// ============================================================================

export interface JobNotification {
  jobId: string
  status: JobStatus
  progress?: JobProgress
  error?: JobError
  timestamp: Date | string
}

