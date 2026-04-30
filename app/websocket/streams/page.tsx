/**
 * 🚀 Advanced Real-Time Streaming Page
 * WebSocket streaming with channels, filters, QoS, compression
 */

"use client";

import React, { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { advancedRealTimeStreamService } from "@/lib/services/websocket/advancedRealTimeStreamService";
import type {
  StreamChannel,
  StreamSubscription,
} from "@/lib/services/websocket/advancedRealTimeStreamService";

export default function AdvancedStreamingPage() {
  const [channels, setChannels] = useState<StreamChannel[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: "",
    type: "CUSTOM" as StreamChannel["type"],
    description: "",
  });

  useEffect(() => {
    loadChannels();
    loadAnalytics();
  }, []);

  const loadChannels = () => {
    // Get analytics from service
    const analyticsData = advancedRealTimeStreamService.getAnalytics();
    setAnalytics(analyticsData);
    // Channels would be loaded from service in production
    // For now, use mock data
    setChannels([]);
  };

  const loadAnalytics = () => {
    const analytics = advancedRealTimeStreamService.getAnalytics();
    setAnalytics(analytics);
  };

  const handleCreateChannel = () => {
    if (!newChannel.name) return;

    try {
      const channelId = advancedRealTimeStreamService.createChannel({
        name: newChannel.name,
        type: newChannel.type,
        description: newChannel.description,
        dataSchema: { type: "object" },
        permissions: {
          read: ["all"],
          write: ["system"],
          admin: ["admin"],
        },
        retention: {
          duration: 168, // 1 week
          maxSize: 100,
          compression: false,
        },
        filters: [],
      });

      setShowCreateChannel(false);
      setNewChannel({ name: "", type: "CUSTOM", description: "" });
      // Reload channels
      const allChannels = advancedRealTimeStreamService.getAllChannels();
      setChannels(allChannels);
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  return (
    <PageTemplate
      title="Advanced Real-Time Streaming"
      description="WebSocket streaming with channels, filters, QoS levels, and compression"
      icon="ri-broadcast-line"
    >
      <div className="space-y-6">
        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Channels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.channels.total}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.subscriptions.total}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.sessions.active}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Messages/Second
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.performance.messagesPerSecond}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Channels */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stream Channels</CardTitle>
              <Button onClick={() => setShowCreateChannel(true)}>
                Create Channel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {channels.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No channels created yet. Create one to start streaming.
              </p>
            ) : (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{channel.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {channel.description}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{channel.type}</Badge>
                          <Badge variant="outline">
                            {channel.aggregation?.enabled
                              ? "Aggregated"
                              : "Raw"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Channel Modal */}
        {showCreateChannel && (
          <Card>
            <CardHeader>
              <CardTitle>Create Stream Channel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Channel Name</Label>
                <Input
                  value={newChannel.name}
                  onChange={(e) =>
                    setNewChannel({ ...newChannel, name: e.target.value })
                  }
                  placeholder="e.g., Production Metrics"
                />
              </div>

              <div>
                <Label>Channel Type</Label>
                <Select
                  value={newChannel.type}
                  onValueChange={(value) =>
                    setNewChannel({
                      ...newChannel,
                      type: value as StreamChannel["type"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYSTEM_METRICS">
                      System Metrics
                    </SelectItem>
                    <SelectItem value="AI_VISION">AI Vision</SelectItem>
                    <SelectItem value="CHEMICAL_ANALYSIS">
                      Chemical Analysis
                    </SelectItem>
                    <SelectItem value="IOT_SENSORS">IoT Sensors</SelectItem>
                    <SelectItem value="ALERTS">Alerts</SelectItem>
                    <SelectItem value="AUDIT_LOGS">Audit Logs</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={newChannel.description}
                  onChange={(e) =>
                    setNewChannel({
                      ...newChannel,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the channel purpose..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateChannel}
                  disabled={!newChannel.name}
                >
                  Create Channel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateChannel(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTemplate>
  );
}
