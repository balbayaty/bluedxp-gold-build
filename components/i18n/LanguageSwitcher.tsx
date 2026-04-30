/**
 * Language Switcher Component
 * Switch between languages with RTL support
 * Modern design matching CurrencySelector styling
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { i18nService, Language } from "@/lib/services/i18n/i18nService";

export default function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setCurrentLanguage(i18nService.getLanguage());

    const unsubscribe = i18nService.subscribe(() => {
      setCurrentLanguage(i18nService.getLanguage());
    });

    return unsubscribe;
  }, []);

  const handleLanguageChange = (language: Language) => {
    i18nService.setLanguage(language);
    setCurrentLanguage(language);
    localStorage.setItem("language", language);
    setShowMenu(false);
  };

  const languages = i18nService.getAvailableLanguages();
  const currentLang = languages.find((l) => l.code === currentLanguage);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <i className="ri-global-line text-cyan-400"></i>
        <span className="text-white text-sm">
          {currentLang?.nativeName || currentLanguage.toUpperCase()}
        </span>
        <i
          className={`ri-arrow-down-s-line text-gray-400 transition-transform ${showMenu ? "rotate-180" : ""}`}
        ></i>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[200px] z-50 shadow-xl"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                  currentLanguage === lang.code
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30"
                    : "hover:bg-white/10"
                }`}
              >
                <span className="text-white text-sm">{lang.nativeName}</span>
                {currentLanguage === lang.code && (
                  <i className="ri-check-line text-cyan-400"></i>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
