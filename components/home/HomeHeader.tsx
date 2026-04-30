"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/types/user";

interface HomeHeaderProps {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
  user: User | null;
}

export default function HomeHeader({
  language,
  setLanguage,
  user,
}: HomeHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const translations = {
    en: {
      intelligence: "Intelligence",
      operations: "Operations",
      integration: "Integration",
      governance: "Governance",
      getStarted: "Get Started",
      dashboard: "Dashboard",
    },
    ar: {
      intelligence: "الذكاء",
      operations: "العمليات",
      integration: "التكامل",
      governance: "الحوكمة",
      getStarted: "ابدأ الآن",
      dashboard: "لوحة التحكم",
    },
  };

  const t = translations[language];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0e14]/95 backdrop-blur-xl border-b border-[#05a4ff]/20 shadow-2xl shadow-[#05a4ff]/10"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/home" className="flex items-center group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#05a4ff]/20 to-[#00d4a8]/20 backdrop-blur-xl border border-[#05a4ff]/30 rounded-xl p-2 group-hover:border-[#05a4ff]/50 transition-all">
                <img
                  src="/bluedxp-logo.svg"
                  alt="BlueDXP"
                  className="h-8 w-auto object-contain"
                />
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
            <a
              href="#intelligence"
              className="text-sm font-medium text-white/80 hover:text-[#05a4ff] transition-colors relative group"
            >
              {t.intelligence}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#operations"
              className="text-sm font-medium text-white/80 hover:text-[#05a4ff] transition-colors relative group"
            >
              {t.operations}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#integration"
              className="text-sm font-medium text-white/80 hover:text-[#05a4ff] transition-colors relative group"
            >
              {t.integration}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#governance"
              className="text-sm font-medium text-white/80 hover:text-[#05a4ff] transition-colors relative group"
            >
              {t.governance}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] group-hover:w-full transition-all duration-300" />
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <div className="hidden sm:flex gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  language === "en"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/25"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("ar")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  language === "ar"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/25"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                العربية
              </button>
            </div>

            {/* CTA Button */}
            {user ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard")}
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-lg hover:from-[#0088d1] hover:to-[#006ea7] transition-all duration-200 shadow-lg shadow-[#05a4ff]/25 text-sm"
              >
                <i className="ri-dashboard-3-line"></i>
                {t.dashboard}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/login")}
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-lg hover:from-[#0088d1] hover:to-[#006ea7] transition-all duration-200 shadow-lg shadow-[#05a4ff]/25 text-sm"
              >
                <i className="ri-rocket-line"></i>
                {t.getStarted}
              </motion.button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <i
                className={`ri-${mobileMenuOpen ? "close" : "menu"}-line text-xl`}
              ></i>
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 mt-4 pb-4"
            >
              <div className="flex flex-col gap-4 pt-4">
                <a
                  href="#intelligence"
                  className="text-white/80 hover:text-[#05a4ff] transition-colors"
                >
                  {t.intelligence}
                </a>
                <a
                  href="#operations"
                  className="text-white/80 hover:text-[#05a4ff] transition-colors"
                >
                  {t.operations}
                </a>
                <a
                  href="#integration"
                  className="text-white/80 hover:text-[#05a4ff] transition-colors"
                >
                  {t.integration}
                </a>
                <a
                  href="#governance"
                  className="text-white/80 hover:text-[#05a4ff] transition-colors"
                >
                  {t.governance}
                </a>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                      language === "en"
                        ? "bg-[#05a4ff] text-white"
                        : "bg-white/5 text-white/60"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLanguage("ar")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                      language === "ar"
                        ? "bg-[#05a4ff] text-white"
                        : "bg-white/5 text-white/60"
                    }`}
                  >
                    العربية
                  </button>
                </div>
                {user ? (
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-lg text-sm"
                  >
                    {t.dashboard}
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-lg text-sm"
                  >
                    {t.getStarted}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
