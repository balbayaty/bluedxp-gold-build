/**
 * File Upload API
 *
 * Handles file uploads from all modules
 * - MSDS files
 * - Evidence files
 * - Documents
 * - Certificates
 * - Attachments
 * - Everything!
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedFileStorageService } from "@/lib/services/storage/unifiedFileStorageService";

/**
 * Background processing function for photo analysis
 * Runs asynchronously after file upload
 */
async function processPhotoAnalysis(
  file: File,
  context: {
    entityId: string;
    entityType: "ASN" | "PALLET" | "DAMAGE";
    tenantId: string;
    userId?: string;
    fileUrl: string;
    fileId: string;
    area?: string;
    equipment?: string[];
    carrier?: string;
    supplier?: string;
    damageType?: string;
    severity?: string;
    totalValue?: number;
  },
) {
  try {
    // Dynamic imports to avoid circular dependencies
    const { selfLearningVisionService } =
      await import("@/lib/services/ai/vision/v2/selfLearningVisionService");
    const { evidenceService } =
      await import("@/lib/services/evidence/evidenceService");
    const { lifecycleService } =
      await import("@/lib/services/process-lifecycle/lifecycle/lifecycleService");
    const { liabilityEngine } =
      await import("@/lib/services/liability/liabilityEngine");
    const { eventBus } = await import("@/lib/services/event-bus");

    // Step 1: AI Vision analysis
    const visionAnalysis = await selfLearningVisionService.analyzeDamagePhoto(
      file,
      {
        damageRecordId: context.entityId,
        area: context.area,
        equipment: context.equipment,
        carrier: context.carrier,
        supplier: context.supplier,
        tenantId: context.tenantId,
      },
    );

    // Step 2: Generate file hash using Node.js crypto
    const crypto = await import("crypto");
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = crypto
      .createHash("sha256")
      .update(Buffer.from(fileBuffer))
      .digest();
    const hash = hashBuffer.toString("hex");

    // Step 3: Create evidence record
    const evidence = await evidenceService.create({
      type: "photo",
      category: context.entityType === "DAMAGE" ? "safety" : "operational",
      title: `Photo: ${context.entityType} ${context.entityId}`,
      description: `Auto-uploaded photo for ${context.entityType} ${context.entityId}`,
      fileUrl: context.fileUrl,
      hash,
      hashAlgorithm: "sha256",
      relatedEntities: [
        {
          entityType: context.entityType,
          entityId: context.entityId,
        },
      ],
      metadata: {
        visionAnalysis,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: context.userId || "system",
        analyzedAt: new Date().toISOString(),
        area: context.area,
        equipment: context.equipment,
        carrier: context.carrier,
        supplier: context.supplier,
      },
      tenantId: context.tenantId,
      createdBy: context.userId,
    });

    // Step 4: Link to lifecycle stage
    try {
      const lifecycle = await lifecycleService.getLifecycle(
        context.entityId,
        context.entityType as any,
      );
      if (lifecycle) {
        const currentStage =
          lifecycle.stages.find((s) => s.status === "in_progress") ||
          lifecycle.stages[lifecycle.stages.length - 1];
        if (currentStage) {
          await lifecycleService.attachEvidence(
            context.entityId,
            context.entityType as any,
            currentStage.stageId,
            {
              evidenceId: evidence.id,
              evidenceType: "photo",
              description: `Photo evidence for ${context.entityType}`,
              context: {
                userId: context.userId,
                tenantId: context.tenantId,
              },
            },
          );
        }
      }
    } catch (lifecycleError) {
      console.warn("Failed to link evidence to lifecycle:", lifecycleError);
      // Continue - lifecycle linking is not critical
    }

    // Step 5: Liability assessment (if damage)
    if (context.entityType === "DAMAGE" && context.totalValue !== undefined) {
      try {
        await liabilityEngine.assessLiability(context.entityId, {
          damagePhoto: file,
          damageType: context.damageType || "UNKNOWN",
          severity: context.severity || "UNKNOWN",
          area: context.area,
          equipment: context.equipment,
          carrier: context.carrier,
          supplier: context.supplier,
          totalValue: context.totalValue,
          reportedAt: new Date(),
          tenantId: context.tenantId,
        });
      } catch (liabilityError) {
        console.warn("Liability assessment failed:", liabilityError);
        // Continue - liability assessment is not critical for upload
      }
    }

    // Step 6: Publish events
    await eventBus.publish("photo.uploaded", {
      entityId: context.entityId,
      entityType: context.entityType,
      fileUrl: context.fileUrl,
      fileId: context.fileId,
      evidenceId: evidence.id,
      hasVisionAnalysis: true,
      tenantId: context.tenantId,
    });

    await eventBus.publish("photo.analyzed", {
      entityId: context.entityId,
      entityType: context.entityType,
      visionAnalysis,
      evidenceId: evidence.id,
      tenantId: context.tenantId,
    });
  } catch (error) {
    console.error("Photo analysis processing failed:", error);
    // Don't throw - this is background processing
  }
}

// Get tenant and user from request headers
function getAuthContext(request: NextRequest): {
  tenantId: string;
  userId: string;
  userRoles: string[];
} {
  const tenantId =
    request.headers.get("x-tenant-id") ||
    process.env.BOOTSTRAP_TENANT_ID ||
    "default-tenant";
  const userId = request.headers.get("x-user-id") || "default-user";
  const userRoles = request.headers
    .get("x-user-roles")
    ?.split(",")
    .filter(Boolean) || ["SYSTEM_ADMIN"];
  return { tenantId, userId, userRoles };
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication info
    const { tenantId, userId, userRoles } = getAuthContext(request);

    if (!tenantId || !userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const moduleName = formData.get("module") as string;
    const entityType = formData.get("entityType") as string | null;
    const entityId = formData.get("entityId") as string | null;
    const tags = formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [];
    const metadata = formData.get("metadata")
      ? JSON.parse(formData.get("metadata") as string)
      : {};
    const encryption = formData.get("encryption") === "true";
    const deduplication = formData.get("deduplication") !== "false"; // Default: true

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 },
      );
    }

    if (!moduleName) {
      return NextResponse.json(
        {
          success: false,
          error: "Module is required (e.g., msds, evidence, transportation)",
        },
        { status: 400 },
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const fileMetadata = await unifiedFileStorageService.uploadFile({
      file: buffer,
      fileName: file.name,
      tenantId,
      module: moduleName,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      createdBy: userId,
      metadata,
      tags,
      encryption,
      deduplication,
    });

    // Auto-trigger photo analysis if this is a photo upload for WMS entities
    if (
      entityType &&
      entityId &&
      (entityType === "ASN" ||
        entityType === "PALLET" ||
        entityType === "DAMAGE")
    ) {
      // Trigger async analysis (don't wait - return immediately)
      processPhotoAnalysis(file, {
        entityId,
        entityType: entityType as "ASN" | "PALLET" | "DAMAGE",
        tenantId,
        userId,
        fileUrl: fileMetadata.url || fileMetadata.fileUrl,
        fileId: fileMetadata.id || fileMetadata.fileId,
        area: metadata.area,
        equipment: metadata.equipment,
        carrier: metadata.carrier,
        supplier: metadata.supplier,
        damageType: metadata.damageType,
        severity: metadata.severity,
        totalValue: metadata.totalValue,
      }).catch((error) => {
        console.error("Auto photo analysis failed (non-blocking):", error);
        // Don't fail upload if analysis fails
      });
    }

    // Return response with proper format
    const response = {
      success: true,
      file: fileMetadata,
      fileUrl:
        fileMetadata.storageUrl ||
        fileMetadata.url ||
        fileMetadata.fileUrl ||
        "",
      fileId: fileMetadata.id || fileMetadata.fileId || "",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "File upload failed",
      },
      { status: 500 },
    );
  }
}
