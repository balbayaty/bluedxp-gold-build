# Background Job Processing System

## Overview

The Background Job Processing System allows you to run long-running operations that **continue processing even when you navigate between pages or modules**. Jobs are stored in the database and processed server-side, so they persist across navigation.

## Key Features

✅ **Persistent Processing** - Jobs continue running when you navigate away  
✅ **Progress Tracking** - Real-time progress updates with percentage and messages  
✅ **Error Handling** - Automatic retries with exponential backoff  
✅ **Priority Support** - Process high-priority jobs first  
✅ **Multi-Tenant** - Full tenant isolation  
✅ **Real-Time Updates** - Polling-based status updates  
✅ **Job Management** - Pause, resume, and cancel jobs  

## How It Works

1. **Create a Job** - Submit a job request with input data
2. **Job Queued** - Job is stored in database with status `PENDING`
3. **Background Processing** - Worker picks up job and processes it
4. **Progress Updates** - Job reports progress as it runs
5. **Completion** - Job completes and stores results

## Usage Guide

### Step 1: Register a Job Handler

First, create a job handler for your specific job type:

```typescript
// lib/services/job-queue/handlers/myHandler.ts
import { JobHandler, JobProgress } from '@/types/job'

export const myJobHandler: JobHandler = {
  type: 'BATCH_PROCESSING', // Your job type
  
  async validate(input: Record<string, any>) {
    // Validate input before processing
    if (!input.items) {
      return { valid: false, error: 'Items required' }
    }
    return { valid: true }
  },
  
  async process(job, onProgress) {
    const items = job.input.items
    
    // Report progress
    await onProgress({
      current: 0,
      total: items.length,
      percentage: 0,
      message: 'Starting...',
    })
    
    // Process items
    for (let i = 0; i < items.length; i++) {
      // Your processing logic
      await processItem(items[i])
      
      // Update progress
      await onProgress({
        current: i + 1,
        total: items.length,
        percentage: Math.round(((i + 1) / items.length) * 100),
        message: `Processing item ${i + 1} of ${items.length}`,
      })
    }
    
    // Return result
    return { processed: items.length }
  },
}
```

Then register it when your app starts:

```typescript
// app/layout.tsx or app/api/route.ts
import { jobQueue } from '@/lib/services/job-queue'
import { myJobHandler } from '@/lib/services/job-queue/handlers/myHandler'

jobQueue.registerHandler(myJobHandler)
```

### Step 2: Create a Job from Your Code

Use the `useCreateJob` hook in your React components:

```typescript
'use client'

import { useCreateJob } from '@/hooks/useJob'

export function MyComponent() {
  const { create, loading, error, job } = useCreateJob()
  
  const handleStartProcessing = async () => {
    try {
      const newJob = await create({
        type: 'BATCH_PROCESSING',
        name: 'Process Items',
        description: 'Processing 1000 items',
        priority: 'NORMAL',
        input: {
          items: [...], // Your data
          batchSize: 10,
        },
        moduleId: 'wms', // Optional: which module
      })
      
      console.log('Job created:', newJob.id)
    } catch (err) {
      console.error('Failed to create job:', err)
    }
  }
  
  return (
    <button onClick={handleStartProcessing} disabled={loading}>
      Start Processing
    </button>
  )
}
```

### Step 3: Monitor Job Progress

Use the `useJob` hook to monitor a specific job:

```typescript
'use client'

import { useJob } from '@/hooks/useJob'
import { JobCard } from '@/components/jobs/JobCard'

export function JobStatus({ jobId }: { jobId: string }) {
  const { job, loading, cancel, pause, resume } = useJob(jobId)
  
  if (loading) return <div>Loading...</div>
  if (!job) return <div>Job not found</div>
  
  return (
    <JobCard
      job={job}
      onCancel={cancel}
      onPause={pause}
      onResume={resume}
    />
  )
}
```

### Step 4: Show Job Monitor (Optional)

Add a job monitor component to show all running jobs:

```typescript
'use client'

import { JobMonitor } from '@/components/jobs/JobMonitor'

export function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      
      {/* Floating job monitor */}
      <JobMonitor
        floating={true}
        moduleId="wms" // Optional: filter by module
        maxJobs={5}
      />
    </div>
  )
}
```

## API Reference

### Creating Jobs

```typescript
POST /api/jobs
Content-Type: application/json

{
  "type": "BATCH_PROCESSING",
  "name": "Process Items",
  "description": "Optional description",
  "priority": "NORMAL", // LOW, NORMAL, HIGH, URGENT
  "input": { /* Your job input */ },
  "moduleId": "wms", // Optional
  "maxRetries": 3 // Optional, default 3
}
```

### Getting Job Status

```typescript
GET /api/jobs/[jobId]
```

### Listing Jobs

```typescript
GET /api/jobs?status=RUNNING&moduleId=wms&limit=10
```

### Cancelling a Job

```typescript
DELETE /api/jobs/[jobId]
```

### Pausing a Job

```typescript
POST /api/jobs/[jobId]/pause
```

### Resuming a Job

```typescript
POST /api/jobs/[jobId]/resume
```

## Job Types

Predefined job types:
- `BATCH_PROCESSING` - Batch data processing
- `DATA_EXPORT` - Export large datasets
- `DATA_IMPORT` - Import large datasets
- `REPORT_GENERATION` - Generate reports
- `ANALYTICS_PROCESSING` - Process analytics
- `SYNC_OPERATION` - Sync with external systems
- `BACKUP_OPERATION` - Backup operations
- `CLEANUP_OPERATION` - Cleanup operations
- `CUSTOM` - Custom job type

## Job Statuses

- `PENDING` - Job created, waiting to start
- `QUEUED` - Job in queue, ready to process
- `RUNNING` - Job currently executing
- `PAUSED` - Job paused (can be resumed)
- `COMPLETED` - Job finished successfully
- `FAILED` - Job failed with error
- `CANCELLED` - Job cancelled by user
- `RETRYING` - Job failed, retrying

## Best Practices

1. **Always validate input** - Implement `validate()` in your handler
2. **Report progress frequently** - Update progress every few items/operations
3. **Handle errors gracefully** - Let the system retry on transient errors
4. **Estimate duration** - Implement `estimateDuration()` for better UX
5. **Clean up resources** - Implement `cleanup()` to free resources
6. **Use appropriate priorities** - Use `URGENT` sparingly
7. **Monitor job limits** - Don't create too many concurrent jobs

## Example: Batch Export

```typescript
export const exportHandler: JobHandler = {
  type: 'DATA_EXPORT',
  
  async process(job, onProgress) {
    const { format, filters } = job.input
    const totalRecords = await getRecordCount(filters)
    
    await onProgress({
      current: 0,
      total: totalRecords,
      percentage: 0,
      message: 'Preparing export...',
    })
    
    const records = []
    let processed = 0
    
    for await (const record of streamRecords(filters)) {
      records.push(record)
      processed++
      
      if (records.length >= 1000) {
        // Flush batch
        await writeBatch(records, format)
        records.length = 0
      }
      
      await onProgress({
        current: processed,
        total: totalRecords,
        percentage: Math.round((processed / totalRecords) * 100),
        message: `Exported ${processed} of ${totalRecords} records`,
      })
    }
    
    // Final flush
    if (records.length > 0) {
      await writeBatch(records, format)
    }
    
    const fileUrl = await finalizeExport(format)
    
    return { fileUrl, totalRecords: processed }
  },
}
```

## Troubleshooting

**Job stuck in PENDING?**
- Check that a handler is registered for the job type
- Check server logs for errors

**Job keeps failing?**
- Check error details in job output
- Verify input validation
- Check retry count vs max retries

**Progress not updating?**
- Ensure `onProgress` is called regularly
- Check network connectivity
- Verify polling interval in hook

## Database Migration

After adding the Job model to Prisma schema, run:

```bash
npx prisma migrate dev --name add_job_processing
```

This will create the `jobs` table in your database.

