/**
 * Enhanced MSDS Management Service
 * Comprehensive MSDS operations with versioning, comparison, and compliance
 */

import {
  MSDSDocument,
  MSDSStatus,
  MSDSWorkflowStatus,
  ExtractedMSDSData,
  MSDSVersion,
} from "@/types/chemical";
import { aiService } from "../ai/chemcheckService";
import { TenantKnowledgeBase } from "../knowledge-base/tenantKnowledgeBase";
import { msdsStorageService } from "./msdsStorage";
import { msdsDomainService } from "./msdsDomainService";
import { msdsExtractionRegistry } from "./extraction/msdsExtractionRegistry";
import { prisma } from "@/lib/services/database/prismaClient";
import { sdsParserService } from "../ml/sds-parser";

export class MSDSService {
  private knowledgeBases: Map<string, TenantKnowledgeBase> = new Map();
  // Cache for frequently accessed MSDS documents (TTL: 5 minutes)
  private cache: Map<string, { data: MSDSDocument; expiresAt: number }> =
    new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clean up expired cache entries every 10 minutes
    setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  private getCached(id: string): MSDSDocument | null {
    const cached = this.cache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(id);
    }
    return null;
  }

  private setCache(id: string, data: MSDSDocument) {
    this.cache.set(id, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }

  private invalidateCache(id?: string) {
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
    }
  }

  private getKnowledgeBase(tenantId: string): TenantKnowledgeBase {
    if (!this.knowledgeBases.has(tenantId)) {
      this.knowledgeBases.set(tenantId, new TenantKnowledgeBase(tenantId));
    }
    return this.knowledgeBases.get(tenantId)!;
  }

  /**
   * Get all MSDS documents
   */
  async getMSDSDocuments(filters?: {
    status?: MSDSStatus;
    chemicalId?: string;
    manufacturer?: string;
    dateRange?: { from: string; to: string };
    tenantId?: string;
  }): Promise<MSDSDocument[]> {
    try {
      // Build Prisma query with filters
      const where: any = {};

      if (filters?.tenantId) {
        where.tenantId = filters.tenantId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.chemicalId) {
        where.chemicalId = filters.chemicalId;
      }

      if (filters?.manufacturer) {
        where.manufacturer = {
          contains: filters.manufacturer,
          mode: "insensitive",
        };
      }

      if (filters?.dateRange) {
        where.createdAt = {
          gte: new Date(filters.dateRange.from),
          lte: new Date(filters.dateRange.to),
        };
      }

      // Query database
      const msdsRecords = await prisma.mSDS.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      // Convert Prisma records to MSDSDocument format
      return msdsRecords.map((record: any) => ({
        id: record.id,
        chemicalName: record.productName,
        manufacturer: record.manufacturer || undefined,
        version: record.version,
        revisionDate: record.revisionDate?.toISOString(),
        supplier: record.supplier || undefined,
        fileUrl: record.fileUrl || undefined,
        fileType: record.fileType || undefined,
        fileSize: record.fileSize || undefined,
        extractedData: (record.extractedData as ExtractedMSDSData) || undefined,
        status: record.status as MSDSStatus,
        workflowStatus: record.workflowStatus as MSDSWorkflowStatus | undefined,
        qrCode: record.qrCode || undefined,
        qrCodeUrl: record.qrCodeUrl || undefined,
        metadata: (record.metadata as any) || {},
      }));
    } catch (error) {
      console.error("Error getting MSDS documents:", error);
      // Fallback to storage service if database fails
      try {
        const storageEntries = await msdsStorageService.getMSDS(
          "",
          filters?.tenantId,
        );
        return storageEntries ? [storageEntries.msds] : [];
      } catch (fallbackError) {
        console.error(
          "Fallback to storage service also failed:",
          fallbackError,
        );
        return [];
      }
    }
  }

  /**
   * Get MSDS by ID
   * Uses caching for improved performance
   */
  async getMSDSById(
    id: string,
    tenantId?: string,
  ): Promise<MSDSDocument | null> {
    // Check cache first
    const cacheKey = tenantId ? `${id}:${tenantId}` : id;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Build Prisma query
      const where: any = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Query database
      const msdsRecord = await prisma.mSDS.findUnique({
        where,
      });

      if (!msdsRecord) {
        // Fallback to storage service
        const storageEntry = await msdsStorageService.getMSDS(id, tenantId);
        if (storageEntry?.msds) {
          this.setCache(cacheKey, storageEntry.msds);
          return storageEntry.msds;
        }
        return null;
      }

      // Convert Prisma record to MSDSDocument format
      const msds: MSDSDocument = {
        id: msdsRecord.id,
        chemicalName: msdsRecord.productName,
        manufacturer: msdsRecord.manufacturer || undefined,
        version: msdsRecord.version,
        revisionDate: msdsRecord.revisionDate?.toISOString(),
        supplier: msdsRecord.supplier || undefined,
        fileUrl: msdsRecord.fileUrl || undefined,
        fileType: msdsRecord.fileType || undefined,
        fileSize: msdsRecord.fileSize || undefined,
        extractedData:
          (msdsRecord.extractedData as ExtractedMSDSData) || undefined,
        status: msdsRecord.status as MSDSStatus,
        workflowStatus:
          (msdsRecord.workflowStatus as MSDSWorkflowStatus) ||
          "pending_analysis",
        qrCode: msdsRecord.qrCode || undefined,
        qrCodeUrl: msdsRecord.qrCodeUrl || undefined,
        metadata: (msdsRecord.metadata as any) || {},
      };

      // Cache the result
      this.setCache(cacheKey, msds);
      return msds;
    } catch (error) {
      console.error("Error getting MSDS:", error);
      // Fallback to storage service
      try {
        const storageEntry = await msdsStorageService.getMSDS(id, tenantId);
        if (storageEntry?.msds) {
          this.setCache(cacheKey, storageEntry.msds);
          return storageEntry.msds;
        }
        return null;
      } catch (fallbackError) {
        console.error(
          "Fallback to storage service also failed:",
          fallbackError,
        );
        return null;
      }
    }
  }

  /**
   * Upload and process MSDS
   */
  async uploadMSDS(
    file: File,
    metadata?: {
      chemicalId?: string;
      customerId?: string;
      customerEmail?: string;
      tenantId?: string;
    },
  ): Promise<MSDSDocument> {
    try {
      const tenantId = metadata?.tenantId;
      if (!tenantId || tenantId.trim().length === 0) {
        throw new Error(
          "tenantId is required for MSDS upload (multi-tenant day 1)",
        );
      }

      // Read file content
      const text = await this.readFileContent(file);

      // Parse + extract via swappable adapter
      const adapter = msdsExtractionRegistry.getForTenant(tenantId);
      const extraction = await adapter.extractFromText(text, { tenantId });
      const parsedData = extraction.parsed as any;

      // Create MSDS document
      const msds: MSDSDocument = {
        id: `msds-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        chemicalName: extraction.extractedData.productName,
        manufacturer: extraction.extractedData.manufacturer,
        version: "1.0",
        language: "en",
        fileType: file.type.includes("pdf")
          ? "pdf"
          : file.type.includes("excel")
            ? "excel"
            : "csv",
        extractedData: extraction.extractedData,
        status: "analyzing",
        workflowStatus: "pending_analysis",
        metadata: {
          submittedDate: new Date().toISOString(),
          source: "upload",
        },
      };

      // Store MSDS for cross-module access (warehouse, transportation, compliance)
      await msdsDomainService.storeExtractedMSDS({
        tenantId,
        actor: { userId: metadata?.customerId || "system" },
        msds,
        extractedData: extraction.extractedData,
        source: "upload",
      });

      // Save to database (persistent storage) via Prisma
      try {
        await prisma.mSDS.upsert({
          where: { id: msds.id },
          create: {
            id: msds.id,
            tenantId: tenantId,
            chemicalId: metadata?.chemicalId,
            productName: extraction.extractedData.productName || "Unknown",
            casNumber: extraction.extractedData.casNumber,
            version: msds.version || "1.0",
            revisionDate: msds.revisionDate
              ? new Date(msds.revisionDate)
              : null,
            supplier:
              (extraction.extractedData as any).supplier ||
              extraction.extractedData.manufacturer,
            manufacturer: extraction.extractedData.manufacturer,
            fileUrl: msds.fileUrl,
            fileType: msds.fileType,
            fileSize: (msds as any).fileSize,
            extractedData: extraction.extractedData as any,
            status: msds.status || "pending",
            workflowStatus: msds.workflowStatus || "pending_analysis",
            qrCode: (msds as any).qrCode,
            qrCodeUrl: (msds as any).qrCodeUrl,
            metadata: {
              uploadedAt: new Date().toISOString(),
              uploadedBy: metadata?.customerId || "system",
              version: 1,
              source: "upload",
            } as any,
            createdBy: metadata?.customerId || "system",
          },
          update: {
            productName: extraction.extractedData.productName || "Unknown",
            extractedData: extraction.extractedData as any,
            status: msds.status || "pending",
            workflowStatus: msds.workflowStatus || "pending_analysis",
            updatedAt: new Date(),
          },
        });
        console.log(`✅ MSDS ${msds.id} saved to database`);
      } catch (dbError) {
        console.error(
          "⚠️ Failed to save MSDS to database, using storage service fallback:",
          dbError,
        );
        // Continue - storage service will handle it
      }

      // Learn from MSDS and add to knowledge base
      try {
        await this.getKnowledgeBase(tenantId).learnFromMSDS({
          chemicalName: msds.chemicalName,
          casNumber: parsedData.casNumber,
          hazards: parsedData.hazardStatements || [],
          storageRequirements: parsedData.storageRequirements || [],
          ppeRequired: parsedData.personalProtectiveEquipment || [],
          compatibilityInfo:
            parsedData.stabilityReactivity?.incompatibleMaterials || [],
          sourceDocumentId: msds.id,
        });
      } catch (kbError) {
        console.warn("Knowledge base learning failed (non-critical):", kbError);
      }

      return msds;
    } catch (error) {
      console.error("Error uploading MSDS:", error);
      throw error;
    }
  }

  /**
   * Extract data from MSDS using AI
   */
  async extractMSDSData(text: string): Promise<ExtractedMSDSData> {
    try {
      const parsedData = await sdsParserService.parseSDS(text);
      return this.mapParsedDataToExtracted(parsedData);
    } catch (error) {
      console.error("Error extracting MSDS data:", error);
      throw error;
    }
  }

  /**
   * Compare two MSDS documents
   */
  async compareMSDS(
    msds1Id: string,
    msds2Id: string,
  ): Promise<{
    differences: string[];
    similarities: string[];
    recommendations: string[];
    fieldComparisons: Array<{
      field: string;
      value1: any;
      value2: any;
      changed: boolean;
    }>;
  }> {
    try {
      const msds1 = await this.getMSDSById(msds1Id);
      const msds2 = await this.getMSDSById(msds2Id);

      if (!msds1 || !msds2) {
        throw new Error("MSDS documents not found");
      }

      const data1 = msds1.extractedData || {};
      const data2 = msds2.extractedData || {};

      // Field-by-field comparison
      const fieldComparisons: Array<{
        field: string;
        value1: any;
        value2: any;
        changed: boolean;
      }> = [];
      const differences: string[] = [];
      const similarities: string[] = [];

      // Compare all fields
      const allFields = new Set([...Object.keys(data1), ...Object.keys(data2)]);
      for (const field of allFields) {
        const val1 = data1[field as keyof typeof data1];
        const val2 = data2[field as keyof typeof data2];
        const changed = JSON.stringify(val1) !== JSON.stringify(val2);

        fieldComparisons.push({ field, value1: val1, value2: val2, changed });

        if (changed) {
          differences.push(`${field}: "${val1}" → "${val2}"`);
        } else if (val1 !== undefined && val1 !== null && val1 !== "") {
          similarities.push(`${field}: "${val1}"`);
        }
      }

      // Use AI for intelligent recommendations
      try {
        const aiPrompt = `Compare these two MSDS documents and provide recommendations:
        MSDS 1: ${JSON.stringify(data1, null, 2)}
        MSDS 2: ${JSON.stringify(data2, null, 2)}
        
        Key differences found: ${differences.slice(0, 10).join(", ")}
        
        Provide 3-5 recommendations for handling these differences. Format as JSON array of strings.`;

        const aiResponse = await aiService.analyzeDocument(aiPrompt, {
          temperature: 0.3,
          response_format: { type: "json_object" },
        });

        let recommendations: string[] = [];
        try {
          const parsed =
            typeof aiResponse.analysis === "string"
              ? JSON.parse(aiResponse.analysis)
              : aiResponse.analysis;
          if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
            recommendations = parsed.recommendations;
          } else if (Array.isArray(parsed)) {
            recommendations = parsed;
          }
        } catch (e) {
          // Fallback recommendations
          recommendations = [
            "Review all differences carefully",
            "Verify regulatory compliance for both versions",
            "Update storage and handling procedures if needed",
            "Notify relevant personnel of changes",
          ];
        }

        return { differences, similarities, recommendations, fieldComparisons };
      } catch (aiError) {
        console.warn("AI comparison failed, using basic comparison:", aiError);
        return {
          differences,
          similarities,
          recommendations: [
            "Review all differences carefully",
            "Verify regulatory compliance",
            "Update procedures if needed",
          ],
          fieldComparisons,
        };
      }
    } catch (error) {
      console.error("Error comparing MSDS:", error);
      throw error;
    }
  }

  /**
   * Batch upload and process multiple MSDS files
   */
  async batchUploadMSDS(
    files: File[],
    metadata?: {
      customerId?: string;
      customerEmail?: string;
    },
  ): Promise<{
    successful: MSDSDocument[];
    failed: Array<{ file: File; error: string }>;
    total: number;
  }> {
    const successful: MSDSDocument[] = [];
    const failed: Array<{ file: File; error: string }> = [];

    for (const file of files) {
      try {
        const msds = await this.uploadMSDS(file, metadata);
        successful.push(msds);
      } catch (error) {
        failed.push({
          file,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      successful,
      failed,
      total: files.length,
    };
  }

  /**
   * Get version history for MSDS
   */
  async getVersionHistory(chemicalId: string): Promise<MSDSVersion[]> {
    try {
      // Get all MSDS documents for this chemical
      const allMSDS = await this.getMSDSDocuments({ chemicalId });

      // Sort by version and date
      const versions: MSDSVersion[] = allMSDS
        .map((msds) => ({
          version: msds.version,
          date: msds.metadata.submittedDate,
          changes: `MSDS for ${msds.chemicalName}`,
          changedBy: msds.metadata.submittedBy || "System",
        }))
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

      return versions;
    } catch (error) {
      console.error("Error getting version history:", error);
      throw error;
    }
  }

  /**
   * Check MSDS compliance
   */
  async checkCompliance(msdsId: string): Promise<{
    compliant: boolean;
    issues: string[];
    score: number;
    recommendations: string[];
  }> {
    try {
      const msds = await this.getMSDSById(msdsId);
      if (!msds) {
        throw new Error("MSDS not found");
      }

      const issues: string[] = [];
      let score = 100;

      // Check GHS compliance
      if (!msds.extractedData?.ghsCompliant) {
        issues.push("GHS compliance not verified");
        score -= 20;
      }

      // Check required fields
      const requiredFields = [
        "productName",
        "manufacturer",
        "hazardStatements",
        "precautionaryStatements",
      ];
      for (const field of requiredFields) {
        if (!msds.extractedData?.[field as keyof ExtractedMSDSData]) {
          issues.push(`Missing required field: ${field}`);
          score -= 10;
        }
      }

      // Use AI for advanced compliance checking (optional - not blocking)
      try {
        await aiService.analyzeDocument(
          `Check MSDS compliance: ${JSON.stringify(msds.extractedData)}`,
          { temperature: 0.3 },
        );
      } catch (aiError) {
        // Non-blocking - AI analysis is optional
        console.warn("AI compliance check failed (non-critical):", aiError);
      }

      return {
        compliant: score >= 70,
        issues,
        score,
        recommendations: [],
      };
    } catch (error) {
      console.error("Error checking compliance:", error);
      throw error;
    }
  }

  /**
   * Approve MSDS
   */
  async approveMSDS(
    msdsId: string,
    approverId: string,
    comments?: string,
  ): Promise<boolean> {
    try {
      const msds = await this.getMSDSById(msdsId);
      if (!msds) {
        throw new Error("MSDS not found");
      }

      const approvalDate = new Date().toISOString();

      // Get approver name from user service
      let approverName = approverId;
      try {
        const { userService } = await import("@/lib/services/user");
        const user = await userService.getUserById(approverId, tenantId);
        if (user) {
          approverName = user.name;
        }
      } catch (error) {
        console.log("[MSDS Service] Could not fetch user name, using ID");
      }

      const approval = {
        approverId,
        approverName,
        approvalDate,
        approvalLevel: 1,
        comments,
      };

      // Update metadata with approval info
      const updatedMetadata = {
        ...msds.metadata,
        approvedAt: approvalDate,
        approvedBy: approverId,
        approval: approval,
      };

      // Save to database
      await prisma.mSDS.update({
        where: { id: msdsId },
        data: {
          status: "approved",
          workflowStatus: "approved",
          metadata: updatedMetadata as any,
          updatedAt: new Date(),
        },
      });

      // Update in-memory object for consistency
      msds.status = "approved";
      msds.workflowStatus = "approved";
      msds.approval = approval;
      msds.metadata = updatedMetadata;

      // Invalidate cache
      this.invalidateCache(msdsId);

      return true;
    } catch (error) {
      console.error("Error approving MSDS:", error);
      throw error;
    }
  }

  /**
   * Reject MSDS
   */
  async rejectMSDS(
    msdsId: string,
    reviewerId: string,
    reason: string,
  ): Promise<boolean> {
    try {
      const msds = await this.getMSDSById(msdsId);
      if (!msds) {
        throw new Error("MSDS not found");
      }

      const reviewDate = new Date().toISOString();

      // Get reviewer name from user service
      let reviewerName = reviewerId;
      try {
        const { userService } = await import("@/lib/services/user");
        const user = await userService.getUserById(reviewerId);
        if (user) {
          reviewerName = user.name;
        }
      } catch (error) {
        console.log("[MSDS Service] Could not fetch user name, using ID");
      }

      const review = {
        reviewerId,
        reviewerName,
        reviewDate,
        notes: reason,
      };

      // Update metadata with review info
      const updatedMetadata = {
        ...msds.metadata,
        reviewedAt: reviewDate,
        reviewedBy: reviewerId,
        review: review,
        rejectionReason: reason,
      };

      // Save to database
      await prisma.mSDS.update({
        where: { id: msdsId },
        data: {
          status: "rejected",
          workflowStatus: "rejected",
          metadata: updatedMetadata as any,
          updatedAt: new Date(),
        },
      });

      // Update in-memory object for consistency
      msds.status = "rejected";
      msds.workflowStatus = "rejected";
      msds.review = review;
      msds.metadata = updatedMetadata;

      // Invalidate cache
      this.invalidateCache(msdsId);

      return true;
    } catch (error) {
      console.error("Error rejecting MSDS:", error);
      throw error;
    }
  }

  /**
   * Bulk approve multiple MSDS documents
   * Optimized with batch database updates for better performance
   */
  async bulkApproveMSDS(
    msdsIds: string[],
    approverId: string,
    comments?: string,
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    if (msdsIds.length === 0) {
      return { successful: [], failed: [] };
    }

    const approvalDate = new Date().toISOString();
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    // First, validate all MSDS exist and can be approved
    const msdsDocs = await Promise.allSettled(
      msdsIds.map((id) => this.getMSDSById(id)),
    );

    const validIds: string[] = [];
    msdsDocs.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        validIds.push(msdsIds[index]);
      } else {
        failed.push({
          id: msdsIds[index],
          error:
            result.status === "rejected"
              ? result.reason?.message || "Failed to fetch MSDS"
              : "MSDS not found",
        });
      }
    });

    if (validIds.length === 0) {
      return { successful, failed };
    }

    // Batch update all valid MSDS documents
    try {
      await prisma.mSDS.updateMany({
        where: {
          id: { in: validIds },
        },
        data: {
          status: "approved",
          workflowStatus: "approved",
          updatedAt: new Date(),
        },
      });

      // Update metadata for each document individually (since it's JSON)
      await Promise.allSettled(
        validIds.map(async (id) => {
          try {
            const msds = await this.getMSDSById(id);
            if (msds) {
              const updatedMetadata = {
                ...msds.metadata,
                approvedAt: approvalDate,
                approvedBy: approverId,
                approval: {
                  approverId,
                  approverName: approverId,
                  approvalDate,
                  approvalLevel: 1,
                  comments,
                },
              };

              await prisma.mSDS.update({
                where: { id },
                data: {
                  metadata: updatedMetadata as any,
                },
              });

              successful.push(id);
            }
          } catch (error) {
            failed.push({
              id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }),
      );
    } catch (error) {
      // If batch update fails, fall back to individual updates
      console.warn(
        "Batch update failed, falling back to individual updates:",
        error,
      );
      for (const id of validIds) {
        try {
          await this.approveMSDS(id, approverId, comments);
          successful.push(id);
        } catch (err) {
          failed.push({
            id,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    return { successful, failed };
  }

  /**
   * Bulk reject multiple MSDS documents
   * Optimized with batch database updates for better performance
   */
  async bulkRejectMSDS(
    msdsIds: string[],
    reviewerId: string,
    reason: string,
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    if (msdsIds.length === 0) {
      return { successful: [], failed: [] };
    }

    const reviewDate = new Date().toISOString();
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    // First, validate all MSDS exist and can be rejected
    const msdsDocs = await Promise.allSettled(
      msdsIds.map((id) => this.getMSDSById(id)),
    );

    const validIds: string[] = [];
    msdsDocs.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        validIds.push(msdsIds[index]);
      } else {
        failed.push({
          id: msdsIds[index],
          error:
            result.status === "rejected"
              ? result.reason?.message || "Failed to fetch MSDS"
              : "MSDS not found",
        });
      }
    });

    if (validIds.length === 0) {
      return { successful, failed };
    }

    // Batch update all valid MSDS documents
    try {
      await prisma.mSDS.updateMany({
        where: {
          id: { in: validIds },
        },
        data: {
          status: "rejected",
          workflowStatus: "rejected",
          updatedAt: new Date(),
        },
      });

      // Update metadata for each document individually (since it's JSON)
      await Promise.allSettled(
        validIds.map(async (id) => {
          try {
            const msds = await this.getMSDSById(id);
            if (msds) {
              const updatedMetadata = {
                ...msds.metadata,
                reviewedAt: reviewDate,
                reviewedBy: reviewerId,
                review: {
                  reviewerId,
                  reviewerName: reviewerId,
                  reviewDate,
                  notes: reason,
                },
                rejectionReason: reason,
              };

              await prisma.mSDS.update({
                where: { id },
                data: {
                  metadata: updatedMetadata as any,
                },
              });

              successful.push(id);
            }
          } catch (error) {
            failed.push({
              id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }),
      );
    } catch (error) {
      // If batch update fails, fall back to individual updates
      console.warn(
        "Batch update failed, falling back to individual updates:",
        error,
      );
      for (const id of validIds) {
        try {
          await this.rejectMSDS(id, reviewerId, reason);
          successful.push(id);
        } catch (err) {
          failed.push({
            id,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    return { successful, failed };
  }

  /**
   * Helper: Read file content
   * Works in both browser and Node.js environments
   */
  private async readFileContent(file: File): Promise<string> {
    // Check if we're in a browser environment
    if (typeof window !== "undefined" && typeof FileReader !== "undefined") {
      // Browser environment - use FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    } else {
      // Node.js/server environment - use Buffer/ArrayBuffer
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Try to detect file type and read accordingly
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          return buffer.toString("utf-8");
        } else if (
          file.type.includes("excel") ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        ) {
          // For Excel files, we'll need to use the xlsx library
          // For now, try to read as text (won't work perfectly but won't crash)
          return buffer.toString("utf-8");
        } else if (
          file.type === "application/pdf" ||
          file.name.endsWith(".pdf")
        ) {
          // PDF files need special handling - return empty for now, will be handled by API route
          return "";
        } else {
          // Default: try UTF-8
          return buffer.toString("utf-8");
        }
      } catch (error) {
        throw new Error(
          `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }

  /**
   * Helper: Map parsed SDS data to extracted format
   */
  private mapParsedDataToExtracted(parsedData: any): ExtractedMSDSData {
    return {
      productName: parsedData.chemicalName || "",
      manufacturer: parsedData.manufacturer || "",
      casNumber: parsedData.casNumber,
      formula: parsedData.formula,
      hazardStatements: parsedData.hazardStatements || [],
      precautionaryStatements: parsedData.precautionaryStatements || [],
      physicalState: parsedData.physicalProperties?.appearance,
      flashPoint: parsedData.physicalProperties?.flashPoint?.toString(),
      boilingPoint: parsedData.physicalProperties?.boilingPoint?.toString(),
      ph: parsedData.physicalProperties?.ph?.toString(),
      storageConditions: parsedData.storageRequirements || [],
      incompatibleMaterials:
        parsedData.stabilityReactivity?.incompatibleMaterials || [],
      ppeRequired: [],
      firstAid: this.formatFirstAid(parsedData.firstAid),
      firefighting: parsedData.fireExtinguishingMedia?.join(", ") || "",
      spillResponse: "",
      ghsCompliant: true,
      safetyScore: 85,
      aiConfidence: parsedData.confidence * 100 || 0,
    };
  }

  /**
   * Helper: Format first aid information
   */
  private formatFirstAid(firstAid: any): string {
    if (!firstAid) return "";

    const parts: string[] = [];
    if (firstAid.inhalation) parts.push(`Inhalation: ${firstAid.inhalation}`);
    if (firstAid.skinContact) parts.push(`Skin: ${firstAid.skinContact}`);
    if (firstAid.eyeContact) parts.push(`Eyes: ${firstAid.eyeContact}`);
    if (firstAid.ingestion) parts.push(`Ingestion: ${firstAid.ingestion}`);

    return parts.join("\n");
  }
}

export const msdsService = new MSDSService();
