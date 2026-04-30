import { moduleRegistry } from "@/lib/modules/registry";

export type MsdsSkuLinkingRbacConfig = {
  readerRoles: string[];
  writerRoles: string[];
  approverRoles: string[];
};

const DEFAULT_RBAC: MsdsSkuLinkingRbacConfig = {
  readerRoles: [
    "SYSTEM_ADMIN",
    "COMPLIANCE_OFFICER",
    "WMS_MANAGER",
    "WAREHOUSE_MANAGER",
    "CUSTOMER_ADMIN",
    "CUSTOMER_USER",
  ],
  writerRoles: [
    "SYSTEM_ADMIN",
    "COMPLIANCE_OFFICER",
    "WMS_MANAGER",
    "WAREHOUSE_MANAGER",
  ],
  approverRoles: ["SYSTEM_ADMIN", "COMPLIANCE_OFFICER"],
};

function uniq(arr: string[] | undefined): string[] {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

export function getMsdsSkuLinkingRbac(): MsdsSkuLinkingRbacConfig {
  const cfg = moduleRegistry.getModule("msds")?.config?.msdsSkuLinkingRbac as
    | Partial<MsdsSkuLinkingRbacConfig>
    | undefined;

  return {
    readerRoles: uniq(cfg?.readerRoles ?? DEFAULT_RBAC.readerRoles),
    writerRoles: uniq(cfg?.writerRoles ?? DEFAULT_RBAC.writerRoles),
    approverRoles: uniq(cfg?.approverRoles ?? DEFAULT_RBAC.approverRoles),
  };
}
