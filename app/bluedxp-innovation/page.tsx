"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import InnovationHeader from "@/components/bluedxp-website/innovation/InnovationHeader";
import InnovationHero from "@/components/bluedxp-website/innovation/InnovationHero";
import InnovationAI from "@/components/bluedxp-website/innovation/InnovationAI";
import Innovation3D from "@/components/bluedxp-website/innovation/Innovation3D";
import InnovationInteractive from "@/components/bluedxp-website/innovation/InnovationInteractive";
import InnovationDemo from "@/components/bluedxp-website/innovation/InnovationDemo";
import InnovationFeatures from "@/components/bluedxp-website/innovation/InnovationFeatures";
import InnovationTech from "@/components/bluedxp-website/innovation/InnovationTech";
import InnovationCTA from "@/components/bluedxp-website/innovation/InnovationCTA";
import InnovationFooter from "@/components/bluedxp-website/innovation/InnovationFooter";

export default function InnovationLandingPage() {
  const { user } = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Dynamic Interactive Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f1419] to-[#1a1f2e]" />
        <div
          className="absolute w-[800px] h-[800px] bg-[#05a4ff]/30 rounded-full blur-[150px] transition-transform duration-1000"
          style={{
            left: `${mousePosition.x / 10}px`,
            top: `${mousePosition.y / 10}px`,
          }}
        />
        <div
          className="absolute w-[1000px] h-[1000px] bg-[#00d4a8]/25 rounded-full blur-[180px] transition-transform duration-1500"
          style={{
            right: `${mousePosition.x / 15}px`,
            bottom: `${mousePosition.y / 15}px`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(5, 164, 255, 0.15) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(5, 164, 255, 0.15) 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.05}px)`,
          }}
        />
      </div>

      <div className="relative z-10">
        <InnovationHeader
          language={language}
          setLanguage={setLanguage}
          user={user}
          scrollY={scrollY}
        />
        <InnovationHero language={language} />
        <InnovationAI language={language} />
        <Innovation3D language={language} />
        <InnovationInteractive language={language} />
        <InnovationDemo language={language} />
        <InnovationFeatures language={language} />
        <InnovationTech language={language} />
        <InnovationCTA language={language} />
        <InnovationFooter language={language} />
      </div>
    </div>
  );
}
