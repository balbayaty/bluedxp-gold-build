"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdvancedHero from "./components/AdvancedHero";
import EnhancedProcessMining from "./components/EnhancedProcessMining";
import EnhancedQIRO from "./components/EnhancedQIRO";
import EnhancedHazalyzeShowcase from "./components/EnhancedHazalyzeShowcase";
import PlatformCapabilities from "./components/PlatformCapabilities";
import IntegrationShowcase from "./components/IntegrationShowcase";
import StatsSection from "./components/StatsSection";
import InteractiveDemo from "./components/InteractiveDemo";
import TestimonialsSection from "./components/TestimonialsSection";
import CTASection from "./components/CTASection";
import FloatingNavigation from "./components/FloatingNavigation";
import ParticleBackground from "./components/ParticleBackground";

/**
 * BlueDXP Landing Page
 *
 * Main landing page showcasing BlueDXP Platform and Hazalyze AI Module
 * Features:
 * - Interactive hero section with animated backgrounds
 * - Process Mining & Compliance Intelligence visualization
 * - Quantum-Inspired Route Optimization (QIRO)
 * - Hazalyze AI capabilities showcase
 * - Platform capabilities overview
 * - Integration showcase
 * - RTL Arabic support
 *
 * Aligned with BlueDXP vision and 4IR/5IR capabilities
 */
export default function BlueDXPLandingPage() {
  const router = useRouter();
  const [isRTL, setIsRTL] = useState(false);
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
    // Set document direction based on language
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
    setIsRTL(newLang === "ar");
  };

  return (
    <div
      className="min-h-screen bg-[#0a0e14] text-[#cbd5e1] overflow-x-hidden relative"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Particle Background */}
      <ParticleBackground />

      {/* Floating Navigation */}
      <FloatingNavigation language={language} />

      {/* Header Navigation */}
      <header className="sticky top-0 z-1000 bg-[#0a0e14]/98 backdrop-blur-lg border-b border-[#05a4ff]/8">
        <nav className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="text-2xl font-extrabold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
            BlueDXP
          </div>

          {/* Navigation Links */}
          <div className="flex gap-8 flex-1 justify-center">
            <a
              href="#intelligence"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              {language === "en" ? "Intelligence" : "الذكاء"}
            </a>
            <a
              href="#operations"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              {language === "en" ? "Operations" : "العمليات"}
            </a>
            <a
              href="#integration"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              {language === "en" ? "Integration" : "التكامل"}
            </a>
            <a
              href="#hazalyze"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              Hazalyze
            </a>
            <a
              href="#showcase"
              className="text-[#cbd5e1] hover:text-[#05a4ff] transition-colors text-sm font-medium"
            >
              {language === "en" ? "Showcase" : "العرض"}
            </a>
          </div>

          {/* Language Toggle & CTA */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLanguage("en");
                  setIsRTL(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  language === "en"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white"
                    : "bg-transparent text-[#05a4ff] border border-[#05a4ff]"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => {
                  setLanguage("ar");
                  setIsRTL(true);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  language === "ar"
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white"
                    : "bg-transparent text-[#05a4ff] border border-[#05a4ff]"
                }`}
              >
                عربي
              </button>
            </div>
            <button
              onClick={() => router.push("/showcase")}
              className="px-6 py-3 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#05a4ff]/25 transition-all hover:-translate-y-1"
            >
              {language === "en" ? "Get Started" : "ابدأ الآن"}
            </button>
          </div>
        </nav>
      </header>

      {/* Advanced Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center">
        <AdvancedHero language={language} />
      </section>

      {/* The Challenge / Stats Section */}
      <section
        id="challenge"
        className="py-20 bg-gradient-to-b from-[#0a0e14] via-[rgba(5,164,255,0.02)] to-[rgba(0,212,168,0.02)] border-t border-[#05a4ff]/5"
      >
        <StatsSection language={language} />
      </section>

      {/* Core Capabilities / Intelligence Section */}
      <section id="intelligence" className="py-20 border-t border-[#05a4ff]/5">
        <PlatformCapabilities language={language} />
      </section>

      {/* Enhanced Process Mining & Compliance Intelligence */}
      <section
        id="process-mining"
        className="py-20 bg-gradient-to-b from-[#0a0e14] via-[rgba(5,164,255,0.02)] to-[rgba(0,212,168,0.02)] border-t border-[#05a4ff]/5"
      >
        <EnhancedProcessMining language={language} />
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 border-t border-[#05a4ff]/5">
        <InteractiveDemo language={language} />
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-20 bg-gradient-to-b from-[#0a0e14] via-[rgba(5,164,255,0.02)] to-[rgba(0,212,168,0.02)] border-t border-[#05a4ff]/5"
      >
        <TestimonialsSection language={language} />
      </section>

      {/* Enhanced Hazalyze AI Module Showcase */}
      <section id="hazalyze" className="py-20 border-t border-[#05a4ff]/5">
        <EnhancedHazalyzeShowcase language={language} />
      </section>

      {/* Enhanced Quantum-Inspired Route Optimization (QIRO) */}
      <section
        id="qiro"
        className="py-20 bg-gradient-to-b from-[#0a0e14] via-[rgba(5,164,255,0.02)] to-[rgba(0,212,168,0.02)] border-t border-[#05a4ff]/5"
      >
        <EnhancedQIRO language={language} />
      </section>

      {/* Integration Showcase */}
      <section id="integration" className="py-20 border-t border-[#05a4ff]/5">
        <IntegrationShowcase language={language} />
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        className="py-20 bg-gradient-to-b from-[#0a0e14] via-[rgba(5,164,255,0.02)] to-[rgba(0,212,168,0.02)] border-t border-[#05a4ff]/5"
      >
        <CTASection language={language} router={router} />
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0e14]/50 border-t border-[#05a4ff]/10 py-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-[#05a4ff] mb-4 font-semibold">
                BlueDXP Platform
              </h4>
              <p className="text-sm text-[#a0aec0]">
                {language === "en"
                  ? "Enterprise Intelligence Operating System for Tomorrow's Operations"
                  : "نظام تشغيل الذكاء المؤسسي لعمليات الغد"}
              </p>
            </div>
            <div>
              <h4 className="text-[#05a4ff] mb-4 font-semibold">
                {language === "en" ? "Modules" : "الوحدات"}
              </h4>
              <ul className="space-y-2 text-sm text-[#a0aec0]">
                <li>
                  <a
                    href="#hazalyze"
                    className="hover:text-[#05a4ff] transition-colors"
                  >
                    Hazalyze AI
                  </a>
                </li>
                <li>
                  <a
                    href="/wms"
                    className="hover:text-[#05a4ff] transition-colors"
                  >
                    WMS
                  </a>
                </li>
                <li>
                  <a
                    href="/tms"
                    className="hover:text-[#05a4ff] transition-colors"
                  >
                    TMS
                  </a>
                </li>
                <li>
                  <a
                    href="/compliance"
                    className="hover:text-[#05a4ff] transition-colors"
                  >
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#05a4ff] mb-4 font-semibold">
                {language === "en" ? "Resources" : "الموارد"}
              </h4>
              <ul className="space-y-2 text-sm text-[#a0aec0]">
                <li>
                  <a
                    href="/showcase"
                    className="hover:text-[#05a4ff] transition-colors"
                  >
                    {language === "en" ? "Showcase" : "العرض"}
                  </a>
                </li>
                <li>
                  <a
                    href="/docs"
                    className="hover:text-[#05a4ff] transition-colors"
                  >
                    {language === "en" ? "Documentation" : "التوثيق"}
                  </a>
                </li>
                <li>
                  <a
                    href="/api"
                    className="hover:text-[#05a4ff] transition-colors"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#05a4ff] mb-4 font-semibold">
                {language === "en" ? "Connect" : "اتصل"}
              </h4>
              <ul className="space-y-2 text-sm text-[#a0aec0]">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#05a4ff] transition-colors"
                  >
                    {language === "en" ? "Contact" : "اتصل بنا"}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#05a4ff] transition-colors"
                  >
                    {language === "en" ? "Support" : "الدعم"}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#05a4ff]/10 text-center text-sm text-[#a0aec0]">
            <p>
              &copy; {new Date().getFullYear()} BlueDXP Platform.{" "}
              {language === "en"
                ? "All rights reserved."
                : "جميع الحقوق محفوظة."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
