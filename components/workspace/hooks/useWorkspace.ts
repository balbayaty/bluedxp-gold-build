/**
 * Workspace React Hook
 *
 * Custom hook for workspace operations
 */

import { useState, useEffect, useCallback } from "react";
import type { WorkspaceConfig, WorkspaceLayout } from "@/types/workspace";

export function useWorkspace() {
  const [config, setConfig] = useState<WorkspaceConfig | null>(null);
  const [currentLayout, setCurrentLayout] = useState<WorkspaceLayout | null>(
    null,
  );
  const [layouts, setLayouts] = useState<WorkspaceLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/v1/workspace/config");
      if (!response.ok) {
        throw new Error("Failed to load workspace config");
      }
      const data = await response.json();
      setConfig(data);
      if (data.defaultLayout) {
        setCurrentLayout(data.defaultLayout);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error loading workspace config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLayouts = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/workspace/layouts");
      if (!response.ok) {
        throw new Error("Failed to load layouts");
      }
      const data = await response.json();
      setLayouts(data);
    } catch (err) {
      console.error("Error loading layouts:", err);
    }
  }, []);

  const saveLayout = useCallback(
    async (layout: WorkspaceLayout) => {
      try {
        const url = layout.id
          ? `/api/v1/workspace/layouts/${layout.id}`
          : "/api/v1/workspace/layouts";

        const method = layout.id ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(layout),
        });

        if (!response.ok) {
          throw new Error("Failed to save layout");
        }

        const saved = await response.json();
        setCurrentLayout(saved);
        await loadLayouts();
        return saved;
      } catch (err) {
        console.error("Error saving layout:", err);
        throw err;
      }
    },
    [loadLayouts],
  );

  const deleteLayout = useCallback(
    async (layoutId: string) => {
      try {
        const response = await fetch(`/api/v1/workspace/layouts/${layoutId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete layout");
        }

        await loadLayouts();
        if (currentLayout?.id === layoutId) {
          setCurrentLayout(null);
        }
      } catch (err) {
        console.error("Error deleting layout:", err);
        throw err;
      }
    },
    [currentLayout, loadLayouts],
  );

  const setDefaultLayout = useCallback(
    async (layoutId: string) => {
      try {
        const response = await fetch(
          `/api/v1/workspace/layouts/${layoutId}/default`,
          { method: "POST" },
        );

        if (!response.ok) {
          throw new Error("Failed to set default layout");
        }

        const layout = await response.json();
        setCurrentLayout(layout);
        await loadLayouts();
      } catch (err) {
        console.error("Error setting default layout:", err);
        throw err;
      }
    },
    [loadLayouts],
  );

  useEffect(() => {
    loadConfig();
    loadLayouts();
  }, [loadConfig, loadLayouts]);

  return {
    config,
    currentLayout,
    layouts,
    loading,
    error,
    loadConfig,
    loadLayouts,
    saveLayout,
    deleteLayout,
    setDefaultLayout,
    setCurrentLayout,
  };
}
