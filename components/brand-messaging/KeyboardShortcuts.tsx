"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface KeyboardShortcutsProps {
  onShortcut?: (action: string) => void;
}

const SHORTCUTS = [
  { key: "G", action: "generate", description: "Generate message" },
  { key: "M", action: "toggle-mode", description: "Toggle auto/manual mode" },
  { key: "T", action: "templates", description: "Show templates" },
  { key: "W", action: "wizard", description: "Toggle wizard" },
  { key: "E", action: "export", description: "Export message" },
  { key: "V", action: "variations", description: "Generate variations" },
  { key: "Esc", action: "close", description: "Close panels" },
];

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onShortcut,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      const shortcut = SHORTCUTS.find(
        (s) =>
          s.key.toUpperCase() === key || (key === "ESCAPE" && s.key === "Esc"),
      );

      if (shortcut && (e.ctrlKey || e.metaKey || shortcut.key === "Esc")) {
        e.preventDefault();
        setPressedKey(shortcut.key);
        setTimeout(() => setPressedKey(null), 200);
        onShortcut?.(shortcut.action);
      }

      // Show help with ?
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        setShowHelp(true);
      }

      // Close help with Esc
      if (e.key === "Escape") {
        setShowHelp(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onShortcut]);

  return (
    <>
      {/* Help Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowHelp(!showHelp)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full shadow-lg flex items-center justify-center text-white z-50"
        title="Keyboard Shortcuts (Press ?)"
      >
        <span className="text-xl">⌨️</span>
      </motion.button>

      {/* Shortcuts Panel */}
      <AnimatePresence>
        {showHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-6 bg-slate-800 rounded-xl p-6 border border-slate-600 shadow-2xl z-50 max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Keyboard Shortcuts
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {SHORTCUTS.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-300">
                      {shortcut.description}
                    </span>
                    <kbd
                      className={`px-2 py-1 bg-slate-700 rounded text-xs font-mono ${
                        pressedKey === shortcut.key ? "bg-blue-600" : ""
                      }`}
                    >
                      {shortcut.key === "Esc" ? "Esc" : `Ctrl+${shortcut.key}`}
                    </kbd>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-600 text-xs text-slate-400">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">?</kbd> to
                toggle this help
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
