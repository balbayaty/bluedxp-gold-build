/**
 * Global Job Monitor Component
 *
 * Floating job monitor that appears when jobs are running
 * Now uses DraggableWidget for better UX and collision prevention
 */

"use client";

import { useState, useEffect } from "react";
import { useJobList } from "@/hooks/useJob";
import { JobMonitor } from "./JobMonitor";
import { DraggableWidget } from "@/components/widgets/DraggableWidget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff } from "lucide-react";

export function GlobalJobMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { jobs } = useJobList(
    {
      status: ["PENDING", "QUEUED", "RUNNING", "RETRYING", "PAUSED"],
      limit: 10,
    },
    { pollInterval: 3000 },
  );

  const runningJobs = jobs.filter((j) =>
    ["PENDING", "QUEUED", "RUNNING", "RETRYING"].includes(j.status),
  );

  useEffect(() => {
    // Show monitor when there are running jobs
    if (runningJobs.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [runningJobs.length]);

  if (!isVisible) return null;

  // Calculate position to avoid overlapping with copilots
  const getDefaultPosition = () => {
    if (typeof window === "undefined") return { x: 100, y: 100 };
    const width = window.innerWidth;
    const height = window.innerHeight;
    const widgetWidth = 400;
    const widgetHeight = 500;
    const spacing = 20;

    // Position to the left of copilots (copilots are on the right)
    // Copilots are typically at: width - 420 (main) and width - 420*2 - spacing*2 (warehouse)
    // Job monitor should be positioned to the left of both
    const copilotWidth = 420;
    const copilotSpacing = 20;
    const totalCopilotWidth = copilotWidth * 2 + copilotSpacing * 2;

    // Position job monitor to the left of all copilots
    const x = Math.max(20, width - totalCopilotWidth - widgetWidth - spacing);
    const y = 100; // Top area, not bottom

    return { x, y };
  };

  return (
    <DraggableWidget
      widgetId="global-job-monitor"
      title={`Background Jobs (${runningJobs.length})`}
      defaultPosition={getDefaultPosition()}
      defaultSize={{ width: 400, height: 500 }}
      priority="high"
      onClose={() => setIsVisible(false)}
      minWidth={350}
      minHeight={300}
      maxWidth={600}
      maxHeight={800}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-blue-500">
              {runningJobs.length} Running
            </Badge>
            <span className="text-sm text-muted-foreground">Active Jobs</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            title={
              notificationsEnabled
                ? "Disable notifications"
                : "Enable notifications"
            }
          >
            {notificationsEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </Button>
        </div>

        <JobMonitor
          floating={false}
          maxJobs={5}
          onClose={() => setIsVisible(false)}
        />
      </div>
    </DraggableWidget>
  );
}
