/**
 * QR Code White-Labeling Service
 * Enterprise branding and customization for QR codes
 *
 * Features:
 * - Custom logo embedding
 * - Brand color customization
 * - Custom QR code styling
 * - White-label API endpoints
 * - Custom domain support
 */

import { QRBranding } from "@/types/qr";
import { qrDatabaseAdapter } from "./database/qrDatabaseAdapter";

export interface WhiteLabelConfig {
  organizationId: string;
  branding: QRBranding;
  customDomain?: string;
  apiEndpoint?: string;
  enabled: boolean;
}

export class QRWhiteLabelService {
  private dbAdapter = qrDatabaseAdapter;

  /**
   * Configure white-labeling for organization
   */
  async configureWhiteLabel(
    organizationId: string,
    branding: QRBranding,
    options?: {
      customDomain?: string;
      apiEndpoint?: string;
    },
  ): Promise<WhiteLabelConfig> {
    const config: WhiteLabelConfig = {
      organizationId,
      branding,
      customDomain: options?.customDomain,
      apiEndpoint: options?.apiEndpoint,
      enabled: true,
    };

    this.configs.set(organizationId, config);
    return config;
  }

  /**
   * Get white-label configuration
   */
  async getWhiteLabelConfig(
    organizationId: string,
  ): Promise<WhiteLabelConfig | null> {
    return this.configs.get(organizationId) || null;
  }

  /**
   * Generate branded QR code image URL
   */
  async generateBrandedQRImage(
    qrData: string,
    organizationId: string,
    options?: {
      size?: number;
      format?: "png" | "svg" | "pdf";
    },
  ): Promise<string> {
    const config = await this.getWhiteLabelConfig(organizationId);

    if (!config || !config.enabled) {
      // Return standard QR code
      return this.generateStandardQRImage(qrData, options);
    }

    // Generate branded QR code
    const size = options?.size || 300;
    const format = options?.format || "png";

    // Build branded QR code URL with customization parameters
    const params = new URLSearchParams({
      data: qrData,
      size: size.toString(),
      format,
    });

    // Add branding parameters
    if (config.branding.colors?.foreground) {
      params.append("color", config.branding.colors.foreground);
    }
    if (config.branding.colors?.background) {
      params.append("bgcolor", config.branding.colors.background);
    }
    if (config.branding.logo?.url) {
      params.append("logo", config.branding.logo.url);
      if (config.branding.logo.size) {
        params.append("logo_size", config.branding.logo.size.toString());
      }
    }
    if (config.branding.frame?.enabled) {
      params.append("frame", "1");
      if (config.branding.frame.color) {
        params.append("frame_color", config.branding.frame.color);
      }
      if (config.branding.frame.width) {
        params.append("frame_width", config.branding.frame.width.toString());
      }
    }
    if (config.branding.text?.enabled && config.branding.text.content) {
      params.append("text", config.branding.text.content);
      if (config.branding.text.position) {
        params.append("text_position", config.branding.text.position);
      }
    }

    // Use custom domain if configured
    const baseUrl = config.customDomain
      ? `https://${config.customDomain}/api/qr/generate`
      : "https://api.qrserver.com/v1/create-qr-code";

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate standard QR code image URL
   */
  private generateStandardQRImage(
    qrData: string,
    options?: {
      size?: number;
      format?: "png" | "svg" | "pdf";
    },
  ): string {
    const size = options?.size || 300;
    const encoded = encodeURIComponent(qrData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
  }

  /**
   * Validate branding configuration
   */
  validateBranding(branding: QRBranding): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate logo
    if (branding.logo?.url) {
      try {
        new URL(branding.logo.url);
      } catch {
        errors.push("Logo URL must be a valid URL");
      }
    }

    // Validate colors
    if (branding.colors?.foreground) {
      if (!/^#[0-9A-F]{6}$/i.test(branding.colors.foreground)) {
        errors.push(
          "Foreground color must be a valid hex color (e.g., #000000)",
        );
      }
    }
    if (branding.colors?.background) {
      if (!/^#[0-9A-F]{6}$/i.test(branding.colors.background)) {
        errors.push(
          "Background color must be a valid hex color (e.g., #FFFFFF)",
        );
      }
    }

    // Validate frame
    if (branding.frame?.enabled) {
      if (
        branding.frame.color &&
        !/^#[0-9A-F]{6}$/i.test(branding.frame.color)
      ) {
        errors.push("Frame color must be a valid hex color");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default branding for organization
   */
  async getDefaultBranding(organizationId: string): Promise<QRBranding> {
    // Return default branding based on organization
    // In production, this would fetch from organization settings
    return {
      colors: {
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M",
      },
      frame: {
        enabled: false,
      },
    };
  }

  /**
   * Disable white-labeling for organization
   */
  async disableWhiteLabel(organizationId: string): Promise<void> {
    const config = await this.getWhiteLabelConfig(organizationId);
    if (config) {
      config.enabled = false;
      this.configs.set(organizationId, config);
    }
  }
}

export const qrWhiteLabelService = new QRWhiteLabelService();
