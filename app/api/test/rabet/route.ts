/**
 * Rabet.sa Integration Test API
 *
 * Test endpoint for verifying all Rabet.sa integrations
 * GET /api/test/rabet
 */

import { NextResponse } from "next/server";
import { getOrInitializeAthrNaqlService } from "@/lib/services/athr-naql/initialize";
import { getOrInitializeWaslService } from "@/lib/services/wasl/initialize";
import { getOrInitializeBayanService } from "@/lib/services/bayan/initialize";
import { getOrInitializeDaleelService } from "@/lib/services/daleel/initialize";

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Test Athr Naql
  try {
    const athrNaqlService = await getOrInitializeAthrNaqlService();
    const connection = await athrNaqlService.testConnection();
    results.tests.athrNaql = {
      success: connection.success,
      message: connection.message,
    };
  } catch (error: any) {
    results.tests.athrNaql = {
      success: false,
      message: error.message,
    };
  }

  // Test WASL
  try {
    const waslService = await getOrInitializeWaslService();
    const connection = await waslService.testConnection();
    results.tests.wasl = {
      success: connection.success,
      message: connection.message,
    };
  } catch (error: any) {
    results.tests.wasl = {
      success: false,
      message: error.message,
    };
  }

  // Test Bayan
  try {
    const bayanService = await getOrInitializeBayanService();
    const connection = await bayanService.testConnection();
    results.tests.bayan = {
      success: connection.success,
      message: connection.message,
    };
  } catch (error: any) {
    results.tests.bayan = {
      success: false,
      message: error.message,
    };
  }

  // Test Daleel
  try {
    const daleelService = await getOrInitializeDaleelService();
    const connection = await daleelService.testConnection();
    results.tests.daleel = {
      success: connection.success,
      message: connection.message,
    };
  } catch (error: any) {
    results.tests.daleel = {
      success: false,
      message: error.message,
    };
  }

  // Calculate overall success
  const allSuccess = Object.values(results.tests).every(
    (test: any) => test.success === true,
  );

  results.overall = {
    success: allSuccess,
    passed: Object.values(results.tests).filter((t: any) => t.success).length,
    total: Object.keys(results.tests).length,
  };

  return NextResponse.json(results, {
    status: allSuccess ? 200 : 500,
  });
}
