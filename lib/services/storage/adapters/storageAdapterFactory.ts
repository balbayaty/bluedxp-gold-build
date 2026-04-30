/**
 * Storage Adapter Factory
 *
 * THIS IS THE MAGIC! 🎩✨
 *
 * Switch storage providers with ONE environment variable:
 * - STORAGE_PROVIDER=minio → Use MinIO (self-hosted)
 * - STORAGE_PROVIDER=s3 → Use AWS S3 (cloud)
 * - STORAGE_PROVIDER=azure → Use Azure Blob Storage
 * - STORAGE_PROVIDER=gcs → Use Google Cloud Storage
 *
 * NO CODE CHANGES NEEDED! Just change the env variable and restart.
 *
 * CONCEPT: Factory Pattern
 * - Factory creates the right adapter based on configuration
 * - All adapters have the same interface (baseStorageAdapter)
 * - Your code doesn't care which provider is used
 */

import { StorageAdapter, StorageProvider } from "./baseStorageAdapter";
import { MinIOAdapter } from "./minioAdapter";

// Lazy imports for optional adapters (only load if needed)
let s3Adapter: any = null;
let azureAdapter: any = null;
let gcsAdapter: any = null;
let localAdapter: any = null;

class StorageAdapterFactory {
  private adapter: StorageAdapter | null = null;
  private provider: StorageProvider;

  constructor() {
    // Read provider from environment variable
    // Default to 'minio' if not set (already in docker-compose)
    this.provider = (process.env.STORAGE_PROVIDER ||
      "minio") as StorageProvider;
  }

  /**
   * Get the storage adapter
   * Creates adapter on first call, reuses after that
   */
  async getAdapter(): Promise<StorageAdapter> {
    if (this.adapter) {
      return this.adapter;
    }

    // Create adapter based on provider
    switch (this.provider) {
      case "minio":
        this.adapter = new MinIOAdapter();
        break;

      case "s3":
        // Lazy load S3 adapter (only if needed)
        if (!s3Adapter) {
          try {
            const { S3Adapter } = await import("./s3Adapter");
            s3Adapter = S3Adapter;
          } catch (error) {
            console.warn(
              "⚠️ S3 adapter not available. Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner packages.",
            );
            throw new Error(
              "S3 adapter not configured. Set STORAGE_PROVIDER=s3 and install dependencies.",
            );
          }
        }
        this.adapter = new s3Adapter();
        break;

      case "azure":
        // Lazy load Azure adapter (only if needed)
        if (!azureAdapter) {
          try {
            const { AzureBlobAdapter } = await import("./azureAdapter");
            azureAdapter = AzureBlobAdapter;
          } catch (error) {
            console.warn(
              "⚠️ Azure adapter not available. Install @azure/storage-blob package.",
            );
            throw new Error(
              "Azure adapter not configured. Set STORAGE_PROVIDER=azure and install dependencies.",
            );
          }
        }
        this.adapter = new azureAdapter();
        break;

      case "gcs":
        // Lazy load Google Cloud adapter (only if needed)
        if (!gcsAdapter) {
          try {
            const { GCSAdapter } = await import("./gcsAdapter");
            gcsAdapter = GCSAdapter;
          } catch (error) {
            console.warn(
              "⚠️ Google Cloud adapter not available. Install @google-cloud/storage package.",
            );
            throw new Error(
              "Google Cloud adapter not configured. Set STORAGE_PROVIDER=gcs and install dependencies.",
            );
          }
        }
        this.adapter = new gcsAdapter();
        break;

      case "local":
        // Local filesystem adapter (development only)
        if (!localAdapter) {
          try {
            const { LocalFileAdapter } = await import("./localAdapter");
            localAdapter = LocalFileAdapter;
          } catch (error) {
            console.warn("⚠️ Local adapter not available.");
            throw new Error("Local adapter not configured.");
          }
        }
        this.adapter = new localAdapter();
        break;

      default:
        throw new Error(
          `Unknown storage provider: ${this.provider}. Valid: minio, s3, azure, gcs, local`,
        );
    }

    // Initialize adapter
    await this.adapter.initialize();

    console.log(`✅ Storage Adapter: Using ${this.provider.toUpperCase()}`);
    return this.adapter;
  }

  /**
   * Get current provider
   */
  getProvider(): StorageProvider {
    return this.provider;
  }

  /**
   * Check if adapter is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const adapter = await this.getAdapter();
      return adapter.isAvailable();
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
let factoryInstance: StorageAdapterFactory | null = null;

export function getStorageAdapterFactory(): StorageAdapterFactory {
  if (!factoryInstance) {
    factoryInstance = new StorageAdapterFactory();
  }
  return factoryInstance;
}

/**
 * Convenience function to get storage adapter
 */
export async function getStorageAdapter(): Promise<StorageAdapter> {
  const factory = getStorageAdapterFactory();
  return await factory.getAdapter();
}
