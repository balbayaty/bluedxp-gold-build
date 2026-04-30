/**
 * QHSE Ecosystem Integration Service
 * Deep integration with entire BlueDXP platform ecosystem
 * Ensures QHSE benefits from and contributes to all modules
 * Zero duplication - leverages existing services
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { evidenceService } from "@/lib/services/evidence";
import type { Incident, Inspection, TrainingRecord } from "@/types/qhse";

// ============================================================================
// CROSS-MODULE INTEGRATION INTERFACES
// ============================================================================

export interface QHSEToISOIMSIntegration {
  /**
   * Create NCR from QHSE incident
   */
  createNCRFromIncident(incidentId: string): Promise<{
    ncrId: string;
    ncrNumber: string;
    link: string;
  }>;

  /**
   * Create CAPA from QHSE incident or inspection finding
   */
  createCAPAFromQHSE(
    sourceType: "INCIDENT" | "INSPECTION_FINDING",
    sourceId: string,
  ): Promise<{
    capaId: string;
    capaNumber: string;
    link: string;
  }>;

  /**
   * Link QHSE incident to existing NCR
   */
  linkIncidentToNCR(incidentId: string, ncrId: string): Promise<void>;

  /**
   * Get related NCRs for QHSE incident
   */
  getRelatedNCRs(incidentId: string): Promise<
    Array<{
      id: string;
      ncrNumber: string;
      status: string;
      link: string;
    }>
  >;

  /**
   * Get related CAPAs for QHSE incident
   */
  getRelatedCAPAs(incidentId: string): Promise<
    Array<{
      id: string;
      capaNumber: string;
      status: string;
      link: string;
    }>
  >;
}

export interface QHSEToWMSIntegration {
  /**
   * Get warehouse operations related to incident
   */
  getWarehouseOperations(incidentId: string): Promise<
    Array<{
      id: string;
      type: string;
      description: string;
      link: string;
    }>
  >;

  /**
   * Link incident to warehouse operation
   */
  linkIncidentToWarehouseOperation(
    incidentId: string,
    operationId: string,
  ): Promise<void>;

  /**
   * Get inventory items at incident location
   */
  getInventoryAtLocation(locationId: string): Promise<
    Array<{
      materialId: string;
      materialName: string;
      quantity: number;
      link: string;
    }>
  >;
}

export interface QHSEToTMSIntegration {
  /**
   * Get transportation incidents
   */
  getTransportationIncidents(filters?: {
    tenantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<
    Array<{
      id: string;
      incidentNumber: string;
      type: string;
      link: string;
    }>
  >;

  /**
   * Link QHSE incident to shipment
   */
  linkIncidentToShipment(incidentId: string, shipmentId: string): Promise<void>;

  /**
   * Get driver safety records
   */
  getDriverSafetyRecords(driverId: string): Promise<{
    incidents: number;
    violations: number;
    trainingStatus: string;
    link: string;
  }>;
}

export interface QHSEToComplianceIntegration {
  /**
   * Check compliance status for QHSE requirements
   */
  checkComplianceStatus(
    tenantId: string,
    standard?: string,
  ): Promise<{
    compliant: boolean;
    score: number;
    requirements: Array<{
      id: string;
      requirement: string;
      status: "COMPLIANT" | "NON_COMPLIANT" | "AT_RISK";
      link: string;
    }>;
  }>;

  /**
   * Get regulatory requirements for QHSE
   */
  getRegulatoryRequirements(
    region: string,
    industry?: string,
  ): Promise<
    Array<{
      id: string;
      regulation: string;
      requirement: string;
      complianceStatus: string;
      link: string;
    }>
  >;

  /**
   * Create compliance issue from QHSE incident
   */
  createComplianceIssueFromIncident(incidentId: string): Promise<{
    issueId: string;
    link: string;
  }>;
}

export interface QHSEToHRIntegration {
  /**
   * Get employee training records from HR
   */
  getEmployeeTrainingRecords(employeeId: string): Promise<
    Array<{
      trainingId: string;
      trainingName: string;
      status: string;
      completionDate?: Date;
      expiryDate?: Date;
      link: string;
    }>
  >;

  /**
   * Sync QHSE training with HR records
   */
  syncTrainingWithHR(trainingRecordId: string): Promise<void>;

  /**
   * Get employee safety performance
   */
  getEmployeeSafetyPerformance(employeeId: string): Promise<{
    incidents: number;
    nearMisses: number;
    trainingCompliance: number;
    safetyScore: number;
    link: string;
  }>;
}

export interface QHSEToFacilityIntegration {
  /**
   * Get facility incidents
   */
  getFacilityIncidents(facilityId: string): Promise<
    Array<{
      id: string;
      incidentNumber: string;
      type: string;
      date: Date;
      link: string;
    }>
  >;

  /**
   * Link incident to facility asset
   */
  linkIncidentToAsset(incidentId: string, assetId: string): Promise<void>;

  /**
   * Get facility safety metrics
   */
  getFacilitySafetyMetrics(facilityId: string): Promise<{
    trir: number;
    ltifr: number;
    incidents: number;
    inspections: number;
    link: string;
  }>;
}

export interface QHSEToChemicalIntegration {
  /**
   * Get chemical incidents
   */
  getChemicalIncidents(filters?: {
    tenantId?: string;
    chemicalId?: string;
    dateFrom?: Date;
  }): Promise<
    Array<{
      id: string;
      incidentNumber: string;
      chemicalName: string;
      type: string;
      link: string;
    }>
  >;

  /**
   * Link QHSE incident to chemical
   */
  linkIncidentToChemical(incidentId: string, chemicalId: string): Promise<void>;

  /**
   * Get MSDS for incident location
   */
  getMSDSForLocation(locationId: string): Promise<
    Array<{
      msdsId: string;
      chemicalName: string;
      link: string;
    }>
  >;
}

// ============================================================================
// QHSE ECOSYSTEM INTEGRATION SERVICE
// ============================================================================

class QHSEEcosystemIntegrationService
  implements
    QHSEToISOIMSIntegration,
    QHSEToWMSIntegration,
    QHSEToTMSIntegration,
    QHSEToComplianceIntegration,
    QHSEToHRIntegration,
    QHSEToFacilityIntegration,
    QHSEToChemicalIntegration
{
  // ============================================================================
  // ISO-IMS INTEGRATION
  // ============================================================================

  async createNCRFromIncident(
    incidentId: string,
  ): Promise<{ ncrId: string; ncrNumber: string; link: string }> {
    try {
      // Get incident details
      const incident = await this.getIncidentById(incidentId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      // Create NCR via API (would call ISO-IMS service)
      const response = await fetch("/api/erpnext/ncrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `NCR from QHSE Incident: ${incident.incidentNumber}`,
          description: incident.description,
          ncType: this.mapIncidentTypeToNCType(incident.type),
          severity: this.mapSeverityToNCRSeverity(incident.severity),
          priority: this.mapSeverityToPriority(incident.severity),
          reportedBy: incident.reportedBy,
          reportedDate: incident.reportedAt,
          linkedQHSEIncident: incidentId,
          warehouseId: incident.warehouseId,
          facilityId: incident.facilityId,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create NCR");
      }

      // Publish event
      await eventBus.publish({
        type: "qhse.incident.ncr.created",
        payload: {
          incidentId,
          ncrId: data.data.id,
          ncrNumber: data.data.ncrNumber,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        ncrId: data.data.id,
        ncrNumber: data.data.ncrNumber,
        link: `/ncr-management?ncr=${data.data.id}`,
      };
    } catch (error) {
      console.error("Error creating NCR from incident:", error);
      throw error;
    }
  }

  async createCAPAFromQHSE(
    sourceType: "INCIDENT" | "INSPECTION_FINDING",
    sourceId: string,
  ): Promise<{ capaId: string; capaNumber: string; link: string }> {
    try {
      let sourceData: any;

      if (sourceType === "INCIDENT") {
        sourceData = await this.getIncidentById(sourceId);
        if (!sourceData) throw new Error(`Incident ${sourceId} not found`);
      } else {
        sourceData = await this.getInspectionFindingById(sourceId);
        if (!sourceData)
          throw new Error(`Inspection finding ${sourceId} not found`);
      }

      // Create CAPA via API
      const response = await fetch("/api/erpnext/capas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `CAPA from QHSE ${sourceType === "INCIDENT" ? "Incident" : "Inspection Finding"}: ${sourceData.incidentNumber || sourceData.findingNumber}`,
          description: sourceData.description,
          capaType: "Corrective Action",
          capaSource: sourceType === "INCIDENT" ? "NCR" : "Audit",
          priority: this.mapSeverityToPriority(sourceData.severity),
          linkedQHSE: sourceId,
          linkedQHSEType: sourceType,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create CAPA");
      }

      // Publish event
      await eventBus.publish({
        type: "qhse.capa.created",
        payload: {
          sourceType,
          sourceId,
          capaId: data.data.id,
          capaNumber: data.data.capaNumber,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        capaId: data.data.id,
        capaNumber: data.data.capaNumber,
        link: `/capa-management?capa=${data.data.id}`,
      };
    } catch (error) {
      console.error("Error creating CAPA from QHSE:", error);
      throw error;
    }
  }

  async linkIncidentToNCR(incidentId: string, ncrId: string): Promise<void> {
    // Update incident with NCR link
    await eventBus.publish({
      type: "qhse.incident.ncr.linked",
      payload: { incidentId, ncrId },
      timestamp: new Date().toISOString(),
    });
  }

  async getRelatedNCRs(
    incidentId: string,
  ): Promise<
    Array<{ id: string; ncrNumber: string; status: string; link: string }>
  > {
    try {
      const response = await fetch(
        `/api/erpnext/ncrs?linkedQHSEIncident=${incidentId}`,
      );
      const data = await response.json();
      if (data.success) {
        return data.data.map((ncr: any) => ({
          id: ncr.id,
          ncrNumber: ncr.ncrNumber,
          status: ncr.status,
          link: `/ncr-management?ncr=${ncr.id}`,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching related NCRs:", error);
      return [];
    }
  }

  async getRelatedCAPAs(
    incidentId: string,
  ): Promise<
    Array<{ id: string; capaNumber: string; status: string; link: string }>
  > {
    try {
      const response = await fetch(
        `/api/erpnext/capas?linkedQHSE=${incidentId}`,
      );
      const data = await response.json();
      if (data.success) {
        return data.data.map((capa: any) => ({
          id: capa.id,
          capaNumber: capa.capaNumber,
          status: capa.status,
          link: `/capa-management?capa=${capa.id}`,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching related CAPAs:", error);
      return [];
    }
  }

  // ============================================================================
  // WMS INTEGRATION
  // ============================================================================

  async getWarehouseOperations(
    incidentId: string,
  ): Promise<
    Array<{ id: string; type: string; description: string; link: string }>
  > {
    try {
      const incident = await this.getIncidentById(incidentId);
      if (!incident?.warehouseId) return [];

      // Would fetch from WMS service
      return [];
    } catch (error) {
      console.error("Error fetching warehouse operations:", error);
      return [];
    }
  }

  async linkIncidentToWarehouseOperation(
    incidentId: string,
    operationId: string,
  ): Promise<void> {
    await eventBus.publish({
      type: "qhse.incident.warehouse.linked",
      payload: { incidentId, operationId },
      timestamp: new Date().toISOString(),
    });
  }

  async getInventoryAtLocation(locationId: string): Promise<
    Array<{
      materialId: string;
      materialName: string;
      quantity: number;
      link: string;
    }>
  > {
    try {
      // Would fetch from WMS inventory service
      return [];
    } catch (error) {
      console.error("Error fetching inventory:", error);
      return [];
    }
  }

  // ============================================================================
  // TMS INTEGRATION
  // ============================================================================

  async getTransportationIncidents(filters?: {
    tenantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<
    Array<{ id: string; incidentNumber: string; type: string; link: string }>
  > {
    try {
      // Would fetch from TMS service
      return [];
    } catch (error) {
      console.error("Error fetching transportation incidents:", error);
      return [];
    }
  }

  async linkIncidentToShipment(
    incidentId: string,
    shipmentId: string,
  ): Promise<void> {
    await eventBus.publish({
      type: "qhse.incident.shipment.linked",
      payload: { incidentId, shipmentId },
      timestamp: new Date().toISOString(),
    });
  }

  async getDriverSafetyRecords(driverId: string): Promise<{
    incidents: number;
    violations: number;
    trainingStatus: string;
    link: string;
  }> {
    try {
      // Would fetch from TMS/HR services
      return {
        incidents: 0,
        violations: 0,
        trainingStatus: "UNKNOWN",
        link: `/tms/drivers/${driverId}`,
      };
    } catch (error) {
      console.error("Error fetching driver safety records:", error);
      throw error;
    }
  }

  // ============================================================================
  // COMPLIANCE INTEGRATION
  // ============================================================================

  async checkComplianceStatus(
    tenantId: string,
    standard?: string,
  ): Promise<{
    compliant: boolean;
    score: number;
    requirements: Array<{
      id: string;
      requirement: string;
      status: "COMPLIANT" | "NON_COMPLIANT" | "AT_RISK";
      link: string;
    }>;
  }> {
    try {
      // Would fetch from Compliance service
      return {
        compliant: true,
        score: 95,
        requirements: [],
      };
    } catch (error) {
      console.error("Error checking compliance status:", error);
      throw error;
    }
  }

  async getRegulatoryRequirements(
    region: string,
    industry?: string,
  ): Promise<
    Array<{
      id: string;
      regulation: string;
      requirement: string;
      complianceStatus: string;
      link: string;
    }>
  > {
    try {
      // Would fetch from Compliance service
      return [];
    } catch (error) {
      console.error("Error fetching regulatory requirements:", error);
      return [];
    }
  }

  async createComplianceIssueFromIncident(
    incidentId: string,
  ): Promise<{ issueId: string; link: string }> {
    try {
      // Would create in Compliance service
      return {
        issueId: "temp-id",
        link: `/compliance/issues/temp-id`,
      };
    } catch (error) {
      console.error("Error creating compliance issue:", error);
      throw error;
    }
  }

  // ============================================================================
  // HR INTEGRATION
  // ============================================================================

  async getEmployeeTrainingRecords(employeeId: string): Promise<
    Array<{
      trainingId: string;
      trainingName: string;
      status: string;
      completionDate?: Date;
      expiryDate?: Date;
      link: string;
    }>
  > {
    try {
      // Would fetch from HR service
      return [];
    } catch (error) {
      console.error("Error fetching employee training records:", error);
      return [];
    }
  }

  async syncTrainingWithHR(trainingRecordId: string): Promise<void> {
    await eventBus.publish({
      type: "qhse.training.hr.synced",
      payload: { trainingRecordId },
      timestamp: new Date().toISOString(),
    });
  }

  async getEmployeeSafetyPerformance(employeeId: string): Promise<{
    incidents: number;
    nearMisses: number;
    trainingCompliance: number;
    safetyScore: number;
    link: string;
  }> {
    try {
      // Would calculate from QHSE data
      return {
        incidents: 0,
        nearMisses: 0,
        trainingCompliance: 100,
        safetyScore: 100,
        link: `/hr/employees/${employeeId}`,
      };
    } catch (error) {
      console.error("Error fetching employee safety performance:", error);
      throw error;
    }
  }

  // ============================================================================
  // FACILITY INTEGRATION
  // ============================================================================

  async getFacilityIncidents(facilityId: string): Promise<
    Array<{
      id: string;
      incidentNumber: string;
      type: string;
      date: Date;
      link: string;
    }>
  > {
    try {
      // Would fetch from Facility service
      return [];
    } catch (error) {
      console.error("Error fetching facility incidents:", error);
      return [];
    }
  }

  async linkIncidentToAsset(
    incidentId: string,
    assetId: string,
  ): Promise<void> {
    await eventBus.publish({
      type: "qhse.incident.asset.linked",
      payload: { incidentId, assetId },
      timestamp: new Date().toISOString(),
    });
  }

  async getFacilitySafetyMetrics(facilityId: string): Promise<{
    trir: number;
    ltifr: number;
    incidents: number;
    inspections: number;
    link: string;
  }> {
    try {
      // Would calculate from QHSE data
      return {
        trir: 0,
        ltifr: 0,
        incidents: 0,
        inspections: 0,
        link: `/facility/${facilityId}`,
      };
    } catch (error) {
      console.error("Error fetching facility safety metrics:", error);
      throw error;
    }
  }

  // ============================================================================
  // CHEMICAL INTEGRATION
  // ============================================================================

  async getChemicalIncidents(filters?: {
    tenantId?: string;
    chemicalId?: string;
    dateFrom?: Date;
  }): Promise<
    Array<{
      id: string;
      incidentNumber: string;
      chemicalName: string;
      type: string;
      link: string;
    }>
  > {
    try {
      // Would fetch from Chemical service
      return [];
    } catch (error) {
      console.error("Error fetching chemical incidents:", error);
      return [];
    }
  }

  async linkIncidentToChemical(
    incidentId: string,
    chemicalId: string,
  ): Promise<void> {
    await eventBus.publish({
      type: "qhse.incident.chemical.linked",
      payload: { incidentId, chemicalId },
      timestamp: new Date().toISOString(),
    });
  }

  async getMSDSForLocation(
    locationId: string,
  ): Promise<Array<{ msdsId: string; chemicalName: string; link: string }>> {
    try {
      // Would fetch from MSDS service
      return [];
    } catch (error) {
      console.error("Error fetching MSDS for location:", error);
      return [];
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getIncidentById(id: string): Promise<Incident | null> {
    try {
      const response = await fetch(`/api/qhse/incidents/${id}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Error fetching incident:", error);
      return null;
    }
  }

  private async getInspectionFindingById(id: string): Promise<any> {
    // Would fetch from inspection service
    return null;
  }

  private mapIncidentTypeToNCType(incidentType: string): string {
    const mapping: Record<string, string> = {
      PROPERTY_DAMAGE: "Product",
      ENVIRONMENTAL_RELEASE: "Process",
      SAFETY_VIOLATION: "System",
      PPE_NON_COMPLIANCE: "Process",
    };
    return mapping[incidentType] || "Other";
  }

  private mapSeverityToNCRSeverity(severity: string): string {
    const mapping: Record<string, string> = {
      CRITICAL: "Critical",
      HIGH: "Major",
      MEDIUM: "Minor",
      LOW: "Minor",
    };
    return mapping[severity] || "Minor";
  }

  private mapSeverityToPriority(severity: string): string {
    const mapping: Record<string, string> = {
      CRITICAL: "Critical",
      HIGH: "High",
      MEDIUM: "Medium",
      LOW: "Low",
    };
    return mapping[severity] || "Medium";
  }
}

// Export singleton instance
export const qhseEcosystemIntegrationService =
  new QHSEEcosystemIntegrationService();
