/**
 * Declaration Store
 * In-memory store for declarations (would be replaced with database in production)
 */

import type { CustomsDeclaration } from "@/types/customs";

class DeclarationStore {
  private declarations: Map<string, CustomsDeclaration> = new Map();

  /**
   * Save declaration
   */
  save(declaration: CustomsDeclaration): void {
    this.declarations.set(declaration.id, declaration);
  }

  /**
   * Get declaration by ID
   */
  get(id: string): CustomsDeclaration | undefined {
    return this.declarations.get(id);
  }

  /**
   * Get all declarations
   */
  getAll(): CustomsDeclaration[] {
    return Array.from(this.declarations.values());
  }

  /**
   * Query declarations
   */
  query(filters: {
    status?: string;
    country?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): CustomsDeclaration[] {
    let results = this.getAll();

    if (filters.status) {
      results = results.filter((d) => d.status === filters.status);
    }
    if (filters.country) {
      results = results.filter((d) => d.country === filters.country);
    }
    if (filters.type) {
      results = results.filter((d) => d.type === filters.type);
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    return results.slice(offset, offset + limit);
  }

  /**
   * Delete declaration
   */
  delete(id: string): boolean {
    return this.declarations.delete(id);
  }

  /**
   * Count declarations by status
   */
  getCounts(): {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cleared: number;
    held: number;
  } {
    const all = this.getAll();
    return {
      total: all.length,
      pending: all.filter(
        (d) => d.status === "SUBMITTED" || d.status === "UNDER_REVIEW",
      ).length,
      approved: all.filter((d) => d.status === "APPROVED").length,
      rejected: all.filter((d) => d.status === "REJECTED").length,
      cleared: all.filter((d) => d.status === "CLEARED").length,
      held: all.filter((d) => d.status === "HELD").length,
    };
  }
}

export const declarationStore = new DeclarationStore();
