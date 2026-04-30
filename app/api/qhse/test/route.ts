/**
 * QHSE Test API Route
 * Comprehensive testing endpoint for QHSE module
 */

import { NextRequest, NextResponse } from "next/server";
import { QHSETestUtils } from "@/lib/services/qhse/utils/testUtils";
import { QHSEIntegrationTester } from "@/lib/services/qhse/utils/integrationTester";
import { QHSEValidator } from "@/lib/services/qhse/utils/validation";
import { foodSafetyService } from "@/lib/services/qhse/foodSafetyService";
import { pharmaceuticalService } from "@/lib/services/qhse/pharmaceuticalService";
import { oilGasService } from "@/lib/services/qhse/oilGasService";
import { businessContinuityService } from "@/lib/services/qhse/businessContinuityService";
import { predictiveAnalyticsService } from "@/lib/services/qhse/ai/predictiveAnalyticsService";
import { digitalTwinService } from "@/lib/services/qhse/digitalTwinService";
import { comprehensiveStandardsService } from "@/lib/services/qhse/standards/comprehensiveStandardsFramework";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testType = searchParams.get("type") || "all";
    const includeIntegration = searchParams.get("integration") === "true";

    const suites: any[] = [];

    // Test Validation
    if (testType === "all" || testType === "validation") {
      const validationTests = await QHSETestUtils.runTestSuite(
        "Validation Tests",
        [
          () =>
            QHSETestUtils.testValidation("Validate Tenant ID", () =>
              QHSEValidator.validateTenantId("test-tenant-123"),
            ),
          () =>
            QHSETestUtils.testValidation("Validate Tenant ID - Empty", () =>
              QHSEValidator.validateTenantId(""),
            ),
          () =>
            QHSETestUtils.testValidation("Validate Date", () =>
              QHSEValidator.validateDate(new Date(), "Test Date"),
            ),
          () =>
            QHSETestUtils.testValidation("Validate Email", () =>
              QHSEValidator.validateEmail("test@example.com", "Email"),
            ),
          () =>
            QHSETestUtils.testValidation("Validate Number Range", () =>
              QHSEValidator.validateNumberRange(50, 0, 100, "Value"),
            ),
          () =>
            QHSETestUtils.testValidation("Validate HACCP Plan", () =>
              QHSEValidator.validateHACCPPlan(
                QHSETestUtils.generateMockHACCPPlan(),
              ),
            ),
          () =>
            QHSETestUtils.testValidation("Validate Batch Record", () =>
              QHSEValidator.validateBatchRecord(
                QHSETestUtils.generateMockBatchRecord(),
              ),
            ),
          () =>
            QHSETestUtils.testValidation("Validate Inspection Record", () =>
              QHSEValidator.validateInspectionRecord(
                QHSETestUtils.generateMockInspectionRecord(),
              ),
            ),
        ],
      );
      suites.push(validationTests);
    }

    // Test Food Safety Service
    if (testType === "all" || testType === "food-safety") {
      const foodSafetyTests = await QHSETestUtils.runTestSuite(
        "Food Safety Service Tests",
        [
          () =>
            QHSETestUtils.testServiceMethod(
              "Create HACCP Plan",
              () =>
                foodSafetyService.createHACCPPlan(
                  QHSETestUtils.generateMockHACCPPlan(),
                ),
              (result) => result !== null && result.id !== undefined,
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "List HACCP Plans",
              () =>
                foodSafetyService.listHACCPPlans({
                  tenantId: QHSETestUtils.generateMockTenantId(),
                }),
              (result) => Array.isArray(result),
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Check HACCP Compliance",
              async () => {
                const plan = await foodSafetyService.createHACCPPlan(
                  QHSETestUtils.generateMockHACCPPlan(),
                );
                return foodSafetyService.checkHACCPCompliance(plan.id);
              },
              (result) =>
                typeof result.compliant === "boolean" &&
                typeof result.score === "number",
            ),
        ],
      );
      suites.push(foodSafetyTests);
    }

    // Test Pharmaceutical Service
    if (testType === "all" || testType === "pharmaceutical") {
      const pharmaceuticalTests = await QHSETestUtils.runTestSuite(
        "Pharmaceutical Service Tests",
        [
          () =>
            QHSETestUtils.testServiceMethod(
              "Create Batch Record",
              () =>
                pharmaceuticalService.createBatchRecord(
                  QHSETestUtils.generateMockBatchRecord(),
                ),
              (result) => result !== null && result.id !== undefined,
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "List Batch Records",
              () =>
                pharmaceuticalService.listBatchRecords({
                  tenantId: QHSETestUtils.generateMockTenantId(),
                }),
              (result) => Array.isArray(result),
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "AI Review Batch Record",
              async () => {
                const record = await pharmaceuticalService.createBatchRecord(
                  QHSETestUtils.generateMockBatchRecord(),
                );
                return pharmaceuticalService.aiReviewBatchRecord(record.id);
              },
              (result) =>
                typeof result.riskScore === "number" &&
                Array.isArray(result.anomalies),
            ),
        ],
      );
      suites.push(pharmaceuticalTests);
    }

    // Test Oil & Gas Service
    if (testType === "all" || testType === "oil-gas") {
      const oilGasTests = await QHSETestUtils.runTestSuite(
        "Oil & Gas Service Tests",
        [
          () =>
            QHSETestUtils.testServiceMethod(
              "Create Inspection Record",
              () =>
                oilGasService.createInspectionRecord(
                  QHSETestUtils.generateMockInspectionRecord(),
                ),
              (result) => result !== null && result.id !== undefined,
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Calculate Risk Score",
              () => oilGasService.calculateRiskScore("test-equipment"),
              (result) =>
                typeof result.riskScore === "number" &&
                typeof result.riskLevel === "string",
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Predict Equipment Failure",
              () => oilGasService.predictEquipmentFailure("test-equipment"),
              (result) =>
                typeof result.failureProbability === "number" &&
                Array.isArray(result.factors),
            ),
        ],
      );
      suites.push(oilGasTests);
    }

    // Test Business Continuity Service
    if (testType === "all" || testType === "business-continuity") {
      const bcmTests = await QHSETestUtils.runTestSuite(
        "Business Continuity Service Tests",
        [
          () =>
            QHSETestUtils.testServiceMethod(
              "Create BIA",
              () =>
                businessContinuityService.createBIA({
                  tenantId: QHSETestUtils.generateMockTenantId(),
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
                }),
              (result) => result !== null && result.id !== undefined,
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "AI Assess Risk",
              () => businessContinuityService.aiAssessRisk("test-process"),
              (result) =>
                typeof result.riskScore === "number" &&
                Array.isArray(result.threats),
            ),
        ],
      );
      suites.push(bcmTests);
    }

    // Test Predictive Analytics Service
    if (testType === "all" || testType === "ai") {
      const aiTests = await QHSETestUtils.runTestSuite(
        "AI/ML Predictive Analytics Tests",
        [
          () =>
            QHSETestUtils.testServiceMethod(
              "Predict Risk",
              () =>
                predictiveAnalyticsService.predictRisk(
                  "PROCESS",
                  "test-process",
                  "SAFETY",
                ),
              (result) =>
                typeof result.riskScore === "number" &&
                typeof result.riskLevel === "string",
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Predict Failure",
              () => predictiveAnalyticsService.predictFailure("test-equipment"),
              (result) =>
                typeof result.failureProbability === "number" &&
                result.predictedFailureDate instanceof Date,
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Detect Anomalies",
              () =>
                predictiveAnalyticsService.detectAnomalies(
                  "EQUIPMENT",
                  "test-equipment",
                  { temperature: 150, pressure: 200 },
                ),
              (result) => Array.isArray(result),
            ),
        ],
      );
      suites.push(aiTests);
    }

    // Test Digital Twin Service
    if (testType === "all" || testType === "digital-twin") {
      const digitalTwinTests = await QHSETestUtils.runTestSuite(
        "Digital Twin Service Tests",
        [
          () =>
            QHSETestUtils.testServiceMethod(
              "Create Digital Twin",
              () =>
                digitalTwinService.createTwin({
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
                }),
              (result) => result !== null && result.id !== undefined,
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Sync Twin",
              async () => {
                const twin = await digitalTwinService.createTwin({
                  name: "Test Twin",
                  type: "EQUIPMENT",
                  physicalEntityId: "test-entity",
                  physicalEntityName: "Test Entity",
                  description: "Test Description",
                  syncFrequency: 60,
                  dataModel: {
                    properties: [
                      { name: "temperature", type: "NUMBER", unit: "C" },
                    ],
                    relationships: [],
                  },
                  iotConnections: [],
                  aiModels: [],
                });
                return digitalTwinService.syncTwin(twin.id, {
                  temperature: 25,
                });
              },
              (result) => result !== null && result.syncStatus === "SUCCESS",
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Run Simulation",
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
                return digitalTwinService.runSimulation(
                  twin.id,
                  "NORMAL_OPERATION",
                  {},
                );
              },
              (result) => result !== null && result.status === "COMPLETED",
            ),
        ],
      );
      suites.push(digitalTwinTests);
    }

    // Test Standards Service
    if (testType === "all" || testType === "standards") {
      const standardsTests = await QHSETestUtils.runTestSuite(
        "Standards Service Tests",
        [
          () =>
            QHSETestUtils.testServiceMethod(
              "Get All Standards",
              () =>
                Promise.resolve(
                  comprehensiveStandardsService.getAllStandards(),
                ),
              (result) => Array.isArray(result) && result.length > 0,
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Get Standard Requirements",
              () =>
                Promise.resolve(
                  comprehensiveStandardsService.getStandardRequirements(
                    "ISO_9001",
                  ),
                ),
              (result) => Array.isArray(result) && result.length > 0,
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Get Compliance Status",
              () =>
                Promise.resolve(
                  comprehensiveStandardsService.getComplianceStatus("ISO_9001"),
                ),
              (result) =>
                typeof result.complianceLevel === "number" &&
                typeof result.status === "string",
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Get IR5 Features",
              () =>
                Promise.resolve(comprehensiveStandardsService.getIR5Features()),
              (result) => Array.isArray(result) && result.length > 0,
            ),
          () =>
            QHSETestUtils.testServiceMethod(
              "Get IR6 Features",
              () =>
                Promise.resolve(comprehensiveStandardsService.getIR6Features()),
              (result) => Array.isArray(result) && result.length > 0,
            ),
        ],
      );
      suites.push(standardsTests);
    }

    // Integration Tests
    let integrationResults: any[] = [];
    if (includeIntegration || testType === "all") {
      integrationResults = await QHSEIntegrationTester.testAllIntegrations();
    }

    // Generate report
    const report = QHSETestUtils.generateTestReport(suites);
    const integrationReport =
      integrationResults.length > 0
        ? QHSEIntegrationTester.generateIntegrationReport(integrationResults)
        : null;

    return NextResponse.json({
      success: true,
      data: {
        suites,
        report,
        integrationTests:
          integrationResults.length > 0
            ? {
                results: integrationResults,
                report: integrationReport,
                summary: {
                  totalTests: integrationResults.length,
                  totalPassed: integrationResults.filter((r) => r.passed)
                    .length,
                  totalFailed: integrationResults.filter((r) => !r.passed)
                    .length,
                  successRate:
                    (
                      (integrationResults.filter((r) => r.passed).length /
                        integrationResults.length) *
                      100
                    ).toFixed(2) + "%",
                },
              }
            : null,
        summary: {
          totalSuites: suites.length,
          totalTests: suites.reduce((sum, s) => sum + s.results.length, 0),
          totalPassed: suites.reduce((sum, s) => sum + s.passed, 0),
          totalFailed: suites.reduce((sum, s) => sum + s.failed, 0),
          totalDuration: suites.reduce((sum, s) => sum + s.duration, 0),
        },
      },
    });
  } catch (error) {
    console.error("Error in QHSE test API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.test",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
