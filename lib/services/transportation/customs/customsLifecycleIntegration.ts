/**
 * Customs Declaration ↔ Process Lifecycle Integration
 *
 * Lifecycle service is globally keyed by `${entityType}:${entityId}`.
 * To keep tenant isolation (until lifecycle persistence is tenant-aware),
 * we use a composite entityId: `${tenantId}::${declarationId}`.
 */

import { lifecycleService } from "@/lib/services/process-lifecycle/lifecycle/lifecycleService";
import type { EntityLifecycle } from "@/types/lifecycle";

export function customsLifecycleEntityId(
  tenantId: string,
  declarationId: string,
): string {
  return `${tenantId}::${declarationId}`;
}

export async function initializeCustomsDeclarationLifecycle(params: {
  tenantId: string;
  declarationId: string;
  initialData?: Record<string, unknown>;
}): Promise<EntityLifecycle> {
  return lifecycleService.initializeLifecycle(
    customsLifecycleEntityId(params.tenantId, params.declarationId),
    "CUSTOMS_DECLARATION",
    {
      tenantId: params.tenantId,
      declarationId: params.declarationId,
      ...(params.initialData || {}),
    },
  );
}

export async function transitionCustomsDeclarationLifecycle(params: {
  tenantId: string;
  declarationId: string;
  toStageId: string;
  context?: Record<string, unknown>;
}): Promise<EntityLifecycle> {
  return lifecycleService.transitionStage(
    customsLifecycleEntityId(params.tenantId, params.declarationId),
    "CUSTOMS_DECLARATION",
    params.toStageId,
    {
      ...(params.context || {}),
      tenantId: params.tenantId,
      declarationId: params.declarationId,
    },
  );
}
