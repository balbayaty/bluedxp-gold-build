/**
 * MSDS Search History Service
 * Tracks and manages search history for intelligent recommendations
 * Stores in database with fallback to localStorage
 */

import { getMSDSDatabaseAdapter } from "./msdsDatabaseAdapter";

export interface SearchHistoryEntry {
  id: string;
  query: string;
  filters: {
    status?: string;
    hazardLevel?: string;
    manufacturer?: string;
    casNumber?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  resultsCount: number;
  timestamp: string;
  userId: string;
  tenantId: string;
  clickedResults?: string[]; // MSDS IDs that were clicked after search
}

class MSDSSearchHistoryService {
  private history: Map<string, SearchHistoryEntry[]> = new Map(); // tenantId -> history

  /**
   * Save a search to history
   */
  async saveSearch(
    query: string,
    filters: SearchHistoryEntry["filters"],
    resultsCount: number,
    userId: string,
    tenantId: string,
  ): Promise<string> {
    const entry: SearchHistoryEntry = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      filters,
      resultsCount,
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
      clickedResults: [],
    };

    // Store in memory
    if (!this.history.has(tenantId)) {
      this.history.set(tenantId, []);
    }
    const tenantHistory = this.history.get(tenantId)!;
    tenantHistory.unshift(entry); // Add to beginning
    tenantHistory.splice(100); // Keep only last 100 searches

    // Try to store in database
    try {
      const dbAdapter = getMSDSDatabaseAdapter();
      if (dbAdapter.isDatabaseAvailable()) {
        // Store in database (would need a search_history table)
        // For now, we'll use localStorage as fallback
        await this.saveToLocalStorage(tenantId, tenantHistory);
      } else {
        await this.saveToLocalStorage(tenantId, tenantHistory);
      }
    } catch (error) {
      console.warn(
        "⚠️ Failed to save search history to database, using localStorage:",
        error,
      );
      await this.saveToLocalStorage(tenantId, tenantHistory);
    }

    return entry.id;
  }

  /**
   * Get search history for a tenant
   */
  async getHistory(
    tenantId: string,
    limit: number = 20,
  ): Promise<SearchHistoryEntry[]> {
    // Try to load from database first
    try {
      const dbAdapter = getMSDSDatabaseAdapter();
      if (dbAdapter.isDatabaseAvailable()) {
        // Load from database (would need implementation)
        // For now, fallback to localStorage
        const history = await this.loadFromLocalStorage(tenantId);
        this.history.set(tenantId, history);
        return history.slice(0, limit);
      }
    } catch (error) {
      console.warn("⚠️ Failed to load search history from database:", error);
    }

    // Fallback to localStorage
    const history = await this.loadFromLocalStorage(tenantId);
    this.history.set(tenantId, history);
    return history.slice(0, limit);
  }

  /**
   * Get popular searches (most frequent queries)
   */
  async getPopularSearches(
    tenantId: string,
    limit: number = 10,
  ): Promise<Array<{ query: string; count: number }>> {
    const history = await this.getHistory(tenantId, 1000); // Get more to analyze

    const queryCounts = new Map<string, number>();
    history.forEach((entry) => {
      const count = queryCounts.get(entry.query) || 0;
      queryCounts.set(entry.query, count + 1);
    });

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get recent searches (last N searches)
   */
  async getRecentSearches(
    tenantId: string,
    limit: number = 10,
  ): Promise<SearchHistoryEntry[]> {
    const history = await this.getHistory(tenantId, limit);
    return history.slice(0, limit);
  }

  /**
   * Track which MSDS was clicked after a search
   */
  async trackClick(
    searchId: string,
    msdsId: string,
    tenantId: string,
  ): Promise<void> {
    const history = await this.getHistory(tenantId, 1000);
    const entry = history.find((e) => e.id === searchId);
    if (entry) {
      if (!entry.clickedResults) {
        entry.clickedResults = [];
      }
      if (!entry.clickedResults.includes(msdsId)) {
        entry.clickedResults.push(msdsId);
      }
      await this.saveToLocalStorage(tenantId, history);
    }
  }

  /**
   * Clear search history for a tenant
   */
  async clearHistory(tenantId: string): Promise<void> {
    this.history.set(tenantId, []);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`msds_search_history_${tenantId}`);
    }
  }

  /**
   * Save to localStorage (fallback)
   */
  private async saveToLocalStorage(
    tenantId: string,
    history: SearchHistoryEntry[],
  ): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        `msds_search_history_${tenantId}`,
        JSON.stringify(history),
      );
    } catch (error) {
      console.warn("⚠️ Failed to save to localStorage:", error);
    }
  }

  /**
   * Load from localStorage (fallback)
   */
  private async loadFromLocalStorage(
    tenantId: string,
  ): Promise<SearchHistoryEntry[]> {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(`msds_search_history_${tenantId}`);
      if (stored) {
        return JSON.parse(stored) as SearchHistoryEntry[];
      }
    } catch (error) {
      console.warn("⚠️ Failed to load from localStorage:", error);
    }
    return [];
  }
}

export const msdsSearchHistoryService = new MSDSSearchHistoryService();
