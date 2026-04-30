/**
 * Offline Service
 * Manage offline data sync and storage
 */

export interface OfflineDataItem {
  id: string;
  type: "create" | "update" | "delete";
  entityType: string;
  entityId: string;
  data: any;
  timestamp: Date;
  synced: boolean;
}

export class OfflineService {
  private dbName = "hazalyze-offline";
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      // Server-side or browser without IndexedDB support - skip initialization
      console.warn(
        "[OfflineService] IndexedDB not available - running in server environment or unsupported browser",
      );
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for offline data
        if (!db.objectStoreNames.contains("offlineData")) {
          const store = db.createObjectStore("offlineData", { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("synced", "synced", { unique: false });
        }

        // Create object store for cached data
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache", { keyPath: "key" });
        }
      };
    });
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Save data for offline sync
   */
  async saveOfflineData(
    item: Omit<OfflineDataItem, "id" | "timestamp" | "synced">,
  ): Promise<string> {
    if (!this.db) {
      await this.initialize();
    }

    const id = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const offlineItem: OfflineDataItem = {
      id,
      ...item,
      timestamp: new Date(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readwrite");
      const store = transaction.objectStore("offlineData");
      const request = store.add(offlineItem);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all unsynced data
   */
  async getUnsyncedData(): Promise<OfflineDataItem[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readonly");
      const store = transaction.objectStore("offlineData");
      const index = store.index("synced");
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark data as synced
   */
  async markAsSynced(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readwrite");
      const store = transaction.objectStore("offlineData");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.synced = true;
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Sync all offline data
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    const unsynced = await this.getUnsyncedData();
    let success = 0;
    let failed = 0;

    for (const item of unsynced) {
      try {
        // Determine API endpoint based on entity type
        const endpoint = this.getEndpointForEntityType(item.entityType);
        if (!endpoint) {
          failed++;
          continue;
        }

        // Make API call
        const response = await fetch(endpoint, {
          method:
            item.type === "delete"
              ? "DELETE"
              : item.type === "update"
                ? "PUT"
                : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          await this.markAsSynced(item.id);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error("Error syncing item:", error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, data: any): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["cache"], "readwrite");
      const store = transaction.objectStore("cache");
      const request = store.put({ key, data, timestamp: new Date() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["cache"], "readonly");
      const store = transaction.objectStore("cache");
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get endpoint for entity type
   */
  private getEndpointForEntityType(entityType: string): string | null {
    const endpoints: Record<string, string> = {
      chemical: "/api/chemical",
      container: "/api/chemical/containers",
      msds: "/api/msds",
      qr: "/api/qr/generate",
    };
    return endpoints[entityType] || null;
  }
}

export const offlineService = new OfflineService();
