"use client";

// ============================================================================
// ACCESSIBILITY QUICK ACCESS WIDGET
// Floating button for quick accessibility controls
// ============================================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { ACCESSIBILITY_PROFILES } from "@/types/accessibility";
import { useRouter } from "next/navigation";

export default function AccessibilityQuickAccess() {
  const { preferences, updatePreferences, applyProfile, setSettingsOpen } =
    useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Don't show if disabled
  if (!preferences.enabled) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white z-[9998] hover:shadow-cyan-500/50 transition-shadow"
        aria-label="Accessibility quick access"
      >
        <i className="ri-accessible-line text-2xl"></i>
      </motion.button>

      {/* Quick Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-24 left-6 w-80 bg-[#1f2937]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[9997] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Quick Access</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            {/* Font Size Quick Adjust */}
            <div className="p-4 border-b border-white/10">
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Font Size: {preferences.visual.fontSize}%
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updatePreferences({
                      visual: {
                        ...preferences.visual,
                        fontSize: Math.max(
                          80,
                          preferences.visual.fontSize - 10,
                        ),
                      },
                    })
                  }
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white transition-colors"
                >
                  <i className="ri-subtract-line"></i>
                </button>
                <input
                  type="range"
                  min="80"
                  max="200"
                  step="10"
                  value={preferences.visual.fontSize}
                  onChange={(e) =>
                    updatePreferences({
                      visual: {
                        ...preferences.visual,
                        fontSize: parseInt(e.target.value),
                      },
                    })
                  }
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <button
                  onClick={() =>
                    updatePreferences({
                      visual: {
                        ...preferences.visual,
                        fontSize: Math.min(
                          200,
                          preferences.visual.fontSize + 10,
                        ),
                      },
                    })
                  }
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white transition-colors"
                >
                  <i className="ri-add-line"></i>
                </button>
              </div>
            </div>

            {/* Quick Toggles */}
            <div className="p-4 space-y-2">
              <QuickToggle
                label="ADHD Mode"
                icon="ri-focus-line"
                checked={preferences.focus.adhdMode}
                onChange={(checked) =>
                  updatePreferences({
                    focus: { ...preferences.focus, adhdMode: checked },
                  })
                }
              />
              <QuickToggle
                label="Reading Mode"
                icon="ri-book-open-line"
                checked={preferences.reading.readingMode}
                onChange={(checked) =>
                  updatePreferences({
                    reading: { ...preferences.reading, readingMode: checked },
                  })
                }
              />
              <QuickToggle
                label="Reduced Motion"
                icon="ri-speed-line"
                checked={preferences.motion.reducedMotion}
                onChange={(checked) =>
                  updatePreferences({
                    motion: { ...preferences.motion, reducedMotion: checked },
                  })
                }
              />
              <QuickToggle
                label="High Contrast"
                icon="ri-contrast-line"
                checked={preferences.visual.contrast !== "normal"}
                onChange={(checked) =>
                  updatePreferences({
                    visual: {
                      ...preferences.visual,
                      contrast: checked ? "high" : "normal",
                    },
                  })
                }
              />
            </div>

            {/* Quick Profiles */}
            <div className="p-4 border-t border-white/10">
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Quick Profiles
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSIBILITY_PROFILES.slice(0, 4).map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      applyProfile(profile.id);
                      setIsOpen(false);
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <i
                        className={`${profile.icon} text-cyan-400 text-sm`}
                      ></i>
                      <span className="text-xs text-white group-hover:text-cyan-400 transition-colors">
                        {profile.name.split(" ")[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Settings Link */}
            <button
              onClick={() => {
                router.push("/settings/accessibility");
                setIsOpen(false);
              }}
              className="w-full p-4 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border-t border-cyan-500/30 text-cyan-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <span>Full Settings</span>
              <i className="ri-arrow-right-line"></i>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function QuickToggle({ label, icon, checked, onChange }: any) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
    >
      <div className="flex items-center gap-2">
        <i
          className={`${icon} text-gray-400 group-hover:text-cyan-400 transition-colors`}
        ></i>
        <span className="text-sm text-white">{label}</span>
      </div>
      <div
        className={`w-9 h-5 rounded-full transition-colors relative ${
          checked ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-white/10"
        }`}
      >
        <motion.div
          animate={{ x: checked ? 16 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-lg"
        />
      </div>
    </button>
  );
}
