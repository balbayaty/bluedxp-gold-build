"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { User } from "@/types/user";

interface UltimateHeaderProps {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
  user: User | null;
  scrollY: number;
}

export default function UltimateHeader({
  language,
  setLanguage,
  user,
  scrollY,
}: UltimateHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const headerOpacity = Math.min(scrollY / 100, 1);
  const headerBlur = Math.min(scrollY / 5, 20);

  const navItems = [
    {
      href: "#intelligence",
      label: language === "en" ? "Intelligence" : "الذكاء",
      icon: "ri-brain-line",
    },
    {
      href: "#operations",
      label: language === "en" ? "Operations" : "العمليات",
      icon: "ri-bar-chart-box-line",
    },
    {
      href: "#integration",
      label: language === "en" ? "Integration" : "التكامل",
      icon: "ri-plug-line",
    },
    {
      href: "#governance",
      label: language === "en" ? "Governance" : "الحوكمة",
      icon: "ri-shield-star-line",
    },
  ];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: `rgba(10, 10, 15, ${headerOpacity * 0.95})`,
        backdropFilter: `blur(${headerBlur}px)`,
        borderBottom: `1px solid rgba(5, 164, 255, ${headerOpacity * 0.3})`,
        boxShadow:
          scrollY > 100 ? "0 10px 40px rgba(5, 164, 255, 0.1)" : "none",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center justify-between py-4">
          {/* Logo with magnetic effect */}
          <Link href="/ultimate" className="flex items-center group relative">
            <motion.div
              whileHover={{ scale: 1.1, rotateY: 10 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
              style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#05a4ff] via-[#00d4a8] to-[#8b5cf6] blur-2xl opacity-0 group-hover:opacity-75 transition-opacity duration-500 rounded-2xl" />

              {/* Logo container */}
              <div className="relative bg-gradient-to-br from-[#05a4ff]/30 to-[#00d4a8]/30 backdrop-blur-2xl border-2 border-[#05a4ff]/50 rounded-2xl p-3 group-hover:border-[#00d4a8]/70 transition-all shadow-2xl shadow-[#05a4ff]/30">
                <img
                  src="/bluedxp-logo.svg"
                  alt="BlueDXP"
                  className="h-10 w-auto object-contain"
                />
              </div>
            </motion.div>
          </Link>

          {/* Navigation with hover effects */}
          <div className="hidden lg:flex items-center gap-12 flex-1 justify-center">
            {navItems.map((item, index) => (
              <motion.a
                key={index}
                href={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.15, y: -3 }}
                className="relative text-sm font-semibold text-white/90 hover:text-[#05a4ff] transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <i className={`${item.icon} text-lg`}></i>
                  {item.label}
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 h-0.5 bg-gradient-to-r from-[#05a4ff] via-[#00d4a8] to-[#8b5cf6]"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />

                {/* Glow on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-[#05a4ff]/20 to-[#00d4a8]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 rounded-full" />
              </motion.a>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Language toggle with glassmorphism */}
            <div className="hidden sm:flex gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-lg">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setLanguage("en")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  language === "en"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-xl shadow-[#05a4ff]/40"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                EN
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setLanguage("ar")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  language === "ar"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-xl shadow-[#05a4ff]/40"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                العربية
              </motion.button>
            </div>

            {/* CTA with advanced effects */}
            {user ? (
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 40px rgba(5, 164, 255, 0.6)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard")}
                className="hidden sm:flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[#05a4ff] via-[#0088d1] to-[#00d4a8] text-white font-bold rounded-2xl transition-all duration-300 shadow-2xl shadow-[#05a4ff]/50 text-sm relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#00d4a8] via-[#05a4ff] to-[#8b5cf6]"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.5 }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  <i className="ri-dashboard-3-line text-xl"></i>
                  {language === "en" ? "Dashboard" : "لوحة التحكم"}
                </span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 40px rgba(5, 164, 255, 0.6)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/login")}
                className="hidden sm:flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[#05a4ff] via-[#0088d1] to-[#00d4a8] text-white font-bold rounded-2xl transition-all duration-300 shadow-2xl shadow-[#05a4ff]/50 text-sm relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#00d4a8] via-[#05a4ff] to-[#8b5cf6]"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.5 }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  <i className="ri-rocket-line text-xl"></i>
                  {language === "en" ? "Get Started" : "ابدأ الآن"}
                </span>
              </motion.button>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <i
                className={`ri-${mobileMenuOpen ? "close" : "menu"}-line text-2xl`}
              ></i>
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-white/10 mt-4 pb-4"
            >
              <div className="flex flex-col gap-4 pt-4">
                {navItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className="flex items-center gap-2 text-white/80 hover:text-[#05a4ff] transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className={item.icon}></i>
                    {item.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
