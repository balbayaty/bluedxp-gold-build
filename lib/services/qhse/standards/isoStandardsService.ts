/**
 * ISO Standards Management Service
 * Comprehensive ISO standards compliance management
 *
 * Supports:
 * - ISO 9001 (Quality)
 * - ISO 14001 (Environmental)
 * - ISO 45001 (Safety)
 * - ISO 22000 (Food Safety)
 * - ISO 22301 (Business Continuity)
 * - ISO 29001 (Oil & Gas Quality)
 * - ISO 50001 (Energy)
 * - ISO 27001 (Information Security)
 *
 * Fully integrated with BlueDXP platform
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { evidenceService } from "@/lib/services/evidence";
import type {
  ISOStandard,
  ISORequirement,
  ISOClause,
} from "./comprehensiveStandardsFramework";

// ============================================================================
// ISO STANDARDS DATA
// ============================================================================

export const isoStandards: Record<string, ISOStandard> = {
  "ISO-9001-2015": {
    code: "ISO 9001:2015",
    name: "Quality Management Systems",
    version: "2015",
    category: "QUALITY",
    description: "International standard for quality management systems",
    requirements: [
      {
        id: "ISO-9001-4.1",
        clause: "4.1",
        subClause: "4.1",
        title: "Understanding the organization and its context",
        description:
          "Determine external and internal issues relevant to the QMS",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "HYBRID",
        integrationPoints: ["context-analysis", "stakeholder-management"],
        relatedStandards: ["ISO-14001-2015", "ISO-45001-2018"],
      },
      {
        id: "ISO-9001-4.2",
        clause: "4.2",
        subClause: "4.2",
        title: "Understanding the needs and expectations of interested parties",
        description: "Determine interested parties and their requirements",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "HYBRID",
        integrationPoints: ["stakeholder-management", "requirement-management"],
        relatedStandards: ["ISO-14001-2015", "ISO-45001-2018"],
      },
      {
        id: "ISO-9001-5.1.1",
        clause: "5.1.1",
        subClause: "5.1.1",
        title: "Leadership and commitment - General",
        description:
          "Top management shall demonstrate leadership and commitment",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "MANUAL",
        integrationPoints: ["leadership-engagement", "policy-management"],
        relatedStandards: ["ISO-14001-2015", "ISO-45001-2018"],
      },
      {
        id: "ISO-9001-6.1",
        clause: "6.1",
        subClause: "6.1",
        title: "Actions to address risks and opportunities",
        description: "Plan actions to address risks and opportunities",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "HYBRID",
        integrationPoints: ["risk-management", "opportunity-management"],
        relatedStandards: [
          "ISO-14001-2015",
          "ISO-45001-2018",
          "ISO-22301-2019",
        ],
      },
      {
        id: "ISO-9001-8.5.1",
        clause: "8.5.1",
        subClause: "8.5.1",
        title: "Control of production and service provision",
        description:
          "Implement production and service provision under controlled conditions",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
        integrationPoints: ["production-control", "quality-control"],
        relatedStandards: ["ISO-22000-2018"],
      },
      {
        id: "ISO-9001-9.1.1",
        clause: "9.1.1",
        subClause: "9.1.1",
        title: "Monitoring, measurement, analysis and evaluation - General",
        description: "Monitor, measure, analyze and evaluate QMS performance",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
        integrationPoints: ["performance-monitoring", "analytics"],
        relatedStandards: ["ISO-14001-2015", "ISO-45001-2018"],
      },
      {
        id: "ISO-9001-10.2",
        clause: "10.2",
        subClause: "10.2",
        title: "Nonconformity and corrective action",
        description: "React to nonconformities and take corrective action",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "HYBRID",
        integrationPoints: ["nonconformity-management", "corrective-action"],
        relatedStandards: ["ISO-14001-2015", "ISO-45001-2018"],
      },
    ],
    clauses: [
      {
        number: "4",
        title: "Context of the organization",
        description: "Understanding the organization and its context",
        requirements: [
          "Determine external and internal issues",
          "Determine interested parties and their requirements",
          "Determine the scope of the QMS",
          "Establish the QMS and its processes",
        ],
        implementationGuidance:
          "Conduct stakeholder analysis, context analysis, and process mapping",
        metrics: ["stakeholder-satisfaction", "context-awareness-score"],
        auditCriteria: [
          "Documented context analysis",
          "List of interested parties",
          "Defined QMS scope",
          "Process map",
        ],
      },
      {
        number: "5",
        title: "Leadership",
        description: "Leadership and commitment",
        requirements: [
          "Demonstrate leadership and commitment",
          "Establish quality policy",
          "Assign organizational roles, responsibilities and authorities",
        ],
        implementationGuidance:
          "Engage top management, establish policies, define roles",
        metrics: ["leadership-engagement-score", "policy-awareness"],
        auditCriteria: [
          "Quality policy documented",
          "Roles and responsibilities defined",
          "Management review records",
        ],
      },
      {
        number: "6",
        title: "Planning",
        description: "Planning for the QMS",
        requirements: [
          "Address risks and opportunities",
          "Establish quality objectives",
          "Plan changes to the QMS",
        ],
        implementationGuidance:
          "Conduct risk assessment, set objectives, plan changes",
        metrics: ["risk-coverage", "objective-achievement-rate"],
        auditCriteria: [
          "Risk register",
          "Quality objectives",
          "Change management plan",
        ],
      },
      {
        number: "7",
        title: "Support",
        description: "Support for the QMS",
        requirements: [
          "Provide resources",
          "Ensure competence",
          "Awareness and communication",
          "Documented information",
        ],
        implementationGuidance:
          "Allocate resources, provide training, maintain documentation",
        metrics: [
          "resource-adequacy",
          "competence-level",
          "documentation-completeness",
        ],
        auditCriteria: [
          "Resource allocation records",
          "Training records",
          "Documentation system",
        ],
      },
      {
        number: "8",
        title: "Operation",
        description: "Operational planning and control",
        requirements: [
          "Operational planning and control",
          "Requirements for products and services",
          "Design and development",
          "Control of externally provided processes, products and services",
          "Production and service provision",
          "Release of products and services",
          "Control of nonconforming outputs",
        ],
        implementationGuidance:
          "Plan operations, control processes, manage suppliers",
        metrics: [
          "process-effectiveness",
          "supplier-performance",
          "nonconformity-rate",
        ],
        auditCriteria: [
          "Operational procedures",
          "Supplier evaluation records",
          "Nonconformity records",
        ],
      },
      {
        number: "9",
        title: "Performance evaluation",
        description: "Monitor, measure, analyze and evaluate",
        requirements: [
          "Monitoring, measurement, analysis and evaluation",
          "Internal audit",
          "Management review",
        ],
        implementationGuidance:
          "Establish KPIs, conduct audits, review performance",
        metrics: [
          "kpi-achievement",
          "audit-findings",
          "management-review-effectiveness",
        ],
        auditCriteria: [
          "KPI reports",
          "Internal audit reports",
          "Management review records",
        ],
      },
      {
        number: "10",
        title: "Improvement",
        description: "Continual improvement",
        requirements: [
          "General",
          "Nonconformity and corrective action",
          "Continual improvement",
        ],
        implementationGuidance:
          "Identify nonconformities, take corrective action, improve",
        metrics: ["corrective-action-effectiveness", "improvement-initiatives"],
        auditCriteria: ["Corrective action records", "Improvement initiatives"],
      },
    ],
    integrationPoints: [
      "event-bus",
      "knowledge-base",
      "evidence-service",
      "risk-management",
      "document-management",
      "audit-management",
      "training-management",
    ],
    apiEndpoints: [
      "/api/qhse/iso/compliance",
      "/api/qhse/iso/requirements",
      "/api/qhse/iso/audits",
      "/api/qhse/iso/certifications",
    ],
    iotRequirements: [
      {
        id: "iot-iso-9001-1",
        deviceType: "Quality sensors",
        protocol: "MQTT",
        dataFormat: "JSON",
        frequency: "real-time",
        security: ["TLS", "authentication"],
        integrationPoints: ["quality-monitoring", "production-control"],
        realTimeProcessing: true,
        edgeComputing: true,
      },
    ],
    aiRequirements: [
      {
        id: "ai-iso-9001-1",
        useCase: "Predictive quality analysis",
        humanRole: "Review and approve AI recommendations",
        aiRole: "Analyze patterns and predict quality issues",
        collaborationModel: "Human-in-the-loop",
        decisionAuthority: "COLLABORATIVE",
        explainabilityRequired: true,
        ethicalConsiderations: ["bias-prevention", "transparency"],
      },
    ],
  },

  "ISO-14001-2015": {
    code: "ISO 14001:2015",
    name: "Environmental Management Systems",
    version: "2015",
    category: "ENVIRONMENTAL",
    description: "International standard for environmental management systems",
    requirements: [
      {
        id: "ISO-14001-4.1",
        clause: "4.1",
        subClause: "4.1",
        title: "Understanding the organization and its context",
        description:
          "Determine external and internal issues relevant to the EMS",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "HYBRID",
        integrationPoints: ["context-analysis", "environmental-impact"],
        relatedStandards: ["ISO-9001-2015", "ISO-45001-2018"],
      },
      {
        id: "ISO-14001-6.1.2",
        clause: "6.1.2",
        subClause: "6.1.2",
        title: "Environmental aspects",
        description: "Determine environmental aspects and their impacts",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "HYBRID",
        integrationPoints: ["environmental-assessment", "impact-analysis"],
        relatedStandards: ["ISO-45001-2018"],
      },
      {
        id: "ISO-14001-6.1.3",
        clause: "6.1.3",
        subClause: "6.1.3",
        title: "Compliance obligations",
        description: "Determine compliance obligations",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
        integrationPoints: ["compliance-tracking", "regulatory-monitoring"],
        relatedStandards: ["ISO-9001-2015"],
      },
      {
        id: "ISO-14001-9.1.1",
        clause: "9.1.1",
        subClause: "9.1.1",
        title: "Monitoring, measurement, analysis and evaluation - General",
        description:
          "Monitor, measure, analyze and evaluate environmental performance",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
        integrationPoints: [
          "environmental-monitoring",
          "iot-sensors",
          "analytics",
        ],
        relatedStandards: ["ISO-9001-2015", "ISO-45001-2018"],
      },
    ],
    clauses: [
      {
        number: "4",
        title: "Context of the organization",
        description: "Understanding the organization and its context",
        requirements: [
          "Determine external and internal issues",
          "Determine interested parties",
          "Determine the scope of the EMS",
          "Establish the EMS",
        ],
        implementationGuidance: "Conduct environmental context analysis",
        metrics: ["environmental-awareness", "stakeholder-engagement"],
        auditCriteria: [
          "Environmental context documented",
          "EMS scope defined",
        ],
      },
      {
        number: "6",
        title: "Planning",
        description: "Planning for the EMS",
        requirements: [
          "Address risks and opportunities",
          "Environmental aspects",
          "Compliance obligations",
          "Environmental objectives",
        ],
        implementationGuidance:
          "Assess environmental aspects, identify compliance obligations",
        metrics: [
          "aspect-coverage",
          "compliance-rate",
          "objective-achievement",
        ],
        auditCriteria: [
          "Environmental aspects register",
          "Compliance obligations register",
          "Environmental objectives",
        ],
      },
      {
        number: "9",
        title: "Performance evaluation",
        description: "Monitor and evaluate environmental performance",
        requirements: [
          "Monitoring, measurement, analysis and evaluation",
          "Evaluation of compliance",
          "Internal audit",
          "Management review",
        ],
        implementationGuidance: "Monitor environmental metrics, conduct audits",
        metrics: ["emission-reduction", "waste-reduction", "energy-efficiency"],
        auditCriteria: [
          "Environmental monitoring records",
          "Compliance evaluation records",
          "Audit reports",
        ],
      },
    ],
    integrationPoints: [
      "event-bus",
      "knowledge-base",
      "evidence-service",
      "environmental-monitoring",
      "iot-sensors",
      "carbon-tracking",
      "waste-management",
    ],
    apiEndpoints: [
      "/api/qhse/environmental/compliance",
      "/api/qhse/environmental/metrics",
      "/api/qhse/environmental/aspects",
      "/api/qhse/environmental/audits",
    ],
    iotRequirements: [
      {
        id: "iot-iso-14001-1",
        deviceType: "Air quality sensors",
        protocol: "MQTT",
        dataFormat: "JSON",
        frequency: "real-time",
        security: ["TLS", "authentication"],
        integrationPoints: ["air-quality-monitoring", "emission-tracking"],
        realTimeProcessing: true,
        edgeComputing: true,
      },
      {
        id: "iot-iso-14001-2",
        deviceType: "Water quality sensors",
        protocol: "MQTT",
        dataFormat: "JSON",
        frequency: "real-time",
        security: ["TLS", "authentication"],
        integrationPoints: ["water-quality-monitoring", "wastewater-tracking"],
        realTimeProcessing: true,
        edgeComputing: true,
      },
      {
        id: "iot-iso-14001-3",
        deviceType: "Energy meters",
        protocol: "MODBUS",
        dataFormat: "BINARY",
        frequency: "real-time",
        security: ["encryption", "authentication"],
        integrationPoints: ["energy-monitoring", "carbon-footprint"],
        realTimeProcessing: true,
        edgeComputing: true,
      },
    ],
    aiRequirements: [
      {
        id: "ai-iso-14001-1",
        useCase: "Predictive environmental impact analysis",
        humanRole: "Review and validate AI predictions",
        aiRole: "Predict environmental impacts and recommend mitigation",
        collaborationModel: "Human-in-the-loop",
        decisionAuthority: "COLLABORATIVE",
        explainabilityRequired: true,
        ethicalConsiderations: ["sustainability-ethics", "transparency"],
      },
    ],
  },

  "ISO-45001-2018": {
    code: "ISO 45001:2018",
    name: "Occupational Health and Safety Management",
    version: "2018",
    category: "SAFETY",
    description:
      "International standard for occupational health and safety management",
    requirements: [
      {
        id: "ISO-45001-6.1.2",
        clause: "6.1.2",
        subClause: "6.1.2",
        title:
          "Hazard identification and assessment of risks and opportunities",
        description: "Identify hazards and assess OH&S risks",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "HYBRID",
        integrationPoints: ["hazard-identification", "risk-assessment"],
        relatedStandards: ["ISO-9001-2015", "ISO-14001-2015"],
      },
      {
        id: "ISO-45001-8.1.1",
        clause: "8.1.1",
        subClause: "8.1.1",
        title: "Operational planning and control - General",
        description:
          "Plan, implement and control processes needed to meet OH&S requirements",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
        integrationPoints: ["operational-control", "safety-procedures"],
        relatedStandards: ["ISO-9001-2015"],
      },
      {
        id: "ISO-45001-9.1.1",
        clause: "9.1.1",
        subClause: "9.1.1",
        title:
          "Monitoring, measurement, analysis and performance evaluation - General",
        description: "Monitor, measure and evaluate OH&S performance",
        mandatory: true,
        evidenceRequired: true,
        validationMethod: "AUTOMATED",
        integrationPoints: ["safety-monitoring", "performance-tracking"],
        relatedStandards: ["ISO-9001-2015", "ISO-14001-2015"],
      },
    ],
    clauses: [
      {
        number: "6",
        title: "Planning",
        description: "Planning for the OH&S management system",
        requirements: [
          "Address risks and opportunities",
          "Hazard identification and assessment",
          "OH&S objectives and planning",
        ],
        implementationGuidance:
          "Identify hazards, assess risks, set objectives",
        metrics: [
          "hazard-identification-rate",
          "risk-mitigation-effectiveness",
        ],
        auditCriteria: [
          "Hazard register",
          "Risk assessment records",
          "OH&S objectives",
        ],
      },
      {
        number: "8",
        title: "Operation",
        description: "Operational planning and control",
        requirements: [
          "Operational planning and control",
          "Elimination of hazards and reduction of OH&S risks",
          "Management of change",
          "Procurement",
          "Contractors",
          "Emergency preparedness and response",
        ],
        implementationGuidance:
          "Control operations, manage contractors, prepare for emergencies",
        metrics: ["incident-rate", "near-miss-rate", "contractor-safety"],
        auditCriteria: [
          "Operational procedures",
          "Contractor management records",
          "Emergency response plans",
        ],
      },
      {
        number: "9",
        title: "Performance evaluation",
        description: "Monitor and evaluate OH&S performance",
        requirements: [
          "Monitoring, measurement, analysis and evaluation",
          "Incident investigation",
          "Internal audit",
          "Management review",
        ],
        implementationGuidance:
          "Monitor performance, investigate incidents, conduct audits",
        metrics: ["TRIR", "LTIFR", "incident-severity", "audit-findings"],
        auditCriteria: [
          "Performance monitoring records",
          "Incident investigation reports",
          "Audit reports",
        ],
      },
    ],
    integrationPoints: [
      "event-bus",
      "knowledge-base",
      "evidence-service",
      "incident-management",
      "risk-management",
      "training-management",
      "iot-safety-sensors",
    ],
    apiEndpoints: [
      "/api/qhse/safety/compliance",
      "/api/qhse/safety/hazards",
      "/api/qhse/safety/incidents",
      "/api/qhse/safety/audits",
    ],
    iotRequirements: [
      {
        id: "iot-iso-45001-1",
        deviceType: "Wearable safety devices",
        protocol: "BLE",
        dataFormat: "JSON",
        frequency: "real-time",
        security: ["encryption", "authentication"],
        integrationPoints: ["worker-safety-monitoring", "incident-prevention"],
        realTimeProcessing: true,
        edgeComputing: true,
      },
      {
        id: "iot-iso-45001-2",
        deviceType: "Gas detection sensors",
        protocol: "MQTT",
        dataFormat: "JSON",
        frequency: "real-time",
        security: ["TLS", "authentication"],
        integrationPoints: ["gas-monitoring", "alarm-systems"],
        realTimeProcessing: true,
        edgeComputing: true,
      },
    ],
    aiRequirements: [
      {
        id: "ai-iso-45001-1",
        useCase: "Predictive safety risk analysis",
        humanRole: "Review AI recommendations and take action",
        aiRole: "Analyze patterns and predict safety risks",
        collaborationModel: "Human-in-the-loop",
        decisionAuthority: "COLLABORATIVE",
        explainabilityRequired: true,
        ethicalConsiderations: ["worker-safety-priority", "transparency"],
      },
    ],
  },
};

// ============================================================================
// ISO STANDARDS SERVICE
// ============================================================================

class ISOStandardsService {
  /**
   * Get ISO standard by code
   */
  getStandard(code: string): ISOStandard | undefined {
    return isoStandards[code];
  }

  /**
   * Get all ISO standards
   */
  getAllStandards(): ISOStandard[] {
    return Object.values(isoStandards);
  }

  /**
   * Get requirements for a standard
   */
  getRequirements(standardCode: string): ISORequirement[] {
    const standard = this.getStandard(standardCode);
    return standard?.requirements || [];
  }

  /**
   * Get clauses for a standard
   */
  getClauses(standardCode: string): ISOClause[] {
    const standard = this.getStandard(standardCode);
    return standard?.clauses || [];
  }

  /**
   * Check compliance with ISO standard
   */
  async checkCompliance(
    standardCode: string,
    tenantId?: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<{
    standard: string;
    complianceScore: number;
    requirements: Array<{
      requirement: ISORequirement;
      compliant: boolean;
      evidence: string[];
      gaps: string[];
    }>;
    overallStatus: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
    recommendations: string[];
  }> {
    const standard = this.getStandard(standardCode);
    if (!standard) {
      throw new Error(`ISO standard ${standardCode} not found`);
    }

    // Check each requirement
    const requirementChecks = await Promise.all(
      standard.requirements.map(async (req) => {
        // Query knowledge base for evidence
        const evidence = await knowledgeBaseService.search({
          query: `${standard.code} ${req.title}`,
          category: "QHSE",
          tenantId,
          customerId,
          warehouseId,
          limit: 10,
        });

        // Check evidence service for compliance records
        const complianceEvidence = await evidenceService.getEvidence({
          entityType: "QHSE_COMPLIANCE",
          entityId: req.id,
          tenantId,
          customerId,
          warehouseId,
        });

        const allEvidence = [
          ...evidence.map((e) => e.id),
          ...complianceEvidence.map((e) => e.id),
        ];

        // Determine compliance status
        const compliant = req.evidenceRequired ? allEvidence.length > 0 : true;

        const gaps = compliant ? [] : ["Evidence required but not found"];

        return {
          requirement: req,
          compliant,
          evidence: allEvidence,
          gaps,
        };
      }),
    );

    // Calculate compliance score
    const compliantCount = requirementChecks.filter((r) => r.compliant).length;
    const totalCount = requirementChecks.length;
    const complianceScore =
      totalCount > 0 ? (compliantCount / totalCount) * 100 : 0;

    // Determine overall status
    let overallStatus: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
    if (complianceScore >= 95) {
      overallStatus = "COMPLIANT";
    } else if (complianceScore >= 70) {
      overallStatus = "PARTIALLY_COMPLIANT";
    } else {
      overallStatus = "NON_COMPLIANT";
    }

    // Generate recommendations
    const recommendations = requirementChecks
      .filter((r) => !r.compliant)
      .map(
        (r) =>
          `Address requirement ${r.requirement.id}: ${r.requirement.title}`,
      );

    // Publish compliance check event
    await eventBus.publish({
      type: "qhse.iso.compliance.checked",
      payload: {
        standardCode,
        complianceScore,
        overallStatus,
        tenantId,
        customerId,
        warehouseId,
      },
    });

    return {
      standard: standard.code,
      complianceScore,
      requirements: requirementChecks,
      overallStatus,
      recommendations,
    };
  }

  /**
   * Get integration points for a standard
   */
  getIntegrationPoints(standardCode: string): string[] {
    const standard = this.getStandard(standardCode);
    return standard?.integrationPoints || [];
  }

  /**
   * Get IoT requirements for a standard
   */
  getIoTRequirements(standardCode: string) {
    const standard = this.getStandard(standardCode);
    return standard?.iotRequirements || [];
  }

  /**
   * Get AI requirements for a standard
   */
  getAIRequirements(standardCode: string) {
    const standard = this.getStandard(standardCode);
    return standard?.aiRequirements || [];
  }
}

export const isoStandardsService = new ISOStandardsService();
