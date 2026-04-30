/**
 * Kafka Client Service
 * Apache Kafka integration for high-volume event streaming
 * Falls back gracefully if kafkajs is not installed
 */

// Optional Kafka import - loaded dynamically at runtime
function loadKafka() {
  try {
    // Use dynamic require to avoid webpack bundling
    if (typeof require !== "undefined") {
      const kafkajs = require("kafkajs");
      return {
        Kafka: kafkajs.Kafka,
        KafkaConfig: kafkajs.KafkaConfig,
        logLevel: kafkajs.logLevel,
      };
    }
  } catch (e) {
    // kafkajs not installed
  }
  return null;
}

export interface KafkaClientConfig {
  brokers: string[];
  clientId: string;
  retry?: {
    retries?: number;
    initialRetryTime?: number;
    multiplier?: number;
  };
}

export class KafkaClient {
  private kafka: any = null;
  private enabled: boolean = false;

  /**
   * Initialize Kafka client
   */
  async initialize(config?: KafkaClientConfig): Promise<void> {
    const kafkaLib = loadKafka();
    if (!kafkaLib) {
      console.log("⚠️ Kafka: kafkajs not available, Kafka features disabled");
      this.enabled = false;
      return;
    }

    try {
      const brokers = config?.brokers ||
        process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"];

      const kafkaConfig: any = {
        clientId:
          config?.clientId || process.env.KAFKA_CLIENT_ID || "bluedxp-client",
        brokers,
        retry: config?.retry || {
          retries: 8,
          initialRetryTime: 100,
          multiplier: 2,
        },
        logLevel:
          process.env.NODE_ENV === "production"
            ? kafkaLib.logLevel.ERROR
            : kafkaLib.logLevel.INFO,
      };

      this.kafka = new kafkaLib.Kafka(kafkaConfig);
      this.enabled = true;
      console.log("✅ Kafka: Client initialized", { brokers });
    } catch (error) {
      console.error("❌ Error initializing Kafka:", error);
      this.enabled = false;
      throw error;
    }
  }

  /**
   * Get Kafka instance
   */
  getKafka(): any {
    if (!this.kafka) {
      throw new Error("Kafka client not initialized. Call initialize() first.");
    }
    return this.kafka;
  }

  /**
   * Check if Kafka is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.kafka !== null;
  }

  /**
   * Test Kafka connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.enabled || !this.kafka) {
      return false;
    }

    try {
      const admin = this.kafka.admin();
      await admin.connect();
      const metadata = await admin.fetchMetadata();
      await admin.disconnect();
      return true;
    } catch (error) {
      console.error("Kafka connection test failed:", error);
      return false;
    }
  }
}

export const kafkaClient = new KafkaClient();
