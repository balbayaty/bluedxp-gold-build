/**
 * Field Help Tooltip Component
 * Provides contextual help for form fields
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FieldHelpProps {
  text: string;
  title?: string;
  icon?: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function FieldHelp({
  text,
  title,
  icon = "ri-question-line",
  position = "top",
  className = "",
}: FieldHelpProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Adjust position if tooltip would overflow viewport
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let newPosition = position;

      // Check vertical overflow
      if (position === "top" && triggerRect.top - tooltipRect.height < 10) {
        newPosition = "bottom";
      } else if (
        position === "bottom" &&
        triggerRect.bottom + tooltipRect.height > viewport.height - 10
      ) {
        newPosition = "top";
      }

      // Check horizontal overflow
      if (position === "left" && triggerRect.left - tooltipRect.width < 10) {
        newPosition = "right";
      } else if (
        position === "right" &&
        triggerRect.right + tooltipRect.width > viewport.width - 10
      ) {
        newPosition = "left";
      }

      if (newPosition !== actualPosition) {
        setActualPosition(newPosition);
      }
    }
  }, [isVisible, position, actualPosition]);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[#374151] border-x-transparent border-b-transparent",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-[#374151] border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[#374151] border-y-transparent border-r-transparent",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-[#374151] border-y-transparent border-l-transparent",
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="text-[#9ca3af] hover:text-cyan-400 transition-colors p-0.5 -m-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label={`Help: ${title || text}`}
      >
        <i className={`${icon} text-sm`}></i>
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionClasses[actualPosition]}`}
          >
            <div className="bg-[#374151] border border-white/10 rounded-lg shadow-xl p-3 max-w-xs">
              {title && (
                <div className="text-white font-medium text-sm mb-1 flex items-center gap-1.5">
                  <i className="ri-lightbulb-line text-yellow-400"></i>
                  {title}
                </div>
              )}
              <p className="text-[#d1d5db] text-xs leading-relaxed">{text}</p>
            </div>
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-[6px] ${arrowClasses[actualPosition]}`}
            ></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline help text (appears below field)
export function InlineHelp({
  text,
  icon = "ri-information-line",
  className = "",
}: {
  text: string;
  icon?: string;
  className?: string;
}) {
  return (
    <p
      className={`text-xs text-[#6b7280] mt-1 flex items-start gap-1 ${className}`}
    >
      <i className={`${icon} mt-0.5 flex-shrink-0`}></i>
      <span>{text}</span>
    </p>
  );
}

// Field label with optional help
export function FieldLabel({
  label,
  required = false,
  htmlFor,
  help,
  className = "",
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  help?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 mb-2 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-white flex items-center gap-1"
      >
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {help && <FieldHelp text={help} />}
    </div>
  );
}
