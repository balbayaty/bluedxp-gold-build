/**
 * Deep Drill-Down View Component
 *
 * Unlimited Depth Navigation
 *
 * Features:
 * - Unlimited depth drill-down
 * - Breadcrumb navigation
 * - History navigation (back/forward)
 * - Context preservation
 * - Deep linking
 * - Export at each level
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowUpLine,
  RiDownloadLine,
  RiShareLine,
  RiHistoryLine,
} from "react-icons/ri";
import type {
  DrillDownLevel,
  DrillDownNavigation,
} from "@/lib/services/iso-ims/drilldown/drillDownService";

interface DrillDownViewProps {
  sessionId: string;
  tenantId: string;
  userId: string;
  onLevelChange?: (level: DrillDownLevel) => void;
}

export default function DrillDownView({
  sessionId,
  tenantId,
  userId,
  onLevelChange,
}: DrillDownViewProps) {
  const [currentLevel, setCurrentLevel] = useState<DrillDownLevel | null>(null);
  const [navigation, setNavigation] = useState<DrillDownNavigation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/iso-ims/drilldown/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentLevel(data.level);
          setNavigation(data.navigation);
        }
      } catch (error) {
        console.error("Error fetching drill-down level:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLevel();
  }, [sessionId]);

  const handleDrillDown = async (
    targetType: string,
    targetId: string,
    targetData: Record<string, any>,
  ) => {
    try {
      const response = await fetch(
        `/api/iso-ims/drilldown/${sessionId}/drill`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType, targetId, targetData }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentLevel(data.level);
        setNavigation(data.navigation);
        onLevelChange?.(data.level);
      }
    } catch (error) {
      console.error("Error drilling down:", error);
    }
  };

  const handleNavigateUp = async () => {
    try {
      const response = await fetch(`/api/iso-ims/drilldown/${sessionId}/up`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.level) {
          setCurrentLevel(data.level);
          setNavigation(data.navigation);
          onLevelChange?.(data.level);
        }
      }
    } catch (error) {
      console.error("Error navigating up:", error);
    }
  };

  const handleNavigateBack = async () => {
    try {
      const response = await fetch(`/api/iso-ims/drilldown/${sessionId}/back`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.level) {
          setCurrentLevel(data.level);
          setNavigation(data.navigation);
          onLevelChange?.(data.level);
        }
      }
    } catch (error) {
      console.error("Error navigating back:", error);
    }
  };

  const handleNavigateForward = async () => {
    try {
      const response = await fetch(
        `/api/iso-ims/drilldown/${sessionId}/forward`,
        { method: "POST" },
      );
      if (response.ok) {
        const data = await response.json();
        if (data.level) {
          setCurrentLevel(data.level);
          setNavigation(data.navigation);
          onLevelChange?.(data.level);
        }
      }
    } catch (error) {
      console.error("Error navigating forward:", error);
    }
  };

  const handleExport = async (format: "JSON" | "CSV" | "PDF" | "EXCEL") => {
    try {
      const response = await fetch(
        `/api/iso-ims/drilldown/${sessionId}/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format }),
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `iso-ims-drilldown-${Date.now()}.${format.toLowerCase()}`;
        a.click();
      }
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading drill-down view...</div>;
  }

  if (!currentLevel) {
    return (
      <div className="p-8 text-center text-gray-500">
        No drill-down session found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Deep Drill-Down Navigation</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateBack}
                disabled={!navigation?.canGoBack}
              >
                <RiArrowLeftLine className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateForward}
                disabled={!navigation?.canGoForward}
              >
                Forward
                <RiArrowRightLine className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateUp}
                disabled={!navigation?.canGoUp}
              >
                <RiArrowUpLine className="h-4 w-4 mr-2" />
                Up
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("JSON")}
              >
                <RiDownloadLine className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentLevel.breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">/</span>}
                <Badge
                  variant={
                    index === currentLevel.breadcrumbs.length - 1
                      ? "default"
                      : "outline"
                  }
                >
                  {crumb.title}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Level Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentLevel.title}</CardTitle>
          {currentLevel.description && (
            <p className="text-sm text-gray-600">{currentLevel.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Level Data */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Level {currentLevel.level} - {currentLevel.type}
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(currentLevel.data, null, 2)}
                </pre>
              </div>
            </div>

            {/* Available Drill-Downs */}
            {navigation && navigation.availableLevels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Available Drill-Downs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {navigation.availableLevels.map((level) => (
                    <motion.div
                      key={level.type}
                      whileHover={{ scale: 1.05 }}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        handleDrillDown(level.type, level.type, {
                          title: level.title,
                        })
                      }
                    >
                      <div className="font-medium">{level.title}</div>
                      <div className="text-sm text-gray-600">
                        {level.count} items
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Drill-Downs */}
            {navigation && navigation.suggestedDrillDowns.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  AI-Suggested Drill-Downs
                </h3>
                <div className="space-y-2">
                  {navigation.suggestedDrillDowns.map((suggestion) => (
                    <div
                      key={suggestion.type}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        handleDrillDown(suggestion.type, suggestion.type, {
                          title: suggestion.title,
                        })
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{suggestion.title}</div>
                          <div className="text-sm text-gray-600">
                            {suggestion.reason}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Children */}
            {currentLevel.children && currentLevel.children.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Sub-Levels</h3>
                <div className="space-y-2">
                  {currentLevel.children.map((child) => (
                    <div
                      key={child.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        handleDrillDown(child.type, child.id, child.data)
                      }
                    >
                      <div className="font-medium">{child.title}</div>
                      {child.description && (
                        <div className="text-sm text-gray-600">
                          {child.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
