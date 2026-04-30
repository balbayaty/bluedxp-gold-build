import type {
  CapabilityAutoCondition,
  CapabilityStatus,
} from "@/types/capabilities";

function isNonEmpty(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isTrue(v: string | undefined | null): boolean {
  return (v || "").trim().toLowerCase() === "true";
}

function jsonArrayNonEmpty(v: string | undefined | null): boolean {
  if (!isNonEmpty(v)) return false;
  try {
    const parsed = JSON.parse(v as string) as unknown;
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

function evalCondition(c: CapabilityAutoCondition): boolean {
  switch (c.kind) {
    case "env_set":
      return isNonEmpty(process.env[c.key]);
    case "env_true":
      return isTrue(process.env[c.key]);
    case "env_json_array_nonempty":
      return jsonArrayNonEmpty(process.env[c.key]);
    default: {
      const _exhaustive: never = c;
      return _exhaustive;
    }
  }
}

export function resolveCapabilityStatus(
  status: CapabilityStatus,
): CapabilityStatus {
  // Safety rule: only auto-upgrade CONFIG_REQUIRED -> REAL
  if (status.maturity !== "config_required") return status;
  if (!status.autoUpgrade) return status;
  if (status.autoUpgrade.upgradeTo !== "real") return status;

  const satisfied = status.autoUpgrade.anyOfAll.some((group) =>
    group.every(evalCondition),
  );
  if (!satisfied) return status;

  return {
    ...status,
    maturity: "real",
    reason: `${status.reason} (Auto: required configuration detected.)`,
    howToFix: undefined,
  };
}
