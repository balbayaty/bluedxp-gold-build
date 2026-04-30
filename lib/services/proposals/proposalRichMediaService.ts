/**
 * Proposal Rich Media Service
 * Support for videos, 3D models, interactive charts, and rich media content
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface RichMediaAsset {
  id: string;
  proposalId: string;
  sectionId?: string;
  type:
    | "VIDEO"
    | "IMAGE"
    | "3D_MODEL"
    | "INTERACTIVE_CHART"
    | "AUDIO"
    | "DOCUMENT";
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  metadata: {
    duration?: number; // seconds for video/audio
    width?: number;
    height?: number;
    fileSize?: number; // bytes
    format?: string;
    embedCode?: string;
    interactive?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    controls?: boolean;
  };
  position: {
    section: string;
    order: number;
    alignment: "LEFT" | "CENTER" | "RIGHT" | "FULL_WIDTH";
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InteractiveChart {
  id: string;
  type: "LINE" | "BAR" | "PIE" | "AREA" | "SCATTER" | "HEATMAP";
  data: any[];
  config: {
    title?: string;
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    interactive?: boolean;
    animation?: boolean;
  };
}

// ============================================================================
// RICH MEDIA SERVICE
// ============================================================================

class ProposalRichMediaService {
  private assets: Map<string, RichMediaAsset[]> = new Map(); // proposalId -> assets

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    eventBus.subscribe(
      "proposals.proposal.created",
      async (event: DomainEvent) => {
        // Handle proposal creation
      },
    );

    eventBus.subscribe(
      "proposals.proposal.deleted",
      async (event: DomainEvent) => {
        const { proposalId } = event.payload || {};
        if (proposalId) {
          this.assets.delete(proposalId);
        }
      },
    );
  }

  /**
   * Add rich media asset to proposal
   */
  async addAsset(
    asset: Omit<RichMediaAsset, "id" | "createdAt" | "updatedAt">,
  ): Promise<RichMediaAsset> {
    const newAsset: RichMediaAsset = {
      ...asset,
      id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.assets.has(asset.proposalId)) {
      this.assets.set(asset.proposalId, []);
    }
    this.assets.get(asset.proposalId)!.push(newAsset);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.rich-media.added",
      aggregateId: asset.proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId: asset.proposalId, assetId: newAsset.id },
    });

    return newAsset;
  }

  /**
   * Get assets for proposal
   */
  getAssets(proposalId: string, sectionId?: string): RichMediaAsset[] {
    const assets = this.assets.get(proposalId) || [];
    if (sectionId) {
      return assets.filter((a) => a.sectionId === sectionId);
    }
    return assets;
  }

  /**
   * Remove asset
   */
  async removeAsset(proposalId: string, assetId: string): Promise<boolean> {
    const assets = this.assets.get(proposalId);
    if (!assets) return false;

    const index = assets.findIndex((a) => a.id === assetId);
    if (index === -1) return false;

    assets.splice(index, 1);
    this.assets.set(proposalId, assets);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.rich-media.removed",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, assetId },
    });

    return true;
  }

  /**
   * Generate embed code for asset
   */
  generateEmbedCode(asset: RichMediaAsset): string {
    switch (asset.type) {
      case "VIDEO":
        return `<video 
          src="${asset.url}" 
          ${asset.metadata.controls !== false ? "controls" : ""}
          ${asset.metadata.autoplay ? "autoplay" : ""}
          ${asset.metadata.loop ? "loop" : ""}
          width="${asset.metadata.width || 640}"
          height="${asset.metadata.height || 360}"
        ></video>`;

      case "3D_MODEL":
        return `<model-viewer 
          src="${asset.url}" 
          alt="${asset.title}"
          auto-rotate
          camera-controls
          style="width: 100%; height: 400px;"
        ></model-viewer>`;

      case "INTERACTIVE_CHART":
        return asset.metadata.embedCode || `<div id="chart-${asset.id}"></div>`;

      default:
        return `<img src="${asset.url}" alt="${asset.title}" />`;
    }
  }

  /**
   * Validate asset
   */
  validateAsset(asset: Partial<RichMediaAsset>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!asset.proposalId) errors.push("Proposal ID is required");
    if (!asset.type) errors.push("Asset type is required");
    if (!asset.url) errors.push("URL is required");
    if (!asset.title) errors.push("Title is required");

    // Type-specific validation
    if (asset.type === "VIDEO" && !asset.metadata?.duration) {
      errors.push("Video duration is recommended");
    }

    if (
      asset.type === "3D_MODEL" &&
      !asset.url.endsWith(".glb") &&
      !asset.url.endsWith(".gltf")
    ) {
      errors.push("3D model must be in GLB or GLTF format");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalRichMediaService = new ProposalRichMediaService();
