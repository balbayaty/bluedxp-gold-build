/**
 * Catalog Service
 * Catalog management - internal catalog, vendor catalog, marketplace catalog
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

export interface Catalog {
  id: string;
  tenantId: string;
  catalogNumber: string;
  catalogName: string;
  catalogType: "INTERNAL" | "VENDOR" | "MARKETPLACE";
  vendorId?: string;
  vendorName?: string;
  description?: string;
  items: CatalogItem[];
  isActive: boolean;
  validFrom?: Date | string;
  validTo?: Date | string;
  createdAt: Date | string;
  createdBy: string;
}

export interface CatalogItem {
  id: string;
  catalogId: string;
  itemCode: string;
  itemName: string;
  description?: string;
  category?: string;
  unit: string;
  unitPrice: number;
  currency: string;
  minOrderQuantity?: number;
  leadTime?: number;
  availability?: "IN_STOCK" | "OUT_OF_STOCK" | "BACKORDER";
  specifications?: Record<string, any>;
  imageUrl?: string;
  isActive: boolean;
}

// In-memory storage
const catalogs = new Map<string, Catalog>();

// Catalog number generator
let catalogCounter = 1;

function generateCatalogNumber(): string {
  const year = new Date().getFullYear();
  const number = String(catalogCounter++).padStart(4, "0");
  return `CAT-${year}-${number}`;
}

export class CatalogService {
  /**
   * Create catalog
   */
  async createCatalog(
    tenantId: string,
    catalogName: string,
    catalogType: Catalog["catalogType"],
    vendorId?: string,
    vendorName?: string,
    description?: string,
    validFrom?: Date | string,
    validTo?: Date | string,
    userId: string = "system",
  ): Promise<Catalog> {
    const catalogNumber = generateCatalogNumber();
    const catalogId = `catalog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const catalog: Catalog = {
      id: catalogId,
      tenantId,
      catalogNumber,
      catalogName,
      catalogType,
      vendorId,
      vendorName,
      description,
      items: [],
      isActive: true,
      validFrom,
      validTo,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    catalogs.set(catalogId, catalog);

    // Publish event
    await eventBus.publish({
      type: "procurement.catalog.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        catalogId,
        catalogNumber,
        tenantId,
        catalogType,
        vendorId,
      },
    } as DomainEvent);

    return catalog;
  }

  /**
   * Add item to catalog
   */
  async addCatalogItem(
    catalogId: string,
    tenantId: string,
    item: Omit<CatalogItem, "id" | "catalogId">,
  ): Promise<CatalogItem> {
    const catalog = catalogs.get(catalogId);
    if (!catalog || catalog.tenantId !== tenantId) {
      throw new Error("Catalog not found");
    }

    const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const catalogItem: CatalogItem = {
      id: itemId,
      catalogId,
      ...item,
    };

    catalog.items.push(catalogItem);
    catalogs.set(catalogId, catalog);

    return catalogItem;
  }

  /**
   * Search catalog items
   */
  async searchCatalogItems(
    tenantId: string,
    searchQuery: string,
    filters?: {
      catalogId?: string;
      catalogType?: Catalog["catalogType"][];
      category?: string[];
      vendorId?: string;
      minPrice?: number;
      maxPrice?: number;
      currency?: string;
    },
  ): Promise<CatalogItem[]> {
    let results: CatalogItem[] = [];

    // Get all catalogs for tenant
    const tenantCatalogs = Array.from(catalogs.values()).filter(
      (c) => c.tenantId === tenantId && c.isActive,
    );

    // Filter by catalog type
    let filteredCatalogs = tenantCatalogs;
    if (filters?.catalogType && filters.catalogType.length > 0) {
      filteredCatalogs = filteredCatalogs.filter((c) =>
        filters.catalogType!.includes(c.catalogType),
      );
    }

    // Filter by catalog ID
    if (filters?.catalogId) {
      filteredCatalogs = filteredCatalogs.filter(
        (c) => c.id === filters.catalogId,
      );
    }

    // Filter by vendor
    if (filters?.vendorId) {
      filteredCatalogs = filteredCatalogs.filter(
        (c) => c.vendorId === filters.vendorId,
      );
    }

    // Collect all items from filtered catalogs
    filteredCatalogs.forEach((catalog) => {
      catalog.items
        .filter((item) => item.isActive)
        .forEach((item) => {
          results.push(item);
        });
    });

    // Apply search query
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      results = results.filter(
        (item) =>
          item.itemCode.toLowerCase().includes(queryLower) ||
          item.itemName.toLowerCase().includes(queryLower) ||
          item.description?.toLowerCase().includes(queryLower),
      );
    }

    // Apply filters
    if (filters?.category && filters.category.length > 0) {
      results = results.filter(
        (item) => item.category && filters.category!.includes(item.category),
      );
    }

    if (filters?.minPrice) {
      results = results.filter((item) => item.unitPrice >= filters.minPrice!);
    }

    if (filters?.maxPrice) {
      results = results.filter((item) => item.unitPrice <= filters.maxPrice!);
    }

    if (filters?.currency) {
      results = results.filter((item) => item.currency === filters.currency);
    }

    return results;
  }

  /**
   * Get catalog by ID
   */
  async getCatalog(
    catalogId: string,
    tenantId: string,
  ): Promise<Catalog | null> {
    const catalog = catalogs.get(catalogId);
    if (!catalog || catalog.tenantId !== tenantId) {
      return null;
    }
    return catalog;
  }

  /**
   * List catalogs
   */
  async listCatalogs(
    tenantId: string,
    filters?: {
      catalogType?: Catalog["catalogType"][];
      vendorId?: string;
      isActive?: boolean;
    },
  ): Promise<Catalog[]> {
    let results = Array.from(catalogs.values()).filter(
      (c) => c.tenantId === tenantId,
    );

    if (filters) {
      if (filters.catalogType && filters.catalogType.length > 0) {
        results = results.filter((c) =>
          filters.catalogType!.includes(c.catalogType),
        );
      }
      if (filters.vendorId) {
        results = results.filter((c) => c.vendorId === filters.vendorId);
      }
      if (filters.isActive !== undefined) {
        results = results.filter((c) => c.isActive === filters.isActive);
      }
    }

    return results;
  }
}

// Singleton instance
export const catalogService = new CatalogService();
