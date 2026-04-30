/**
 * Jobs Management Page
 *
 * Central hub for managing all background jobs
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import { JobMonitor } from "@/components/jobs/JobMonitor";
import { useJobList, useCreateJob } from "@/hooks/useJob";
import { JobQuery, JobType, JobPriority } from "@/types/job";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Download,
  Upload,
  FileText,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<
    "all" | "running" | "completed" | "failed"
  >("all");
  const [filterType, setFilterType] = useState<JobType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { create, loading: creating } = useCreateJob();

  const getQuery = (): JobQuery => {
    const baseQuery: JobQuery = {
      limit: 50,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    if (filterType !== "all") {
      baseQuery.type = [filterType];
    }

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
    }

    return baseQuery;
  };

  const { jobs, loading, error, refresh, total } = useJobList(getQuery(), {
    pollInterval: activeTab === "running" ? 3000 : 10000,
  });

  const filteredJobs = jobs.filter(
    (job) =>
      searchQuery === "" ||
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateExport = async () => {
    try {
      await create({
        type: "DATA_EXPORT",
        name: "Transportation Data Export",
        description: "Export transportation data to Excel",
        priority: "NORMAL",
        input: {
          format: "EXCEL",
          dataType: "shipments",
          filters: {},
        },
        moduleId: "tms",
      });
    } catch (err) {
      console.error("Failed to create export job:", err);
    }
  };

  const handleCreateBatch = async () => {
    try {
      await create({
        type: "BATCH_PROCESSING",
        name: "Batch Shipment Processing",
        description: "Process multiple shipments",
        priority: "NORMAL",
        input: {
          shipmentIds: [], // Would be selected from UI
          operation: "validate",
        },
        moduleId: "tms",
      });
    } catch (err) {
      console.error("Failed to create batch job:", err);
    }
  };

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

  const stats = {
    total: jobs.length,
    running: jobs.filter((j) =>
      ["PENDING", "QUEUED", "RUNNING", "RETRYING"].includes(j.status),
    ).length,
    completed: jobs.filter((j) => j.status === "COMPLETED").length,
    failed: jobs.filter((j) => ["FAILED", "CANCELLED"].includes(j.status))
      .length,
  };

  return (
    <PageTemplate
      title="Background Jobs"
      description="Manage and monitor background processing tasks"
      icon="ri-task-line"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
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
                Running
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.running}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.failed}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Create common background jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={handleCreateExport}
                disabled={creating}
              >
                <Download className="h-5 w-5 mb-2" />
                <span className="font-medium">Export Data</span>
                <span className="text-xs text-muted-foreground">
                  Export to Excel/PDF/CSV
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={handleCreateBatch}
                disabled={creating}
              >
                <RefreshCw className="h-5 w-5 mb-2" />
                <span className="font-medium">Batch Process</span>
                <span className="text-xs text-muted-foreground">
                  Process multiple items
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                disabled
              >
                <BarChart3 className="h-5 w-5 mb-2" />
                <span className="font-medium">Generate Report</span>
                <span className="text-xs text-muted-foreground">
                  Coming soon
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Jobs</Label>
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="type">Job Type</Label>
                <Select
                  value={filterType}
                  onValueChange={(v) => setFilterType(v as any)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="BATCH_PROCESSING">
                      Batch Processing
                    </SelectItem>
                    <SelectItem value="DATA_EXPORT">Data Export</SelectItem>
                    <SelectItem value="DATA_IMPORT">Data Import</SelectItem>
                    <SelectItem value="REPORT_GENERATION">
                      Report Generation
                    </SelectItem>
                    <SelectItem value="ANALYTICS_PROCESSING">
                      Analytics
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="running">Running ({stats.running})</TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="failed">Failed ({stats.failed})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading && (
              <div className="text-center py-12 text-muted-foreground">
                Loading jobs...
              </div>
            )}

            {error && (
              <div className="text-center py-12 text-destructive">
                Error: {error}
              </div>
            )}

            {!loading && !error && filteredJobs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No jobs found</p>
                <p className="text-sm mt-2">
                  Create a job using the quick actions above
                </p>
              </div>
            )}

            {!loading && !error && filteredJobs.length > 0 && (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
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
      </div>
    </PageTemplate>
  );
}
