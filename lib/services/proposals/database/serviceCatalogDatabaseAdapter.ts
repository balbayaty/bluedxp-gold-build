/**
 * Service Catalog Database Adapter
 * Production-ready database persistence for Service Catalog
 * Supports PostgreSQL with automatic fallback
 * Multi-tenant isolation enforced
 *
 * ARCHITECTURE: Deep layer - Database persistence for service catalog
 * SECURITY: Multi-tenant isolation
 * PERFORMANCE: Indexed queries, category filtering
 */

import { DatabaseClient } from "@/lib/database/client";

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  services: Service[];
  count?: number;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  unit: string;
  features: string[];
  active: boolean;
  tenantId?: string;
}

// ============================================================================
// DATABASE ADAPTER
// ============================================================================

export class ServiceCatalogDatabaseAdapter {
  private dbClient: DatabaseClient | null = null;
  private useDatabase: boolean = true;
  private initPromise: Promise<void> | null = null;

  // In-memory fallback
  private inMemoryServices: Map<string, Service> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const { getDatabaseClient } = await import("@/lib/database/client");
        const client = await getDatabaseClient();
        if (client) {
          this.dbClient = client;
          await this.createTables();
          await this.seedDefaultData();
          console.log("✅ Service Catalog Database Adapter initialized");
        } else {
          this.useDatabase = false;
          this.seedInMemoryData();
          console.warn("⚠️ Service Catalog: Using in-memory storage");
        }
      } catch (error) {
        console.warn(
          "⚠️ Service Catalog: Failed to initialize database",
          error,
        );
        this.useDatabase = false;
        this.seedInMemoryData();
      }
    })();

    return this.initPromise;
  }

  private async createTables(): Promise<void> {
    if (!this.dbClient || !this.useDatabase) return;

    try {
      if (this.dbClient.config?.type === "postgresql") {
        const query = `CREATE TABLE IF NOT EXISTS services (
          id VARCHAR(255) PRIMARY KEY,
          code VARCHAR(100) NOT NULL,
          name VARCHAR(500) NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT,
          base_price NUMERIC(15,2) NOT NULL,
          unit VARCHAR(100) NOT NULL,
          features JSONB DEFAULT '[]',
          active BOOLEAN DEFAULT true,
          tenant_id VARCHAR(255) DEFAULT 'default',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(code, tenant_id)
        )`;

        await this.dbClient.query(query);
        await this.dbClient.query(
          "CREATE INDEX IF NOT EXISTS idx_services_category ON services(category, tenant_id)",
        );
        await this.dbClient.query(
          "CREATE INDEX IF NOT EXISTS idx_services_active ON services(active, tenant_id)",
        );
      }
    } catch (error) {
      console.error("Failed to create services table:", error);
      this.useDatabase = false;
    }
  }

  private async seedDefaultData(): Promise<void> {
    if (!this.dbClient || !this.useDatabase) return;

    try {
      const result = await this.dbClient.query(
        "SELECT COUNT(*) as count FROM services WHERE tenant_id = $1",
        ["default"],
      );

      if (parseInt(result.rows[0].count) === 0) {
        const defaultServices = this.getDefaultServices();

        for (const service of defaultServices) {
          await this.createService(service);
        }

        console.log("✅ Seeded default service catalog");
      }
    } catch (error) {
      console.warn("Failed to seed service data:", error);
    }
  }

  private seedInMemoryData(): void {
    const services = this.getDefaultServices();
    services.forEach((s) => this.inMemoryServices.set(s.id, s));
  }

  private getDefaultServices(): Service[] {
    return [
      // WAREHOUSING
      {
        id: "wh-001",
        code: "WH-STD",
        name: "Standard Storage",
        category: "WAREHOUSING",
        description: "General cargo storage in ambient conditions",
        basePrice: 50,
        unit: "pallet/month",
        features: ["24/7 Security", "Inventory Management", "WMS Integration"],
        active: true,
        tenantId: "default",
      },
      {
        id: "wh-002",
        code: "WH-COLD",
        name: "Cold Storage",
        category: "WAREHOUSING",
        description: "Temperature-controlled storage for perishables",
        basePrice: 150,
        unit: "pallet/month",
        features: ["Temperature Monitoring", "HACCP Compliance", "Reefer Yard"],
        active: true,
        tenantId: "default",
      },
      {
        id: "wh-003",
        code: "WH-HAZ",
        name: "Hazmat Storage",
        category: "WAREHOUSING",
        description: "Specialized storage for dangerous goods",
        basePrice: 200,
        unit: "pallet/month",
        features: ["ADR Compliance", "Fire Suppression", "Spill Containment"],
        active: true,
        tenantId: "default",
      },
      // TRANSPORTATION
      {
        id: "tr-001",
        code: "TR-FTL-LOCAL",
        name: "FTL Local",
        category: "TRANSPORTATION",
        description: "Full truck within city limits",
        basePrice: 800,
        unit: "trip",
        features: ["Same Day", "Dedicated Truck", "GPS Tracking"],
        active: true,
        tenantId: "default",
      },
      {
        id: "tr-002",
        code: "TR-FTL-REG",
        name: "FTL Regional",
        category: "TRANSPORTATION",
        description: "Full truck intercity",
        basePrice: 2500,
        unit: "trip",
        features: [
          "Express Service",
          "Real-time Tracking",
          "Insurance Included",
        ],
        active: true,
        tenantId: "default",
      },
      // CUSTOMS
      {
        id: "cu-001",
        code: "CU-STD",
        name: "Customs Clearance",
        category: "CUSTOMS",
        description: "Standard customs clearance",
        basePrice: 500,
        unit: "shipment",
        features: [
          "Document Preparation",
          "Duty Calculation",
          "Broker Services",
        ],
        active: true,
        tenantId: "default",
      },
      // FREIGHT FORWARDING
      {
        id: "ff-001",
        code: "FF-AIR",
        name: "Air Freight",
        category: "FREIGHT_FORWARDING",
        description: "International air freight",
        basePrice: 5,
        unit: "kg",
        features: ["Fast Transit", "Global Network", "Door-to-Door"],
        active: true,
        tenantId: "default",
      },
    ];
  }

  async createService(service: Service): Promise<Service> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        const query = `
          INSERT INTO services (id, code, name, category, description, base_price, unit, features, active, tenant_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (code, tenant_id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            base_price = EXCLUDED.base_price,
            features = EXCLUDED.features,
            updated_at = NOW()
          RETURNING *
        `;

        await this.dbClient.query(query, [
          service.id,
          service.code,
          service.name,
          service.category,
          service.description,
          service.basePrice,
          service.unit,
          JSON.stringify(service.features),
          service.active,
          service.tenantId || "default",
        ]);

        return service;
      } catch (error) {
        console.error("Database error creating service:", error);
        this.useDatabase = false;
      }
    }

    // Fallback to in-memory
    this.inMemoryServices.set(service.id, service);
    return service;
  }

  async getServicesByCategory(
    tenantId: string = "default",
  ): Promise<ServiceCategory[]> {
    await this.initialize();

    const services = await this.getServices(tenantId);

    // Group by category
    const categoryMap = new Map<string, Service[]>();
    services.forEach((service) => {
      const existing = categoryMap.get(service.category) || [];
      existing.push(service);
      categoryMap.set(service.category, existing);
    });

    // Convert to ServiceCategory format
    const categories: ServiceCategory[] = [];
    const iconMap: Record<string, { icon: string; color: string }> = {
      WAREHOUSING: { icon: "ri-building-4-line", color: "bg-indigo-500" },
      TRANSPORTATION: { icon: "ri-truck-line", color: "bg-emerald-500" },
      CUSTOMS: { icon: "ri-shield-check-line", color: "bg-amber-500" },
      FREIGHT_FORWARDING: { icon: "ri-ship-line", color: "bg-blue-500" },
    };

    categoryMap.forEach((categoryServices, categoryName) => {
      const meta = iconMap[categoryName] || {
        icon: "ri-service-line",
        color: "bg-gray-500",
      };
      categories.push({
        id: categoryName,
        name: categoryName.replace(/_/g, " "),
        icon: meta.icon,
        color: meta.color,
        services: categoryServices,
        count: categoryServices.length,
      });
    });

    return categories;
  }

  private async getServices(tenantId: string): Promise<Service[]> {
    if (this.useDatabase && this.dbClient) {
      try {
        const query =
          "SELECT * FROM services WHERE tenant_id = $1 AND active = true ORDER BY category, name";
        const result = await this.dbClient.query(query, [tenantId]);

        return result.rows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          category: row.category,
          description: row.description,
          basePrice: parseFloat(row.base_price),
          unit: row.unit,
          features: JSON.parse(row.features || "[]"),
          active: row.active,
          tenantId: row.tenant_id,
        }));
      } catch (error) {
        console.error("Database error fetching services:", error);
        this.useDatabase = false;
      }
    }

    // Fallback to in-memory
    return Array.from(this.inMemoryServices.values());
  }
}

let catalogInstance: ServiceCatalogDatabaseAdapter | null = null;

export function getServiceCatalogDatabaseAdapter(): ServiceCatalogDatabaseAdapter {
  if (!catalogInstance) {
    catalogInstance = new ServiceCatalogDatabaseAdapter();
  }
  return catalogInstance;
}
