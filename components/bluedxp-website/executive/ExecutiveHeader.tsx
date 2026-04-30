"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RiMenuLine, RiCloseLine, RiGlobalLine } from "react-icons/ri";

interface ExecutiveHeaderProps {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
  user: any;
  scrollY: number;
}

export default function ExecutiveHeader({
  language,
  setLanguage,
  user,
  scrollY,
}: ExecutiveHeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsScrolled(scrollY > 50);
  }, [scrollY]);

  const navItems = [
    {
      name: language === "ar" ? "القدرات" : "Capabilities",
      href: "#capabilities",
    },
    {
      name: language === "ar" ? "الامتثال" : "Compliance",
      href: "#compliance",
    },
    {
      name: language === "ar" ? "الذكاء" : "Intelligence",
      href: "#intelligence",
    },
    { name: language === "ar" ? "الأمان" : "Security", href: "#security" },
    { name: language === "ar" ? "ROI" : "ROI", href: "#roi" },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0a0e14]/95 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">BD</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl">BlueDXP</div>
              <div className="text-white/60 text-xs">
                Enterprise Intelligence OS
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-white/80 hover:text-white transition-colors font-medium text-sm"
              >
                {item.name}
              </a>
            ))}
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <RiGlobalLine className="w-5 h-5" />
              <span className="text-sm font-medium">
                {language === "en" ? "AR" : "EN"}
              </span>
            </button>
            <motion.button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {language === "ar" ? "تسجيل الدخول" : "Sign In"}
            </motion.button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <RiCloseLine className="w-6 h-6" />
            ) : (
              <RiMenuLine className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden bg-[#0a0e14]/98 backdrop-blur-md border-t border-white/10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block text-white/80 hover:text-white transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <button
                onClick={() => {
                  setLanguage(language === "en" ? "ar" : "en");
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors w-full"
              >
                <RiGlobalLine className="w-5 h-5" />
                <span>{language === "en" ? "العربية" : "English"}</span>
              </button>
              <motion.button
                onClick={() => router.push("/login")}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium"
                whileTap={{ scale: 0.95 }}
              >
                {language === "ar" ? "تسجيل الدخول" : "Sign In"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
