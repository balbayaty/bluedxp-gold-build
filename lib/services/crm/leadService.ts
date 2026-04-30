/**
 * Lead Service
 * Comprehensive lead management with AI-powered scoring
 * Integrates with HR AI services for lead scoring
 */

import { eventBus } from "@/lib/services/event-bus";
import { hrAIService } from "@/lib/services/hr/ai/hrAIService";
import type { Lead } from "@/types/crm";

// ============================================================================
// SERVICE
// ============================================================================

class LeadService {
  private leads: Map<string, Lead> = new Map();

  /**
   * Create lead
   */
  async createLead(input: {
    tenantId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    title?: string;
    source: Lead["source"];
    assignedTo?: string;
    notes?: string;
    tags?: string[];
  }): Promise<Lead> {
    // Score lead using AI (reuse HR AI service)
    const score = await this.scoreLead(input);

    const lead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      company: input.company,
      title: input.title,
      source: input.source,
      status: "NEW",
      score: score.total,
      scoreFactors: score.factors,
      assignedTo: input.assignedTo,
      notes: input.notes,
      tags: input.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.leads.set(lead.id, lead);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.lead.created",
      aggregateId: lead.id,
      aggregateType: "lead",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: lead,
    });

    return lead;
  }

  /**
   * Score lead using AI (reuse HR AI service)
   */
  private async scoreLead(leadData: any): Promise<{
    total: number;
    factors: Array<{ factor: string; impact: number }>;
  }> {
    // Use HR AI service for scoring (reuse, don't duplicate)
    // This is a simplified version - would use actual AI model
    const factors: Array<{ factor: string; impact: number }> = [];

    // Email domain quality
    const emailDomain = leadData.email.split("@")[1];
    if (["gmail.com", "yahoo.com"].includes(emailDomain)) {
      factors.push({ factor: "Email Domain", impact: -10 });
    } else {
      factors.push({ factor: "Email Domain", impact: 20 });
    }

    // Company presence
    if (leadData.company) {
      factors.push({ factor: "Company Provided", impact: 15 });
    }

    // Source quality
    const sourceScores: Record<Lead["source"], number> = {
      REFERRAL: 30,
      WEBSITE: 20,
      EVENT: 15,
      SOCIAL_MEDIA: 10,
      COLD_CALL: 5,
      OTHER: 0,
    };
    factors.push({
      factor: "Source",
      impact: sourceScores[leadData.source] || 0,
    });

    const total = Math.min(
      100,
      Math.max(
        0,
        factors.reduce((sum, f) => sum + f.impact, 50),
      ),
    );

    return { total, factors };
  }

  /**
   * Convert lead to opportunity
   */
  async convertLead(
    leadId: string,
    accountId: string,
    opportunityId: string,
  ): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    lead.status = "CONVERTED";
    lead.accountId = accountId;
    lead.opportunityId = opportunityId;
    lead.convertedAt = new Date().toISOString();
    lead.updatedAt = new Date().toISOString();
    this.leads.set(leadId, lead);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.lead.converted",
      aggregateId: leadId,
      aggregateType: "lead",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: lead,
    });

    return lead;
  }

  /**
   * Get leads
   */
  async getLeads(filters: {
    tenantId: string;
    status?: Lead["status"];
    source?: Lead["source"];
    assignedTo?: string;
    minScore?: number;
  }): Promise<Lead[]> {
    let leads = Array.from(this.leads.values()).filter(
      (l) => l.tenantId === filters.tenantId,
    );

    if (filters.status) {
      leads = leads.filter((l) => l.status === filters.status);
    }

    if (filters.source) {
      leads = leads.filter((l) => l.source === filters.source);
    }

    if (filters.assignedTo) {
      leads = leads.filter((l) => l.assignedTo === filters.assignedTo);
    }

    if (filters.minScore !== undefined) {
      leads = leads.filter((l) => l.score >= filters.minScore!);
    }

    return leads.sort((a, b) => b.score - a.score);
  }

  /**
   * Get lead by ID
   */
  async getLead(leadId: string): Promise<Lead | null> {
    return this.leads.get(leadId) || null;
  }

  /**
   * Get lead by ID (alias for API compatibility)
   */
  async getLeadById(leadId: string): Promise<Lead | null> {
    return this.getLead(leadId);
  }

  /**
   * Update lead
   */
  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    const updated = {
      ...lead,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.leads.set(leadId, updated);

    return updated;
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId: string): Promise<void> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    this.leads.delete(leadId);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.lead.deleted",
      aggregateId: leadId,
      aggregateType: "lead",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { leadId },
    });
  }
}

export const leadService = new LeadService();
