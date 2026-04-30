"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RiMenuLine, RiCloseLine, RiGlobalLine } from "react-icons/ri";

interface SaudiHeaderProps {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
  user: any;
  scrollY: number;
}

export default function SaudiHeader({
  language,
  setLanguage,
  user,
  scrollY,
}: SaudiHeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsScrolled(scrollY > 50);
  }, [scrollY]);

  const navItems = [
    {
      name: language === "ar" ? "رؤية 2030" : "Vision 2030",
      href: "#vision2030",
    },
    {
      name: language === "ar" ? "الامتثال" : "Compliance",
      href: "#compliance",
    },
    {
      name: language === "ar" ? "التوطين" : "Localization",
      href: "#localization",
    },
    { name: language === "ar" ? "النجاحات" : "Success", href: "#success" },
  ];

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
            <div className="w-10 h-10 bg-gradient-to-br from-[#006c35] to-[#ffffff] rounded-lg flex items-center justify-center">
              <span className="text-[#006c35] font-bold text-xl">BD</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl">BlueDXP</div>
              <div className="text-white/60 text-xs">
                {language === "ar"
                  ? "منصة ذكاء المؤسسات"
                  : "Enterprise Intelligence Platform"}
              </div>
            </div>
          </motion.div>
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
              className="flex items-center space-x-2 text-white/80 hover:text-white"
            >
              <RiGlobalLine className="w-5 h-5" />
              <span className="text-sm">
                {language === "en" ? "العربية" : "English"}
              </span>
            </button>
            <motion.button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 bg-gradient-to-r from-[#006c35] to-[#008c44] text-white rounded-lg font-medium"
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
