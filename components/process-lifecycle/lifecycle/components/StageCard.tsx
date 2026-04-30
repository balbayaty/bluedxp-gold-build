/**
 * Stage Card Component
 * Reusable card for displaying lifecycle stage information
 */

"use client";

import { motion } from "framer-motion";
import type { StageCardProps } from "@/types/lifecycle";
import Tooltip from "@/components/Tooltip";

export default function StageCard({
  stage,
  instance,
  isActive,
  isCompleted,
  isPending,
  onClick,
  onModuleLinkClick,
  showDetails = false,
}: StageCardProps) {
  const handleModuleLinkClick = (
    module: string,
    action: string,
    href?: string,
  ) => {
    if (onModuleLinkClick) {
      onModuleLinkClick(module, action, href);
    } else if (href) {
      window.location.href = href;
    }
  };

  return (
    <motion.div
      className={`bg-white/5 border rounded-lg p-4 transition-all cursor-pointer ${
        isActive
          ? "border-cyan-500/50 shadow-lg shadow-cyan-500/10 bg-cyan-500/5"
          : isCompleted
            ? "border-green-500/30 bg-green-500/5"
            : "border-white/10 hover:border-white/20"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Stage Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={`text-base font-semibold ${
                isActive
                  ? "text-cyan-400"
                  : isCompleted
                    ? "text-green-400"
                    : "text-white"
              }`}
            >
              {stage.name}
            </h4>
            {isActive && (
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full border border-cyan-500/30">
                Active
              </span>
            )}
            {isCompleted && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                Completed
              </span>
            )}
          </div>
          {showDetails && stage.description && (
            <p className="text-xs text-[#9ca3af]">{stage.description}</p>
          )}
        </div>
        {stage.icon && (
          <div
            className={`text-xl ${
              isActive
                ? "text-cyan-400"
                : isCompleted
                  ? "text-green-400"
                  : "text-[#9ca3af]"
            }`}
          >
            <i className={stage.icon}></i>
          </div>
        )}
      </div>

      {/* Module Links */}
      {showDetails && stage.moduleLinks && stage.moduleLinks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            {stage.moduleLinks.map((link, idx) => (
              <Tooltip key={idx} content={link.label} position="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModuleLinkClick(link.module, link.action, link.href);
                  }}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    link.required
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30"
                      : "bg-white/5 text-[#9ca3af] border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.icon && <i className={`${link.icon} mr-1`}></i>}
                  {link.label}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Count */}
      {showDetails && instance?.evidence && instance.evidence.length > 0 && (
        <div className="mt-2 text-xs text-[#9ca3af]">
          <i className="ri-file-line mr-1"></i>
          {instance.evidence.length} evidence attached
        </div>
      )}

      {/* Comments Count */}
      {showDetails && instance?.comments && instance.comments.length > 0 && (
        <div className="mt-1 text-xs text-[#9ca3af]">
          <i className="ri-chat-1-line mr-1"></i>
          {instance.comments.length} comment
          {instance.comments.length > 1 ? "s" : ""}
        </div>
      )}
    </motion.div>
  );
}
