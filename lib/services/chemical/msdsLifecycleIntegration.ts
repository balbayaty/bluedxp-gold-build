/**
 * MSDS ↔ Lifecycle Integration
 *
 * The global lifecycle service is keyed by `${entityType}:${entityId}`.
 * To keep multi-tenant isolation without changing platform-wide lifecycle storage yet,
 * we use a composite entityId: `${tenantId}::${msdsId}`.
 */

import { lifecycleService } from "@/lib/services/process-lifecycle/lifecycle/lifecycleService";
import type { EntityLifecycle } from "@/types/lifecycle";

export function msdsLifecycleEntityId(
  tenantId: string,
  msdsId: string,
): string {
  return `${tenantId}::${msdsId}`;
}

export async function initializeMSDSLifecycle(params: {
  tenantId: string;
  msdsId: string;
  initialData?: Record<string, any>;
}): Promise<EntityLifecycle> {
  return lifecycleService.initializeLifecycle(
    msdsLifecycleEntityId(params.tenantId, params.msdsId),
    "MSDS",
    {
      tenantId: params.tenantId,
      msdsId: params.msdsId,
      ...(params.initialData || {}),
    },
  );
}

export async function transitionMSDSLifecycle(params: {
  tenantId: string;
  msdsId: string;
  toStageId: string;
  context?: Record<string, any>;
}): Promise<EntityLifecycle> {
  return lifecycleService.transitionStage(
    msdsLifecycleEntityId(params.tenantId, params.msdsId),
    "MSDS",
    params.toStageId,
    {
      ...(params.context || {}),
      tenantId: params.tenantId,
      msdsId: params.msdsId,
    },
  );
}
