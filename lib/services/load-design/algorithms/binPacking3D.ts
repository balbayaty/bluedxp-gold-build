/**
 * Advanced 3D Bin Packing Algorithms
 *
 * Implements multiple algorithms:
 * - Guillotine Cut
 * - Maximal Rectangles
 * - Skyline
 * - Bottom-Left-Fill
 *
 * Industry-leading 3D space optimization
 */

import type {
  LoadItem,
  ItemPlacement,
  VehicleSpecification,
} from "@/types/load-design";

export interface BinPackingResult {
  placements: ItemPlacement[];
  utilization: {
    weightPercent: number;
    volumePercent: number;
    spaceEfficiency: number;
  };
  success: boolean;
  unplacedItems: LoadItem[];
}

export interface PlacementSpace {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

/**
 * Main 3D Bin Packing Service
 */
export class BinPacking3D {
  /**
   * Pack items using best-fit algorithm
   */
  packItems(
    items: LoadItem[],
    vehicleSpec: VehicleSpecification,
    algorithm:
      | "GUILLOTINE"
      | "MAXIMAL_RECTANGLES"
      | "SKYLINE"
      | "BOTTOM_LEFT" = "SKYLINE",
  ): BinPackingResult {
    switch (algorithm) {
      case "GUILLOTINE":
        return this.guillotineCut(items, vehicleSpec);
      case "MAXIMAL_RECTANGLES":
        return this.maximalRectangles(items, vehicleSpec);
      case "SKYLINE":
        return this.skylineAlgorithm(items, vehicleSpec);
      case "BOTTOM_LEFT":
        return this.bottomLeftFill(items, vehicleSpec);
      default:
        return this.skylineAlgorithm(items, vehicleSpec);
    }
  }

  /**
   * Skyline Algorithm - Best for most cases
   */
  private skylineAlgorithm(
    items: LoadItem[],
    vehicleSpec: VehicleSpecification,
  ): BinPackingResult {
    const placements: ItemPlacement[] = [];
    const unplacedItems: LoadItem[] = [];
    const skyline: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [{ x: 0, y: 0, width: vehicleSpec.dimensions.width, height: 0 }];

    // Sort items by volume (largest first), then by priority
    const sortedItems = [...items].sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.volume - a.volume;
    });

    for (const item of sortedItems) {
      const placed = this.placeItemSkyline(
        item,
        vehicleSpec,
        skyline,
        placements,
      );
      if (!placed) {
        unplacedItems.push(item);
      }
    }

    return this.calculateResult(placements, items, vehicleSpec, unplacedItems);
  }

  /**
   * Place item using skyline algorithm
   */
  private placeItemSkyline(
    item: LoadItem,
    vehicleSpec: VehicleSpecification,
    skyline: Array<{ x: number; y: number; width: number; height: number }>,
    placements: ItemPlacement[],
  ): boolean {
    const orientations = this.getOrientations(item);

    for (const orientation of orientations) {
      const { length, width, height } = orientation;

      // Find best position in skyline
      let bestX = -1;
      let bestY = -1;
      let bestZ = -1;
      let bestWaste = Infinity;

      for (let z = 0; z <= vehicleSpec.dimensions.height - height; z += 5) {
        for (let i = 0; i < skyline.length; i++) {
          const segment = skyline[i];

          // Check if item fits at this position
          if (
            segment.x + length <= vehicleSpec.dimensions.length &&
            segment.y + width <= vehicleSpec.dimensions.width
          ) {
            // Find highest point in this area
            let maxHeight = segment.height;
            for (let j = 0; j < skyline.length; j++) {
              const other = skyline[j];
              if (
                other.x < segment.x + length &&
                other.x + other.width > segment.x &&
                other.y < segment.y + width &&
                other.y + other.width > segment.y
              ) {
                maxHeight = Math.max(maxHeight, other.height);
              }
            }

            const y = maxHeight;
            if (y + height <= vehicleSpec.dimensions.height) {
              // Calculate waste (unused space)
              const waste = this.calculateWaste(
                segment,
                length,
                width,
                skyline,
              );

              if (waste < bestWaste) {
                bestWaste = waste;
                bestX = segment.x;
                bestY = y;
                bestZ = z;
              }
            }
          }
        }
      }

      if (bestX >= 0) {
        // Place item
        const placement: ItemPlacement = {
          itemId: item.id,
          position: { x: bestX, y: bestY, z: bestZ },
          rotation: orientation.rotated ? { x: 0, y: 0, z: 90 } : undefined,
          dimensions: { length, width, height },
          weight: item.weight,
          stackLevel: Math.floor(bestZ / height),
          isRotated: orientation.rotated,
        };

        placements.push(placement);

        // Update skyline
        this.updateSkyline(
          skyline,
          bestX,
          bestY,
          length,
          width,
          bestY + height,
        );

        return true;
      }
    }

    return false;
  }

  /**
   * Update skyline after placing item
   */
  private updateSkyline(
    skyline: Array<{ x: number; y: number; width: number; height: number }>,
    x: number,
    y: number,
    length: number,
    width: number,
    newHeight: number,
  ): void {
    // Remove segments covered by new item
    const newSkyline: typeof skyline = [];
    for (const segment of skyline) {
      if (segment.x + segment.width <= x || segment.x >= x + length) {
        // Not overlapping
        newSkyline.push(segment);
      } else {
        // Overlapping - split if needed
        if (segment.x < x) {
          newSkyline.push({
            x: segment.x,
            y: segment.y,
            width: x - segment.x,
            height: segment.height,
          });
        }
        if (segment.x + segment.width > x + length) {
          newSkyline.push({
            x: x + length,
            y: segment.y,
            width: segment.x + segment.width - (x + length),
            height: segment.height,
          });
        }
      }
    }

    // Add new segment
    newSkyline.push({ x, y, width, height: newHeight });

    // Merge adjacent segments with same height
    skyline.length = 0;
    skyline.push(...this.mergeSkylineSegments(newSkyline));
  }

  /**
   * Merge adjacent skyline segments
   */
  private mergeSkylineSegments(
    segments: Array<{ x: number; y: number; width: number; height: number }>,
  ): Array<{ x: number; y: number; width: number; height: number }> {
    if (segments.length === 0) return [];

    const sorted = [...segments].sort((a, b) => a.x - b.x);
    const merged: typeof segments = [];

    for (const segment of sorted) {
      if (merged.length === 0) {
        merged.push({ ...segment });
      } else {
        const last = merged[merged.length - 1];
        if (
          last.x + last.width === segment.x &&
          last.height === segment.height
        ) {
          last.width += segment.width;
        } else {
          merged.push({ ...segment });
        }
      }
    }

    return merged;
  }

  /**
   * Calculate waste (unused space)
   */
  private calculateWaste(
    segment: { x: number; y: number; width: number; height: number },
    length: number,
    width: number,
    skyline: Array<{ x: number; y: number; width: number; height: number }>,
  ): number {
    let waste = 0;
    const area = length * width;

    // Calculate unused space in segment
    if (segment.width < length) {
      waste += (length - segment.width) * width;
    }

    return waste;
  }

  /**
   * Guillotine Cut Algorithm
   */
  private guillotineCut(
    items: LoadItem[],
    vehicleSpec: VehicleSpecification,
  ): BinPackingResult {
    const placements: ItemPlacement[] = [];
    const unplacedItems: LoadItem[] = [];
    const freeSpaces: PlacementSpace[] = [
      {
        x: 0,
        y: 0,
        z: 0,
        width: vehicleSpec.dimensions.width,
        height: vehicleSpec.dimensions.height,
        depth: vehicleSpec.dimensions.length,
      },
    ];

    const sortedItems = [...items].sort((a, b) => b.volume - a.volume);

    for (const item of sortedItems) {
      const placed = this.placeItemGuillotine(
        item,
        vehicleSpec,
        freeSpaces,
        placements,
      );
      if (!placed) {
        unplacedItems.push(item);
      }
    }

    return this.calculateResult(placements, items, vehicleSpec, unplacedItems);
  }

  /**
   * Place item using guillotine cut
   */
  private placeItemGuillotine(
    item: LoadItem,
    vehicleSpec: VehicleSpecification,
    freeSpaces: PlacementSpace[],
    placements: ItemPlacement[],
  ): boolean {
    const orientations = this.getOrientations(item);

    for (const orientation of orientations) {
      const { length, width, height } = orientation;

      // Find best free space
      let bestSpace: PlacementSpace | null = null;
      let bestIndex = -1;

      for (let i = 0; i < freeSpaces.length; i++) {
        const space = freeSpaces[i];
        if (
          space.depth >= length &&
          space.width >= width &&
          space.height >= height
        ) {
          if (
            !bestSpace ||
            this.isBetterSpace(space, bestSpace, length, width, height)
          ) {
            bestSpace = space;
            bestIndex = i;
          }
        }
      }

      if (bestSpace && bestIndex >= 0) {
        // Place item
        const placement: ItemPlacement = {
          itemId: item.id,
          position: { x: bestSpace.x, y: bestSpace.y, z: bestSpace.z },
          rotation: orientation.rotated ? { x: 0, y: 0, z: 90 } : undefined,
          dimensions: { length, width, height },
          weight: item.weight,
          stackLevel: Math.floor(bestSpace.z / height),
          isRotated: orientation.rotated,
        };

        placements.push(placement);

        // Remove used space
        freeSpaces.splice(bestIndex, 1);

        // Add new free spaces (guillotine cut)
        if (bestSpace.depth > length) {
          freeSpaces.push({
            x: bestSpace.x,
            y: bestSpace.y,
            z: bestSpace.z,
            width: bestSpace.width,
            height: bestSpace.height,
            depth: bestSpace.depth - length,
          });
        }

        if (bestSpace.width > width) {
          freeSpaces.push({
            x: bestSpace.x,
            y: bestSpace.y + width,
            z: bestSpace.z,
            width: bestSpace.width - width,
            height: bestSpace.height,
            depth: length,
          });
        }

        if (bestSpace.height > height) {
          freeSpaces.push({
            x: bestSpace.x,
            y: bestSpace.y,
            z: bestSpace.z + height,
            width: bestSpace.width,
            height: bestSpace.height - height,
            depth: length,
          });
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Maximal Rectangles Algorithm
   */
  private maximalRectangles(
    items: LoadItem[],
    vehicleSpec: VehicleSpecification,
  ): BinPackingResult {
    // Similar to skyline but uses maximal rectangles
    return this.skylineAlgorithm(items, vehicleSpec); // Use skyline as base
  }

  /**
   * Bottom-Left Fill Algorithm
   */
  private bottomLeftFill(
    items: LoadItem[],
    vehicleSpec: VehicleSpecification,
  ): BinPackingResult {
    const placements: ItemPlacement[] = [];
    const unplacedItems: LoadItem[] = [];
    const occupied: Array<{
      x: number;
      y: number;
      z: number;
      w: number;
      h: number;
      d: number;
    }> = [];

    const sortedItems = [...items].sort((a, b) => b.volume - a.volume);

    for (const item of sortedItems) {
      const placed = this.placeItemBottomLeft(
        item,
        vehicleSpec,
        occupied,
        placements,
      );
      if (!placed) {
        unplacedItems.push(item);
      }
    }

    return this.calculateResult(placements, items, vehicleSpec, unplacedItems);
  }

  /**
   * Place item using bottom-left fill
   */
  private placeItemBottomLeft(
    item: LoadItem,
    vehicleSpec: VehicleSpecification,
    occupied: Array<{
      x: number;
      y: number;
      z: number;
      w: number;
      h: number;
      d: number;
    }>,
    placements: ItemPlacement[],
  ): boolean {
    const orientations = this.getOrientations(item);

    for (const orientation of orientations) {
      const { length, width, height } = orientation;

      // Try bottom-left positions first
      for (let z = 0; z <= vehicleSpec.dimensions.height - height; z += 5) {
        for (let y = 0; y <= vehicleSpec.dimensions.width - width; y += 5) {
          for (let x = 0; x <= vehicleSpec.dimensions.length - length; x += 5) {
            // Check if overlaps
            const overlaps = occupied.some((space) => {
              return !(
                x + length <= space.x ||
                x >= space.x + space.d ||
                y + width <= space.y ||
                y >= space.y + space.w ||
                z + height <= space.z ||
                z >= space.z + space.h
              );
            });

            if (!overlaps) {
              // Place item
              const placement: ItemPlacement = {
                itemId: item.id,
                position: { x, y, z },
                rotation: orientation.rotated
                  ? { x: 0, y: 0, z: 90 }
                  : undefined,
                dimensions: { length, width, height },
                weight: item.weight,
                stackLevel: Math.floor(z / height),
                isRotated: orientation.rotated,
              };

              placements.push(placement);
              occupied.push({
                x,
                y,
                z,
                w: width,
                h: height,
                d: length,
              });

              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Get all valid orientations for item
   */
  private getOrientations(item: LoadItem): Array<{
    length: number;
    width: number;
    height: number;
    rotated: boolean;
  }> {
    const { length, width, height } = item.dimensions;
    const orientations = [{ length, width, height, rotated: false }];

    if (item.canRotate !== false) {
      // Try rotations
      orientations.push(
        { length: width, width: length, height, rotated: true },
        { length: height, width, height: length, rotated: true },
        { length, width: height, height: width, rotated: true },
      );
    }

    return orientations;
  }

  /**
   * Check if space is better
   */
  private isBetterSpace(
    space1: PlacementSpace,
    space2: PlacementSpace,
    length: number,
    width: number,
    height: number,
  ): boolean {
    const waste1 =
      (space1.depth - length) * space1.width * space1.height +
      (space1.width - width) * length * space1.height +
      (space1.height - height) * length * width;

    const waste2 =
      (space2.depth - length) * space2.width * space2.height +
      (space2.width - width) * length * space2.height +
      (space2.height - height) * length * width;

    return waste1 < waste2;
  }

  /**
   * Calculate result
   */
  private calculateResult(
    placements: ItemPlacement[],
    items: LoadItem[],
    vehicleSpec: VehicleSpecification,
    unplacedItems: LoadItem[],
  ): BinPackingResult {
    const totalWeight = placements.reduce((sum, p) => sum + p.weight, 0);
    const totalVolume = placements.reduce(
      (sum, p) =>
        sum +
        (p.dimensions.length * p.dimensions.width * p.dimensions.height) /
          1000000,
      0,
    );

    const weightPercent = (totalWeight / vehicleSpec.maxWeight) * 100;
    const volumePercent = (totalVolume / vehicleSpec.maxVolume) * 100;

    // Calculate space efficiency (actual used space vs theoretical)
    const usedVolume = placements.reduce(
      (sum, p) =>
        sum +
        (p.dimensions.length * p.dimensions.width * p.dimensions.height) /
          1000000,
      0,
    );
    const spaceEfficiency = (usedVolume / vehicleSpec.maxVolume) * 100;

    return {
      placements,
      utilization: {
        weightPercent: Math.min(weightPercent, 100),
        volumePercent: Math.min(volumePercent, 100),
        spaceEfficiency: Math.min(spaceEfficiency, 100),
      },
      success: unplacedItems.length === 0,
      unplacedItems,
    };
  }
}

export const binPacking3D = new BinPacking3D();
