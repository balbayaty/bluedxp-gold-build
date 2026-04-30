/**
 * Proposal Tracking Service
 * Comprehensive tracking: opens, views, time spent, downloads, engagement
 * Comparable to PandaDoc, Proposify tracking capabilities
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalTracking {
  proposalId: string;
  sentAt: Date | string;
  recipients: Array<{
    email: string;
    name?: string;
    opened: boolean;
    openedAt?: Date | string;
    openedCount: number;
    lastOpenedAt?: Date | string;
    viewedSections: string[]; // Section IDs
    timeSpent: number; // Total seconds
    sectionTimeSpent: Record<string, number>; // sectionId -> seconds
    downloaded: boolean;
    downloadedAt?: Date | string;
    downloadCount: number;
    clickedLinks: Array<{
      url: string;
      clickedAt: Date | string;
      count: number;
    }>;
    signed: boolean;
    signedAt?: Date | string;
    deviceInfo?: {
      device: string;
      browser: string;
      os: string;
      ipAddress: string;
    };
  }>;
  engagementScore: number; // 0-100
  averageTimeSpent: number; // seconds
  mostViewedSection?: string;
  leastViewedSection?: string;
  conversionProbability?: number; // 0-100
}

export interface ProposalEngagementHeatmap {
  proposalId: string;
  sections: Array<{
    sectionId: string;
    sectionTitle: string;
    viewCount: number;
    averageTimeSpent: number;
    uniqueViewers: number;
    scrollDepth: number; // 0-100
    engagementScore: number; // 0-100
  }>;
  overallEngagement: number; // 0-100
}

// ============================================================================
// TRACKING SERVICE
// ============================================================================

class ProposalTrackingService {
  private tracking: Map<string, ProposalTracking> = new Map();
  private heatmaps: Map<string, ProposalEngagementHeatmap> = new Map();

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    eventBus.subscribe(
      "proposals.proposal.sent",
      async (event: DomainEvent) => {
        await this.handleProposalSent(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.viewed",
      async (event: DomainEvent) => {
        await this.handleProposalViewed(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.downloaded",
      async (event: DomainEvent) => {
        await this.handleProposalDownloaded(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.link.clicked",
      async (event: DomainEvent) => {
        await this.handleLinkClicked(event);
      },
    );
  }

  /**
   * Initialize tracking for sent proposal
   */
  async initializeTracking(
    proposalId: string,
    recipients: Array<{ email: string; name?: string }>,
  ): Promise<ProposalTracking> {
    const tracking: ProposalTracking = {
      proposalId,
      sentAt: new Date().toISOString(),
      recipients: recipients.map((r) => ({
        email: r.email,
        name: r.name,
        opened: false,
        openedCount: 0,
        viewedSections: [],
        timeSpent: 0,
        sectionTimeSpent: {},
        downloaded: false,
        downloadCount: 0,
        clickedLinks: [],
        signed: false,
      })),
      engagementScore: 0,
      averageTimeSpent: 0,
    };

    this.tracking.set(proposalId, tracking);
    return tracking;
  }

  /**
   * Track proposal open
   */
  async trackOpen(
    proposalId: string,
    recipientEmail: string,
    deviceInfo?: ProposalTracking["recipients"][0]["deviceInfo"],
  ): Promise<void> {
    const tracking = this.tracking.get(proposalId);
    if (!tracking) return;

    const recipient = tracking.recipients.find(
      (r) => r.email === recipientEmail,
    );
    if (!recipient) return;

    const now = new Date().toISOString();
    recipient.opened = true;
    recipient.openedCount += 1;
    if (!recipient.openedAt) {
      recipient.openedAt = now;
    }
    recipient.lastOpenedAt = now;
    if (deviceInfo) {
      recipient.deviceInfo = deviceInfo;
    }

    // Update engagement score
    tracking.engagementScore = this.calculateEngagementScore(tracking);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.opened",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: now,
      payload: { proposalId, recipientEmail, openedAt: now },
    });
  }

  /**
   * Track section view
   */
  async trackSectionView(
    proposalId: string,
    recipientEmail: string,
    sectionId: string,
    timeSpent: number,
  ): Promise<void> {
    const tracking = this.tracking.get(proposalId);
    if (!tracking) return;

    const recipient = tracking.recipients.find(
      (r) => r.email === recipientEmail,
    );
    if (!recipient) return;

    if (!recipient.viewedSections.includes(sectionId)) {
      recipient.viewedSections.push(sectionId);
    }

    recipient.timeSpent += timeSpent;
    recipient.sectionTimeSpent[sectionId] =
      (recipient.sectionTimeSpent[sectionId] || 0) + timeSpent;

    // Update heatmap
    await this.updateHeatmap(proposalId);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.section.viewed",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, recipientEmail, sectionId, timeSpent },
    });
  }

  /**
   * Track download
   */
  async trackDownload(
    proposalId: string,
    recipientEmail: string,
  ): Promise<void> {
    const tracking = this.tracking.get(proposalId);
    if (!tracking) return;

    const recipient = tracking.recipients.find(
      (r) => r.email === recipientEmail,
    );
    if (!recipient) return;

    recipient.downloaded = true;
    recipient.downloadCount += 1;
    if (!recipient.downloadedAt) {
      recipient.downloadedAt = new Date().toISOString();
    }

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.downloaded",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, recipientEmail },
    });
  }

  /**
   * Track link click
   */
  async trackLinkClick(
    proposalId: string,
    recipientEmail: string,
    url: string,
  ): Promise<void> {
    const tracking = this.tracking.get(proposalId);
    if (!tracking) return;

    const recipient = tracking.recipients.find(
      (r) => r.email === recipientEmail,
    );
    if (!recipient) return;

    const existingClick = recipient.clickedLinks.find((c) => c.url === url);
    if (existingClick) {
      existingClick.count += 1;
      existingClick.clickedAt = new Date().toISOString();
    } else {
      recipient.clickedLinks.push({
        url,
        clickedAt: new Date().toISOString(),
        count: 1,
      });
    }

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.link.clicked",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, recipientEmail, url },
    });
  }

  /**
   * Track signature
   */
  async trackSignature(
    proposalId: string,
    recipientEmail: string,
  ): Promise<void> {
    const tracking = this.tracking.get(proposalId);
    if (!tracking) return;

    const recipient = tracking.recipients.find(
      (r) => r.email === recipientEmail,
    );
    if (!recipient) return;

    recipient.signed = true;
    recipient.signedAt = new Date().toISOString();

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.signed",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, recipientEmail },
    });
  }

  /**
   * Get tracking data
   */
  getTracking(proposalId: string): ProposalTracking | undefined {
    return this.tracking.get(proposalId);
  }

  /**
   * Get engagement heatmap
   */
  getHeatmap(proposalId: string): ProposalEngagementHeatmap | undefined {
    return this.heatmaps.get(proposalId);
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(tracking: ProposalTracking): number {
    let score = 0;
    const totalRecipients = tracking.recipients.length;

    if (totalRecipients === 0) return 0;

    // Open rate (40% weight)
    const openedCount = tracking.recipients.filter((r) => r.opened).length;
    score += (openedCount / totalRecipients) * 40;

    // Average time spent (30% weight)
    const avgTime =
      tracking.recipients.reduce((sum, r) => sum + r.timeSpent, 0) /
      totalRecipients;
    const timeScore = Math.min(100, (avgTime / 300) * 100); // 5 minutes = 100%
    score += (timeScore / 100) * 30;

    // Download rate (20% weight)
    const downloadedCount = tracking.recipients.filter(
      (r) => r.downloaded,
    ).length;
    score += (downloadedCount / totalRecipients) * 20;

    // Link clicks (10% weight)
    const totalClicks = tracking.recipients.reduce(
      (sum, r) => sum + r.clickedLinks.length,
      0,
    );
    const clickScore = Math.min(100, (totalClicks / totalRecipients) * 10); // 10 clicks per recipient = 100%
    score += (clickScore / 100) * 10;

    return Math.round(score);
  }

  /**
   * Update engagement heatmap
   */
  private async updateHeatmap(proposalId: string): Promise<void> {
    const tracking = this.tracking.get(proposalId);
    if (!tracking) return;

    // Get proposal sections (would fetch from proposal service)
    // For now, use section IDs from tracking
    const sectionIds = new Set<string>();
    tracking.recipients.forEach((r) => {
      r.viewedSections.forEach((s) => sectionIds.add(s));
    });

    const sections = Array.from(sectionIds).map((sectionId) => {
      const viewCount = tracking.recipients.filter((r) =>
        r.viewedSections.includes(sectionId),
      ).length;
      const totalTime = tracking.recipients.reduce(
        (sum, r) => sum + (r.sectionTimeSpent[sectionId] || 0),
        0,
      );
      const avgTime = viewCount > 0 ? totalTime / viewCount : 0;
      const uniqueViewers = viewCount;

      return {
        sectionId,
        sectionTitle: sectionId, // Would get from proposal
        viewCount,
        averageTimeSpent: avgTime,
        uniqueViewers,
        scrollDepth: 100, // Would calculate from actual scroll data
        engagementScore: Math.min(
          100,
          (viewCount / tracking.recipients.length) * 100 + (avgTime / 60) * 20,
        ),
      };
    });

    const heatmap: ProposalEngagementHeatmap = {
      proposalId,
      sections,
      overallEngagement: tracking.engagementScore,
    };

    this.heatmaps.set(proposalId, heatmap);
  }

  /**
   * Calculate conversion probability
   */
  calculateConversionProbability(tracking: ProposalTracking): number {
    // Factors:
    // - Engagement score (40%)
    // - Time spent (30%)
    // - Sections viewed (20%)
    // - Downloads (10%)

    const engagementWeight = tracking.engagementScore * 0.4;
    const timeWeight =
      Math.min(100, (tracking.averageTimeSpent / 300) * 100) * 0.3;
    const sectionsWeight =
      Math.min(100, (tracking.recipients[0]?.viewedSections.length || 0) * 10) *
      0.2;
    const downloadWeight =
      (tracking.recipients.filter((r) => r.downloaded).length /
        tracking.recipients.length) *
      100 *
      0.1;

    return Math.round(
      engagementWeight + timeWeight + sectionsWeight + downloadWeight,
    );
  }

  /**
   * Event handlers
   */
  private async handleProposalSent(event: DomainEvent): Promise<void> {
    const { proposalId, recipients } = event.payload || {};
    if (proposalId && recipients) {
      await this.initializeTracking(proposalId, recipients);
    }
  }

  private async handleProposalViewed(event: DomainEvent): Promise<void> {
    const { proposalId, recipientEmail, sectionId, timeSpent } =
      event.payload || {};
    if (proposalId && recipientEmail && sectionId) {
      await this.trackSectionView(
        proposalId,
        recipientEmail,
        sectionId,
        timeSpent || 0,
      );
    }
  }

  private async handleProposalDownloaded(event: DomainEvent): Promise<void> {
    const { proposalId, recipientEmail } = event.payload || {};
    if (proposalId && recipientEmail) {
      await this.trackDownload(proposalId, recipientEmail);
    }
  }

  private async handleLinkClicked(event: DomainEvent): Promise<void> {
    const { proposalId, recipientEmail, url } = event.payload || {};
    if (proposalId && recipientEmail && url) {
      await this.trackLinkClick(proposalId, recipientEmail, url);
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalTrackingService = new ProposalTrackingService();
