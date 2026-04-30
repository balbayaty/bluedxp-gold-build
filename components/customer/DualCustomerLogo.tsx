"use client";

import { motion } from "framer-motion";
import { Customer } from "@/types/tenant";
import CustomerLogo from "./CustomerLogo";

interface DualCustomerLogoProps {
  primaryCustomer: Customer | null;
  subCustomer?: {
    id: string;
    customerName: string;
    logo?: {
      url: string;
      alt: string;
      width?: number;
      height?: number;
      variant?: "light" | "dark" | "full";
    };
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "stacked" | "side-by-side" | "overlay" | "split";
  showLabels?: boolean;
}

/**
 * DualCustomerLogo Component
 *
 * Displays two customer logos in creative layouts for nested customer scenarios.
 * Perfect for 3PL/4PL situations where a customer (e.g., Flex Logistics)
 * has their own customers (sub-customers).
 *
 * Variants:
 * - stacked: Logos stacked vertically
 * - side-by-side: Logos side by side with divider
 * - overlay: Sub-customer logo overlays primary (badge style)
 * - split: Split view with visual connection
 */
export default function DualCustomerLogo({
  primaryCustomer,
  subCustomer,
  size = "md",
  className = "",
  variant = "side-by-side",
  showLabels = false,
}: DualCustomerLogoProps) {
  if (!primaryCustomer && !subCustomer) {
    return null;
  }

  // If only one customer, use regular CustomerLogo
  if (!subCustomer) {
    return (
      <CustomerLogo
        logo={primaryCustomer?.logo}
        customerName={primaryCustomer?.customerName || ""}
        size={size}
        variant="compact"
        className={className}
      />
    );
  }

  if (!primaryCustomer) {
    return (
      <CustomerLogo
        logo={subCustomer.logo}
        customerName={subCustomer.customerName}
        size={size}
        variant="compact"
        className={className}
      />
    );
  }

  const sizeClasses = {
    sm: "h-5",
    md: "h-7",
    lg: "h-9",
    xl: "h-11",
  };

  // Stacked Variant: Logos stacked vertically
  if (variant === "stacked") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center gap-2 ${className}`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <CustomerLogo
            logo={primaryCustomer.logo}
            customerName={primaryCustomer.customerName}
            size={size}
            variant="compact"
          />
          {showLabels && (
            <span className="text-xs text-white/60 font-medium">
              {primaryCustomer.customerName}
            </span>
          )}
        </div>
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex flex-col items-center gap-1.5">
          <CustomerLogo
            logo={subCustomer.logo}
            customerName={subCustomer.customerName}
            size={size}
            variant="compact"
          />
          {showLabels && (
            <span className="text-xs text-white/60 font-medium">
              {subCustomer.customerName}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Side-by-Side Variant: Logos side by side with elegant divider
  if (variant === "side-by-side") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-3 ${className}`}
      >
        <CustomerLogo
          logo={primaryCustomer.logo}
          customerName={primaryCustomer.customerName}
          size={size}
          variant="compact"
        />
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-px bg-gradient-to-b from-white/30 via-white/50 to-white/30" />
          <div className="h-1 w-1 rounded-full bg-white/40" />
          <div className="h-6 w-px bg-gradient-to-b from-white/30 via-white/50 to-white/30" />
        </div>
        <CustomerLogo
          logo={subCustomer.logo}
          customerName={subCustomer.customerName}
          size={size}
          variant="compact"
        />
      </motion.div>
    );
  }

  // Overlay Variant: Sub-customer logo as badge/overlay
  if (variant === "overlay") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative inline-flex items-center ${className}`}
      >
        {/* Primary Customer Logo */}
        <CustomerLogo
          logo={primaryCustomer.logo}
          customerName={primaryCustomer.customerName}
          size={size}
          variant="compact"
        />
        {/* Sub-Customer Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="absolute -bottom-1 -right-1 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-1 shadow-lg border-2 border-[#0a0e14]"
        >
          <div
            className={`${sizeClasses[size]} aspect-square rounded-full bg-white/10 flex items-center justify-center overflow-hidden`}
          >
            {subCustomer.logo ? (
              <img
                src={subCustomer.logo.url}
                alt={subCustomer.logo.alt || subCustomer.customerName}
                className="h-full w-full object-contain p-0.5"
                onError={(e) => {
                  // Fallback to initials
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const initials = subCustomer.customerName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    parent.innerHTML = `<span class="text-[8px] font-bold text-white">${initials}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-[8px] font-bold text-white">
                {subCustomer.customerName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Split Variant: Visual connection with connecting line
  if (variant === "split") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-2 ${className}`}
      >
        <div className="flex flex-col items-center gap-1">
          <CustomerLogo
            logo={primaryCustomer.logo}
            customerName={primaryCustomer.customerName}
            size={size}
            variant="compact"
          />
          {showLabels && (
            <span className="text-[10px] text-white/50 font-medium max-w-[60px] truncate">
              {primaryCustomer.customerName}
            </span>
          )}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-white/20 via-white/40 to-white/20 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <CustomerLogo
            logo={subCustomer.logo}
            customerName={subCustomer.customerName}
            size={size}
            variant="compact"
          />
          {showLabels && (
            <span className="text-[10px] text-white/50 font-medium max-w-[60px] truncate">
              {subCustomer.customerName}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Default: side-by-side
  return (
    <motion.div className={`flex items-center gap-3 ${className}`}>
      <CustomerLogo
        logo={primaryCustomer.logo}
        customerName={primaryCustomer.customerName}
        size={size}
        variant="compact"
      />
      <div className="h-6 w-px bg-white/20" />
      <CustomerLogo
        logo={subCustomer.logo}
        customerName={subCustomer.customerName}
        size={size}
        variant="compact"
      />
    </motion.div>
  );
}
