"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";

// Lazy load heavy components for faster initial page load
const UltimateHeader = dynamic(
  () => import("@/components/ultimate/UltimateHeader"),
  { ssr: true },
);
const UltimateHero = dynamic(
  () => import("@/components/ultimate/UltimateHero"),
  { ssr: true },
);
const Interactive3DNetwork = dynamic(
  () => import("@/components/ultimate/Interactive3DNetwork"),
  {
    ssr: false,
    loading: () => <div className="h-screen bg-[#0a0a0f]" />,
  },
);
const AdvancedMetricsDashboard = dynamic(
  () => import("@/components/ultimate/AdvancedMetricsDashboard"),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-[#0a0a0f]" />,
  },
);
const ProcessMining3D = dynamic(
  () => import("@/components/ultimate/ProcessMining3D"),
  {
    ssr: false,
    loading: () => <div className="h-screen bg-[#0a0a0f]" />,
  },
);
const NetworkVisualization = dynamic(
  () => import("@/components/ultimate/NetworkVisualization"),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-[#0a0a0f]" />,
  },
);
const QuantumRouteVisualization = dynamic(
  () => import("@/components/ultimate/QuantumRouteVisualization"),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-[#0a0a0f]" />,
  },
);
const RealTimeDataFlow = dynamic(
  () => import("@/components/ultimate/RealTimeDataFlow"),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-[#0a0a0f]" />,
  },
);
const InteractivePlatformDemo = dynamic(
  () => import("@/components/ultimate/InteractivePlatformDemo"),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-[#0a0a0f]" />,
  },
);
const EnterpriseCapabilities = dynamic(
  () => import("@/components/ultimate/EnterpriseCapabilities"),
  { ssr: true },
);
const AdvancedROICalculator = dynamic(
  () => import("@/components/ultimate/AdvancedROICalculator"),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-[#0a0a0f]" />,
  },
);
const ExecutiveTestimonials = dynamic(
  () => import("@/components/ultimate/ExecutiveTestimonials"),
  { ssr: true },
);
const ComplianceMatrix = dynamic(
  () => import("@/components/ultimate/ComplianceMatrix"),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-[#0a0a0f]" />,
  },
);
const UltimateCTA = dynamic(() => import("@/components/ultimate/UltimateCTA"), {
  ssr: true,
});
const UltimateFooter = dynamic(
  () => import("@/components/ultimate/UltimateFooter"),
  { ssr: true },
);

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#05a4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <div className="text-white/70">Loading Experience...</div>
    </div>
  </div>
);

export default function UltimateLandingPage() {
  const auth = useAuth();
  const user = auth?.user || null;
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

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
      {/* Advanced Multi-Layer Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f1419] to-[#1a1f2e]" />

        {/* Dynamic orbs following mouse */}
        <div
          className="absolute w-[800px] h-[800px] bg-[#05a4ff]/30 rounded-full blur-[150px] transition-transform duration-1000"
          style={{
            left: `${mousePosition.x / 10}px`,
            top: `${mousePosition.y / 10}px`,
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)`,
          }}
        />
        <div
          className="absolute w-[1000px] h-[1000px] bg-[#00d4a8]/25 rounded-full blur-[180px] transition-transform duration-1500"
          style={{
            right: `${mousePosition.x / 15}px`,
            bottom: `${mousePosition.y / 15}px`,
            transform: `translate(${-scrollY * 0.1}px, ${-scrollY * 0.12}px)`,
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] bg-[#8b5cf6]/20 rounded-full blur-[120px] transition-transform duration-2000"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${scrollY * 0.08}px, ${scrollY * 0.1}px)`,
          }}
        />

        {/* Animated grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(5, 164, 255, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(5, 164, 255, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px",
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.05}px)`,
          }}
        />

        {/* Particles */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                background:
                  i % 3 === 0 ? "#05a4ff" : i % 3 === 1 ? "#00d4a8" : "#8b5cf6",
                opacity: 0.2,
                animation: `float ${5 + Math.random() * 15}s infinite ease-in-out`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Radial gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#05a4ff]/5 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#00d4a8]/5 to-transparent" />
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-30px) translateX(15px) scale(1.2);
            opacity: 0.6;
          }
        }
      `}</style>

      <Suspense fallback={<LoadingScreen />}>
        <div className="relative z-10">
          <UltimateHeader
            language={language}
            setLanguage={setLanguage}
            user={user}
            scrollY={scrollY}
          />
          <UltimateHero language={language} />
          <Interactive3DNetwork language={language} />
          <AdvancedMetricsDashboard language={language} />
          <ProcessMining3D language={language} />
          <NetworkVisualization language={language} />
          <QuantumRouteVisualization language={language} />
          <RealTimeDataFlow language={language} />
          <InteractivePlatformDemo language={language} />
          <EnterpriseCapabilities language={language} />
          <AdvancedROICalculator language={language} />
          <ExecutiveTestimonials language={language} />
          <ComplianceMatrix language={language} />
          <UltimateCTA language={language} />
          <UltimateFooter language={language} />
        </div>
      </Suspense>
    </div>
  );
}
