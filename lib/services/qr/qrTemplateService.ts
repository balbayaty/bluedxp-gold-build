/**
 * QR Code Template Service
 * Pre-configured QR code templates for common use cases
 * Industry-leading template management system
 *
 * Features:
 * - Template library with industry-specific templates
 * - Custom template creation and sharing
 * - Template versioning
 * - Template analytics
 */

import { QRTemplate, QRBranding } from "@/types/qr";
import { documentQRService } from "./documentQRService";
import { intelligentQRService } from "./intelligentQRService";

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: QRTemplate["category"];
  industry?: string;
  config: QRTemplate["config"];
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

import { qrDatabaseAdapter } from "./database/qrDatabaseAdapter";

export class QRTemplateService {
  private dbAdapter = qrDatabaseAdapter;

  /**
   * Create QR code template
   */
  async createTemplate(
    input: CreateTemplateInput,
    createdBy: string,
  ): Promise<QRTemplate> {
    const template: QRTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: input.name,
      description: input.description,
      category: input.category,
      industry: input.industry,
      config: input.config,
      metadata: input.metadata,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: input.isPublic || false,
      usageCount: 0,
    };

    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<QRTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * List templates
   */
  async listTemplates(options?: {
    category?: QRTemplate["category"];
    industry?: string;
    isPublic?: boolean;
    createdBy?: string;
  }): Promise<QRTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (options?.category) {
      templates = templates.filter((t) => t.category === options.category);
    }
    if (options?.industry) {
      templates = templates.filter((t) => t.industry === options.industry);
    }
    if (options?.isPublic !== undefined) {
      templates = templates.filter((t) => t.isPublic === options.isPublic);
    }
    if (options?.createdBy) {
      templates = templates.filter((t) => t.createdBy === options.createdBy);
    }

    return templates.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Generate QR code from template
   */
  async generateFromTemplate(
    templateId: string,
    data: {
      documentId: string;
      documentType: string;
      documentUrl?: string;
      customData?: Record<string, any>;
    },
  ): Promise<{
    qrCode: string;
    qrImageUrl?: string;
    qrId: string;
  }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Increment usage count
    template.usageCount++;
    template.updatedAt = new Date();
    this.templates.set(templateId, template);

    // Generate QR code using template config
    if (template.config.routing || template.config.branding) {
      // Use intelligent QR service for advanced features
      const result = await intelligentQRService.generateIntelligentQR({
        documentId: data.documentId,
        documentType: data.documentType as any,
        analytics: template.config.analytics !== false,
        customData: {
          ...data.customData,
          templateId,
          templateName: template.name,
        },
        geoRouting: template.config.routing?.geo ? [] : undefined,
        timeRouting: template.config.routing?.time ? [] : undefined,
        deviceRouting: template.config.routing?.device ? {} : undefined,
        customLandingPage: template.config.branding
          ? {
              title: template.name,
              description: template.description || "",
            }
          : undefined,
      });

      return {
        qrCode: result.qrCode,
        qrImageUrl: result.qrImageUrl,
        qrId: result.qrId,
      };
    } else {
      // Use standard document QR service
      const result = await documentQRService.generateDocumentQR({
        documentId: data.documentId,
        documentType: data.documentType as any,
        documentUrl: data.documentUrl,
        dynamic: template.config.dynamic !== false,
        analytics: template.config.analytics !== false,
        customData: {
          ...data.customData,
          templateId,
          templateName: template.name,
        },
      });

      return {
        qrCode: result.qrCode,
        qrImageUrl: result.qrImageUrl,
        qrId: result.qrData.id,
      };
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<CreateTemplateInput>,
  ): Promise<QRTemplate> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const updated: QRTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(templateId, updated);
    return updated;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    return this.templates.delete(templateId);
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10): Promise<QRTemplate[]> {
    const templates = Array.from(this.templates.values());
    return templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Get industry-specific templates
   */
  async getIndustryTemplates(industry: string): Promise<QRTemplate[]> {
    return Array.from(this.templates.values())
      .filter((t) => t.industry === industry)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Initialize default templates
   */
  async initializeDefaultTemplates(
    createdBy: string = "system",
  ): Promise<void> {
    const defaultTemplates: CreateTemplateInput[] = [
      {
        name: "MSDS Document",
        description: "Template for MSDS document QR codes",
        category: "document",
        industry: "chemical",
        config: {
          documentType: "msds",
          dynamic: true,
          analytics: true,
        },
        isPublic: true,
      },
      {
        name: "Container Tracking",
        description: "Template for container/inventory tracking",
        category: "inventory",
        config: {
          dynamic: true,
          analytics: true,
          routing: {
            geo: true,
            device: true,
          },
        },
        isPublic: true,
      },
      {
        name: "Asset Management",
        description: "Template for facility asset QR codes",
        category: "asset",
        config: {
          dynamic: true,
          analytics: true,
          routing: {
            device: true,
          },
        },
        isPublic: true,
      },
      {
        name: "Compliance Certificate",
        description: "Template for compliance certificates",
        category: "compliance",
        config: {
          documentType: "certificate",
          dynamic: false,
          analytics: true,
          security: {
            passwordProtected: false,
          },
        },
        isPublic: true,
      },
      {
        name: "Shipment Tracking",
        description: "Template for shipment tracking QR codes",
        category: "logistics",
        config: {
          dynamic: true,
          analytics: true,
          routing: {
            geo: true,
            time: true,
            device: true,
          },
        },
        isPublic: true,
      },
      {
        name: "Work Order",
        description: "Template for work order QR codes",
        category: "custom",
        config: {
          dynamic: true,
          analytics: true,
          routing: {
            device: true,
          },
        },
        isPublic: true,
      },
      {
        name: "Incident Report",
        description: "Template for incident report QR codes",
        category: "compliance",
        config: {
          documentType: "report",
          dynamic: true,
          analytics: true,
          security: {
            ipWhitelist: true,
          },
        },
        isPublic: true,
      },
    ];

    for (const templateInput of defaultTemplates) {
      await this.createTemplate(templateInput, createdBy);
    }
  }
}

export const qrTemplateService = new QRTemplateService();
