/**
 * Customs Service
 *
 * Handles customs-related operations including declarations, brokers, and authorities
 */

import type { CustomsInfo, CustomsBroker, CustomsDocument } from "@/types/tms";

export class CustomsService {
  /**
   * Get customs information for a shipment
   */
  async getCustomsInfo(shipmentId: string): Promise<CustomsInfo | null> {
    try {
      const response = await fetch(
        `/api/transportation/customs/shipments/${shipmentId}`,
      );
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error("Error fetching customs info:", error);
      return null;
    }
  }

  /**
   * Submit customs declaration
   */
  async submitDeclaration(
    declaration: Partial<CustomsInfo>,
  ): Promise<CustomsInfo> {
    const response = await fetch("/api/transportation/customs/declarations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(declaration),
    });
    if (!response.ok) throw new Error("Failed to submit declaration");
    return response.json();
  }

  /**
   * Get all customs brokers
   */
  async getBrokers(): Promise<CustomsBroker[]> {
    const response = await fetch("/api/transportation/customs/brokers");
    if (!response.ok) return [];
    return response.json();
  }

  /**
   * Assign broker to shipment
   */
  async assignBroker(shipmentId: string, brokerId: string): Promise<void> {
    const response = await fetch(
      `/api/transportation/customs/shipments/${shipmentId}/broker`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokerId }),
      },
    );
    if (!response.ok) throw new Error("Failed to assign broker");
  }

  /**
   * Get customs documents for a shipment
   */
  async getDocuments(shipmentId: string): Promise<CustomsDocument[]> {
    const response = await fetch(
      `/api/transportation/customs/shipments/${shipmentId}/documents`,
    );
    if (!response.ok) return [];
    return response.json();
  }

  /**
   * Upload customs document
   */
  async uploadDocument(
    shipmentId: string,
    document: File,
  ): Promise<CustomsDocument> {
    const formData = new FormData();
    formData.append("file", document);

    const response = await fetch(
      `/api/transportation/customs/shipments/${shipmentId}/documents`,
      {
        method: "POST",
        body: formData,
      },
    );
    if (!response.ok) throw new Error("Failed to upload document");
    return response.json();
  }
}

export const customsService = new CustomsService();
