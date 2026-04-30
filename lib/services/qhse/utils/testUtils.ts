/**
 * QHSE Test Utilities
 * Comprehensive testing utilities for QHSE services
 */

import { QHSEValidator } from "./validation";
import { QHSEErrorHandler } from "./errorHandler";

export interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

export class QHSETestUtils {
  /**
   * Test service method
   */
  static async testServiceMethod<T>(
    name: string,
    method: () => Promise<T>,
    expectedResult?: (result: T) => boolean,
  ): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const result = await method();
      const duration = Date.now() - startTime;

      if (expectedResult && !expectedResult(result)) {
        return {
          test: name,
          passed: false,
          error: "Result did not match expected condition",
          duration,
        };
      }

      return {
        test: name,
        passed: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        test: name,
        passed: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Test validation
   */
  static testValidation(
    name: string,
    validator: () => { valid: boolean; errors: string[] },
  ): TestResult {
    const startTime = Date.now();
    try {
      const result = validator();
      const duration = Date.now() - startTime;

      return {
        test: name,
        passed: result.valid,
        error: result.errors.length > 0 ? result.errors.join(", ") : undefined,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        test: name,
        passed: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Test API endpoint
   */
  static async testAPIEndpoint(
    name: string,
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any,
  ): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (body && (method === "POST" || method === "PUT")) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          test: name,
          passed: false,
          error: `HTTP ${response.status}: ${errorText}`,
          duration,
        };
      }

      const data = await response.json();
      if (!data.success) {
        return {
          test: name,
          passed: false,
          error: data.error || "API returned success: false",
          duration,
        };
      }

      return {
        test: name,
        passed: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        test: name,
        passed: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Run test suite
   */
  static async runTestSuite(
    name: string,
    tests: Array<() => Promise<TestResult>>,
  ): Promise<TestSuite> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    for (const test of tests) {
      const result = await test();
      results.push(result);
    }

    const duration = Date.now() - startTime;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    return {
      name,
      results,
      passed,
      failed,
      duration,
    };
  }

  /**
   * Generate test report
   */
  static generateTestReport(suites: TestSuite[]): string {
    let report = "# QHSE Module Test Report\n\n";

    suites.forEach((suite) => {
      report += `## ${suite.name}\n\n`;
      report += `- **Total Tests**: ${suite.results.length}\n`;
      report += `- **Passed**: ${suite.passed}\n`;
      report += `- **Failed**: ${suite.failed}\n`;
      report += `- **Duration**: ${suite.duration}ms\n\n`;

      if (suite.failed > 0) {
        report += "### Failed Tests:\n\n";
        suite.results
          .filter((r) => !r.passed)
          .forEach((result) => {
            report += `- **${result.test}**: ${result.error}\n`;
          });
        report += "\n";
      }

      report += "---\n\n";
    });

    const totalTests = suites.reduce((sum, s) => sum + s.results.length, 0);
    const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0);
    const totalDuration = suites.reduce((sum, s) => sum + s.duration, 0);

    report += `## Summary\n\n`;
    report += `- **Total Tests**: ${totalTests}\n`;
    report += `- **Passed**: ${totalPassed}\n`;
    report += `- **Failed**: ${totalFailed}\n`;
    report += `- **Success Rate**: ${((totalPassed / totalTests) * 100).toFixed(2)}%\n`;
    report += `- **Total Duration**: ${totalDuration}ms\n`;

    return report;
  }

  /**
   * Mock data generators
   */
  static generateMockTenantId(): string {
    return `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  static generateMockHACCPPlan(overrides?: any): any {
    return {
      tenantId: this.generateMockTenantId(),
      productName: "Test Product",
      processSteps: [
        {
          stepNumber: 1,
          name: "Receiving",
          description: "Receive raw materials",
          location: "Receiving Area",
          potentialHazards: ["BIOLOGICAL", "PHYSICAL"],
          controlMeasures: ["Temperature control", "Visual inspection"],
          isCCP: false,
        },
      ],
      ccpRegister: [],
      hazardAnalysis: [],
      criticalLimits: [],
      monitoringProcedures: [],
      correctiveActions: [],
      verificationProcedures: [],
      recordKeeping: [],
      ...overrides,
    };
  }

  static generateMockBatchRecord(overrides?: any): any {
    return {
      tenantId: this.generateMockTenantId(),
      batchNumber: `BATCH-${Date.now()}`,
      productName: "Test Product",
      productCode: "PROD-001",
      manufacturingDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      lotSize: 1000,
      unit: "UNITS",
      manufacturingSteps: [],
      materials: [],
      equipment: [],
      environmentalConditions: [],
      inProcessControls: [],
      testing: [],
      deviations: [],
      approvals: [],
      ...overrides,
    };
  }

  static generateMockInspectionRecord(overrides?: any): any {
    return {
      tenantId: this.generateMockTenantId(),
      inspectionType: "PRESSURE_VESSEL",
      standard: "API_510",
      equipmentId: `eq-${Date.now()}`,
      equipmentName: "Test Equipment",
      location: "Test Location",
      scheduledDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      inspector: "Test Inspector",
      inspectionMethod: "VISUAL",
      findings: [],
      recommendations: [],
      ...overrides,
    };
  }
}
