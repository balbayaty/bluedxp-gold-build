/**
 * Facility IoT Devices API Route
 * Handles IoT device management and real-time data
 *
 * SECURITY: Protected with API Gateway
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { getFacilityIoTService } from "@/lib/services/facility/iot/facilityIoTService";
import { getFacilityIntegrationService } from "@/lib/services/facility/integration/facilityIntegrationService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

const integrationService = getFacilityIntegrationService();

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "facility-1";
    const deviceId = searchParams.get("deviceId");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const includeData = searchParams.get("includeData") === "true";

    const iotService = getFacilityIoTService();

    let devices: any[] = [];

    if (deviceId) {
      // Get specific device - use iotManager directly
      const { AdvancedIoTManager } =
        await import("@/lib/services/iot/iotManager");
      const iotManager = new AdvancedIoTManager();
      const device = await iotManager.getDevice(deviceId);
      devices = device ? [device] : [];
    } else {
      // Get all devices for facility - use getDevicesByLocation
      const { AdvancedIoTManager } =
        await import("@/lib/services/iot/iotManager");
      const iotManager = new AdvancedIoTManager();
      devices = await iotManager.getDevicesByLocation(facilityId);

      // Apply filters
      if (category) {
        devices = devices.filter((d) => d.category === category);
      }
      if (status) {
        const deviceStatus =
          typeof devices[0]?.status === "object"
            ? devices[0].status.operational
            : devices[0]?.status;
        devices = devices.filter((d) => {
          const dStatus =
            typeof d.status === "object" ? d.status.operational : d.status;
          return dStatus === status;
        });
      }
    }

    // Get real-time data if requested - use getSensorReadings
    let deviceData = null;
    if (includeData && devices.length > 0) {
      try {
        const sensorReadings = await iotService.getSensorReadings(facilityId, {
          startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        });
        deviceData = devices.reduce(
          (acc, device) => {
            const readings = sensorReadings.filter(
              (r) => r.deviceId === device.id,
            );
            if (readings.length > 0) {
              acc[device.id] = {
                latestReading: readings[0],
                recentReadings: readings.slice(0, 10),
              };
            }
            return acc;
          },
          {} as Record<string, any>,
        );
      } catch (dataError) {
        logger.warn(
          "Failed to get device data",
          dataError instanceof Error ? dataError : new Error(String(dataError)),
          {
            module: "facility",
            service: "iot",
            facilityId,
          },
        );
      }
    }

    // Calculate statistics
    const total = devices.length;
    const online = devices.filter((d) => {
      const status =
        typeof d.status === "object" ? d.status.operational : d.status;
      return status === "online";
    }).length;
    const offline = devices.filter((d) => {
      const status =
        typeof d.status === "object" ? d.status.operational : d.status;
      return status === "offline";
    }).length;
    const maintenance = devices.filter((d) => {
      const status =
        typeof d.status === "object" ? d.status.operational : d.status;
      return status === "maintenance";
    }).length;
    const averageHealth =
      devices.length > 0
        ? devices.reduce((sum, d) => {
            const health = typeof d.status === "object" ? d.status.health : 100;
            return sum + health;
          }, 0) / devices.length
        : 100;

    const stats = {
      total,
      online,
      offline,
      maintenance,
      averageHealth: Math.round(averageHealth * 100) / 100,
    };

    return NextResponse.json({
      success: true,
      data: devices,
      stats,
      deviceData,
      total: devices.length,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching IoT devices", err, {
      module: "facility",
      service: "iot",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "iot",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch IoT devices" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const iotService = getFacilityIoTService();
    const facilityId = body.facilityId || "facility-1";
    const device = await iotService.registerDevice(facilityId, body);

    // Store in Knowledge Base if enabled
    try {
      await integrationService.storeFacilityDocumentation(
        body.facilityId || "facility-1",
        {
          title: `IoT Device: ${device.name || device.id}`,
          content: `IoT device registered: ${device.type} - ${device.category}`,
          type: "specification",
          category: "iot",
          relatedDeviceId: device.id,
          tags: ["iot", device.type, device.category],
        },
      );
    } catch (kbError) {
      logger.warn(
        "Failed to store IoT device in knowledge base",
        kbError instanceof Error ? kbError : new Error(String(kbError)),
        {
          module: "facility",
          service: "iot",
          deviceId: device.id,
        },
      );
    }

    return NextResponse.json({
      success: true,
      data: device,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error registering IoT device", err, {
      module: "facility",
      service: "iot",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "iot",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to register IoT device" },
      { status: 500 },
    );
  }
}

async function putHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Device ID is required" },
        { status: 400 },
      );
    }

    // Use iotManager directly for update
    const { AdvancedIoTManager } =
      await import("@/lib/services/iot/iotManager");
    const iotManager = new AdvancedIoTManager();
    const device = await iotManager.updateDevice(id, updates);

    return NextResponse.json({
      success: true,
      data: device,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error updating IoT device", err, {
      module: "facility",
      service: "iot",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "iot",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update IoT device" },
      { status: 500 },
    );
  }
}

// Export with API Gateway protection
export const GET = withAPIGateway(getHandler, {
  moduleId: "facility",
  featureId: "facility.iot",
  action: "read",
  requireAuth: true,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "facility",
  featureId: "facility.iot",
  action: "write",
  requireAuth: true,
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000,
  },
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "facility",
  featureId: "facility.iot",
  action: "write",
  requireAuth: true,
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000,
  },
});
