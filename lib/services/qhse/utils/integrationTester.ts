/**
 * QHSE Integration Tester
 * Comprehensive integration testing for all QHSE services
 */

import { foodSafetyService } from "../foodSafetyService";
import { pharmaceuticalService } from "../pharmaceuticalService";
import { oilGasService } from "../oilGasService";
import { businessContinuityService } from "../businessContinuityService";
import { predictiveAnalyticsService } from "../ai/predictiveAnalyticsService";
import { digitalTwinService } from "../digitalTwinService";
import { comprehensiveStandardsService } from "../standards/comprehensiveStandardsFramework";
import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { QHSETestUtils } from "./testUtils";

export interface IntegrationTestResult {
  service: string;
  test: string;
  passed: boolean;
  error?: string;
  duration: number;
  integrationPoints: string[];
}

export class QHSEIntegrationTester {
  /**
   * Test all service integrations
   */
  static async testAllIntegrations(): Promise<IntegrationTestResult[]> {
    const results: IntegrationTestResult[] = [];

    // Test Food Safety Service Integration
    results.push(...(await this.testFoodSafetyIntegration()));

    // Test Pharmaceutical Service Integration
    results.push(...(await this.testPharmaceuticalIntegration()));

    // Test Oil & Gas Service Integration
    results.push(...(await this.testOilGasIntegration()));

    // Test Business Continuity Service Integration
    results.push(...(await this.testBusinessContinuityIntegration()));

    // Test AI/ML Service Integration
    results.push(...(await this.testAIServiceIntegration()));

    // Test Digital Twin Service Integration
    results.push(...(await this.testDigitalTwinIntegration()));

    // Test Standards Service Integration
    results.push(...(await this.testStandardsIntegration()));

    // Test Event Bus Integration
    results.push(...(await this.testEventBusIntegration()));

    // Test Knowledge Base Integration
    results.push(...(await this.testKnowledgeBaseIntegration()));

    return results;
  }

  /**
   * Test Food Safety Service Integration
   */
  private static async testFoodSafetyIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];
    const tenantId = QHSETestUtils.generateMockTenantId();

    // Test HACCP Plan Creation with Event Bus
    const haccpTest = await QHSETestUtils.testServiceMethod(
      "Food Safety: Create HACCP Plan (Event Bus Integration)",
      async () => {
        const plan = await foodSafetyService.createHACCPPlan(
          QHSETestUtils.generateMockHACCPPlan({ tenantId }),
        );
        return plan;
      },
      (result) => result !== null && result.id !== undefined,
    );
    results.push({
      service: "Food Safety",
      test: haccpTest.test,
      passed: haccpTest.passed,
      error: haccpTest.error,
      duration: haccpTest.duration,
      integrationPoints: ["Event Bus", "Knowledge Base"],
    });

    return results;
  }

  /**
   * Test Pharmaceutical Service Integration
   */
  private static async testPharmaceuticalIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];
    const tenantId = QHSETestUtils.generateMockTenantId();

    // Test Batch Record Creation
    const batchTest = await QHSETestUtils.testServiceMethod(
      "Pharmaceutical: Create Batch Record (Event Bus Integration)",
      async () => {
        const record = await pharmaceuticalService.createBatchRecord(
          QHSETestUtils.generateMockBatchRecord({ tenantId }),
        );
        return record;
      },
      (result) =>
        result !== null &&
        result.id !== undefined &&
        result.auditTrail.length > 0,
    );
    results.push({
      service: "Pharmaceutical",
      test: batchTest.test,
      passed: batchTest.passed,
      error: batchTest.error,
      duration: batchTest.duration,
      integrationPoints: ["Event Bus", "Audit Trail", "Knowledge Base"],
    });

    return results;
  }

  /**
   * Test Oil & Gas Service Integration
   */
  private static async testOilGasIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];
    const tenantId = QHSETestUtils.generateMockTenantId();

    // Test Inspection Creation
    const inspectionTest = await QHSETestUtils.testServiceMethod(
      "Oil & Gas: Create Inspection (Event Bus Integration)",
      async () => {
        const inspection = await oilGasService.createInspectionRecord(
          QHSETestUtils.generateMockInspectionRecord({ tenantId }),
        );
        return inspection;
      },
      (result) => result !== null && result.id !== undefined,
    );
    results.push({
      service: "Oil & Gas",
      test: inspectionTest.test,
      passed: inspectionTest.passed,
      error: inspectionTest.error,
      duration: inspectionTest.duration,
      integrationPoints: ["Event Bus", "Knowledge Base"],
    });

    return results;
  }

  /**
   * Test Business Continuity Service Integration
   */
  private static async testBusinessContinuityIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];
    const tenantId = QHSETestUtils.generateMockTenantId();

    // Test BIA Creation
    const biaTest = await QHSETestUtils.testServiceMethod(
      "Business Continuity: Create BIA (Event Bus Integration)",
      async () => {
        const bia = await businessContinuityService.createBIA({
          tenantId,
          processId: "test-process",
          processName: "Test Process",
          processDescription: "Test Description",
          criticality: "HIGH",
          dependencies: [],
          impactAssessment: {
            financial: {
              hourly: 10000,
              daily: 240000,
              weekly: 1680000,
              monthly: 7200000,
              currency: "USD",
            },
            operational: {
              customerImpact: "MAJOR",
              reputationImpact: "MAJOR",
              regulatoryImpact: "MODERATE",
              description: "Test impact",
            },
            recoveryTimeObjectives: {
              rto: 24,
              rpo: 4,
              mtd: 48,
              justification: "Test justification",
            },
          },
          threats: [],
        });
        return bia;
      },
      (result) => result !== null && result.id !== undefined,
    );
    results.push({
      service: "Business Continuity",
      test: biaTest.test,
      passed: biaTest.passed,
      error: biaTest.error,
      duration: biaTest.duration,
      integrationPoints: ["Event Bus", "Knowledge Base"],
    });

    return results;
  }

  /**
   * Test AI/ML Service Integration
   */
  private static async testAIServiceIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];

    // Test Risk Prediction
    const riskTest = await QHSETestUtils.testServiceMethod(
      "AI/ML: Predict Risk (Event Bus Integration)",
      async () => {
        const prediction = await predictiveAnalyticsService.predictRisk(
          "PROCESS",
          "test-process",
          "SAFETY",
        );
        return prediction;
      },
      (result) => result !== null && typeof result.riskScore === "number",
    );
    results.push({
      service: "AI/ML",
      test: riskTest.test,
      passed: riskTest.passed,
      error: riskTest.error,
      duration: riskTest.duration,
      integrationPoints: ["Event Bus"],
    });

    return results;
  }

  /**
   * Test Digital Twin Service Integration
   */
  private static async testDigitalTwinIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];

    // Test Digital Twin Creation
    const twinTest = await QHSETestUtils.testServiceMethod(
      "Digital Twin: Create Twin (Event Bus Integration)",
      async () => {
        const twin = await digitalTwinService.createTwin({
          name: "Test Twin",
          type: "EQUIPMENT",
          physicalEntityId: "test-entity",
          physicalEntityName: "Test Entity",
          description: "Test Description",
          syncFrequency: 60,
          dataModel: {
            properties: [],
            relationships: [],
          },
          iotConnections: [],
          aiModels: [],
        });
        return twin;
      },
      (result) => result !== null && result.id !== undefined,
    );
    results.push({
      service: "Digital Twin",
      test: twinTest.test,
      passed: twinTest.passed,
      error: twinTest.error,
      duration: twinTest.duration,
      integrationPoints: ["Event Bus"],
    });

    return results;
  }

  /**
   * Test Standards Service Integration
   */
  private static async testStandardsIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];

    // Test Get All Standards
    const standardsTest = await QHSETestUtils.testServiceMethod(
      "Standards: Get All Standards",
      async () => {
        return comprehensiveStandardsService.getAllStandards();
      },
      (result) => Array.isArray(result) && result.length > 0,
    );
    results.push({
      service: "Standards",
      test: standardsTest.test,
      passed: standardsTest.passed,
      error: standardsTest.error,
      duration: standardsTest.duration,
      integrationPoints: [],
    });

    return results;
  }

  /**
   * Test Event Bus Integration
   */
  private static async testEventBusIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];

    // Test Event Publishing
    const eventTest = await QHSETestUtils.testServiceMethod(
      "Event Bus: Publish Event",
      async () => {
        await eventBus.publish({
          type: "qhse.test.event",
          payload: { test: true },
          timestamp: new Date(),
        });
        return { success: true };
      },
      (result) => result.success === true,
    );
    results.push({
      service: "Event Bus",
      test: eventTest.test,
      passed: eventTest.passed,
      error: eventTest.error,
      duration: eventTest.duration,
      integrationPoints: [],
    });

    return results;
  }

  /**
   * Test Knowledge Base Integration
   */
  private static async testKnowledgeBaseIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];

    // Test Knowledge Base Entity Creation
    const kbTest = await QHSETestUtils.testServiceMethod(
      "Knowledge Base: Create Entity",
      async () => {
        await knowledgeBaseService.addEntity({
          id: `test-${Date.now()}`,
          type: "INCIDENT",
          title: "Test Incident",
          description: "Test Description",
          metadata: {},
          tenantId: QHSETestUtils.generateMockTenantId(),
        });
        return { success: true };
      },
      (result) => result.success === true,
    );
    results.push({
      service: "Knowledge Base",
      test: kbTest.test,
      passed: kbTest.passed,
      error: kbTest.error,
      duration: kbTest.duration,
      integrationPoints: [],
    });

    return results;
  }

  /**
   * Generate integration test report
   */
  static generateIntegrationReport(results: IntegrationTestResult[]): string {
    let report = "# QHSE Integration Test Report\n\n";

    const byService = results.reduce(
      (acc, result) => {
        if (!acc[result.service]) {
          acc[result.service] = [];
        }
        acc[result.service].push(result);
        return acc;
      },
      {} as Record<string, IntegrationTestResult[]>,
    );

    Object.entries(byService).forEach(([service, serviceResults]) => {
      report += `## ${service}\n\n`;
      const passed = serviceResults.filter((r) => r.passed).length;
      const failed = serviceResults.filter((r) => !r.passed).length;

      report += `- **Total Tests**: ${serviceResults.length}\n`;
      report += `- **Passed**: ${passed}\n`;
      report += `- **Failed**: ${failed}\n`;
      report += `- **Success Rate**: ${((passed / serviceResults.length) * 100).toFixed(2)}%\n\n`;

      if (failed > 0) {
        report += "### Failed Tests:\n\n";
        serviceResults
          .filter((r) => !r.passed)
          .forEach((result) => {
            report += `- **${result.test}**: ${result.error}\n`;
            report += `  - Integration Points: ${result.integrationPoints.join(", ")}\n`;
          });
        report += "\n";
      }

      report += "---\n\n";
    });

    const totalTests = results.length;
    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = results.filter((r) => !r.passed).length;

    report += `## Summary\n\n`;
    report += `- **Total Tests**: ${totalTests}\n`;
    report += `- **Passed**: ${totalPassed}\n`;
    report += `- **Failed**: ${totalFailed}\n`;
    report += `- **Success Rate**: ${((totalPassed / totalTests) * 100).toFixed(2)}%\n`;

    return report;
  }
}
