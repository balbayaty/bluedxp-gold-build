"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RiMenuLine, RiCloseLine, RiGlobalLine } from "react-icons/ri";

interface ModulesHeaderProps {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
  user: any;
  scrollY: number;
}

export default function ModulesHeader({
  language,
  setLanguage,
  user,
  scrollY,
}: ModulesHeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsScrolled(scrollY > 50);
  }, [scrollY]);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#0a0e14]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <motion.div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">BD</span>
            </div>
            <div className="text-white font-bold text-xl">BlueDXP</div>
          </motion.div>
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#modules"
              className="text-white/80 hover:text-white transition-colors font-medium text-sm"
            >
              {language === "ar" ? "الوحدات" : "Modules"}
            </a>
            <a
              href="#integration"
              className="text-white/80 hover:text-white transition-colors font-medium text-sm"
            >
              {language === "ar" ? "التكامل" : "Integration"}
            </a>
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center space-x-2 text-white/80 hover:text-white"
            >
              <RiGlobalLine className="w-5 h-5" />
              <span className="text-sm">{language === "en" ? "AR" : "EN"}</span>
            </button>
            <motion.button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium"
              whileHover={{ scale: 1.05 }}
            >
              {language === "ar" ? "تسجيل الدخول" : "Sign In"}
            </motion.button>
          </nav>
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
    </motion.header>
  );
}
