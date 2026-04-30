/**
 * Customer Logo Upload Service
 * Handles logo upload, validation, storage, and management
 *
 * Features:
 * - File validation (type, size, dimensions)
 * - Image optimization
 * - Secure storage
 * - Multiple format support (SVG, PNG, JPG)
 * - Base64 conversion for preview
 */

export interface LogoUploadOptions {
  maxSizeKB?: number; // Maximum file size in KB (default: 500KB)
  allowedTypes?: string[]; // Allowed MIME types
  maxWidth?: number; // Maximum width in pixels
  maxHeight?: number; // Maximum height in pixels
  minWidth?: number; // Minimum width in pixels
  minHeight?: number; // Minimum height in pixels
}

export interface LogoUploadResult {
  success: boolean;
  url?: string; // Path to stored logo
  base64?: string; // Base64 data URL for preview
  error?: string;
  width?: number;
  height?: number;
  fileSize?: number; // in bytes
}

const DEFAULT_OPTIONS: Required<LogoUploadOptions> = {
  maxSizeKB: 500,
  allowedTypes: [
    "image/svg+xml",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ],
  maxWidth: 2000,
  maxHeight: 1000,
  minWidth: 50,
  minHeight: 20,
};

/**
 * Validate logo file
 */
export function validateLogoFile(
  file: File,
  options: LogoUploadOptions = {},
): { valid: boolean; error?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file type
  if (!opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${opts.allowedTypes.join(", ")}`,
    };
  }

  // Check file size
  const fileSizeKB = file.size / 1024;
  if (fileSizeKB > opts.maxSizeKB) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${opts.maxSizeKB}KB. Current size: ${fileSizeKB.toFixed(2)}KB`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions
 */
export function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  file: File,
  options: LogoUploadOptions = {},
): Promise<{
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const dimensions = await getImageDimensions(file);

    if (
      dimensions.width < opts.minWidth ||
      dimensions.height < opts.minHeight
    ) {
      return {
        valid: false,
        error: `Image dimensions too small. Minimum: ${opts.minWidth}x${opts.minHeight}px. Current: ${dimensions.width}x${dimensions.height}px`,
        ...dimensions,
      };
    }

    if (
      dimensions.width > opts.maxWidth ||
      dimensions.height > opts.maxHeight
    ) {
      return {
        valid: false,
        error: `Image dimensions too large. Maximum: ${opts.maxWidth}x${opts.maxHeight}px. Current: ${dimensions.width}x${dimensions.height}px`,
        ...dimensions,
      };
    }

    return { valid: true, ...dimensions };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to validate image dimensions",
    };
  }
}

/**
 * Convert file to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Upload logo file
 *
 * In a real implementation, this would:
 * 1. Upload to cloud storage (S3, Azure Blob, etc.)
 * 2. Generate optimized versions
 * 3. Return the public URL
 *
 * For now, we'll use base64 for preview and store path reference
 */
export async function uploadLogo(
  file: File,
  customerId: string,
  options: LogoUploadOptions = {},
): Promise<LogoUploadResult> {
  try {
    // Validate file
    const fileValidation = validateLogoFile(file, options);
    if (!fileValidation.valid) {
      return {
        success: false,
        error: fileValidation.error,
      };
    }

    // Validate dimensions (skip for SVG)
    if (file.type !== "image/svg+xml") {
      const dimensionValidation = await validateImageDimensions(file, options);
      if (!dimensionValidation.valid) {
        return {
          success: false,
          error: dimensionValidation.error,
          width: dimensionValidation.width,
          height: dimensionValidation.height,
        };
      }
    }

    // Convert to base64 for preview
    const base64 = await fileToBase64(file);

    // Generate file path
    // In production, this would be uploaded to cloud storage
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "svg";
    const fileName = `${customerId}-logo.${fileExtension}`;
    const filePath = `/customers/${fileName}`;

    // Store in localStorage for demo (in production, use API to upload to server)
    if (typeof window !== "undefined") {
      const logoData = {
        url: filePath,
        base64,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
      };
      localStorage.setItem(
        `customer-logo-${customerId}`,
        JSON.stringify(logoData),
      );
    }

    // Get dimensions if not SVG
    let width: number | undefined;
    let height: number | undefined;

    if (file.type !== "image/svg+xml") {
      const dimensions = await getImageDimensions(file);
      width = dimensions.width;
      height = dimensions.height;
    }

    return {
      success: true,
      url: filePath,
      base64,
      width,
      height,
      fileSize: file.size,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error during upload",
    };
  }
}

/**
 * Get uploaded logo from storage
 */
export function getUploadedLogo(customerId: string): {
  url?: string;
  base64?: string;
  uploadedAt?: string;
} | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(`customer-logo-${customerId}`);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Delete uploaded logo
 */
export function deleteUploadedLogo(customerId: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.removeItem(`customer-logo-${customerId}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
