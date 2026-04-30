/**
 * Kafka Producer Service
 * Publish events to Kafka topics
 * Falls back gracefully if kafkajs is not installed
 */

// Optional Kafka import
import type {
  Producer as KafkaProducerType,
  RecordMetadata as KafkaRecordMetadata,
} from "kafkajs";
import { kafkaClient } from "./kafkaClient";

export interface ProducerMessage {
  topic: string;
  messages: Array<{
    key?: string;
    value: string | object;
    headers?: Record<string, string>;
    partition?: number;
    timestamp?: string;
  }>;
}

export class KafkaProducer {
  private producer: KafkaProducerType | null = null;
  private enabled: boolean = false;

  /**
   * Initialize Kafka producer
   */
  async initialize(): Promise<void> {
    try {
      if (!kafkaClient.isEnabled()) {
        await kafkaClient.initialize();
      }

      const kafka = kafkaClient.getKafka();
      this.producer = kafka.producer({
        allowAutoTopicCreation: true,
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
      }) as KafkaProducerType;

      if (!this.producer) {
        throw new Error("Failed to create Kafka producer");
      }

      await this.producer.connect();
      this.enabled = true;
      console.log("✅ Kafka Producer: Connected");
    } catch (error) {
      console.error("❌ Error initializing Kafka producer:", error);
      this.enabled = false;
      throw error;
    }
  }

  /**
   * Send message to Kafka topic
   */
  async send(message: ProducerMessage): Promise<KafkaRecordMetadata[]> {
    if (!this.enabled || !this.producer) {
      throw new Error("Kafka producer not initialized");
    }

    try {
      // Serialize object values to JSON
      const messages = message.messages.map((msg) => ({
        ...msg,
        value:
          typeof msg.value === "object" ? JSON.stringify(msg.value) : msg.value,
      }));

      const result = await this.producer.send({
        topic: message.topic,
        messages,
      });

      return result;
    } catch (error) {
      console.error("Error sending Kafka message:", error);
      throw error;
    }
  }

  /**
   * Send single message
   */
  async sendMessage(
    topic: string,
    value: string | object,
    key?: string,
    headers?: Record<string, string>,
  ): Promise<KafkaRecordMetadata[]> {
    return this.send({
      topic,
      messages: [{ key, value, headers }],
    });
  }

  /**
   * Send batch of messages
   */
  async sendBatch(
    topic: string,
    messages: Array<{
      key?: string;
      value: string | object;
      headers?: Record<string, string>;
    }>,
  ): Promise<KafkaRecordMetadata[]> {
    return this.send({
      topic,
      messages,
    });
  }

  /**
   * Disconnect producer
   */
  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
      this.enabled = false;
      console.log("✅ Kafka Producer: Disconnected");
    }
  }

  /**
   * Check if producer is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.producer !== null;
  }
}

export const kafkaProducer = new KafkaProducer();
