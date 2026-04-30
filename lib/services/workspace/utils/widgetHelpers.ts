/**
 * Widget Helper Utilities
 *
 * Common utilities for widget operations
 */

import type {
  WidgetDefinition,
  WidgetSize,
  WidgetPosition,
} from "@/types/workspace";

/**
 * Validate widget position
 */
export function validateWidgetPosition(
  position: WidgetPosition,
  defaultSize: WidgetSize,
  gridColumns: number = 12,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (position.x < 0 || position.x >= gridColumns) {
    errors.push(`X position must be between 0 and ${gridColumns - 1}`);
  }

  if (position.y < 0) {
    errors.push("Y position must be >= 0");
  }

  if (position.w < (defaultSize.minWidth || 1)) {
    errors.push(`Width must be >= ${defaultSize.minWidth || 1}`);
  }

  if (position.w > (defaultSize.maxWidth || gridColumns)) {
    errors.push(`Width must be <= ${defaultSize.maxWidth || gridColumns}`);
  }

  if (position.h < (defaultSize.minHeight || 1)) {
    errors.push(`Height must be >= ${defaultSize.minHeight || 1}`);
  }

  if (position.h > (defaultSize.maxHeight || 20)) {
    errors.push(`Height must be <= ${defaultSize.maxHeight || 20}`);
  }

  if (position.x + position.w > gridColumns) {
    errors.push(
      `Widget extends beyond grid (x: ${position.x}, w: ${position.w}, max: ${gridColumns})`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate widget grid position from pixel coordinates
 */
export function pixelToGrid(
  x: number,
  y: number,
  cellSize: number = 60,
): { x: number; y: number } {
  return {
    x: Math.round(x / cellSize),
    y: Math.round(y / cellSize),
  };
}

/**
 * Calculate pixel coordinates from grid position
 */
export function gridToPixel(
  x: number,
  y: number,
  cellSize: number = 60,
): { x: number; y: number } {
  return {
    x: x * cellSize,
    y: y * cellSize,
  };
}

/**
 * Check if widget overlaps with another widget
 */
export function widgetsOverlap(
  pos1: WidgetPosition,
  pos2: WidgetPosition,
): boolean {
  return !(
    pos1.x + pos1.w <= pos2.x ||
    pos2.x + pos2.w <= pos1.x ||
    pos1.y + pos1.h <= pos2.y ||
    pos2.y + pos2.h <= pos1.y
  );
}

/**
 * Find next available position for widget
 */
export function findNextAvailablePosition(
  existingWidgets: Array<{ position: WidgetPosition }>,
  widgetSize: WidgetSize,
  gridColumns: number = 12,
): WidgetPosition {
  let x = 0;
  let y = 0;
  const w = widgetSize.width;
  const h = widgetSize.height;

  while (true) {
    const testPosition: WidgetPosition = { x, y, w, h };

    // Check if position is valid
    if (x + w > gridColumns) {
      x = 0;
      y++;
      continue;
    }

    // Check for overlaps
    const hasOverlap = existingWidgets.some((widget) =>
      widgetsOverlap(testPosition, widget.position),
    );

    if (!hasOverlap) {
      return testPosition;
    }

    x++;
    if (x + w > gridColumns) {
      x = 0;
      y++;
    }

    // Safety limit
    if (y > 100) {
      return { x: 0, y: 0, w, h };
    }
  }
}

/**
 * Format widget size for display
 */
export function formatWidgetSize(size: WidgetSize): string {
  return `${size.width}×${size.height}`;
}

/**
 * Get widget category color
 */
export function getCategoryColor(category: { color?: string }): string {
  return category.color || "#06b6d4";
}

/**
 * Get widget icon
 */
export function getWidgetIcon(widget: { icon?: string }): string {
  return widget.icon || "ri-widget-line";
}
