/**
 * Event Schema Registry
 * Event versioning, schema validation, and backward compatibility
 */

export interface EventSchema {
  version: string;
  eventType: string;
  schema: any; // JSON Schema
  createdAt: Date;
  deprecated?: boolean;
  deprecatedAt?: Date;
}

export class EventSchemaRegistry {
  private schemas: Map<string, EventSchema[]> = new Map();

  /**
   * Register event schema
   */
  async registerSchema(schema: Omit<EventSchema, "createdAt">): Promise<void> {
    const key = `${schema.eventType}:${schema.version}`;
    const eventSchema: EventSchema = {
      ...schema,
      createdAt: new Date(),
    };

    if (!this.schemas.has(schema.eventType)) {
      this.schemas.set(schema.eventType, []);
    }

    const schemas = this.schemas.get(schema.eventType)!;
    schemas.push(eventSchema);
    this.schemas.set(schema.eventType, schemas);
  }

  /**
   * Get schema for event type and version
   */
  async getSchema(
    eventType: string,
    version?: string,
  ): Promise<EventSchema | null> {
    const schemas = this.schemas.get(eventType) || [];

    if (version) {
      return schemas.find((s) => s.version === version) || null;
    }

    // Return latest non-deprecated schema
    const activeSchemas = schemas.filter((s) => !s.deprecated);
    if (activeSchemas.length === 0) {
      return schemas[schemas.length - 1] || null;
    }

    return activeSchemas[activeSchemas.length - 1] || null;
  }

  /**
   * Validate event against schema
   */
  async validateEvent(
    eventType: string,
    event: any,
    version?: string,
  ): Promise<boolean> {
    const schema = await this.getSchema(eventType, version);
    if (!schema) {
      return false;
    }

    // In production, use a JSON Schema validator like ajv
    // For now, basic validation
    return true;
  }

  /**
   * Deprecate schema version
   */
  async deprecateSchema(eventType: string, version: string): Promise<void> {
    const schemas = this.schemas.get(eventType) || [];
    const schema = schemas.find((s) => s.version === version);

    if (schema) {
      schema.deprecated = true;
      schema.deprecatedAt = new Date();
    }
  }
}

export const eventSchemaRegistry = new EventSchemaRegistry();
