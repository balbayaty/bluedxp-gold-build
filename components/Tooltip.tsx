"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string | React.ReactNode;
  examples?: string[];
  systemInfo?: {
    sap?: string;
    oracle?: string;
    manhattan?: string;
    custom?: string;
  };
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export default function Tooltip({
  content,
  examples,
  systemInfo,
  children,
  position = "top",
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: position === "top" ? 5 : position === "bottom" ? -5 : 0,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionClasses[position]}`}
          >
            <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4 shadow-2xl max-w-sm backdrop-blur-sm">
              {typeof content === "string" ? (
                <div className="text-sm text-white font-medium mb-2">
                  {content}
                </div>
              ) : (
                <div className="text-sm text-white">{content}</div>
              )}

              {systemInfo && (
                <div className="mt-3 pt-3 border-t border-[#374151] space-y-1.5">
                  {systemInfo.sap && (
                    <div className="text-xs">
                      <span className="text-blue-400 font-medium">SAP:</span>
                      <span className="text-[#9ca3af] ml-1">
                        {systemInfo.sap}
                      </span>
                    </div>
                  )}
                  {systemInfo.oracle && (
                    <div className="text-xs">
                      <span className="text-orange-400 font-medium">
                        Oracle:
                      </span>
                      <span className="text-[#9ca3af] ml-1">
                        {systemInfo.oracle}
                      </span>
                    </div>
                  )}
                  {systemInfo.manhattan && (
                    <div className="text-xs">
                      <span className="text-purple-400 font-medium">
                        Manhattan:
                      </span>
                      <span className="text-[#9ca3af] ml-1">
                        {systemInfo.manhattan}
                      </span>
                    </div>
                  )}
                  {systemInfo.custom && (
                    <div className="text-xs">
                      <span className="text-cyan-400 font-medium">Custom:</span>
                      <span className="text-[#9ca3af] ml-1">
                        {systemInfo.custom}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {examples && examples.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#374151]">
                  <div className="text-xs text-cyan-400 font-medium mb-1.5">
                    Examples:
                  </div>
                  <ul className="space-y-1">
                    {examples.map((example, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-[#9ca3af] flex items-start gap-1.5"
                      >
                        <i className="ri-arrow-right-s-line text-cyan-400 mt-0.5"></i>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Arrow */}
              <div
                className={`absolute w-2 h-2 bg-[#1f2937] border border-[#374151] rotate-45 ${
                  position === "top"
                    ? "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0"
                    : position === "bottom"
                      ? "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0"
                      : position === "left"
                        ? "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0"
                        : "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0"
                }`}
              ></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
