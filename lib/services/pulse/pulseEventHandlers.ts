/**
 * Pulse Event Handlers
 * Subscribe to external events and process them for Pulse scoring
 */

import { eventBus } from "@/lib/services/event-store";
import { pulseScoringService } from "./pulseScoringService";
import type { PulseEventType } from "@/types/pulse";
import type { DomainEvent } from "@/types/cqrs";

/**
 * Initialize Pulse event handlers
 * Subscribes to task, training, and IMS events
 */
export function initializePulseEventHandlers() {
  // Task completion events
  eventBus.subscribe("wms.task.completed", async (event: DomainEvent) => {
    try {
      const payload = event.payload as any;
      const { tenantId, userId, taskId, taskType, completedAt } = payload || {};

      if (!tenantId || !userId) {
        console.warn(
          "Pulse: Missing tenantId or userId in task completion event",
        );
        return;
      }

      await pulseScoringService.processEvent({
        tenantId,
        userId,
        occurredAt: completedAt
          ? new Date(completedAt)
          : new Date(event.timestamp),
        eventType: "TASK_CLOSED",
        sourceModule: "tasks",
        sourceRef: taskId,
        pointsAwardedPP: 0, // Will be calculated by scoring service
        creditsAwardedIC: 0,
        metadataJson: {
          taskId,
          taskType,
        },
      });
    } catch (error) {
      console.error("Pulse: Error processing task completion event:", error);
    }
  });

  // Training completion events
  eventBus.subscribe("qhse.training.completed", async (event: DomainEvent) => {
    try {
      const payload = event.payload as any;
      const { tenantId, employeeId, trainingProgramId, completedDate, score } =
        payload || {};

      if (!tenantId || !employeeId) {
        console.warn(
          "Pulse: Missing tenantId or employeeId in training completion event",
        );
        return;
      }

      await pulseScoringService.processEvent({
        tenantId,
        userId: employeeId,
        occurredAt: completedDate
          ? new Date(completedDate)
          : new Date(event.timestamp),
        eventType: "TRAINING_COMPLETED",
        sourceModule: "training",
        sourceRef: trainingProgramId,
        pointsAwardedPP: 0, // Will be calculated by scoring service
        creditsAwardedIC: 0,
        metadataJson: {
          trainingProgramId,
          score,
        },
      });
    } catch (error) {
      console.error(
        "Pulse: Error processing training completion event:",
        error,
      );
    }
  });

  // CAPA closure events
  eventBus.subscribe("iso-ims.capa.closed", async (event: DomainEvent) => {
    try {
      const payload = event.payload as any;
      const { tenantId, assignedTo, capaId, closedAt } = payload || {};

      if (!tenantId || !assignedTo) {
        console.warn(
          "Pulse: Missing tenantId or assignedTo in CAPA closure event",
        );
        return;
      }

      await pulseScoringService.processEvent({
        tenantId,
        userId: assignedTo,
        occurredAt: closedAt ? new Date(closedAt) : new Date(event.timestamp),
        eventType: "CAPA_CLOSED",
        sourceModule: "ims",
        sourceRef: capaId,
        pointsAwardedPP: 0, // Will be calculated by scoring service
        creditsAwardedIC: 0,
        metadataJson: {
          capaId,
        },
      });
    } catch (error) {
      console.error("Pulse: Error processing CAPA closure event:", error);
    }
  });

  // NCR closure events
  eventBus.subscribe("iso-ims.ncr.closed", async (event: DomainEvent) => {
    try {
      const payload = event.payload as any;
      const { tenantId, assignedTo, ncrId, closedAt } = payload || {};

      if (!tenantId || !assignedTo) {
        console.warn(
          "Pulse: Missing tenantId or assignedTo in NCR closure event",
        );
        return;
      }

      await pulseScoringService.processEvent({
        tenantId,
        userId: assignedTo,
        occurredAt: closedAt ? new Date(closedAt) : new Date(event.timestamp),
        eventType: "NCR_CLOSED",
        sourceModule: "ims",
        sourceRef: ncrId,
        pointsAwardedPP: 0, // Will be calculated by scoring service
        creditsAwardedIC: 0,
        metadataJson: {
          ncrId,
        },
      });
    } catch (error) {
      console.error("Pulse: Error processing NCR closure event:", error);
    }
  });

  // Safety observation events (if available)
  eventBus.subscribe("qhse.safety.observation", async (event: DomainEvent) => {
    try {
      const payload = event.payload as any;
      const { tenantId, reportedBy, observationId, reportedAt } = payload || {};

      if (!tenantId || !reportedBy) {
        console.warn(
          "Pulse: Missing tenantId or reportedBy in safety observation event",
        );
        return;
      }

      await pulseScoringService.processEvent({
        tenantId,
        userId: reportedBy,
        occurredAt: reportedAt
          ? new Date(reportedAt)
          : new Date(event.timestamp),
        eventType: "SAFETY_OBSERVATION",
        sourceModule: "qhse",
        sourceRef: observationId,
        pointsAwardedPP: 0, // Will be calculated by scoring service
        creditsAwardedIC: 0,
        metadataJson: {
          observationId,
        },
      });
    } catch (error) {
      console.error("Pulse: Error processing safety observation event:", error);
    }
  });

  console.log("Pulse: Event handlers initialized");
}
