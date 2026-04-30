"use client";

import React, { useState } from "react";
import { useBrandMessaging } from "@/lib/services/brand-messaging/useBrandMessaging";
import type {
  MessagingType,
  MessagingContext,
  BrandMessage,
  MessagingQuality,
} from "@/types/brand-messaging";

interface MessageGeneratorProps {
  onMessageGenerated: (
    message: BrandMessage,
    quality: MessagingQuality | null,
  ) => void;
}

const MESSAGING_TYPES: {
  value: MessagingType;
  label: string;
  description: string;
}[] = [
  {
    value: "module_header",
    label: "Module Header",
    description: "Philosophical header for modules",
  },
  {
    value: "module_description",
    label: "Module Description",
    description: "Clear module explanation",
  },
  {
    value: "empty_state",
    label: "Empty State",
    description: "Optimistic message when no data",
  },
  {
    value: "loading_state",
    label: "Loading State",
    description: "Intelligent loading message",
  },
  {
    value: "success_message",
    label: "Success Message",
    description: "Confident completion message",
  },
  {
    value: "error_message",
    label: "Error Message",
    description: "Dignified error handling",
  },
  {
    value: "notification",
    label: "Notification",
    description: "System notification",
  },
  {
    value: "button_label",
    label: "Button Label",
    description: "Clear action button text",
  },
  { value: "tooltip", label: "Tooltip", description: "Concise help text" },
  {
    value: "dashboard_wisdom",
    label: "Dashboard Wisdom",
    description: "Philosophical insight",
  },
  {
    value: "feature_header",
    label: "Feature Header",
    description: "Feature title",
  },
  {
    value: "feature_description",
    label: "Feature Description",
    description: "Feature explanation",
  },
  {
    value: "onboarding_step",
    label: "Onboarding Step",
    description: "Onboarding message",
  },
  {
    value: "confirmation_dialog",
    label: "Confirmation Dialog",
    description: "Action confirmation",
  },
  {
    value: "welcome_message",
    label: "Welcome Message",
    description: "Welcome greeting",
  },
  {
    value: "completion_message",
    label: "Completion Message",
    description: "Task completion",
  },
];

export const MessageGenerator: React.FC<MessageGeneratorProps> = ({
  onMessageGenerated,
}) => {
  const { getBilingualMessage, isLoading } = useBrandMessaging();
  const [type, setType] = useState<MessagingType>("module_header");
  const [context, setContext] = useState<MessagingContext>({
    moduleId: "",
    moduleName: "",
    featureId: "",
    featureName: "",
    userRole: "",
    action: "",
    language: "both",
    metadata: {},
  });
  const [useCache, setUseCache] = useState(true);
  const [qualityCheck, setQualityCheck] = useState(true);
  const [includeSaudiContext, setIncludeSaudiContext] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<BrandMessage | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setGeneratedMessage(null);

    try {
      const message = await fetch("/api/brand-messaging/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          context: {
            ...context,
            language: "both",
          },
          useCache,
          qualityCheck,
          promptConfig: {
            includeSaudiContext,
            includeBrandContext: true,
            includeModuleContext: true,
          },
        }),
      });

      const result = await message.json();

      if (result.success && result.data) {
        setGeneratedMessage(result.data);

        // Get quality if available
        const quality = result.quality || null;
        onMessageGenerated(result.data, quality);
      } else {
        setError(result.error || "Failed to generate message");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate message",
      );
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Generate Message</h2>
        <p className="text-slate-400 text-sm">
          Create on-brand, bilingual messaging
        </p>
      </div>

      {/* Message Type */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Message Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MessagingType)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {MESSAGING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} - {t.description}
            </option>
          ))}
        </select>
      </div>

      {/* Context Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Module ID
          </label>
          <input
            type="text"
            value={context.moduleId || ""}
            onChange={(e) =>
              setContext({ ...context, moduleId: e.target.value })
            }
            placeholder="e.g., wms"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Module Name
          </label>
          <input
            type="text"
            value={context.moduleName || ""}
            onChange={(e) =>
              setContext({ ...context, moduleName: e.target.value })
            }
            placeholder="e.g., Warehouse Management"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Feature Name
          </label>
          <input
            type="text"
            value={context.featureName || ""}
            onChange={(e) =>
              setContext({ ...context, featureName: e.target.value })
            }
            placeholder="e.g., Intelligent Routing"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Action
          </label>
          <input
            type="text"
            value={context.action || ""}
            onChange={(e) => setContext({ ...context, action: e.target.value })}
            placeholder="e.g., Create Shipment"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Metadata */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Additional Context (JSON)
        </label>
        <textarea
          value={JSON.stringify(context.metadata || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setContext({ ...context, metadata: parsed });
            } catch {
              // Invalid JSON, ignore
            }
          }}
          placeholder='{"purpose": "Manage inventory", "benefit": "Improve efficiency"}'
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
        />
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useCache}
            onChange={(e) => setUseCache(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-slate-300">Use Cache</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={qualityCheck}
            onChange={(e) => setQualityCheck(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-slate-300">Quality Check</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeSaudiContext}
            onChange={(e) => setIncludeSaudiContext(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-slate-300">Include Saudi Context</span>
        </label>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <span>✨</span>
            Generate Message
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}
    </div>
  );
};
