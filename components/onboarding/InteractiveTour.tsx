"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiChevronRight,
  FiChevronLeft,
  FiPlay,
  FiSkipForward,
  FiCheckCircle,
} from "react-icons/fi";
import type { TourStep } from "@/types/onboarding";

interface InteractiveTourProps {
  onComplete: () => void;
  onClose: () => void;
}

const PLATFORM_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to BlueDXP Platform",
    description:
      "The world's most comprehensive enterprise intelligence operating system. Let's explore what makes us unique.",
    icon: "🚀",
    position: "center",
  },
  {
    id: "modules",
    title: "30+ Integrated Modules",
    description:
      "From WMS and TMS to AI Vision and Compliance - every module is deeply integrated and works seamlessly together.",
    icon: "📦",
    target: "#modules",
    position: "top",
  },
  {
    id: "dashboard",
    title: "Real-Time Intelligence",
    description:
      "Live dashboards with AI-powered insights, predictive analytics, and real-time monitoring across all operations.",
    icon: "📊",
    target: "#dashboard",
    position: "top",
  },
  {
    id: "ai",
    title: "AI-Powered Operations",
    description:
      "Advanced AI agents, computer vision, predictive analytics, and intelligent orchestration for autonomous operations.",
    icon: "🤖",
    position: "center",
  },
  {
    id: "integration",
    title: "Seamless Integration",
    description:
      "Connect with SAP, Oracle, ERP systems, IoT devices, and third-party services through our integration-first architecture.",
    icon: "🔗",
    position: "center",
  },
  {
    id: "compliance",
    title: "Enterprise Compliance",
    description:
      "Full compliance with ISO standards, Saudi Vision 2030, and global regulations with automated evidence tracking.",
    icon: "🛡️",
    position: "center",
  },
  {
    id: "complete",
    title: "Ready to Get Started?",
    description:
      "Experience the power of BlueDXP. Start your onboarding journey or explore the platform further.",
    icon: "✨",
    position: "center",
  },
];

export default function InteractiveTour({
  onComplete,
  onClose,
}: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] =
    useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const step = PLATFORM_TOUR_STEPS[currentStep];
  const isLastStep = currentStep === PLATFORM_TOUR_STEPS.length - 1;

  useEffect(() => {
    if (step.target) {
      setTimeout(() => {
        const element = document.querySelector(step.target!);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            setHighlightedElement(element as HTMLElement);
          }, 500);
        }
      }, 100);
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, step.target]);

  const handleNext = () => {
    if (currentStep < PLATFORM_TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("platform-tour-completed", "true");
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("platform-tour-skipped", "true");
    onClose();
  };

  const getHighlightStyle = () => {
    if (!highlightedElement) return {};
    const rect = highlightedElement.getBoundingClientRect();
    return {
      clipPath: `polygon(
        0% 0%, 0% 100%,
        ${rect.left}px 100%,
        ${rect.left}px ${rect.top}px,
        ${rect.right}px ${rect.top}px,
        ${rect.right}px ${rect.bottom}px,
        ${rect.left}px ${rect.bottom}px,
        ${rect.left}px 100%,
        100% 100%, 100% 0%
      )`,
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Overlay with cutout */}
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          style={getHighlightStyle()}
        />

        {/* Highlight border */}
        {highlightedElement && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="absolute border-4 border-blue-500 rounded-lg pointer-events-none shadow-2xl shadow-blue-500/50 z-[101]"
            style={{
              left: highlightedElement.getBoundingClientRect().left - 4,
              top: highlightedElement.getBoundingClientRect().top - 4,
              width: highlightedElement.getBoundingClientRect().width + 8,
              height: highlightedElement.getBoundingClientRect().height + 8,
            }}
          />
        )}

        {/* Tour Card */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[102]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl max-w-md w-full mx-4 pointer-events-auto ${
              step.position === "center" ? "" : "absolute"
            }`}
            style={
              step.position !== "center" && highlightedElement
                ? {
                    top:
                      step.position === "top"
                        ? highlightedElement.getBoundingClientRect().bottom + 20
                        : highlightedElement.getBoundingClientRect().top - 400,
                    left: Math.max(
                      20,
                      highlightedElement.getBoundingClientRect().left,
                    ),
                  }
                : {}
            }
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="text-4xl"
                  >
                    {step.icon}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white">
                      {step.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">
                        Step {currentStep + 1} of {PLATFORM_TOUR_STEPS.length}
                      </span>
                      <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${((currentStep + 1) / PLATFORM_TOUR_STEPS.length) * 100}%`,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 mt-3">{step.description}</p>
              </div>
              <button
                onClick={handleSkip}
                className="ml-4 p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiChevronLeft className="w-4 h-4" />
                Previous
              </button>
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
              >
                {isLastStep ? (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <FiChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
