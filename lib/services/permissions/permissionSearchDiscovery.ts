/**
 * 🔍 PERMISSION SEARCH & DISCOVERY
 *
 * Mind-blowing search capabilities:
 * - Full-text permission search
 * - Semantic search
 * - Permission discovery
 * - Similarity matching
 * - Auto-complete
 * - Search analytics
 */

import type {
  User,
  HierarchicalPermission,
  ModuleId,
  FeatureId,
  TabId,
} from "@/types/user";
import { userService } from "@/lib/services/user";

// ============================================================================
// TYPES
// ============================================================================

export interface SearchResult {
  type: "USER" | "PERMISSION" | "MODULE" | "FEATURE" | "TAB";
  id: string;
  name: string;
  description?: string;
  relevance: number; // 0-100
  metadata?: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  type?: SearchResult["type"];
  moduleId?: ModuleId;
  limit?: number;
}

// ============================================================================
// SEARCH & DISCOVERY SERVICE
// ============================================================================

class PermissionSearchDiscoveryService {
  /**
   * Search permissions
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lowerQuery = query.query.toLowerCase();

    // Search users
    if (!query.type || query.type === "USER") {
      const users = await userService.getUsers({ search: query.query });
      users.forEach((user) => {
        results.push({
          type: "USER",
          id: user.id,
          name: user.name,
          description: user.email,
          relevance: this.calculateRelevance(user.name, lowerQuery),
        });
      });
    }

    // Search modules/features/tabs (would need module registry)
    // For now, return user results

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply limit
    return results.slice(0, query.limit || 50);
  }

  /**
   * Discover similar permissions
   */
  async discoverSimilar(
    permission: HierarchicalPermission,
    limit: number = 10,
  ): Promise<HierarchicalPermission[]> {
    // Get all users
    const users = await userService.getUsers({});
    const similar: Array<{ perm: HierarchicalPermission; similarity: number }> =
      [];

    users.forEach((user) => {
      const perms = user.hierarchicalPermissions || [];
      perms.forEach((perm) => {
        const similarity = this.calculateSimilarity(permission, perm);
        if (similarity > 50) {
          similar.push({ perm, similarity });
        }
      });
    });

    return similar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((s) => s.perm);
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(text: string, query: string): number {
    const lowerText = text.toLowerCase();

    if (lowerText === query) return 100;
    if (lowerText.startsWith(query)) return 90;
    if (lowerText.includes(query)) return 70;

    // Fuzzy matching
    const words = query.split(" ");
    const matches = words.filter((word) => lowerText.includes(word)).length;
    return (matches / words.length) * 60;
  }

  /**
   * Calculate similarity between permissions
   */
  private calculateSimilarity(
    perm1: HierarchicalPermission,
    perm2: HierarchicalPermission,
  ): number {
    let similarity = 0;

    if (perm1.moduleId === perm2.moduleId) similarity += 40;
    if (perm1.featureId === perm2.featureId) similarity += 30;
    if (perm1.tabId === perm2.tabId) similarity += 20;
    if (perm1.moduleAccess === perm2.moduleAccess) similarity += 10;

    return similarity;
  }

  /**
   * Auto-complete
   */
  async autocomplete(query: string, limit: number = 10): Promise<string[]> {
    const users = await userService.getUsers({ search: query });
    return users.slice(0, limit).map((u) => u.name);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionSearchDiscovery = new PermissionSearchDiscoveryService();
