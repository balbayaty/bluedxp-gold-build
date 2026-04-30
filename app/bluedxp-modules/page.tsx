"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ModulesHeader from "@/components/bluedxp-website/modules/ModulesHeader";
import ModulesHero from "@/components/bluedxp-website/modules/ModulesHero";
import ModulesShowcase from "@/components/bluedxp-website/modules/ModulesShowcase";
import ModulesIntegration from "@/components/bluedxp-website/modules/ModulesIntegration";
import ModulesWorkflow from "@/components/bluedxp-website/modules/ModulesWorkflow";
import ModulesBenefits from "@/components/bluedxp-website/modules/ModulesBenefits";
import ModulesComparison from "@/components/bluedxp-website/modules/ModulesComparison";
import ModulesCTA from "@/components/bluedxp-website/modules/ModulesCTA";
import ModulesFooter from "@/components/bluedxp-website/modules/ModulesFooter";

export default function ModulesLandingPage() {
  const { user } = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e] text-white overflow-x-hidden"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e]" />
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#8b5cf6]/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)`,
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-[#05a4ff]/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${-scrollY * 0.1}px, ${-scrollY * 0.12}px)`,
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#00d4a8]/15 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${scrollY * 0.08}px, ${scrollY * 0.1}px)`,
            animationDelay: "2s",
          }}
        />
      </div>

      <div className="relative z-10">
        <ModulesHeader
          language={language}
          setLanguage={setLanguage}
          user={user}
          scrollY={scrollY}
        />
        <ModulesHero language={language} />
        <ModulesShowcase language={language} />
        <ModulesIntegration language={language} />
        <ModulesWorkflow language={language} />
        <ModulesBenefits language={language} />
        <ModulesComparison language={language} />
        <ModulesCTA language={language} />
        <ModulesFooter language={language} />
      </div>
    </div>
  );
}
