/**
 * Customization Page
 *
 * User preferences, dashboard customization, themes
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserPreferences } from "@/lib/services/transportation/customizationService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function CustomizationPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await apiFetch("/api/transportation/customization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-preferences",
          // userId is resolved from the API gateway context (RBAC + multi-tenant)
        }),
      });

      const result = await response.json();
      if (result.preferences) {
        setPreferences(result.preferences);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to load preferences", err, {
        module: "transportation",
        service: "customization",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "customization",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (updates: Partial<UserPreferences>) => {
    if (!preferences) return;

    try {
      const response = await apiFetch("/api/transportation/customization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-preferences",
          updates,
        }),
      });

      const result = await response.json();
      if (result.preferences) {
        setPreferences(result.preferences);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to update preferences", err, {
        module: "transportation",
        service: "customization",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "customization",
      });
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!preferences) {
    return (
      <div className="container mx-auto p-6">Failed to load preferences</div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customization</h1>
          <p className="text-muted-foreground mt-2">
            Personalize your experience with themes, preferences, and layouts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize theme and display settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Theme</Label>
              <Select
                value={preferences.theme}
                onValueChange={(v) => updatePreference({ theme: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIGHT">Light</SelectItem>
                  <SelectItem value="DARK">Dark</SelectItem>
                  <SelectItem value="AUTO">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(v) => updatePreference({ language: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(v) => updatePreference({ timezone: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Customize your dashboard layout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Layout</Label>
              <Select
                value={preferences.dashboard.layout}
                onValueChange={(v) =>
                  updatePreference({
                    dashboard: { ...preferences.dashboard, layout: v as any },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRID">Grid</SelectItem>
                  <SelectItem value="LIST">List</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Auto Refresh</Label>
              <Switch
                checked={preferences.dashboard.autoRefresh}
                onCheckedChange={(checked) =>
                  updatePreference({
                    dashboard: {
                      ...preferences.dashboard,
                      autoRefresh: checked,
                    },
                  })
                }
              />
            </div>

            <div>
              <Label>Refresh Interval (seconds)</Label>
              <input
                type="number"
                value={preferences.dashboard.refreshInterval || 30}
                onChange={(e) =>
                  updatePreference({
                    dashboard: {
                      ...preferences.dashboard,
                      refreshInterval: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full mt-2 px-3 py-2 border rounded"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Email Notifications</Label>
              <Switch
                checked={preferences.notifications.email}
                onCheckedChange={(checked) =>
                  updatePreference({
                    notifications: {
                      ...preferences.notifications,
                      email: checked,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Push Notifications</Label>
              <Switch
                checked={preferences.notifications.push}
                onCheckedChange={(checked) =>
                  updatePreference({
                    notifications: {
                      ...preferences.notifications,
                      push: checked,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>In-App Notifications</Label>
              <Switch
                checked={preferences.notifications.inApp}
                onCheckedChange={(checked) =>
                  updatePreference({
                    notifications: {
                      ...preferences.notifications,
                      inApp: checked,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Views</CardTitle>
            <CardDescription>Customize default view settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Page Size</Label>
              <input
                type="number"
                value={preferences.views.pageSize}
                onChange={(e) =>
                  updatePreference({
                    views: {
                      ...preferences.views,
                      pageSize: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full mt-2 px-3 py-2 border rounded"
              />
            </div>

            <div>
              <Label>Sort By</Label>
              <Select
                value={preferences.views.sortBy || "createdAt"}
                onValueChange={(v) =>
                  updatePreference({
                    views: { ...preferences.views, sortBy: v },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
