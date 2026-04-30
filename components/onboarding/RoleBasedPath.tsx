"use client";

import { motion } from "framer-motion";
import { FiCheckCircle, FiClock, FiArrowRight } from "react-icons/fi";
import type { OnboardingPath } from "@/types/onboarding";

interface RoleBasedPathProps {
  path: OnboardingPath;
}

export default function RoleBasedPath({ path }: RoleBasedPathProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{path.icon}</span>
            <div>
              <h2 className="text-2xl font-bold text-white">{path.name}</h2>
              <p className="text-slate-400">{path.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <span className="flex items-center gap-2 text-slate-400">
              <FiClock className="w-4 h-4" />
              {path.estimatedTime} minutes
            </span>
            <span className="text-slate-400">{path.steps.length} steps</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white mb-4">
          What You'll Learn:
        </h3>
        {path.steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="text-2xl">{step.icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">{step.title}</h4>
              <p className="text-sm text-slate-400">{step.description}</p>
            </div>
            <span className="text-xs text-slate-500">Step {index + 1}</span>
          </motion.div>
        ))}
      </div>

      {path.achievements.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">
            Achievements You'll Unlock:
          </h3>
          <div className="flex flex-wrap gap-2">
            {path.achievements.map((achievement, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30"
              >
                {achievement}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
