/**
 * LLM Training API
 * Start and manage local LLM training jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { localLLMTrainingService } from "@/lib/services/llm-provider/training/localLLMTrainingService";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (request.method === "GET") {
      // List training jobs
      const jobId = request.nextUrl.searchParams.get("jobId");

      if (jobId) {
        const job = localLLMTrainingService.getTrainingJob(jobId);
        if (!job) {
          return NextResponse.json(
            { error: "Training job not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ success: true, job });
      }

      const jobs = localLLMTrainingService.listTrainingJobs();
      return NextResponse.json({ success: true, jobs, count: jobs.length });
    }

    if (request.method === "POST") {
      // Start training job
      const body = await request.json();
      const { action, config, jobId } = body;

      if (action === "start") {
        if (!config) {
          return NextResponse.json(
            { error: "Training config is required" },
            { status: 400 },
          );
        }

        const job = await localLLMTrainingService.startTraining(config);
        return NextResponse.json({ success: true, job }, { status: 201 });
      }

      if (action === "cancel") {
        if (!jobId) {
          return NextResponse.json(
            { error: "jobId is required" },
            { status: 400 },
          );
        }

        const cancelled = await localLLMTrainingService.cancelTraining(jobId);
        if (!cancelled) {
          return NextResponse.json(
            { error: "Failed to cancel training job" },
            { status: 400 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Training cancelled",
        });
      }

      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "cancel"' },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("[LLM Training API] Error:", error);
    return NextResponse.json(
      {
        error: "Training operation failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  feature: "llm",
  action: "read",
  description: "List training jobs",
});

export const POST = withAPIGateway(handler, {
  feature: "llm",
  action: "execute",
  description: "Start/cancel training",
});
