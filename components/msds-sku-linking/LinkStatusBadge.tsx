"use client";

/**
 * Link Status Badge Component
 * Displays the status of an MSDS-SKU link
 */

import { MSDSSKULinkStatus } from "@/types/msdsSkuLinking";

interface LinkStatusBadgeProps {
  status: MSDSSKULinkStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export default function LinkStatusBadge({
  status,
  size = "md",
  showIcon = true,
}: LinkStatusBadgeProps) {
  const statusConfig = {
    PENDING: {
      label: "Pending",
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: "ri-time-line",
    },
    APPROVED: {
      label: "Approved",
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: "ri-checkbox-circle-line",
    },
    REJECTED: {
      label: "Rejected",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: "ri-close-circle-line",
    },
    CONDITIONAL: {
      label: "Conditional",
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      icon: "ri-alert-line",
    },
    EXPIRED: {
      label: "Expired",
      color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      icon: "ri-time-expired-line",
    },
    REVOKED: {
      label: "Revoked",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: "ri-forbid-line",
    },
    SUPERSEDED: {
      label: "Superseded",
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      icon: "ri-refresh-line",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${config.color} border rounded-full font-medium`}
    >
      {showIcon && <i className={config.icon}></i>}
      {config.label}
    </span>
  );
}
