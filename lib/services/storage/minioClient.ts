/**
 * MinIO Client Service
 * Object storage integration for documents, files, and backups
 */

import * as MinIO from "minio";

export interface MinIOConfig {
  endPoint: string;
  port?: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
}

export class MinIOClient {
  private client: MinIO.Client | null = null;
  private enabled: boolean = false;
  private bucketCache: Set<string> = new Set();

  /**
   * Initialize MinIO client
   */
  async initialize(config?: MinIOConfig): Promise<void> {
    try {
      const endPoint =
        config?.endPoint || process.env.MINIO_ENDPOINT || "localhost";
      const port = config?.port || parseInt(process.env.MINIO_PORT || "9000");
      const useSSL = config?.useSSL || process.env.MINIO_USE_SSL === "true";
      const accessKey =
        config?.accessKey || process.env.MINIO_ROOT_USER || "minioadmin";
      const secretKey =
        config?.secretKey || process.env.MINIO_ROOT_PASSWORD || "minioadmin";
      const region = config?.region || process.env.MINIO_REGION || "us-east-1";

      this.client = new MinIO.Client({
        endPoint,
        port,
        useSSL,
        accessKey,
        secretKey,
        region,
      });

      // Test connection
      await this.client.listBuckets();
      this.enabled = true;
      console.log("✅ MinIO: Client initialized", { endPoint, port });
    } catch (error) {
      console.error("❌ Error initializing MinIO:", error);
      this.enabled = false;
      throw error;
    }
  }

  /**
   * Get MinIO client instance
   */
  getClient(): MinIO.Client {
    if (!this.client) {
      throw new Error("MinIO client not initialized. Call initialize() first.");
    }
    return this.client;
  }

  /**
   * Check if MinIO is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Ensure bucket exists, create if not
   */
  async ensureBucket(bucketName: string, region?: string): Promise<void> {
    if (!this.client) {
      throw new Error("MinIO client not initialized");
    }

    if (this.bucketCache.has(bucketName)) {
      return;
    }

    try {
      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName, region || "us-east-1");
        console.log(`✅ MinIO: Created bucket ${bucketName}`);
      }
      this.bucketCache.add(bucketName);
    } catch (error) {
      console.error(`❌ Error ensuring bucket ${bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Upload object
   */
  async uploadObject(
    bucketName: string,
    objectName: string,
    data: Buffer | string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    if (!this.client) {
      throw new Error("MinIO client not initialized");
    }

    await this.ensureBucket(bucketName);

    try {
      const buffer = typeof data === "string" ? Buffer.from(data) : data;
      await this.client.putObject(
        bucketName,
        objectName,
        buffer,
        buffer.length,
        metadata,
      );
      return objectName;
    } catch (error) {
      console.error(`❌ Error uploading object ${objectName}:`, error);
      throw error;
    }
  }

  /**
   * Download object
   */
  async downloadObject(
    bucketName: string,
    objectName: string,
  ): Promise<Buffer> {
    if (!this.client) {
      throw new Error("MinIO client not initialized");
    }

    try {
      const chunks: Buffer[] = [];
      const stream = await this.client.getObject(bucketName, objectName);

      return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });
    } catch (error) {
      console.error(`❌ Error downloading object ${objectName}:`, error);
      throw error;
    }
  }

  /**
   * Delete object
   */
  async deleteObject(bucketName: string, objectName: string): Promise<void> {
    if (!this.client) {
      throw new Error("MinIO client not initialized");
    }

    try {
      await this.client.removeObject(bucketName, objectName);
    } catch (error) {
      console.error(`❌ Error deleting object ${objectName}:`, error);
      throw error;
    }
  }

  /**
   * Get presigned URL for object
   */
  async getPresignedUrl(
    bucketName: string,
    objectName: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    if (!this.client) {
      throw new Error("MinIO client not initialized");
    }

    try {
      return await this.client.presignedGetObject(
        bucketName,
        objectName,
        expirySeconds,
      );
    } catch (error) {
      console.error(
        `❌ Error generating presigned URL for ${objectName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * List objects in bucket
   */
  async listObjects(
    bucketName: string,
    prefix?: string,
    recursive: boolean = true,
  ): Promise<MinIO.BucketItem[]> {
    if (!this.client) {
      throw new Error("MinIO client not initialized");
    }

    try {
      const objects: MinIO.BucketItem[] = [];
      const stream = this.client.listObjects(bucketName, prefix, recursive);

      return new Promise((resolve, reject) => {
        stream.on("data", (obj) => objects.push(obj));
        stream.on("end", () => resolve(objects));
        stream.on("error", reject);
      });
    } catch (error) {
      console.error(`❌ Error listing objects in ${bucketName}:`, error);
      throw error;
    }
  }
}

export const minioClient = new MinIOClient();
