/**
 * White-Label Service
 * Custom branding, domains, and tenant-specific configurations
 */

export interface WhiteLabelConfig {
  tenantId: string;
  brandName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain?: string;
  theme?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class WhiteLabelService {
  private configs: Map<string, WhiteLabelConfig> = new Map();

  /**
   * Set white-label configuration
   */
  async setConfig(config: WhiteLabelConfig): Promise<void> {
    this.configs.set(config.tenantId, config);
  }

  /**
   * Get white-label configuration
   */
  async getConfig(tenantId: string): Promise<WhiteLabelConfig | null> {
    return this.configs.get(tenantId) || null;
  }

  /**
   * Get brand name
   */
  async getBrandName(tenantId: string): Promise<string> {
    const config = await this.getConfig(tenantId);
    return config?.brandName || "BlueDXP";
  }

  /**
   * Get logo URL
   */
  async getLogoUrl(tenantId: string): Promise<string | null> {
    const config = await this.getConfig(tenantId);
    return config?.logoUrl || null;
  }

  /**
   * Get theme colors
   */
  async getTheme(tenantId: string): Promise<Record<string, string>> {
    const config = await this.getConfig(tenantId);
    if (!config) {
      return {
        primary: "#3B82F6",
        secondary: "#10B981",
      };
    }

    return {
      primary: config.primaryColor,
      secondary: config.secondaryColor,
      ...config.theme,
    };
  }

  /**
   * Get custom domain
   */
  async getCustomDomain(tenantId: string): Promise<string | null> {
    const config = await this.getConfig(tenantId);
    return config?.customDomain || null;
  }

  /**
   * Validate custom domain
   */
  async validateDomain(domain: string): Promise<boolean> {
    // In production, this would validate DNS records
    // For now, basic validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }
}

export const whiteLabelService = new WhiteLabelService();
