/**
 * Google Cloud Storage Adapter (Stub)
 *
 * This is a placeholder adapter for Google Cloud Storage.
 * To use GCS storage, install @google-cloud/storage package:
 *
 * npm install @google-cloud/storage
 *
 * Then implement the full adapter following the baseStorageAdapter interface.
 */

import {
  StorageAdapter,
  StorageObject,
  FileMetadata,
} from "./baseStorageAdapter";

export class GCSAdapter implements StorageAdapter {
  async initialize(): Promise<void> {
    throw new Error(
      "Google Cloud Storage adapter not fully implemented. Install @google-cloud/storage and implement the adapter.",
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
    throw new Error("GCS adapter not implemented");
  }

  async download(bucket: string, objectName: string): Promise<Buffer> {
    throw new Error("GCS adapter not implemented");
  }

  async delete(bucket: string, objectName: string): Promise<void> {
    throw new Error("GCS adapter not implemented");
  }

  async getPresignedUrl(
    bucket: string,
    objectName: string,
    expirySeconds?: number,
  ): Promise<string> {
    throw new Error("GCS adapter not implemented");
  }

  async exists(bucket: string, objectName: string): Promise<boolean> {
    throw new Error("GCS adapter not implemented");
  }

  async list(bucket: string, prefix?: string): Promise<StorageObject[]> {
    throw new Error("GCS adapter not implemented");
  }

  async getMetadata(bucket: string, objectName: string): Promise<FileMetadata> {
    throw new Error("GCS adapter not implemented");
  }

  async copy(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    throw new Error("GCS adapter not implemented");
  }

  async move(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    throw new Error("GCS adapter not implemented");
  }
}
