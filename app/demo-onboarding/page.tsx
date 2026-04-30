"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiZap,
  FiTrendingUp,
  FiShield,
  FiGlobe,
  FiCpu,
  FiUsers,
  FiBarChart,
  FiTarget,
  FiAward,
  FiCheckCircle,
  FiArrowRight,
  FiPlay,
  FiPause,
  FiSkipForward,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiLayers,
  FiDatabase,
  FiCloud,
  FiLock,
  FiStar,
  FiMenu,
  FiSearch,
  FiBell,
  FiSettings,
} from "react-icons/fi";
import InteractiveTour from "@/components/onboarding/InteractiveTour";
import ModuleShowcase from "@/components/onboarding/ModuleShowcase";
import LiveDashboardPreview from "@/components/onboarding/LiveDashboardPreview";
import ValueCalculator from "@/components/onboarding/ValueCalculator";
import ComparisonMatrix from "@/components/onboarding/ComparisonMatrix";
import EnterpriseMetrics from "@/components/onboarding/EnterpriseMetrics";
import LiveMetricsBar from "@/components/onboarding/LiveMetricsBar";
import ParticleBackground from "@/components/onboarding/ParticleBackground";
import { getEnabledModules } from "@/lib/modules/registry";

export default function DemoOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("hero");
  const [tourActive, setTourActive] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [modules, setModules] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    const enabledModules = getEnabledModules();
    setModules(enabledModules);

    const handleScroll = () => {
      const scroll = window.scrollY;
      setScrollY(scroll);
      setIsScrolled(scroll > 100);

      const sections = [
        "hero",
        "metrics",
        "tour",
        "modules",
        "dashboard",
        "comparison",
        "value",
        "cta",
      ];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          const scrollPos = window.scrollY + 200;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setShowMobileMenu(false);
  };

  const navItems = [
    { id: "hero", label: "Overview" },
    { id: "metrics", label: "Metrics" },
    { id: "modules", label: "Modules" },
    { id: "dashboard", label: "Dashboard" },
    { id: "comparison", label: "Compare" },
    { id: "value", label: "ROI" },
  ];

  const [selectedPersona, setSelectedPersona] = useState("Generic");

  const personas = [
    { id: "Generic", label: "Default View", icon: FiGlobe },
    { id: "Retail", label: "Retail Leader", icon: FiTarget },
    { id: "Logistics", label: "3PL Expert", icon: FiLayers },
    { id: "Manufacturing", label: "Plant Manager", icon: FiCpu },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-x-hidden relative">
      {/* Persona Switcher - Floating on the right */}
      <div className="fixed right-6 top-24 z-50 hidden lg:block">
        <motion.div
          initial={{ x: 100 }}
          animate={{ x: 0 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl"
        >
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 px-2">
            Experience As:
          </div>
          <div className="flex flex-col gap-2">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedPersona === persona.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <persona.icon className="w-4 h-4" />
                {persona.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Particle Background */}
      <ParticleBackground />

      {/* SAP/Oracle Style Fixed Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-900/98 backdrop-blur-xl border-b border-blue-800/50 shadow-2xl"
            : "bg-slate-900/95 backdrop-blur-md border-b border-blue-800/30"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => scrollToSection("hero")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <FiLayers className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  BlueDXP Platform
                </div>
                <div className="text-xs text-slate-400">
                  Enterprise Intelligence OS
                </div>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    activeSection === item.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeSection"
                      className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {!user ? (
                <>
                  <button
                    onClick={() => router.push("/login")}
                    className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                  <motion.button
                    onClick={() => router.push("/onboarding")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/50"
                  >
                    Get Started
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={() => router.push("/dashboard")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/50"
                >
                  Go to Dashboard
                </motion.button>
              )}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <FiMenu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection === item.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
      >
        <motion.div
          style={{ opacity, scale }}
          className="absolute inset-0 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900/50 to-cyan-900/20" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full mb-8 backdrop-blur-sm"
            >
              <FiStar className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-blue-300">
                World's Most Comprehensive Enterprise Intelligence Platform
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <motion.span
                className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Enterprise Operations
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              The most intelligent, comprehensive, and future-ready platform
              <br />
              <span className="text-blue-400 font-semibold">
                Exceeding SAP, Oracle, Microsoft, IBM Standards
              </span>
            </motion.p>

            {/* Key Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 mb-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {[
                { label: "Modules", value: "30+", icon: FiGrid, color: "blue" },
                {
                  label: "4IR/5IR Ready",
                  value: "100%",
                  icon: FiZap,
                  color: "cyan",
                },
                {
                  label: "Uptime",
                  value: "99.99%",
                  icon: FiShield,
                  color: "green",
                },
                {
                  label: "Countries",
                  value: "50+",
                  icon: FiGlobe,
                  color: "purple",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer"
                >
                  <stat.icon
                    className={`w-8 h-8 text-${stat.color}-400 mb-3 mx-auto`}
                  />
                  <motion.div
                    className="text-3xl font-bold text-white mb-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + i * 0.1, type: "spring" }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                onClick={() => setTourActive(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold text-lg transition-all shadow-2xl shadow-blue-500/50 flex items-center gap-2"
              >
                <FiPlay className="w-5 h-5" />
                Start Interactive Tour
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                onClick={() => scrollToSection("dashboard")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white rounded-xl font-semibold text-lg transition-all backdrop-blur-sm"
              >
                View Live Dashboard
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-8 text-slate-400"
            >
              {[
                {
                  icon: FiCheckCircle,
                  text: "Enterprise-Grade Security",
                  color: "green",
                },
                {
                  icon: FiCheckCircle,
                  text: "Saudi Vision 2030 Aligned",
                  color: "green",
                },
                {
                  icon: FiCheckCircle,
                  text: "Multi-Tenant Architecture",
                  color: "green",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 + i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                  <span className="text-sm">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
          onClick={() => scrollToSection("metrics")}
        >
          <FiChevronDown className="w-8 h-8 text-slate-400 hover:text-white transition-colors" />
        </motion.div>
      </section>

      {/* Live Metrics Bar */}
      <LiveMetricsBar />

      {/* Interactive Tour Section */}
      <AnimatePresence>
        {tourActive && (
          <InteractiveTour
            onComplete={() => setTourActive(false)}
            onClose={() => setTourActive(false)}
          />
        )}
      </AnimatePresence>

      {/* Module Showcase */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                30+ Enterprise Modules
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Comprehensive suite of integrated modules covering every aspect of
              enterprise operations
            </p>
          </motion.div>
          <ModuleShowcase modules={modules} />
        </div>
      </section>

      {/* Live Dashboard Preview */}
      <section
        id="dashboard"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50 relative"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Live Dashboard Preview
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Experience real-time analytics and intelligence in action
            </p>
          </motion.div>
          <LiveDashboardPreview />
        </div>
      </section>

      {/* Comparison Matrix */}
      <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                How We Compare
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              See how BlueDXP exceeds industry leaders in capabilities and
              innovation
            </p>
          </motion.div>
          <ComparisonMatrix />
        </div>
      </section>

      {/* Value Calculator */}
      <section
        id="value"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50 relative"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Calculate Your ROI
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Discover the value BlueDXP can bring to your organization
            </p>
          </motion.div>
          <ValueCalculator initialPersona={selectedPersona} />
        </div>
      </section>

      {/* Enterprise Metrics */}
      <section id="metrics" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <EnterpriseMetrics />
      </section>

      {/* Final CTA */}
      <section
        id="cta"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 relative"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Enterprise?
            </h2>
            <p className="text-xl text-slate-200 mb-8">
              Join leading organizations using BlueDXP to revolutionize their
              operations
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                onClick={() => router.push("/onboarding")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-blue-900 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-2xl"
              >
                Start Your Journey
              </motion.button>
              <motion.button
                onClick={() => router.push("/contact")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Schedule a Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
