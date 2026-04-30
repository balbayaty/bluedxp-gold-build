/**
 * Job Card Component
 *
 * Displays a job with status, progress, and actions
 */

"use client";

import { Job } from "@/types/job";
import { JobStatusBadge } from "./JobStatusBadge";
import { JobProgressBar } from "./JobProgressBar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pause, Play, X, RefreshCw } from "lucide-react";

interface JobCardProps {
  job: Job;
  onCancel?: (jobId: string) => void;
  onPause?: (jobId: string) => void;
  onResume?: (jobId: string) => void;
  onRefresh?: (jobId: string) => void;
  className?: string;
}

export function JobCard({
  job,
  onCancel,
  onPause,
  onResume,
  onRefresh,
  className,
}: JobCardProps) {
  const canCancel = ["PENDING", "QUEUED", "RUNNING", "PAUSED"].includes(
    job.status,
  );
  const canPause = job.status === "RUNNING";
  const canResume = job.status === "PAUSED";
  const isRunning = ["PENDING", "QUEUED", "RUNNING", "RETRYING"].includes(
    job.status,
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{job.name}</CardTitle>
            {job.description && (
              <CardDescription className="mt-1">
                {job.description}
              </CardDescription>
            )}
          </div>
          <JobStatusBadge status={job.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          {isRunning && <JobProgressBar progress={job.progress} />}

          {/* Error */}
          {job.error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">
                Error: {job.error.message}
              </p>
              {job.error.code && (
                <p className="text-xs text-muted-foreground mt-1">
                  Code: {job.error.code}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="text-sm text-muted-foreground space-y-1">
            {job.moduleId && <p>Module: {job.moduleId}</p>}
            {job.startedAt && (
              <p>Started: {new Date(job.startedAt).toLocaleString()}</p>
            )}
            {job.duration && <p>Duration: {formatDuration(job.duration)}</p>}
            {job.retryCount > 0 && (
              <p>
                Retries: {job.retryCount} / {job.maxRetries}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={() => onRefresh(job.id)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
        {canPause && onPause && (
          <Button variant="outline" size="sm" onClick={() => onPause(job.id)}>
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        )}
        {canResume && onResume && (
          <Button variant="outline" size="sm" onClick={() => onResume(job.id)}>
            <Play className="h-4 w-4 mr-2" />
            Resume
          </Button>
        )}
        {canCancel && onCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onCancel(job.id)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
