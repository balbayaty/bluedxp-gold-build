"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import SaudiHeader from "@/components/bluedxp-website/saudi/SaudiHeader";
import SaudiHero from "@/components/bluedxp-website/saudi/SaudiHero";
import SaudiVision2030 from "@/components/bluedxp-website/saudi/SaudiVision2030";
import SaudiCompliance from "@/components/bluedxp-website/saudi/SaudiCompliance";
import SaudiLocalization from "@/components/bluedxp-website/saudi/SaudiLocalization";
import SaudiSuccess from "@/components/bluedxp-website/saudi/SaudiSuccess";
import SaudiPartnerships from "@/components/bluedxp-website/saudi/SaudiPartnerships";
import SaudiTestimonials from "@/components/bluedxp-website/saudi/SaudiTestimonials";
import SaudiCTA from "@/components/bluedxp-website/saudi/SaudiCTA";
import SaudiFooter from "@/components/bluedxp-website/saudi/SaudiFooter";

export default function SaudiLandingPage() {
  const { user } = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("ar"); // Default to Arabic
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
      {/* Cultural Background with Saudi Colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e]" />
        <div
          className="absolute top-0 left-0 w-[700px] h-[700px] bg-[#006c35]/20 rounded-full blur-[140px]"
          style={{
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.08}px)`,
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[900px] h-[900px] bg-[#ffffff]/10 rounded-full blur-[160px]"
          style={{
            transform: `translate(${-scrollY * 0.05}px, ${-scrollY * 0.08}px)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 108, 53, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0, 108, 53, 0.1) 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      <div className="relative z-10">
        <SaudiHeader
          language={language}
          setLanguage={setLanguage}
          user={user}
          scrollY={scrollY}
        />
        <SaudiHero language={language} />
        <SaudiVision2030 language={language} />
        <SaudiCompliance language={language} />
        <SaudiLocalization language={language} />
        <SaudiSuccess language={language} />
        <SaudiPartnerships language={language} />
        <SaudiTestimonials language={language} />
        <SaudiCTA language={language} />
        <SaudiFooter language={language} />
      </div>
    </div>
  );
}
