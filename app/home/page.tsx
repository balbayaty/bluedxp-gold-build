"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import HomeHero from "@/components/home/HomeHero";
import HomeHeader from "@/components/home/HomeHeader";
import StatsSection from "@/components/home/StatsSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import IntelligenceSection from "@/components/home/IntelligenceSection";
import OperationsSection from "@/components/home/OperationsSection";
import GovernanceSection from "@/components/home/GovernanceSection";
import IntegrationSection from "@/components/home/IntegrationSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import HomeFooter from "@/components/home/HomeFooter";
import { motion } from "framer-motion";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [language, setLanguage] = useState<"en" | "ar">("en");

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e] text-white overflow-x-hidden"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#05a4ff]/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00d4a8]/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#8b5cf6]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10">
        <HomeHeader language={language} setLanguage={setLanguage} user={user} />
        <HomeHero language={language} />
        <StatsSection language={language} />
        <FeaturesSection language={language} />
        <IntelligenceSection language={language} />
        <OperationsSection language={language} />
        <GovernanceSection language={language} />
        <IntegrationSection language={language} />
        <TestimonialsSection language={language} />
        <CTASection language={language} />
        <HomeFooter language={language} />
      </div>
    </div>
  );
}
