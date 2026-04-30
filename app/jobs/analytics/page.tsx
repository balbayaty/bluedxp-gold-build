/**
 * Job Analytics Dashboard
 *
 * Analytics and insights for background jobs
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { useJobList } from "@/hooks/useJob";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { JobStatus, JobType } from "@/types/job";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function JobAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );
  const { jobs, loading } = useJobList(
    {
      limit: 1000,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    { pollInterval: 30000 },
  );

  // Filter by time range
  const filteredJobs = jobs.filter((job) => {
    if (timeRange === "all") return true;
    const jobDate = new Date(job.createdAt);
    const now = new Date();
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return jobDate >= new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  });

  // Calculate statistics
  const stats = {
    total: filteredJobs.length,
    completed: filteredJobs.filter((j) => j.status === "COMPLETED").length,
    failed: filteredJobs.filter((j) => j.status === "FAILED").length,
    running: filteredJobs.filter((j) =>
      ["PENDING", "QUEUED", "RUNNING", "RETRYING"].includes(j.status),
    ).length,
    averageDuration: calculateAverageDuration(filteredJobs),
    successRate:
      filteredJobs.length > 0
        ? (filteredJobs.filter((j) => j.status === "COMPLETED").length /
            filteredJobs.length) *
          100
        : 0,
  };

  // Jobs by status
  const jobsByStatus = [
    { name: "Completed", value: stats.completed, color: COLORS[1] },
    { name: "Failed", value: stats.failed, color: COLORS[3] },
    { name: "Running", value: stats.running, color: COLORS[0] },
    {
      name: "Cancelled",
      value: filteredJobs.filter((j) => j.status === "CANCELLED").length,
      color: COLORS[2],
    },
  ];

  // Jobs by type
  const jobsByType = Object.entries(
    filteredJobs.reduce(
      (acc, job) => {
        acc[job.type] = (acc[job.type] || 0) + 1;
        return acc;
      },
      {} as Record<JobType, number>,
    ),
  ).map(([type, count]) => ({ type, count }));

  // Jobs over time (daily)
  const jobsOverTime = calculateJobsOverTime(filteredJobs);

  // Performance metrics
  const performanceMetrics = calculatePerformanceMetrics(filteredJobs);

  return (
    <PageTemplate
      title="Job Analytics"
      description="Analytics and insights for background job processing"
      icon="ri-bar-chart-line"
    >
      <div className="space-y-6">
        {/* Time Range Selector */}
        <Card>
          <CardContent className="pt-6">
            <Tabs
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as any)}
            >
              <TabsList>
                <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
                <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
                <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.successRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.averageDuration)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Currently Running
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.running}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jobs by Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Status</CardTitle>
              <CardDescription>Distribution of job statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={jobsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {jobsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Jobs by Type Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Type</CardTitle>
              <CardDescription>Number of jobs by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs Over Time</CardTitle>
            <CardDescription>Job creation trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={jobsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  name="Completed"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Average Processing Time
                </p>
                <p className="text-2xl font-bold">
                  {formatDuration(performanceMetrics.avgProcessingTime)}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Fastest Job</p>
                <p className="text-2xl font-bold">
                  {formatDuration(performanceMetrics.fastestJob)}
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Slowest Job</p>
                <p className="text-2xl font-bold">
                  {formatDuration(performanceMetrics.slowestJob)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}

// Helper functions
function calculateAverageDuration(jobs: any[]): number {
  const completedJobs = jobs.filter(
    (j) => j.status === "COMPLETED" && j.duration,
  );
  if (completedJobs.length === 0) return 0;
  const total = completedJobs.reduce((sum, j) => sum + (j.duration || 0), 0);
  return total / completedJobs.length;
}

function calculateJobsOverTime(jobs: any[]): any[] {
  const byDate = new Map<
    string,
    { total: number; completed: number; failed: number }
  >();

  jobs.forEach((job) => {
    const date = new Date(job.createdAt).toISOString().split("T")[0];
    const existing = byDate.get(date) || { total: 0, completed: 0, failed: 0 };
    existing.total++;
    if (job.status === "COMPLETED") existing.completed++;
    if (job.status === "FAILED") existing.failed++;
    byDate.set(date, existing);
  });

  return Array.from(byDate.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculatePerformanceMetrics(jobs: any[]): {
  avgProcessingTime: number;
  fastestJob: number;
  slowestJob: number;
} {
  const completedJobs = jobs.filter(
    (j) => j.status === "COMPLETED" && j.duration,
  );
  if (completedJobs.length === 0) {
    return { avgProcessingTime: 0, fastestJob: 0, slowestJob: 0 };
  }

  const durations = completedJobs.map((j) => j.duration || 0);
  return {
    avgProcessingTime: durations.reduce((a, b) => a + b, 0) / durations.length,
    fastestJob: Math.min(...durations),
    slowestJob: Math.max(...durations),
  };
}

function formatDuration(ms: number): string {
  if (ms === 0) return "0s";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
