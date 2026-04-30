/**
 * Intelligent QR Code Service
 * Advanced features inspired by top QR code apps:
 * - Campaign management
 * - A/B testing
 * - Scheduled updates
 * - Multi-URL routing
 * - Geo-targeting
 * - Time-based routing
 * - Device-specific routing
 * - Lead generation
 * - Custom landing pages
 */

import { QRCodeData } from "@/types/qr";
import { documentQRService } from "./documentQRService";
import { qrDatabaseAdapter } from "./database/qrDatabaseAdapter";

export interface QRCampaign {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: "active" | "paused" | "completed" | "draft";
  qrCodes: string[]; // QR IDs
  metrics: {
    totalScans: number;
    uniqueScans: number;
    conversionRate?: number;
  };
}

export interface QRABTest {
  id: string;
  name: string;
  qrId: string;
  variants: Array<{
    id: string;
    url: string;
    weight: number; // Percentage (0-100)
    scans: number;
  }>;
  startDate: string;
  endDate?: string;
  status: "active" | "completed";
  winner?: string; // Variant ID
}

export interface QRGeoRouting {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  url: string;
  fallbackUrl?: string;
}

export interface QRTimeRouting {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone?: string;
  url: string;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
}

export interface QRDeviceRouting {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  ios?: string;
  android?: string;
  fallback?: string;
}

export interface IntelligentQRConfig {
  // Basic config
  documentId: string;
  documentType:
    | "msds"
    | "certificate"
    | "permit"
    | "label"
    | "report"
    | "other";

  // Campaign
  campaignId?: string;
  campaignName?: string;

  // Routing
  geoRouting?: QRGeoRouting[];
  timeRouting?: QRTimeRouting[];
  deviceRouting?: QRDeviceRouting;

  // A/B Testing
  abTestId?: string;
  abTestVariants?: Array<{ url: string; weight: number }>;

  // Scheduling
  scheduledStart?: string;
  scheduledEnd?: string;

  // Lead Generation
  captureLeads?: boolean;
  leadFields?: string[]; // ['name', 'email', 'phone', 'company']

  // Custom Landing Page
  customLandingPage?: {
    title: string;
    description: string;
    ctaText?: string;
    ctaUrl?: string;
    formFields?: string[];
  };

  // Analytics
  analytics?: boolean;
  customEvents?: string[]; // Custom events to track
}

export class IntelligentQRService {
  // Database adapter handles storage with automatic in-memory fallback
  private dbAdapter = qrDatabaseAdapter;

  /**
   * Generate intelligent QR code with advanced features
   */
  async generateIntelligentQR(config: IntelligentQRConfig): Promise<{
    qrCode: string;
    qrImageUrl?: string;
    qrId: string;
    campaignId?: string;
    abTestId?: string;
  }> {
    // Generate base QR code
    const baseQR = await documentQRService.generateDocumentQR({
      documentId: config.documentId,
      documentType: config.documentType,
      dynamic: true,
      analytics: config.analytics !== false,
      customData: {
        intelligent: true,
        campaignId: config.campaignId,
        abTestId: config.abTestId,
        geoRouting: config.geoRouting,
        timeRouting: config.timeRouting,
        deviceRouting: config.deviceRouting,
        scheduledStart: config.scheduledStart,
        scheduledEnd: config.scheduledEnd,
        captureLeads: config.captureLeads,
        customLandingPage: config.customLandingPage,
      },
    });

    // Create campaign if specified
    if (config.campaignId || config.campaignName) {
      const campaignId = config.campaignId || `campaign-${Date.now()}`;
      await this.createCampaign({
        id: campaignId,
        name:
          config.campaignName || `Campaign ${new Date().toLocaleDateString()}`,
        status: "active",
        qrCodes: [baseQR.qrData.id],
        metrics: {
          totalScans: 0,
          uniqueScans: 0,
        },
      });
    }

    // Create A/B test if specified
    if (config.abTestId && config.abTestVariants) {
      await this.createABTest({
        id: config.abTestId,
        name: `A/B Test for ${config.documentId}`,
        qrId: baseQR.qrData.id,
        variants: config.abTestVariants.map((v, idx) => ({
          id: `variant-${idx}`,
          url: v.url,
          weight: v.weight,
          scans: 0,
        })),
        startDate: new Date().toISOString(),
        status: "active",
      });
    }

    return {
      qrCode: baseQR.qrCode,
      qrImageUrl: baseQR.qrImageUrl,
      qrId: baseQR.qrData.id,
      campaignId: config.campaignId,
      abTestId: config.abTestId,
    };
  }

  /**
   * Create QR campaign
   */
  async createCampaign(campaign: QRCampaign): Promise<QRCampaign> {
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  /**
   * Get campaign
   */
  async getCampaign(campaignId: string): Promise<QRCampaign | null> {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * Update campaign metrics
   */
  async updateCampaignMetrics(
    campaignId: string,
    scanData: { isUnique: boolean },
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.metrics.totalScans++;
      if (scanData.isUnique) {
        campaign.metrics.uniqueScans++;
      }
      this.campaigns.set(campaignId, campaign);
    }
  }

  /**
   * Create A/B test
   */
  async createABTest(test: QRABTest): Promise<QRABTest> {
    this.abTests.set(test.id, test);
    return test;
  }

  /**
   * Get A/B test
   */
  async getABTest(testId: string): Promise<QRABTest | null> {
    return this.abTests.get(testId) || null;
  }

  /**
   * Select A/B test variant based on weight
   */
  selectABTestVariant(test: QRABTest): string {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant.url;
      }
    }

    // Fallback to first variant
    return test.variants[0]?.url || "";
  }

  /**
   * Determine routing URL based on intelligent rules
   */
  async determineRoutingURL(
    qrData: QRCodeData,
    context: {
      ip?: string;
      userAgent?: string;
      timestamp?: string;
      country?: string;
      city?: string;
    },
  ): Promise<string> {
    // Check time-based routing
    if (qrData.metadata?.timeRouting) {
      const timeRouting = qrData.metadata.timeRouting as QRTimeRouting[];
      const now = new Date(context.timestamp || new Date().toISOString());
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm
      const currentDay = now.getDay();

      for (const rule of timeRouting) {
        if (
          (!rule.daysOfWeek || rule.daysOfWeek.includes(currentDay)) &&
          currentTime >= rule.startTime &&
          currentTime <= rule.endTime
        ) {
          return rule.url;
        }
      }
    }

    // Check geo-based routing
    if (qrData.metadata?.geoRouting && context.country) {
      const geoRouting = qrData.metadata.geoRouting as QRGeoRouting[];

      // Try exact country match
      const countryMatch = geoRouting.find(
        (r) =>
          r.countryCode === context.country || r.country === context.country,
      );
      if (countryMatch) {
        return countryMatch.url;
      }

      // Try city match
      if (context.city) {
        const cityMatch = geoRouting.find((r) => r.city === context.city);
        if (cityMatch) {
          return cityMatch.url;
        }
      }
    }

    // Check device-based routing
    if (qrData.metadata?.deviceRouting && context.userAgent) {
      const deviceRouting = qrData.metadata.deviceRouting as QRDeviceRouting;
      const ua = context.userAgent.toLowerCase();

      if (ua.includes("mobile") && deviceRouting.mobile) {
        return deviceRouting.mobile;
      }
      if (ua.includes("tablet") && deviceRouting.tablet) {
        return deviceRouting.tablet;
      }
      if (ua.includes("android") && deviceRouting.android) {
        return deviceRouting.android;
      }
      if ((ua.includes("iphone") || ua.includes("ipad")) && deviceRouting.ios) {
        return deviceRouting.ios;
      }
      if (deviceRouting.desktop) {
        return deviceRouting.desktop;
      }
      if (deviceRouting.fallback) {
        return deviceRouting.fallback;
      }
    }

    // Default to QR data URL
    return qrData.url;
  }

  /**
   * Check if QR code is active (within scheduled time)
   */
  isQRActive(qrData: QRCodeData): boolean {
    const now = new Date();

    if (qrData.metadata?.scheduledStart) {
      const start = new Date(qrData.metadata.scheduledStart);
      if (now < start) {
        return false;
      }
    }

    if (qrData.metadata?.scheduledEnd) {
      const end = new Date(qrData.metadata.scheduledEnd);
      if (now > end) {
        return false;
      }
    }

    if (qrData.expiresAt) {
      const expires = new Date(qrData.expiresAt);
      if (now > expires) {
        return false;
      }
    }

    return true;
  }
}

export const intelligentQRService = new IntelligentQRService();
