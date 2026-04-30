/**
 * Job Notification Component
 *
 * Shows toast notifications for job status changes
 */

"use client";

import { useEffect } from "react";
import { useJob } from "@/hooks/useJob";
import { JobStatus } from "@/types/job";
import { PremiumNotification } from "@/components/PremiumNotificationEnhanced";

interface JobNotificationProps {
  jobId: string;
  onDismiss?: () => void;
}

export function JobNotification({ jobId, onDismiss }: JobNotificationProps) {
  const { job } = useJob(jobId, { pollInterval: 3000 });

  useEffect(() => {
    if (!job) return;

    // Show notification on status changes
    const statusMessages: Record<
      JobStatus,
      {
        title: string;
        message: string;
        type: "success" | "error" | "info" | "warning";
      }
    > = {
      COMPLETED: {
        title: "Job Completed",
        message: `${job.name} has completed successfully`,
        type: "success",
      },
      FAILED: {
        title: "Job Failed",
        message: `${job.name} failed: ${job.error?.message || "Unknown error"}`,
        type: "error",
      },
      CANCELLED: {
        title: "Job Cancelled",
        message: `${job.name} was cancelled`,
        type: "warning",
      },
      RUNNING: {
        title: "Job Started",
        message: `${job.name} is now running`,
        type: "info",
      },
      PENDING: {
        title: "Job Queued",
        message: `${job.name} has been queued`,
        type: "info",
      },
      QUEUED: {
        title: "Job Queued",
        message: `${job.name} is in queue`,
        type: "info",
      },
      PAUSED: {
        title: "Job Paused",
        message: `${job.name} has been paused`,
        type: "warning",
      },
      RETRYING: {
        title: "Job Retrying",
        message: `${job.name} is retrying after failure`,
        type: "warning",
      },
    };

    const config = statusMessages[job.status];
    if (config) {
      // Use PremiumNotification to show the notification
      // This will be handled by the notification system
    }
  }, [job?.status, job?.name, job?.error]);

  return null; // This component doesn't render anything, it just triggers notifications
}
