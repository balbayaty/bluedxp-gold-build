/**
 * Chemical Server Actions
 *
 * All chemical-related server actions for client components to use.
 * These actions call the chemical service and handle errors properly.
 */

"use server";

import { chemicalService } from "@/lib/services/chemical/chemicalService";
import { revalidatePath } from "next/cache";
import type {
  Chemical,
  ChemicalSearchFilters,
  ChemicalSearchResult,
} from "@/types/chemical";

export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get chemicals with optional filters
 */
export async function getChemicals(
  filters?: ChemicalSearchFilters,
  tenantId?: string,
): Promise<ActionResponse<ChemicalSearchResult>> {
  try {
    const result = await chemicalService.getChemicals(filters, tenantId);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching chemicals:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch chemicals",
    };
  }
}

/**
 * Get a single chemical by ID
 */
export async function getChemicalById(
  id: string,
  tenantId?: string,
): Promise<ActionResponse<Chemical>> {
  try {
    const chemical = await chemicalService.getChemicalById(id, tenantId);
    if (!chemical) {
      return { success: false, error: "Chemical not found" };
    }
    return { success: true, data: chemical };
  } catch (error) {
    console.error("Error fetching chemical:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch chemical",
    };
  }
}

/**
 * Create a new chemical
 */
export async function createChemical(
  chemical: Partial<Chemical>,
  tenantId?: string,
): Promise<ActionResponse<Chemical>> {
  try {
    const created = await chemicalService.createChemical(chemical, tenantId);
    revalidatePath("/chemical-database");
    return { success: true, data: created };
  } catch (error) {
    console.error("Error creating chemical:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create chemical",
    };
  }
}

/**
 * Update an existing chemical
 */
export async function updateChemical(
  id: string,
  updates: Partial<Chemical>,
  tenantId?: string,
): Promise<ActionResponse<Chemical>> {
  try {
    const updated = await chemicalService.updateChemical(id, updates, tenantId);
    revalidatePath("/chemical-database");
    revalidatePath(`/chemical-database/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating chemical:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update chemical",
    };
  }
}

/**
 * Delete a chemical
 */
export async function deleteChemical(
  id: string,
  tenantId?: string,
): Promise<ActionResponse<boolean>> {
  try {
    await chemicalService.deleteChemical(id, tenantId);
    revalidatePath("/chemical-database");
    return { success: true, data: true };
  } catch (error) {
    console.error("Error deleting chemical:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete chemical",
    };
  }
}

/**
 * Search chemicals with AI-powered semantic search
 */
export async function searchChemicals(
  query: string,
  filters?: ChemicalSearchFilters,
  tenantId?: string,
): Promise<ActionResponse<ChemicalSearchResult>> {
  try {
    const result = await chemicalService.searchChemicals(
      query,
      filters,
      tenantId,
    );
    return { success: true, data: result };
  } catch (error) {
    console.error("Error searching chemicals:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search chemicals",
    };
  }
}

/**
 * Find similar chemicals
 */
export async function findSimilarChemicals(
  chemicalId: string,
  limit: number = 10,
  tenantId?: string,
): Promise<ActionResponse<Chemical[]>> {
  try {
    const chemicals = await chemicalService.findSimilarChemicals(
      chemicalId,
      limit,
      tenantId,
    );
    return { success: true, data: chemicals };
  } catch (error) {
    console.error("Error finding similar chemicals:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to find similar chemicals",
    };
  }
}
