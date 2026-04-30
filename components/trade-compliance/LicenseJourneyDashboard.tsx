/**
 * License Journey Dashboard Component
 * Real-time tracking dashboard for license application journey
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { generateMockLicenseJourney } from "@/utils/licenseApplicationMockData";
import type { LicenseJourney } from "@/types/license-application";

interface LicenseJourneyDashboardProps {
  applicationId: string;
}

export default function LicenseJourneyDashboard({
  applicationId,
}: LicenseJourneyDashboardProps) {
  const [journey, setJourney] = useState<LicenseJourney | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const mockJourney = generateMockLicenseJourney(applicationId);
      setJourney(mockJourney);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [applicationId]);

  if (loading || !journey) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Progress</div>
          <div className="text-2xl font-bold text-white">
            {Math.round((journey.currentStep / journey.totalSteps) * 100)}%
          </div>
          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all"
              style={{
                width: `${(journey.currentStep / journey.totalSteps) * 100}%`,
              }}
            />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Documents</div>
          <div className="text-2xl font-bold text-white">
            {journey.documentsStatus.available}/
            {journey.documentsStatus.required}
          </div>
          <div className="text-xs text-green-400 mt-1">
            {journey.documentsStatus.validated} validated
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Consultant</div>
          <div className="text-2xl font-bold text-white">
            {journey.consultantStatus?.assigned ? "Assigned" : "Not Assigned"}
          </div>
          {journey.consultantStatus?.progress && (
            <div className="text-xs text-purple-400 mt-1">
              {journey.consultantStatus.progress}% complete
            </div>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Est. Completion</div>
          <div className="text-2xl font-bold text-white">
            {new Date(journey.estimatedCompletion).toLocaleDateString()}
          </div>
          <div className="text-xs text-cyan-400 mt-1">
            {Math.ceil(
              (new Date(journey.estimatedCompletion).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            )}{" "}
            days
          </div>
        </motion.div>
      </div>

      {/* Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Application Steps
        </h3>
        <div className="space-y-4">
          {journey.steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step.status === "COMPLETED"
                    ? "bg-green-500/20 text-green-400"
                    : step.status === "IN_PROGRESS"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-white/10 text-[#9ca3af]"
                }`}
              >
                {step.status === "COMPLETED" ? (
                  <i className="ri-check-line"></i>
                ) : step.status === "IN_PROGRESS" ? (
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">{step.name}</div>
                {step.completedAt && (
                  <div className="text-sm text-[#9ca3af]">
                    Completed {new Date(step.completedAt).toLocaleDateString()}
                  </div>
                )}
                {step.estimatedDuration && step.status !== "COMPLETED" && (
                  <div className="text-xs text-[#9ca3af] mt-1">
                    Est. {step.estimatedDuration} day
                    {step.estimatedDuration > 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded text-xs font-medium ${
                  step.status === "COMPLETED"
                    ? "bg-green-500/20 text-green-400"
                    : step.status === "IN_PROGRESS"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-white/10 text-[#9ca3af]"
                }`}
              >
                {step.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
        <div className="space-y-4">
          {journey.timeline.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    event.color === "text-blue-400"
                      ? "bg-blue-400/20 border-blue-400"
                      : event.color === "text-green-400"
                        ? "bg-green-400/20 border-green-400"
                        : event.color === "text-purple-400"
                          ? "bg-purple-400/20 border-purple-400"
                          : event.color === "text-cyan-400"
                            ? "bg-cyan-400/20 border-cyan-400"
                            : event.color === "text-yellow-400"
                              ? "bg-yellow-400/20 border-yellow-400"
                              : "bg-white/20 border-white"
                  }`}
                />
                {index < journey.timeline.length - 1 && (
                  <div className="w-0.5 h-full bg-white/10 mt-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <i className={`${event.icon} ${event.color} text-lg`}></i>
                  <span className="font-medium text-white">{event.title}</span>
                  <span className="text-xs text-[#9ca3af] ml-auto">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[#9ca3af]">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Government Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {journey.governmentStatus.civilDefense && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <i className="ri-shield-check-line text-red-400 text-2xl"></i>
              <h3 className="text-lg font-semibold text-white">
                Civil Defense
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Status</span>
                <span className="text-yellow-400 font-medium">
                  {journey.governmentStatus.civilDefense.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Next Action</span>
                <span className="text-white">
                  {journey.governmentStatus.civilDefense.nextAction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Est. Days</span>
                <span className="text-white">
                  {journey.governmentStatus.civilDefense.estimatedDays} days
                </span>
              </div>
            </div>
          </motion.div>
        )}
        {journey.governmentStatus.saber && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <i className="ri-file-certificate-line text-blue-400 text-2xl"></i>
              <h3 className="text-lg font-semibold text-white">SABER</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Status</span>
                <span className="text-yellow-400 font-medium">
                  {journey.governmentStatus.saber.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Next Action</span>
                <span className="text-white">
                  {journey.governmentStatus.saber.nextAction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Est. Days</span>
                <span className="text-white">
                  {journey.governmentStatus.saber.estimatedDays} days
                </span>
              </div>
            </div>
          </motion.div>
        )}
        {journey.governmentStatus.sfda && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <i className="ri-file-certificate-line text-blue-400 text-2xl"></i>
              <h3 className="text-lg font-semibold text-white">SFDA</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Status</span>
                <span className="text-yellow-400 font-medium">
                  {journey.governmentStatus.sfda.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Next Action</span>
                <span className="text-white">
                  {journey.governmentStatus.sfda.nextAction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Est. Days</span>
                <span className="text-white">
                  {journey.governmentStatus.sfda.estimatedDays} days
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
