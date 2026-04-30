"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ExecutiveHeader from "@/components/bluedxp-website/executive/ExecutiveHeader";
import ExecutiveHero from "@/components/bluedxp-website/executive/ExecutiveHero";
import ExecutiveMetrics from "@/components/bluedxp-website/executive/ExecutiveMetrics";
import ExecutiveCapabilities from "@/components/bluedxp-website/executive/ExecutiveCapabilities";
import ExecutiveCompliance from "@/components/bluedxp-website/executive/ExecutiveCompliance";
import ExecutiveIntelligence from "@/components/bluedxp-website/executive/ExecutiveIntelligence";
import ExecutiveTestimonials from "@/components/bluedxp-website/executive/ExecutiveTestimonials";
import ExecutiveROI from "@/components/bluedxp-website/executive/ExecutiveROI";
import ExecutiveSecurity from "@/components/bluedxp-website/executive/ExecutiveSecurity";
import ExecutiveCTA from "@/components/bluedxp-website/executive/ExecutiveCTA";
import ExecutiveFooter from "@/components/bluedxp-website/executive/ExecutiveFooter";

export default function ExecutiveLandingPage() {
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
      className="min-h-screen bg-[#0a0e14] text-white overflow-x-hidden"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Sophisticated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e]" />
        <div
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#1e3a8a]/20 rounded-full blur-[120px]"
          style={{
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.08}px)`,
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#0c4a6e]/15 rounded-full blur-[140px]"
          style={{
            transform: `translate(${-scrollY * 0.05}px, ${-scrollY * 0.08}px)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      <div className="relative z-10">
        <ExecutiveHeader
          language={language}
          setLanguage={setLanguage}
          user={user}
          scrollY={scrollY}
        />
        <ExecutiveHero language={language} />
        <ExecutiveMetrics language={language} />
        <ExecutiveCapabilities language={language} />
        <ExecutiveCompliance language={language} />
        <ExecutiveIntelligence language={language} />
        <ExecutiveSecurity language={language} />
        <ExecutiveROI language={language} />
        <ExecutiveTestimonials language={language} />
        <ExecutiveCTA language={language} />
        <ExecutiveFooter language={language} />
      </div>
    </div>
  );
}
