/**
 * Validation Utilities - Input validation for digital signature operations
 */

/**
 * Validate Email
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Phone Number (Saudi format)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  // Saudi phone: +966XXXXXXXXX or 05XXXXXXXX
  const phoneRegex = /^(\+966|0)?5\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Validate National ID (Saudi)
 */
export function validateNationalID(nationalId: string): boolean {
  if (!nationalId) return false;
  // Saudi National ID: 10 digits
  const idRegex = /^\d{10}$/;
  return idRegex.test(nationalId);
}

/**
 * Validate Document Type
 */
export function validateDocumentType(type: string): boolean {
  const validTypes = [
    "contract",
    "agreement",
    "invoice",
    "receipt",
    "certificate",
    "report",
    "form",
    "other",
  ];
  return validTypes.includes(type.toLowerCase());
}

/**
 * Validate Signature Type
 */
export function validateSignatureType(type: string): boolean {
  const validTypes = [
    "simple_electronic",
    "advanced_electronic",
    "qualified_electronic",
    "digital_seal",
    "timestamp_only",
  ];
  return validTypes.includes(type);
}

/**
 * Validate Workflow Type
 */
export function validateWorkflowType(type: string): boolean {
  const validTypes = ["sequential", "parallel", "any_order", "custom"];
  return validTypes.includes(type);
}

/**
 * Validate File
 */
export function validateFile(
  file: File | Buffer,
  maxSizeMB: number = 50,
): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "File is required" };
  }

  if (file instanceof File) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Invalid file type. Allowed: PDF, PNG, JPEG, DOC, DOCX",
      };
    }
  } else if (file instanceof Buffer) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.length > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate UUID
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate Subject DN
 */
export function validateSubjectDN(dn: string): boolean {
  if (!dn) return false;
  // Basic validation: should contain CN=, O=, etc.
  return dn.includes("CN=") || dn.includes("OU=");
}

/**
 * Sanitize Input
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}
