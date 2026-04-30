"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";
import {
  handleKeyboardNavigation,
  KEYBOARD_KEYS,
} from "@/utils/accessibilityUtils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-full mx-4",
  };

  // Focus management and keyboard navigation
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";

      // Focus the modal when it opens
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      // Trap focus within modal
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;

        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      // Enhanced ESC key handling - works even when typing
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          // Always allow ESC to close modal, even when typing
          // This is the expected behavior for modals
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      };

      document.addEventListener("keydown", handleTabKey);
      document.addEventListener("keydown", handleEsc, true); // Use capture phase for ESC

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleTabKey);
        document.removeEventListener("keydown", handleEsc, true);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`bg-[#1f2937] border border-white/10 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) =>
                handleKeyboardNavigation(e, {
                  onEscape: onClose,
                })
              }
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                <h2 id="modal-title" className="text-2xl font-bold text-white">
                  {title}
                </h2>
                {showCloseButton && (
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    onKeyDown={(e) =>
                      handleKeyboardNavigation(e, {
                        onEnter: onClose,
                        onSpace: onClose,
                      })
                    }
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#9ca3af] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Close modal"
                  >
                    <i className="ri-close-line text-xl" aria-hidden="true"></i>
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
