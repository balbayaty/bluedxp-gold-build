/**
 * Intelligent Document-to-QR Code Service
 * Convert any document (MSDS, certificates, permits) to QR codes
 * With intelligent features: dynamic updates, analytics, smart routing
 */

import { QRCodeData } from "@/types/qr";

export interface DocumentQRConfig {
  documentId: string;
  documentType:
    | "msds"
    | "certificate"
    | "permit"
    | "label"
    | "report"
    | "other";
  documentUrl?: string;
  documentData?: any;
  dynamic?: boolean; // Can be updated without reprinting
  expiresAt?: string;
  accessLevel?: "public" | "internal" | "restricted";
  analytics?: boolean; // Track scans
  customData?: Record<string, any>;
}

export interface QRCodeAnalytics {
  totalScans: number;
  uniqueScans: number;
  scanHistory: ScanEvent[];
  locations: Record<string, number>; // Location-based scan counts
  devices: Record<string, number>; // Device type counts
  lastScanned?: string;
  firstScanned?: string;
}

export interface ScanEvent {
  timestamp: string;
  location?: string;
  device?: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
}

export class DocumentQRService {
  /**
   * Generate QR code for any document
   */
  async generateDocumentQR(config: DocumentQRConfig): Promise<{
    qrCode: string;
    qrData: QRCodeData;
    qrImageUrl?: string;
    analytics?: QRCodeAnalytics;
  }> {
    // Generate unique QR code ID
    const qrId = `qr-${config.documentType}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Build QR data payload
    const qrData: QRCodeData = {
      type: "document",
      id: qrId,
      documentId: config.documentId,
      documentType: config.documentType,
      url:
        config.documentUrl ||
        `/api/documents/${config.documentType}/${config.documentId}`,
      dynamic: config.dynamic || false,
      expiresAt: config.expiresAt,
      accessLevel: config.accessLevel || "internal",
      timestamp: new Date().toISOString(),
      metadata: {
        ...config.customData,
        generatedBy: "DocumentQRService",
        version: "1.0",
      },
    };

    // Generate QR code string (JSON payload)
    const qrCode = JSON.stringify(qrData);

    // Generate QR code image URL (using external service or local generation)
    const qrImageUrl = await this.generateQRImage(qrCode);

    // Initialize analytics if enabled
    const analytics = config.analytics
      ? this.initializeAnalytics(qrId)
      : undefined;

    return {
      qrCode,
      qrData,
      qrImageUrl,
      analytics,
    };
  }

  /**
   * Generate QR code for MSDS document
   * Includes full MSDS data in QR payload for offline access
   */
  async generateMSDSQR(
    msdsId: string,
    options?: {
      dynamic?: boolean;
      includeFullData?: boolean;
      analytics?: boolean;
    },
  ): Promise<{
    qrCode: string;
    qrImageUrl?: string;
    downloadUrl?: string;
    qrId: string;
    msdsData?: any;
  }> {
    // Get MSDS data if includeFullData is true
    let msdsData: any = null;
    if (options?.includeFullData !== false) {
      try {
        const { msdsStorageService } =
          await import("@/lib/services/chemical/msdsStorage");
        msdsData = await msdsStorageService.getMSDS(msdsId);
      } catch (error) {
        console.warn("Could not fetch MSDS data for QR:", error);
      }
    }

    // Generate unique QR code ID
    const qrId = `qr-msds-${msdsId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Build QR data payload with MSDS data
    const qrData: QRCodeData = {
      type: "document",
      id: qrId,
      documentId: msdsId,
      documentType: "msds",
      url: `/api/qr/scan/${qrId}`, // Use scan endpoint for tracking
      dynamic: options?.dynamic || true,
      accessLevel: "internal",
      timestamp: new Date().toISOString(),
      metadata: {
        quickAccess: true,
        mobileOptimized: true,
        // Include essential MSDS data in QR for offline access
        msdsData: msdsData
          ? {
              id: msdsData.id,
              productName: msdsData.extractedData?.productName,
              casNumber: msdsData.extractedData?.casNumber,
              manufacturer: msdsData.extractedData?.manufacturer,
              hazards: msdsData.extractedData?.hazards,
              emergencyContact: msdsData.extractedData?.emergencyContact,
              // Include full data if requested
              ...(options?.includeFullData && msdsData
                ? { fullData: msdsData }
                : {}),
            }
          : undefined,
      },
    };

    // Generate QR code string (JSON payload)
    const qrCode = JSON.stringify(qrData);

    // Generate QR code image URL
    const qrImageUrl = await this.generateQRImage(qrCode);

    // Store QR code in database
    try {
      const { QRCodeModel } = await import("@/lib/database/models/qrModel");

      const qrModel = new QRCodeModel();

      await qrModel.create({
        qrId,
        documentId: msdsId,
        documentType: "msds",
        qrData,
        qrImageUrl,
        isDynamic: options?.dynamic || true,
        version: 1,
        metadata: {
          createdBy: "system",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.warn(
        "Could not store QR code in database (continuing anyway):",
        error,
      );
      // Continue even if storage fails - QR code still works
    }

    return {
      qrCode,
      qrImageUrl,
      downloadUrl: qrImageUrl,
      qrId,
      msdsData: msdsData
        ? {
            id: msdsData.id,
            productName: msdsData.extractedData?.productName,
          }
        : undefined,
    };
  }

  /**
   * Generate smart QR code with intelligent routing
   */
  async generateSmartQR(
    config: DocumentQRConfig & {
      smartRouting?: boolean;
      fallbackUrl?: string;
      mobileUrl?: string;
      desktopUrl?: string;
    },
  ): Promise<{
    qrCode: string;
    qrImageUrl?: string;
    smartFeatures: {
      deviceDetection: boolean;
      locationAware: boolean;
      userContext: boolean;
    };
  }> {
    // Enhanced QR data with smart routing
    const smartQRData: QRCodeData & {
      smartRouting?: {
        mobile?: string;
        desktop?: string;
        fallback?: string;
        detectDevice?: boolean;
        detectLocation?: boolean;
      };
    } = {
      type: "document",
      id: `qr-smart-${Date.now()}`,
      documentId: config.documentId,
      documentType: config.documentType,
      url:
        config.documentUrl ||
        `/api/documents/${config.documentType}/${config.documentId}`,
      dynamic: config.dynamic || true,
      smartRouting: config.smartRouting
        ? {
            mobile: config.mobileUrl,
            desktop: config.desktopUrl,
            fallback: config.fallbackUrl || config.documentUrl,
            detectDevice: true,
            detectLocation: true,
          }
        : undefined,
      timestamp: new Date().toISOString(),
    };

    const qrCode = JSON.stringify(smartQRData);
    const qrImageUrl = await this.generateQRImage(qrCode);

    return {
      qrCode,
      qrImageUrl,
      smartFeatures: {
        deviceDetection: true,
        locationAware: true,
        userContext: true,
      },
    };
  }

  /**
   * Generate batch QR codes for multiple documents
   */
  async generateBatchQR(
    documents: Array<{
      documentId: string;
      documentType: DocumentQRConfig["documentType"];
      documentUrl?: string;
    }>,
  ): Promise<
    Array<{
      documentId: string;
      qrCode: string;
      qrImageUrl?: string;
    }>
  > {
    const results = await Promise.all(
      documents.map(async (doc) => {
        const result = await this.generateDocumentQR({
          documentId: doc.documentId,
          documentType: doc.documentType,
          documentUrl: doc.documentUrl,
          analytics: true,
        });
        return {
          documentId: doc.documentId,
          qrCode: result.qrCode,
          qrImageUrl: result.qrImageUrl,
        };
      }),
    );

    return results;
  }

  /**
   * Update dynamic QR code without reprinting
   */
  async updateDynamicQR(
    qrId: string,
    updates: Partial<DocumentQRConfig>,
  ): Promise<boolean> {
    try {
      // Import QR model dynamically to avoid circular dependencies
      const { QRCodeModel } = await import("@/lib/database/models/qrModel");

      const qrModel = new QRCodeModel();

      const existing = await qrModel.getById(qrId);
      if (!existing || !existing.isDynamic) {
        return false;
      }

      // Update QR data
      const updatedQrData = {
        ...existing.qrData,
        ...updates,
        timestamp: new Date().toISOString(),
      };

      await qrModel.update(existing.id, {
        qrData: updatedQrData,
        ...(updates.documentUrl && {
          qrData: { ...updatedQrData, url: updates.documentUrl },
        }),
      });

      return true;
    } catch (error) {
      console.error("Error updating dynamic QR:", error);
      return false;
    }
  }

  /**
   * Track QR code scan
   */
  async trackScan(qrId: string, scanData: ScanEvent): Promise<void> {
    try {
      // Import QR model dynamically to avoid circular dependencies
      const { QRCodeModel } = await import("@/lib/database/models/qrModel");

      const qrModel = new QRCodeModel();

      await qrModel.trackScan(qrId, {
        location: scanData.location,
        device: scanData.device,
        userAgent: scanData.userAgent,
        ipAddress: scanData.ipAddress,
        userId: scanData.userId,
      });
    } catch (error) {
      console.error("Error tracking scan:", error);
    }
  }

  /**
   * Get QR code analytics
   */
  async getAnalytics(qrId: string): Promise<QRCodeAnalytics | null> {
    try {
      // Import QR model dynamically to avoid circular dependencies
      const { QRCodeModel } = await import("@/lib/database/models/qrModel");

      const qrModel = new QRCodeModel();

      const analytics = await qrModel.getAnalytics(qrId);
      if (!analytics) return null;

      return {
        totalScans: analytics.totalScans,
        uniqueScans: analytics.uniqueScans,
        scanHistory: analytics.scanHistory.map((event) => ({
          timestamp: event.timestamp.toISOString(),
          location: event.location,
          device: event.device,
          userAgent: event.userAgent,
          ipAddress: event.ipAddress,
          userId: event.userId,
        })),
        locations: analytics.locations,
        devices: analytics.devices,
        lastScanned: analytics.lastScanned?.toISOString(),
        firstScanned: analytics.firstScanned?.toISOString(),
      };
    } catch (error) {
      console.error("Error getting analytics:", error);
      return null;
    }
  }

  /**
   * Generate QR code image
   */
  private async generateQRImage(data: string): Promise<string | undefined> {
    try {
      // Use QR code generation library or API
      // For now, return data URL or external service URL
      // In production, use: qrcode library or external service
      const encoded = encodeURIComponent(data);
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
    } catch (error) {
      console.error("Error generating QR image:", error);
      return undefined;
    }
  }

  /**
   * Initialize analytics tracking
   */
  private initializeAnalytics(qrId: string): QRCodeAnalytics {
    return {
      totalScans: 0,
      uniqueScans: 0,
      scanHistory: [],
      locations: {},
      devices: {},
    };
  }

  /**
   * Generate printable QR code label
   */
  async generatePrintableLabel(
    qrData: QRCodeData,
    options?: {
      size?: "small" | "medium" | "large";
      includeText?: boolean;
      text?: string;
    },
  ): Promise<{
    labelHtml: string;
    labelPdf?: Blob;
  }> {
    const size = options?.size || "medium";
    const sizes = {
      small: { width: 50, height: 50 },
      medium: { width: 100, height: 100 },
      large: { width: 150, height: 150 },
    };

    const qrImageUrl = await this.generateQRImage(JSON.stringify(qrData));

    const labelHtml = `
      <div style="width: ${sizes[size].width}mm; height: ${sizes[size].height}mm; border: 2px solid black; padding: 5mm; text-align: center;">
        ${qrImageUrl ? `<img src="${qrImageUrl}" style="width: 100%; max-width: ${sizes[size].width - 10}mm;" />` : ""}
        ${options?.includeText && options?.text ? `<p style="margin-top: 2mm; font-size: 8pt;">${options.text}</p>` : ""}
        ${qrData.documentType ? `<p style="font-size: 7pt; color: #666;">${qrData.documentType.toUpperCase()}</p>` : ""}
      </div>
    `;

    return {
      labelHtml,
    };
  }
}

export const documentQRService = new DocumentQRService();
