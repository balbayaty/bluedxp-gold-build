"use client";

import Tooltip from "@/components/Tooltip";
import { Badge } from "@/components/ui/badge";
import type {
  CapabilityMaturity,
  CapabilityStatus,
} from "@/types/capabilities";

function maturityToVariant(
  m: CapabilityMaturity,
): "success" | "warning" | "error" | "info" | "default" {
  switch (m) {
    case "real":
      return "success";
    case "simulated":
      return "warning";
    case "placeholder":
      return "error";
    case "config_required":
      return "info";
    default:
      return "default";
  }
}

function maturityLabel(m: CapabilityMaturity): string {
  switch (m) {
    case "real":
      return "REAL";
    case "simulated":
      return "SIMULATED";
    case "placeholder":
      return "PLACEHOLDER";
    case "config_required":
      return "CONFIG REQUIRED";
    default:
      return "UNKNOWN";
  }
}

export function CapabilityBadge({ status }: { status: CapabilityStatus }) {
  const variant = maturityToVariant(status.maturity);
  const label = maturityLabel(status.maturity);

  const tooltip = [
    `${status.label}: ${label}`,
    status.reason,
    status.howToFix ? `How to make it real: ${status.howToFix}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Tooltip content={tooltip} position="bottom">
      <Badge
        variant={variant as any}
        className="cursor-help select-none flex items-center gap-2"
        aria-label={`${status.label} status: ${label}`}
      >
        <span
          className="inline-flex h-2 w-2 rounded-full bg-current opacity-90"
          aria-hidden="true"
        />
        <span className="whitespace-nowrap">{label}</span>
      </Badge>
    </Tooltip>
  );
}
