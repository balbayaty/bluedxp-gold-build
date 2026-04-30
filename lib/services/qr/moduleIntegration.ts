/**
 * QR Code Module Integration Service
 * Integrates QR codes across all BlueDXP modules:
 * - WMS: Inventory, containers, locations
 * - TMS: Shipments, tracking, POD
 * - Compliance: Certificates, permits
 * - QHSE: Safety labels, incident reports
 * - Facility: Assets, equipment
 */

import { documentQRService } from "./documentQRService";
import { intelligentQRService } from "./intelligentQRService";

export class QRModuleIntegration {
  /**
   * Generate QR for WMS Container/Inventory
   */
  async generateWMSQR(params: {
    containerId?: string;
    skuId?: string;
    locationId?: string;
    type: "container" | "sku" | "location";
  }): Promise<{
    qrCode: string;
    qrImageUrl?: string;
    qrId: string;
  }> {
    const qrId = `qr-wms-${params.type}-${Date.now()}`;

    const result = await documentQRService.generateDocumentQR({
      documentId: params.containerId || params.skuId || params.locationId || "",
      documentType: "other",
      documentUrl: `/wms/${params.type}/${params.containerId || params.skuId || params.locationId}`,
      dynamic: true,
      analytics: true,
      customData: {
        module: "wms",
        type: params.type,
        containerId: params.containerId,
        skuId: params.skuId,
        locationId: params.locationId,
      },
    });

    return {
      qrCode: result.qrCode,
      qrImageUrl: result.qrImageUrl,
      qrId: result.qrData.id,
    };
  }

  /**
   * Generate QR for TMS Shipment
   */
  async generateTMSQR(
    shipmentId: string,
    options?: {
      includeTracking?: boolean;
      includePOD?: boolean;
    },
  ): Promise<{
    qrCode: string;
    qrImageUrl?: string;
    qrId: string;
  }> {
    const result = await intelligentQRService.generateIntelligentQR({
      documentId: shipmentId,
      documentType: "report",
      analytics: true,
      customLandingPage: {
        title: "Shipment Tracking",
        description: "Scan to track your shipment in real-time",
        ctaText: "View Details",
        ctaUrl: `/transportation/tracking?shipmentId=${shipmentId}`,
      },
      deviceRouting: {
        mobile: `/transportation/tracking?shipmentId=${shipmentId}&mobile=true`,
        desktop: `/transportation/tracking?shipmentId=${shipmentId}`,
        fallback: `/transportation/tracking?shipmentId=${shipmentId}`,
      },
    });

    return {
      qrCode: result.qrCode,
      qrImageUrl: result.qrImageUrl,
      qrId: result.qrId,
    };
  }

  /**
   * Generate QR for Compliance Certificate
   */
  async generateComplianceQR(
    certificateId: string,
    certificateType: "certificate" | "permit",
  ): Promise<{
    qrCode: string;
    qrImageUrl?: string;
    qrId: string;
  }> {
    const result = await documentQRService.generateDocumentQR({
      documentId: certificateId,
      documentType: certificateType,
      documentUrl: `/compliance/${certificateType}s/${certificateId}`,
      dynamic: true,
      analytics: true,
      accessLevel: "public", // Certificates often need public access
      customData: {
        module: "compliance",
        certificateType,
      },
    });

    return {
      qrCode: result.qrCode,
      qrImageUrl: result.qrImageUrl,
      qrId: result.qrData.id,
    };
  }

  /**
   * Generate QR for QHSE Safety Label
   */
  async generateQHSEQR(params: {
    labelId: string;
    chemicalId?: string;
    hazardClass?: string;
  }): Promise<{
    qrCode: string;
    qrImageUrl?: string;
    qrId: string;
  }> {
    const result = await documentQRService.generateDocumentQR({
      documentId: params.labelId,
      documentType: "label",
      documentUrl: `/qhse/labels/${params.labelId}`,
      dynamic: true,
      analytics: true,
      customData: {
        module: "qhse",
        chemicalId: params.chemicalId,
        hazardClass: params.hazardClass,
      },
    });

    return {
      qrCode: result.qrCode,
      qrImageUrl: result.qrImageUrl,
      qrId: result.qrData.id,
    };
  }

  /**
   * Generate QR for Facility Asset
   */
  async generateFacilityQR(
    assetId: string,
    assetType: string,
  ): Promise<{
    qrCode: string;
    qrImageUrl?: string;
    qrId: string;
  }> {
    const result = await intelligentQRService.generateIntelligentQR({
      documentId: assetId,
      documentType: "other",
      analytics: true,
      customLandingPage: {
        title: "Asset Information",
        description: "Scan to view asset details and maintenance history",
        ctaText: "View Asset",
        ctaUrl: `/facility/assets/${assetId}`,
      },
      deviceRouting: {
        mobile: `/facility/assets/${assetId}?mobile=true`,
        desktop: `/facility/assets/${assetId}`,
        fallback: `/facility/assets/${assetId}`,
      },
    });

    return {
      qrCode: result.qrCode,
      qrImageUrl: result.qrImageUrl,
      qrId: result.qrId,
    };
  }

  /**
   * Generate batch QR codes for multiple items
   */
  async generateBatchQR(
    items: Array<{
      id: string;
      module: "wms" | "tms" | "compliance" | "qhse" | "facility" | "msds";
      type: string;
    }>,
  ): Promise<
    Array<{
      id: string;
      qrCode: string;
      qrImageUrl?: string;
      qrId: string;
    }>
  > {
    const results = await Promise.all(
      items.map(async (item) => {
        let result;
        switch (item.module) {
          case "wms":
            result = await this.generateWMSQR({
              containerId: item.id,
              type: item.type as "container" | "sku" | "location",
            });
            break;
          case "tms":
            result = await this.generateTMSQR(item.id);
            break;
          case "compliance":
            result = await this.generateComplianceQR(
              item.id,
              item.type as "certificate" | "permit",
            );
            break;
          case "qhse":
            result = await this.generateQHSEQR({ labelId: item.id });
            break;
          case "facility":
            result = await this.generateFacilityQR(item.id, item.type);
            break;
          case "msds":
            result = await documentQRService.generateMSDSQR(item.id, {
              includeFullData: true,
              analytics: true,
            });
            break;
          default:
            throw new Error(`Unknown module: ${item.module}`);
        }

        return {
          id: item.id,
          qrCode: result.qrCode,
          qrImageUrl: result.qrImageUrl,
          qrId: result.qrId,
        };
      }),
    );

    return results;
  }
}

export const qrModuleIntegration = new QRModuleIntegration();
