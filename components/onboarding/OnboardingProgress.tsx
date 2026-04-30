"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiClock, FiAward } from "react-icons/fi";

interface OnboardingProgressProps {
  userId: string;
}

export default function OnboardingProgress({
  userId,
}: OnboardingProgressProps) {
  const [progress, setProgress] = useState({
    completed: false,
    currentStep: 0,
    totalSteps: 0,
    achievements: [] as string[],
    timeSpent: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem(`onboarding-progress-${userId}`);
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, [userId]);

  const percentage =
    progress.totalSteps > 0
      ? (progress.currentStep / progress.totalSteps) * 100
      : 0;

  if (progress.completed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <FiCheckCircle className="w-8 h-8 text-green-400" />
          <div>
            <h3 className="text-xl font-bold text-white">
              Onboarding Complete!
            </h3>
            <p className="text-slate-300">
              You've successfully completed the onboarding process.
            </p>
          </div>
        </div>
        {progress.achievements.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-slate-400 mb-2">
              Achievements Unlocked:
            </p>
            <div className="flex flex-wrap gap-2">
              {progress.achievements.map((achievement, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30"
                >
                  <FiAward className="w-4 h-4 inline mr-1" />
                  {achievement}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FiClock className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-bold text-white">
              Onboarding Progress
            </h3>
            <p className="text-sm text-slate-400">
              Step {progress.currentStep} of {progress.totalSteps || "?"}
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold text-blue-400">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
