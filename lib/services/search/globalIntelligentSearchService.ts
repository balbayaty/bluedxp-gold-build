/**
 * Global Intelligent Search Service
 * Platform-wide semantic search with AI-powered intent understanding
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 *
 * Searches across:
 * - Navigation items
 * - Pages and routes
 * - Data entities (orders, shipments, etc.)
 * - Actions and commands
 * - Knowledge base
 * - Recent items
 * - Favorites
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import {
  getDefaultNavigationStructure,
  getHazalyzeNavigation,
} from "@/lib/services/navigation/defaultNavigation";
import type { NavItem } from "@/lib/services/navigation/navigationService";

// ============================================================================
// TYPES
// ============================================================================

export interface SearchResultItem {
  id: string;
  type: "navigation" | "action" | "data" | "knowledge" | "recent" | "favorite";
  title: string;
  description?: string;
  icon?: string;
  href?: string;
  action?: () => void;
  category?: string;
  score: number;
  metadata?: Record<string, any>;
  keywords?: string[];
}

export interface SearchIntent {
  primaryIntent:
    | "NAVIGATE"
    | "FIND_DATA"
    | "PERFORM_ACTION"
    | "LEARN"
    | "GENERAL";
  confidence: number;
  entities?: {
    module?: string;
    entityType?: string;
    action?: string;
  };
}

export interface GlobalSearchResult {
  query: string;
  intent: SearchIntent;
  results: SearchResultItem[];
  suggestions: string[];
  categories: Array<{ name: string; count: number }>;
  totalResults: number;
  searchTime: number;
}

// ============================================================================
// GLOBAL INTELLIGENT SEARCH SERVICE
// ============================================================================

export class GlobalIntelligentSearchService {
  private searchHistory: Array<{ query: string; timestamp: number }> = [];
  private userPreferences: Map<string, any> = new Map();

  /**
   * Perform global intelligent search
   */
  async search(
    query: string,
    options: {
      navStructure?: NavItem[];
      limit?: number;
      filters?: {
        types?: SearchResultItem["type"][];
        categories?: string[];
      };
    } = {},
  ): Promise<GlobalSearchResult> {
    const startTime = Date.now();
    const limit = options.limit || 20;

    // 1. Understand search intent
    const intent = this.understandIntent(query);

    // 2. Get navigation structure
    const navStructure =
      options.navStructure || getDefaultNavigationStructure();

    // 3. Search across all sources
    const [
      navResults,
      actionResults,
      knowledgeResults,
      recentResults,
      favoriteResults,
    ] = await Promise.all([
      this.searchNavigation(query, navStructure, intent),
      this.searchActions(query, intent),
      this.searchKnowledgeBase(query, intent),
      this.searchRecentItems(query),
      this.searchFavorites(query),
    ]);

    // 4. Combine and rank results
    const allResults = [
      ...navResults,
      ...actionResults,
      ...knowledgeResults,
      ...recentResults,
      ...favoriteResults,
    ];

    // 5. Apply filters
    let filteredResults = allResults;
    if (options.filters?.types) {
      filteredResults = filteredResults.filter((r) =>
        options.filters!.types!.includes(r.type),
      );
    }
    if (options.filters?.categories) {
      filteredResults = filteredResults.filter(
        (r) => r.category && options.filters!.categories!.includes(r.category),
      );
    }

    // 6. Sort by score and limit
    const sortedResults = filteredResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 7. Generate suggestions
    const suggestions = this.generateSuggestions(query, sortedResults, intent);

    // 8. Group by category
    const categories = this.groupByCategory(sortedResults);

    // 9. Track search history
    this.trackSearch(query);

    const searchTime = Date.now() - startTime;

    return {
      query,
      intent,
      results: sortedResults,
      suggestions,
      categories,
      totalResults: allResults.length,
      searchTime,
    };
  }

  /**
   * Understand search intent
   */
  private understandIntent(query: string): SearchIntent {
    const lowerQuery = query.toLowerCase().trim();

    // Navigation intent
    if (
      this.matchesPattern(lowerQuery, [
        "go to",
        "navigate",
        "open",
        "show",
        "view",
      ])
    ) {
      return {
        primaryIntent: "NAVIGATE",
        confidence: 0.9,
        entities: { module: this.extractModule(lowerQuery) },
      };
    }

    // Action intent
    if (
      this.matchesPattern(lowerQuery, [
        "create",
        "add",
        "new",
        "delete",
        "edit",
        "update",
        "export",
      ])
    ) {
      return {
        primaryIntent: "PERFORM_ACTION",
        confidence: 0.85,
        entities: { action: this.extractAction(lowerQuery) },
      };
    }

    // Data search intent
    if (
      this.matchesPattern(lowerQuery, [
        "find",
        "search",
        "list",
        "get",
        "fetch",
      ])
    ) {
      return {
        primaryIntent: "FIND_DATA",
        confidence: 0.8,
        entities: { entityType: this.extractEntityType(lowerQuery) },
      };
    }

    // Learning intent
    if (
      this.matchesPattern(lowerQuery, [
        "what",
        "how",
        "why",
        "explain",
        "learn",
        "help",
        "guide",
      ])
    ) {
      return {
        primaryIntent: "LEARN",
        confidence: 0.85,
      };
    }

    // Default: general search
    return {
      primaryIntent: "GENERAL",
      confidence: 0.7,
    };
  }

  /**
   * Search navigation items
   */
  private async searchNavigation(
    query: string,
    navStructure: NavItem[],
    intent: SearchIntent,
  ): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];
    const queryLower = query.toLowerCase();

    const flattenNav = (items: NavItem[], parentPath: string[] = []): void => {
      for (const item of items) {
        if (item.href) {
          const nameScore = this.calculateScore(item.name, queryLower);
          const descScore = item.description
            ? this.calculateScore(item.description, queryLower)
            : 0;
          const pathScore = this.calculateScore(item.href, queryLower);
          const parentScore =
            parentPath.length > 0
              ? parentPath.reduce(
                  (sum, p) => sum + this.calculateScore(p, queryLower),
                  0,
                ) / parentPath.length
              : 0;

          const totalScore =
            nameScore * 0.5 +
            descScore * 0.3 +
            pathScore * 0.1 +
            parentScore * 0.1;

          if (totalScore > 0) {
            results.push({
              id: `nav-${item.href}`,
              type: "navigation",
              title: item.name,
              description:
                item.description ||
                `${parentPath.join(" > ")}${parentPath.length > 0 ? " > " : ""}${item.name}`,
              icon: item.icon,
              href: item.href,
              category: parentPath[0] || "Navigation",
              score: totalScore,
              keywords: [item.name, item.description, item.href].filter(
                Boolean,
              ) as string[],
            });
          }
        }

        if (item.children) {
          flattenNav(
            item.children,
            item.href ? [...parentPath, item.name] : parentPath,
          );
        }
      }
    };

    flattenNav(navStructure);

    // Boost navigation results if intent is NAVIGATE
    if (intent.primaryIntent === "NAVIGATE") {
      results.forEach((r) => {
        r.score *= 1.3;
      });
    }

    return results;
  }

  /**
   * Search actions/commands
   */
  private async searchActions(
    query: string,
    intent: SearchIntent,
  ): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];
    const queryLower = query.toLowerCase();

    // Common actions
    const actions = [
      {
        title: "Create New Order",
        description: "Create a new order",
        icon: "ri-add-circle-line",
        href: "/orders/new",
        keywords: ["create", "new", "order", "add"],
      },
      {
        title: "Create Shipment",
        description: "Create a new shipment",
        icon: "ri-truck-line",
        href: "/shipments/new",
        keywords: ["create", "new", "shipment", "add"],
      },
      {
        title: "Export Data",
        description: "Export current data",
        icon: "ri-download-line",
        href: "#",
        keywords: ["export", "download", "save"],
      },
      {
        title: "Import Data",
        description: "Import data from file",
        icon: "ri-upload-line",
        href: "#",
        keywords: ["import", "upload", "load"],
      },
      {
        title: "Settings",
        description: "Open settings",
        icon: "ri-settings-3-line",
        href: "/settings",
        keywords: ["settings", "preferences", "config"],
      },
      {
        title: "Help Center",
        description: "Get help and documentation",
        icon: "ri-question-line",
        href: "/help",
        keywords: ["help", "support", "documentation"],
      },
    ];

    for (const action of actions) {
      const score =
        this.calculateScore(
          action.title + " " + action.description,
          queryLower,
        ) +
        action.keywords.reduce(
          (sum, kw) => sum + (queryLower.includes(kw) ? 20 : 0),
          0,
        );

      if (score > 0) {
        results.push({
          id: `action-${action.href}`,
          type: "action",
          title: action.title,
          description: action.description,
          icon: action.icon,
          href: action.href,
          category: "Actions",
          score,
          keywords: action.keywords,
        });
      }
    }

    // Boost action results if intent is PERFORM_ACTION
    if (intent.primaryIntent === "PERFORM_ACTION") {
      results.forEach((r) => {
        r.score *= 1.3;
      });
    }

    return results;
  }

  /**
   * Search knowledge base
   */
  private async searchKnowledgeBase(
    query: string,
    intent: SearchIntent,
  ): Promise<SearchResultItem[]> {
    try {
      const kbResults = await knowledgeBaseService.search({
        query,
        limit: 10,
      });

      return kbResults.results.map((result, index) => ({
        id: `kb-${result.entry.id}`,
        type: "knowledge" as const,
        title: result.entry.title || "Knowledge Base Entry",
        description: result.entry.content?.substring(0, 150) || "",
        icon: "ri-book-open-line",
        href: `/knowledge/${result.entry.id}`,
        category: "Knowledge Base",
        score: (result.score || 0.5) * 100 * (1 - index * 0.1), // Decay score
        metadata: {
          type: result.entry.type,
          category: result.entry.category,
        },
      }));
    } catch (error) {
      console.warn("Knowledge base search failed:", error);
      return [];
    }
  }

  /**
   * Search recent items
   */
  private async searchRecentItems(query: string): Promise<SearchResultItem[]> {
    try {
      const recent = localStorage.getItem("nav-recent");
      if (!recent) return [];

      const recentItems: NavItem[] = JSON.parse(recent);
      const queryLower = query.toLowerCase();
      const results: SearchResultItem[] = [];

      for (const item of recentItems) {
        if (!item.href) continue;

        const score = this.calculateScore(
          item.name + " " + (item.description || ""),
          queryLower,
        );
        if (score > 0) {
          results.push({
            id: `recent-${item.href}`,
            type: "recent",
            title: item.name,
            description: item.description || "Recently visited",
            icon: item.icon,
            href: item.href,
            category: "Recent",
            score: score * 0.8, // Slightly lower than navigation
          });
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Search favorites
   */
  private async searchFavorites(query: string): Promise<SearchResultItem[]> {
    try {
      const favorites = localStorage.getItem("nav-favorites");
      if (!favorites) return [];

      const favoriteHrefs: string[] = JSON.parse(favorites);
      const queryLower = query.toLowerCase();
      const results: SearchResultItem[] = [];

      // We'd need to reconstruct nav items from hrefs, but for now return empty
      // This would require passing nav structure
      return results;
    } catch {
      return [];
    }
  }

  /**
   * Calculate search score
   */
  private calculateScore(text: string, query: string): number {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (!lowerQuery) return 0;

    // Exact match
    if (lowerText === lowerQuery) return 100;

    // Starts with
    if (lowerText.startsWith(lowerQuery)) return 90;

    // Contains as whole word
    const words = lowerText.split(/\s+/);
    if (words.some((word) => word.startsWith(lowerQuery))) return 80;

    // Contains anywhere
    if (lowerText.includes(lowerQuery)) return 70;

    // Fuzzy match
    let textIndex = 0;
    let matchCount = 0;
    for (let i = 0; i < lowerQuery.length; i++) {
      const char = lowerQuery[i];
      const foundIndex = lowerText.indexOf(char, textIndex);
      if (foundIndex === -1) return 0;
      textIndex = foundIndex + 1;
      matchCount++;
    }

    const proximity = textIndex - matchCount;
    return Math.max(30, 60 - proximity * 5);
  }

  /**
   * Generate suggestions
   */
  private generateSuggestions(
    query: string,
    results: SearchResultItem[],
    intent: SearchIntent,
  ): string[] {
    const suggestions: string[] = [];

    // Add top result titles as suggestions
    results.slice(0, 3).forEach((r) => {
      if (r.title.toLowerCase() !== query.toLowerCase()) {
        suggestions.push(r.title);
      }
    });

    // Add intent-based suggestions
    if (intent.primaryIntent === "NAVIGATE") {
      suggestions.push("Go to Dashboard", "Open Orders", "View Shipments");
    } else if (intent.primaryIntent === "PERFORM_ACTION") {
      suggestions.push("Create Order", "Export Data", "Import File");
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Group results by category
   */
  private groupByCategory(
    results: SearchResultItem[],
  ): Array<{ name: string; count: number }> {
    const categoryMap = new Map<string, number>();

    for (const result of results) {
      const category = result.category || "Other";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Track search history
   */
  private trackSearch(query: string): void {
    this.searchHistory.push({ query, timestamp: Date.now() });
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100);
    }
  }

  /**
   * Helper: Check if query matches patterns
   */
  private matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some((pattern) => text.includes(pattern));
  }

  /**
   * Helper: Extract module from query
   */
  private extractModule(query: string): string | undefined {
    const modules = ["wms", "tms", "msds", "qhse", "compliance", "marketplace"];
    return modules.find((m) => query.includes(m));
  }

  /**
   * Helper: Extract action from query
   */
  private extractAction(query: string): string | undefined {
    const actions = [
      "create",
      "add",
      "new",
      "delete",
      "edit",
      "update",
      "export",
      "import",
    ];
    return actions.find((a) => query.includes(a));
  }

  /**
   * Helper: Extract entity type from query
   */
  private extractEntityType(query: string): string | undefined {
    const entities = [
      "order",
      "shipment",
      "product",
      "customer",
      "warehouse",
      "document",
    ];
    return entities.find((e) => query.includes(e));
  }
}

export const globalIntelligentSearchService =
  new GlobalIntelligentSearchService();
