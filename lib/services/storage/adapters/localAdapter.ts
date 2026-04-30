/**
 * Local Filesystem Storage Adapter (Stub)
 *
 * This is a placeholder adapter for local filesystem storage.
 * Useful for development and testing.
 *
 * Note: This adapter should only be used in development environments.
 * For production, use MinIO, S3, Azure, or GCS.
 */

import {
  StorageAdapter,
  StorageObject,
  FileMetadata,
} from "./baseStorageAdapter";
import * as fs from "fs/promises";
import * as path from "path";

export class LocalFileAdapter implements StorageAdapter {
  private basePath: string;

  constructor() {
    // Use a local storage directory (create if doesn't exist)
    this.basePath = process.env.LOCAL_STORAGE_PATH || "./storage/local";
  }

  async initialize(): Promise<void> {
    // Create base directory if it doesn't exist
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error("Failed to create local storage directory:", error);
      throw new Error("Local storage adapter initialization failed");
    }
  }

  isAvailable(): boolean {
    return true;
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
    const bucketPath = path.join(this.basePath, bucket);
    await fs.mkdir(bucketPath, { recursive: true });

    const filePath = path.join(bucketPath, objectName);
    await fs.writeFile(filePath, data);

    return filePath;
  }

  async download(bucket: string, objectName: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, bucket, objectName);
    return await fs.readFile(filePath);
  }

  async delete(bucket: string, objectName: string): Promise<void> {
    const filePath = path.join(this.basePath, bucket, objectName);
    await fs.unlink(filePath);
  }

  async getPresignedUrl(
    bucket: string,
    objectName: string,
    expirySeconds?: number,
  ): Promise<string> {
    // For local storage, return a file:// URL (not really presigned, but works for dev)
    const filePath = path.join(this.basePath, bucket, objectName);
    return `file://${path.resolve(filePath)}`;
  }

  async exists(bucket: string, objectName: string): Promise<boolean> {
    const filePath = path.join(this.basePath, bucket, objectName);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async list(bucket: string, prefix?: string): Promise<StorageObject[]> {
    const bucketPath = path.join(this.basePath, bucket);
    const files: StorageObject[] = [];

    try {
      const entries = await fs.readdir(bucketPath, {
        withFileTypes: true,
        recursive: true,
      });

      for (const entry of entries) {
        if (entry.isFile()) {
          const fullPath = path.join(entry.path, entry.name);
          const relativePath = path.relative(bucketPath, fullPath);

          if (prefix && !relativePath.startsWith(prefix)) {
            continue;
          }

          const stats = await fs.stat(fullPath);
          files.push({
            name: relativePath,
            size: stats.size,
            lastModified: stats.mtime,
          });
        }
      }
    } catch (error) {
      // Bucket doesn't exist or can't read
      return [];
    }

    return files;
  }

  async getMetadata(bucket: string, objectName: string): Promise<FileMetadata> {
    const filePath = path.join(this.basePath, bucket, objectName);
    const stats = await fs.stat(filePath);

    return {
      size: stats.size,
      contentType: "application/octet-stream", // Default, could be improved
      lastModified: stats.mtime,
    };
  }

  async copy(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    const sourcePath = path.join(this.basePath, sourceBucket, sourceObject);
    const destPath = path.join(this.basePath, destBucket, destObject);

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.copyFile(sourcePath, destPath);
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
}
