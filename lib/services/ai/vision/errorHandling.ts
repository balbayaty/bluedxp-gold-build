/**
 * Vision Module Error Handling
 * Centralized error handling and validation
 */

export class VisionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, any>,
  ) {
    super(message);
    this.name = "VisionError";
  }
}

export class VisionValidationError extends VisionError {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "VisionValidationError";
  }
}

export class VisionAnalysisError extends VisionError {
  constructor(
    message: string,
    public analysisId?: string,
  ) {
    super(message, "ANALYSIS_ERROR", 500, { analysisId });
    this.name = "VisionAnalysisError";
  }
}

export class VisionAgentError extends VisionError {
  constructor(
    message: string,
    public agentId?: string,
  ) {
    super(message, "AGENT_ERROR", 500, { agentId });
    this.name = "VisionAgentError";
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File | string): void {
  if (typeof file === "string") {
    // URL or base64 - basic validation
    if (
      !file.startsWith("http") &&
      !file.startsWith("data:") &&
      !file.startsWith("/")
    ) {
      throw new VisionValidationError("Invalid image file format", "imageFile");
    }
    return;
  }

  // File validation
  if (!(file instanceof File)) {
    throw new VisionValidationError("Invalid file object", "imageFile");
  }

  // Check file type
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!validTypes.includes(file.type)) {
    throw new VisionValidationError(
      `Invalid file type: ${file.type}. Allowed: ${validTypes.join(", ")}`,
      "imageFile",
    );
  }

  // Check file size (20MB max)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    throw new VisionValidationError(
      `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${maxSize / 1024 / 1024}MB`,
      "imageFile",
    );
  }
}

/**
 * Validate analysis ID
 */
export function validateAnalysisId(analysisId: string): void {
  if (!analysisId || typeof analysisId !== "string") {
    throw new VisionValidationError("Analysis ID is required", "analysisId");
  }
  if (analysisId.length < 10 || analysisId.length > 255) {
    throw new VisionValidationError("Invalid analysis ID format", "analysisId");
  }
}

/**
 * Validate tenant ID
 */
export function validateTenantId(tenantId?: string): void {
  if (tenantId && (typeof tenantId !== "string" || tenantId.length > 255)) {
    throw new VisionValidationError("Invalid tenant ID format", "tenantId");
  }
}

/**
 * Safe error handler wrapper
 */
export function handleVisionError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
  metadata?: Record<string, any>;
} {
  if (error instanceof VisionError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      metadata: error.metadata,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      metadata: { originalError: error.name },
    };
  }

  return {
    message: "An unknown error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}
