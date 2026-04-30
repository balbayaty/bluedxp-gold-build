/**
 * QHSE Validation Utilities
 * Comprehensive input validation for all QHSE services
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class QHSEValidator {
  /**
   * Validate tenant ID
   */
  static validateTenantId(tenantId?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!tenantId) {
      errors.push("Tenant ID is required");
    } else if (typeof tenantId !== "string" || tenantId.trim().length === 0) {
      errors.push("Tenant ID must be a non-empty string");
    } else if (tenantId.length > 100) {
      errors.push("Tenant ID must be 100 characters or less");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate date
   */
  static validateDate(date: any, fieldName: string = "Date"): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!date) {
      errors.push(`${fieldName} is required`);
    } else {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        errors.push(`${fieldName} must be a valid date`);
      } else if (dateObj > new Date()) {
        warnings.push(`${fieldName} is in the future`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate email
   */
  static validateEmail(
    email: string,
    fieldName: string = "Email",
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!email) {
      errors.push(`${fieldName} is required`);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`${fieldName} must be a valid email address`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate number range
   */
  static validateNumberRange(
    value: number,
    min: number,
    max: number,
    fieldName: string = "Value",
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof value !== "number" || isNaN(value)) {
      errors.push(`${fieldName} must be a valid number`);
    } else {
      if (value < min) {
        errors.push(`${fieldName} must be at least ${min}`);
      }
      if (value > max) {
        errors.push(`${fieldName} must be at most ${max}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate string length
   */
  static validateStringLength(
    value: string,
    min: number,
    max: number,
    fieldName: string = "String",
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof value !== "string") {
      errors.push(`${fieldName} must be a string`);
    } else {
      if (value.length < min) {
        errors.push(`${fieldName} must be at least ${min} characters`);
      }
      if (value.length > max) {
        errors.push(`${fieldName} must be at most ${max} characters`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate enum value
   */
  static validateEnum<T extends string>(
    value: string,
    allowedValues: readonly T[],
    fieldName: string = "Value",
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!value) {
      errors.push(`${fieldName} is required`);
    } else if (!allowedValues.includes(value as T)) {
      errors.push(`${fieldName} must be one of: ${allowedValues.join(", ")}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate array
   */
  static validateArray(
    value: any[],
    minLength: number = 0,
    maxLength: number = Infinity,
    fieldName: string = "Array",
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(value)) {
      errors.push(`${fieldName} must be an array`);
    } else {
      if (value.length < minLength) {
        errors.push(`${fieldName} must have at least ${minLength} items`);
      }
      if (value.length > maxLength) {
        errors.push(`${fieldName} must have at most ${maxLength} items`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate object
   */
  static validateObject(
    value: any,
    requiredFields: string[] = [],
    fieldName: string = "Object",
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${fieldName} must be an object`);
    } else {
      requiredFields.forEach((field) => {
        if (!(field in value)) {
          errors.push(`${fieldName} must have field: ${field}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate HACCP plan
   */
  static validateHACCPPlan(plan: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    const requiredFields = [
      "tenantId",
      "productName",
      "processSteps",
      "ccpRegister",
    ];
    const objectValidation = this.validateObject(
      plan,
      requiredFields,
      "HACCP Plan",
    );
    errors.push(...objectValidation.errors);
    warnings.push(...objectValidation.warnings);

    // Validate process steps
    if (plan.processSteps) {
      const stepsValidation = this.validateArray(
        plan.processSteps,
        1,
        100,
        "Process Steps",
      );
      errors.push(...stepsValidation.errors);
      warnings.push(...stepsValidation.warnings);
    }

    // Validate CCP register
    if (plan.ccpRegister) {
      const ccpValidation = this.validateArray(
        plan.ccpRegister,
        0,
        50,
        "CCP Register",
      );
      errors.push(...ccpValidation.errors);
      warnings.push(...ccpValidation.warnings);
    }

    // Validate product name
    if (plan.productName) {
      const nameValidation = this.validateStringLength(
        plan.productName,
        1,
        200,
        "Product Name",
      );
      errors.push(...nameValidation.errors);
      warnings.push(...nameValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate batch record
   */
  static validateBatchRecord(record: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    const requiredFields = [
      "tenantId",
      "batchNumber",
      "productName",
      "manufacturingDate",
    ];
    const objectValidation = this.validateObject(
      record,
      requiredFields,
      "Batch Record",
    );
    errors.push(...objectValidation.errors);
    warnings.push(...objectValidation.warnings);

    // Validate batch number
    if (record.batchNumber) {
      const batchValidation = this.validateStringLength(
        record.batchNumber,
        1,
        100,
        "Batch Number",
      );
      errors.push(...batchValidation.errors);
      warnings.push(...batchValidation.warnings);
    }

    // Validate dates
    if (record.manufacturingDate) {
      const dateValidation = this.validateDate(
        record.manufacturingDate,
        "Manufacturing Date",
      );
      errors.push(...dateValidation.errors);
      warnings.push(...dateValidation.warnings);
    }

    if (record.expiryDate) {
      const expiryValidation = this.validateDate(
        record.expiryDate,
        "Expiry Date",
      );
      errors.push(...expiryValidation.errors);
      warnings.push(...expiryValidation.warnings);

      // Check if expiry is after manufacturing
      if (record.manufacturingDate && record.expiryDate) {
        const manufacturing = new Date(record.manufacturingDate);
        const expiry = new Date(record.expiryDate);
        if (expiry <= manufacturing) {
          errors.push("Expiry date must be after manufacturing date");
        }
      }
    }

    // Validate lot size
    if (record.lotSize !== undefined) {
      const lotSizeValidation = this.validateNumberRange(
        record.lotSize,
        1,
        1000000,
        "Lot Size",
      );
      errors.push(...lotSizeValidation.errors);
      warnings.push(...lotSizeValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate inspection record
   */
  static validateInspectionRecord(record: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    const requiredFields = [
      "tenantId",
      "inspectionType",
      "equipmentId",
      "scheduledDate",
      "dueDate",
    ];
    const objectValidation = this.validateObject(
      record,
      requiredFields,
      "Inspection Record",
    );
    errors.push(...objectValidation.errors);
    warnings.push(...objectValidation.warnings);

    // Validate dates
    if (record.scheduledDate) {
      const scheduledValidation = this.validateDate(
        record.scheduledDate,
        "Scheduled Date",
      );
      errors.push(...scheduledValidation.errors);
      warnings.push(...scheduledValidation.warnings);
    }

    if (record.dueDate) {
      const dueValidation = this.validateDate(record.dueDate, "Due Date");
      errors.push(...dueValidation.errors);
      warnings.push(...dueValidation.warnings);

      // Check if due date is after scheduled date
      if (record.scheduledDate && record.dueDate) {
        const scheduled = new Date(record.scheduledDate);
        const due = new Date(record.dueDate);
        if (due < scheduled) {
          errors.push("Due date must be after or equal to scheduled date");
        }
      }
    }

    // Validate inspection type
    const validTypes = [
      "PRESSURE_VESSEL",
      "PIPING",
      "STORAGE_TANK",
      "PIPELINE",
      "EQUIPMENT",
      "FACILITY",
    ];
    if (record.inspectionType) {
      const typeValidation = this.validateEnum(
        record.inspectionType,
        validTypes,
        "Inspection Type",
      );
      errors.push(...typeValidation.errors);
      warnings.push(...typeValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate business continuity plan
   */
  static validateBCP(bcp: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    const requiredFields = ["tenantId", "planName", "biaId"];
    const objectValidation = this.validateObject(
      bcp,
      requiredFields,
      "Business Continuity Plan",
    );
    errors.push(...objectValidation.errors);
    warnings.push(...objectValidation.warnings);

    // Validate plan name
    if (bcp.planName) {
      const nameValidation = this.validateStringLength(
        bcp.planName,
        1,
        200,
        "Plan Name",
      );
      errors.push(...nameValidation.errors);
      warnings.push(...nameValidation.warnings);
    }

    // Validate response procedures
    if (bcp.responseProcedures) {
      const proceduresValidation = this.validateObject(
        bcp.responseProcedures,
        [],
        "Response Procedures",
      );
      errors.push(...proceduresValidation.errors);
      warnings.push(...proceduresValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate electronic signature (FDA Part 11)
   */
  static validateElectronicSignature(signature: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    const requiredFields = [
      "signerId",
      "signerName",
      "signerRole",
      "signatureType",
      "linkedRecordId",
      "linkedRecordType",
      "manifest",
    ];
    const objectValidation = this.validateObject(
      signature,
      requiredFields,
      "Electronic Signature",
    );
    errors.push(...objectValidation.errors);
    warnings.push(...objectValidation.warnings);

    // Validate manifest (FDA Part 11 requirement)
    if (signature.manifest) {
      const manifestRequired = ["printedName", "reason", "meaning"];
      const manifestValidation = this.validateObject(
        signature.manifest,
        manifestRequired,
        "Signature Manifest",
      );
      errors.push(...manifestValidation.errors);
      warnings.push(...manifestValidation.warnings);
    }

    // Validate two-factor verification
    if (signature.twoFactorVerified === false) {
      errors.push(
        "Two-factor verification is required for electronic signatures",
      );
    }

    // Validate signature type
    const validTypes = ["SIGNATURE", "INITIAL", "DATE"];
    if (signature.signatureType) {
      const typeValidation = this.validateEnum(
        signature.signatureType,
        validTypes,
        "Signature Type",
      );
      errors.push(...typeValidation.errors);
      warnings.push(...typeValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate temperature reading
   */
  static validateTemperatureReading(reading: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    const requiredFields = ["sensorId", "temperature", "timestamp"];
    const objectValidation = this.validateObject(
      reading,
      requiredFields,
      "Temperature Reading",
    );
    errors.push(...objectValidation.errors);
    warnings.push(...objectValidation.warnings);

    // Validate temperature
    if (reading.temperature !== undefined) {
      const tempValidation = this.validateNumberRange(
        reading.temperature,
        -50,
        150,
        "Temperature",
      );
      errors.push(...tempValidation.errors);
      warnings.push(...tempValidation.warnings);
    }

    // Validate timestamp
    if (reading.timestamp) {
      const timestampValidation = this.validateDate(
        reading.timestamp,
        "Timestamp",
      );
      errors.push(...timestampValidation.errors);
      warnings.push(...timestampValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Combine multiple validation results
   */
  static combineResults(...results: ValidationResult[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    results.forEach((result) => {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}
