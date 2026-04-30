/**
 * Job Monitor Component
 *
 * Displays a list of jobs with real-time updates
 * Can be used as a floating panel or inline component
 */

"use client";

import { useState } from "react";
import { useJobList } from "@/hooks/useJob";
import { JobCard } from "./JobCard";
import { useJob } from "@/hooks/useJob";
import { JobQuery, JobStatus } from "@/types/job";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface JobMonitorProps {
  /**
   * Show only jobs for specific module
   */
  moduleId?: string;

  /**
   * Show only jobs for current user
   */
  userId?: string;

  /**
   * Show as floating panel
   */
  floating?: boolean;

  /**
   * Callback when monitor is closed
   */
  onClose?: () => void;

  /**
   * Maximum number of jobs to show
   */
  maxJobs?: number;
}

export function JobMonitor({
  moduleId,
  userId,
  floating = false,
  onClose,
  maxJobs = 10,
}: JobMonitorProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "running" | "completed" | "failed"
  >("running");

  const getQuery = (): JobQuery => {
    const baseQuery: JobQuery = {
      limit: maxJobs,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    if (moduleId) baseQuery.moduleId = moduleId;
    if (userId) baseQuery.userId = userId;

    switch (activeTab) {
      case "running":
        baseQuery.status = [
          "PENDING",
          "QUEUED",
          "RUNNING",
          "RETRYING",
          "PAUSED",
        ];
        break;
      case "completed":
        baseQuery.status = ["COMPLETED"];
        break;
      case "failed":
        baseQuery.status = ["FAILED", "CANCELLED"];
        break;
      default:
        // All jobs
        break;
    }

    return baseQuery;
  };

  const { jobs, loading, error, refresh } = useJobList(getQuery(), {
    pollInterval: 3000, // Poll every 3 seconds for running jobs
  });

  const handleCancel = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      refresh();
    } catch (err) {
      console.error("Error cancelling job:", err);
    }
  };

  const handlePause = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/pause`, { method: "POST" });
      refresh();
    } catch (err) {
      console.error("Error pausing job:", err);
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/resume`, { method: "POST" });
      refresh();
    } catch (err) {
      console.error("Error resuming job:", err);
    }
  };

  const runningJobs = jobs.filter((j) =>
    ["PENDING", "QUEUED", "RUNNING", "RETRYING", "PAUSED"].includes(j.status),
  );

  const content = (
    <Card className={floating ? "w-full max-w-2xl" : "w-full"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Background Jobs</CardTitle>
            <CardDescription>
              Monitor and manage background processing tasks
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="running">
              Running ({runningJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading jobs...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-destructive">
                Error: {error}
              </div>
            )}

            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No jobs found
              </div>
            )}

            {!loading && !error && jobs.length > 0 && (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onCancel={handleCancel}
                    onPause={handlePause}
                    onResume={handleResume}
                    onRefresh={refresh}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  if (floating) {
    return (
      <div className="fixed bottom-4 right-4 z-50 shadow-lg">{content}</div>
    );
  }

  return content;
}
