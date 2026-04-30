/**
 * Advanced Search Service
 * Full-text search with filters, saved searches, and history
 */

export interface SearchFilter {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "between"
    | "in";
  value: any;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter[];
  entityType: string;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilter[];
  entityType: string;
  timestamp: Date;
  resultCount: number;
}

export class AdvancedSearchService {
  private savedSearches: Map<string, SavedSearch> = new Map();
  private searchHistory: SearchHistory[] = [];
  private maxHistorySize: number = 100;

  /**
   * Perform advanced search
   */
  async search(
    query: string,
    filters: SearchFilter[],
    entityType: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ): Promise<{
    results: any[];
    total: number;
    facets?: Record<string, any>;
  }> {
    // In production, this would use Elasticsearch, Algolia, or database FTS
    // For now, return structure

    // Add to history
    this.addToHistory(query, filters, entityType, 0);

    return {
      results: [],
      total: 0,
    };
  }

  /**
   * Save search
   */
  saveSearch(
    search: Omit<SavedSearch, "id" | "createdAt" | "useCount">,
  ): SavedSearch {
    const id = `search-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const saved: SavedSearch = {
      id,
      ...search,
      createdAt: new Date(),
      useCount: 0,
    };

    this.savedSearches.set(id, saved);
    return saved;
  }

  /**
   * Get saved searches
   */
  getSavedSearches(entityType?: string): SavedSearch[] {
    let searches = Array.from(this.savedSearches.values());

    if (entityType) {
      searches = searches.filter((s) => s.entityType === entityType);
    }

    return searches.sort(
      (a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0),
    );
  }

  /**
   * Delete saved search
   */
  deleteSavedSearch(id: string): boolean {
    return this.savedSearches.delete(id);
  }

  /**
   * Use saved search
   */
  useSavedSearch(id: string): SavedSearch | null {
    const search = this.savedSearches.get(id);
    if (search) {
      search.lastUsed = new Date();
      search.useCount++;
      this.savedSearches.set(id, search);
    }
    return search || null;
  }

  /**
   * Add to search history
   */
  private addToHistory(
    query: string,
    filters: SearchFilter[],
    entityType: string,
    resultCount: number,
  ): void {
    const history: SearchHistory = {
      id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      query,
      filters,
      entityType,
      timestamp: new Date(),
      resultCount,
    };

    this.searchHistory.unshift(history);

    // Limit history size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get search history
   */
  getSearchHistory(entityType?: string, limit?: number): SearchHistory[] {
    let history = [...this.searchHistory];

    if (entityType) {
      history = history.filter((h) => h.entityType === entityType);
    }

    if (limit) {
      history = history.slice(0, limit);
    }

    return history;
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Get search suggestions
   */
  getSuggestions(query: string, entityType?: string): string[] {
    // Get suggestions from history
    const history = this.getSearchHistory(entityType, 10);
    const suggestions = new Set<string>();

    history.forEach((item) => {
      if (item.query.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.query);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Build faceted search
   */
  buildFacets(
    results: any[],
    facetFields: string[],
  ): Record<string, Array<{ value: any; count: number }>> {
    const facets: Record<string, Map<any, number>> = {};

    facetFields.forEach((field) => {
      facets[field] = new Map();
    });

    results.forEach((result) => {
      facetFields.forEach((field) => {
        const value = this.getNestedValue(result, field);
        if (value !== undefined && value !== null) {
          const current = facets[field].get(value) || 0;
          facets[field].set(value, current + 1);
        }
      });
    });

    const facetResults: Record<
      string,
      Array<{ value: any; count: number }>
    > = {};
    Object.entries(facets).forEach(([field, map]) => {
      facetResults[field] = Array.from(map.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    });

    return facetResults;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }
}

export const advancedSearchService = new AdvancedSearchService();
