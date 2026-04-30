/**
 * Service Discovery for Microservices
 * Kubernetes DNS, service registry, and health monitoring
 */

import { microservicesCommunication } from "./communication";
import type { ServiceEndpoint } from "./communication";

export interface ServiceHealth {
  serviceId: string;
  status: "healthy" | "unhealthy" | "degraded";
  lastChecked: Date;
  responseTime: number;
  error?: string;
}

export class ServiceDiscovery {
  private healthStatus: Map<string, ServiceHealth> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Discover service
   */
  async discoverService(serviceId: string): Promise<ServiceEndpoint | null> {
    // Try Kubernetes DNS first
    const k8sEndpoint = await this.discoverKubernetesService(serviceId);
    if (k8sEndpoint) {
      return k8sEndpoint;
    }

    // Fallback to service registry
    return microservicesCommunication.discoverService(serviceId);
  }

  /**
   * Discover Kubernetes service
   */
  private async discoverKubernetesService(
    serviceId: string,
  ): Promise<ServiceEndpoint | null> {
    // Kubernetes DNS format: service-name.namespace.svc.cluster.local
    const namespace = process.env.KUBERNETES_NAMESPACE || "process-lifecycle";
    const host = `${serviceId}.${namespace}.svc.cluster.local`;
    const port = 80; // Kubernetes services use port 80

    // Try to resolve
    try {
      const healthCheck = "/health";
      const url = `http://${host}:${port}${healthCheck}`;

      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        return {
          serviceId,
          host,
          port,
          protocol: "http",
          healthCheck,
        };
      }
    } catch {
      // Service not found in Kubernetes
    }

    return null;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(interval: number = 30000): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllServices();
    }, interval);
  }

  /**
   * Check all services
   */
  private async checkAllServices(): Promise<void> {
    const services = microservicesCommunication.listServices();

    for (const service of services) {
      const startTime = Date.now();
      try {
        const healthy = await microservicesCommunication.healthCheck(
          service.serviceId,
        );
        const responseTime = Date.now() - startTime;

        this.healthStatus.set(service.serviceId, {
          serviceId: service.serviceId,
          status: healthy ? "healthy" : "unhealthy",
          lastChecked: new Date(),
          responseTime,
        });
      } catch (error) {
        this.healthStatus.set(service.serviceId, {
          serviceId: service.serviceId,
          status: "unhealthy",
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  /**
   * Get service health
   */
  getServiceHealth(serviceId: string): ServiceHealth | null {
    return this.healthStatus.get(serviceId) || null;
  }

  /**
   * Get all service health
   */
  getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Singleton instance
export const serviceDiscovery = new ServiceDiscovery();

// Start health monitoring on server
if (typeof window === "undefined") {
  serviceDiscovery.startHealthMonitoring();
}

export default serviceDiscovery;
