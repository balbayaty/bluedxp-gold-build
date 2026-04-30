/**
 * Event Handlers for MSDS-SKU Linking
 * Automatically handles events from MSDS approval and SKU creation
 */

import { eventBus } from "@/lib/services/event-store";
import { msdsSkuLinkingService } from "./msdsSkuLinkingService";
import { dataReuseService } from "./dataReuseService";
import { customerApprovalService } from "./customerApprovalService";
import { msdsService } from "@/lib/services/chemical/msdsService";
import { skuService } from "@/lib/services/wms/skuService";

/**
 * Initialize event handlers
 * Call this during application startup
 */
export function initializeMSDSSKULinkingEventHandlers() {
  // Handle MSDS approval - trigger matching suggestions
  eventBus.subscribe("msds.approved", async (event: any) => {
    try {
      const { msdsId, customerId } = event;

      if (msdsId && customerId) {
        // Get MSDS
        const msds = await msdsService.getMSDSById(msdsId);
        if (!msds) return;

        // Get customer SKUs
        const skus = await skuService.getSKUsByCustomer(customerId);
        if (skus.length === 0) return;

        // Find matches
        const matches = await msdsSkuLinkingService.findMatchesForMSDS(
          msds,
          customerId,
          skus,
        );

        // If high-confidence matches found, create pending links
        for (const match of matches.matches) {
          if (match.confidenceScore >= 85) {
            await msdsSkuLinkingService.createLink(
              match.msdsId,
              match.skuId,
              customerId,
              {
                matchingStrategy: match.strategy,
                confidenceScore: match.confidenceScore,
                matchingEvidence: match.evidence,
                status: "PENDING",
                linkedBy: "system",
              },
            );
          }
        }
      }
    } catch (error) {
      console.error("Error handling MSDS approval event:", error);
    }
  });

  // Handle link approval - trigger data reuse
  eventBus.subscribe("msds-sku.link.approved", async (event: any) => {
    try {
      const { linkId, msdsId, skuId } = event;

      // Get link
      const link = await msdsSkuLinkingService.getLink(linkId);
      if (!link) return;

      // Get MSDS and SKU
      const msds = await msdsService.getMSDSById(msdsId);
      const sku = await skuService.getSKU(skuId);

      if (!msds || !sku) return;

      // Reuse data automatically
      await dataReuseService.reuseMSDSDataForSKU(link, msds, sku, {
        reusePackaging: true,
        reusePalletConfiguration: true,
        reuseStorageRequirements: true,
        reuseComplianceData: true,
        reuseTransportationData: true,
        reuseBy: "system",
      });
    } catch (error) {
      console.error("Error handling link approval event:", error);
    }
  });

  // Handle SKU creation - check for matching MSDS
  eventBus.subscribe("sku.created", async (event: any) => {
    try {
      const { skuId, customerId } = event;

      if (!skuId || !customerId) return;

      // Get SKU
      const sku = await skuService.getSKU(skuId);
      if (!sku) return;

      // Get approved MSDS for customer
      const msdsList = await msdsService.getMSDSDocuments({
        status: "approved",
      });

      // Find potential matches
      for (const msds of msdsList) {
        if (msds.customerId === customerId) {
          const matches = await msdsSkuLinkingService.findMatchesForMSDS(
            msds,
            customerId,
            [sku],
          );

          // Create suggestions for high-confidence matches
          for (const match of matches.matches) {
            if (match.confidenceScore >= 80) {
              await msdsSkuLinkingService.createLink(
                match.msdsId,
                match.skuId,
                customerId,
                {
                  matchingStrategy: match.strategy,
                  confidenceScore: match.confidenceScore,
                  matchingEvidence: match.evidence,
                  status: "PENDING",
                  linkedBy: "system",
                  notes: "Auto-suggested based on SKU creation",
                },
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error handling SKU creation event:", error);
    }
  });
}
