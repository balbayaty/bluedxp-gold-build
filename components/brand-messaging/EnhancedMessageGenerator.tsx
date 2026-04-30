"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBrandMessaging } from "@/lib/services/brand-messaging/useBrandMessaging";
import type {
  MessagingType,
  MessagingContext,
  BrandMessage,
  MessagingQuality,
} from "@/types/brand-messaging";
import { SmartTemplates } from "./SmartTemplates";
import { RealTimeFeedback } from "./RealTimeFeedback";

interface EnhancedMessageGeneratorProps {
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
  color: string;
}[] = [
  {
    value: "module_header",
    label: "Module Header",
    description: "Philosophical header",
    icon: "📝",
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "module_description",
    label: "Description",
    description: "Clear explanation",
    icon: "📄",
    color: "from-purple-500 to-pink-500",
  },
  {
    value: "empty_state",
    label: "Empty State",
    description: "Optimistic message",
    icon: "📭",
    color: "from-yellow-500 to-orange-500",
  },
  {
    value: "loading_state",
    label: "Loading",
    description: "Intelligent loading",
    icon: "⏳",
    color: "from-indigo-500 to-purple-500",
  },
  {
    value: "success_message",
    label: "Success",
    description: "Confident completion",
    icon: "✅",
    color: "from-green-500 to-emerald-500",
  },
  {
    value: "error_message",
    label: "Error",
    description: "Dignified error",
    icon: "⚠️",
    color: "from-red-500 to-rose-500",
  },
  {
    value: "notification",
    label: "Notification",
    description: "System alert",
    icon: "🔔",
    color: "from-amber-500 to-yellow-500",
  },
  {
    value: "button_label",
    label: "Button",
    description: "Action button",
    icon: "🔘",
    color: "from-teal-500 to-cyan-500",
  },
  {
    value: "tooltip",
    label: "Tooltip",
    description: "Help text",
    icon: "💡",
    color: "from-violet-500 to-purple-500",
  },
  {
    value: "dashboard_wisdom",
    label: "Wisdom",
    description: "Philosophical insight",
    icon: "🧠",
    color: "from-pink-500 to-rose-500",
  },
  {
    value: "feature_header",
    label: "Feature Header",
    description: "Feature title",
    icon: "🎯",
    color: "from-cyan-500 to-blue-500",
  },
  {
    value: "feature_description",
    label: "Feature Desc",
    description: "Feature explanation",
    icon: "📋",
    color: "from-emerald-500 to-teal-500",
  },
  {
    value: "onboarding_step",
    label: "Onboarding",
    description: "Welcome message",
    icon: "🚀",
    color: "from-orange-500 to-red-500",
  },
  {
    value: "confirmation_dialog",
    label: "Confirmation",
    description: "Action confirm",
    icon: "❓",
    color: "from-slate-500 to-gray-500",
  },
  {
    value: "welcome_message",
    label: "Welcome",
    description: "Greeting",
    icon: "👋",
    color: "from-blue-500 to-indigo-500",
  },
  {
    value: "completion_message",
    label: "Completion",
    description: "Task done",
    icon: "🎉",
    color: "from-green-500 to-lime-500",
  },
];

export const EnhancedMessageGenerator: React.FC<
  EnhancedMessageGeneratorProps
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
  const [showPreview, setShowPreview] = useState(true);
  const [livePreview, setLivePreview] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generationHistory, setGenerationHistory] = useState<BrandMessage[]>(
    [],
  );
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [showTemplates, setShowTemplates] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<
    "idle" | "generating" | "success" | "error"
  >("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  // Load modules
  useEffect(() => {
    loadModules();
  }, []);

  // Auto-fill context
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
      generateSuggestions(selectedModule);
    }
  }, [selectedModule, autoMode]);

  // Auto-fill feature
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

  // Live preview as user types
  useEffect(() => {
    if (context.moduleName && type === "module_header") {
      // Generate a simple preview
      const preview = `"${context.moduleName} — where ${context.metadata?.purpose || "intelligence meets operations"}"`;
      setLivePreview(preview);
    } else {
      setLivePreview("");
    }
  }, [context, type]);

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

  const generateSuggestions = (module: ModuleInfo) => {
    const suggestions: string[] = [];
    suggestions.push(`Generate header for ${module.name}`);
    suggestions.push(`Create description for ${module.name}`);
    suggestions.push(`Empty state message for ${module.name}`);
    if (module.routes.length > 0) {
      suggestions.push(`Feature description for ${module.routes[0].title}`);
    }
    setSuggestions(suggestions);
  };

  const handleModuleSelect = (moduleId: string) => {
    const moduleDef = modules.find((m) => m.id === moduleId);
    setSelectedModule(moduleDef || null);
    setSelectedFeature("");
    if (moduleDef) {
      setType("module_header");
    }
  };

  const handleQuickGenerate = async (quickType: MessagingType) => {
    setType(quickType);
    await handleGenerate();
  };

  const handleGenerate = async () => {
    setError(null);
    setGeneratedMessage(null);
    setFeedbackStatus("generating");
    setFeedbackMessage("Creating your message...");

    if (!context.moduleId && !context.moduleName) {
      setError("Please select a module or enter module name");
      setFeedbackStatus("error");
      setFeedbackMessage("Please select a module");
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
            includeSaudiContext: false,
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

        // Add to history
        setGenerationHistory((prev) => [result.data, ...prev.slice(0, 9)]);

        // Success feedback
        setFeedbackStatus("success");
        setFeedbackMessage(`Quality: ${quality?.overallScore || "N/A"}%`);
        setTimeout(() => setFeedbackStatus("idle"), 3000);
      } else {
        setError(result.error || "Failed to generate message");
        setFeedbackStatus("error");
        setFeedbackMessage(result.error || "Generation failed");
        setTimeout(() => setFeedbackStatus("idle"), 3000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate message",
      );
      setFeedbackStatus("error");
      setFeedbackMessage("Network error");
      setTimeout(() => setFeedbackStatus("idle"), 3000);
    }
  };

  const getSuggestedMessageTypes = (): MessagingType[] => {
    if (!selectedModule) return [];
    return [
      "module_header",
      "module_description",
      "empty_state",
      "dashboard_wisdom",
    ];
  };

  const selectedTypeInfo = MESSAGING_TYPES.find((t) => t.value === type);

  return (
    <div className="space-y-6">
      {/* Header with Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Intelligent Message Generator
            </h2>
            <p className="text-slate-400 text-sm">
              AI-powered, context-aware messaging with real-time preview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={autoMode}
                  onChange={(e) => setAutoMode(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-14 h-7 rounded-full transition-colors duration-300 ${
                    autoMode
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600"
                      : "bg-slate-700"
                  }`}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full mt-0.5 ml-0.5"
                    animate={{ x: autoMode ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                {autoMode ? "🤖 Auto" : "✏️ Manual"}
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-3 py-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30 transition-colors"
              >
                {showTemplates ? "✕" : "📋"}{" "}
                {showTemplates ? "Close" : "Templates"}
              </button>
              <button
                onClick={() => setShowWizard(!showWizard)}
                className="px-3 py-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg border border-purple-500/30 transition-colors"
              >
                {showWizard ? "✕" : "🧙"} {showWizard ? "Close" : "Wizard"}
              </button>
            </div>
          </div>
        </div>

        {/* Wizard Mode */}
        <AnimatePresence>
          {showWizard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-500/30 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">
                  Step-by-Step Wizard
                </h3>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all ${
                        wizardStep >= step
                          ? "bg-purple-400 w-6"
                          : "bg-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-sm text-slate-300">
                {wizardStep === 1 &&
                  "Step 1: Select a module from the dropdown below"}
                {wizardStep === 2 &&
                  "Step 2: Choose a message type or use quick actions"}
                {wizardStep === 3 && "Step 3: Review the auto-filled context"}
                {wizardStep === 4 &&
                  "Step 4: Generate and preview your message"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Smart Templates */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <SmartTemplates
              selectedModule={selectedModule?.id}
              onSelectTemplate={(template) => {
                setType(template.type);
                setContext((prev) => ({ ...prev, ...template.context }));
                if (template.context.moduleId) {
                  const moduleDef = modules.find(
                    (m) => m.id === template.context.moduleId,
                  );
                  if (moduleDef) setSelectedModule(moduleDef);
                }
                setShowTemplates(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Selection with Visual Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
      >
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Select Module{" "}
          {autoMode && selectedModule && (
            <span className="text-green-400 animate-pulse">
              ✓ Auto-filling...
            </span>
          )}
        </label>
        {loadingModules ? (
          <div className="flex items-center gap-2 text-slate-400">
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
            Discovering modules...
          </div>
        ) : (
          <select
            value={selectedModule?.id || ""}
            onChange={(e) => {
              handleModuleSelect(e.target.value);
              if (showWizard) setWizardStep(2);
            }}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">-- Select a Module --</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name} ({module.category})
              </option>
            ))}
          </select>
        )}

        {/* Enhanced Module Capabilities Display */}
        <AnimatePresence>
          {selectedModule && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 p-5 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl border border-slate-600 shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">
                    {selectedModule.name}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {selectedModule.description}
                  </p>
                </div>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-semibold"
                >
                  {selectedModule.category}
                </motion.span>
              </div>

              {/* Capability Stats with Icons */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center"
                >
                  <div className="text-2xl mb-1">🛣️</div>
                  <div className="text-xs text-slate-400 mb-1">Routes</div>
                  <div className="text-xl font-bold text-white">
                    {selectedModule.capabilities.routes}
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center"
                >
                  <div className="text-2xl mb-1">🧩</div>
                  <div className="text-xs text-slate-400 mb-1">Components</div>
                  <div className="text-xl font-bold text-white">
                    {selectedModule.capabilities.components}
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center"
                >
                  <div className="text-2xl mb-1">⚙️</div>
                  <div className="text-xs text-slate-400 mb-1">Services</div>
                  <div className="text-xl font-bold text-white">
                    {selectedModule.capabilities.services}
                  </div>
                </motion.div>
              </div>

              {/* Interactive Feature List */}
              {selectedModule.routes.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                    <span>✨</span>
                    <span>Available Features (click to select):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.routes.slice(0, 8).map((route, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedFeature(route.path);
                          if (showWizard) setWizardStep(3);
                        }}
                        className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                          selectedFeature === route.path
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                        }`}
                      >
                        {route.icon && (
                          <span className="mr-1">{route.icon}</span>
                        )}
                        {route.title}
                      </motion.button>
                    ))}
                    {selectedModule.routes.length > 8 && (
                      <span className="text-xs text-slate-500 self-center">
                        +{selectedModule.routes.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Message Type with Visual Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
      >
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Message Type
          {selectedModule && autoMode && (
            <span className="ml-2 text-xs text-blue-400">
              💡 Suggested: {getSuggestedMessageTypes().slice(0, 3).join(", ")}
            </span>
          )}
        </label>

        {/* Visual Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {MESSAGING_TYPES.map((msgType) => (
            <motion.button
              key={msgType.value}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setType(msgType.value);
                if (showWizard) setWizardStep(3);
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                type === msgType.value
                  ? `bg-gradient-to-br ${msgType.color} border-transparent text-white shadow-lg`
                  : "bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-2xl mb-1">{msgType.icon}</div>
              <div className="text-xs font-medium">{msgType.label}</div>
            </motion.button>
          ))}
        </div>

        {/* Selected Type Info */}
        {selectedTypeInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-3 rounded-lg bg-gradient-to-r ${selectedTypeInfo.color} bg-opacity-10 border border-${selectedTypeInfo.color.split("-")[1]}-500/30`}
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xl">{selectedTypeInfo.icon}</span>
              <span className="text-white font-medium">
                {selectedTypeInfo.label}
              </span>
              <span className="text-slate-300">—</span>
              <span className="text-slate-400">
                {selectedTypeInfo.description}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Context Fields with Auto-fill Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">Context</h3>
          {autoMode && (selectedModule || selectedFeature) && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="animate-pulse">✨</span>
              Auto-fill Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            {
              key: "moduleId",
              label: "Module ID",
              value: context.moduleId,
              autoFilled: autoMode && !!selectedModule,
            },
            {
              key: "moduleName",
              label: "Module Name",
              value: context.moduleName,
              autoFilled: autoMode && !!selectedModule,
            },
            {
              key: "featureName",
              label: "Feature Name",
              value: context.featureName,
              autoFilled: autoMode && !!selectedFeature,
            },
            {
              key: "action",
              label: "Action",
              value: context.action,
              autoFilled: false,
            },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2">
                {field.label}
                {field.autoFilled && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-400 text-xs"
                  >
                    ✓ Auto-filled
                  </motion.span>
                )}
              </label>
              <input
                type="text"
                value={field.value || ""}
                onChange={(e) =>
                  setContext({ ...context, [field.key]: e.target.value })
                }
                placeholder={`Enter ${field.label.toLowerCase()}`}
                disabled={field.autoFilled}
                className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-sm text-white transition-all ${
                  field.autoFilled
                    ? "border-green-500/50 bg-green-500/10 opacity-75 cursor-not-allowed"
                    : "border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Live Preview */}
      {livePreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-500/30"
        >
          <div className="text-xs text-blue-300 mb-2 flex items-center gap-2">
            <span className="animate-pulse">👁️</span>
            Live Preview
          </div>
          <div className="text-white font-medium italic">{livePreview}</div>
        </motion.div>
      )}

      {/* Quick Actions with Visual Buttons */}
      {selectedModule && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
        >
          <div className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <span>⚡</span>
            <span>Quick Generate</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                type: "module_header" as MessagingType,
                label: "Header",
                icon: "📝",
              },
              {
                type: "module_description" as MessagingType,
                label: "Description",
                icon: "📄",
              },
              {
                type: "empty_state" as MessagingType,
                label: "Empty State",
                icon: "📭",
              },
              {
                type: "dashboard_wisdom" as MessagingType,
                label: "Wisdom",
                icon: "🧠",
              },
            ].map((action) => (
              <motion.button
                key={action.type}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickGenerate(action.type)}
                disabled={isLoading}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-600 hover:border-blue-500 transition-all disabled:opacity-50"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs font-medium text-slate-300">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Generate Button with Animation */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          handleGenerate();
          if (showWizard) setWizardStep(4);
        }}
        disabled={isLoading || (!context.moduleId && !context.moduleName)}
        className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-500/50"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
            <span>Generating with AI...</span>
          </>
        ) : (
          <>
            <span className="text-2xl">✨</span>
            <span>Generate Message</span>
            {autoMode && (
              <span className="text-xs opacity-75">(AI-Enhanced)</span>
            )}
          </>
        )}
      </motion.button>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation History */}
      {generationHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
        >
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
            <span>📜</span>
            <span>Recent Generations</span>
          </div>
          <div className="space-y-2">
            {generationHistory.slice(0, 3).map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-xs text-slate-300 p-2 bg-slate-900/50 rounded hover:bg-slate-900 cursor-pointer transition-colors"
                onClick={() => {
                  setGeneratedMessage(msg);
                  onMessageGenerated(msg, null);
                }}
              >
                {msg.content.en.substring(0, 50)}...
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Real-time Feedback */}
      <RealTimeFeedback
        status={feedbackStatus}
        message={feedbackMessage}
        progress={feedbackStatus === "generating" ? 75 : undefined}
      />
    </div>
  );
};
