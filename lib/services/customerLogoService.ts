/**
 * Customer Logo Service
 * Manages customer logo retrieval, caching, and fallback handling
 */

import { Customer } from "@/types/tenant";

export interface LogoConfig {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  variant?: "light" | "dark" | "full";
}

/**
 * Get customer logo configuration
 */
export function getCustomerLogo(
  customer: Customer | null | undefined,
): LogoConfig | null {
  if (!customer || !customer.logo) {
    return null;
  }

  return {
    url: customer.logo.url,
    alt: customer.logo.alt || `${customer.customerName} Logo`,
    width: customer.logo.width,
    height: customer.logo.height,
    variant: customer.logo.variant || "full",
  };
}

/**
 * Get logo URL with fallback
 */
export function getLogoUrl(
  customer: Customer | null | undefined,
  fallback?: string,
): string {
  const logo = getCustomerLogo(customer);
  if (logo) {
    return logo.url;
  }
  return fallback || "/bluedxp-logo.svg";
}

/**
 * Check if logo exists
 */
export function hasCustomerLogo(
  customer: Customer | null | undefined,
): boolean {
  return !!customer?.logo?.url;
}

/**
 * Get customer brand colors
 */
export function getCustomerBrandColors(customer: Customer | null | undefined): {
  primary?: string;
  secondary?: string;
} {
  if (!customer) {
    return {};
  }

  return {
    primary: customer.brandColor,
    secondary: customer.secondaryColor,
  };
}

/**
 * Validate logo URL
 */
export function validateLogoUrl(url: string): boolean {
  if (!url) return false;

  // Check if it's a valid path or URL
  const isValidPath =
    url.startsWith("/") ||
    url.startsWith("http://") ||
    url.startsWith("https://");
  return isValidPath;
}

/**
 * Get logo display size based on context
 */
export function getLogoSize(
  context: "header" | "sidebar" | "footer" | "modal" | "document",
): {
  width?: number;
  height?: number;
} {
  const sizes = {
    header: { height: 32 },
    sidebar: { height: 40 },
    footer: { height: 24 },
    modal: { height: 48 },
    document: { height: 60 },
  };

  return sizes[context] || {};
}
