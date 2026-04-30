/**
 * Enhanced Truth Timeline Component
 * Advanced UI with export, filtering, and visualization
 */

"use client";

import { useState, useEffect } from "react";
import { TruthTimeline, TruthEvent } from "@/types/truth-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Download,
  Filter,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

interface TruthTimelineEnhancedProps {
  entityType: string;
  entityId: string;
  initialTimeline?: TruthTimeline;
}

export function TruthTimelineEnhanced({
  entityType,
  entityId,
  initialTimeline,
}: TruthTimelineEnhancedProps) {
  const [timeline, setTimeline] = useState<TruthTimeline | null>(
    initialTimeline || null,
  );
  const [loading, setLoading] = useState(!initialTimeline);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [minConfidence, setMinConfidence] = useState<number | undefined>();
  const [showDisputed, setShowDisputed] = useState(true);

  useEffect(() => {
    if (!initialTimeline) {
      loadTimeline();
    }
  }, [entityType, entityId]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        entityType,
        entityId,
        tenantId: "current", // Would get from context
      });

      if (dateFrom) params.append("dateFrom", dateFrom.toISOString());
      if (dateTo) params.append("dateTo", dateTo.toISOString());
      if (minConfidence !== undefined)
        params.append("minConfidence", minConfidence.toString());
      if (selectedEventTypes.length > 0)
        params.append("eventTypes", selectedEventTypes.join(","));

      const response = await fetch(`/api/truth-engine/events?${params}`);
      const data = await response.json();

      if (data.success) {
        setTimeline(data.timeline);
      }
    } catch (error) {
      console.error("Error loading timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportTimeline = async (format: "json" | "csv" | "pdf") => {
    if (!timeline) return;

    try {
      const response = await fetch("/api/truth-engine/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          format,
          timeline,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `truth-timeline-${entityType}-${entityId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting timeline:", error);
    }
  };

  const filteredEvents =
    timeline?.events.filter((event) => {
      if (
        searchTerm &&
        !event.eventType.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.actor.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (
        selectedEventTypes.length > 0 &&
        !selectedEventTypes.includes(event.eventType)
      ) {
        return false;
      }

      if (dateFrom && new Date(event.happenedAt) < dateFrom) {
        return false;
      }

      if (dateTo && new Date(event.happenedAt) > dateTo) {
        return false;
      }

      if (
        minConfidence !== undefined &&
        event.confidenceScore < minConfidence
      ) {
        return false;
      }

      if (!showDisputed && event.status === "disputed") {
        return false;
      }

      return true;
    }) || [];

  const eventTypes = Array.from(
    new Set(timeline?.events.map((e) => e.eventType) || []),
  );

  if (loading) {
    return <div className="p-4">Loading timeline...</div>;
  }

  if (!timeline) {
    return <div className="p-4">No timeline data available</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Truth Timeline: {entityType} {entityId}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTimeline("json")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTimeline("csv")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={selectedEventTypes.join(",")}
              onValueChange={(value) =>
                setSelectedEventTypes(value ? value.split(",") : [])
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={{ from: dateFrom, to: dateTo }}
                  onSelect={(range) => {
                    setDateFrom(range?.from);
                    setDateTo(range?.to);
                  }}
                />
              </PopoverContent>
            </Popover>
            <Input
              type="number"
              placeholder="Min Confidence"
              value={minConfidence || ""}
              onChange={(e) =>
                setMinConfidence(
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              className="w-[150px]"
              min="0"
              max="1"
              step="0.1"
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-2xl font-bold">{filteredEvents.length}</div>
              <div className="text-sm text-muted-foreground">Events</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-2xl font-bold">
                {(timeline.confidenceScore * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Confidence</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-2xl font-bold">
                {timeline.evidence.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Evidence Items
              </div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-2xl font-bold">{timeline.gaps.length}</div>
              <div className="text-sm text-muted-foreground">Gaps</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Timeline */}
      <div className="space-y-2">
        {filteredEvents.map((event, index) => (
          <Card key={event.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {event.status === "disputed" ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{event.eventType}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(event.happenedAt), "PPpp")}
                    </span>
                    <Badge
                      variant={
                        event.confidenceScore >= 0.8 ? "default" : "secondary"
                      }
                    >
                      {(event.confidenceScore * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <div className="text-sm mb-2">
                    <strong>{event.actor.name}</strong> ({event.actor.role})
                  </div>
                  {event.evidenceLinks.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {event.evidenceLinks.length} evidence item(s)
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `/truth-timeline/${entityType}/${entityId}?event=${event.id}`,
                      "_blank",
                    )
                  }
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gaps */}
      {timeline.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeline.gaps.map((gap) => (
                <div
                  key={gap.id}
                  className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <Badge
                      variant="outline"
                      className={
                        gap.severity === "HIGH" ? "border-red-500" : ""
                      }
                    >
                      {gap.severity}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium mb-1">
                    {gap.description}
                  </div>
                  {gap.suggestedActions && gap.suggestedActions.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Suggested:</strong>{" "}
                      {gap.suggestedActions.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
