"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { keyboardShortcuts, KeyboardShortcut } from "@/utils/keyboardShortcuts";
import Modal from "./Modal";

/**
 * Keyboard Shortcuts Help Modal
 * Shows all available keyboard shortcuts
 */
export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);

  useEffect(() => {
    setShortcuts(keyboardShortcuts.getAll());

    // Listen for shortcuts updates
    const interval = setInterval(() => {
      setShortcuts(keyboardShortcuts.getAll());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Register shortcut to open help (Ctrl+?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "?") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const categories: Array<{ name: string; icon: string }> = [
    { name: "navigation", icon: "ri-navigation-line" },
    { name: "search", icon: "ri-search-line" },
    { name: "actions", icon: "ri-flashlight-line" },
    { name: "system", icon: "ri-settings-3-line" },
  ];

  const formatKey = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.meta) parts.push("Meta");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white hover:border-cyan-500/50 transition-all z-40"
        title="Keyboard Shortcuts (Ctrl+?)"
        aria-label="Show keyboard shortcuts"
      >
        <i className="ri-keyboard-line text-xl"></i>
      </button>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Keyboard Shortcuts"
        size="lg"
      >
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryShortcuts = shortcuts.filter(
              (s) => s.category === category.name,
            );
            if (categoryShortcuts.length === 0) return null;

            return (
              <div key={category.name}>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                  <i className={category.icon}></i>
                  <span className="capitalize">{category.name}</span>
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          {shortcut.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {formatKey(shortcut)
                          .split(" + ")
                          .map((key, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-white/10 rounded text-xs text-white font-mono"
                            >
                              {key}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {shortcuts.length === 0 && (
            <div className="text-center py-8 text-[#9ca3af]">
              <i className="ri-keyboard-line text-4xl mb-4"></i>
              <p>No keyboard shortcuts registered yet.</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
