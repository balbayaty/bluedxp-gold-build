"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { User } from "@/types/user";

interface PremiumHeaderProps {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
  user: User | null;
  scrollY: number;
}

export default function PremiumHeader({
  language,
  setLanguage,
  user,
  scrollY,
}: PremiumHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.1], [0, 20]);

  useEffect(() => {
    setScrolled(scrollY > 50);
  }, [scrollY]);

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
      style={{
        opacity: headerOpacity,
        backdropFilter: `blur(${headerBlur}px)`,
      }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0a0f]/95 border-b border-[#05a4ff]/30 shadow-2xl shadow-[#05a4ff]/20"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center justify-between py-4">
          {/* Logo with 3D Effect */}
          <Link href="/premium" className="flex items-center group">
            <motion.div
              whileHover={{ scale: 1.1, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#05a4ff]/30 to-[#00d4a8]/30 backdrop-blur-2xl border border-[#05a4ff]/40 rounded-2xl p-3 group-hover:border-[#05a4ff]/60 transition-all shadow-lg shadow-[#05a4ff]/20">
                <img
                  src="/bluedxp-logo.svg"
                  alt="BlueDXP"
                  className="h-10 w-auto object-contain"
                />
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation with Hover Effects */}
          <div className="hidden lg:flex items-center gap-10 flex-1 justify-center">
            {[
              { href: "#intelligence", label: t.intelligence },
              { href: "#operations", label: t.operations },
              { href: "#integration", label: t.integration },
              { href: "#governance", label: t.governance },
            ].map((item, index) => (
              <motion.a
                key={index}
                href={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.1, y: -2 }}
                className="relative text-sm font-medium text-white/90 hover:text-[#05a4ff] transition-colors group"
              >
                {item.label}
                <motion.span
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8]"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Language Toggle with Glassmorphism */}
            <div className="hidden sm:flex gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1.5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLanguage("en")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  language === "en"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                EN
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLanguage("ar")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  language === "ar"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                العربية
              </motion.button>
            </div>

            {/* CTA Button with Glow Effect */}
            {user ? (
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(5, 164, 255, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard")}
                className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-xl hover:from-[#0088d1] hover:to-[#006ea7] transition-all duration-300 shadow-xl shadow-[#05a4ff]/40 text-sm"
              >
                <i className="ri-dashboard-3-line"></i>
                {t.dashboard}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(5, 164, 255, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/login")}
                className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-xl hover:from-[#0088d1] hover:to-[#006ea7] transition-all duration-300 shadow-xl shadow-[#05a4ff]/40 text-sm"
              >
                <i className="ri-rocket-line"></i>
                {t.getStarted}
              </motion.button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
              className="lg:hidden border-t border-white/10 mt-4 pb-4"
            >
              <div className="flex flex-col gap-4 pt-4">
                {[
                  { href: "#intelligence", label: t.intelligence },
                  { href: "#operations", label: t.operations },
                  { href: "#integration", label: t.integration },
                  { href: "#governance", label: t.governance },
                ].map((item, index) => (
                  <motion.a
                    key={index}
                    href={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="text-white/80 hover:text-[#05a4ff] transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
