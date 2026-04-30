/**
 * ETW Integration Service
 *
 * Handles cross-module integration:
 * - Shipment linking (TMS)
 * - Invoice linking (Finance)
 * - POD linking (TMS)
 * - MSDS linking (Hazalyze)
 * - Permit linking (Compliance)
 * - Exception linking (CAPA/NCR)
 */

import { etwService } from "./etwService";
import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

export interface ETWIntegrationService {
  linkToShipment(
    etwId: string,
    shipmentId: string,
    tenantId: string,
  ): Promise<void>;
  linkToInvoice(
    etwId: string,
    invoiceId: string,
    tenantId: string,
  ): Promise<void>;
  linkToMSDS(etwId: string, msdsId: string, tenantId: string): Promise<void>;
  linkToPermit(
    etwId: string,
    permitId: string,
    tenantId: string,
  ): Promise<void>;
  linkToException(
    etwId: string,
    exceptionId: string,
    tenantId: string,
  ): Promise<void>;
}

class ETWIntegrationServiceImpl implements ETWIntegrationService {
  async linkToShipment(
    etwId: string,
    shipmentId: string,
    tenantId: string,
  ): Promise<void> {
    await etwService.linkToShipment(etwId, shipmentId, tenantId);

    // Publish event for TMS module
    await eventBus.publish({
      type: "etw.shipment.linked",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: etwId,
      aggregateType: "ETW",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        etwId,
        shipmentId,
      },
      metadata: {
        tenantId,
      },
    } as DomainEvent);
  }

  async linkToInvoice(
    etwId: string,
    invoiceId: string,
    tenantId: string,
  ): Promise<void> {
    await etwService.linkToInvoice(etwId, invoiceId, tenantId);

    // Publish event for Finance module
    await eventBus.publish({
      type: "etw.invoice.linked",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: etwId,
      aggregateType: "ETW",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        etwId,
        invoiceId,
      },
      metadata: {
        tenantId,
      },
    } as DomainEvent);
  }

  async linkToMSDS(
    etwId: string,
    msdsId: string,
    tenantId: string,
  ): Promise<void> {
    // Update ETW compliance with MSDS reference
    const etw = await etwService.get(etwId, tenantId);
    if (!etw) {
      throw new Error(`ETW not found: ${etwId}`);
    }

    await etwService.update(
      etwId,
      {
        compliance: {
          ...etw.compliance,
          msdsId,
          msdsReference: msdsId,
        },
      },
      "system",
    );

    // Publish event for MSDS module
    await eventBus.publish({
      type: "etw.msds.linked",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: etwId,
      aggregateType: "ETW",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        etwId,
        msdsId,
      },
      metadata: {
        tenantId,
      },
    } as DomainEvent);
  }

  async linkToPermit(
    etwId: string,
    permitId: string,
    tenantId: string,
  ): Promise<void> {
    // Permits are managed through permit service
    // This is a convenience method to link existing permits

    // Publish event for Compliance module
    await eventBus.publish({
      type: "etw.permit.linked",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: etwId,
      aggregateType: "ETW",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        etwId,
        permitId,
      },
      metadata: {
        tenantId,
      },
    } as DomainEvent);
  }

  async linkToException(
    etwId: string,
    exceptionId: string,
    tenantId: string,
  ): Promise<void> {
    const etw = await etwService.get(etwId, tenantId);
    if (!etw) {
      throw new Error(`ETW not found: ${etwId}`);
    }

    const exceptionIds = etw.exceptionIds || [];
    if (!exceptionIds.includes(exceptionId)) {
      exceptionIds.push(exceptionId);
      await etwService.update(
        etwId,
        {
          exceptionIds,
        },
        "system",
      );
    }

    // Publish event for CAPA/NCR module
    await eventBus.publish({
      type: "etw.exception.linked",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: etwId,
      aggregateType: "ETW",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        etwId,
        exceptionId,
      },
      metadata: {
        tenantId,
      },
    } as DomainEvent);
  }
}

export const etwIntegrationService: ETWIntegrationService =
  new ETWIntegrationServiceImpl();
