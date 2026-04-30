/**
 * File Storage Test API
 *
 * Simple endpoint to test file storage functionality
 * GET /api/storage/test - Run basic tests
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedFileStorageService } from "@/lib/services/storage/unifiedFileStorageService";
import { getStorageAdapterFactory } from "@/lib/services/storage/adapters/storageAdapterFactory";

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  // Test 1: Storage Provider
  try {
    const factory = getStorageAdapterFactory();
    const provider = factory.getProvider();
    const isAvailable = await factory.isAvailable();

    results.tests.push({
      name: "Storage Provider Configuration",
      status: isAvailable ? "passed" : "warning",
      message: `Provider: ${provider.toUpperCase()}, Available: ${isAvailable}`,
    });
    if (isAvailable) results.summary.passed++;
    else results.summary.warnings++;
  } catch (error: any) {
    results.tests.push({
      name: "Storage Provider Configuration",
      status: "failed",
      message: error.message,
    });
    results.summary.failed++;
  }

  // Test 2: Service Initialization
  try {
    await unifiedFileStorageService.initialize();
    results.tests.push({
      name: "Service Initialization",
      status: "passed",
      message: "Service initialized successfully",
    });
    results.summary.passed++;
  } catch (error: any) {
    results.tests.push({
      name: "Service Initialization",
      status: "failed",
      message: error.message,
    });
    results.summary.failed++;
  }

  // Test 3: Upload Test File
  try {
    const testContent = Buffer.from("Test file for unified storage system");
    const testFileName = `test-${Date.now()}.txt`;

    const fileMetadata = await unifiedFileStorageService.uploadFile({
      file: testContent,
      fileName: testFileName,
      tenantId: "test-tenant",
      module: "test",
      entityType: "test",
      entityId: "test-entity",
      createdBy: "test-user",
      tags: ["test"],
    });

    results.tests.push({
      name: "File Upload",
      status: "passed",
      message: `File uploaded: ${fileMetadata.id}`,
      data: {
        fileId: fileMetadata.id,
        fileName: fileMetadata.fileName,
        fileSize: fileMetadata.fileSize,
        storageUrl: fileMetadata.storageUrl,
      },
    });
    results.summary.passed++;

    // Test 4: Download
    try {
      const { buffer } = await unifiedFileStorageService.downloadFile({
        fileId: fileMetadata.id,
        tenantId: "test-tenant",
        userId: "test-user",
        userRoles: ["SYSTEM_ADMIN"],
      });

      const downloadedContent = buffer.toString();
      if (downloadedContent === testContent.toString()) {
        results.tests.push({
          name: "File Download",
          status: "passed",
          message: "File downloaded and content matches",
        });
        results.summary.passed++;
      } else {
        results.tests.push({
          name: "File Download",
          status: "failed",
          message: "Downloaded content does not match",
        });
        results.summary.failed++;
      }
    } catch (error: any) {
      results.tests.push({
        name: "File Download",
        status: "failed",
        message: error.message,
      });
      results.summary.failed++;
    }

    // Test 5: Get URL
    try {
      const url = await unifiedFileStorageService.getFileUrl(
        fileMetadata.id,
        "test-tenant",
        3600,
      );
      results.tests.push({
        name: "Presigned URL",
        status: "passed",
        message: "URL generated successfully",
        data: { url: url.substring(0, 100) + "..." },
      });
      results.summary.passed++;
    } catch (error: any) {
      results.tests.push({
        name: "Presigned URL",
        status: "warning",
        message: error.message,
      });
      results.summary.warnings++;
    }
  } catch (error: any) {
    results.tests.push({
      name: "File Upload",
      status: "failed",
      message: error.message,
    });
    results.summary.failed++;
  }

  // Overall status
  results.status = results.summary.failed === 0 ? "success" : "partial";
  if (results.summary.failed > 0 && results.summary.passed === 0) {
    results.status = "failed";
  }

  return NextResponse.json(results, {
    status: results.status === "failed" ? 500 : 200,
  });
}
