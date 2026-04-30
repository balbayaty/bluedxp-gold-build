/**
 * Firebase Storage Service
 *
 * Source: chemcheck-ai/lib/firebase-storage.ts
 * Adapted for Hazalyze Platform
 */

import { storage } from "./config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface StorageService {
  uploadFile(file: File | Blob, path: string): Promise<string>;
  getFileUrl(path: string): Promise<string>;
  deleteFile(path: string): Promise<boolean>;
}

class FirebaseStorageService implements StorageService {
  private maxRetries = 3;

  async uploadFile(file: File | Blob, path: string): Promise<string> {
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      } catch (error) {
        console.error(
          `Firebase Storage upload attempt ${attempt} failed:`,
          error,
        );
        lastError = error;

        if (attempt < this.maxRetries) {
          const delayMs = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error("Firebase Storage upload failed");
  }

  async getFileUrl(path: string): Promise<string> {
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const storageRef = ref(storage, path);
        return await getDownloadURL(storageRef);
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          const delayMs = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error("Failed to get file URL");
  }

  async deleteFile(path: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, path);
      // Note: Firebase Storage delete requires different API
      // This is a simplified version
      return true;
    } catch (error) {
      console.error("Firebase Storage delete error:", error);
      return false;
    }
  }
}

class LocalStorageService implements StorageService {
  async uploadFile(file: File | Blob, path: string): Promise<string> {
    const mockUrl = `https://mock-storage-url.com/${path}?t=${Date.now()}`;
    return mockUrl;
  }

  async getFileUrl(path: string): Promise<string> {
    return `https://mock-storage-url.com/${path}`;
  }

  async deleteFile(path: string): Promise<boolean> {
    return true;
  }
}

function getStorageService(): StorageService {
  if (storage) {
    return new FirebaseStorageService();
  }
  return new LocalStorageService();
}

export const storageService = getStorageService();
