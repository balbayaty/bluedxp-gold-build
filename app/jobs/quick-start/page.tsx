/**
 * Quick Start Guide for Job Processing
 *
 * Interactive guide showing users how to use the job processing system
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateJob } from "@/hooks/useJob";
import { useRouter } from "next/navigation";
import {
  Play,
  FileText,
  BarChart3,
  Settings,
  CheckCircle2,
  ArrowRight,
  Download,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useNotificationHelpers } from "@/components/PremiumNotificationEnhanced";

export default function QuickStartPage() {
  const router = useRouter();
  const { create, loading } = useCreateJob();
  const [demoJobId, setDemoJobId] = useState<string | null>(null);
  const notifications = useNotificationHelpers();

  const handleCreateDemoJob = async () => {
    try {
      const job = await create({
        type: "BATCH_PROCESSING",
        name: "Demo: Process Sample Data",
        description:
          "This is a demo job to show you how background processing works",
        priority: "NORMAL",
        input: {
          shipmentIds: ["demo-1", "demo-2", "demo-3"],
          operation: "validate",
        },
        moduleId: "tms",
      });

      setDemoJobId(job.id);
      notifications.success(
        "Demo Job Created!",
        "Check the floating monitor in the bottom-right corner to see it running!",
      );

      // Redirect to jobs page after a moment
      setTimeout(() => {
        router.push(`/jobs?jobId=${job.id}`);
      }, 2000);
    } catch (error) {
      notifications.error(
        "Failed to Create Demo Job",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };

  const steps = [
    {
      icon: Play,
      title: "Create a Job",
      description: "Start a background job from any page",
      action: "Try Demo Job",
      onClick: handleCreateDemoJob,
      color: "blue",
    },
    {
      icon: FileText,
      title: "Monitor Progress",
      description: "Watch jobs run in real-time",
      action: "View Jobs",
      onClick: () => router.push("/jobs"),
      color: "green",
    },
    {
      icon: BarChart3,
      title: "View Analytics",
      description: "See job performance and trends",
      action: "Analytics",
      onClick: () => router.push("/jobs/analytics"),
      color: "purple",
    },
    {
      icon: Settings,
      title: "Manage Jobs",
      description: "Pause, resume, or cancel jobs",
      action: "Manage",
      onClick: () => router.push("/jobs"),
      color: "orange",
    },
  ];

  return (
    <PageTemplate
      title="Background Jobs - Quick Start"
      description="Learn how to use the background job processing system"
      icon="ri-rocket-line"
    >
      <div className="space-y-6">
        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-8 w-8" />
              <CardTitle className="text-3xl">
                Background Job Processing
              </CardTitle>
            </div>
            <CardDescription className="text-blue-100 text-lg">
              Process long-running tasks that continue even when you navigate
              away
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="bg-white/20 text-white">
                ✅ Persistent Processing
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                ✅ Real-Time Updates
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                ✅ Error Handling
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                ✅ Analytics Dashboard
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Steps */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={step.onClick}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-lg bg-${step.color}-100 dark:bg-${step.color}-900/20`}
                      >
                        <Icon
                          className={`h-6 w-6 text-${step.color}-600 dark:text-${step.color}-400`}
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        step.onClick();
                      }}
                      disabled={loading && step.action === "Try Demo Job"}
                    >
                      {step.action}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Key Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Persistent Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Jobs continue running even when you navigate to other pages
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Real-Time Progress</h4>
                  <p className="text-sm text-muted-foreground">
                    See progress updates every few seconds with percentage and
                    messages
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Error Handling</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatic retries with exponential backoff on failures
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Job Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Pause, resume, or cancel jobs at any time
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Where to Find */}
        <Card>
          <CardHeader>
            <CardTitle>Where to Find Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl">📍</div>
              <div>
                <h4 className="font-medium">Floating Monitor</h4>
                <p className="text-sm text-muted-foreground">
                  Bottom-right corner - appears automatically when jobs are
                  running
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl">📊</div>
              <div>
                <h4 className="font-medium">Jobs Page</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to{" "}
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    /jobs
                  </code>{" "}
                  to see all jobs
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-1"
                  onClick={() => router.push("/jobs")}
                >
                  Go to Jobs Page →
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl">📈</div>
              <div>
                <h4 className="font-medium">Analytics Dashboard</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to{" "}
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    /jobs/analytics
                  </code>{" "}
                  for insights
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-1"
                  onClick={() => router.push("/jobs/analytics")}
                >
                  View Analytics →
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl">🔔</div>
              <div>
                <h4 className="font-medium">Sidebar Widget</h4>
                <p className="text-sm text-muted-foreground">
                  Check the sidebar for running jobs count
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Job Status */}
        {demoJobId && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-400">
                ✅ Demo Job Created!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Your demo job is now running. Check the floating monitor in the
                bottom-right corner, or view it on the jobs page.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/jobs?jobId=${demoJobId}`)}
                  variant="default"
                >
                  View Job Details
                </Button>
                <Button onClick={() => router.push("/jobs")} variant="outline">
                  All Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTemplate>
  );
}
