/**
 * Azure Blob Storage Adapter (Stub)
 *
 * This is a placeholder adapter for Azure Blob Storage.
 * To use Azure storage, install @azure/storage-blob package:
 *
 * npm install @azure/storage-blob
 *
 * Then implement the full adapter following the baseStorageAdapter interface.
 */

import {
  StorageAdapter,
  StorageObject,
  FileMetadata,
} from "./baseStorageAdapter";

export class AzureBlobAdapter implements StorageAdapter {
  async initialize(): Promise<void> {
    throw new Error(
      "Azure adapter not fully implemented. Install @azure/storage-blob and implement the adapter.",
    );
  }

  isAvailable(): boolean {
    return false;
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
    throw new Error("Azure adapter not implemented");
  }

  async download(bucket: string, objectName: string): Promise<Buffer> {
    throw new Error("Azure adapter not implemented");
  }

  async delete(bucket: string, objectName: string): Promise<void> {
    throw new Error("Azure adapter not implemented");
  }

  async getPresignedUrl(
    bucket: string,
    objectName: string,
    expirySeconds?: number,
  ): Promise<string> {
    throw new Error("Azure adapter not implemented");
  }

  async exists(bucket: string, objectName: string): Promise<boolean> {
    throw new Error("Azure adapter not implemented");
  }

  async list(bucket: string, prefix?: string): Promise<StorageObject[]> {
    throw new Error("Azure adapter not implemented");
  }

  async getMetadata(bucket: string, objectName: string): Promise<FileMetadata> {
    throw new Error("Azure adapter not implemented");
  }

  async copy(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    throw new Error("Azure adapter not implemented");
  }

  async move(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    throw new Error("Azure adapter not implemented");
  }
}
