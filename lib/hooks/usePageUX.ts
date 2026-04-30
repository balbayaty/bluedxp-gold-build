/**
 * Page UX Hook
 * Provides common UX functionality for detail and edit pages
 * - Toast notifications
 * - Confirmation dialogs
 * - Auto-save
 * - Keyboard shortcuts
 * - Unsaved changes warning
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ============================================================================
// NOTIFICATION HOOK
// ============================================================================

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export function useNotifications() {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback(
    (type: NotificationType, title: string, message?: string, duration = 5000) => {
      setNotification({
        id: Date.now().toString(),
        type,
        title,
        message,
        duration,
      });
    },
    []
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => showNotification("success", title, message),
    [showNotification]
  );

  const showError = useCallback(
    (title: string, message?: string) => showNotification("error", title, message, 7000),
    [showNotification]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => showNotification("info", title, message),
    [showNotification]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => showNotification("warning", title, message),
    [showNotification]
  );

  const clearNotification = useCallback(() => setNotification(null), []);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearNotification,
  };
}

// ============================================================================
// CONFIRMATION DIALOG HOOK
// ============================================================================

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "warning" | "info";
  loading: boolean;
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    variant: "danger",
    loading: false,
    onConfirm: () => {},
  });

  const showConfirm = useCallback(
    (options: {
      title: string;
      message: string;
      confirmLabel?: string;
      variant?: "danger" | "warning" | "info";
      onConfirm: () => void | Promise<void>;
    }) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel || "Confirm",
        variant: options.variant || "danger",
        loading: false,
        onConfirm: async () => {
          setState((prev) => ({ ...prev, loading: true }));
          try {
            await options.onConfirm();
          } finally {
            setState((prev) => ({ ...prev, isOpen: false, loading: false }));
          }
        },
      });
    },
    []
  );

  const close = useCallback(() => {
    if (!state.loading) {
      setState((prev) => ({ ...prev, isOpen: false }));
    }
  }, [state.loading]);

  return {
    ...state,
    showConfirm,
    close,
  };
}

// ============================================================================
// AUTO-SAVE HOOK
// ============================================================================

export interface AutoSaveOptions<T> {
  storageKey: string;
  data: T;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSave<T>({ storageKey, data, enabled = true, debounceMs = 2000 }: AutoSaveOptions<T>) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setSaveStatus("idle");

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setSaveStatus("saved");
        setLastSaved(new Date());
      } catch (e) {
        console.error("Auto-save failed:", e);
        setSaveStatus("error");
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, storageKey, enabled, debounceMs]);

  const loadDraft = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSaveStatus("idle");
    setLastSaved(null);
  }, [storageKey]);

  return {
    saveStatus,
    lastSaved,
    loadDraft,
    clearDraft,
  };
}

// ============================================================================
// UNSAVED CHANGES HOOK
// ============================================================================

export function useUnsavedChanges<T>(currentData: T, originalData: T | null) {
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (originalData !== null) {
      const changed = JSON.stringify(currentData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [currentData, originalData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  return hasChanges;
}

// ============================================================================
// KEYBOARD SHORTCUTS HOOK
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : true;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        
        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// ============================================================================
// COMBINED PAGE UX HOOK
// ============================================================================

export interface PageUXOptions<T> {
  entityType: string;
  storageKey?: string;
  initialData?: T | null;
  currentData?: T;
  enableAutoSave?: boolean;
}

export function usePageUX<T>(options: PageUXOptions<T>) {
  const router = useRouter();
  const notifications = useNotifications();
  const confirmDialog = useConfirmDialog();

  const hasChanges = useUnsavedChanges(
    options.currentData,
    options.initialData || null
  );

  const autoSave = useAutoSave({
    storageKey: options.storageKey || `${options.entityType}-draft`,
    data: options.currentData as T,
    enabled: options.enableAutoSave && hasChanges,
  });

  // Confirm before leaving with unsaved changes
  const confirmLeave = useCallback(
    (destination: string) => {
      if (hasChanges) {
        confirmDialog.showConfirm({
          title: "Discard Changes?",
          message: "You have unsaved changes. Are you sure you want to leave?",
          confirmLabel: "Discard",
          variant: "warning",
          onConfirm: () => {
            autoSave.clearDraft();
            router.push(destination);
          },
        });
      } else {
        router.push(destination);
      }
    },
    [hasChanges, confirmDialog, autoSave, router]
  );

  // Confirm destructive action
  const confirmDelete = useCallback(
    (itemName: string, onDelete: () => Promise<void>) => {
      confirmDialog.showConfirm({
        title: `Delete ${options.entityType}?`,
        message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmLabel: "Delete",
        variant: "danger",
        onConfirm: async () => {
          try {
            await onDelete();
            notifications.showSuccess(
              `${options.entityType} Deleted`,
              `${itemName} has been removed`
            );
          } catch (err) {
            notifications.showError(
              "Delete Failed",
              err instanceof Error ? err.message : "Please try again"
            );
          }
        },
      });
    },
    [confirmDialog, notifications, options.entityType]
  );

  return {
    ...notifications,
    confirmDialog,
    hasChanges,
    autoSave,
    confirmLeave,
    confirmDelete,
  };
}
