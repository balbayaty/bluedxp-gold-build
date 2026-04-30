/**
 * Batch Shipment Processing Job Handler
 *
 * Processes multiple shipments in batch (updates, validations, status changes)
 */

import { JobHandler, JobProgress } from "@/types/job";
import { prisma } from "@/lib/services/database/prismaClient";

export const batchShipmentProcessorHandler: JobHandler = {
  type: "BATCH_PROCESSING",

  async validate(input: Record<string, any>) {
    if (
      !input.shipmentIds ||
      !Array.isArray(input.shipmentIds) ||
      input.shipmentIds.length === 0
    ) {
      return { valid: false, error: "shipmentIds array is required" };
    }
    if (
      !input.operation ||
      ![
        "update_status",
        "validate",
        "calculate_costs",
        "generate_labels",
      ].includes(input.operation)
    ) {
      return { valid: false, error: "Valid operation is required" };
    }
    return { valid: true };
  },

  async estimateDuration(input: Record<string, any>) {
    const shipmentCount = input.shipmentIds?.length || 0;
    const operation = input.operation || "update_status";

    // Estimate: 2-5 seconds per shipment depending on operation
    const secondsPerShipment =
      operation === "generate_labels"
        ? 5
        : operation === "calculate_costs"
          ? 3
          : 2;
    return shipmentCount * secondsPerShipment * 1000;
  },

  async process(job, onProgress) {
    const { shipmentIds, operation, parameters } = job.input;
    const tenantId = job.tenantId;
    const total = shipmentIds.length;

    await onProgress({
      current: 0,
      total,
      percentage: 0,
      message: `Starting batch ${operation} for ${total} shipments...`,
      stage: "initialization",
    });

    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < shipmentIds.length; i++) {
      const shipmentId = shipmentIds[i];

      try {
        await onProgress({
          current: i,
          total,
          percentage: Math.round((i / total) * 100),
          message: `Processing shipment ${i + 1} of ${total}...`,
          stage: "processing",
          details: {
            shipmentId,
            operation,
          },
        });

        let result: any;

        switch (operation) {
          case "update_status":
            result = await updateShipmentStatus(
              shipmentId,
              parameters?.status,
              tenantId,
            );
            break;

          case "validate":
            result = await validateShipment(shipmentId, tenantId);
            break;

          case "calculate_costs":
            result = await calculateShipmentCosts(shipmentId, tenantId);
            break;

          case "generate_labels":
            result = await generateShipmentLabel(shipmentId, tenantId);
            break;

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push({
          shipmentId,
          success: true,
          result,
        });
      } catch (error) {
        errors.push({
          shipmentId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Small delay to prevent overwhelming the system
      if (i < shipmentIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    await onProgress({
      current: total,
      total,
      percentage: 100,
      message: `Batch processing completed. ${results.length} succeeded, ${errors.length} failed.`,
      stage: "completed",
    });

    return {
      total,
      succeeded: results.length,
      failed: errors.length,
      results,
      errors,
    };
  },

  async cleanup(job) {
    console.log(`Cleaning up batch processing job ${job.id}`);
  },
};

// Helper functions
async function updateShipmentStatus(
  shipmentId: string,
  newStatus: string,
  tenantId: string,
) {
  const shipment = await prisma.transportationShipment.findFirst({
    where: { id: shipmentId, tenantId },
  });

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const updated = await prisma.transportationShipment.update({
    where: { id: shipmentId },
    data: {
      status: newStatus,
      shipment: {
        ...(shipment.shipment as any),
        status: newStatus,
        updatedAt: new Date().toISOString(),
      } as any,
    },
  });

  return { shipmentId, oldStatus: shipment.status, newStatus };
}

async function validateShipment(shipmentId: string, tenantId: string) {
  const shipment = await prisma.transportationShipment.findFirst({
    where: { id: shipmentId, tenantId },
  });

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const shipmentData = shipment.shipment as any;
  const issues: string[] = [];

  // Validate required fields
  if (!shipmentData.origin) issues.push("Missing origin");
  if (!shipmentData.destination) issues.push("Missing destination");
  if (!shipmentData.cargo) issues.push("Missing cargo information");

  return {
    shipmentId,
    valid: issues.length === 0,
    issues,
  };
}

async function calculateShipmentCosts(shipmentId: string, tenantId: string) {
  const shipment = await prisma.transportationShipment.findFirst({
    where: { id: shipmentId, tenantId },
  });

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const shipmentData = shipment.shipment as any;

  // Simple cost calculation (in production, use actual pricing service)
  const baseCost = 1000;
  const distanceCost = (shipmentData.distance || 0) * 0.5;
  const weightCost = (shipmentData.cargo?.weight || 0) * 0.1;
  const totalCost = baseCost + distanceCost + weightCost;

  // Update shipment with calculated costs
  await prisma.transportationShipment.update({
    where: { id: shipmentId },
    data: {
      shipment: {
        ...shipmentData,
        freightCharges: {
          base: baseCost,
          distance: distanceCost,
          weight: weightCost,
          total: totalCost,
        },
      } as any,
    },
  });

  return {
    shipmentId,
    costs: {
      base: baseCost,
      distance: distanceCost,
      weight: weightCost,
      total: totalCost,
    },
  };
}

async function generateShipmentLabel(shipmentId: string, tenantId: string) {
  const shipment = await prisma.transportationShipment.findFirst({
    where: { id: shipmentId, tenantId },
  });

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  // In production, generate actual label PDF/image
  const labelUrl = `/api/transportation/shipments/${shipmentId}/label`;

  return {
    shipmentId,
    labelUrl,
    generatedAt: new Date().toISOString(),
  };
}
