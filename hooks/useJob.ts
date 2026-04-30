/**
 * React Hook for Job Management
 * 
 * Provides easy access to job operations and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Job, JobStatus, CreateJobRequest, JobQuery } from '@/types/job'

// ============================================================================
// USE JOB HOOK - Monitor a specific job
// ============================================================================

export function useJob(jobId: string | null, options?: { pollInterval?: number }) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pollInterval = options?.pollInterval || 2000 // Default 2 seconds

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setJob(null)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job')
      }
      const data = await response.json()
      setJob(data.job)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchJob()

    // Poll for updates if job is still running
    if (jobId && job?.status && ['PENDING', 'QUEUED', 'RUNNING', 'RETRYING'].includes(job.status)) {
      const interval = setInterval(fetchJob, pollInterval)
      return () => clearInterval(interval)
    }
  }, [jobId, job?.status, fetchJob, pollInterval])

  const cancel = useCallback(async () => {
    if (!jobId) return false

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to cancel job')
      await fetchJob()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }, [jobId, fetchJob])

  const pause = useCallback(async () => {
    if (!jobId) return false

    try {
      const response = await fetch(`/api/jobs/${jobId}/pause`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to pause job')
      await fetchJob()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }, [jobId, fetchJob])

  const resume = useCallback(async () => {
    if (!jobId) return false

    try {
      const response = await fetch(`/api/jobs/${jobId}/resume`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to resume job')
      await fetchJob()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }, [jobId, fetchJob])

  return {
    job,
    loading,
    error,
    cancel,
    pause,
    resume,
    refresh: fetchJob,
  }
}

// ============================================================================
// USE JOB LIST HOOK - List and filter jobs
// ============================================================================

export function useJobList(query?: JobQuery, options?: { pollInterval?: number }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const pollInterval = options?.pollInterval || 5000 // Default 5 seconds

  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (query?.status) params.append('status', query.status.join(','))
      if (query?.type) params.append('type', query.type.join(','))
      if (query?.moduleId) params.append('moduleId', query.moduleId)
      if (query?.userId) params.append('userId', query.userId)
      if (query?.createdAfter) params.append('createdAfter', query.createdAfter.toString())
      if (query?.createdBefore) params.append('createdBefore', query.createdBefore.toString())
      if (query?.limit) params.append('limit', query.limit.toString())
      if (query?.offset) params.append('offset', query.offset.toString())
      if (query?.sortBy) params.append('sortBy', query.sortBy)
      if (query?.sortOrder) params.append('sortOrder', query.sortOrder)

      const response = await fetch(`/api/jobs?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch jobs')
      const data = await response.json()
      setJobs(data.jobs)
      setTotal(data.total)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [query])

  // Track previous job statuses to detect changes
  const prevJobsRef = useRef<Map<string, { status: JobStatus; lastSeen: number }>>(new Map())

  useEffect(() => {
    fetchJobs()

    // Poll for updates if there are running jobs
    const hasRunningJobs = jobs.some(j => 
      ['PENDING', 'QUEUED', 'RUNNING', 'RETRYING'].includes(j.status)
    )

    if (hasRunningJobs) {
      const interval = setInterval(fetchJobs, pollInterval)
      return () => clearInterval(interval)
    }
  }, [query, fetchJobs, pollInterval, jobs])

  // Detect job completion and show notifications
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!(window as any).showJobCompletion) return

    const now = Date.now()
    const jobsToCheck = new Set<string>()

    // Check each job for status changes
    jobs.forEach((job) => {
      jobsToCheck.add(job.id)
      const prevData = prevJobsRef.current.get(job.id)
      const prevStatus = prevData?.status
      const currentStatus = job.status

      // Detect transition to COMPLETED
      if (
        currentStatus === 'COMPLETED' &&
        prevStatus !== 'COMPLETED' &&
        prevStatus && // Only if we've seen this job before (was running)
        job.completedAt
      ) {
        // Prevent duplicate notifications
        const notificationKey = `job-completed-${job.id}`
        try {
          const alreadyShown = sessionStorage.getItem(notificationKey)
          if (alreadyShown) {
            // Update tracking and continue
            prevJobsRef.current.set(job.id, { status: currentStatus, lastSeen: now })
            return
          }

          // Calculate analytics
          const duration = job.duration || 0
          const estimatedDuration = job.estimatedCompletion && job.startedAt
            ? new Date(job.estimatedCompletion).getTime() - new Date(job.startedAt).getTime()
            : undefined

          // Show notification
          ;(window as any).showJobCompletion(job.name, duration, estimatedDuration)
          
          // Mark as shown
          sessionStorage.setItem(notificationKey, 'true')
        } catch (error) {
          // Silently fail - notifications are nice-to-have
          console.warn('Failed to show job completion notification:', error)
        }
      }

      // Update previous status
      prevJobsRef.current.set(job.id, { status: currentStatus, lastSeen: now })
    })

    // Clean up old job tracking (jobs that disappeared from list)
    // Keep tracking for 30 seconds after they disappear to catch completions
    prevJobsRef.current.forEach((data, jobId) => {
      if (!jobsToCheck.has(jobId) && now - data.lastSeen > 30000) {
        prevJobsRef.current.delete(jobId)
      }
    })
  }, [jobs])

  return {
    jobs,
    loading,
    error,
    total,
    refresh: fetchJobs,
  }
}

// ============================================================================
// USE CREATE JOB HOOK - Create a new job
// ============================================================================

export function useCreateJob() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)

  const create = useCallback(async (request: CreateJobRequest) => {
    setLoading(true)
    setError(null)
    setJob(null)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create job')
      }

      const data = await response.json()
      setJob(data.job)
      return data.job
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    create,
    loading,
    error,
    job,
  }
}

