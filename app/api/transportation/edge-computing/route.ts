/**
 * Edge Computing API
 *
 * Edge device management and offline capabilities
 */

import { NextRequest, NextResponse } from "next/server";
import {
  edgeComputingService,
  handleTransportationError,
} from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import type {
  EdgeDevice,
  EdgeApplication,
} from "@/lib/services/transportation";

export const POST = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { action } = body;

      if (action === "register-device") {
        const device: Omit<EdgeDevice, "id" | "lastSeen"> = body.device;

        if (!device.name || !device.type) {
          return NextResponse.json(
            { error: "Missing required fields: name, type" },
            { status: 400 },
          );
        }

        const deviceId = await edgeComputingService.registerDevice(device);
        return NextResponse.json({ deviceId }, { status: 201 });
      }

      if (action === "deploy-application") {
        const { deviceId, application } = body;

        if (!deviceId || !application) {
          return NextResponse.json(
            { error: "Missing required fields: deviceId, application" },
            { status: 400 },
          );
        }

        const applicationId = await edgeComputingService.deployApplication(
          deviceId,
          application,
        );
        return NextResponse.json({ applicationId }, { status: 201 });
      }

      if (action === "process-at-edge") {
        const { deviceId, applicationId, data } = body;

        if (!deviceId || !applicationId || !data) {
          return NextResponse.json(
            { error: "Missing required fields: deviceId, applicationId, data" },
            { status: 400 },
          );
        }

        const decision = await edgeComputingService.processAtEdge(
          deviceId,
          applicationId,
          data,
        );
        return NextResponse.json({ decision }, { status: 200 });
      }

      if (action === "enable-offline") {
        const { deviceId, capability } = body;

        if (!deviceId || !capability) {
          return NextResponse.json(
            { error: "Missing required fields: deviceId, capability" },
            { status: 400 },
          );
        }

        await edgeComputingService.enableOfflineCapability(
          deviceId,
          capability,
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }

      if (action === "sync-offline") {
        const { deviceId } = body;

        if (!deviceId) {
          return NextResponse.json(
            { error: "Missing deviceId" },
            { status: 400 },
          );
        }

        const result = await edgeComputingService.syncOfflineData(deviceId);
        return NextResponse.json(result, { status: 200 });
      }

      if (action === "update-status") {
        const { deviceId, status } = body;

        if (!deviceId || !status) {
          return NextResponse.json(
            { error: "Missing required fields: deviceId, status" },
            { status: 400 },
          );
        }

        await edgeComputingService.updateDeviceStatus(deviceId, status);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      console.error("Error in edge computing:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "edge-computing",
    action: "create",
    requireAuth: true,
    rateLimit: true,
  },
);

export const GET = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const deviceId = searchParams.get("deviceId");
      const applicationId = searchParams.get("applicationId");

      if (deviceId) {
        const device = edgeComputingService.getDevice(deviceId);
        if (!device) {
          return NextResponse.json(
            { error: "Device not found" },
            { status: 404 },
          );
        }

        const applications = edgeComputingService.listApplications(deviceId);
        const offlineCapability =
          edgeComputingService.getOfflineCapability(deviceId);

        return NextResponse.json({ device, applications, offlineCapability });
      }

      if (applicationId) {
        const application = edgeComputingService.getApplication(applicationId);
        if (!application) {
          return NextResponse.json(
            { error: "Application not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ application });
      }

      // List all devices
      const devices = edgeComputingService.listDevices();
      return NextResponse.json({ devices });
    } catch (error) {
      console.error("Error fetching edge computing data:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "edge-computing",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);
