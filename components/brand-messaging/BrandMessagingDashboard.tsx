"use client";

import React, { useState, useEffect } from "react";
import { useBrandMessaging } from "@/lib/services/brand-messaging/useBrandMessaging";
import type {
  MessagingType,
  MessagingContext,
  BrandMessage,
  MessagingQuality,
} from "@/types/brand-messaging";
import { MessageGenerator } from "./MessageGenerator";
import { IntelligentMessageGenerator } from "./IntelligentMessageGenerator";
import { EnhancedMessageGenerator } from "./EnhancedMessageGenerator";
import { MessagePreview } from "./MessagePreview";
import { QualityAnalyzer } from "./QualityAnalyzer";
import { BatchGenerator } from "./BatchGenerator";
import { MessageLibrary } from "./MessageLibrary";
import { CacheStats } from "./CacheStats";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { UsageAnalytics } from "./UsageAnalytics";
import { WelcomeTour } from "./WelcomeTour";

export const BrandMessagingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "generate" | "batch" | "library" | "analytics"
  >("generate");
  const [generatedMessage, setGeneratedMessage] = useState<BrandMessage | null>(
    null,
  );
  const [quality, setQuality] = useState<MessagingQuality | null>(null);
  const [useIntelligentMode, setUseIntelligentMode] = useState(true);
  const [showTour, setShowTour] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Welcome Tour */}
      {showTour && <WelcomeTour onComplete={() => setShowTour(false)} />}
      {/* Header */}
      <div className="border-b border-blue-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                BlueDXP Brand Messaging Engine
              </h1>
              <p className="text-slate-400 mt-1">
                Generate on-brand, bilingual messaging with AI intelligence
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <div className="text-sm text-blue-300">AI-Powered</div>
                <div className="text-xs text-slate-400">
                  LLM Integration Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-blue-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: "generate", label: "Generate", icon: "✨" },
              { id: "batch", label: "Batch Generate", icon: "📦" },
              { id: "library", label: "Message Library", icon: "📚" },
              { id: "analytics", label: "Analytics", icon: "📊" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-6 py-3 font-medium transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/10"
                      : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "generate" && (
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-end gap-4">
              <span className="text-sm text-slate-400">Generator Mode:</span>
              <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setUseIntelligentMode(true)}
                  className={`px-4 py-2 rounded transition-all ${
                    useIntelligentMode
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  🤖 Intelligent (Auto)
                </button>
                <button
                  onClick={() => setUseIntelligentMode(false)}
                  className={`px-4 py-2 rounded transition-all ${
                    !useIntelligentMode
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  ✏️ Manual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {useIntelligentMode ? (
                  <EnhancedMessageGenerator
                    onMessageGenerated={(message, quality) => {
                      setGeneratedMessage(message);
                      setQuality(quality);
                    }}
                  />
                ) : (
                  <MessageGenerator
                    onMessageGenerated={(message, quality) => {
                      setGeneratedMessage(message);
                      setQuality(quality);
                    }}
                  />
                )}
                {quality && <QualityAnalyzer quality={quality} />}
              </div>
              <div>
                {generatedMessage && (
                  <MessagePreview
                    message={generatedMessage}
                    onVariationSelect={(variation) => {
                      setGeneratedMessage(variation);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "batch" && <BatchGenerator />}

        {activeTab === "library" && <MessageLibrary />}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <UsageAnalytics />
            <CacheStats />
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onShortcut={(action) => {
          // Handle shortcuts
          if (action === "generate" && generatedMessage === null) {
            // Trigger generate
          }
          if (action === "toggle-mode") {
            setUseIntelligentMode(!useIntelligentMode);
          }
        }}
      />
    </div>
  );
};
