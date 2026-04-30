/**
 * MSDS Database Adapter
 * Provides database persistence for MSDS data using Prisma
 * Falls back to in-memory storage if database is not configured
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { MSDSDocument, ExtractedMSDSData } from "@/types/chemical";

interface MSDSStorageEntry {
  id: string;
  msds: MSDSDocument;
  extractedData: ExtractedMSDSData;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    tenantId: string;
    moduleAccess: string[];
  };
  warehouseData?: any;
  transportationData?: any;
  complianceData?: any;
}

export class MSDSDatabaseAdapter {
  private useDatabase: boolean = false;

  constructor() {
    // Check if Prisma is available
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Check if DATABASE_URL is configured
      if (process.env.DATABASE_URL) {
        // Test Prisma connection
        await prisma.$connect();
        this.useDatabase = true;
        console.log("✅ MSDS Database adapter: Using Prisma database storage");
      } else {
        console.log(
          "⚠️ MSDS Database adapter: DATABASE_URL not configured, using in-memory fallback",
        );
        this.useDatabase = false;
      }
    } catch (error) {
      console.warn(
        "⚠️ MSDS Database adapter: Failed to connect to Prisma, using in-memory fallback",
        error,
      );
      this.useDatabase = false;
    }
  }

  /**
   * Store MSDS in database using Prisma
   */
  async storeMSDS(entry: MSDSStorageEntry): Promise<string> {
    if (!this.useDatabase) {
      // Fallback: return ID, actual storage handled by in-memory service
      return entry.id;
    }

    try {
      // Use Prisma to upsert MSDS record
      await prisma.mSDS.upsert({
        where: { id: entry.id },
        create: {
          id: entry.id,
          tenantId: entry.metadata.tenantId,
          productName:
            entry.msds.productName ||
            entry.extractedData.productName ||
            "Unknown",
          casNumber: entry.extractedData.casNumber,
          version: entry.msds.version || "1.0",
          revisionDate: entry.msds.revisionDate
            ? new Date(entry.msds.revisionDate)
            : null,
          supplier: entry.extractedData.supplier || entry.msds.supplier,
          manufacturer: entry.extractedData.manufacturer,
          fileUrl: entry.msds.fileUrl,
          fileType: entry.msds.fileType,
          fileSize: entry.msds.fileSize,
          extractedData: entry.extractedData as any,
          status: entry.msds.status || "pending",
          workflowStatus: entry.msds.workflowStatus || "pending_analysis",
          qrCode: entry.msds.qrCode,
          qrCodeUrl: entry.msds.qrCodeUrl,
          metadata: {
            uploadedAt: new Date(entry.metadata.createdAt).toISOString(),
            uploadedBy: entry.metadata.createdBy,
            version: 1,
          } as any,
          createdBy: entry.metadata.createdBy,
        },
        update: {
          productName:
            entry.msds.productName ||
            entry.extractedData.productName ||
            "Unknown",
          extractedData: entry.extractedData as any,
          status: entry.msds.status || "pending",
          workflowStatus: entry.msds.workflowStatus || "pending_analysis",
          updatedAt: new Date(),
        },
      });

      return entry.id;
    } catch (error) {
      console.error("❌ Error storing MSDS to database:", error);
      // Fallback: return ID, let in-memory service handle it
      return entry.id;
    }
  }

  /**
   * Get MSDS from database using Prisma
   */
  async getMSDS(
    id: string,
    tenantId?: string,
  ): Promise<MSDSStorageEntry | null> {
    if (!this.useDatabase) {
      return null; // Let in-memory service handle it
    }

    try {
      // Build where clause
      const where: any = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Query using Prisma
      const result = await prisma.mSDS.findUnique({
        where,
      });

      if (!result) {
        return null;
      }

      // Convert Prisma record to storage entry
      const metadata = result.metadata as any;
      return {
        id: result.id,
        msds: {
          id: result.id,
          productName: result.productName,
          version: result.version,
          revisionDate: result.revisionDate?.toISOString(),
          supplier: result.supplier || undefined,
          manufacturer: result.manufacturer || undefined,
          fileUrl: result.fileUrl || undefined,
          fileType: result.fileType || undefined,
          fileSize: result.fileSize || undefined,
          status: result.status as any,
          workflowStatus: result.workflowStatus as any,
          qrCode: result.qrCode || undefined,
          qrCodeUrl: result.qrCodeUrl || undefined,
        } as MSDSDocument,
        extractedData:
          (result.extractedData as ExtractedMSDSData) ||
          ({} as ExtractedMSDSData),
        metadata: {
          createdAt: metadata?.uploadedAt || result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
          createdBy: metadata?.uploadedBy || result.createdBy,
          tenantId: result.tenantId,
          moduleAccess: ["warehouse", "transportation", "compliance"],
        },
      };
    } catch (error) {
      console.error("❌ Error getting MSDS from database:", error);
      return null; // Let in-memory service handle it
    }
  }

  /**
   * Get all MSDS for a tenant using Prisma
   */
  async getAllMSDS(tenantId?: string): Promise<MSDSStorageEntry[]> {
    if (!this.useDatabase) {
      return []; // Let in-memory service handle it
    }

    try {
      // Build where clause
      const where: any = {};
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Query using Prisma
      const results = await prisma.mSDS.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      // Convert Prisma records to storage entries
      return results.map((result) => {
        const metadata = result.metadata as any;
        return {
          id: result.id,
          msds: {
            id: result.id,
            productName: result.productName,
            version: result.version,
            revisionDate: result.revisionDate?.toISOString(),
            supplier: result.supplier || undefined,
            manufacturer: result.manufacturer || undefined,
            fileUrl: result.fileUrl || undefined,
            fileType: result.fileType || undefined,
            fileSize: result.fileSize || undefined,
            status: result.status as any,
            workflowStatus: result.workflowStatus as any,
            qrCode: result.qrCode || undefined,
            qrCodeUrl: result.qrCodeUrl || undefined,
          } as MSDSDocument,
          extractedData:
            (result.extractedData as ExtractedMSDSData) ||
            ({} as ExtractedMSDSData),
          metadata: {
            createdAt: metadata?.uploadedAt || result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
            createdBy: metadata?.uploadedBy || result.createdBy,
            tenantId: result.tenantId,
            moduleAccess: ["warehouse", "transportation", "compliance"],
          },
        };
      });
    } catch (error) {
      console.error("❌ Error getting all MSDS from database:", error);
      return []; // Let in-memory service handle it
    }
  }

  /**
   * Delete MSDS from database using Prisma
   */
  async deleteMSDS(id: string, tenantId?: string): Promise<boolean> {
    if (!this.useDatabase) {
      return false; // Let in-memory service handle it
    }

    try {
      // Build where clause
      const where: any = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Delete using Prisma
      await prisma.mSDS.delete({
        where,
      });

      return true;
    } catch (error) {
      console.error("❌ Error deleting MSDS from database:", error);
      return false;
    }
  }

  /**
   * Check if database is available
   */
  isDatabaseAvailable(): boolean {
    return this.useDatabase;
  }
}

// Singleton instance
let adapterInstance: MSDSDatabaseAdapter | null = null;

export function getMSDSDatabaseAdapter(): MSDSDatabaseAdapter {
  if (!adapterInstance) {
    adapterInstance = new MSDSDatabaseAdapter();
  }
  return adapterInstance;
}
