/**
 * Area Validation Service
 * Comprehensive validation rules and business logic for warehouse areas
 * BlueDXP Platform - Bulletproof Validation • Global Support
 */

import type {
  WarehouseAreaRequest,
  WarehouseArea,
} from "@/types/warehouseArea";
import { ALL_HAZARD_CLASSES } from "@/types/warehouseLocation";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AreaBusinessRules {
  // Capacity Rules
  minCapacity: number;
  maxCapacity: number;
  capacityUnit: string;

  // Code Rules
  codeFormat: RegExp;
  codeMaxLength: number;
  codeMinLength: number;

  // Zone Rules
  zoneMaxLength: number;
  allowedZones?: string[];

  // Hazard Rules
  maxHazardClasses: number;
  requireHazardCompatibility: boolean;

  // Global Rules
  allowStandaloneAreas: boolean; // Can create areas without warehouse
  requireWarehouseValidation: boolean; // Validate warehouse exists if provided
  allowCrossModuleAreas: boolean; // Allow areas linked to other modules (TMS, QHSE, etc.)
}

export const DEFAULT_BUSINESS_RULES: AreaBusinessRules = {
  minCapacity: 0,
  maxCapacity: 1000000,
  capacityUnit: "units",
  codeFormat: /^[A-Z0-9\-_]+$/,
  codeMaxLength: 50,
  codeMinLength: 2,
  zoneMaxLength: 100,
  maxHazardClasses: 15,
  requireHazardCompatibility: true,
  allowStandaloneAreas: true, // ✅ Allow areas without warehouse
  requireWarehouseValidation: true, // Validate warehouse if provided
  allowCrossModuleAreas: true, // ✅ Allow cross-module integration
};

/**
 * Validate Area Code Format
 */
export function validateAreaCode(
  code: string,
  rules: AreaBusinessRules = DEFAULT_BUSINESS_RULES,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!code || code.trim().length === 0) {
    errors.push("Area code is required");
    return { valid: false, errors, warnings };
  }

  const trimmedCode = code.trim();

  // Length validation
  if (trimmedCode.length < rules.codeMinLength) {
    errors.push(`Area code must be at least ${rules.codeMinLength} characters`);
  }
  if (trimmedCode.length > rules.codeMaxLength) {
    errors.push(`Area code must not exceed ${rules.codeMaxLength} characters`);
  }

  // Format validation
  if (!rules.codeFormat.test(trimmedCode)) {
    errors.push(
      "Area code can only contain uppercase letters, numbers, hyphens, and underscores",
    );
  }

  // Duplicate check would be done at service level
  if (trimmedCode.includes(" ")) {
    warnings.push(
      "Area code contains spaces - consider using hyphens or underscores",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Area Name
 */
export function validateAreaName(name: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push("Area name is required");
    return { valid: false, errors, warnings };
  }

  if (name.trim().length < 3) {
    errors.push("Area name must be at least 3 characters");
  }

  if (name.trim().length > 200) {
    errors.push("Area name must not exceed 200 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Zone
 */
export function validateZone(
  zone: string,
  rules: AreaBusinessRules = DEFAULT_BUSINESS_RULES,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!zone || zone.trim().length === 0) {
    errors.push("Zone is required");
    return { valid: false, errors, warnings };
  }

  if (zone.trim().length > rules.zoneMaxLength) {
    errors.push(`Zone must not exceed ${rules.zoneMaxLength} characters`);
  }

  if (rules.allowedZones && rules.allowedZones.length > 0) {
    if (!rules.allowedZones.includes(zone)) {
      warnings.push(`Zone "${zone}" is not in the allowed zones list`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Capacity
 */
export function validateCapacity(
  capacity: number,
  currentStock?: number,
  rules: AreaBusinessRules = DEFAULT_BUSINESS_RULES,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (capacity === undefined || capacity === null) {
    errors.push("Capacity is required");
    return { valid: false, errors, warnings };
  }

  if (typeof capacity !== "number" || isNaN(capacity)) {
    errors.push("Capacity must be a valid number");
    return { valid: false, errors, warnings };
  }

  if (capacity < rules.minCapacity) {
    errors.push(
      `Capacity must be at least ${rules.minCapacity} ${rules.capacityUnit}`,
    );
  }

  if (capacity > rules.maxCapacity) {
    errors.push(
      `Capacity must not exceed ${rules.maxCapacity} ${rules.capacityUnit}`,
    );
  }

  if (currentStock !== undefined && currentStock !== null) {
    if (currentStock < 0) {
      errors.push("Current stock cannot be negative");
    }
    if (currentStock > capacity) {
      errors.push("Current stock cannot exceed capacity");
    }
    if (currentStock > capacity * 0.95) {
      warnings.push("Area is near capacity (>95%)");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Hazard Classes
 */
export function validateHazardClasses(
  hazardClasses: string[],
  rules: AreaBusinessRules = DEFAULT_BUSINESS_RULES,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(hazardClasses)) {
    errors.push("Hazard classes must be an array");
    return { valid: false, errors, warnings };
  }

  if (hazardClasses.length > rules.maxHazardClasses) {
    errors.push(`Maximum ${rules.maxHazardClasses} hazard classes allowed`);
  }

  // Validate each hazard class exists
  const validHazardValues = ALL_HAZARD_CLASSES.map((hc) => hc.value);
  const invalidHazards = hazardClasses.filter(
    (hc) => !validHazardValues.includes(hc),
  );

  if (invalidHazards.length > 0) {
    errors.push(`Invalid hazard classes: ${invalidHazards.join(", ")}`);
  }

  // Check for incompatible combinations
  if (rules.requireHazardCompatibility && hazardClasses.length > 1) {
    const incompatible = checkHazardCompatibility(hazardClasses);
    if (incompatible.length > 0) {
      warnings.push(
        `Potential incompatibility between: ${incompatible.join(", ")}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check Hazard Class Compatibility
 */
function checkHazardCompatibility(hazardClasses: string[]): string[] {
  // Basic compatibility rules
  const incompatiblePairs: [string, string][] = [
    ["Class 5.1", "Class 4.1"], // Oxidizing + Flammable Solids
    ["Class 5.2", "Class 4.1"], // Organic Peroxides + Flammable Solids
    ["Class 3", "Class 5.1"], // Flammable Liquids + Oxidizing
  ];

  const incompatible: string[] = [];

  for (const [h1, h2] of incompatiblePairs) {
    if (hazardClasses.includes(h1) && hazardClasses.includes(h2)) {
      incompatible.push(`${h1} & ${h2}`);
    }
  }

  return incompatible;
}

/**
 * Validate Warehouse ID (if provided)
 */
export async function validateWarehouseId(
  warehouseId: string | undefined,
  rules: AreaBusinessRules = DEFAULT_BUSINESS_RULES,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // If standalone areas are allowed and no warehouse ID, that's OK
  if (!warehouseId && rules.allowStandaloneAreas) {
    return { valid: true, errors, warnings };
  }

  // If warehouse ID is required but not provided
  if (!warehouseId && !rules.allowStandaloneAreas) {
    errors.push("Warehouse ID is required");
    return { valid: false, errors, warnings };
  }

  // If warehouse ID is provided, validate it exists
  if (warehouseId && rules.requireWarehouseValidation) {
    try {
      // This would check against warehouse service or database
      // For now, just validate format
      if (warehouseId.trim().length === 0) {
        errors.push("Warehouse ID cannot be empty");
      }
      // In production, you would check: await warehouseService.getWarehouse(warehouseId)
    } catch (error) {
      errors.push("Warehouse validation failed");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive Area Validation
 */
export async function validateAreaRequest(
  data: WarehouseAreaRequest,
  rules: AreaBusinessRules = DEFAULT_BUSINESS_RULES,
  existingAreas?: WarehouseArea[],
): Promise<ValidationResult> {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate area code
  const codeValidation = validateAreaCode(data.areaCode, rules);
  allErrors.push(...codeValidation.errors);
  allWarnings.push(...codeValidation.warnings);

  // Check for duplicate area codes (if existing areas provided)
  if (existingAreas) {
    const duplicate = existingAreas.find(
      (a) =>
        a.areaCode.toLowerCase() === data.areaCode.toLowerCase() &&
        a.id !== (data as any).id,
    );
    if (duplicate) {
      allErrors.push(`Area code "${data.areaCode}" already exists`);
    }
  }

  // Validate area name
  const nameValidation = validateAreaName(data.areaName);
  allErrors.push(...nameValidation.errors);
  allWarnings.push(...nameValidation.warnings);

  // Validate zone
  const zoneValidation = validateZone(data.zone, rules);
  allErrors.push(...zoneValidation.errors);
  allWarnings.push(...zoneValidation.warnings);

  // Validate capacity
  const capacityValidation = validateCapacity(
    data.capacity,
    data.currentStock,
    rules,
  );
  allErrors.push(...capacityValidation.errors);
  allWarnings.push(...capacityValidation.warnings);

  // Validate hazard classes
  const hazardValidation = validateHazardClasses(data.allowedHazards, rules);
  allErrors.push(...hazardValidation.errors);
  allWarnings.push(...hazardValidation.warnings);

  // Validate warehouse ID (async)
  const warehouseValidation = await validateWarehouseId(
    data.warehouseId,
    rules,
  );
  allErrors.push(...warehouseValidation.errors);
  allWarnings.push(...warehouseValidation.warnings);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Validate Cross-Module Integration
 */
export function validateCrossModuleIntegration(
  area: WarehouseAreaRequest,
  moduleId?: string,
  moduleEntityId?: string,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // If cross-module areas are not allowed
  if (moduleId && !DEFAULT_BUSINESS_RULES.allowCrossModuleAreas) {
    errors.push("Cross-module area integration is not enabled");
    return { valid: false, errors, warnings };
  }

  // Validate module ID format if provided
  if (moduleId) {
    const validModules = [
      "wms",
      "tms",
      "qhse",
      "iso-ims",
      "facility-management",
    ];
    if (!validModules.includes(moduleId)) {
      warnings.push(`Module "${moduleId}" is not a recognized module`);
    }
  }

  // Validate module entity ID if provided
  if (moduleId && !moduleEntityId) {
    warnings.push(
      `Module entity ID is recommended when linking to module "${moduleId}"`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
