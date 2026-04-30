/**
 * QHSE Advanced Search Service
 * Full-text search across all QHSE data
 * Integrated with knowledge base
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { qhseIncidentService } from "../incidentService";
import { qhseInspectionService } from "../inspectionService";
import { qhseTrainingService } from "../trainingService";
import type { Incident, Inspection, TrainingRecord } from "@/types/qhse";

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchQuery {
  query: string;
  entityTypes?: Array<"INCIDENT" | "INSPECTION" | "TRAINING" | "ALL">;
  filters?: SearchFilters;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  dateFrom?: Date | string;
  dateTo?: Date | string;
  status?: string[];
  severity?: string[];
  type?: string[];
  location?: string;
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
  facilityId?: string;
}

export interface SearchResult {
  total: number;
  results: SearchResultItem[];
  facets?: Record<string, number>;
}

export interface SearchResultItem {
  id: string;
  type: "INCIDENT" | "INSPECTION" | "TRAINING";
  title: string;
  description?: string;
  relevance: number;
  highlights?: string[];
  metadata: Record<string, any>;
  link: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// SEARCH SERVICE
// ============================================================================

class QHSESearchService {
  private savedSearches: Map<string, SavedSearch> = new Map();

  /**
   * Search across all QHSE data
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const results: SearchResultItem[] = [];
    const entityTypes = query.entityTypes || ["ALL"];

    // Search incidents
    if (entityTypes.includes("ALL") || entityTypes.includes("INCIDENT")) {
      const incidents = await qhseIncidentService.getIncidents({
        tenantId: query.filters?.tenantId,
        customerId: query.filters?.customerId,
        warehouseId: query.filters?.warehouseId,
        facilityId: query.filters?.facilityId,
        dateFrom: query.filters?.dateFrom,
        dateTo: query.filters?.dateTo,
      });

      for (const incident of incidents) {
        const relevance = this.calculateRelevance(incident, query.query);
        if (relevance > 0) {
          results.push({
            id: incident.id,
            type: "INCIDENT",
            title: incident.title,
            description: incident.description,
            relevance,
            highlights: this.extractHighlights(incident, query.query),
            metadata: {
              incidentNumber: incident.incidentNumber,
              type: incident.type,
              severity: incident.severity,
              status: incident.status,
              location: incident.location,
              occurredAt: incident.occurredAt,
            },
            link: `/qhse/incidents/${incident.id}`,
          });
        }
      }
    }

    // Search inspections
    if (entityTypes.includes("ALL") || entityTypes.includes("INSPECTION")) {
      const inspections = await qhseInspectionService.getInspections({
        tenantId: query.filters?.tenantId,
        customerId: query.filters?.customerId,
        warehouseId: query.filters?.warehouseId,
        facilityId: query.filters?.facilityId,
        dateFrom: query.filters?.dateFrom,
        dateTo: query.filters?.dateTo,
      });

      for (const inspection of inspections) {
        const relevance = this.calculateRelevance(inspection, query.query);
        if (relevance > 0) {
          results.push({
            id: inspection.id,
            type: "INSPECTION",
            title: inspection.title,
            description: inspection.description,
            relevance,
            highlights: this.extractHighlights(inspection, query.query),
            metadata: {
              inspectionNumber: inspection.inspectionNumber,
              type: inspection.type,
              status: inspection.status,
              location: inspection.location,
              scheduledDate: inspection.scheduledDate,
            },
            link: `/qhse/inspections/${inspection.id}`,
          });
        }
      }
    }

    // Search training
    if (entityTypes.includes("ALL") || entityTypes.includes("TRAINING")) {
      const trainingRecords = await qhseTrainingService.getTrainingRecords({
        tenantId: query.filters?.tenantId,
        customerId: query.filters?.customerId,
      });

      for (const record of trainingRecords) {
        const relevance = this.calculateRelevance(record, query.query);
        if (relevance > 0) {
          results.push({
            id: record.id,
            type: "TRAINING",
            title: record.trainingProgram?.name || "Training",
            description: `Training for ${record.employeeName || record.employeeId}`,
            relevance,
            highlights: this.extractHighlights(record, query.query),
            metadata: {
              employeeId: record.employeeId,
              status: record.status,
              progress: record.progress,
              assignedDate: record.assignedDate,
            },
            link: `/qhse/training?record=${record.id}`,
          });
        }
      }
    }

    // Apply filters
    let filteredResults = results;
    if (query.filters) {
      filteredResults = this.applyFilters(results, query.filters);
    }

    // Sort
    if (query.sortBy) {
      filteredResults.sort((a, b) => {
        const aVal = a.metadata[query.sortBy!] || 0;
        const bVal = b.metadata[query.sortBy!] || 0;
        const order = query.sortOrder === "DESC" ? -1 : 1;
        return (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) * order;
      });
    } else {
      // Sort by relevance
      filteredResults.sort((a, b) => b.relevance - a.relevance);
    }

    // Paginate
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    const paginatedResults = filteredResults.slice(offset, offset + limit);

    // Calculate facets
    const facets = this.calculateFacets(filteredResults);

    return {
      total: filteredResults.length,
      results: paginatedResults,
      facets,
    };
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(entity: any, query: string): number {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    let score = 0;

    // Title match (highest weight)
    if (entity.title) {
      const titleLower = entity.title.toLowerCase();
      if (titleLower.includes(queryLower)) score += 10;
      queryWords.forEach((word) => {
        if (titleLower.includes(word)) score += 5;
      });
    }

    // Description match
    if (entity.description) {
      const descLower = entity.description.toLowerCase();
      if (descLower.includes(queryLower)) score += 5;
      queryWords.forEach((word) => {
        if (descLower.includes(word)) score += 2;
      });
    }

    // Metadata match
    Object.values(entity).forEach((value: any) => {
      if (typeof value === "string") {
        const valLower = value.toLowerCase();
        if (valLower.includes(queryLower)) score += 1;
      }
    });

    return score;
  }

  /**
   * Extract highlights
   */
  private extractHighlights(entity: any, query: string): string[] {
    const highlights: string[] = [];
    const queryLower = query.toLowerCase();

    if (entity.title && entity.title.toLowerCase().includes(queryLower)) {
      highlights.push(entity.title);
    }
    if (
      entity.description &&
      entity.description.toLowerCase().includes(queryLower)
    ) {
      highlights.push(entity.description.substring(0, 100));
    }

    return highlights;
  }

  /**
   * Apply filters
   */
  private applyFilters(
    results: SearchResultItem[],
    filters: SearchFilters,
  ): SearchResultItem[] {
    return results.filter((result) => {
      if (filters.status && !filters.status.includes(result.metadata.status))
        return false;
      if (
        filters.severity &&
        result.metadata.severity &&
        !filters.severity.includes(result.metadata.severity)
      )
        return false;
      if (
        filters.type &&
        result.metadata.type &&
        !filters.type.includes(result.metadata.type)
      )
        return false;
      return true;
    });
  }

  /**
   * Calculate facets
   */
  private calculateFacets(results: SearchResultItem[]): Record<string, number> {
    const facets: Record<string, number> = {};

    results.forEach((result) => {
      // Type facet
      facets[result.type] = (facets[result.type] || 0) + 1;

      // Status facet
      if (result.metadata.status) {
        facets[`status:${result.metadata.status}`] =
          (facets[`status:${result.metadata.status}`] || 0) + 1;
      }

      // Severity facet
      if (result.metadata.severity) {
        facets[`severity:${result.metadata.severity}`] =
          (facets[`severity:${result.metadata.severity}`] || 0) + 1;
      }
    });

    return facets;
  }

  /**
   * Save search
   */
  saveSearch(name: string, query: SearchQuery, userId: string): SavedSearch {
    const search: SavedSearch = {
      id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      query,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.savedSearches.set(search.id, search);
    return search;
  }

  /**
   * Get saved searches for user
   */
  getSavedSearches(userId: string): SavedSearch[] {
    return Array.from(this.savedSearches.values()).filter(
      (s) => s.userId === userId,
    );
  }

  /**
   * Delete saved search
   */
  deleteSavedSearch(searchId: string, userId: string): boolean {
    const search = this.savedSearches.get(searchId);
    if (search && search.userId === userId) {
      this.savedSearches.delete(searchId);
      return true;
    }
    return false;
  }
}

export const qhseSearchService = new QHSESearchService();
