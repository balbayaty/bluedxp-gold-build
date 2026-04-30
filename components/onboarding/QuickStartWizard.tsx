"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import type { OnboardingPath } from "@/types/onboarding";

interface QuickStartWizardProps {
  path: OnboardingPath;
  onComplete: () => void;
  onBack: () => void;
}

export default function QuickStartWizard({
  path,
  onComplete,
  onBack,
}: QuickStartWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const step = path.steps[currentStep];
  const isLastStep = currentStep === path.steps.length - 1;

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (isLastStep) {
      localStorage.setItem("onboarding-completed", "true");
      localStorage.setItem("onboarding-path", path.id);
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{path.name}</h2>
            <p className="text-slate-400">
              Step {currentStep + 1} of {path.steps.length}
            </p>
          </div>
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / path.steps.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-8"
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{step.icon}</div>
              <h3 className="text-3xl font-bold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-xl text-slate-300">{step.description}</p>
            </div>

            {/* Step-specific content */}
            <div className="bg-slate-700/50 rounded-lg p-6">
              {step.id === "overview" && (
                <div className="space-y-4">
                  <p className="text-slate-300">
                    BlueDXP is the world's most comprehensive enterprise
                    intelligence operating system.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-300">
                    <li>30+ integrated modules</li>
                    <li>4IR/5IR aligned architecture</li>
                    <li>AI-powered operations</li>
                    <li>Real-time analytics</li>
                  </ul>
                  <button
                    onClick={() => router.push("/demo-onboarding")}
                    className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    View Platform Demo
                  </button>
                </div>
              )}

              {step.id === "dashboard" && (
                <div className="space-y-4">
                  <p className="text-slate-300">
                    Access high-level KPIs, strategic insights, and executive
                    metrics.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}

              {!["overview", "dashboard"].includes(step.id) && (
                <div className="space-y-4">
                  <p className="text-slate-300">
                    This step will guide you through:{" "}
                    <strong>{step.title}</strong>
                  </p>
                  <p className="text-slate-400 text-sm">
                    Detailed guidance and interactive tutorials will be
                    available here.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Steps Overview */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {path.steps.map((s, index) => (
            <button
              key={s.id}
              onClick={() => handleStepClick(index)}
              className={`p-3 rounded-lg border-2 transition-all ${
                index === currentStep
                  ? "border-blue-500 bg-blue-500/10"
                  : completedSteps.has(index)
                    ? "border-green-500 bg-green-500/10"
                    : "border-slate-700 bg-slate-800/50"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                {completedSteps.has(index) && (
                  <FiCheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <FiChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            {isLastStep ? (
              <>
                Complete
                <FiCheckCircle className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <FiChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
