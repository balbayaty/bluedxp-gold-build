/**
 * Job Status Badge Component
 *
 * Displays job status with appropriate styling
 */

"use client";

import { JobStatus } from "@/types/job";
import { Badge } from "@/components/ui/badge";

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const statusConfig: Record<
    JobStatus,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    PENDING: { label: "Pending", variant: "outline" },
    QUEUED: { label: "Queued", variant: "secondary" },
    RUNNING: { label: "Running", variant: "default" },
    PAUSED: { label: "Paused", variant: "outline" },
    COMPLETED: { label: "Completed", variant: "default" },
    FAILED: { label: "Failed", variant: "destructive" },
    CANCELLED: { label: "Cancelled", variant: "outline" },
    RETRYING: { label: "Retrying", variant: "secondary" },
  };

  const config = statusConfig[status] || { label: status, variant: "outline" };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
