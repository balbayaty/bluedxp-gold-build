/**
 * Google Workspace Setup Component
 *
 * OAuth connection flow and status display
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { GoogleWorkspaceIntegration } from "@/types/workspace";

interface GoogleWorkspaceSetupProps {
  userId: string;
  onConnected?: () => void;
}

export function GoogleWorkspaceSetup({
  userId,
  onConnected,
}: GoogleWorkspaceSetupProps) {
  const [status, setStatus] = useState<GoogleWorkspaceIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/v1/workspace/integrations/google");
      if (response.ok) {
        const data = await response.json();
        setStatus(data.connected ? data : null);
      }
    } catch (error) {
      console.error("Error loading Google Workspace status:", error);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const redirectUri = `${window.location.origin}/workspace/integrations/google/callback`;
      const response = await fetch(
        `/api/v1/workspace/integrations/google/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`,
      );

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error initiating OAuth:", error);
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/workspace/integrations/google", {
        method: "DELETE",
      });

      if (response.ok) {
        setStatus(null);
        if (onConnected) onConnected();
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/v1/workspace/integrations/google/sync",
        {
          method: "POST",
        },
      );

      if (response.ok) {
        await loadStatus();
      }
    } catch (error) {
      console.error("Error syncing:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <i className="ri-google-fill text-2xl text-cyan-400"></i>
            <div>
              <h3 className="font-semibold text-white">Google Workspace</h3>
              <p className="text-sm text-[#9ca3af]">Connected</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
            Active
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9ca3af]">Calendar</span>
            <span
              className={`text-white ${status.calendarEnabled ? "text-green-400" : "text-gray-400"}`}
            >
              {status.calendarEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9ca3af]">Drive</span>
            <span
              className={`text-white ${status.driveEnabled ? "text-green-400" : "text-gray-400"}`}
            >
              {status.driveEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9ca3af]">Gmail</span>
            <span
              className={`text-white ${status.gmailEnabled ? "text-green-400" : "text-gray-400"}`}
            >
              {status.gmailEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9ca3af]">Tasks</span>
            <span
              className={`text-white ${status.tasksEnabled ? "text-green-400" : "text-gray-400"}`}
            >
              {status.tasksEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        {status.lastSyncedAt && (
          <p className="text-xs text-[#9ca3af] mb-4">
            Last synced: {new Date(status.lastSyncedAt).toLocaleString()}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Sync Now"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <i className="ri-google-fill text-2xl text-cyan-400"></i>
        <div>
          <h3 className="font-semibold text-white">Google Workspace</h3>
          <p className="text-sm text-[#9ca3af]">Connect your Google account</p>
        </div>
      </div>

      <p className="text-sm text-[#9ca3af] mb-4">
        Connect your Google Workspace to access Calendar, Drive, Gmail, and
        Tasks in your workspace.
      </p>

      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? "Connecting..." : "Connect Google Workspace"}
      </button>
    </div>
  );
}
