/**
 * Base Storage Adapter Interface
 *
 * This is the foundation for a flexible, switchable storage system.
 * You can switch between MinIO, AWS S3, Azure, Google Cloud, etc.
 * with just ONE environment variable change!
 *
 * CONCEPT EXPLANATION:
 * - Adapter Pattern: Like a universal plug adapter - same interface, different implementations
 * - You write code once, switch storage providers anytime
 * - Zero code changes needed to switch providers
 */

export interface StorageAdapter {
  /**
   * Initialize the storage adapter
   */
  initialize(): Promise<void>;

  /**
   * Check if adapter is available/enabled
   */
  isAvailable(): boolean;

  /**
   * Upload a file
   * @param bucket - Storage bucket/container name
   * @param objectName - File path/name in storage
   * @param data - File data (Buffer)
   * @param metadata - File metadata (content type, custom metadata)
   * @returns URL or path to the stored file
   */
  upload(
    bucket: string,
    objectName: string,
    data: Buffer,
    metadata?: {
      contentType?: string;
      customMetadata?: Record<string, string>;
      encryption?: boolean;
    },
  ): Promise<string>;

  /**
   * Download a file
   * @param bucket - Storage bucket/container name
   * @param objectName - File path/name in storage
   * @returns File data as Buffer
   */
  download(bucket: string, objectName: string): Promise<Buffer>;

  /**
   * Delete a file
   * @param bucket - Storage bucket/container name
   * @param objectName - File path/name in storage
   */
  delete(bucket: string, objectName: string): Promise<void>;

  /**
   * Get a presigned URL (temporary access URL)
   * @param bucket - Storage bucket/container name
   * @param objectName - File path/name in storage
   * @param expirySeconds - How long URL is valid (default: 1 hour)
   * @returns Temporary URL to access file
   */
  getPresignedUrl(
    bucket: string,
    objectName: string,
    expirySeconds?: number,
  ): Promise<string>;

  /**
   * Check if file exists
   * @param bucket - Storage bucket/container name
   * @param objectName - File path/name in storage
   * @returns True if file exists
   */
  exists(bucket: string, objectName: string): Promise<boolean>;

  /**
   * List files in a bucket
   * @param bucket - Storage bucket/container name
   * @param prefix - Filter by prefix (like folder path)
   * @returns List of file objects
   */
  list(bucket: string, prefix?: string): Promise<StorageObject[]>;

  /**
   * Get file metadata
   * @param bucket - Storage bucket/container name
   * @param objectName - File path/name in storage
   * @returns File metadata
   */
  getMetadata(bucket: string, objectName: string): Promise<FileMetadata>;

  /**
   * Copy a file
   * @param sourceBucket - Source bucket
   * @param sourceObject - Source file path
   * @param destBucket - Destination bucket
   * @param destObject - Destination file path
   */
  copy(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void>;

  /**
   * Move a file (copy + delete source)
   * @param sourceBucket - Source bucket
   * @param sourceObject - Source file path
   * @param destBucket - Destination bucket
   * @param destObject - Destination file path
   */
  move(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void>;
}

export interface StorageObject {
  name: string;
  size: number;
  lastModified: Date;
  etag?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface FileMetadata {
  size: number;
  contentType: string;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
  encryption?: boolean;
}

/**
 * Storage configuration
 * Set STORAGE_PROVIDER environment variable to switch providers:
 * - 'minio' (default) - Self-hosted MinIO
 * - 's3' - AWS S3
 * - 'azure' - Microsoft Azure Blob Storage
 * - 'gcs' - Google Cloud Storage
 * - 'local' - Local filesystem (development only)
 */
export type StorageProvider = "minio" | "s3" | "azure" | "gcs" | "local";
