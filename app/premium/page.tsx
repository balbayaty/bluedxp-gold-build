"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PremiumHero from "@/components/premium/PremiumHero";
import PremiumHeader from "@/components/premium/PremiumHeader";
import InteractiveStats from "@/components/premium/InteractiveStats";
import RealTimeMetrics from "@/components/premium/RealTimeMetrics";
import ProcessVisualization from "@/components/premium/ProcessVisualization";
import DataVisualization from "@/components/premium/DataVisualization";
import IntegrationSection from "@/components/premium/IntegrationSection";
import InteractiveDemo from "@/components/premium/InteractiveDemo";
import AdvancedFeatures from "@/components/premium/AdvancedFeatures";
import ROIcalculator from "@/components/premium/ROICalculator";
import EnterpriseTestimonials from "@/components/premium/EnterpriseTestimonials";
import PremiumCTA from "@/components/premium/PremiumCTA";
import PremiumFooter from "@/components/premium/PremiumFooter";

export default function PremiumLandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f1419] to-[#1a1f2e] text-white overflow-x-hidden"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Advanced Parallax Background Layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Layer 1: Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f1419] to-[#1a1f2e]" />

        {/* Layer 2: Animated Orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#05a4ff]/30 rounded-full blur-[120px] animate-pulse"
          style={{
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)`,
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-[#00d4a8]/25 rounded-full blur-[140px] animate-pulse"
          style={{
            transform: `translate(${-scrollY * 0.1}px, ${-scrollY * 0.12}px)`,
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#8b5cf6]/20 rounded-full blur-[100px] animate-pulse"
          style={{
            transform: `translate(${scrollY * 0.08}px, ${scrollY * 0.1}px)`,
            animationDelay: "2s",
          }}
        />

        {/* Layer 3: Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(5, 164, 255, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(5, 164, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.05}px)`,
          }}
        />

        {/* Layer 4: Particle Effect */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#05a4ff]/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s infinite ease-in-out`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
      `}</style>

      <div className="relative z-10">
        <PremiumHeader
          language={language}
          setLanguage={setLanguage}
          user={user}
          scrollY={scrollY}
        />
        <PremiumHero language={language} />
        <InteractiveStats language={language} />
        <RealTimeMetrics language={language} />
        <ProcessVisualization language={language} />
        <DataVisualization language={language} />
        <IntegrationSection language={language} />
        <InteractiveDemo language={language} />
        <AdvancedFeatures language={language} />
        <ROIcalculator language={language} />
        <EnterpriseTestimonials language={language} />
        <PremiumCTA language={language} />
        <PremiumFooter language={language} />
      </div>
    </div>
  );
}
