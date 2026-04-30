/**
 * OpenSearch Client Service
 * Full-text search and analytics integration
 * Falls back gracefully if @opensearch-project/opensearch is not installed
 */

// Optional OpenSearch import - loaded dynamically at runtime
let OpenSearchClientLib: any = null;
let ClientOptions: any = null;

try {
  if (typeof require !== "undefined") {
    const opensearch = require("@opensearch-project/opensearch");
    OpenSearchClientLib = opensearch.Client;
    ClientOptions = opensearch.ClientOptions;
  }
} catch (e) {
  // @opensearch-project/opensearch not installed
  console.log(
    "⚠️ @opensearch-project/opensearch not installed, OpenSearch features will be disabled",
  );
}

export interface OpenSearchConfig {
  node: string | string[];
  auth?: {
    username: string;
    password: string;
  };
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

export class OpenSearchClient {
  private client: any = null;
  private enabled: boolean = false;

  /**
   * Initialize OpenSearch client
   */
  async initialize(config?: OpenSearchConfig): Promise<void> {
    if (!OpenSearchClientLib) {
      console.log(
        "⚠️ OpenSearch: @opensearch-project/opensearch not available, OpenSearch features disabled",
      );
      this.enabled = false;
      return;
    }

    try {
      const node =
        config?.node || process.env.OPENSEARCH_NODE || "http://localhost:9200";
      const username =
        config?.auth?.username || process.env.OPENSEARCH_USERNAME;
      const password =
        config?.auth?.password || process.env.OPENSEARCH_PASSWORD;

      const clientOptions: any = {
        node: Array.isArray(node) ? node : [node],
      };

      // Add authentication if provided
      if (username && password) {
        clientOptions.auth = {
          username,
          password,
        };
      }

      // SSL configuration
      if (config?.ssl) {
        clientOptions.ssl = config.ssl;
      } else if (process.env.OPENSEARCH_SSL === "true") {
        clientOptions.ssl = {
          rejectUnauthorized:
            process.env.OPENSEARCH_SSL_REJECT_UNAUTHORIZED !== "false",
        };
      }

      this.client = new OpenSearchClientLib(clientOptions);

      // Test connection
      try {
        const response = await this.client.ping();
        if (response) {
          this.enabled = true;
          console.log("✅ OpenSearch: Client initialized and connected");
        }
      } catch (pingError) {
        // Connection test failed, but client is initialized
        this.enabled = true;
        console.log(
          "⚠️ OpenSearch: Client initialized but ping failed (may be starting up)",
        );
      }
    } catch (error) {
      console.error("❌ Error initializing OpenSearch:", error);
      this.enabled = false;
      throw error;
    }
  }

  /**
   * Get OpenSearch client instance
   */
  getClient(): any {
    if (!this.client) {
      throw new Error(
        "OpenSearch client not initialized. Call initialize() first.",
      );
    }
    return this.client;
  }

  /**
   * Check if OpenSearch is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Create index
   */
  async createIndex(indexName: string, body?: any): Promise<void> {
    if (!this.client) {
      throw new Error("OpenSearch client not initialized");
    }

    try {
      const exists = await this.client.indices.exists({ index: indexName });
      if (!exists.body) {
        await this.client.indices.create({
          index: indexName,
          body: body || {},
        });
        console.log(`✅ OpenSearch: Created index ${indexName}`);
      }
    } catch (error) {
      console.error(`❌ Error creating index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Delete index
   */
  async deleteIndex(indexName: string): Promise<void> {
    if (!this.client) {
      throw new Error("OpenSearch client not initialized");
    }

    try {
      await this.client.indices.delete({ index: indexName });
      console.log(`✅ OpenSearch: Deleted index ${indexName}`);
    } catch (error) {
      console.error(`❌ Error deleting index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Index document
   */
  async indexDocument(
    indexName: string,
    id: string,
    document: any,
  ): Promise<void> {
    if (!this.client) {
      throw new Error("OpenSearch client not initialized");
    }

    try {
      await this.client.index({
        index: indexName,
        id,
        body: document,
      });
    } catch (error) {
      console.error(`❌ Error indexing document in ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Index document (alias for indexDocument)
   */
  async index(indexName: string, document: any, id?: string): Promise<void> {
    if (id) {
      return this.indexDocument(indexName, id, document);
    }
    // Auto-generate ID if not provided
    return this.indexDocument(
      indexName,
      `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      document,
    );
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(
    indexName: string,
    documents: Array<{ id: string; document: any }>,
  ): Promise<void> {
    if (!this.client) {
      throw new Error("OpenSearch client not initialized");
    }

    try {
      const body = documents.flatMap((doc) => [
        { index: { _index: indexName, _id: doc.id } },
        doc.document,
      ]);

      await this.client.bulk({ body });
    } catch (error) {
      console.error(`❌ Error bulk indexing in ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async search(indexName: string, query: any): Promise<any> {
    if (!this.client) {
      throw new Error("OpenSearch client not initialized");
    }

    try {
      const response = await this.client.search({
        index: indexName,
        body: query,
      });
      return response.body;
    } catch (error) {
      console.error(`❌ Error searching in ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(indexName: string, id: string): Promise<void> {
    if (!this.client) {
      throw new Error("OpenSearch client not initialized");
    }

    try {
      await this.client.delete({
        index: indexName,
        id,
      });
    } catch (error) {
      console.error(
        `❌ Error deleting document ${id} from ${indexName}:`,
        error,
      );
      throw error;
    }
  }
}

export const opensearchClient = new OpenSearchClient();
