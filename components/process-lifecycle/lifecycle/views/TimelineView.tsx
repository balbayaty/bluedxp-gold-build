/**
 * Timeline View Component
 * Horizontal timeline visualization of lifecycle stages
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, differenceInSeconds } from "date-fns";
import type {
  EntityLifecycle,
  LifecycleConfig,
  LifecycleStage,
  StageInstance,
} from "@/types/lifecycle";
import StageCard from "../components/StageCard";
import Tooltip from "@/components/Tooltip";

interface TimelineViewProps {
  lifecycle: EntityLifecycle;
  config: LifecycleConfig;
  showLayers?: string[];
  onStageClick?: (stage: LifecycleStage) => void;
  onModuleLinkClick?: (module: string, action: string, href?: string) => void;
  onStageTransition?: (fromStageId: string, toStageId: string) => void;
  enablePredictive?: boolean;
}

export default function TimelineView({
  lifecycle,
  config,
  showLayers = ["overview", "details"],
  onStageClick,
  onModuleLinkClick,
  enablePredictive = false,
}: TimelineViewProps) {
  // Get all stages with their instances
  const stagesWithInstances = useMemo(() => {
    return config.stages.map((stage) => {
      const instance = lifecycle.stages.find((s) => s.stageId === stage.id);
      const isActive = lifecycle.currentStageId === stage.id;
      const isCompleted = instance?.status === "COMPLETED";
      const isPending = !instance || instance.status === "PENDING";

      return {
        stage,
        instance,
        isActive,
        isCompleted,
        isPending,
      };
    });
  }, [config.stages, lifecycle]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    return lifecycle.progress;
  }, [lifecycle.progress]);

  return (
    <div className="p-6">
      {/* Progress Overview */}
      {showLayers.includes("overview") && (
        <div className="mb-6 bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[#9ca3af]">Overall Progress</div>
            <div className="text-sm font-semibold text-white">
              {progressPercentage}%
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-[#9ca3af]">
            <div>
              <i className="ri-time-line mr-1"></i>
              Started:{" "}
              {format(new Date(lifecycle.startedAt), "MMM dd, yyyy HH:mm")}
            </div>
            {lifecycle.completedAt && (
              <div>
                <i className="ri-checkbox-circle-line mr-1"></i>
                Completed:{" "}
                {format(new Date(lifecycle.completedAt), "MMM dd, yyyy HH:mm")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10"></div>

        {/* Stages */}
        <div className="space-y-6">
          {stagesWithInstances.map(
            ({ stage, instance, isActive, isCompleted, isPending }, index) => {
              const isLast = index === stagesWithInstances.length - 1;
              const duration = instance?.duration;
              const startedAt = instance?.startedAt;
              const completedAt = instance?.completedAt;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Stage Indicator */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? "bg-green-500 border-green-500 shadow-lg shadow-green-500/30"
                          : isActive
                            ? "bg-cyan-500 border-cyan-500 shadow-lg shadow-cyan-500/30 animate-pulse"
                            : isPending
                              ? "bg-gray-500/50 border-gray-500/50"
                              : "bg-gray-500/30 border-gray-500/30"
                      }`}
                      style={{
                        backgroundColor:
                          isActive || isCompleted
                            ? undefined
                            : stage.color + "40",
                      }}
                    >
                      {isCompleted ? (
                        <i className="ri-check-line text-white text-xl"></i>
                      ) : isActive ? (
                        <i
                          className={`${stage.icon || "ri-circle-line"} text-white text-xl`}
                        ></i>
                      ) : (
                        <i
                          className={`${stage.icon || "ri-circle-line"} text-white/50 text-xl`}
                        ></i>
                      )}
                    </div>
                  </div>

                  {/* Stage Content */}
                  <div className="flex-1 min-w-0">
                    <StageCard
                      stage={stage}
                      instance={instance}
                      isActive={isActive}
                      isCompleted={isCompleted}
                      isPending={isPending}
                      onClick={() => onStageClick?.(stage)}
                      onModuleLinkClick={onModuleLinkClick}
                      showDetails={showLayers.includes("details")}
                    />

                    {/* Duration Info */}
                    {showLayers.includes("details") && instance && (
                      <div className="mt-2 text-xs text-[#9ca3af] flex items-center gap-4">
                        {startedAt && (
                          <div>
                            <i className="ri-play-line mr-1"></i>
                            Started:{" "}
                            {format(new Date(startedAt), "MMM dd, HH:mm")}
                          </div>
                        )}
                        {completedAt && duration && (
                          <div>
                            <i className="ri-time-line mr-1"></i>
                            Duration: {Math.floor(duration / 60)}m{" "}
                            {duration % 60}s
                          </div>
                        )}
                        {stage.estimatedDuration && !completedAt && (
                          <div>
                            <i className="ri-timer-line mr-1"></i>
                            Est: {Math.floor(stage.estimatedDuration / 60)}m
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            },
          )}
        </div>
      </div>

      {/* Current Status Summary */}
      {showLayers.includes("overview") && lifecycle.currentStage && (
        <div className="mt-6 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
              <i
                className={`${lifecycle.currentStage.icon || "ri-information-line"} text-cyan-400 text-xl`}
              ></i>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">
                Current Stage
              </div>
              <div className="text-lg font-bold text-cyan-400">
                {lifecycle.currentStage.name}
              </div>
              <div className="text-xs text-[#9ca3af] mt-1">
                {lifecycle.currentStage.description}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-cyan-400">
                {progressPercentage}%
              </div>
              <div className="text-xs text-[#9ca3af]">Complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
