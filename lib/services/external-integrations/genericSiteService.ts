/**
 * Generic Site Integration Service
 * Supports iframe embedding, API integration, and web scraping
 * Flexible integration for any website or service
 */

import { BaseIntegrationService } from "./baseIntegrationService";
import type {
  GenericSiteIntegration,
  IntegrationDisplayMode,
  IntegrationResponse,
} from "@/types/external-integrations";
import axios from "axios";

export class GenericSiteService extends BaseIntegrationService {
  protected integrationType = "GENERIC_SITE" as const;

  /**
   * Connect generic site integration
   */
  async connect(
    integration: Partial<GenericSiteIntegration>,
  ): Promise<GenericSiteIntegration> {
    if (!integration.config?.url) {
      throw new Error("URL required for generic site connection");
    }

    const mode = integration.config.mode || "IFRAME";

    // Validate based on mode
    if (mode === "API" && !integration.config.apiConfig?.baseUrl) {
      throw new Error("API base URL required for API mode");
    }

    // Test connection
    if (mode === "API") {
      await this.testAPIConnection(integration.config.apiConfig!);
    } else if (mode === "SCRAPING") {
      await this.testScrapingConnection(integration.config.url);
    }

    const genericIntegration: GenericSiteIntegration = {
      id: integration.id || `generic_${Date.now()}`,
      type:
        mode === "IFRAME"
          ? "IFRAME_EMBED"
          : mode === "API"
            ? "API_INTEGRATION"
            : "GENERIC_SITE",
      name:
        integration.name ||
        `Site - ${new URL(integration.config.url).hostname}`,
      status: "CONNECTED",
      tenantId: integration.tenantId || "",
      userId: integration.userId,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncAt: new Date(),
      config: {
        url: integration.config.url,
        mode,
        apiConfig: integration.config.apiConfig,
        iframeConfig: integration.config.iframeConfig || {
          allowFullscreen: true,
          sandbox: ["allow-same-origin", "allow-scripts", "allow-forms"],
          width: "100%",
          height: "600px",
        },
        scrapingConfig: integration.config.scrapingConfig,
        displayMode: integration.config.displayMode || "WIDGET",
      },
      metadata: {
        siteName: new URL(integration.config.url).hostname,
        siteIcon: `https://www.google.com/s2/favicons?domain=${new URL(integration.config.url).hostname}&sz=64`,
      },
    };

    this.emitEvent(
      "connected",
      { integrationId: genericIntegration.id },
      genericIntegration.id,
    );
    return genericIntegration;
  }

  /**
   * Disconnect generic site integration
   */
  async disconnect(integrationId: string): Promise<void> {
    this.emitEvent("disconnected", { integrationId }, integrationId);
  }

  /**
   * Sync generic site data
   */
  async sync(integrationId: string): Promise<void> {
    this.emitEvent("sync_started", { integrationId }, integrationId);

    // Sync based on mode
    // - API: Fetch data from API endpoints
    // - SCRAPING: Scrape latest content
    // - IFRAME: No sync needed (client-side)

    this.emitEvent("sync_completed", { integrationId }, integrationId);
  }

  /**
   * Get integration status
   */
  async getStatus(
    integrationId: string,
  ): Promise<"CONNECTED" | "DISCONNECTED" | "PENDING" | "ERROR" | "EXPIRED"> {
    // Test connection based on mode
    return "CONNECTED";
  }

  /**
   * Get data from generic site
   */
  async getData(
    integrationId: string,
    options?: Record<string, any>,
  ): Promise<any> {
    // This method is called by IntegrationManager which provides the integration config
    // Options may include: url, mode, apiConfig, endpoint, etc.
    const url = options?.url;
    const mode = options?.mode || "IFRAME";
    const apiConfig = options?.apiConfig;
    const endpoint = options?.endpoint || "/";
    const selectors = options?.selectors;

    if (!url) {
      return { error: "URL required" };
    }

    switch (mode) {
      case "API":
        if (!apiConfig) {
          return { error: "API config required for API mode" };
        }
        const apiData = await this.makeAPIRequest(apiConfig, endpoint, "GET");
        return { data: apiData, mode: "API" };
      case "SCRAPING":
        if (!selectors) {
          return { error: "Selectors required for scraping mode" };
        }
        const scrapedData = await this.scrapeContent(url, selectors);
        return { data: scrapedData, mode: "SCRAPING" };
      case "IFRAME":
      default:
        // For iframe, just return the URL
        return { url, mode: "IFRAME" };
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(
    integrationId: string,
    config: Record<string, any>,
  ): Promise<GenericSiteIntegration> {
    // This method is called by IntegrationManager which handles database updates
    // IntegrationManager will get the integration from database, merge config, and save
    return {
      id: integrationId,
      type: "GENERIC_SITE",
      name: "Generic Site Integration",
      status: "CONNECTED",
      tenantId: "",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: config, // Return merged config (IntegrationManager handles the merge)
    } as GenericSiteIntegration;
  }

  /**
   * Test API connection
   */
  private async testAPIConnection(apiConfig: {
    baseUrl: string;
    apiKey?: string;
    authType?: "API_KEY" | "OAUTH2" | "BASIC" | "BEARER";
  }): Promise<void> {
    try {
      const headers: Record<string, string> = {};

      // Add authentication
      if (apiConfig.apiKey) {
        switch (apiConfig.authType) {
          case "API_KEY":
            headers["X-API-Key"] = apiConfig.apiKey;
            break;
          case "BEARER":
            headers["Authorization"] = `Bearer ${apiConfig.apiKey}`;
            break;
          case "BASIC":
            // Would need username:password format
            headers["Authorization"] =
              `Basic ${Buffer.from(apiConfig.apiKey).toString("base64")}`;
            break;
        }
      }

      // Test with a simple endpoint (health check or root)
      const response = await axios.get(apiConfig.baseUrl, {
        headers,
        timeout: 5000,
        validateStatus: () => true, // Accept any status for test
      });

      if (response.status >= 400) {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to connect to API: ${error.message}`);
    }
  }

  /**
   * Test scraping connection
   */
  private async testScrapingConnection(url: string): Promise<void> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Hazalyze/1.0)",
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status >= 400) {
        throw new Error(`Site returned status ${response.status}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to connect to site: ${error.message}`);
    }
  }

  /**
   * Make API request
   */
  async makeAPIRequest(
    apiConfig: {
      baseUrl: string;
      apiKey?: string;
      authType?: "API_KEY" | "OAUTH2" | "BASIC" | "BEARER";
      endpoints?: Record<string, string>;
    },
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any,
  ): Promise<any> {
    const url = apiConfig.endpoints?.[endpoint]
      ? `${apiConfig.baseUrl}${apiConfig.endpoints[endpoint]}`
      : `${apiConfig.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authentication
    if (apiConfig.apiKey) {
      switch (apiConfig.authType) {
        case "API_KEY":
          headers["X-API-Key"] = apiConfig.apiKey;
          break;
        case "BEARER":
          headers["Authorization"] = `Bearer ${apiConfig.apiKey}`;
          break;
        case "BASIC":
          headers["Authorization"] =
            `Basic ${Buffer.from(apiConfig.apiKey).toString("base64")}`;
          break;
      }
    }

    try {
      const response = await axios({
        method,
        url,
        headers,
        data,
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Scrape content from URL
   */
  async scrapeContent(
    url: string,
    selectors: Record<string, string>,
  ): Promise<Record<string, string>> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Hazalyze/1.0)",
        },
        timeout: 10000,
      });

      // Basic HTML parsing (would use Cheerio in production)
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, "text/html");

      const result: Record<string, string> = {};

      for (const [key, selector] of Object.entries(selectors)) {
        const element = doc.querySelector(selector);
        result[key] = element?.textContent?.trim() || "";
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to scrape content: ${error.message}`);
    }
  }
}

export const genericSiteService = new GenericSiteService();
