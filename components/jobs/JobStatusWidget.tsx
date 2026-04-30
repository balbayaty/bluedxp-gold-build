/**
 * Job Status Widget for Sidebar
 *
 * Compact widget showing running jobs count
 */

"use client";

import { useJobList } from "@/hooks/useJob";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function JobStatusWidget() {
  const router = useRouter();
  const { jobs } = useJobList(
    {
      status: ["PENDING", "QUEUED", "RUNNING", "RETRYING"],
      limit: 5,
    },
    { pollInterval: 5000 },
  );

  const runningCount = jobs.length;

  if (runningCount === 0) return null;

  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => router.push("/jobs")}
      >
        <div className="flex items-center gap-2 w-full">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="flex-1 text-left">Background Jobs</span>
          <Badge variant="default" className="bg-blue-500">
            {runningCount}
          </Badge>
        </div>
      </Button>
      {jobs.length > 0 && (
        <div className="mt-2 space-y-1">
          {jobs.slice(0, 3).map((job) => (
            <div
              key={job.id}
              className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => router.push(`/jobs?jobId=${job.id}`)}
            >
              <div className="flex items-center justify-between">
                <span className="truncate flex-1">{job.name}</span>
                <span className="ml-2">{job.progress.percentage}%</span>
              </div>
            </div>
          ))}
          {jobs.length > 3 && (
            <div className="text-xs text-muted-foreground px-2 py-1 text-center">
              +{jobs.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
