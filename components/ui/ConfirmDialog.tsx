/**
 * ⚠️ CONFIRM DIALOG COMPONENT
 * 
 * Beautiful confirmation dialog for destructive actions
 * Accessible and user-friendly
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: string;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon,
  loading = false,
}) => {
  const variantStyles = {
    danger: {
      icon: icon || "ri-error-warning-line",
      iconColor: "text-red-400",
      iconBg: "bg-red-500/20",
      buttonBg: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: icon || "ri-alert-line",
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/20",
      buttonBg: "bg-yellow-600 hover:bg-yellow-700",
    },
    info: {
      icon: icon || "ri-information-line",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/20",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const styles = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
  };

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Dialog Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="
              relative w-full max-w-md
              bg-gradient-to-br from-[#1a1f2e] to-[#0f1419]
              border border-white/10
              rounded-2xl shadow-2xl
              overflow-hidden
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              <div className={`mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full ${styles.iconBg}`}>
                <i className={`${styles.icon} text-2xl ${styles.iconColor}`}></i>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white mb-2">
                {title}
              </h3>

              {/* Message */}
              <p className="text-sm text-[#9ca3af] mb-6 leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="
                    flex-1 px-4 py-2.5
                    bg-white/5 hover:bg-white/10
                    border border-white/10
                    text-white
                    rounded-lg
                    text-sm font-medium
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`
                    flex-1 px-4 py-2.5
                    ${styles.buttonBg}
                    text-white
                    rounded-lg
                    text-sm font-medium
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  {loading && (
                    <i className="ri-loader-4-line animate-spin"></i>
                  )}
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof window === "undefined") return null;
  return createPortal(dialogContent, document.body);
};

export default ConfirmDialog;
