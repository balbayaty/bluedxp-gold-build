/**
 * Proposal Onboarding Tour
 *
 * Interactive tour for new users
 * Guides users through the proposal creation process
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Universal Proposal Builder!",
    description:
      "This AI-powered tool helps you create winning proposals. Let's take a quick tour to get you started.",
    target: "body",
    position: "bottom",
  },
  {
    id: "title",
    title: "Proposal Title",
    description:
      "Enter a clear, descriptive title. This helps AI generate better insights and content.",
    target: 'input[placeholder*="title" i]',
    position: "bottom",
  },
  {
    id: "customer",
    title: "Customer Name",
    description:
      "Enter the customer name. The system will gather relevant data and generate personalized insights.",
    target: 'input[placeholder*="customer" i]',
    position: "bottom",
  },
  {
    id: "insights",
    title: "AI-Powered Insights",
    description:
      "These insights appear automatically and help improve your win probability. Pay attention to critical and high-priority items.",
    target: ".ai-insights-box",
    position: "left",
  },
  {
    id: "generate",
    title: "Generate Proposal",
    description:
      "Click this button to create your complete proposal with AI-enhanced content, sections, and recommendations.",
    target: 'button:has-text("Generate")',
    position: "top",
  },
  {
    id: "stats",
    title: "Proposal Stats",
    description:
      "Track your proposal progress. Win probability shows your chances of winning based on AI analysis.",
    target: ".proposal-stats",
    position: "left",
  },
];

interface ProposalOnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function ProposalOnboardingTour({
  onComplete,
  onSkip,
}: ProposalOnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen tour before
    const hasSeenTour = localStorage.getItem("proposal-tour-completed");
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
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

  const handleSkip = () => {
    localStorage.setItem("proposal-tour-completed", "true");
    setIsVisible(false);
    onSkip?.();
  };

  const handleComplete = () => {
    localStorage.setItem("proposal-tour-completed", "true");
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) {
    return null;
  }

  const step = TOUR_STEPS[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleSkip}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm"
            style={{
              // Position would be calculated based on target element
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="ri-close-line" />
                </button>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all"
                  style={{
                    width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
                  }}
                />
              </div>

              {/* Content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Skip Tour
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {currentStep === TOUR_STEPS.length - 1
                      ? "Get Started"
                      : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
