"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface LandingHeaderProps {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
}

export default function LandingHeader({
  language,
  setLanguage,
}: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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
      roadmap: "Roadmap",
      getStarted: "Get Started",
    },
    ar: {
      intelligence: "الذكاء",
      operations: "العمليات",
      integration: "التكامل",
      governance: "الحوكمة",
      roadmap: "خارطة الطريق",
      getStarted: "ابدأ الآن",
    },
  };

  const t = translations[language];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0e14]/98 backdrop-blur-xl border-b border-[#05a4ff]/20"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-10">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/landing" className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] blur-xl opacity-30"></div>
              <div className="relative">
                <img
                  src="/bluedxp-logo.svg"
                  alt="BlueDXP"
                  className="h-8 w-auto object-contain"
                />
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
            <a
              href="#intelligence"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              {t.intelligence}
            </a>
            <a
              href="#operations"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              {t.operations}
            </a>
            <a
              href="#integration"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              {t.integration}
            </a>
            <a
              href="#governance"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              {t.governance}
            </a>
            <a
              href="#roadmap"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              {t.roadmap}
            </a>
          </div>

          {/* Language Toggle & CTA */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  language === "en"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white"
                    : "bg-white/5 text-[#cbd5e1] hover:bg-white/10 border border-white/10"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("ar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  language === "ar"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white"
                    : "bg-white/5 text-[#cbd5e1] hover:bg-white/10 border border-white/10"
                }`}
              >
                العربية
              </button>
            </div>
            {user ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-lg hover:from-[#0088d1] hover:to-[#006ea7] transform hover:scale-105 transition-all duration-200 shadow-lg shadow-[#05a4ff]/25 text-sm"
              >
                {language === "ar" ? "اذهب إلى لوحة التحكم" : "Go to Dashboard"}
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="px-6 py-2.5 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-lg hover:from-[#0088d1] hover:to-[#006ea7] transform hover:scale-105 transition-all duration-200 shadow-lg shadow-[#05a4ff]/25 text-sm"
              >
                {t.getStarted}
              </button>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
