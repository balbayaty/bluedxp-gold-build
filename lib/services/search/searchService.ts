/**
 * Search Service
 * High-level search operations
 * Uses dynamic import for opensearchClient to avoid webpack errors
 */

// Import opensearchClient directly (it has proper fallback handling)
import { opensearchClient } from "./opensearchClient";

async function getOpenSearchClient() {
  // opensearchClient already has fallback logic built-in
  return opensearchClient;
}

export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  sort?: Array<{ [key: string]: { order: "asc" | "desc" } }>;
  from?: number;
  size?: number;
}

export interface SearchResult {
  hits: Array<{
    id: string;
    score: number;
    source: any;
  }>;
  total: number;
  took: number;
}

export class SearchService {
  private defaultIndex: string;

  constructor(defaultIndex: string = "bluedxp") {
    this.defaultIndex = defaultIndex;
  }

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    const client = await getOpenSearchClient();
    await client.initialize();
    await client.createIndex(this.defaultIndex);
  }

  /**
   * Index document
   */
  async index(document: any, id?: string, index?: string): Promise<void> {
    const targetIndex = index || this.defaultIndex;
    const client = await getOpenSearchClient();
    return client.index(targetIndex, document, id);
  }

  /**
   * Search documents
   */
  async search(query: SearchQuery, index?: string): Promise<SearchResult> {
    const targetIndex = index || this.defaultIndex;

    const searchBody: any = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query.query,
                fields: ["*"],
                fuzziness: "AUTO",
              },
            },
          ],
        },
      },
    };

    // Add filters
    if (query.filters) {
      searchBody.query.bool.filter = Object.entries(query.filters).map(
        ([key, value]) => ({
          term: { [key]: value },
        }),
      );
    }

    // Add sorting
    if (query.sort) {
      searchBody.sort = query.sort;
    }

    // Add pagination
    if (query.from !== undefined) {
      searchBody.from = query.from;
    }
    if (query.size !== undefined) {
      searchBody.size = query.size;
    }

    const client = await getOpenSearchClient();
    const response = await client.search(targetIndex, searchBody);

    return {
      hits: response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
      })),
      total: response.hits.total.value || response.hits.total,
      took: response.took,
    };
  }

  /**
   * Delete document
   */
  async delete(id: string, index?: string): Promise<void> {
    const targetIndex = index || this.defaultIndex;
    const client = await getOpenSearchClient();
    return client.deleteDocument(targetIndex, id);
  }

  /**
   * Check if service is enabled
   */
  async isEnabled(): Promise<boolean> {
    const client = await getOpenSearchClient();
    return client.isEnabled();
  }
}

export const searchService = new SearchService();
