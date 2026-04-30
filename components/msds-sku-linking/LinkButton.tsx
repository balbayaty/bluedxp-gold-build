"use client";

/**
 * Link Button Component
 * Quick action button to link MSDS to SKU or vice versa
 */

import { useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/Modal";
import LinkCreationForm from "./LinkCreationForm";

interface LinkButtonProps {
  msdsId?: string;
  skuId?: string;
  customerId?: string;
  variant?: "primary" | "secondary" | "icon";
  size?: "sm" | "md" | "lg";
  onLinkCreated?: () => void;
}

export default function LinkButton({
  msdsId,
  skuId,
  customerId,
  variant = "primary",
  size = "md",
  onLinkCreated,
}: LinkButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!msdsId && !skuId) {
      alert("Either MSDS ID or SKU ID is required");
      return;
    }
    setShowModal(true);
  };

  const handleLinkCreated = () => {
    setShowModal(false);
    onLinkCreated?.();
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary: "bg-cyan-600 hover:bg-cyan-700 text-white",
    secondary: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
    icon: "p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-cyan-400",
  };

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={loading}
          className={`${variantClasses.icon} rounded-lg transition-colors disabled:opacity-50`}
          title={msdsId ? "Link to SKU" : "Link to MSDS"}
        >
          <i className="ri-link text-lg"></i>
        </button>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={msdsId ? "Link MSDS to SKU" : "Link SKU to MSDS"}
            size="lg"
          >
            <LinkCreationForm
              msdsId={msdsId}
              skuId={skuId}
              customerId={customerId}
              onSuccess={handleLinkCreated}
              onCancel={() => setShowModal(false)}
            />
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2`}
      >
        <i className="ri-link"></i>
        {msdsId ? "Link to SKU" : "Link to MSDS"}
      </button>
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={msdsId ? "Link MSDS to SKU" : "Link SKU to MSDS"}
          size="lg"
        >
          <LinkCreationForm
            msdsId={msdsId}
            skuId={skuId}
            customerId={customerId}
            onSuccess={handleLinkCreated}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}
    </>
  );
}
