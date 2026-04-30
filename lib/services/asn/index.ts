/**
 * ASN Services
 * Main export for all ASN services
 */

// Core services
export * from "./core";

// Intelligence services
export * from "./intelligence";

// Analytics services
export * from "./analytics";

// Processing services
export * from "./processing";

// Alias for backward compatibility
import { getAsnService } from "./core";
export const asnService = getAsnService();
