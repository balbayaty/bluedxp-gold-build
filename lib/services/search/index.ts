/**
 * Search Service Exports
 */

// Export searchService (doesn't require opensearch at import time)
export { searchService, SearchService } from "./searchService";

// Export OpenSearch client (with proper fallback handling)
export { opensearchClient, OpenSearchClient } from "./opensearchClient";
export type { OpenSearchConfig } from "./opensearchClient";
