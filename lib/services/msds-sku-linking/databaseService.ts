/**
 * Database Service for MSDS-SKU Linking
 * Database integration layer (ready for implementation)
 */

import { MSDSSKULink, CustomerApprovalRequest } from "@/types/msdsSkuLinking";
import { getDatabaseClient } from "@/lib/database/client";

export class MSDSSKULinkingDatabaseService {
  private db: any;

  constructor() {
    // Initialize database client
    this.db = null; // Will be set when database is available
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      this.db = await getDatabaseClient();
      return true;
    } catch (error) {
      console.error("Error initializing database:", error);
      return false;
    }
  }

  /**
   * Create link in database
   */
  async createLink(link: MSDSSKULink): Promise<MSDSSKULink> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const query = `
        INSERT INTO msds_sku_links (
          id, msds_id, sku_id, customer_id, tenant_id,
          status, matching_strategy, confidence_score, matching_evidence,
          linked_by, linked_at, notes, created_at, updated_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        link.id,
        link.msdsId,
        link.skuId,
        link.customerId,
        link.tenantId || "default",
        link.status,
        link.matchingStrategy,
        link.confidenceScore,
        JSON.stringify(link.matchingEvidence),
        link.linkedBy,
        link.linkedAt,
        link.notes || null,
        link.createdAt,
        link.updatedAt,
        link.createdBy,
      ]);

      return this.mapRowToLink(result.rows[0]);
    } catch (error) {
      console.error("Error creating link in database:", error);
      throw error;
    }
  }

  /**
   * Get link by ID
   */
  async getLink(id: string): Promise<MSDSSKULink | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const query = "SELECT * FROM msds_sku_links WHERE id = $1";
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToLink(result.rows[0]);
    } catch (error) {
      console.error("Error getting link from database:", error);
      throw error;
    }
  }

  /**
   * Update link in database
   */
  async updateLink(
    id: string,
    updates: Partial<MSDSSKULink>,
  ): Promise<MSDSSKULink> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const setClause: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (key === "matchingEvidence" && value) {
          setClause.push(`matching_evidence = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else if (key !== "id" && value !== undefined) {
          const dbKey = this.camelToSnake(key);
          setClause.push(`${dbKey} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      });

      setClause.push(`updated_at = $${paramIndex}`);
      values.push(new Date().toISOString());
      paramIndex++;

      values.push(id);

      const query = `
        UPDATE msds_sku_links
        SET ${setClause.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Link ${id} not found`);
      }

      return this.mapRowToLink(result.rows[0]);
    } catch (error) {
      console.error("Error updating link in database:", error);
      throw error;
    }
  }

  /**
   * Delete link from database
   */
  async deleteLink(id: string): Promise<boolean> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const query = "DELETE FROM msds_sku_links WHERE id = $1";
      const result = await this.db.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting link from database:", error);
      throw error;
    }
  }

  /**
   * Search links
   */
  async searchLinks(
    filters: any,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{
    links: MSDSSKULink[];
    total: number;
  }> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const whereClause: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (filters.customerId) {
        whereClause.push(`customer_id = $${paramIndex}`);
        values.push(filters.customerId);
        paramIndex++;
      }

      if (filters.msdsId) {
        whereClause.push(`msds_id = $${paramIndex}`);
        values.push(filters.msdsId);
        paramIndex++;
      }

      if (filters.skuId) {
        whereClause.push(`sku_id = $${paramIndex}`);
        values.push(filters.skuId);
        paramIndex++;
      }

      if (filters.status && filters.status.length > 0) {
        whereClause.push(`status = ANY($${paramIndex})`);
        values.push(filters.status);
        paramIndex++;
      }

      const where =
        whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM msds_sku_links ${where}`;
      const countResult = await this.db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const offset = (page - 1) * pageSize;
      const query = `
        SELECT * FROM msds_sku_links
        ${where}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      values.push(pageSize, offset);

      const result = await this.db.query(query, values);

      return {
        links: result.rows.map((row: any) => this.mapRowToLink(row)),
        total,
      };
    } catch (error) {
      console.error("Error searching links in database:", error);
      throw error;
    }
  }

  /**
   * Create approval request in database
   */
  async createApprovalRequest(
    request: CustomerApprovalRequest,
  ): Promise<CustomerApprovalRequest> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const query = `
        INSERT INTO customer_approval_requests (
          id, link_id, customer_id, customer_email, customer_phone,
          request_type, status, channels, approval_token, approval_url, whatsapp_url,
          links, requested_at, requested_by, expires_at, notifications_sent,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        request.id,
        request.linkId,
        request.customerId,
        request.customerEmail || null,
        request.customerPhone || null,
        request.requestType,
        request.status,
        JSON.stringify(request.channels),
        request.approvalToken,
        request.approvalUrl || null,
        request.whatsappUrl || null,
        JSON.stringify(request.links),
        request.requestedAt,
        request.requestedBy || null,
        request.expiresAt,
        JSON.stringify(request.notificationsSent || []),
        request.createdAt,
        request.updatedAt,
      ]);

      return this.mapRowToApprovalRequest(result.rows[0]);
    } catch (error) {
      console.error("Error creating approval request in database:", error);
      throw error;
    }
  }

  /**
   * Get approval request by token
   */
  async getApprovalRequestByToken(
    token: string,
  ): Promise<CustomerApprovalRequest | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const query =
        "SELECT * FROM customer_approval_requests WHERE approval_token = $1";
      const result = await this.db.query(query, [token]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToApprovalRequest(result.rows[0]);
    } catch (error) {
      console.error("Error getting approval request from database:", error);
      throw error;
    }
  }

  /**
   * Map database row to MSDSSKULink
   */
  private mapRowToLink(row: any): MSDSSKULink {
    return {
      id: row.id,
      msdsId: row.msds_id,
      skuId: row.sku_id,
      customerId: row.customer_id,
      tenantId: row.tenant_id,
      status: row.status as any,
      approvalLevel: row.approval_level as any,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at,
      rejectionReason: row.rejection_reason,
      matchingStrategy: row.matching_strategy as any,
      confidenceScore: row.confidence_score,
      matchingEvidence: row.matching_evidence
        ? JSON.parse(row.matching_evidence)
        : undefined,
      linkedBy: row.linked_by,
      linkedAt: row.linked_at,
      lastVerifiedAt: row.last_verified_at,
      verifiedBy: row.verified_by,
      msdsVersion: row.msds_version,
      skuVersion: row.sku_version,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      notes: row.notes,
      complianceStatus: row.compliance_status as any,
      complianceNotes: row.compliance_notes,
      dataReused: row.data_reused ? JSON.parse(row.data_reused) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    };
  }

  /**
   * Map database row to CustomerApprovalRequest
   */
  private mapRowToApprovalRequest(row: any): CustomerApprovalRequest {
    return {
      id: row.id,
      linkId: row.link_id,
      customerId: row.customer_id,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      requestType: row.request_type as any,
      status: row.status as any,
      channels: JSON.parse(row.channels),
      approvalToken: row.approval_token,
      approvalUrl: row.approval_url,
      whatsappUrl: row.whatsapp_url,
      links: JSON.parse(row.links),
      requestedAt: row.requested_at,
      requestedBy: row.requested_by,
      expiresAt: row.expires_at,
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      rejectedAt: row.rejected_at,
      rejectedBy: row.rejected_by,
      rejectionReason: row.rejection_reason,
      notificationsSent: row.notifications_sent
        ? JSON.parse(row.notifications_sent)
        : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

export const databaseService = new MSDSSKULinkingDatabaseService();
