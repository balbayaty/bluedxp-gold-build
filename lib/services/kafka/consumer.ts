/**
 * Kafka Consumer Service
 * Consume events from Kafka topics
 * Falls back gracefully if kafkajs is not installed
 */

// Optional Kafka import
import type {
  Consumer as KafkaConsumerType,
  EachMessagePayload as KafkaEachMessagePayload,
} from "kafkajs";
import { kafkaClient } from "./kafkaClient";

export interface ConsumerConfig {
  groupId: string;
  topics: string[];
  fromBeginning?: boolean;
  sessionTimeout?: number;
  heartbeatInterval?: number;
}

export type MessageHandler = (
  payload: KafkaEachMessagePayload,
) => Promise<void>;

export class KafkaConsumer {
  private consumer: KafkaConsumerType | null = null;
  private enabled: boolean = false;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private running: boolean = false;

  /**
   * Initialize Kafka consumer
   */
  async initialize(config: ConsumerConfig): Promise<void> {
    try {
      if (!kafkaClient.isEnabled()) {
        await kafkaClient.initialize();
      }

      const kafka = kafkaClient.getKafka();
      this.consumer = kafka.consumer({
        groupId: config.groupId,
        sessionTimeout: config.sessionTimeout || 30000,
        heartbeatInterval: config.heartbeatInterval || 3000,
        allowAutoTopicCreation: true,
      }) as KafkaConsumerType;

      if (!this.consumer) {
        throw new Error("Failed to create Kafka consumer");
      }

      await this.consumer.connect();

      // Subscribe to topics
      for (const topic of config.topics) {
        await this.consumer.subscribe({
          topic,
          fromBeginning: config.fromBeginning || false,
        });
      }

      this.enabled = true;
      console.log("✅ Kafka Consumer: Connected", {
        groupId: config.groupId,
        topics: config.topics,
      });
    } catch (error) {
      console.error("❌ Error initializing Kafka consumer:", error);
      this.enabled = false;
      throw error;
    }
  }

  /**
   * Register message handler for a topic
   */
  on(topic: string, handler: MessageHandler): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push(handler);
  }

  /**
   * Start consuming messages
   */
  async start(): Promise<void> {
    if (!this.enabled || !this.consumer) {
      throw new Error("Kafka consumer not initialized");
    }

    if (this.running) {
      console.warn("⚠️ Kafka Consumer: Already running");
      return;
    }

    try {
      await this.consumer.run({
        eachMessage: async (payload: KafkaEachMessagePayload) => {
          const topic = payload.topic;
          const handlers = this.handlers.get(topic) || [];

          if (handlers.length === 0) {
            console.warn(`⚠️ No handler registered for topic: ${topic}`);
            return;
          }

          // Execute all handlers for this topic
          for (const handler of handlers) {
            try {
              await handler(payload);
            } catch (error) {
              console.error(
                `❌ Error in Kafka message handler for topic ${topic}:`,
                error,
              );
              // Continue processing other handlers
            }
          }
        },
      });

      this.running = true;
      console.log("✅ Kafka Consumer: Started consuming");
    } catch (error) {
      console.error("❌ Error starting Kafka consumer:", error);
      throw error;
    }
  }

  /**
   * Stop consuming messages
   */
  async stop(): Promise<void> {
    if (this.consumer && this.running) {
      await this.consumer.stop();
      this.running = false;
      console.log("✅ Kafka Consumer: Stopped");
    }
  }

  /**
   * Disconnect consumer
   */
  async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.stop();
      await this.consumer.disconnect();
      this.consumer = null;
      this.enabled = false;
      this.handlers.clear();
      console.log("✅ Kafka Consumer: Disconnected");
    }
  }

  /**
   * Check if consumer is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.consumer !== null;
  }

  /**
   * Check if consumer is running
   */
  isRunning(): boolean {
    return this.running;
  }
}

export const kafkaConsumer = new KafkaConsumer();
