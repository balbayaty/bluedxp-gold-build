/**
 * QR Code Bulk Operations Service
 * Enterprise-grade bulk QR code operations
 *
 * Features:
 * - Bulk QR code generation (CSV/Excel import)
 * - Bulk QR code updates
 * - Bulk QR code deletion
 * - Bulk analytics export
 * - Batch processing API
 */

import { BulkQROperation } from "@/types/qr";
import { documentQRService } from "./documentQRService";
import { qrTemplateService } from "./qrTemplateService";
import { eventBus } from "@/lib/services/event-store";
import { qrDatabaseAdapter } from "./database/qrDatabaseAdapter";

export interface BulkGenerateInput {
  items: Array<{
    documentId: string;
    documentType: string;
    documentUrl?: string;
    templateId?: string;
    customData?: Record<string, any>;
  }>;
  options?: {
    templateId?: string;
    analytics?: boolean;
    dynamic?: boolean;
  };
}

export interface BulkUpdateInput {
  items: Array<{
    qrId: string;
    updates: {
      documentUrl?: string;
      expiresAt?: string;
      accessLevel?: string;
      customData?: Record<string, any>;
    };
  }>;
}

export interface BulkDeleteInput {
  qrIds: string[];
}

export class QRBulkService {
  private dbAdapter = qrDatabaseAdapter;
  private operations: Map<string, BulkQROperation> = new Map();

  /**
   * Generate QR codes in bulk
   */
  async bulkGenerate(
    input: BulkGenerateInput,
    createdBy: string,
  ): Promise<BulkQROperation> {
    const operationId = `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const operation: BulkQROperation = {
      id: operationId,
      type: "generate",
      status: "processing",
      items: input.items.map((item) => ({
        id: item.documentId,
        data: item,
        status: "pending",
      })),
      totalItems: input.items.length,
      processedItems: 0,
      failedItems: 0,
      startedAt: new Date(),
      createdBy,
      metadata: {
        options: input.options,
      },
    };

    this.operations.set(operationId, operation);

    // Process asynchronously
    this.processBulkGenerate(operation, input).catch((error) => {
      console.error("Bulk generate error:", error);
      operation.status = "failed";
      this.operations.set(operationId, operation);
    });

    // Publish event
    await eventBus.publish("qr.bulk.generate.started", {
      operationId,
      totalItems: input.items.length,
      timestamp: new Date(),
    });

    return operation;
  }

  /**
   * Process bulk generation
   */
  private async processBulkGenerate(
    operation: BulkQROperation,
    input: BulkGenerateInput,
  ): Promise<void> {
    for (const item of operation.items) {
      try {
        const itemData = input.items.find((i) => i.documentId === item.id);
        if (!itemData) {
          item.status = "failed";
          item.error = "Item data not found";
          operation.failedItems++;
          continue;
        }

        let result;
        if (itemData.templateId || input.options?.templateId) {
          // Generate from template
          result = await qrTemplateService.generateFromTemplate(
            itemData.templateId || input.options!.templateId!,
            {
              documentId: itemData.documentId,
              documentType: itemData.documentType,
              documentUrl: itemData.documentUrl,
              customData: itemData.customData,
            },
          );
        } else {
          // Generate standard QR
          const qrResult = await documentQRService.generateDocumentQR({
            documentId: itemData.documentId,
            documentType: itemData.documentType as any,
            documentUrl: itemData.documentUrl,
            dynamic: input.options?.dynamic !== false,
            analytics: input.options?.analytics !== false,
            customData: itemData.customData,
          });

          result = {
            qrCode: qrResult.qrCode,
            qrImageUrl: qrResult.qrImageUrl,
            qrId: qrResult.qrData.id,
          };
        }

        item.status = "success";
        item.data = result;
        operation.processedItems++;

        // Update operation
        this.operations.set(operation.id, operation);
      } catch (error: any) {
        item.status = "failed";
        item.error = error.message || "Unknown error";
        operation.failedItems++;
        this.operations.set(operation.id, operation);
      }
    }

    operation.status = "completed";
    operation.completedAt = new Date();
    this.operations.set(operation.id, operation);

    // Publish event
    await eventBus.publish("qr.bulk.generate.completed", {
      operationId: operation.id,
      totalItems: operation.totalItems,
      processedItems: operation.processedItems,
      failedItems: operation.failedItems,
      timestamp: new Date(),
    });
  }

  /**
   * Update QR codes in bulk
   */
  async bulkUpdate(
    input: BulkUpdateInput,
    createdBy: string,
  ): Promise<BulkQROperation> {
    const operationId = `bulk-update-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const operation: BulkQROperation = {
      id: operationId,
      type: "update",
      status: "processing",
      items: input.items.map((item) => ({
        id: item.qrId,
        data: item,
        status: "pending",
      })),
      totalItems: input.items.length,
      processedItems: 0,
      failedItems: 0,
      startedAt: new Date(),
      createdBy,
    };

    this.operations.set(operationId, operation);

    // Process asynchronously
    this.processBulkUpdate(operation, input).catch((error) => {
      console.error("Bulk update error:", error);
      operation.status = "failed";
      this.operations.set(operationId, operation);
    });

    return operation;
  }

  /**
   * Process bulk update
   */
  private async processBulkUpdate(
    operation: BulkQROperation,
    input: BulkUpdateInput,
  ): Promise<void> {
    for (const item of operation.items) {
      try {
        const itemData = input.items.find((i) => i.qrId === item.id);
        if (!itemData) {
          item.status = "failed";
          item.error = "Item data not found";
          operation.failedItems++;
          continue;
        }

        const success = await documentQRService.updateDynamicQR(
          itemData.qrId,
          itemData.updates,
        );

        if (success) {
          item.status = "success";
          operation.processedItems++;
        } else {
          item.status = "failed";
          item.error = "Update failed";
          operation.failedItems++;
        }

        this.operations.set(operation.id, operation);
      } catch (error: any) {
        item.status = "failed";
        item.error = error.message || "Unknown error";
        operation.failedItems++;
        this.operations.set(operation.id, operation);
      }
    }

    operation.status = "completed";
    operation.completedAt = new Date();
    this.operations.set(operation.id, operation);
  }

  /**
   * Delete QR codes in bulk
   */
  async bulkDelete(
    input: BulkDeleteInput,
    createdBy: string,
  ): Promise<BulkQROperation> {
    const operationId = `bulk-delete-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const operation: BulkQROperation = {
      id: operationId,
      type: "delete",
      status: "processing",
      items: input.qrIds.map((qrId) => ({
        id: qrId,
        data: { qrId },
        status: "pending",
      })),
      totalItems: input.qrIds.length,
      processedItems: 0,
      failedItems: 0,
      startedAt: new Date(),
      createdBy,
    };

    this.operations.set(operationId, operation);

    // Process asynchronously
    this.processBulkDelete(operation, input).catch((error) => {
      console.error("Bulk delete error:", error);
      operation.status = "failed";
      this.operations.set(operationId, operation);
    });

    return operation;
  }

  /**
   * Process bulk delete
   */
  private async processBulkDelete(
    operation: BulkQROperation,
    input: BulkDeleteInput,
  ): Promise<void> {
    for (const item of operation.items) {
      try {
        // Attempt to delete the QR code from database
        const deleted = await this.dbAdapter.deleteQRCode(item.id);

        if (deleted) {
          item.status = "success";
          operation.processedItems++;
        } else {
          // QR code not found or already deleted
          item.status = "success"; // Consider not found as success for idempotency
          operation.processedItems++;
        }

        this.operations.set(operation.id, operation);
      } catch (error: any) {
        item.status = "failed";
        item.error = error.message || "Delete failed";
        operation.failedItems++;
        this.operations.set(operation.id, operation);
      }
    }

    operation.status = "completed";
    operation.completedAt = new Date();
    this.operations.set(operation.id, operation);

    // Publish event
    await eventBus.publish("qr.bulk.delete.completed", {
      operationId: operation.id,
      totalItems: operation.totalItems,
      processedItems: operation.processedItems,
      failedItems: operation.failedItems,
      timestamp: new Date(),
    });
  }

  /**
   * Get bulk operation status
   */
  async getOperationStatus(
    operationId: string,
  ): Promise<BulkQROperation | null> {
    return this.operations.get(operationId) || null;
  }

  /**
   * List bulk operations
   */
  async listOperations(options?: {
    type?: BulkQROperation["type"];
    status?: BulkQROperation["status"];
    createdBy?: string;
    limit?: number;
  }): Promise<BulkQROperation[]> {
    let operations = Array.from(this.operations.values());

    if (options?.type) {
      operations = operations.filter((op) => op.type === options.type);
    }
    if (options?.status) {
      operations = operations.filter((op) => op.status === options.status);
    }
    if (options?.createdBy) {
      operations = operations.filter(
        (op) => op.createdBy === options.createdBy,
      );
    }

    operations.sort((a, b) => {
      const aTime = a.startedAt?.getTime() || 0;
      const bTime = b.startedAt?.getTime() || 0;
      return bTime - aTime;
    });

    if (options?.limit) {
      operations = operations.slice(0, options.limit);
    }

    return operations;
  }

  /**
   * Export bulk operation results
   */
  async exportOperationResults(operationId: string): Promise<{
    csv: string;
    json: any[];
  }> {
    const operation = await this.getOperationStatus(operationId);
    if (!operation) {
      throw new Error(`Operation not found: ${operationId}`);
    }

    // Generate CSV
    const csvRows = [
      ["ID", "Status", "Error", "QR ID", "QR Code", "QR Image URL"].join(","),
    ];

    for (const item of operation.items) {
      const row = [
        item.id,
        item.status,
        item.error || "",
        item.data?.qrId || "",
        item.data?.qrCode || "",
        item.data?.qrImageUrl || "",
      ];
      csvRows.push(row.map((cell) => `"${cell}"`).join(","));
    }

    const csv = csvRows.join("\n");

    // Generate JSON
    const json = operation.items.map((item) => ({
      id: item.id,
      status: item.status,
      error: item.error,
      data: item.data,
    }));

    return { csv, json };
  }
}

export const qrBulkService = new QRBulkService();
