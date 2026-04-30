import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { customsAdapterRegistry } from "./customsAdapterRegistry";
import { evidenceService } from "@/lib/services/evidence";
import { createEvent } from "@/lib/services/event-store/utils";
import { transitionCustomsDeclarationLifecycle } from "./customsLifecycleIntegration";

let initialized = false;

export function initializeCustomsSubmissionWorker() {
  if (initialized) return;
  initialized = true;

  // Listen for the integration-first submission request event.
  eventBus.subscribe(
    "transportation.customs.declaration.submission_requested",
    async (event: DomainEvent) => {
      const tenantId = event.metadata?.tenantId;
      const userId = event.metadata?.userId || "system";
      const payload = (event.payload || {}) as any;

      if (!tenantId) return;
      const declarationId = String(payload.declarationId || payload.id || "");
      if (!declarationId) return;

      const system =
        typeof payload.system === "string"
          ? payload.system
          : typeof payload.requestedSystem === "string"
            ? payload.requestedSystem
            : undefined;
      const countryCode =
        typeof payload.countryCode === "string"
          ? payload.countryCode
          : typeof payload.requestedCountryCode === "string"
            ? payload.requestedCountryCode
            : undefined;

      const adapter = customsAdapterRegistry.resolve(system);

      try {
        const result = await adapter.submitDeclaration({
          tenantId,
          declarationId,
          system,
          countryCode,
        });

        await transportationDatabaseAdapterInstance.updateCustomsDeclaration({
          tenantId,
          id: declarationId,
          updatedBy: userId,
          patch: {
            status: result.status,
            complianceStatus: "PENDING",
            complianceNotes: `Submission routed via adapter "${adapter.id}": ${result.message || result.status}`,
            integration: {
              provider: adapter.id,
              externalReference: result.externalReference,
              submittedAt: new Date().toISOString(),
              countryCode,
            },
          },
        });

        const evd = await evidenceService.create({
          tenantId,
          type: "event",
          category: "compliance",
          title: `Customs submission processed: ${declarationId}`,
          description:
            "Customs submission worker processed a submission request via adapter.",
          content: JSON.stringify(
            { declarationId, provider: adapter.id, result },
            null,
            2,
          ),
          createdBy: userId,
          metadata: {
            source: "customs-submission-worker",
            capturedAt: new Date().toISOString(),
            capturedMethod: "event",
          },
          relatedEntities: [
            {
              entityId: declarationId,
              entityType: "customs_declaration",
              relationship: "subject",
              addedAt: new Date().toISOString(),
            },
          ],
          tags: ["tms", "customs", "integration", "submission"],
        } as any);

        // Process & Lifecycle integration
        try {
          await transitionCustomsDeclarationLifecycle({
            tenantId,
            declarationId,
            toStageId: "CUSTOMS_SUBMITTED",
            context: {
              provider: adapter.id,
              status: result.status,
              externalReference: result.externalReference,
              evidenceId: evd.id,
              processedAt: new Date().toISOString(),
            },
          });
        } catch (e) {
          console.warn(
            "[customsSubmissionWorker] Failed to transition lifecycle (SUBMITTED):",
            e,
          );
        }

        await eventBus.publish(
          createEvent(
            "transportation.customs.declaration.submission_processed",
            declarationId,
            "CustomsDeclaration",
            {
              declarationId,
              provider: adapter.id,
              status: result.status,
              evidenceId: evd.id,
            },
            1,
            { tenantId, userId, source: "customs-worker" },
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await transportationDatabaseAdapterInstance.updateCustomsDeclaration({
          tenantId,
          id: declarationId,
          updatedBy: userId,
          patch: {
            status: "FAILED",
            complianceStatus: "NON_COMPLIANT",
            complianceNotes: `Submission failed: ${msg}`,
          },
        });

        // Process & Lifecycle integration
        try {
          await transitionCustomsDeclarationLifecycle({
            tenantId,
            declarationId,
            toStageId: "CUSTOMS_FAILED",
            context: {
              provider: adapter.id,
              error: msg,
              failedAt: new Date().toISOString(),
            },
          });
        } catch (e) {
          console.warn(
            "[customsSubmissionWorker] Failed to transition lifecycle (FAILED):",
            e,
          );
        }

        await eventBus.publish(
          createEvent(
            "transportation.customs.declaration.submission_failed",
            declarationId,
            "CustomsDeclaration",
            { declarationId, provider: adapter.id, error: msg },
            1,
            { tenantId, userId, source: "customs-worker" },
          ),
        );
      }
    },
  );
}
