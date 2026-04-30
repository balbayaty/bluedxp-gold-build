/**
 * Google Workspace Integration Service
 *
 * Handles Google Workspace OAuth and data synchronization
 * Supports: Calendar, Drive, Gmail, Tasks, Contacts
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import {
  encryptToken,
  decryptToken,
} from "@/lib/services/workspace/utils/tokenEncryption";
import type {
  GoogleWorkspaceIntegration,
  GoogleWorkspaceSyncResult,
} from "@/types/workspace";

export class GoogleWorkspaceService {
  private readonly GOOGLE_OAUTH_URL =
    "https://accounts.google.com/o/oauth2/v2/auth";
  private readonly GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
  private readonly GOOGLE_API_BASE = "https://www.googleapis.com";

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(
    redirectUri: string,
    scopes: string[] = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/tasks.readonly",
      "https://www.googleapis.com/auth/contacts.readonly",
    ],
  ): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID not configured");
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
    });

    return `${this.GOOGLE_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const response = await fetch(this.GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Connect Google Workspace
   */
  async connectGoogleWorkspace(
    userId: string,
    authCode: string,
    redirectUri: string,
    scopes: string[],
  ): Promise<GoogleWorkspaceIntegration> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(authCode, redirectUri);

      // Calculate expiration
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokens.expiresIn);

      // Determine enabled services from scopes
      const calendarEnabled = scopes.some((s) => s.includes("calendar"));
      const driveEnabled = scopes.some((s) => s.includes("drive"));
      const gmailEnabled = scopes.some((s) => s.includes("gmail"));
      const tasksEnabled = scopes.some((s) => s.includes("tasks"));
      const contactsEnabled = scopes.some((s) => s.includes("contacts"));

      // Create or update integration
      const integration = await prisma.googleWorkspaceIntegration.upsert({
        where: { userId },
        update: {
          accessToken: encryptToken(tokens.accessToken),
          refreshToken: encryptToken(tokens.refreshToken),
          tokenExpiresAt,
          scopes,
          calendarEnabled,
          driveEnabled,
          gmailEnabled,
          tasksEnabled,
          contactsEnabled,
          isActive: true,
        },
        create: {
          userId,
          tenantId: user.tenantId,
          accessToken: encryptToken(tokens.accessToken),
          refreshToken: encryptToken(tokens.refreshToken),
          tokenExpiresAt,
          scopes,
          calendarEnabled,
          driveEnabled,
          gmailEnabled,
          tasksEnabled,
          contactsEnabled,
          isActive: true,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "GoogleWorkspaceConnected",
        aggregateId: userId,
        aggregateType: "User",
        payload: {
          userId,
          services: {
            calendar: calendarEnabled,
            drive: driveEnabled,
            gmail: gmailEnabled,
            tasks: tasksEnabled,
            contacts: contactsEnabled,
          },
        },
        metadata: {
          tenantId: user.tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        ...integration,
        accessToken: "[ENCRYPTED]",
        refreshToken: "[ENCRYPTED]",
      } as any;
    } catch (error) {
      console.error("[GoogleWorkspaceService] Error connecting:", error);
      throw error;
    }
  }

  /**
   * Disconnect Google Workspace
   */
  async disconnectGoogleWorkspace(userId: string): Promise<boolean> {
    try {
      await prisma.googleWorkspaceIntegration.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      // Publish event
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });

      if (user) {
        await eventBus.publish({
          type: "GoogleWorkspaceDisconnected",
          aggregateId: userId,
          aggregateType: "User",
          payload: { userId },
          metadata: {
            tenantId: user.tenantId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return true;
    } catch (error) {
      console.error("[GoogleWorkspaceService] Error disconnecting:", error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(userId: string): Promise<string> {
    try {
      const integration = await prisma.googleWorkspaceIntegration.findUnique({
        where: { userId },
      });

      if (!integration || !integration.isActive) {
        throw new Error("Google Workspace not connected");
      }

      const refreshToken = decryptToken(integration.refreshToken);

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error("Google OAuth credentials not configured");
      }

      const response = await fetch(this.GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      const expiresIn = data.expires_in || 3600;

      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn);

      await prisma.googleWorkspaceIntegration.update({
        where: { userId },
        data: {
          accessToken: encryptToken(newAccessToken),
          tokenExpiresAt,
        },
      });

      return newAccessToken;
    } catch (error) {
      console.error("[GoogleWorkspaceService] Error refreshing token:", error);
      throw error;
    }
  }

  /**
   * Get access token (refresh if needed)
   */
  async getAccessToken(userId: string): Promise<string> {
    const integration = await prisma.googleWorkspaceIntegration.findUnique({
      where: { userId },
    });

    if (!integration || !integration.isActive) {
      throw new Error("Google Workspace not connected");
    }

    // Check if token is expired (with 5 min buffer)
    const now = new Date();
    const expiresAt = new Date(integration.tokenExpiresAt);
    expiresAt.setMinutes(expiresAt.getMinutes() - 5);

    if (now >= expiresAt) {
      return await this.refreshToken(userId);
    }

    return decryptToken(integration.accessToken);
  }

  /**
   * Sync Google Calendar
   */
  async syncGoogleCalendar(
    userId: string,
  ): Promise<{ events: number; lastSync: Date }> {
    try {
      const accessToken = await this.getAccessToken(userId);

      // Get calendar events
      const response = await fetch(
        `${this.GOOGLE_API_BASE}/calendar/v3/calendars/primary/events?maxResults=50&timeMin=${new Date().toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch calendar events");
      }

      const data = await response.json();
      const events = data.items || [];

      // Update last sync
      await prisma.googleWorkspaceIntegration.update({
        where: { userId },
        data: { lastSyncedAt: new Date() },
      });

      return {
        events: events.length,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error("[GoogleWorkspaceService] Error syncing calendar:", error);
      throw error;
    }
  }

  /**
   * Sync Google Drive
   */
  async syncGoogleDrive(
    userId: string,
  ): Promise<{ files: number; lastSync: Date }> {
    try {
      const accessToken = await this.getAccessToken(userId);

      // Get recent files
      const response = await fetch(
        `${this.GOOGLE_API_BASE}/drive/v3/files?orderBy=modifiedTime desc&pageSize=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch drive files");
      }

      const data = await response.json();
      const files = data.files || [];

      // Update last sync
      await prisma.googleWorkspaceIntegration.update({
        where: { userId },
        data: { lastSyncedAt: new Date() },
      });

      return {
        files: files.length,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error("[GoogleWorkspaceService] Error syncing drive:", error);
      throw error;
    }
  }

  /**
   * Sync Gmail
   */
  async syncGmail(userId: string): Promise<{ emails: number; lastSync: Date }> {
    try {
      const accessToken = await this.getAccessToken(userId);

      // Get unread emails
      const response = await fetch(
        `${this.GOOGLE_API_BASE}/gmail/v1/users/me/messages?q=is:unread&maxResults=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }

      const data = await response.json();
      const emails = data.messages || [];

      // Update last sync
      await prisma.googleWorkspaceIntegration.update({
        where: { userId },
        data: { lastSyncedAt: new Date() },
      });

      return {
        emails: emails.length,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error("[GoogleWorkspaceService] Error syncing Gmail:", error);
      throw error;
    }
  }

  /**
   * Sync Google Tasks
   */
  async syncGoogleTasks(
    userId: string,
  ): Promise<{ tasks: number; lastSync: Date }> {
    try {
      const accessToken = await this.getAccessToken(userId);

      // Get task lists
      const listsResponse = await fetch(
        `${this.GOOGLE_API_BASE}/tasks/v1/users/@me/lists`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!listsResponse.ok) {
        throw new Error("Failed to fetch task lists");
      }

      const listsData = await listsResponse.json();
      const lists = listsData.items || [];

      // Get tasks from default list
      const defaultList =
        lists.find((l: any) => l.id === "@default") || lists[0];
      if (!defaultList) {
        return { tasks: 0, lastSync: new Date() };
      }

      const tasksResponse = await fetch(
        `${this.GOOGLE_API_BASE}/tasks/v1/lists/${defaultList.id}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!tasksResponse.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const tasksData = await tasksResponse.json();
      const tasks = tasksData.items || [];

      // Update last sync
      await prisma.googleWorkspaceIntegration.update({
        where: { userId },
        data: { lastSyncedAt: new Date() },
      });

      return {
        tasks: tasks.length,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error("[GoogleWorkspaceService] Error syncing tasks:", error);
      throw error;
    }
  }

  /**
   * Sync all Google Workspace services
   */
  async syncAll(userId: string): Promise<GoogleWorkspaceSyncResult> {
    try {
      const integration = await prisma.googleWorkspaceIntegration.findUnique({
        where: { userId },
      });

      if (!integration || !integration.isActive) {
        throw new Error("Google Workspace not connected");
      }

      const result: GoogleWorkspaceSyncResult = {};

      if (integration.calendarEnabled) {
        result.calendar = await this.syncGoogleCalendar(userId);
      }

      if (integration.driveEnabled) {
        result.drive = await this.syncGoogleDrive(userId);
      }

      if (integration.gmailEnabled) {
        result.gmail = await this.syncGmail(userId);
      }

      if (integration.tasksEnabled) {
        result.tasks = await this.syncGoogleTasks(userId);
      }

      return result;
    } catch (error) {
      console.error("[GoogleWorkspaceService] Error syncing all:", error);
      throw error;
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(
    userId: string,
  ): Promise<GoogleWorkspaceIntegration | null> {
    try {
      const integration = await prisma.googleWorkspaceIntegration.findUnique({
        where: { userId },
      });

      if (!integration) {
        return null;
      }

      return {
        ...integration,
        accessToken: "[ENCRYPTED]",
        refreshToken: "[ENCRYPTED]",
      } as any;
    } catch (error) {
      console.error("[GoogleWorkspaceService] Error getting status:", error);
      return null;
    }
  }
}

export const googleWorkspaceService = new GoogleWorkspaceService();
