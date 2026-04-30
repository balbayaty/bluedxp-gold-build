/**
 * AWS S3 Storage Adapter
 *
 * Amazon's cloud storage (most reliable in the world)
 * - 99.999999999% durability (11 nines!)
 * - Global access
 * - Fully managed
 * - Pay per GB used
 *
 * To use: Set STORAGE_PROVIDER=s3 and configure AWS credentials
 *
 * Note: Requires @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner packages
 * Install with: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

import {
  StorageAdapter,
  StorageObject,
  FileMetadata,
} from "./baseStorageAdapter";

// Dynamic imports for AWS SDK (only load if needed)
let S3Client: any = null;
let PutObjectCommand: any = null;
let GetObjectCommand: any = null;
let DeleteObjectCommand: any = null;
let HeadObjectCommand: any = null;
let ListObjectsV2Command: any = null;
let CopyObjectCommand: any = null;
let getSignedUrl: any = null;

async function loadAWSSDK() {
  if (S3Client) return; // Already loaded

  try {
    // Use require() with string concatenation to prevent webpack from analyzing this at build time
    // This allows the build to succeed even if packages aren't installed
    const s3ClientModuleName = "@aws-sdk/" + "client-s3";
    const presignerModuleName = "@aws-sdk/" + "s3-request-presigner";

    // Dynamic require that webpack can't analyze
    const s3ClientModule = require(s3ClientModuleName);
    const presignerModule = require(presignerModuleName);

    S3Client = s3ClientModule.S3Client;
    PutObjectCommand = s3ClientModule.PutObjectCommand;
    GetObjectCommand = s3ClientModule.GetObjectCommand;
    DeleteObjectCommand = s3ClientModule.DeleteObjectCommand;
    HeadObjectCommand = s3ClientModule.HeadObjectCommand;
    ListObjectsV2Command = s3ClientModule.ListObjectsV2Command;
    CopyObjectCommand = s3ClientModule.CopyObjectCommand;
    getSignedUrl = presignerModule.getSignedUrl;
  } catch (error: any) {
    throw new Error(
      "AWS SDK packages not installed. Install with: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner",
    );
  }
}

export class S3Adapter implements StorageAdapter {
  private client: any = null;
  private initialized: boolean = false;
  private region: string;

  constructor() {
    this.region =
      process.env.AWS_REGION || process.env.S3_REGION || "me-south-1"; // Bahrain (close to Saudi)
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load AWS SDK dynamically
      await loadAWSSDK();

      const accessKeyId =
        process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
      const secretAccessKey =
        process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;

      if (!accessKeyId || !secretAccessKey) {
        throw new Error(
          "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY",
        );
      }

      this.client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      this.initialized = true;
      console.log("✅ AWS S3 Storage Adapter: Initialized", {
        region: this.region,
      });
    } catch (error) {
      console.error("❌ AWS S3 Storage Adapter: Failed to initialize", error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.initialized && this.client !== null;
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
    await loadAWSSDK();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectName,
      Body: data,
      ContentType: metadata?.contentType || "application/octet-stream",
      Metadata: metadata?.customMetadata,
      ServerSideEncryption: metadata?.encryption ? "AES256" : undefined,
    });

    await this.client!.send(command);

    // Return S3 URL
    return `s3://${bucket}/${objectName}`;
  }

  async download(bucket: string, objectName: string): Promise<Buffer> {
    await this.ensureInitialized();
    await loadAWSSDK();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectName,
    });

    const response = await this.client!.send(command);
    const chunks: Buffer[] = [];

    if (!response.Body) {
      throw new Error("Empty response body");
    }

    // Convert stream to Buffer
    for await (const chunk of response.Body as any) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  async delete(bucket: string, objectName: string): Promise<void> {
    await this.ensureInitialized();
    await loadAWSSDK();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectName,
    });

    await this.client!.send(command);
  }

  async getPresignedUrl(
    bucket: string,
    objectName: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    await this.ensureInitialized();
    await loadAWSSDK();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectName,
    });

    return await getSignedUrl(this.client!, command, {
      expiresIn: expirySeconds,
    });
  }

  async exists(bucket: string, objectName: string): Promise<boolean> {
    await this.ensureInitialized();
    await loadAWSSDK();

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: objectName,
      });
      await this.client!.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  async list(bucket: string, prefix?: string): Promise<StorageObject[]> {
    await this.ensureInitialized();
    await loadAWSSDK();

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await this.client!.send(command);
    const objects: StorageObject[] = [];

    for (const obj of response.Contents || []) {
      objects.push({
        name: obj.Key || "",
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag?.replace(/"/g, ""),
      });
    }

    return objects;
  }

  async getMetadata(bucket: string, objectName: string): Promise<FileMetadata> {
    await this.ensureInitialized();
    await loadAWSSDK();

    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: objectName,
    });

    const response = await this.client!.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || "application/octet-stream",
      lastModified: response.LastModified || new Date(),
      etag: response.ETag?.replace(/"/g, ""),
      metadata: response.Metadata,
      encryption: !!response.ServerSideEncryption,
    };
  }

  async copy(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    await this.ensureInitialized();
    await loadAWSSDK();

    const command = new CopyObjectCommand({
      Bucket: destBucket,
      CopySource: `${sourceBucket}/${sourceObject}`,
      Key: destObject,
    });

    await this.client!.send(command);
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
