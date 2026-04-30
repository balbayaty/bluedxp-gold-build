/**
 * Job Progress Bar Component
 *
 * Displays job progress with percentage and message
 */

"use client";

import { JobProgress } from "@/types/job";
import { Progress } from "@/components/ui/progress";

interface JobProgressBarProps {
  progress: JobProgress;
  className?: string;
  showDetails?: boolean;
}

export function JobProgressBar({
  progress,
  className,
  showDetails = true,
}: JobProgressBarProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {progress.percentage.toFixed(0)}%
        </span>
        {progress.total > 0 && (
          <span className="text-sm text-muted-foreground">
            {progress.current} / {progress.total}
          </span>
        )}
      </div>
      <Progress value={progress.percentage} className="h-2" />
      {showDetails && progress.message && (
        <p className="text-sm text-muted-foreground mt-2">{progress.message}</p>
      )}
      {showDetails && progress.stage && (
        <p className="text-xs text-muted-foreground mt-1">
          Stage: {progress.stage}
        </p>
      )}
    </div>
  );
}
