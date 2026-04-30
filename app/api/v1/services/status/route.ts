/**
 * Services Status Endpoint
 * Returns detailed status of all infrastructure services
 */

import { NextResponse } from "next/server";
import { redisService } from "@/lib/services/cache/redisService";
import { kafkaClient } from "@/lib/services/kafka";
import { minioClient } from "@/lib/services/storage";
import { opensearchClient } from "@/lib/services/search";
import { mcpServer } from "@/lib/mcp";

export async function GET() {
  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Redis Status
  try {
    const redisStats = await redisService.getStats();
    status.services.redis = {
      enabled: redisService.isEnabled(),
      connected: redisService.isEnabled(),
      stats: redisStats,
      status: redisService.isEnabled() ? "operational" : "disabled",
    };
  } catch (error: any) {
    status.services.redis = {
      enabled: false,
      connected: false,
      status: "error",
      error: error.message,
    };
  }

  // Kafka Status
  try {
    const kafkaEnabled = kafkaClient.isEnabled();
    const kafkaConnected = kafkaEnabled
      ? await kafkaClient.testConnection()
      : false;
    status.services.kafka = {
      enabled: kafkaEnabled,
      connected: kafkaConnected,
      status: kafkaConnected
        ? "operational"
        : kafkaEnabled
          ? "disconnected"
          : "disabled",
    };
  } catch (error: any) {
    status.services.kafka = {
      enabled: false,
      connected: false,
      status: "error",
      error: error.message,
    };
  }

  // MinIO Status
  try {
    const minioEnabled = minioClient.isEnabled();
    status.services.minio = {
      enabled: minioEnabled,
      connected: minioEnabled,
      status: minioEnabled ? "operational" : "disabled",
    };
  } catch (error: any) {
    status.services.minio = {
      enabled: false,
      connected: false,
      status: "error",
      error: error.message,
    };
  }

  // OpenSearch Status
  try {
    const opensearchEnabled = opensearchClient.isEnabled();
    status.services.opensearch = {
      enabled: opensearchEnabled,
      connected: opensearchEnabled,
      status: opensearchEnabled ? "operational" : "disabled",
    };
  } catch (error: any) {
    status.services.opensearch = {
      enabled: false,
      connected: false,
      status: "error",
      error: error.message,
    };
  }

  // MCP Server Status
  try {
    const tools = mcpServer.listTools();
    status.services.mcp = {
      enabled: tools.length > 0,
      toolsCount: tools.length,
      status: tools.length > 0 ? "operational" : "disabled",
    };
  } catch (error: any) {
    status.services.mcp = {
      enabled: false,
      status: "error",
      error: error.message,
    };
  }

  // Calculate overall status
  const serviceStatuses = Object.values(status.services).map(
    (s: any) => s.status,
  );
  const operationalCount = serviceStatuses.filter(
    (s) => s === "operational",
  ).length;
  const totalCount = serviceStatuses.length;

  status.summary = {
    total: totalCount,
    operational: operationalCount,
    disabled: serviceStatuses.filter((s) => s === "disabled").length,
    errors: serviceStatuses.filter((s) => s === "error").length,
    health:
      operationalCount === totalCount
        ? "healthy"
        : operationalCount > totalCount / 2
          ? "degraded"
          : "unhealthy",
  };

  const statusCode =
    status.summary.health === "healthy"
      ? 200
      : status.summary.health === "degraded"
        ? 200
        : 503;

  return NextResponse.json(status, { status: statusCode });
}
