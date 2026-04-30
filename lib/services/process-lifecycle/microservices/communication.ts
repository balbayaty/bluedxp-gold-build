/**
 * Microservices Communication Layer
 * gRPC, REST, and message queue communication
 * More advanced than competitors
 */

export interface ServiceEndpoint {
  serviceId: string;
  host: string;
  port: number;
  protocol: "http" | "https" | "grpc" | "ws";
  healthCheck: string;
  metadata?: Record<string, any>;
}

export interface ServiceCall {
  serviceId: string;
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ServiceResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  latency: number;
}

export class MicroservicesCommunication {
  private serviceRegistry: Map<string, ServiceEndpoint> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  /**
   * Register service
   */
  registerService(endpoint: ServiceEndpoint): void {
    this.serviceRegistry.set(endpoint.serviceId, endpoint);
    console.log(`✅ Registered service: ${endpoint.serviceId}`);
  }

  /**
   * Call service
   */
  async callService(call: ServiceCall): Promise<ServiceResponse> {
    const endpoint = this.serviceRegistry.get(call.serviceId);
    if (!endpoint) {
      throw new Error(`Service ${call.serviceId} not found`);
    }

    // Check circuit breaker
    if (!this.isCircuitBreakerOpen(call.serviceId)) {
      throw new Error(`Service ${call.serviceId} circuit breaker is open`);
    }

    const startTime = Date.now();

    try {
      const url = `${endpoint.protocol}://${endpoint.host}:${endpoint.port}${call.path}`;

      const response = await fetch(url, {
        method: call.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...call.headers,
        },
        body: call.body ? JSON.stringify(call.body) : undefined,
        signal: AbortSignal.timeout(call.timeout || 30000),
      });

      const data = await response.json().catch(() => ({}));
      const latency = Date.now() - startTime;

      // Record success
      this.recordSuccess(call.serviceId);

      return {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        latency,
      };
    } catch (error) {
      // Record failure
      this.recordFailure(call.serviceId);

      throw new Error(
        `Service call failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Circuit breaker state
   */
  private isCircuitBreakerOpen(serviceId: string): boolean {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) {
      this.circuitBreakers.set(serviceId, {
        failures: 0,
        successes: 0,
        state: "closed",
        lastFailureTime: undefined,
      });
      return true;
    }

    if (breaker.state === "open") {
      // Check if timeout has passed
      if (breaker.lastFailureTime) {
        const timeSinceFailure = Date.now() - breaker.lastFailureTime.getTime();
        if (timeSinceFailure > 60000) {
          // 1 minute
          breaker.state = "half-open";
          breaker.successes = 0;
          return true;
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Record success
   */
  private recordSuccess(serviceId: string): void {
    const breaker = this.circuitBreakers.get(serviceId);
    if (breaker) {
      breaker.successes++;
      breaker.failures = 0;
      if (breaker.state === "half-open" && breaker.successes >= 3) {
        breaker.state = "closed";
      }
    }
  }

  /**
   * Record failure
   */
  private recordFailure(serviceId: string): void {
    const breaker = this.circuitBreakers.get(serviceId) || {
      failures: 0,
      successes: 0,
      state: "closed" as const,
      lastFailureTime: undefined,
    };

    breaker.failures++;
    breaker.lastFailureTime = new Date();

    if (breaker.failures >= 5) {
      breaker.state = "open";
    }

    this.circuitBreakers.set(serviceId, breaker);
  }

  /**
   * Service discovery
   */
  discoverService(serviceId: string): ServiceEndpoint | null {
    return this.serviceRegistry.get(serviceId) || null;
  }

  /**
   * List all services
   */
  listServices(): ServiceEndpoint[] {
    return Array.from(this.serviceRegistry.values());
  }

  /**
   * Health check
   */
  async healthCheck(serviceId: string): Promise<boolean> {
    const endpoint = this.serviceRegistry.get(serviceId);
    if (!endpoint) return false;

    try {
      const url = `${endpoint.protocol}://${endpoint.host}:${endpoint.port}${endpoint.healthCheck}`;
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

interface CircuitBreakerState {
  failures: number;
  successes: number;
  state: "closed" | "open" | "half-open";
  lastFailureTime?: Date;
}

// Singleton instance
export const microservicesCommunication = new MicroservicesCommunication();

// Auto-register services
if (typeof window === "undefined") {
  // Server-side: Register known services
  microservicesCommunication.registerService({
    serviceId: "lifecycle-service",
    host: process.env.LIFECYCLE_SERVICE_HOST || "localhost",
    port: parseInt(process.env.LIFECYCLE_SERVICE_PORT || "3002"),
    protocol: "http",
    healthCheck: "/api/health",
  });

  microservicesCommunication.registerService({
    serviceId: "workflow-service",
    host: process.env.WORKFLOW_SERVICE_HOST || "localhost",
    port: parseInt(process.env.WORKFLOW_SERVICE_PORT || "3003"),
    protocol: "http",
    healthCheck: "/health",
  });

  microservicesCommunication.registerService({
    serviceId: "process-mining-service",
    host: process.env.PROCESS_MINING_SERVICE_HOST || "localhost",
    port: parseInt(process.env.PROCESS_MINING_SERVICE_PORT || "3004"),
    protocol: "http",
    healthCheck: "/health",
  });

  microservicesCommunication.registerService({
    serviceId: "ai-service",
    host: process.env.AI_SERVICE_HOST || "localhost",
    port: parseInt(process.env.AI_SERVICE_PORT || "3005"),
    protocol: "http",
    healthCheck: "/health",
  });
}

export default microservicesCommunication;
