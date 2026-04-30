/**
 * Service Initializer
 * Initialize all services on app startup
 */

import { getDatabaseClient, initializeDatabase } from "@/lib/database/client";
import { auditService } from "@/lib/services/audit/auditService";
import { openDataCacheService } from "@/lib/services/open-data/cacheService";
import { cacheService } from "@/lib/services/cache/cacheService";
import { redisService } from "@/lib/services/cache/redisService";
import { i18nService } from "@/lib/services/i18n/i18nService";
import { reportScheduler } from "@/lib/services/reporting/reportScheduler";
import { offlineService } from "@/lib/services/pwa/offlineService";
import { pushService } from "@/lib/services/pwa/pushService";
import { initializeMSDSSKULinkingEventHandlers } from "@/lib/services/msds-sku-linking/eventHandlers";
import { initializeTruthEngine } from "@/lib/services/truth-engine/initialize";
import { objectStorageService } from "@/lib/services/storage";
// Kafka and OpenSearch are imported dynamically to avoid webpack errors if packages are not installed
import { mcpServer, enhancedMCPServer } from "@/lib/mcp";
import { setupPerformanceAttributionSubscriptions } from "@/lib/services/performance/attribution/attributionService";
import { initializeJourneyProjections } from "@/lib/services/transportation/journeyProjections";

export class ServiceInitializer {
  private initPromise: Promise<void> | null = null;
  private initialized = false;

  /**
   * Initialize all services
   */
  async initializeAll(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initializeAllInternal();
    try {
      await this.initPromise;
      this.initialized = true;
    } finally {
      // Keep `initialized` sticky, but release the promise reference.
      this.initPromise = null;
    }
  }

  private async initializeAllInternal(): Promise<void> {
    console.log("🚀 Initializing all services...");

    try {
      // Initialize database
      try {
        const db = await initializeDatabase();
        console.log("✅ Database initialized");

        // Set database clients for services
        auditService.setDatabaseClient(db);
        openDataCacheService.setDatabaseClient(db);

        // Set database client for Truth Engine
        const { truthEngineDatabaseAdapter } =
          await import("@/lib/services/truth-engine/storage/databaseAdapter");
        truthEngineDatabaseAdapter.setDatabaseClient(db);
        console.log("✅ Database clients set");
      } catch (dbError) {
        console.warn(
          "⚠️ Database initialization failed, continuing without database client:",
          dbError,
        );
        // Continue without database - services will use fallbacks
      }

      // Initialize cache service
      await cacheService.initialize();
      console.log("✅ Cache service initialized");

      // Initialize Redis service
      if (process.env.REDIS_URL || process.env.REDIS_ENABLED === "true") {
        try {
          await redisService.initialize();
          console.log("✅ Redis service initialized");
        } catch (error) {
          console.warn(
            "⚠️ Redis service initialization failed, using fallback:",
            error,
          );
        }
      }

      // Initialize offline service
      await offlineService.initialize();
      console.log("✅ Offline service initialized");

      // Initialize i18n
      const savedLanguage =
        typeof window !== "undefined"
          ? (localStorage.getItem("language") as any) || "en"
          : "en";
      await i18nService.initialize(savedLanguage);
      console.log("✅ i18n service initialized");

      // Start report scheduler (server-side only)
      if (typeof window === "undefined") {
        // Register platform read-model projections
        // (Keeps cross-module dashboards decoupled from service instances.)
        initializeJourneyProjections();

        reportScheduler.start();
        console.log("✅ Report scheduler started");

        // Initialize Kafka (if enabled) - dynamic import to avoid webpack errors
        if (process.env.KAFKA_ENABLED === "true" || process.env.KAFKA_BROKERS) {
          try {
            const { kafkaClient } = await import("@/lib/services/kafka");
            await kafkaClient.initialize();
            const connected = await kafkaClient.testConnection();
            if (connected) {
              console.log("✅ Kafka client initialized and connected");
            } else {
              console.warn("⚠️ Kafka connection test failed");
            }
          } catch (error) {
            console.warn(
              "⚠️ Kafka initialization failed (may not be installed):",
              error,
            );
          }
        }

        // Initialize MinIO (if enabled) - dynamic import to avoid webpack errors
        if (
          process.env.MINIO_ENABLED === "true" ||
          process.env.MINIO_ENDPOINT
        ) {
          try {
            const { minioClient } = await import("@/lib/services/storage");
            await minioClient.initialize();
            await objectStorageService.initialize();
            console.log("✅ MinIO object storage initialized");
          } catch (error) {
            console.warn(
              "⚠️ MinIO initialization failed (may not be installed):",
              error,
            );
          }
        }

        // Initialize OpenSearch (if enabled) - dynamic import to avoid webpack errors
        if (
          process.env.OPENSEARCH_ENABLED === "true" ||
          process.env.OPENSEARCH_NODE
        ) {
          try {
            const { opensearchClient } = await import("@/lib/services/search");
            const { searchService } = await import("@/lib/services/search");
            await opensearchClient.initialize();
            await searchService.initialize();
            console.log("✅ OpenSearch initialized");
          } catch (error) {
            console.warn(
              "⚠️ OpenSearch initialization failed (may not be installed):",
              error,
            );
          }
        }

        // Initialize MCP Server (if enabled)
        if (process.env.MCP_ENABLED === "true") {
          try {
            // Initialize legacy server (registers tools)
            await mcpServer.initialize();

            // Enhanced server is automatically populated via legacy server wrapper
            // But we can also initialize it directly if needed
            const stats = enhancedMCPServer.getServerStats();
            console.log(
              `✅ MCP Server initialized with ${stats.totalTools} tools`,
            );
            console.log(
              `   Enhanced features: Analytics, Caching, Batching, Streaming`,
            );
          } catch (error) {
            console.warn("⚠️ MCP Server initialization failed:", error);
          }
        }

        // Initialize LLM Provider Registry (load all providers)
        try {
          const { providerRegistry } =
            await import("@/lib/services/llm-provider/core/providerRegistry");

          // Auto-load all provider plugins
          // Providers are auto-registered when their index.ts files are imported
          await import("@/lib/services/llm-provider/providers/openai");
          await import("@/lib/services/llm-provider/providers/anthropic");

          // Local LLM providers (if Ollama is installed)
          try {
            await import("@/lib/services/llm-provider/providers/ollama");
            console.log("✅ Ollama provider registered (local LLM support)");
          } catch (error) {
            console.warn(
              "⚠️ Ollama provider not available (install Ollama for local LLM support)",
            );
          }

          // Add more providers as they're created:
          // await import('@/lib/services/llm-provider/providers/mistral')
          // await import('@/lib/services/llm-provider/providers/google')
          // await import('@/lib/services/llm-provider/providers/cohere')
          // ... (50+ providers)

          const stats = providerRegistry.getStats();
          console.log(
            `✅ LLM Provider Registry initialized: ${stats.totalProviders} providers registered`,
          );

          // Initialize ML Module integration
          try {
            const { initializeAutoRegistration } =
              await import("@/lib/services/llm-provider/integration/autoRegisterTrainedModels");
            await initializeAutoRegistration();
            console.log("✅ LLM-ML Module integration initialized");
          } catch (error) {
            console.warn(
              "⚠️ LLM-ML Module integration initialization failed:",
              error,
            );
          }
        } catch (error) {
          console.warn(
            "⚠️ LLM Provider Registry initialization failed:",
            error,
          );
        }

        // Initialize MSDS-SKU linking event handlers
        initializeMSDSSKULinkingEventHandlers();
        console.log("✅ MSDS-SKU linking event handlers initialized");

        // Initialize Truth Engine (server-side only)
        await initializeTruthEngine({
          tenantId: "default",
          enableRealTimeClaims: true,
          enableEcosystemIntegration: true,
        });
        console.log("✅ Truth Engine initialized");

        // Initialize WMS lifecycle event subscriptions (server-side)
        try {
          const { setupWmsEventSubscriptions } =
            await import("@/lib/services/process-lifecycle/wms/wmsLifecycleIntegration");
          setupWmsEventSubscriptions();
          console.log("✅ WMS lifecycle event subscriptions initialized");
        } catch (error) {
          console.warn(
            "⚠️ WMS event subscriptions initialization skipped:",
            error,
          );
        }

        // Initialize Performance Attribution subscriptions (server-side)
        try {
          setupPerformanceAttributionSubscriptions();
          console.log("✅ Performance attribution subscriptions initialized");
        } catch (error) {
          console.warn(
            "⚠️ Performance attribution subscriptions initialization skipped:",
            error,
          );
        }

        // Initialize Digital Signature Module (server-side only)
        try {
          const { initializeDigitalSignatureModule } =
            await import("@/lib/modules/digital-signature");
          await initializeDigitalSignatureModule("default");
          console.log("✅ Digital Signature Module initialized");
        } catch (error) {
          console.warn(
            "⚠️ Digital Signature Module initialization skipped:",
            error,
          );
        }
      }

      // Initialize push service (if VAPID key available)
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey && typeof window !== "undefined") {
        await pushService.initialize(vapidKey);
        console.log("✅ Push service initialized");
      }

      console.log("🎉 All services initialized successfully!");
    } catch (error) {
      console.error("❌ Error initializing services:", error);
      // Continue anyway - services will use fallbacks
    }
  }

  /**
   * Initialize client-side only services
   */
  async initializeClient(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      // Initialize offline service
      await offlineService.initialize();

      // Initialize i18n
      const savedLanguage = localStorage.getItem("language") || "en";
      await i18nService.initialize(savedLanguage as any);

      // Initialize push service
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey) {
        await pushService.initialize(vapidKey);
      }
    } catch (error) {
      console.error("Error initializing client services:", error);
    }
  }
}

export const serviceInitializer = new ServiceInitializer();

// Auto-initialize on server startup (non-blocking)
if (typeof window === "undefined") {
  // Use a global guard to prevent repeated initialization in dev/hot-reload
  const g = globalThis as unknown as { __bluedxpServiceInitStarted?: boolean };
  if (!g.__bluedxpServiceInitStarted) {
    g.__bluedxpServiceInitStarted = true;
    setImmediate(() => {
      serviceInitializer.initializeAll().catch((error) => {
        console.error("❌ Service initialization error (non-critical):", error);
        // Don't throw - allow server to start even if services fail
      });
    });
  }
}
