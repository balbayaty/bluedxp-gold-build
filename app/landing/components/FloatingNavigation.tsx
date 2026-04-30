"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShowcase } from "@/contexts/ShowcaseContext";

interface FloatingNavigationProps {
  language: "en" | "ar";
}

/**
 * Floating Navigation with smooth scroll and section highlighting
 */
export default function FloatingNavigation({
  language,
}: FloatingNavigationProps) {
  const [activeSection, setActiveSection] = useState("hero");
  const [isVisible, setIsVisible] = useState(true);
  const { setActiveSection: setShowcaseSection } = useShowcase();

  const sections = [
    {
      id: "hero",
      label: language === "en" ? "Home" : "الرئيسية",
      icon: "ri-home-line",
    },
    {
      id: "challenge",
      label: language === "en" ? "Challenge" : "التحدي",
      icon: "ri-bar-chart-line",
    },
    {
      id: "intelligence",
      label: language === "en" ? "Intelligence" : "الذكاء",
      icon: "ri-brain-line",
    },
    {
      id: "process-mining",
      label: language === "en" ? "Process Mining" : "استخراج العمليات",
      icon: "ri-flow-chart-line",
    },
    { id: "hazalyze", label: "Hazalyze", icon: "ri-robot-line" },
    { id: "qiro", label: "QIRO", icon: "ri-route-line" },
    {
      id: "demo",
      label: language === "en" ? "Demo" : "عرض توضيحي",
      icon: "ri-play-circle-line",
    },
    {
      id: "testimonials",
      label: language === "en" ? "Stories" : "القصص",
      icon: "ri-star-line",
    },
    {
      id: "integration",
      label: language === "en" ? "Integration" : "التكامل",
      icon: "ri-plug-line",
    },
    {
      id: "cta",
      label: language === "en" ? "Get Started" : "ابدأ",
      icon: "ri-rocket-line",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 300;
      const sections = document.querySelectorAll("section[id]");

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute("id");

        if (
          scrollPosition >= sectionTop &&
          scrollPosition < sectionTop + sectionHeight
        ) {
          setActiveSection(sectionId || "hero");
          setShowcaseSection(sectionId || "hero");
        }
      });

      // Hide/show on scroll
      setIsVisible(window.scrollY < 100 || window.scrollY > window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setShowcaseSection]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
      setShowcaseSection(sectionId);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:block"
        >
          <div className="bg-[#0a0e14]/90 backdrop-blur-md border border-[#05a4ff]/20 rounded-2xl p-4 shadow-2xl">
            <nav className="flex flex-col gap-2">
              {sections.map((section) => (
                <motion.button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`relative p-3 rounded-lg transition-all group ${
                    activeSection === section.id
                      ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white"
                      : "text-[#a0aec0] hover:text-white hover:bg-[#05a4ff]/20"
                  }`}
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  title={section.label}
                >
                  <i className={`${section.icon} text-xl`} />
                  {activeSection === section.id && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 bg-[#0a0e14]/90 backdrop-blur-sm border border-[#05a4ff]/20 rounded-lg px-3 py-1 whitespace-nowrap"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <span className="text-sm text-white">
                        {section.label}
                      </span>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
