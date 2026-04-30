"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeTourProps {
  onComplete: () => void;
}

const TOUR_STEPS = [
  {
    id: 1,
    title: "Welcome to Brand Messaging Engine!",
    description: "Generate on-brand, bilingual messaging with AI intelligence",
    icon: "✨",
  },
  {
    id: 2,
    title: "Select a Module",
    description: "Choose from the dropdown - context auto-fills automatically",
    icon: "📦",
  },
  {
    id: 3,
    title: "See Capabilities",
    description: "View module stats and click features to auto-fill",
    icon: "📊",
  },
  {
    id: 4,
    title: "Choose Message Type",
    description: "Select from visual cards or use quick actions",
    icon: "🎯",
  },
  {
    id: 5,
    title: "Generate & Preview",
    description: "Get instant bilingual messages with quality scores",
    icon: "🚀",
  },
];

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(true);

  useEffect(() => {
    // Check if user has seen tour before
    const hasSeenTour = localStorage.getItem("brand-messaging-tour-seen");
    if (hasSeenTour === "true") {
      setShowTour(false);
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("brand-messaging-tour-seen", "true");
    setShowTour(false);
    onComplete();
  };

  if (!showTour) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <AnimatePresence>
      {showTour && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-600 shadow-2xl z-50 max-w-md w-full mx-4"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-6xl mb-4"
              >
                {step.icon}
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {step.title}
              </h2>
              <p className="text-slate-400">{step.description}</p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-slate-400">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
                <span className="text-xs text-slate-400">
                  {Math.round(((currentStep + 1) / TOUR_STEPS.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Skip Tour
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all font-semibold"
              >
                {currentStep < TOUR_STEPS.length - 1
                  ? "Next →"
                  : "Get Started!"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
