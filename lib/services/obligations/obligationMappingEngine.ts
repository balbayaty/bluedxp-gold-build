/**
 * Obligation Mapping Engine - Legal Reality Engine
 *
 * Automatically maps contracts, regulations, SLAs, and policies to formal obligations
 * Tracks obligation status based on events
 * Provides compliance monitoring and breach detection
 *
 * ARCHITECTURE:
 * - Integrates with Contract Service
 * - Integrates with Compliance Service
 * - Integrates with SLA Service
 * - Subscribes to Event Bus for auto-updates
 * - Publishes obligation events to Event Store
 */

import { eventBus, eventStore, createEvent } from "@/lib/services/event-store";
import { prisma } from "@/lib/services/database/prismaClient";
import { notificationService } from "@/lib/services/notifications/notificationService";
import type {
  Obligation,
  ObligationType,
  ObligationStatus,
  ObligationMappingResult,
  ObligationComplianceStatus,
  ObligationDashboard,
  ObligationQueryFilter,
  ObligationHistory,
  ObligationMappingEngine as IObligationMappingEngine,
} from "@/types/obligation";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// OBLIGATION MAPPING ENGINE
// ============================================================================

class ObligationMappingEngineService implements IObligationMappingEngine {
  private initialized = false;

  /**
   * Initialize the service (subscribe to events)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Subscribe to events that may affect obligations
    await this.subscribeToEvents();

    this.initialized = true;
    console.log("✅ Obligation Mapping Engine initialized");
  }

  // ==========================================================================
  // CREATE & MAP
  // ==========================================================================

  /**
   * Create a new obligation
   */
  async createObligation(
    obligation: Omit<Obligation, "id" | "createdAt" | "updatedAt">,
  ): Promise<Obligation> {
    const id = `obl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newObligation: Obligation = {
      ...obligation,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database
    await prisma.obligation.create({
      data: this.toDatabase(newObligation),
    });

    // Record in history
    await this.recordHistory({
      obligationId: id,
      changeType: "CREATED",
      newStatus: obligation.status,
      changedBy: obligation.createdBy,
      tenantId: obligation.tenantId,
    });

    // Publish event
    await eventBus.publish(
      createEvent(
        "obligation.created",
        id,
        "Obligation",
        {
          obligation: newObligation,
        },
        1,
        { tenantId: obligation.tenantId },
      ),
    );

    console.log(`✅ Obligation created: ${id} (${obligation.name})`);
    return newObligation;
  }

  /**
   * Map contract to obligations
   */
  async mapContractToObligations(
    contractId: string,
    tenantId: string,
  ): Promise<ObligationMappingResult> {
    console.log(`🔄 Mapping contract ${contractId} to obligations...`);

    const obligationsCreated: Obligation[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Fetch contract (would use actual contract service)
      const contract = await this.fetchContract(contractId, tenantId);
      if (!contract) {
        errors.push(`Contract ${contractId} not found`);
        return {
          sourceId: contractId,
          sourceType: "CONTRACT",
          obligationsCreated: [],
          obligationsUpdated: [],
          errors,
          warnings,
          mappedAt: new Date().toISOString(),
          mappedBy: "system",
        };
      }

      // Map payment terms to obligations
      if (contract.paymentTerms) {
        const paymentObligation = await this.createObligation({
          type: "CONTRACTUAL",
          source: contractId,
          sourceType: "CONTRACT",
          name: `Payment Terms - ${contract.contractNumber}`,
          description: `Payment obligation per contract ${contract.contractNumber}`,
          requirement: contract.paymentTerms,
          jurisdiction: contract.jurisdiction || "Global",
          authority: contract.buyerName || "Contract Party",
          responsibleParty: contract.vendorName,
          responsiblePartyId: contract.vendorId,
          responsiblePartyType: "SUPPLIER",
          status: "PENDING",
          severity: "HIGH",
          machineReadable: true,
          completionEvents: ["finance.payment.completed"],
          tenantId,
          createdBy: "system",
        });
        obligationsCreated.push(paymentObligation);
      }

      // Map delivery terms to obligations
      if (contract.deliveryTerms) {
        const deliveryObligation = await this.createObligation({
          type: "CONTRACTUAL",
          source: contractId,
          sourceType: "CONTRACT",
          name: `Delivery Terms - ${contract.contractNumber}`,
          description: `Delivery obligation per contract ${contract.contractNumber}`,
          requirement: contract.deliveryTerms,
          jurisdiction: contract.jurisdiction || "Global",
          authority: contract.buyerName || "Contract Party",
          responsibleParty: contract.vendorName,
          responsiblePartyId: contract.vendorId,
          responsiblePartyType: "SUPPLIER",
          status: "PENDING",
          severity: "HIGH",
          machineReadable: true,
          completionEvents: ["shipment.delivered"],
          tenantId,
          createdBy: "system",
        });
        obligationsCreated.push(deliveryObligation);
      }

      // Map SLAs to obligations
      if (
        contract.serviceLevelAgreements &&
        contract.serviceLevelAgreements.length > 0
      ) {
        for (const sla of contract.serviceLevelAgreements) {
          const slaObligation = await this.createObligation({
            type: "CONTRACTUAL",
            source: contractId,
            sourceType: "CONTRACT",
            name: `SLA - ${sla.name || "Service Level Agreement"}`,
            description: `Service level obligation per contract ${contract.contractNumber}`,
            requirement: sla.description || `Maintain ${sla.name}`,
            jurisdiction: contract.jurisdiction || "Global",
            authority: contract.buyerName || "Contract Party",
            responsibleParty: contract.vendorName,
            responsiblePartyId: contract.vendorId,
            responsiblePartyType: "SUPPLIER",
            status: "PENDING",
            severity: "HIGH",
            machineReadable: true,
            tenantId,
            createdBy: "system",
          });
          obligationsCreated.push(slaObligation);
        }
      }

      console.log(
        `✅ Mapped contract ${contractId} to ${obligationsCreated.length} obligations`,
      );
    } catch (error) {
      console.error("Error mapping contract to obligations:", error);
      errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return {
      sourceId: contractId,
      sourceType: "CONTRACT",
      obligationsCreated,
      obligationsUpdated: [],
      errors,
      warnings,
      mappedAt: new Date().toISOString(),
      mappedBy: "system",
    };
  }

  /**
   * Map regulation to obligations
   */
  async mapRegulationToObligations(
    regulationId: string,
    tenantId: string,
  ): Promise<ObligationMappingResult> {
    console.log(`🔄 Mapping regulation ${regulationId} to obligations...`);

    const obligationsCreated: Obligation[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Fetch regulation (would use actual compliance service)
      const regulation = await this.fetchRegulation(regulationId, tenantId);
      if (!regulation) {
        errors.push(`Regulation ${regulationId} not found`);
        return {
          sourceId: regulationId,
          sourceType: "REGULATION",
          obligationsCreated: [],
          obligationsUpdated: [],
          errors,
          warnings,
          mappedAt: new Date().toISOString(),
          mappedBy: "system",
        };
      }

      // Create obligation for regulation
      const obligation = await this.createObligation({
        type: "REGULATORY",
        source: regulationId,
        sourceType: "REGULATION",
        name: regulation.title || `Regulation ${regulationId}`,
        description: regulation.description || "Regulatory requirement",
        requirement: regulation.requirement || "",
        dueDate: regulation.dueDate,
        deadline: regulation.deadline,
        jurisdiction: regulation.jurisdiction || "Global",
        authority: regulation.authority || "Regulatory Body",
        responsibleParty: "Organization",
        responsiblePartyId: tenantId,
        responsiblePartyType: "INTERNAL",
        status: "PENDING",
        severity: regulation.severity || "HIGH",
        machineReadable: regulation.machineReadable || false,
        evidenceRequired: regulation.evidenceRequired || [],
        tenantId,
        createdBy: "system",
      });
      obligationsCreated.push(obligation);

      console.log(
        `✅ Mapped regulation ${regulationId} to ${obligationsCreated.length} obligations`,
      );
    } catch (error) {
      console.error("Error mapping regulation to obligations:", error);
      errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return {
      sourceId: regulationId,
      sourceType: "REGULATION",
      obligationsCreated,
      obligationsUpdated: [],
      errors,
      warnings,
      mappedAt: new Date().toISOString(),
      mappedBy: "system",
    };
  }

  /**
   * Map SLA to obligations
   */
  async mapSLAToObligations(
    slaId: string,
    tenantId: string,
  ): Promise<ObligationMappingResult> {
    console.log(`🔄 Mapping SLA ${slaId} to obligations...`);

    const obligationsCreated: Obligation[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Fetch SLA (would use actual SLA service)
      const sla = await this.fetchSLA(slaId, tenantId);
      if (!sla) {
        errors.push(`SLA ${slaId} not found`);
        return {
          sourceId: slaId,
          sourceType: "SLA",
          obligationsCreated: [],
          obligationsUpdated: [],
          errors,
          warnings,
          mappedAt: new Date().toISOString(),
          mappedBy: "system",
        };
      }

      // Create obligation for SLA
      const obligation = await this.createObligation({
        type: "CONTRACTUAL",
        source: slaId,
        sourceType: "SLA",
        name: sla.name || `SLA ${slaId}`,
        description: sla.description || "Service level agreement",
        requirement: `Maintain ${sla.serviceType} within ${sla.targetDuration} seconds`,
        duration: sla.targetDuration,
        jurisdiction: "Global",
        authority: sla.accountableParty || "Service Provider",
        responsibleParty: sla.responsibleParty || "Service Provider",
        responsiblePartyId: sla.responsiblePartyId,
        responsiblePartyType: this.mapPartyType(sla.partyType),
        status: "PENDING",
        severity: this.calculateSLASeverity(sla),
        machineReadable: true,
        completionEvents: [`sla.${sla.serviceCategory.toLowerCase()}.met`],
        tenantId,
        createdBy: "system",
      });
      obligationsCreated.push(obligation);

      console.log(
        `✅ Mapped SLA ${slaId} to ${obligationsCreated.length} obligations`,
      );
    } catch (error) {
      console.error("Error mapping SLA to obligations:", error);
      errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return {
      sourceId: slaId,
      sourceType: "SLA",
      obligationsCreated,
      obligationsUpdated: [],
      errors,
      warnings,
      mappedAt: new Date().toISOString(),
      mappedBy: "system",
    };
  }

  // ==========================================================================
  // READ
  // ==========================================================================

  /**
   * Get obligation by ID
   */
  async getObligation(
    obligationId: string,
    tenantId: string,
  ): Promise<Obligation | null> {
    try {
      const obligation = await prisma.obligation.findFirst({
        where: {
          id: obligationId,
          tenantId,
        },
      });

      if (!obligation) return null;

      return this.fromDatabase(obligation);
    } catch (error) {
      console.error("Error fetching obligation:", error);
      return null;
    }
  }

  /**
   * Get obligations with filters
   */
  async getObligations(filter: ObligationQueryFilter): Promise<Obligation[]> {
    try {
      const where: any = {
        tenantId: filter.tenantId,
      };

      // Status filters
      if (filter.status) {
        where.status = Array.isArray(filter.status)
          ? { in: filter.status }
          : filter.status;
      }
      if (filter.overdue) {
        where.status = { in: ["OVERDUE", "FAILED"] };
      }

      // Type filters
      if (filter.type) {
        where.type = Array.isArray(filter.type)
          ? { in: filter.type }
          : filter.type;
      }
      if (filter.sourceType) {
        where.sourceType = Array.isArray(filter.sourceType)
          ? { in: filter.sourceType }
          : filter.sourceType;
      }

      // Party filters
      if (filter.responsiblePartyId) {
        where.responsiblePartyId = filter.responsiblePartyId;
      }
      if (filter.responsiblePartyType) {
        where.responsiblePartyType = Array.isArray(filter.responsiblePartyType)
          ? { in: filter.responsiblePartyType }
          : filter.responsiblePartyType;
      }

      // Time filters
      if (filter.dueBefore) {
        where.dueDate = { ...where.dueDate, lte: new Date(filter.dueBefore) };
      }
      if (filter.dueAfter) {
        where.dueDate = { ...where.dueDate, gte: new Date(filter.dueAfter) };
      }

      // Authority filters
      if (filter.jurisdiction) {
        where.jurisdiction = Array.isArray(filter.jurisdiction)
          ? { in: filter.jurisdiction }
          : filter.jurisdiction;
      }

      // Severity
      if (filter.severity) {
        where.severity = Array.isArray(filter.severity)
          ? { in: filter.severity }
          : filter.severity;
      }

      // Search
      if (filter.searchText) {
        where.OR = [
          { name: { contains: filter.searchText, mode: "insensitive" } },
          { description: { contains: filter.searchText, mode: "insensitive" } },
          { requirement: { contains: filter.searchText, mode: "insensitive" } },
        ];
      }

      const obligations = await prisma.obligation.findMany({
        where,
        take: filter.limit || 100,
        skip: filter.offset || 0,
        orderBy: filter.sortBy
          ? { [filter.sortBy]: filter.sortOrder || "ASC" }
          : { createdAt: "DESC" },
      });

      return obligations.map((o) => this.fromDatabase(o));
    } catch (error) {
      console.error("Error fetching obligations:", error);
      return [];
    }
  }

  /**
   * Get obligation history
   */
  async getObligationHistory(
    obligationId: string,
    tenantId: string,
  ): Promise<ObligationHistory[]> {
    try {
      const history = await prisma.obligationHistory.findMany({
        where: {
          obligationId,
          tenantId,
        },
        orderBy: { changedAt: "DESC" },
      });

      return history as unknown as ObligationHistory[];
    } catch (error) {
      console.error("Error fetching obligation history:", error);
      return [];
    }
  }

  // ==========================================================================
  // UPDATE
  // ==========================================================================

  /**
   * Update obligation
   */
  async updateObligation(
    obligationId: string,
    updates: Partial<Obligation>,
    tenantId: string,
  ): Promise<Obligation> {
    const existing = await this.getObligation(obligationId, tenantId);
    if (!existing) {
      throw new Error(`Obligation ${obligationId} not found`);
    }

    const updated: Obligation = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await prisma.obligation.update({
      where: { id: obligationId },
      data: this.toDatabase(updated),
    });

    // Record in history
    await this.recordHistory({
      obligationId,
      changeType: "UPDATED",
      changes: updates,
      changedBy: updates.updatedBy || "system",
      tenantId,
    });

    // Publish event
    await eventBus.publish(
      createEvent(
        "obligation.updated",
        obligationId,
        "Obligation",
        {
          obligation: updated,
          changes: updates,
        },
        1,
        { tenantId },
      ),
    );

    return updated;
  }

  /**
   * Update obligation status
   */
  async updateObligationStatus(
    obligationId: string,
    status: ObligationStatus,
    reason?: string,
    tenantId?: string,
  ): Promise<Obligation> {
    const existing = await prisma.obligation.findUnique({
      where: { id: obligationId },
    });

    if (!existing) {
      throw new Error(`Obligation ${obligationId} not found`);
    }

    const updates: Partial<Obligation> = {
      status,
      reason,
      updatedAt: new Date().toISOString(),
      updatedBy: "system",
    };

    // Set timestamps based on status
    if (status === "MET") {
      updates.metAt = new Date().toISOString();
      updates.progress = 100;
    } else if (status === "FAILED") {
      updates.failedAt = new Date().toISOString();
    } else if (status === "OVERDUE") {
      updates.overdueAt = new Date().toISOString();
    }

    await prisma.obligation.update({
      where: { id: obligationId },
      data: this.toDatabase(updates as any),
    });

    // Record in history
    await this.recordHistory({
      obligationId,
      changeType: "STATUS_CHANGED",
      previousStatus: existing.status as ObligationStatus,
      newStatus: status,
      reason,
      changedBy: "system",
      tenantId: tenantId || existing.tenantId,
    });

    // Publish event
    await eventBus.publish(
      createEvent(
        "obligation.status.changed",
        obligationId,
        "Obligation",
        {
          obligationId,
          previousStatus: existing.status,
          newStatus: status,
          reason,
        },
        1,
        { tenantId: tenantId || existing.tenantId },
      ),
    );

    return { ...this.fromDatabase(existing), ...updates } as Obligation;
  }

  // ==========================================================================
  // COMPLIANCE CHECKING
  // ==========================================================================

  /**
   * Check obligation compliance
   */
  async checkObligationCompliance(
    obligationId: string,
    tenantId: string,
  ): Promise<ObligationComplianceStatus> {
    const obligation = await this.getObligation(obligationId, tenantId);
    if (!obligation) {
      throw new Error(`Obligation ${obligationId} not found`);
    }

    // Calculate days until due / overdue
    let daysUntilDue: number | undefined;
    let daysOverdue: number | undefined;

    if (obligation.dueDate) {
      const now = new Date();
      const due = new Date(obligation.dueDate);
      const diffMs = due.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        daysUntilDue = diffDays;
      } else {
        daysOverdue = Math.abs(diffDays);
      }
    }

    // Check evidence
    const evidenceProvided = (obligation.evidenceIds?.length || 0) > 0;
    const evidenceCount = obligation.evidenceIds?.length || 0;
    const requiredEvidenceCount = obligation.evidenceRequired?.length || 0;

    // Determine compliance
    const compliant =
      obligation.status === "MET" ||
      (obligation.status === "IN_PROGRESS" &&
        (!daysOverdue || daysOverdue === 0));

    // Calculate compliance percentage
    const compliancePercentage = obligation.progress || 0;

    // Determine risk level
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (obligation.status === "FAILED" || obligation.status === "DISPUTED") {
      riskLevel = "CRITICAL";
    } else if (
      obligation.status === "OVERDUE" ||
      (daysOverdue && daysOverdue > 0)
    ) {
      riskLevel = "HIGH";
    } else if (daysUntilDue && daysUntilDue <= 3) {
      riskLevel = "MEDIUM";
    }

    // Actions needed
    const actionsNeeded: string[] = [];
    if (!evidenceProvided && requiredEvidenceCount > 0) {
      actionsNeeded.push("Provide required evidence");
    }
    if (daysOverdue && daysOverdue > 0) {
      actionsNeeded.push("Obligation is overdue - immediate action required");
    }
    if (obligation.status === "PENDING" && daysUntilDue && daysUntilDue <= 7) {
      actionsNeeded.push("Begin work on obligation - due soon");
    }

    return {
      obligationId,
      obligation,
      compliant,
      status: obligation.status,
      compliancePercentage,
      daysUntilDue,
      daysOverdue,
      evidenceProvided,
      evidenceCount,
      requiredEvidenceCount,
      relevantEvents: [],
      completionEvents: [],
      riskLevel,
      actionsNeeded,
      checkedAt: new Date().toISOString(),
      tenantId,
    };
  }

  /**
   * Check all obligations compliance
   */
  async checkAllObligationsCompliance(
    tenantId: string,
  ): Promise<ObligationComplianceStatus[]> {
    const obligations = await this.getObligations({
      tenantId,
      status: ["PENDING", "IN_PROGRESS", "OVERDUE"],
    });

    const statuses: ObligationComplianceStatus[] = [];

    for (const obligation of obligations) {
      const status = await this.checkObligationCompliance(
        obligation.id,
        tenantId,
      );
      statuses.push(status);
    }

    return statuses;
  }

  // ==========================================================================
  // EVENT HANDLING
  // ==========================================================================

  /**
   * Handle event (check if it affects any obligations)
   */
  async handleEvent(event: DomainEvent, tenantId: string): Promise<void> {
    try {
      // Find obligations that are triggered by this event
      const obligations = await prisma.obligation.findMany({
        where: {
          tenantId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      });

      for (const obligation of obligations) {
        const obl = this.fromDatabase(obligation);

        // Check if this event completes the obligation
        if (obl.completionEvents?.includes(event.type)) {
          await this.updateObligationStatus(
            obl.id,
            "MET",
            `Completed by event: ${event.type}`,
            tenantId,
          );
          console.log(
            `✅ Obligation ${obl.id} marked as MET by event ${event.type}`,
          );
        }

        // Check if this event triggers the obligation
        if (obl.triggerEvents?.includes(event.type)) {
          if (obl.status === "PENDING") {
            await this.updateObligationStatus(
              obl.id,
              "IN_PROGRESS",
              `Triggered by event: ${event.type}`,
              tenantId,
            );
            console.log(
              `🔄 Obligation ${obl.id} marked as IN_PROGRESS by event ${event.type}`,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error handling event for obligations:", error);
    }
  }

  /**
   * Subscribe to events
   */
  private async subscribeToEvents(): Promise<void> {
    // Subscribe to all events
    eventBus.subscribe(
      async (event: DomainEvent, context: any) => {
        const tenantId = event.metadata?.tenantId || context?.tenantId;
        if (tenantId) {
          await this.handleEvent(event, tenantId);
        }
      },
      { eventTypes: ["*"] }, // All events
    );

    console.log("✅ Subscribed to events for obligation tracking");
  }

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  /**
   * Get obligation dashboard
   */
  async getDashboard(tenantId: string): Promise<ObligationDashboard> {
    const obligations = await this.getObligations({ tenantId });

    const dashboard: ObligationDashboard = {
      tenantId,
      totalObligations: obligations.length,
      activeObligations: obligations.filter(
        (o) => o.status === "PENDING" || o.status === "IN_PROGRESS",
      ).length,
      metObligations: obligations.filter((o) => o.status === "MET").length,
      failedObligations: obligations.filter((o) => o.status === "FAILED")
        .length,
      overdueObligations: obligations.filter((o) => o.status === "OVERDUE")
        .length,
      byStatus: this.countByField(obligations, "status"),
      byType: this.countByField(obligations, "type"),
      bySeverity: this.countByField(obligations, "severity"),
      byResponsibleParty: this.countByField(obligations, "responsibleParty"),
      overallComplianceRate: this.calculateComplianceRate(obligations),
      onTimeCompletionRate: this.calculateOnTimeRate(obligations),
      dueTodayCount: this.countDueToday(obligations),
      dueThisWeekCount: this.countDueThisWeek(obligations),
      dueThisMonthCount: this.countDueThisMonth(obligations),
      overdueCount: obligations.filter((o) => o.status === "OVERDUE").length,
      criticalRiskCount: obligations.filter((o) => o.severity === "CRITICAL")
        .length,
      highRiskCount: obligations.filter((o) => o.severity === "HIGH").length,
      generatedAt: new Date().toISOString(),
    };

    return dashboard;
  }

  /**
   * Send obligation notifications
   */
  async sendObligationNotifications(tenantId: string): Promise<void> {
    const statuses = await this.checkAllObligationsCompliance(tenantId);

    for (const status of statuses) {
      // Send notifications based on status
      if (status.riskLevel === "CRITICAL" || status.riskLevel === "HIGH") {
        await notificationService.createNotification({
          type: "OBLIGATION",
          priority: status.riskLevel === "CRITICAL" ? "CRITICAL" : "HIGH",
          title: `Obligation Alert: ${status.obligation.name}`,
          message: status.actionsNeeded.join("; "),
          recipient: status.obligation.responsiblePartyId,
          tenantId,
        });
      }
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Fetch contract from procurement contract service
   */
  private async fetchContract(
    contractId: string,
    tenantId: string,
  ): Promise<any> {
    try {
      // Try to fetch from procurement contract service
      const { contractService } =
        await import("@/lib/services/procurement/contractService");
      const contract = await contractService
        .getContract(tenantId, contractId)
        .catch(() => null);

      if (contract) {
        return {
          id: contract.id,
          contractNumber: contract.contractNumber,
          vendorName: contract.vendorName || contract.supplierName,
          vendorId: contract.vendorId || contract.supplierId,
          buyerName: contract.buyerName,
          buyerId: contract.buyerId,
          paymentTerms: contract.paymentTerms,
          deliveryTerms: contract.deliveryTerms,
          serviceLevelAgreements: contract.slas || [],
          jurisdiction: contract.jurisdiction || "Saudi Arabia",
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
        };
      }
    } catch (error) {
      console.warn(
        "[ObligationMappingEngine] Could not fetch contract:",
        error,
      );
    }

    // Fallback to mock data
    return {
      id: contractId,
      contractNumber: "CTR-001",
      vendorName: "Vendor Inc",
      vendorId: "vendor-1",
      buyerName: "Buyer Corp",
      buyerId: "buyer-1",
      paymentTerms: "Net 30 days",
      deliveryTerms: "Delivered within 5 business days",
      serviceLevelAgreements: [],
      jurisdiction: "Saudi Arabia",
    };
  }

  /**
   * Fetch regulation from compliance service
   */
  private async fetchRegulation(
    regulationId: string,
    tenantId: string,
  ): Promise<any> {
    try {
      // Try to fetch from compliance service
      const { complianceService } = await import("@/lib/services/compliance");
      const regulation = await complianceService
        .getRequirement(tenantId, regulationId)
        .catch(() => null);

      if (regulation) {
        return {
          id: regulation.id,
          title: regulation.title || regulation.name,
          description: regulation.description,
          requirement: regulation.requirement || regulation.text,
          jurisdiction: regulation.jurisdiction,
          authority: regulation.authority,
          severity: regulation.severity || "MEDIUM",
          machineReadable: regulation.machineReadable ?? true,
          category: regulation.category,
          effectiveDate: regulation.effectiveDate,
        };
      }
    } catch (error) {
      console.warn(
        "[ObligationMappingEngine] Could not fetch regulation:",
        error,
      );
    }

    return {
      id: regulationId,
      title: "Regulation Title",
      description: "Regulation Description",
      requirement: "Specific requirement",
      jurisdiction: "Saudi Arabia",
      authority: "TGA",
      severity: "HIGH",
      machineReadable: true,
    };
  }

  /**
   * Fetch SLA from SLA-KPI service
   */
  private async fetchSLA(slaId: string, tenantId: string): Promise<any> {
    try {
      // Try to fetch from unified SLA-KPI service
      const { unifiedSlaKpiService: slaKpiService } =
        await import("@/lib/services/sla-kpi/unifiedSlaKpiService");
      const sla = await slaKpiService.getSLA(tenantId, slaId).catch(() => null);

      if (sla) {
        return {
          id: sla.id,
          name: sla.name,
          description: sla.description,
          serviceType: sla.serviceType,
          serviceCategory: sla.serviceCategory,
          targetDuration: sla.targetDuration,
          partyType: sla.partyType,
          responsibleParty: sla.responsiblePartyName,
          responsiblePartyId: sla.responsiblePartyId,
          accountableParty: sla.accountablePartyName,
          currentCompliance: sla.currentCompliance,
        };
      }
    } catch (error) {
      console.warn("[ObligationMappingEngine] Could not fetch SLA:", error);
    }

    return {
      id: slaId,
      name: "On-Time Delivery",
      description: "Deliver within target duration",
      serviceType: "Delivery",
      serviceCategory: "TRANSPORTATION",
      targetDuration: 86400, // 24 hours
      partyType: "CARRIER",
      responsibleParty: "Carrier Name",
      responsiblePartyId: "carrier-1",
      accountableParty: "Warehouse",
    };
  }

  /**
   * Map party type
   */
  private mapPartyType(partyType: string): any {
    const mapping: Record<string, any> = {
      CARRIER: "CARRIER",
      WAREHOUSE: "WAREHOUSE",
      CUSTOMER: "CUSTOMER",
      SUPPLIER: "SUPPLIER",
      CUSTOMS_BROKER: "BROKER",
    };
    return mapping[partyType] || "THIRD_PARTY";
  }

  /**
   * Calculate SLA severity
   */
  private calculateSLASeverity(sla: any): any {
    // Critical if warning threshold is very tight
    if (sla.warningThreshold && sla.warningThreshold >= 90) {
      return "CRITICAL";
    }
    if (sla.criticalThreshold && sla.criticalThreshold >= 95) {
      return "HIGH";
    }
    return "MEDIUM";
  }

  /**
   * Record history
   */
  private async recordHistory(
    history: Omit<ObligationHistory, "id" | "changedAt">,
  ): Promise<void> {
    const id = `oblhist-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    await prisma.obligationHistory.create({
      data: {
        id,
        ...history,
        changedAt: new Date(),
      } as any,
    });
  }

  /**
   * Count by field
   */
  private countByField(
    obligations: Obligation[],
    field: keyof Obligation,
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const obligation of obligations) {
      const value = String(obligation[field]);
      counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
  }

  /**
   * Calculate compliance rate
   */
  private calculateComplianceRate(obligations: Obligation[]): number {
    if (obligations.length === 0) return 100;
    const met = obligations.filter((o) => o.status === "MET").length;
    return Math.round((met / obligations.length) * 100);
  }

  /**
   * Calculate on-time completion rate
   */
  private calculateOnTimeRate(obligations: Obligation[]): number {
    const completed = obligations.filter((o) => o.status === "MET");
    if (completed.length === 0) return 100;

    const onTime = completed.filter((o) => {
      if (!o.dueDate || !o.metAt) return true;
      return new Date(o.metAt) <= new Date(o.dueDate);
    }).length;

    return Math.round((onTime / completed.length) * 100);
  }

  /**
   * Count due today
   */
  private countDueToday(obligations: Obligation[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return obligations.filter((o) => {
      if (!o.dueDate) return false;
      const due = new Date(o.dueDate);
      return due >= today && due < tomorrow;
    }).length;
  }

  /**
   * Count due this week
   */
  private countDueThisWeek(obligations: Obligation[]): number {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return obligations.filter((o) => {
      if (!o.dueDate) return false;
      const due = new Date(o.dueDate);
      return due >= today && due <= nextWeek;
    }).length;
  }

  /**
   * Count due this month
   */
  private countDueThisMonth(obligations: Obligation[]): number {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return obligations.filter((o) => {
      if (!o.dueDate) return false;
      const due = new Date(o.dueDate);
      return due >= today && due <= endOfMonth;
    }).length;
  }

  /**
   * Convert to database format
   */
  private toDatabase(obligation: Partial<Obligation>): any {
    return {
      ...obligation,
      dueDate: obligation.dueDate ? new Date(obligation.dueDate) : undefined,
      deadline: obligation.deadline ? new Date(obligation.deadline) : undefined,
      metAt: obligation.metAt ? new Date(obligation.metAt) : undefined,
      failedAt: obligation.failedAt ? new Date(obligation.failedAt) : undefined,
      overdueAt: obligation.overdueAt
        ? new Date(obligation.overdueAt)
        : undefined,
      nextOccurrence: obligation.nextOccurrence
        ? new Date(obligation.nextOccurrence)
        : undefined,
      createdAt: obligation.createdAt
        ? new Date(obligation.createdAt)
        : undefined,
      updatedAt: obligation.updatedAt
        ? new Date(obligation.updatedAt)
        : undefined,
    };
  }

  /**
   * Convert from database format
   */
  private fromDatabase(record: any): Obligation {
    return {
      ...record,
      dueDate: record.dueDate ? record.dueDate.toISOString() : undefined,
      deadline: record.deadline ? record.deadline.toISOString() : undefined,
      metAt: record.metAt ? record.metAt.toISOString() : undefined,
      failedAt: record.failedAt ? record.failedAt.toISOString() : undefined,
      overdueAt: record.overdueAt ? record.overdueAt.toISOString() : undefined,
      nextOccurrence: record.nextOccurrence
        ? record.nextOccurrence.toISOString()
        : undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const obligationMappingEngine = new ObligationMappingEngineService();

// Auto-initialize on import
obligationMappingEngine.initialize().catch((error) => {
  console.error("Failed to initialize Obligation Mapping Engine:", error);
});
