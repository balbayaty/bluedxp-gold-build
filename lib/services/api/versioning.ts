/**
 * API Versioning Service
 * Handles API version negotiation and compatibility
 */

export type APIVersion = "v1" | "v2";

export interface VersionInfo {
  version: APIVersion;
  deprecated: boolean;
  sunsetDate?: string;
  changelog: string[];
}

export const API_VERSIONS: Record<APIVersion, VersionInfo> = {
  v1: {
    version: "v1",
    deprecated: false,
    changelog: [
      "Initial API release",
      "Webhook support",
      "Rate limiting",
      "API key authentication",
    ],
  },
  v2: {
    version: "v2",
    deprecated: false,
    changelog: [
      "Enhanced webhook delivery",
      "Improved rate limiting",
      "OAuth2 support",
    ],
  },
};

/**
 * Parse API version from request
 */
export function parseAPIVersion(request: Request): APIVersion {
  // Check header first
  const headerVersion = request.headers.get("x-api-version");
  if (headerVersion && headerVersion.startsWith("v")) {
    const version = headerVersion as APIVersion;
    if (API_VERSIONS[version]) {
      return version;
    }
  }

  // Check URL path
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/v(\d+)\//);
  if (pathMatch) {
    const version = `v${pathMatch[1]}` as APIVersion;
    if (API_VERSIONS[version]) {
      return version;
    }
  }

  // Default to v1
  return "v1";
}

/**
 * Check if version is supported
 */
export function isVersionSupported(version: APIVersion): boolean {
  return !!API_VERSIONS[version] && !API_VERSIONS[version].deprecated;
}

/**
 * Get version info
 */
export function getVersionInfo(version: APIVersion): VersionInfo | null {
  return API_VERSIONS[version] || null;
}

/**
 * Get latest version
 */
export function getLatestVersion(): APIVersion {
  const versions = Object.keys(API_VERSIONS) as APIVersion[];
  return versions[versions.length - 1];
}
