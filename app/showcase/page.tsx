"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShowcaseProvider, useShowcase } from "@/contexts/ShowcaseContext";
import HeroSection from "./components/HeroSection";
import SystemOrchestration3D from "./components/SystemOrchestration3D";
import LiveMetricsWall from "./components/LiveMetricsWall";
import VideoShowcase from "./components/VideoShowcase";
import ComplianceMatrix from "./components/ComplianceMatrix";
import StakeholderViews from "./components/StakeholderViews";
import AIVisionIntegration from "./components/AIVisionIntegration";
import Interactive3D from "./components/Interactive3D";
import DataFlowVisualization from "./components/DataFlowVisualization";
import AnimatedWorkflowVideo from "./components/AnimatedWorkflowVideo";
import ArchitectureMindMap from "./components/ArchitectureMindMap";
import FloatingShowcaseNavigation from "@/components/showcase/FloatingShowcaseNavigation";

function ShowcaseDashboardContent() {
  const router = useRouter();
  const { activeSection, setActiveSection } = useShowcase();
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect dark mode from document/body
  const [isDarkMode, setIsDarkMode] = useState(true);
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Scroll spy for navigation
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "hero",
        "orchestration",
        "metrics",
        "video",
        "compliance",
        "stakeholders",
        "aivision",
        "3d",
        "workflow",
        "architecture",
      ];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setActiveSection]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-x-hidden"
    >
      {/* Floating 3D Navigation Widget */}
      <FloatingShowcaseNavigation isDarkMode={isDarkMode} />

      {/* Hero Section */}
      <section
        id="hero"
        className="relative min-h-screen pt-28 flex items-center"
      >
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HeroSection />
        </div>
      </section>

      {/* System Orchestration 3D */}
      <section id="orchestration" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <SystemOrchestration3D />
        </div>
      </section>

      {/* Live Metrics Wall */}
      <section id="metrics" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <LiveMetricsWall realTimeEnabled={realTimeEnabled} />
        </div>
      </section>

      {/* Video Showcase */}
      <section id="video" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <VideoShowcase />
        </div>
      </section>

      {/* Compliance Matrix */}
      <section id="compliance" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <ComplianceMatrix />
        </div>
      </section>

      {/* Stakeholder Views */}
      <section id="stakeholders" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <StakeholderViews
            selectedStakeholder={selectedStakeholder}
            onSelect={setSelectedStakeholder}
          />
        </div>
      </section>

      {/* AI Vision Integration */}
      <section id="aivision" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AIVisionIntegration />
        </div>
      </section>

      {/* Interactive 3D Warehouse */}
      <section id="3d" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Interactive3D />
        </div>
      </section>

      {/* Data Flow Visualization */}
      <section id="dataflow" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <DataFlowVisualization />
        </div>
      </section>

      {/* Animated Workflow Video */}
      <section id="workflow" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AnimatedWorkflowVideo />
        </div>
      </section>

      {/* Architecture Mind Map */}
      <section id="architecture" className="relative min-h-screen py-20">
        <div className="w-full max-w-[calc(100%-320px)] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <ArchitectureMindMap />
        </div>
      </section>
    </div>
  );
}

export default function ShowcaseDashboard() {
  return (
    <ShowcaseProvider>
      <ShowcaseDashboardContent />
    </ShowcaseProvider>
  );
}
