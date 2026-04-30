/**
 * Customer Approval Service
 * Multi-channel customer approval for MSDS-SKU links
 * Supports Email, WhatsApp, and Portal approvals
 */

import {
  CustomerApprovalRequest,
  CustomerApprovalResponse,
  ApprovalChannel,
  ApprovalLinkItem,
  NotificationSent,
} from "@/types/msdsSkuLinking";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { msdsSkuLinkingService } from "./msdsSkuLinkingService";
import { whatsappService } from "@/lib/services/whatsapp/whatsappService";

// ============================================================================
// IN-MEMORY STORAGE (Will be replaced with database)
// ============================================================================

class ApprovalStore {
  private requests: Map<string, CustomerApprovalRequest> = new Map();
  private tokens: Map<string, string> = new Map(); // token -> requestId

  get(id: string): CustomerApprovalRequest | undefined {
    return this.requests.get(id);
  }

  getByToken(token: string): CustomerApprovalRequest | undefined {
    const requestId = this.tokens.get(token);
    if (!requestId) return undefined;
    return this.requests.get(requestId);
  }

  set(request: CustomerApprovalRequest): void {
    this.requests.set(request.id, request);
    this.tokens.set(request.approvalToken, request.id);
  }

  delete(id: string): boolean {
    const request = this.requests.get(id);
    if (request) {
      this.tokens.delete(request.approvalToken);
    }
    return this.requests.delete(id);
  }

  getAll(): CustomerApprovalRequest[] {
    return Array.from(this.requests.values());
  }
}

const store = new ApprovalStore();

// ============================================================================
// CUSTOMER APPROVAL SERVICE
// ============================================================================

export class CustomerApprovalService {
  /**
   * Create approval request
   */
  async createApprovalRequest(
    linkIds: string[],
    customerId: string,
    options: {
      customerEmail?: string;
      customerPhone?: string;
      channels?: ApprovalChannel[];
      expiresInHours?: number;
      requestedBy?: string;
    } = {},
  ): Promise<CustomerApprovalRequest> {
    try {
      // Validate inputs
      if (!linkIds || linkIds.length === 0) {
        throw new Error("At least one link ID is required");
      }

      // Get link details
      const links: ApprovalLinkItem[] = [];
      for (const linkId of linkIds) {
        const link = await msdsSkuLinkingService.getLink(linkId);
        if (!link) {
          throw new Error(`Link ${linkId} not found`);
        }

        // TODO: Fetch MSDS and SKU details
        links.push({
          linkId: link.id,
          msdsId: link.msdsId,
          msdsName: "MSDS Name", // Would fetch from MSDS service
          skuId: link.skuId,
          skuCode: "SKU-001", // Would fetch from SKU service
          skuDescription: "SKU Description", // Would fetch from SKU service
          confidenceScore: link.confidenceScore,
          matchingStrategy: link.matchingStrategy,
          suggestedBy: "SYSTEM",
        });
      }

      // Generate approval token
      const approvalToken = this.generateApprovalToken();

      // Calculate expiration
      const expiresInHours = options.expiresInHours || 72;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Determine channels
      const channels: ApprovalChannel[] = options.channels || [];
      if (channels.length === 0) {
        // Default to email if available, otherwise portal
        if (options.customerEmail) {
          channels.push("EMAIL");
        } else {
          channels.push("PORTAL");
        }
      }

      // Create request
      const request: CustomerApprovalRequest = {
        id: `approval-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        linkId: linkIds[0], // Primary link ID
        customerId,
        customerEmail: options.customerEmail,
        customerPhone: options.customerPhone,
        requestType:
          linkIds.length > 1 ? "BULK_LINK_APPROVAL" : "SKU_LINK_APPROVAL",
        status: "PENDING",
        channels,
        approvalToken,
        approvalUrl: this.generateApprovalUrl(approvalToken),
        whatsappUrl: this.generateWhatsAppUrl(approvalToken),
        links,
        requestedAt: new Date().toISOString(),
        requestedBy: options.requestedBy,
        expiresAt: expiresAt.toISOString(),
        notificationsSent: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store request
      store.set(request);

      // Send notifications
      await this.sendApprovalNotifications(request);

      return request;
    } catch (error) {
      console.error("Error creating approval request:", error);
      throw error;
    }
  }

  /**
   * Get approval request by ID
   */
  async getApprovalRequest(
    id: string,
  ): Promise<CustomerApprovalRequest | null> {
    try {
      return store.get(id) || null;
    } catch (error) {
      console.error("Error getting approval request:", error);
      throw error;
    }
  }

  /**
   * Get approval request by token
   */
  async getApprovalRequestByToken(
    token: string,
  ): Promise<CustomerApprovalRequest | null> {
    try {
      return store.getByToken(token) || null;
    } catch (error) {
      console.error("Error getting approval request by token:", error);
      throw error;
    }
  }

  /**
   * Process approval response
   */
  async processApprovalResponse(response: CustomerApprovalResponse): Promise<{
    approved: number;
    rejected: number;
    errors: string[];
  }> {
    try {
      const request = await this.getApprovalRequestByToken(response.token);
      if (!request) {
        throw new Error("Invalid approval token");
      }

      // Check if expired
      if (new Date(request.expiresAt) < new Date()) {
        throw new Error("Approval request has expired");
      }

      // Check if already processed
      if (request.status !== "PENDING") {
        throw new Error(
          `Approval request already ${request.status.toLowerCase()}`,
        );
      }

      let approved = 0;
      let rejected = 0;
      const errors: string[] = [];

      // Process each link
      for (const linkResponse of response.links) {
        try {
          if (linkResponse.action === "APPROVE") {
            await msdsSkuLinkingService.approveLink(linkResponse.linkId, {
              approvedBy: response.approvedBy || "customer",
              approvalLevel: "CUSTOMER_USER",
              conditions: linkResponse.conditions,
              notes: linkResponse.notes,
            });
            approved++;
          } else if (linkResponse.action === "REJECT") {
            await msdsSkuLinkingService.rejectLink(linkResponse.linkId, {
              rejectedBy: response.approvedBy || "customer",
              rejectionReason: linkResponse.notes || "Rejected by customer",
            });
            rejected++;
          }
        } catch (error) {
          errors.push(
            `Failed to process link ${linkResponse.linkId}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      // Update request status
      const newStatus = response.action === "APPROVE" ? "APPROVED" : "REJECTED";
      const updatedRequest: CustomerApprovalRequest = {
        ...request,
        status: newStatus,
        approvedAt:
          response.action === "APPROVE" ? response.approvedAt : undefined,
        approvedBy:
          response.action === "APPROVE" ? response.approvedBy : undefined,
        rejectedAt:
          response.action === "REJECT" ? response.approvedAt : undefined,
        rejectedBy:
          response.action === "REJECT" ? response.approvedBy : undefined,
        rejectionReason:
          response.action === "REJECT" ? response.notes : undefined,
        updatedAt: new Date().toISOString(),
      };

      store.set(updatedRequest);

      return {
        approved,
        rejected,
        errors,
      };
    } catch (error) {
      console.error("Error processing approval response:", error);
      throw error;
    }
  }

  /**
   * Send approval notifications
   */
  private async sendApprovalNotifications(
    request: CustomerApprovalRequest,
  ): Promise<void> {
    const notifications: NotificationSent[] = [];

    for (const channel of request.channels) {
      try {
        let sent = false;
        let recipient = "";

        switch (channel) {
          case "EMAIL":
            if (request.customerEmail) {
              await notificationService.send({
                type: "msds_approved",
                channel: "email",
                recipient: request.customerEmail,
                title: "MSDS-SKU Link Approval Required",
                message: `Please review and approve MSDS-SKU links. Click here to approve: ${request.approvalUrl}`,
                data: {
                  requestId: request.id,
                  approvalUrl: request.approvalUrl,
                  links: request.links,
                },
              });
              sent = true;
              recipient = request.customerEmail;
            }
            break;

          case "WHATSAPP":
            if (request.customerPhone) {
              try {
                const whatsappResult = await whatsappService.sendApprovalLink(
                  request.customerPhone,
                  request.approvalUrl || request.whatsappUrl || "",
                  request.customerEmail ? undefined : "Customer",
                );
                sent = whatsappResult.success;
                recipient = request.customerPhone;
                if (!sent) {
                  console.warn("WhatsApp send failed:", whatsappResult.error);
                }
              } catch (whatsappError) {
                console.error("WhatsApp error:", whatsappError);
                sent = false;
                recipient = request.customerPhone;
              }
            }
            break;

          case "PORTAL":
            // Portal access is handled separately
            sent = true;
            recipient = "portal";
            break;
        }

        if (sent) {
          notifications.push({
            channel,
            sentAt: new Date().toISOString(),
            recipient,
            status: "SENT",
          });
        }
      } catch (error) {
        console.error(`Error sending ${channel} notification:`, error);
        notifications.push({
          channel,
          sentAt: new Date().toISOString(),
          recipient: "",
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update request with notification status
    const updatedRequest: CustomerApprovalRequest = {
      ...request,
      notificationsSent: notifications,
      updatedAt: new Date().toISOString(),
    };
    store.set(updatedRequest);
  }

  /**
   * Generate approval token
   */
  private generateApprovalToken(): string {
    return `token-${Date.now()}-${Math.random().toString(36).substring(2, 18)}`;
  }

  /**
   * Generate approval URL
   */
  private generateApprovalUrl(token: string): string {
    // In production, this would be the actual frontend URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/customer-portal/approve?token=${token}`;
  }

  /**
   * Generate WhatsApp URL
   */
  private generateWhatsAppUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const approvalUrl = `${baseUrl}/customer-portal/approve?token=${token}`;
    // WhatsApp URL format
    return `https://wa.me/?text=${encodeURIComponent(`Please approve MSDS-SKU links: ${approvalUrl}`)}`;
  }
}

export const customerApprovalService = new CustomerApprovalService();
