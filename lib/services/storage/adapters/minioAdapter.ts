/**
 * MinIO Storage Adapter
 *
 * Self-hosted object storage (like your own Google Drive)
 * - Data stays in Saudi Arabia (compliance!)
 * - Zero monthly fees
 * - Full control
 * - S3-compatible (can switch to AWS S3 later)
 */

import {
  StorageAdapter,
  StorageObject,
  FileMetadata,
} from "./baseStorageAdapter";
import { minioClient } from "../minioClient";

export class MinIOAdapter implements StorageAdapter {
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await minioClient.initialize();
      this.initialized = true;
      console.log("✅ MinIO Storage Adapter: Initialized");
    } catch (error) {
      console.error("❌ MinIO Storage Adapter: Failed to initialize", error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return minioClient.isEnabled();
  }

  async upload(
    bucket: string,
    objectName: string,
    data: Buffer,
    metadata?: {
      contentType?: string;
      customMetadata?: Record<string, string>;
      encryption?: boolean;
    },
  ): Promise<string> {
    await this.ensureInitialized();
    await minioClient.ensureBucket(bucket);

    const uploadMetadata: Record<string, string> = {
      "Content-Type": metadata?.contentType || "application/octet-stream",
      ...metadata?.customMetadata,
    };

    if (metadata?.encryption) {
      uploadMetadata["x-amz-server-side-encryption"] = "AES256";
    }

    await minioClient.uploadObject(bucket, objectName, data, uploadMetadata);

    // Return presigned URL for immediate access
    return await this.getPresignedUrl(bucket, objectName, 3600);
  }

  async download(bucket: string, objectName: string): Promise<Buffer> {
    await this.ensureInitialized();
    return await minioClient.downloadObject(bucket, objectName);
  }

  async delete(bucket: string, objectName: string): Promise<void> {
    await this.ensureInitialized();
    await minioClient.deleteObject(bucket, objectName);
  }

  async getPresignedUrl(
    bucket: string,
    objectName: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    await this.ensureInitialized();
    return await minioClient.getPresignedUrl(bucket, objectName, expirySeconds);
  }

  async exists(bucket: string, objectName: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      // Try to get object metadata - if it fails, file doesn't exist
      const client = minioClient.getClient();
      await client.statObject(bucket, objectName);
      return true;
    } catch (error: any) {
      if (error.code === "NotFound" || error.code === "NoSuchKey") {
        return false;
      }
      throw error;
    }
  }

  async list(bucket: string, prefix?: string): Promise<StorageObject[]> {
    await this.ensureInitialized();
    const objects = await minioClient.listObjects(bucket, prefix, true);

    return objects.map((obj) => ({
      name: obj.name || "",
      size: obj.size || 0,
      lastModified: obj.lastModified || new Date(),
      etag: obj.etag,
      contentType: (obj as any).contentType,
      metadata: (obj as any).metadata,
    }));
  }

  async getMetadata(bucket: string, objectName: string): Promise<FileMetadata> {
    await this.ensureInitialized();
    const client = minioClient.getClient();
    const stat = await client.statObject(bucket, objectName);

    return {
      size: stat.size,
      contentType:
        stat.metaData?.["content-type"] || "application/octet-stream",
      lastModified: stat.lastModified,
      etag: stat.etag,
      metadata: stat.metaData,
      encryption: stat.metaData?.["x-amz-server-side-encryption"] === "AES256",
    };
  }

  async copy(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    await this.ensureInitialized();
    const client = minioClient.getClient();
    await client.copyObject(
      destBucket,
      destObject,
      `/${sourceBucket}/${sourceObject}`,
    );
  }

  async move(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    await this.copy(sourceBucket, sourceObject, destBucket, destObject);
    await this.delete(sourceBucket, sourceObject);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}
