/**
 * LinkedIn Integration Service
 * OAuth2-based LinkedIn API integration
 * Supports profile, company pages, posts, and messaging
 */

import { BaseIntegrationService } from "./baseIntegrationService";
import type {
  LinkedInIntegration,
  LinkedInProfile,
  LinkedInCompany,
  LinkedInPost,
  IntegrationResponse,
} from "@/types/external-integrations";
import axios from "axios";

export class LinkedInService extends BaseIntegrationService {
  protected integrationType = "LINKEDIN" as const;
  private readonly apiBaseUrl = "https://api.linkedin.com/v2";

  /**
   * Get OAuth authorization URL
   * Uses clientId from config (per-user) or falls back to environment variable
   */
  getAuthUrl(
    redirectUri: string,
    state: string,
    clientId?: string,
    scopes: string[] = ["r_liteprofile", "r_emailaddress"],
  ): string {
    // Use provided clientId or fall back to environment variable
    const effectiveClientId = clientId || process.env.LINKEDIN_CLIENT_ID;
    if (!effectiveClientId) {
      throw new Error(
        "LinkedIn Client ID not configured. Please add your Client ID in the integration settings.",
      );
    }

    const scope = scopes.join(" ");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: effectiveClientId,
      redirect_uri: redirectUri,
      state,
      scope,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * Uses credentials from config (per-user) or falls back to environment variables
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
    clientId?: string,
    clientSecret?: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    // Use provided credentials or fall back to environment variables
    const effectiveClientId = clientId || process.env.LINKEDIN_CLIENT_ID;
    const effectiveClientSecret =
      clientSecret || process.env.LINKEDIN_CLIENT_SECRET;

    if (!effectiveClientId || !effectiveClientSecret) {
      throw new Error(
        "LinkedIn credentials not configured. Please add your Client ID and Secret in the integration settings.",
      );
    }

    try {
      const response = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: effectiveClientId,
          client_secret: effectiveClientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      throw new Error(`Failed to exchange code for token: ${error.message}`);
    }
  }

  /**
   * Connect LinkedIn integration
   */
  async connect(
    integration: Partial<LinkedInIntegration>,
  ): Promise<LinkedInIntegration> {
    if (!integration.config?.accessToken) {
      throw new Error("Access token required for LinkedIn connection");
    }

    // Verify token and get profile
    const profile = await this.getProfile(integration.config.accessToken);

    const linkedInIntegration: LinkedInIntegration = {
      id: integration.id || `linkedin_${Date.now()}`,
      type: "LINKEDIN",
      name:
        integration.name ||
        `LinkedIn - ${profile.firstName} ${profile.lastName}`,
      status: "CONNECTED",
      tenantId: integration.tenantId || "",
      userId: integration.userId,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncAt: new Date(),
      config: {
        ...integration.config,
        profileId: profile.id,
      },
      metadata: {
        profile,
      },
    };

    this.emitEvent(
      "connected",
      { integrationId: linkedInIntegration.id },
      linkedInIntegration.id,
    );
    return linkedInIntegration;
  }

  /**
   * Disconnect LinkedIn integration
   */
  async disconnect(integrationId: string): Promise<void> {
    // Revoke token if possible
    this.emitEvent("disconnected", { integrationId }, integrationId);
  }

  /**
   * Sync LinkedIn data
   */
  async sync(integrationId: string): Promise<void> {
    // Sync profile, posts, connections, etc.
    // This fetches latest data from LinkedIn API
    // IntegrationManager will provide the integration config with accessToken
    this.emitEvent("sync_started", { integrationId }, integrationId);

    // Actual sync logic would be implemented here based on integration config
    // For now, emit sync completed event
    this.emitEvent("sync_completed", { integrationId }, integrationId);
  }

  /**
   * Get integration status
   */
  async getStatus(
    integrationId: string,
  ): Promise<"CONNECTED" | "DISCONNECTED" | "PENDING" | "ERROR" | "EXPIRED"> {
    // Check token validity
    return "CONNECTED";
  }

  /**
   * Get data from LinkedIn
   */
  async getData(
    integrationId: string,
    options?: Record<string, any>,
  ): Promise<any> {
    // This method is called by IntegrationManager which provides the integration config
    // Options may include: accessToken, type (posts, profile, etc.), limit
    const accessToken = options?.accessToken;
    const dataType = options?.type || "posts";
    const limit = options?.limit || 5;

    if (!accessToken) {
      return { error: "Access token required" };
    }

    switch (dataType) {
      case "posts":
        const posts = await this.getPosts(accessToken, limit);
        return { posts, total: posts.length };
      case "profile":
        const profile = await this.getProfile(accessToken);
        return { profile };
      default:
        return { error: `Unknown data type: ${dataType}` };
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(
    integrationId: string,
    config: Record<string, any>,
  ): Promise<LinkedInIntegration> {
    // This method is called by IntegrationManager which handles database updates
    // IntegrationManager will get the integration from database, merge config, and save
    // We just return a structure indicating the config was updated
    // The actual database update is handled by IntegrationManager.updateIntegrationConfig()
    return {
      id: integrationId,
      type: "LINKEDIN",
      name: "LinkedIn Integration",
      status: "CONNECTED",
      tenantId: "",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: config, // Return merged config (IntegrationManager handles the merge)
    } as LinkedInIntegration;
  }

  /**
   * Get LinkedIn profile
   */
  async getProfile(accessToken: string): Promise<LinkedInProfile> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          projection:
            "(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
        },
      });

      return {
        id: response.data.id,
        firstName: response.data.firstName?.localized?.en_US || "",
        lastName: response.data.lastName?.localized?.en_US || "",
        headline: response.data.headline,
        profilePicture:
          response.data.profilePicture?.displayImage?.elements?.[0]
            ?.identifiers?.[0]?.identifier,
      };
    } catch (error: any) {
      throw new Error(`Failed to get LinkedIn profile: ${error.message}`);
    }
  }

  /**
   * Get LinkedIn posts
   * Uses accessToken from integration config
   */
  async getPosts(
    accessToken: string,
    limit: number = 10,
  ): Promise<LinkedInPost[]> {
    try {
      // Note: LinkedIn API v2 has restrictions on post access
      // This is a simplified example
      const response = await axios.get(`${this.apiBaseUrl}/ugcPosts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          q: "authors",
          count: limit,
        },
      });

      // Transform LinkedIn API response to our format
      return (response.data.elements || []).map((post: any) => ({
        id: post.id,
        text: post.specificContent?.shareContent?.shareCommentary?.text || "",
        author: post.author || "",
        timestamp: new Date(post.created?.time || Date.now()),
        url: post.shareUrl,
      }));
    } catch (error: any) {
      console.warn(
        "LinkedIn posts API may require additional permissions:",
        error.message,
      );
      return [];
    }
  }

  /**
   * Refresh access token
   * Uses credentials from config (per-user) or falls back to environment variables
   */
  async refreshToken(
    refreshToken: string,
    clientId?: string,
    clientSecret?: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    // Use provided credentials or fall back to environment variables
    const effectiveClientId = clientId || process.env.LINKEDIN_CLIENT_ID;
    const effectiveClientSecret =
      clientSecret || process.env.LINKEDIN_CLIENT_SECRET;

    if (!effectiveClientId || !effectiveClientSecret) {
      throw new Error(
        "LinkedIn credentials not configured. Please add your Client ID and Secret in the integration settings.",
      );
    }

    try {
      const response = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: effectiveClientId,
          client_secret: effectiveClientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }
}

export const linkedInService = new LinkedInService();
