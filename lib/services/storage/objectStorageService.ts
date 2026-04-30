/**
 * Object Storage Service
 * High-level service for object storage operations
 */

import { minioClient } from "./minioClient";

export interface UploadOptions {
  bucket?: string;
  metadata?: Record<string, string>;
  contentType?: string;
}

export interface StorageObject {
  name: string;
  size: number;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
}

export class ObjectStorageService {
  private defaultBucket: string;

  constructor(defaultBucket: string = "bluedxp") {
    this.defaultBucket = defaultBucket;
  }

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    await minioClient.initialize();
    await minioClient.ensureBucket(this.defaultBucket);
  }

  /**
   * Upload file
   */
  async upload(
    objectName: string,
    data: Buffer | string,
    options: UploadOptions = {},
  ): Promise<string> {
    const bucket = options.bucket || this.defaultBucket;
    const metadata = {
      ...options.metadata,
      "Content-Type": options.contentType || "application/octet-stream",
    };

    return minioClient.uploadObject(bucket, objectName, data, metadata);
  }

  /**
   * Download file
   */
  async download(objectName: string, bucket?: string): Promise<Buffer> {
    const targetBucket = bucket || this.defaultBucket;
    return minioClient.downloadObject(targetBucket, objectName);
  }

  /**
   * Delete file
   */
  async delete(objectName: string, bucket?: string): Promise<void> {
    const targetBucket = bucket || this.defaultBucket;
    return minioClient.deleteObject(targetBucket, objectName);
  }

  /**
   * Get presigned URL
   */
  async getUrl(
    objectName: string,
    expirySeconds: number = 3600,
    bucket?: string,
  ): Promise<string> {
    const targetBucket = bucket || this.defaultBucket;
    return minioClient.getPresignedUrl(targetBucket, objectName, expirySeconds);
  }

  /**
   * List files
   */
  async list(
    prefix?: string,
    bucket?: string,
    recursive: boolean = true,
  ): Promise<StorageObject[]> {
    const targetBucket = bucket || this.defaultBucket;
    const objects = await minioClient.listObjects(
      targetBucket,
      prefix,
      recursive,
    );

    return objects.map((obj) => ({
      name: obj.name || "",
      size: obj.size || 0,
      lastModified: obj.lastModified || new Date(),
      etag: obj.etag,
      // `minio` BucketItem type does not guarantee metadata on list results.
      // Keep it optional for compatibility across MinIO/SDK versions.
      metadata: (obj as unknown as { metadata?: Record<string, string> })
        .metadata,
    }));
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return minioClient.isEnabled();
  }
}

export const objectStorageService = new ObjectStorageService();
