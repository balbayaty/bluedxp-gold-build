/**
 * Workflow Service - Signing Workflow Management
 * Handles sequential, parallel, and custom signing workflows
 * Manages signature requests, reminders, and completion
 */

import {
  SignatureWorkflow,
  SignatureRequest,
  CreateWorkflowRequest,
  IWorkflowService,
  WorkflowType,
  WorkflowStatus,
  SignatureRequestStatus,
} from "@/types/digital-signature";
import { documentService } from "./documentService";
import { signatureService } from "./signatureService";
import { eventBus } from "@/lib/services/event-store";
import { auditService } from "@/lib/services/audit/auditService";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

// In-memory storage (will be replaced with database)
const workflowStore = new Map<string, SignatureWorkflow>();
const requestStore = new Map<string, SignatureRequest>();

class WorkflowService implements IWorkflowService {
  /**
   * Create Workflow
   */
  async createWorkflow(
    options: CreateWorkflowRequest,
    userId?: string,
  ): Promise<SignatureWorkflow> {
    try {
      // Verify document exists
      const document = documentService.getDocument(options.documentId);
      if (!document) {
        throw new Error(`Document not found: ${options.documentId}`);
      }

      // Create workflow
      const workflow: SignatureWorkflow = {
        id: uuidv4(),
        organizationId: document.organizationId,
        documentId: options.documentId,
        workflowName: options.workflowName,
        workflowType: options.workflowType,
        status: "draft",
        initiatedByUserId: userId || "system",
        totalSigners: options.signers.length,
        completedSigners: 0,
        expiryDate: options.expiryDate,
        reminderFrequencyHours: options.reminderFrequencyHours || 24,
        messageToSigners: options.messageToSigners,
        messageToSignersAr: options.messageToSignersAr,
        createdAt: new Date(),
      };

      workflowStore.set(workflow.id, workflow);

      // Create signature requests
      for (const signer of options.signers) {
        const request: SignatureRequest = {
          id: uuidv4(),
          workflowId: workflow.id,
          signerUserId: signer.userId,
          signerEmail: signer.email,
          signerPhone: signer.phone,
          signerName: signer.name,
          signerNameAr: signer.nameAr,
          signerNationalId: signer.nationalId,
          signerType: signer.signerType,
          signingOrder: signer.signingOrder,
          roleInDocument: signer.roleInDocument,
          signatureTypeRequired: signer.signatureTypeRequired || "any",
          authenticationMethod: signer.authenticationMethod || "email",
          status: "pending",
          signatureFields: signer.signatureFields || [],
          createdAt: new Date(),
        };

        // Generate access token for public signing
        request.accessToken = crypto.randomBytes(32).toString("hex");
        request.accessTokenExpiresAt = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ); // 30 days

        requestStore.set(request.id, request);
      }

      // Prepare document for signing
      const allFields = options.signers.flatMap((s) => s.signatureFields || []);
      await documentService.prepareForSigning(options.documentId, allFields);

      // Log audit event
      await auditService.log({
        actionType: "workflow.created",
        actionCategory: "workflow",
        actionDescription: `Workflow created: ${options.workflowName}`,
        entityType: "signature_workflow",
        entityId: workflow.id,
        newState: {
          workflowName: options.workflowName,
          workflowType: options.workflowType,
          totalSigners: options.signers.length,
        },
        severity: "info",
      });

      // Publish event
      await eventBus.publish({
        type: "digital-signature.workflow.created",
        payload: {
          workflowId: workflow.id,
          documentId: options.documentId,
          workflowType: options.workflowType,
        },
        timestamp: new Date(),
        source: "workflow-service",
      });

      console.log("✅ Workflow created:", workflow.id);
      return workflow;
    } catch (error) {
      console.error("❌ Error creating workflow:", error);
      throw new Error(
        `Failed to create workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Send for Signing
   */
  async sendForSigning(workflowId: string): Promise<void> {
    try {
      const workflow = workflowStore.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Update workflow status
      workflow.status = "active";

      // Get all requests for this workflow
      const requests = Array.from(requestStore.values()).filter(
        (req) => req.workflowId === workflowId,
      );

      // Send notifications via notification service
      for (const request of requests) {
        request.status = "sent";
        requestStore.set(request.id, request);

        // Send notification via notification service
        try {
          const { notificationService } =
            await import("@/lib/services/notifications/notificationService");

          await notificationService.send({
            type: "info" as any,
            title: "Document Signature Request",
            message: `You have been requested to sign: ${workflow.workflowName}`,
            priority: "high",
            channel: request.signerEmail
              ? ["email", "in-app"]
              : ["sms", "in-app"],
            recipient: request.signerEmail || request.signerPhone,
            userId: request.signerUserId,
            data: {
              workflowId: workflow.id,
              requestId: request.id,
              documentId: workflow.documentId,
              signingOrder: request.signingOrder,
              signingUrl: `/digital-signature/sign/${request.id}`,
            },
          });

          console.log(
            `✅ Notification sent to ${request.signerEmail || request.signerPhone}`,
          );
        } catch (notifError) {
          console.warn(
            `⚠️ Notification failed for ${request.signerEmail || request.signerPhone}:`,
            notifError,
          );
          // Continue even if notification fails
        }
      }

      workflowStore.set(workflowId, workflow);

      // Log audit event
      await auditService.log({
        actionType: "workflow.sent",
        actionCategory: "workflow",
        actionDescription: `Workflow sent for signing: ${workflow.workflowName}`,
        entityType: "signature_workflow",
        entityId: workflowId,
        newState: { status: "active" },
        severity: "info",
      });

      // Publish event
      await eventBus.publish({
        type: "digital-signature.workflow.sent",
        payload: { workflowId, totalSigners: requests.length },
        timestamp: new Date(),
        source: "workflow-service",
      });

      console.log("✅ Workflow sent for signing:", workflowId);
    } catch (error) {
      console.error("❌ Error sending workflow:", error);
      throw new Error(
        `Failed to send workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process Signing Order
   */
  async processSigningOrder(workflowId: string): Promise<void> {
    try {
      const workflow = workflowStore.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Get all requests sorted by signing order
      const requests = Array.from(requestStore.values())
        .filter((req) => req.workflowId === workflowId)
        .sort((a, b) => a.signingOrder - b.signingOrder);

      if (workflow.workflowType === "sequential") {
        // Check if previous signer has signed
        for (let i = 0; i < requests.length; i++) {
          const request = requests[i];

          if (i > 0 && requests[i - 1].status !== "signed") {
            // Previous signer hasn't signed yet
            break;
          }

          if (request.status === "pending" || request.status === "sent") {
            // This signer can now sign - send notification
            try {
              const { notificationService } =
                await import("@/lib/services/notifications/notificationService");

              await notificationService.send({
                type: "info" as any,
                title: "Your Turn to Sign",
                message: `It's your turn to sign: ${workflow.workflowName}`,
                priority: "high",
                channel: request.signerEmail
                  ? ["email", "in-app"]
                  : ["sms", "in-app"],
                recipient: request.signerEmail || request.signerPhone,
                userId: request.signerUserId,
                data: {
                  workflowId: workflow.id,
                  requestId: request.id,
                  signingOrder: request.signingOrder,
                  signingUrl: `/digital-signature/sign/${request.id}`,
                },
              });

              console.log(
                `✅ Notification sent to signer ${request.signerName} (order ${request.signingOrder})`,
              );
            } catch (notifError) {
              console.warn(
                `⚠️ Notification failed for signer ${request.signerName}:`,
                notifError,
              );
            }
          }
        }
      } else if (workflow.workflowType === "parallel") {
        // All signers can sign simultaneously
        // Already handled in sendForSigning
      }

      // Check if workflow is complete
      const completedCount = requests.filter(
        (req) => req.status === "signed",
      ).length;
      workflow.completedSigners = completedCount;

      if (completedCount === workflow.totalSigners) {
        workflow.status = "completed";
        workflow.completedAt = new Date();

        // Update document status
        await documentService.updateDocumentStatus(
          workflow.documentId,
          "completed",
        );

        // Publish event
        await eventBus.publish({
          type: "digital-signature.workflow.completed",
          payload: { workflowId, documentId: workflow.documentId },
          timestamp: new Date(),
          source: "workflow-service",
        });
      } else if (completedCount > 0) {
        workflow.status = "partially_signed";
      }

      workflowStore.set(workflowId, workflow);

      console.log("✅ Signing order processed:", workflowId);
    } catch (error) {
      console.error("❌ Error processing signing order:", error);
      throw new Error(
        `Failed to process signing order: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Send Reminders
   */
  async sendReminders(workflowId: string): Promise<void> {
    try {
      const workflow = workflowStore.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Get pending requests
      const pendingRequests = Array.from(requestStore.values()).filter(
        (req) =>
          req.workflowId === workflowId &&
          (req.status === "pending" ||
            req.status === "sent" ||
            req.status === "viewed"),
      );

      // Send reminders
      for (const request of pendingRequests) {
        // Send notification via notification service
        const channels: Array<"email" | "sms"> = [];
        const recipient: string[] = [];

        if (request.signerEmail) {
          channels.push("email");
          recipient.push(request.signerEmail);
        }
        if (request.signerPhone) {
          channels.push("sms");
          recipient.push(request.signerPhone);
        }

        if (channels.length > 0) {
          await notificationService.send({
            id: uuidv4(),
            type: "system_alert",
            priority: "high",
            channel: channels,
            title: "Signature Reminder",
            message:
              workflow.messageToSigners ||
              `Please sign the document: ${workflow.workflowName}`,
            recipient,
            tenantId: workflow.organizationId,
            data: {
              workflowId: workflow.id,
              requestId: request.id,
              documentId: workflow.documentId,
            },
          });
        }
      }

      console.log(
        `✅ Reminders sent for ${pendingRequests.length} pending signatures`,
      );
    } catch (error) {
      console.error("❌ Error sending reminders:", error);
      throw new Error(
        `Failed to send reminders: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get Workflow by ID
   */
  getWorkflow(workflowId: string): SignatureWorkflow | undefined {
    return workflowStore.get(workflowId);
  }

  /**
   * Get Request by ID
   */
  getRequest(requestId: string): SignatureRequest | undefined {
    return requestStore.get(requestId);
  }

  /**
   * Get Request by Access Token
   */
  getRequestByToken(accessToken: string): SignatureRequest | undefined {
    return Array.from(requestStore.values()).find(
      (req) =>
        req.accessToken === accessToken &&
        req.accessTokenExpiresAt &&
        req.accessTokenExpiresAt > new Date(),
    );
  }

  /**
   * Get Pending Requests for User
   */
  getPendingRequests(userId: string): SignatureRequest[] {
    return Array.from(requestStore.values()).filter(
      (req) =>
        req.signerUserId === userId &&
        (req.status === "pending" ||
          req.status === "sent" ||
          req.status === "viewed"),
    );
  }

  /**
   * Mark Request as Viewed
   */
  async markRequestAsViewed(requestId: string): Promise<void> {
    const request = requestStore.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.status === "pending" || request.status === "sent") {
      request.status = "viewed";
      requestStore.set(requestId, request);
    }
  }

  /**
   * Complete Request (after signing)
   */
  async completeRequest(requestId: string, signatureId: string): Promise<void> {
    const request = requestStore.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    request.status = "signed";
    request.signedAt = new Date();
    requestStore.set(requestId, request);

    // Process signing order
    await this.processSigningOrder(request.workflowId);
  }
}

export const workflowService = new WorkflowService();
