"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import AccessibilityQuestionnaire from "@/components/accessibility/AccessibilityQuestionnaire";

// ============================================================================
// LOCAL TYPES (self-contained for compatibility)
// ============================================================================

type CognitiveProfile =
  | "standard"
  | "adhd_friendly"
  | "dyslexia_friendly"
  | "autism_friendly"
  | "low_vision"
  | "motor_impaired"
  | "senior_friendly"
  | "custom";

// ============================================================================
// PROFILE CARDS
// ============================================================================

const PROFILE_CARDS: Array<{
  profile: CognitiveProfile;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}> = [
  {
    profile: "standard",
    name: "Standard",
    description: "Default experience with all features",
    icon: "ri-user-line",
    color: "from-gray-500 to-slate-600",
    features: ["All animations", "Standard text", "Default layout"],
  },
  {
    profile: "adhd_friendly",
    name: "Focus Mode",
    description: "Optimized for attention management",
    icon: "ri-focus-3-line",
    color: "from-purple-500 to-pink-500",
    features: ["Reduced distractions", "Progress tracking", "Break reminders"],
  },
  {
    profile: "dyslexia_friendly",
    name: "Dyslexia Support",
    description: "Enhanced text readability",
    icon: "ri-text",
    color: "from-blue-500 to-cyan-500",
    features: ["OpenDyslexic font", "Increased spacing", "Sepia theme"],
  },
  {
    profile: "autism_friendly",
    name: "Sensory Friendly",
    description: "Reduced sensory stimulation",
    icon: "ri-heart-line",
    color: "from-teal-500 to-emerald-500",
    features: ["No animations", "Muted colors", "Predictable layouts"],
  },
  {
    profile: "low_vision",
    name: "Vision Enhanced",
    description: "High visibility optimizations",
    icon: "ri-eye-line",
    color: "from-amber-500 to-orange-500",
    features: ["Large text", "High contrast", "Large cursor"],
  },
  {
    profile: "senior_friendly",
    name: "Simplified",
    description: "Easy-to-use interface",
    icon: "ri-user-star-line",
    color: "from-green-500 to-emerald-500",
    features: ["Larger buttons", "Clear labels", "Simple navigation"],
  },
];

// ============================================================================
// TOGGLE SWITCH COMPONENT
// ============================================================================

function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && (
          <p className="text-xs text-white/50 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`
          relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4
          ${enabled ? "bg-cyan-500" : "bg-white/20"}
        `}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
          animate={{ left: enabled ? 24 : 4 }}
          transition={{ duration: 0.2 }}
        />
      </button>
    </div>
  );
}

// ============================================================================
// SLIDER COMPONENT
// ============================================================================

function Slider({
  value,
  onChange,
  min,
  max,
  step,
  label,
  description,
  formatValue,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  description?: string;
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {description && (
            <p className="text-xs text-white/50 mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-lg font-bold text-cyan-400">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
      />
      <div className="flex justify-between text-xs text-white/30 mt-1">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}

// ============================================================================
// SELECT COMPONENT
// ============================================================================

function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  description,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; icon?: string }>;
  label: string;
  description?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="mb-3">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && (
          <p className="text-xs text-white/50 mt-0.5">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2
              ${
                value === option.value
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
              }
            `}
          >
            {option.icon && <i className={`${option.icon} text-sm`}></i>}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION COMPONENT
// ============================================================================

function SettingsSection({
  title,
  description,
  icon,
  color,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(enabled);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
      {/* Section Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}
          >
            <i className={`${icon} text-white text-lg`}></i>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-white/50">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Enable/Disable Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`
              px-3 py-1 rounded-lg text-xs font-medium transition-colors
              ${
                enabled
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/10 text-white/50 border border-white/10"
              }
            `}
          >
            {enabled ? "Enabled" : "Disabled"}
          </button>
          {/* Expand/Collapse */}
          <motion.i
            className="ri-arrow-down-s-line text-white/50 text-xl"
            animate={{ rotate: isExpanded ? 180 : 0 }}
          />
        </div>
      </div>

      {/* Section Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3 border-t border-white/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN SETTINGS COMPONENT
// ============================================================================

export default function AccessibilitySettings() {
  const {
    preferences,
    updatePreferences,
    resetPreferences,
    hasCompletedQuestionnaire,
    setQuestionnaireCompleted,
    exportPreferences,
    importPreferences,
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState<
    "profiles" | "customize" | "insights"
  >("profiles");
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [selectedProfile, setSelectedProfile] =
    useState<CognitiveProfile>("standard");

  // Handle profile selection
  const handleProfileSelect = useCallback(
    (profile: CognitiveProfile) => {
      setSelectedProfile(profile);

      // Apply profile-specific settings
      const profileSettings: Record<CognitiveProfile, any> = {
        standard: {
          visual: { fontSize: 100, contrast: "normal" },
          motion: { reducedMotion: false },
          focus: { adhdMode: false },
        },
        adhd_friendly: {
          focus: {
            adhdMode: true,
            minimizeDistractions: true,
            highlightFocus: true,
          },
          motion: { reducedMotion: true },
        },
        dyslexia_friendly: {
          visual: {
            fontFamily: "dyslexic",
            lineHeight: 1.8,
            letterSpacing: 1,
            fontSize: 110,
          },
        },
        autism_friendly: {
          motion: {
            reducedMotion: true,
            disableAutoplay: true,
            pauseAnimations: true,
          },
          visual: { saturation: 80 },
        },
        low_vision: {
          visual: { fontSize: 150, contrast: "high" },
          focus: { focusIndicatorSize: "large", highlightFocus: true },
        },
        motor_impaired: {
          focus: { focusIndicatorSize: "large", highlightFocus: true },
        },
        senior_friendly: {
          visual: { fontSize: 130, contrast: "high" },
          focus: { simplifyInterface: true },
        },
        custom: {},
      };

      if (profileSettings[profile]) {
        updatePreferences(profileSettings[profile]);
      }
    },
    [updatePreferences],
  );

  // Handle questionnaire
  const handleQuestionnaireComplete = useCallback(() => {
    setShowQuestionnaire(false);
  }, []);

  const handleQuestionnaireSkip = useCallback(() => {
    setShowQuestionnaire(false);
  }, []);

  // Export settings
  const handleExport = useCallback(() => {
    const json = exportPreferences();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hazalyze-accessibility-preferences.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportPreferences]);

  // Import settings
  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importPreferences(content)) {
          alert("Settings imported successfully!");
        } else {
          alert("Failed to import settings. Please check the file format.");
        }
      };
      reader.readAsText(file);
    },
    [importPreferences],
  );

  const stats = [
    {
      label: "Current Profile",
      value: selectedProfile.replace("_", " "),
      icon: "ri-user-star-line",
      tooltip: "Your active accessibility profile",
      trend: "neutral" as const,
    },
    {
      label: "Accessibility",
      value: preferences.enabled ? "Active" : "Inactive",
      icon: "ri-checkbox-circle-line",
      tooltip: "Accessibility features status",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Accessibility & Adaptive UI"
      description="Personalize your interface for comfort, accessibility, and productivity. Every user is unique."
      shortDescription="Personalize your experience"
      icon="ri-user-heart-line"
      systemInfo={{
        sap: "User Experience",
        oracle: "Accessibility Settings",
        manhattan: "UI Personalization",
      }}
      examples={[
        "Choose a cognitive profile",
        "Adjust text size and fonts",
        "Configure motion preferences",
        "Set up intelligent insights",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuestionnaire(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <i className="ri-magic-line"></i>
            <span className="hidden sm:inline">Take Questionnaire</span>
          </button>
          <button
            onClick={resetPreferences}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <i className="ri-refresh-line"></i>
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "profiles", label: "Profiles", icon: "ri-user-star-line" },
          { id: "customize", label: "Customize", icon: "ri-settings-4-line" },
          { id: "insights", label: "Insights", icon: "ri-lightbulb-line" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap
              ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
              }
            `}
          >
            <i className={tab.icon}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Profiles Tab */}
        {activeTab === "profiles" && (
          <motion.div
            key="profiles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Profile Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROFILE_CARDS.map((profile) => (
                <motion.div
                  key={profile.profile}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProfileSelect(profile.profile)}
                  className={`
                    p-5 rounded-2xl border cursor-pointer transition-all
                    ${
                      selectedProfile === profile.profile
                        ? "bg-cyan-500/10 border-cyan-500 ring-2 ring-cyan-500/30"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${profile.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <i className={`${profile.icon} text-white text-xl`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-white">
                          {profile.name}
                        </h3>
                        {selectedProfile === profile.profile && (
                          <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                            <i className="ri-check-line text-white text-sm"></i>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-1">
                        {profile.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {profile.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/60"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Questionnaire Prompt */}
            {!hasCompletedQuestionnaire && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <i className="ri-questionnaire-line text-white text-2xl"></i>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-white">
                      Not sure which profile suits you?
                    </h3>
                    <p className="text-sm text-white/60 mt-1">
                      Take our quick questionnaire and we'll recommend the best
                      settings for you.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQuestionnaire(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Start Questionnaire
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Customize Tab */}
        {activeTab === "customize" && (
          <motion.div
            key="customize"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Text & Reading */}
            <SettingsSection
              title="Text & Reading"
              description="Customize text appearance for better readability"
              icon="ri-text"
              color="from-blue-500 to-cyan-500"
              enabled={true}
              onToggle={() => {}}
            >
              <Slider
                value={preferences.visual?.fontSize || 100}
                onChange={(v) =>
                  updatePreferences({
                    visual: { ...preferences.visual, fontSize: v },
                  })
                }
                min={80}
                max={200}
                step={5}
                label="Font Size"
                description="Adjust the base text size"
                formatValue={(v) => `${v}%`}
              />
              <Slider
                value={preferences.visual?.lineHeight || 1.5}
                onChange={(v) =>
                  updatePreferences({
                    visual: { ...preferences.visual, lineHeight: v },
                  })
                }
                min={1}
                max={2.5}
                step={0.1}
                label="Line Height"
                description="Space between lines of text"
              />
              <Select<string>
                value={preferences.visual?.fontFamily || "default"}
                onChange={(v) =>
                  updatePreferences({
                    visual: { ...preferences.visual, fontFamily: v as any },
                  })
                }
                options={[
                  {
                    value: "default",
                    label: "System",
                    icon: "ri-computer-line",
                  },
                  { value: "dyslexic", label: "OpenDyslexic", icon: "ri-text" },
                  { value: "mono", label: "Monospace", icon: "ri-code-line" },
                  { value: "serif", label: "Serif", icon: "ri-font-size" },
                ]}
                label="Font Family"
                description="Choose a font optimized for your needs"
              />
            </SettingsSection>

            {/* Visual */}
            <SettingsSection
              title="Visual Adjustments"
              description="Customize colors, contrast, and visual effects"
              icon="ri-palette-line"
              color="from-purple-500 to-pink-500"
              enabled={true}
              onToggle={() => {}}
            >
              <Select<string>
                value={preferences.visual?.contrast || "normal"}
                onChange={(v) =>
                  updatePreferences({
                    visual: { ...preferences.visual, contrast: v as any },
                  })
                }
                options={[
                  {
                    value: "normal",
                    label: "Normal",
                    icon: "ri-contrast-line",
                  },
                  { value: "high", label: "High", icon: "ri-contrast-2-line" },
                  {
                    value: "higher",
                    label: "Higher",
                    icon: "ri-contrast-drop-line",
                  },
                  {
                    value: "max",
                    label: "Maximum",
                    icon: "ri-contrast-drop-2-line",
                  },
                ]}
                label="Contrast Level"
              />
              <Select<string>
                value={preferences.visual?.colorBlindMode || "none"}
                onChange={(v) =>
                  updatePreferences({
                    visual: { ...preferences.visual, colorBlindMode: v as any },
                  })
                }
                options={[
                  { value: "none", label: "None", icon: "ri-palette-line" },
                  {
                    value: "protanopia",
                    label: "Protanopia",
                    icon: "ri-contrast-drop-line",
                  },
                  {
                    value: "deuteranopia",
                    label: "Deuteranopia",
                    icon: "ri-contrast-drop-line",
                  },
                  {
                    value: "tritanopia",
                    label: "Tritanopia",
                    icon: "ri-contrast-drop-line",
                  },
                ]}
                label="Color Blind Mode"
              />
              <ToggleSwitch
                enabled={preferences.visual?.invertColors || false}
                onChange={(v) =>
                  updatePreferences({
                    visual: { ...preferences.visual, invertColors: v },
                  })
                }
                label="Invert Colors"
                description="Swap light and dark colors"
              />
              <ToggleSwitch
                enabled={preferences.visual?.grayscale || false}
                onChange={(v) =>
                  updatePreferences({
                    visual: { ...preferences.visual, grayscale: v },
                  })
                }
                label="Grayscale Mode"
                description="Remove all colors from the interface"
              />
            </SettingsSection>

            {/* Motion */}
            <SettingsSection
              title="Motion & Animation"
              description="Control animations and transitions"
              icon="ri-movie-line"
              color="from-amber-500 to-orange-500"
              enabled={true}
              onToggle={() => {}}
            >
              <ToggleSwitch
                enabled={preferences.motion?.reducedMotion || false}
                onChange={(v) =>
                  updatePreferences({
                    motion: { ...preferences.motion, reducedMotion: v },
                  })
                }
                label="Reduce Motion"
                description="Minimize animations throughout the interface"
              />
              <ToggleSwitch
                enabled={preferences.motion?.disableAutoplay || false}
                onChange={(v) =>
                  updatePreferences({
                    motion: { ...preferences.motion, disableAutoplay: v },
                  })
                }
                label="Disable Autoplay"
                description="Stop videos and animations from playing automatically"
              />
              <ToggleSwitch
                enabled={preferences.motion?.pauseAnimations || false}
                onChange={(v) =>
                  updatePreferences({
                    motion: { ...preferences.motion, pauseAnimations: v },
                  })
                }
                label="Pause All Animations"
                description="Completely stop all animated elements"
              />
            </SettingsSection>

            {/* Focus & Productivity */}
            <SettingsSection
              title="Focus & Productivity"
              description="Features to help maintain focus (ADHD-friendly)"
              icon="ri-focus-3-line"
              color="from-green-500 to-emerald-500"
              enabled={true}
              onToggle={() => {}}
            >
              <ToggleSwitch
                enabled={preferences.focus?.adhdMode || false}
                onChange={(v) =>
                  updatePreferences({
                    focus: { ...preferences.focus, adhdMode: v },
                  })
                }
                label="ADHD Mode"
                description="Optimized interface for attention management"
              />
              <ToggleSwitch
                enabled={preferences.focus?.minimizeDistractions || false}
                onChange={(v) =>
                  updatePreferences({
                    focus: { ...preferences.focus, minimizeDistractions: v },
                  })
                }
                label="Minimize Distractions"
                description="Hide non-essential elements and notifications"
              />
              <ToggleSwitch
                enabled={preferences.focus?.highlightFocus || false}
                onChange={(v) =>
                  updatePreferences({
                    focus: { ...preferences.focus, highlightFocus: v },
                  })
                }
                label="Enhanced Focus Highlight"
                description="Stronger visual indicator for focused elements"
              />
              <ToggleSwitch
                enabled={preferences.focus?.simplifyInterface || false}
                onChange={(v) =>
                  updatePreferences({
                    focus: { ...preferences.focus, simplifyInterface: v },
                  })
                }
                label="Simplified Interface"
                description="Show only essential features and options"
              />
            </SettingsSection>
          </motion.div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <SettingsSection
              title="Intelligent Insights"
              description="AI-powered tips, suggestions, and notifications"
              icon="ri-lightbulb-line"
              color="from-yellow-500 to-amber-500"
              enabled={preferences.insights?.enabled ?? true}
              onToggle={() =>
                updatePreferences({
                  insights: {
                    ...preferences.insights,
                    enabled: !preferences.insights?.enabled,
                  },
                })
              }
            >
              <Select<string>
                value={preferences.insights?.popupStyle || "toast"}
                onChange={(v) =>
                  updatePreferences({
                    insights: { ...preferences.insights, popupStyle: v as any },
                  })
                }
                options={[
                  { value: "toast", label: "Toast", icon: "ri-message-line" },
                  {
                    value: "banner",
                    label: "Banner",
                    icon: "ri-layout-top-line",
                  },
                  { value: "modal", label: "Modal", icon: "ri-window-line" },
                  {
                    value: "minimal",
                    label: "Minimal",
                    icon: "ri-subtract-line",
                  },
                ]}
                label="Notification Style"
              />
              <Select<string>
                value={preferences.insights?.position || "bottom-right"}
                onChange={(v) =>
                  updatePreferences({
                    insights: { ...preferences.insights, position: v as any },
                  })
                }
                options={[
                  {
                    value: "top-right",
                    label: "Top Right",
                    icon: "ri-arrow-right-up-line",
                  },
                  {
                    value: "bottom-right",
                    label: "Bottom Right",
                    icon: "ri-arrow-right-down-line",
                  },
                  {
                    value: "top-left",
                    label: "Top Left",
                    icon: "ri-arrow-left-up-line",
                  },
                  {
                    value: "bottom-left",
                    label: "Bottom Left",
                    icon: "ri-arrow-left-down-line",
                  },
                ]}
                label="Notification Position"
              />
              <ToggleSwitch
                enabled={preferences.insights?.proactiveHints ?? true}
                onChange={(v) =>
                  updatePreferences({
                    insights: { ...preferences.insights, proactiveHints: v },
                  })
                }
                label="Proactive Hints"
                description="Show helpful tips before you ask"
              />
              <ToggleSwitch
                enabled={preferences.insights?.mlPersonalization ?? true}
                onChange={(v) =>
                  updatePreferences({
                    insights: { ...preferences.insights, mlPersonalization: v },
                  })
                }
                label="ML Personalization"
                description="Allow AI to learn your preferences"
              />
            </SettingsSection>

            {/* Export/Import */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-base font-semibold text-white mb-2">
                Backup & Sync
              </h3>
              <p className="text-sm text-white/50 mb-4">
                Export or import your accessibility preferences
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <i className="ri-download-line"></i>
                  Export Settings
                </button>
                <label className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-colors flex items-center gap-2 cursor-pointer">
                  <i className="ri-upload-line"></i>
                  Import Settings
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questionnaire Modal */}
      <AnimatePresence>
        {showQuestionnaire && (
          <AccessibilityQuestionnaire
            onComplete={handleQuestionnaireComplete}
            onSkip={handleQuestionnaireSkip}
          />
        )}
      </AnimatePresence>
    </PageTemplate>
  );
}
