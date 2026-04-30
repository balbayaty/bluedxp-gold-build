/**
 * Proposal Follow-Up Automation Service
 * Automated email sequences, reminders, engagement-based triggers
 * Comparable to PandaDoc, Proposify follow-up automation
 */

import { eventBus } from "@/lib/services/event-store";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { proposalTrackingService } from "./proposalTrackingService";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface FollowUpRule {
  id: string;
  name: string;
  description: string;
  trigger:
    | "NOT_OPENED"
    | "OPENED_NOT_VIEWED"
    | "VIEWED_NOT_DOWNLOADED"
    | "DOWNLOADED_NOT_SIGNED"
    | "CUSTOM";
  triggerDelay: number; // hours
  conditions?: Record<string, any>;
  actions: Array<{
    type: "EMAIL" | "SMS" | "CALL_REMINDER";
    template: string;
    subject?: string;
    message: string;
    delay?: number; // hours after trigger
  }>;
  enabled: boolean;
  createdAt: Date | string;
}

export interface FollowUpSequence {
  id: string;
  proposalId: string;
  recipientEmail: string;
  rules: FollowUpRule[];
  currentStep: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  sentEmails: Array<{
    ruleId: string;
    sentAt: Date | string;
    opened: boolean;
    clicked: boolean;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// FOLLOW-UP SERVICE
// ============================================================================

class ProposalFollowUpService {
  private rules: Map<string, FollowUpRule> = new Map();
  private sequences: Map<string, FollowUpSequence> = new Map();
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeEventHandlers();
  }

  /**
   * Initialize default follow-up rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: FollowUpRule[] = [
      {
        id: "rule-not-opened-24h",
        name: "Not Opened After 24 Hours",
        description: "Send reminder if proposal not opened within 24 hours",
        trigger: "NOT_OPENED",
        triggerDelay: 24,
        actions: [
          {
            type: "EMAIL",
            template: "follow-up-not-opened",
            subject: "Reminder: Review Your Proposal",
            message:
              "We wanted to make sure you received our proposal. Please let us know if you have any questions.",
          },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "rule-opened-not-viewed-48h",
        name: "Opened But Not Fully Viewed",
        description: "Follow up if opened but not fully viewed after 48 hours",
        trigger: "OPENED_NOT_VIEWED",
        triggerDelay: 48,
        actions: [
          {
            type: "EMAIL",
            template: "follow-up-partial-view",
            subject: "Questions About Your Proposal?",
            message:
              "We noticed you started reviewing our proposal. We're here to answer any questions you may have.",
          },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "rule-viewed-not-downloaded-72h",
        name: "Viewed But Not Downloaded",
        description: "Follow up if viewed but not downloaded after 72 hours",
        trigger: "VIEWED_NOT_DOWNLOADED",
        triggerDelay: 72,
        actions: [
          {
            type: "EMAIL",
            template: "follow-up-not-downloaded",
            subject: "Download Your Proposal",
            message:
              "You can download a copy of the proposal for your records. Let us know if you need any clarifications.",
          },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "rule-downloaded-not-signed-7d",
        name: "Downloaded But Not Signed",
        description: "Follow up if downloaded but not signed after 7 days",
        trigger: "DOWNLOADED_NOT_SIGNED",
        triggerDelay: 168, // 7 days
        actions: [
          {
            type: "EMAIL",
            template: "follow-up-not-signed",
            subject: "Ready to Move Forward?",
            message:
              "We're excited about the opportunity to work with you. Please let us know if you have any questions or concerns.",
          },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
      },
    ];

    defaultRules.forEach((rule) => this.rules.set(rule.id, rule));
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
      "proposals.proposal.opened",
      async (event: DomainEvent) => {
        await this.handleProposalOpened(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.downloaded",
      async (event: DomainEvent) => {
        await this.handleProposalDownloaded(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.signed",
      async (event: DomainEvent) => {
        await this.handleProposalSigned(event);
      },
    );
  }

  /**
   * Start follow-up sequence for proposal
   */
  async startFollowUpSequence(
    proposalId: string,
    recipientEmail: string,
    rules?: FollowUpRule[],
  ): Promise<FollowUpSequence> {
    const activeRules =
      rules || Array.from(this.rules.values()).filter((r) => r.enabled);

    const sequence: FollowUpSequence = {
      id: `sequence-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      proposalId,
      recipientEmail,
      rules: activeRules,
      currentStep: 0,
      status: "ACTIVE",
      sentEmails: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sequences.set(sequence.id, sequence);

    // Schedule first follow-up check
    await this.scheduleFollowUpChecks(sequence);

    return sequence;
  }

  /**
   * Schedule follow-up checks
   */
  private async scheduleFollowUpChecks(
    sequence: FollowUpSequence,
  ): Promise<void> {
    for (const rule of sequence.rules) {
      const delayMs = rule.triggerDelay * 60 * 60 * 1000; // Convert hours to ms

      const timeoutId = setTimeout(async () => {
        await this.checkAndExecuteFollowUp(sequence.id, rule.id);
      }, delayMs);

      this.scheduledTasks.set(`${sequence.id}-${rule.id}`, timeoutId);
    }
  }

  /**
   * Check and execute follow-up
   */
  private async checkAndExecuteFollowUp(
    sequenceId: string,
    ruleId: string,
  ): Promise<void> {
    const sequence = this.sequences.get(sequenceId);
    const rule = this.rules.get(ruleId);

    if (!sequence || !rule || sequence.status !== "ACTIVE") return;

    const tracking = proposalTrackingService.getTracking(sequence.proposalId);
    if (!tracking) return;

    const recipient = tracking.recipients.find(
      (r) => r.email === sequence.recipientEmail,
    );
    if (!recipient) return;

    // Check trigger conditions
    let shouldExecute = false;

    switch (rule.trigger) {
      case "NOT_OPENED":
        shouldExecute = !recipient.opened;
        break;
      case "OPENED_NOT_VIEWED":
        shouldExecute =
          recipient.opened && recipient.viewedSections.length === 0;
        break;
      case "VIEWED_NOT_DOWNLOADED":
        shouldExecute = recipient.opened && !recipient.downloaded;
        break;
      case "DOWNLOADED_NOT_SIGNED":
        shouldExecute = recipient.downloaded && !recipient.signed;
        break;
    }

    if (shouldExecute) {
      // Execute actions
      for (const action of rule.actions) {
        await this.executeAction(sequence, rule, action);
      }

      // Mark as sent
      sequence.sentEmails.push({
        ruleId: rule.id,
        sentAt: new Date().toISOString(),
        opened: false,
        clicked: false,
      });
      sequence.updatedAt = new Date().toISOString();
      this.sequences.set(sequenceId, sequence);
    }
  }

  /**
   * Execute follow-up action
   */
  private async executeAction(
    sequence: FollowUpSequence,
    rule: FollowUpRule,
    action: FollowUpRule["actions"][0],
  ): Promise<void> {
    switch (action.type) {
      case "EMAIL":
        await notificationService.send({
          type: "proposal_follow_up",
          channel: "email",
          recipient: sequence.recipientEmail,
          title: action.subject || "Follow-up on Your Proposal",
          message: action.message,
          data: {
            proposalId: sequence.proposalId,
            ruleId: rule.id,
            template: action.template,
          },
        });
        break;

      case "SMS":
        // Would send SMS via SMS service
        console.log("SMS follow-up:", action.message);
        break;

      case "CALL_REMINDER":
        // Would create call reminder
        console.log("Call reminder created");
        break;
    }
  }

  /**
   * Cancel follow-up sequence
   */
  cancelFollowUpSequence(sequenceId: string): void {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return;

    sequence.status = "CANCELLED";

    // Clear scheduled tasks
    for (const rule of sequence.rules) {
      const timeoutId = this.scheduledTasks.get(`${sequenceId}-${rule.id}`);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.scheduledTasks.delete(`${sequenceId}-${rule.id}`);
      }
    }

    this.sequences.set(sequenceId, sequence);
  }

  /**
   * Event handlers
   */
  private async handleProposalSent(event: DomainEvent): Promise<void> {
    const { proposalId, recipients } = event.payload || {};
    if (proposalId && recipients) {
      for (const recipient of recipients) {
        await this.startFollowUpSequence(
          proposalId,
          recipient.email || recipient,
        );
      }
    }
  }

  private async handleProposalOpened(event: DomainEvent): Promise<void> {
    const { proposalId, recipientEmail } = event.payload || {};
    // Cancel "not opened" follow-ups
    const sequences = Array.from(this.sequences.values()).filter(
      (s) =>
        s.proposalId === proposalId &&
        s.recipientEmail === recipientEmail &&
        s.status === "ACTIVE",
    );

    for (const sequence of sequences) {
      const notOpenedRule = sequence.rules.find(
        (r) => r.trigger === "NOT_OPENED",
      );
      if (notOpenedRule) {
        const timeoutId = this.scheduledTasks.get(
          `${sequence.id}-${notOpenedRule.id}`,
        );
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.scheduledTasks.delete(`${sequence.id}-${notOpenedRule.id}`);
        }
      }
    }
  }

  private async handleProposalDownloaded(event: DomainEvent): Promise<void> {
    const { proposalId, recipientEmail } = event.payload || {};
    // Cancel "not downloaded" follow-ups
    // Similar to handleProposalOpened
  }

  private async handleProposalSigned(event: DomainEvent): Promise<void> {
    const { proposalId, recipientEmail } = event.payload || {};
    // Cancel all follow-ups for this recipient
    const sequences = Array.from(this.sequences.values()).filter(
      (s) =>
        s.proposalId === proposalId &&
        s.recipientEmail === recipientEmail &&
        s.status === "ACTIVE",
    );

    for (const sequence of sequences) {
      this.cancelFollowUpSequence(sequence.id);
    }
  }

  /**
   * Create custom follow-up rule
   */
  async createRule(
    rule: Omit<FollowUpRule, "id" | "createdAt">,
  ): Promise<FollowUpRule> {
    const newRule: FollowUpRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  /**
   * Get follow-up sequence
   */
  getSequence(sequenceId: string): FollowUpSequence | undefined {
    return this.sequences.get(sequenceId);
  }

  /**
   * Get sequences for proposal
   */
  getSequencesForProposal(proposalId: string): FollowUpSequence[] {
    return Array.from(this.sequences.values()).filter(
      (s) => s.proposalId === proposalId,
    );
  }

  /**
   * Get all follow-up rules
   */
  getRules(): FollowUpRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): FollowUpRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Update rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<FollowUpRule>,
  ): Promise<FollowUpRule | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updatedRule: FollowUpRule = {
      ...rule,
      ...updates,
      id: ruleId, // Ensure ID doesn't change
    };

    this.rules.set(ruleId, updatedRule);
    return updatedRule;
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalFollowUpService = new ProposalFollowUpService();
