/**
 * Widget Data Hook
 *
 * Custom hook for fetching and managing widget data
 */

import { useState, useEffect, useCallback } from "react";
import type { WidgetDataResponse, WidgetConfig } from "@/types/workspace";

interface UseWidgetDataOptions {
  widgetId: string;
  config?: WidgetConfig;
  context?: Record<string, any>;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function useWidgetData({
  widgetId,
  config,
  context,
  refreshInterval,
  autoRefresh = true,
}: UseWidgetDataOptions) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (config) {
        params.set("config", JSON.stringify(config));
      }
      if (context) {
        params.set("context", JSON.stringify(context));
      }

      const response = await fetch(
        `/api/v1/workspace/widgets/${widgetId}/data?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch widget data");
      }

      const result: WidgetDataResponse = await response.json();
      setData(result.data);
      setLastUpdated(new Date(result.lastUpdated));
      setError(result.error || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching widget data:", err);
    } finally {
      setLoading(false);
    }
  }, [widgetId, config, context]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/workspace/widgets/${widgetId}/data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to refresh widget data");
      }

      const result: WidgetDataResponse = await response.json();
      setData(result.data);
      setLastUpdated(new Date(result.lastUpdated));
      setError(result.error || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error refreshing widget data:", err);
    } finally {
      setLoading(false);
    }
  }, [widgetId, config]);

  useEffect(() => {
    fetchData();

    if (autoRefresh && refreshInterval) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    fetchData,
  };
}
