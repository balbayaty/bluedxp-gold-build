"use client";

import React, { useState, useEffect } from "react";
import { useBrandMessaging } from "@/lib/services/brand-messaging/useBrandMessaging";
import type {
  MessagingType,
  MessagingContext,
  BrandMessage,
  MessagingQuality,
} from "@/types/brand-messaging";

interface IntelligentMessageGeneratorProps {
  onMessageGenerated: (
    message: BrandMessage,
    quality: MessagingQuality | null,
  ) => void;
}

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  routes: Array<{ path: string; title: string; icon?: string }>;
  capabilities: {
    routes: number;
    components: number;
    services: number;
    features: string[];
  };
}

const MESSAGING_TYPES: {
  value: MessagingType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "module_header",
    label: "Module Header",
    description: "Philosophical header for modules",
    icon: "📝",
  },
  {
    value: "module_description",
    label: "Module Description",
    description: "Clear module explanation",
    icon: "📄",
  },
  {
    value: "empty_state",
    label: "Empty State",
    description: "Optimistic message when no data",
    icon: "📭",
  },
  {
    value: "loading_state",
    label: "Loading State",
    description: "Intelligent loading message",
    icon: "⏳",
  },
  {
    value: "success_message",
    label: "Success Message",
    description: "Confident completion message",
    icon: "✅",
  },
  {
    value: "error_message",
    label: "Error Message",
    description: "Dignified error handling",
    icon: "⚠️",
  },
  {
    value: "notification",
    label: "Notification",
    description: "System notification",
    icon: "🔔",
  },
  {
    value: "button_label",
    label: "Button Label",
    description: "Clear action button text",
    icon: "🔘",
  },
  {
    value: "tooltip",
    label: "Tooltip",
    description: "Concise help text",
    icon: "💡",
  },
  {
    value: "dashboard_wisdom",
    label: "Dashboard Wisdom",
    description: "Philosophical insight",
    icon: "🧠",
  },
  {
    value: "feature_header",
    label: "Feature Header",
    description: "Feature title",
    icon: "🎯",
  },
  {
    value: "feature_description",
    label: "Feature Description",
    description: "Feature explanation",
    icon: "📋",
  },
  {
    value: "onboarding_step",
    label: "Onboarding Step",
    description: "Onboarding message",
    icon: "🚀",
  },
  {
    value: "confirmation_dialog",
    label: "Confirmation Dialog",
    description: "Action confirmation",
    icon: "❓",
  },
  {
    value: "welcome_message",
    label: "Welcome Message",
    description: "Welcome greeting",
    icon: "👋",
  },
  {
    value: "completion_message",
    label: "Completion Message",
    description: "Task completion",
    icon: "🎉",
  },
];

export const IntelligentMessageGenerator: React.FC<
  IntelligentMessageGeneratorProps
> = ({ onMessageGenerated }) => {
  const { getBilingualMessage, isLoading } = useBrandMessaging();
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModule, setSelectedModule] = useState<ModuleInfo | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>("");
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
  const [autoMode, setAutoMode] = useState(true);
  const [generatedMessage, setGeneratedMessage] = useState<BrandMessage | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loadingModules, setLoadingModules] = useState(true);

  // Load modules on mount
  useEffect(() => {
    loadModules();
  }, []);

  // Auto-fill context when module is selected
  useEffect(() => {
    if (selectedModule && autoMode) {
      setContext((prev) => ({
        ...prev,
        moduleId: selectedModule.id,
        moduleName: selectedModule.name,
        metadata: {
          ...prev.metadata,
          purpose: selectedModule.description,
          category: selectedModule.category,
        },
      }));
    }
  }, [selectedModule, autoMode]);

  // Auto-fill feature when selected
  useEffect(() => {
    if (selectedFeature && selectedModule && autoMode) {
      const feature = selectedModule.routes.find(
        (r) => r.path === selectedFeature,
      );
      if (feature) {
        setContext((prev) => ({
          ...prev,
          featureId: feature.path,
          featureName: feature.title,
        }));
      }
    }
  }, [selectedFeature, selectedModule, autoMode]);

  const loadModules = async () => {
    try {
      const response = await fetch("/api/modules/list");
      const result = await response.json();
      if (result.success) {
        setModules(result.data);
      }
    } catch (error) {
      console.error("Failed to load modules:", error);
    } finally {
      setLoadingModules(false);
    }
  };

  const handleModuleSelect = (moduleId: string) => {
    const moduleDef = modules.find((m) => m.id === moduleId);
    setSelectedModule(moduleDef || null);
    setSelectedFeature("");
    if (moduleDef) {
      // Auto-suggest appropriate message types based on module
      if (type === "module_header" || type === "module_description") {
        // Keep current type if it's module-related
      } else {
        // Suggest module header for new module selection
        setType("module_header");
      }
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setGeneratedMessage(null);

    // Validate required fields
    if (!context.moduleId && !context.moduleName) {
      setError("Please select a module or enter module name");
      return;
    }

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
            includeSaudiContext: false, // Disabled until service exists
            includeBrandContext: true,
            includeModuleContext: true,
          },
        }),
      });

      const result = await message.json();

      if (result.success && result.data) {
        setGeneratedMessage(result.data);
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

  const getSuggestedMessageTypes = (): MessagingType[] => {
    if (!selectedModule) return [];

    // Suggest message types based on what's typically needed for a module
    const suggestions: MessagingType[] = [
      "module_header",
      "module_description",
    ];

    if (selectedModule.routes.length > 0) {
      suggestions.push("feature_header", "feature_description");
    }

    suggestions.push("empty_state", "loading_state", "dashboard_wisdom");

    return suggestions;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            Intelligent Message Generator
          </h2>
          <p className="text-slate-400 text-sm">
            AI-powered, semi-automated messaging with module intelligence
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-slate-300">🤖 Auto Mode</span>
        </label>
      </div>

      {/* Module Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Module{" "}
          {autoMode && (
            <span className="text-blue-400">(Auto-fills context)</span>
          )}
        </label>
        {loadingModules ? (
          <div className="text-slate-400 text-sm">Loading modules...</div>
        ) : (
          <select
            value={selectedModule?.id || ""}
            onChange={(e) => handleModuleSelect(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a Module --</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name} ({module.category})
              </option>
            ))}
          </select>
        )}

        {/* Module Capabilities Display */}
        {selectedModule && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">
                  {selectedModule.name}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedModule.description}
                </p>
              </div>
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                {selectedModule.category}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-xs text-slate-400">Routes</div>
                <div className="text-lg font-semibold text-white">
                  {selectedModule.capabilities.routes}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Components</div>
                <div className="text-lg font-semibold text-white">
                  {selectedModule.capabilities.components}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Services</div>
                <div className="text-lg font-semibold text-white">
                  {selectedModule.capabilities.services}
                </div>
              </div>
            </div>

            {/* Features List */}
            {selectedModule.routes.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-slate-400 mb-2">
                  Available Features:
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedModule.routes.slice(0, 6).map((route, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFeature(route.path)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        selectedFeature === route.path
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {route.title}
                    </button>
                  ))}
                  {selectedModule.routes.length > 6 && (
                    <span className="text-xs text-slate-500">
                      +{selectedModule.routes.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Type with Suggestions */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Message Type
          {selectedModule && autoMode && (
            <span className="ml-2 text-xs text-blue-400">
              💡 Suggested: {getSuggestedMessageTypes().slice(0, 3).join(", ")}
            </span>
          )}
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MessagingType)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {MESSAGING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label} - {t.description}
            </option>
          ))}
        </select>
      </div>

      {/* Context Fields - Auto-filled in auto mode */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Module ID{" "}
            {autoMode && selectedModule && (
              <span className="text-green-400">✓ Auto-filled</span>
            )}
          </label>
          <input
            type="text"
            value={context.moduleId || ""}
            onChange={(e) =>
              setContext({ ...context, moduleId: e.target.value })
            }
            placeholder="e.g., wms"
            disabled={autoMode && !!selectedModule}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Module Name{" "}
            {autoMode && selectedModule && (
              <span className="text-green-400">✓ Auto-filled</span>
            )}
          </label>
          <input
            type="text"
            value={context.moduleName || ""}
            onChange={(e) =>
              setContext({ ...context, moduleName: e.target.value })
            }
            placeholder="e.g., Warehouse Management"
            disabled={autoMode && !!selectedModule}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Feature Name{" "}
            {autoMode && selectedFeature && (
              <span className="text-green-400">✓ Auto-filled</span>
            )}
          </label>
          <input
            type="text"
            value={context.featureName || ""}
            onChange={(e) =>
              setContext({ ...context, featureName: e.target.value })
            }
            placeholder="e.g., Intelligent Routing"
            disabled={autoMode && !!selectedFeature}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Additional Metadata */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Additional Context (JSON){" "}
          {autoMode && selectedModule && (
            <span className="text-green-400">✓ Auto-filled</span>
          )}
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
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || (!context.moduleId && !context.moduleName)}
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
            Generate Message{" "}
            {autoMode && <span className="text-xs">(AI-Enhanced)</span>}
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Quick Actions */}
      {selectedModule && (
        <div className="pt-4 border-t border-slate-600">
          <div className="text-sm text-slate-400 mb-2">Quick Generate:</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setType("module_header");
                handleGenerate();
              }}
              className="text-xs px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded transition-colors"
            >
              Header
            </button>
            <button
              onClick={() => {
                setType("module_description");
                handleGenerate();
              }}
              className="text-xs px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded transition-colors"
            >
              Description
            </button>
            <button
              onClick={() => {
                setType("empty_state");
                handleGenerate();
              }}
              className="text-xs px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded transition-colors"
            >
              Empty State
            </button>
            <button
              onClick={() => {
                setType("dashboard_wisdom");
                handleGenerate();
              }}
              className="text-xs px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded transition-colors"
            >
              Wisdom
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
