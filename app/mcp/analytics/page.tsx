/**
 * MCP Analytics Dashboard
 *
 * Visual dashboard for MCP tool analytics and performance
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ToolAnalytics {
  executionCount: number;
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
}

interface ServerStats {
  totalTools: number;
  toolsByCategory: Record<string, number>;
  totalExecutions: number;
  averageExecutionTime: number;
  toolsByStatus: Record<string, number>;
}

export default function MCPAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Record<string, ToolAnalytics>>({});
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const response = await fetch("/api/mcp/analytics");
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics || {});
        setStats(data.summary || null);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  const topTools = Object.entries(analytics)
    .sort((a, b) => b[1].executionCount - a[1].executionCount)
    .slice(0, 10);

  const slowestTools = Object.entries(analytics)
    .sort((a, b) => b[1].averageExecutionTime - a[1].averageExecutionTime)
    .slice(0, 10);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MCP Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor MCP tool performance and usage
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTools}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.totalExecutions.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avg Execution Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(stats.averageExecutionTime)}ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tools by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.toolsByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span>{status}:</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="top-tools" className="space-y-4">
        <TabsList>
          <TabsTrigger value="top-tools">Top Tools</TabsTrigger>
          <TabsTrigger value="slowest-tools">Slowest Tools</TabsTrigger>
          <TabsTrigger value="all-tools">All Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="top-tools">
          <Card>
            <CardHeader>
              <CardTitle>Most Used Tools</CardTitle>
              <CardDescription>
                Tools with highest execution count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTools.map(([name, data]) => (
                  <div key={name} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{name}</h3>
                      <span className="text-sm text-muted-foreground">
                        {data.executionCount} executions
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg Time:</span>
                        <span className="ml-2 font-medium">
                          {Math.round(data.averageExecutionTime)}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Success Rate:
                        </span>
                        <span className="ml-2 font-medium">
                          {data.successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P95:</span>
                        <span className="ml-2 font-medium">
                          {Math.round(data.p95ExecutionTime)}ms
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slowest-tools">
          <Card>
            <CardHeader>
              <CardTitle>Slowest Tools</CardTitle>
              <CardDescription>
                Tools with highest average execution time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slowestTools.map(([name, data]) => (
                  <div key={name} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{name}</h3>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(data.averageExecutionTime)}ms avg
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Executions:
                        </span>
                        <span className="ml-2 font-medium">
                          {data.executionCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P95:</span>
                        <span className="ml-2 font-medium">
                          {Math.round(data.p95ExecutionTime)}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P99:</span>
                        <span className="ml-2 font-medium">
                          {Math.round(data.p99ExecutionTime)}ms
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-tools">
          <Card>
            <CardHeader>
              <CardTitle>All Tools Analytics</CardTitle>
              <CardDescription>
                Complete analytics for all MCP tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics).map(([name, data]) => (
                  <div key={name} className="border rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{name}</span>
                      <span className="text-sm text-muted-foreground">
                        {data.executionCount} exec •{" "}
                        {Math.round(data.averageExecutionTime)}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
