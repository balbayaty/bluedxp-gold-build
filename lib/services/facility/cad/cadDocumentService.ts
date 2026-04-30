/**
 * CAD & Drawing Document Management Service
 *
 * Comprehensive document management for:
 * - AutoCAD files (DWG, DXF)
 * - PDF drawings
 * - Specifications
 * - BIM models
 * - Version control
 * - Document linking to assets and spaces
 */

import type {
  CADDrawing,
  Specification,
  BIMModel,
  CADDrawingType,
  SpecificationType,
} from "@/types/facility";
import { eventBus } from "@/lib/services/event-store";

export interface CADDocumentServiceConfig {
  storageProvider?: "local" | "s3" | "azure" | "gcs";
  storagePath?: string;
  maxFileSize?: number; // bytes
  allowedFormats?: string[];
  enableVersioning?: boolean;
}

export class CADDocumentService {
  private config: CADDocumentServiceConfig;
  private drawings: Map<string, CADDrawing> = new Map();
  private specifications: Map<string, Specification> = new Map();
  private bimModels: Map<string, BIMModel> = new Map();

  constructor(config: CADDocumentServiceConfig = {}) {
    this.config = {
      storageProvider: "local",
      storagePath: "/uploads/cad",
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFormats: ["dwg", "dxf", "pdf", "png", "jpg", "ifc", "rvt", "nwd"],
      enableVersioning: true,
      ...config,
    };
  }

  /**
   * Upload CAD drawing
   */
  async uploadDrawing(
    facilityId: string,
    file: File,
    metadata: {
      name: string;
      type: CADDrawingType;
      version?: string;
      revision?: string;
      description?: string;
      linkedAssets?: string[];
      linkedSpaces?: string[];
    },
  ): Promise<CADDrawing> {
    // Validate file
    this.validateFile(file);

    // Upload file (in real implementation, upload to storage)
    const fileUrl = await this.uploadFile(file);

    const drawing: CADDrawing = {
      id: `drawing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      facilityId,
      name: metadata.name,
      type: metadata.type,
      fileFormat: this.getFileFormat(file.name),
      fileUrl,
      fileSize: file.size,
      version: metadata.version || "1.0",
      revision: metadata.revision || "A",
      status: "draft",
      metadata: {
        drawingNumber: metadata.name,
        author: "System", // Should come from auth context
        software: "AutoCAD", // Detect from file
        creationDate: new Date(),
        description: metadata.description,
      },
      linkedAssets: metadata.linkedAssets || [],
      linkedSpaces: metadata.linkedSpaces || [],
      tenantId: undefined, // Should come from context
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: undefined, // Should come from auth context
    };

    this.drawings.set(drawing.id, drawing);

    // Publish event
    await eventBus.publish("facility.drawing.uploaded", {
      drawingId: drawing.id,
      facilityId,
      type: metadata.type,
    });

    return drawing;
  }

  /**
   * Get drawings for a facility
   */
  async getDrawings(
    facilityId: string,
    filters?: {
      type?: CADDrawingType;
      status?: string;
      linkedAssetId?: string;
      linkedSpaceId?: string;
    },
  ): Promise<CADDrawing[]> {
    let drawings = Array.from(this.drawings.values()).filter(
      (d) => d.facilityId === facilityId,
    );

    if (filters) {
      if (filters.type) {
        drawings = drawings.filter((d) => d.type === filters.type);
      }
      if (filters.status) {
        drawings = drawings.filter((d) => d.status === filters.status);
      }
      if (filters.linkedAssetId) {
        drawings = drawings.filter((d) =>
          d.linkedAssets?.includes(filters.linkedAssetId!),
        );
      }
      if (filters.linkedSpaceId) {
        drawings = drawings.filter((d) =>
          d.linkedSpaces?.includes(filters.linkedSpaceId!),
        );
      }
    }

    return drawings;
  }

  /**
   * Get drawing by ID
   */
  async getDrawing(drawingId: string): Promise<CADDrawing | null> {
    return this.drawings.get(drawingId) || null;
  }

  /**
   * Update drawing
   */
  async updateDrawing(
    drawingId: string,
    updates: Partial<CADDrawing>,
  ): Promise<CADDrawing> {
    const drawing = this.drawings.get(drawingId);
    if (!drawing) {
      throw new Error(`Drawing ${drawingId} not found`);
    }

    const updatedDrawing: CADDrawing = {
      ...drawing,
      ...updates,
      updatedAt: new Date(),
    };

    this.drawings.set(drawingId, updatedDrawing);

    // Publish event
    await eventBus.publish("facility.drawing.updated", {
      drawingId,
      facilityId: updatedDrawing.facilityId,
      changes: Object.keys(updates),
    });

    return updatedDrawing;
  }

  /**
   * Link drawing to asset
   */
  async linkDrawingToAsset(drawingId: string, assetId: string): Promise<void> {
    const drawing = this.drawings.get(drawingId);
    if (!drawing) {
      throw new Error(`Drawing ${drawingId} not found`);
    }

    if (!drawing.linkedAssets) {
      drawing.linkedAssets = [];
    }

    if (!drawing.linkedAssets.includes(assetId)) {
      drawing.linkedAssets.push(assetId);
      await this.updateDrawing(drawingId, {
        linkedAssets: drawing.linkedAssets,
      });
    }
  }

  /**
   * Link drawing to space
   */
  async linkDrawingToSpace(drawingId: string, spaceId: string): Promise<void> {
    const drawing = this.drawings.get(drawingId);
    if (!drawing) {
      throw new Error(`Drawing ${drawingId} not found`);
    }

    if (!drawing.linkedSpaces) {
      drawing.linkedSpaces = [];
    }

    if (!drawing.linkedSpaces.includes(spaceId)) {
      drawing.linkedSpaces.push(spaceId);
      await this.updateDrawing(drawingId, {
        linkedSpaces: drawing.linkedSpaces,
      });
    }
  }

  /**
   * Upload specification
   */
  async uploadSpecification(
    facilityId: string,
    specification: {
      name: string;
      type: SpecificationType;
      category: string;
      content: string;
      version: string;
      assetId?: string;
      attachments?: File[];
    },
  ): Promise<Specification> {
    const newSpec: Specification = {
      id: `spec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      facilityId,
      assetId: specification.assetId,
      name: specification.name,
      type: specification.type,
      category: specification.category,
      content: specification.content,
      version: specification.version,
      status: "draft",
      attachments: specification.attachments?.map((f) => f.name) || [],
      metadata: {},
      tenantId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: undefined,
    };

    this.specifications.set(newSpec.id, newSpec);

    // Publish event
    await eventBus.publish("facility.specification.uploaded", {
      specificationId: newSpec.id,
      facilityId,
      type: specification.type,
    });

    return newSpec;
  }

  /**
   * Get specifications for a facility
   */
  async getSpecifications(
    facilityId: string,
    filters?: {
      type?: SpecificationType;
      assetId?: string;
      status?: string;
    },
  ): Promise<Specification[]> {
    let specs = Array.from(this.specifications.values()).filter(
      (s) => s.facilityId === facilityId,
    );

    if (filters) {
      if (filters.type) {
        specs = specs.filter((s) => s.type === filters.type);
      }
      if (filters.assetId) {
        specs = specs.filter((s) => s.assetId === filters.assetId);
      }
      if (filters.status) {
        specs = specs.filter((s) => s.status === filters.status);
      }
    }

    return specs;
  }

  /**
   * Upload BIM model
   */
  async uploadBIMModel(
    facilityId: string,
    file: File,
    metadata: {
      name: string;
      version: string;
      author?: string;
      software?: string;
      projectName?: string;
    },
  ): Promise<BIMModel> {
    // Validate file
    this.validateFile(file);

    // Upload file
    const fileUrl = await this.uploadFile(file);

    const bimModel: BIMModel = {
      id: `bim-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      facilityId,
      name: metadata.name,
      version: metadata.version,
      fileFormat: this.getBIMFileFormat(file.name),
      fileUrl,
      fileSize: file.size,
      status: "uploading",
      metadata: {
        author: metadata.author,
        software: metadata.software,
        creationDate: new Date(),
        projectName: metadata.projectName,
      },
      elements: [],
      tenantId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: undefined,
    };

    this.bimModels.set(bimModel.id, bimModel);

    // Process BIM model (in real implementation, extract elements)
    // For now, mark as ready
    setTimeout(() => {
      bimModel.status = "ready";
      this.bimModels.set(bimModel.id, bimModel);
    }, 1000);

    // Publish event
    await eventBus.publish("facility.bim.uploaded", {
      bimModelId: bimModel.id,
      facilityId,
    });

    return bimModel;
  }

  /**
   * Get BIM models for a facility
   */
  async getBIMModels(facilityId: string): Promise<BIMModel[]> {
    return Array.from(this.bimModels.values()).filter(
      (m) => m.facilityId === facilityId,
    );
  }

  /**
   * Validate file
   */
  private validateFile(file: File): void {
    // Check file size
    if (file.size > (this.config.maxFileSize || 100 * 1024 * 1024)) {
      throw new Error(
        `File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`,
      );
    }

    // Check file format
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !this.config.allowedFormats?.includes(extension)) {
      throw new Error(
        `File format .${extension} is not allowed. Allowed formats: ${this.config.allowedFormats?.join(", ")}`,
      );
    }
  }

  /**
   * Upload file to storage
   */
  private async uploadFile(file: File): Promise<string> {
    // In real implementation, upload to configured storage provider
    // For now, return a mock URL
    return `${this.config.storagePath}/${file.name}`;
  }

  /**
   * Get file format from filename
   */
  private getFileFormat(filename: string): CADDrawing["fileFormat"] {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "dwg":
        return "dwg";
      case "dxf":
        return "dxf";
      case "pdf":
        return "pdf";
      case "png":
        return "png";
      case "jpg":
      case "jpeg":
        return "jpg";
      default:
        return "other";
    }
  }

  /**
   * Get BIM file format from filename
   */
  private getBIMFileFormat(filename: string): BIMModel["fileFormat"] {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "ifc":
        return "ifc";
      case "dwg":
        return "dwg";
      case "rvt":
        return "rvt";
      case "nwd":
        return "nwd";
      default:
        return "other";
    }
  }
}

// Singleton instance
let cadDocumentServiceInstance: CADDocumentService | null = null;

export function getCADDocumentService(
  config?: CADDocumentServiceConfig,
): CADDocumentService {
  if (!cadDocumentServiceInstance) {
    cadDocumentServiceInstance = new CADDocumentService(config);
  }
  return cadDocumentServiceInstance;
}
