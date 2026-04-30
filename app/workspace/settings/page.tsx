/**
 * Workspace Settings Page
 */

"use client";

import { useState, useEffect } from "react";
import { WorkspaceSettings } from "@/components/workspace/WorkspaceSettings";
import { GoogleWorkspaceSetup } from "@/components/workspace/integrations/GoogleWorkspaceSetup";
import { EmailSetup } from "@/components/workspace/integrations/EmailSetup";
import type { WorkspaceConfig } from "@/types/workspace";

export default function WorkspaceSettingsPage() {
  const [config, setConfig] = useState<WorkspaceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/v1/workspace/config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <p className="text-white">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">
          Workspace Settings
        </h1>

        <div className="space-y-6">
          {/* Integrations Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Integrations
            </h2>

            <div className="space-y-6">
              <GoogleWorkspaceSetup
                userId={config.userId}
                onConnected={loadConfig}
              />

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Email Accounts
                </h3>
                <EmailSetup userId={config.userId} onConnected={loadConfig} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
