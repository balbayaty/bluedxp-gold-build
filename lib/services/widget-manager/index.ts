/**
 * Widget Management System
 *
 * Manages all floating widgets (job monitor, copilot, etc.) to prevent overlaps
 * and provide the best UX experience
 */

export interface Widget {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  defaultPosition: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  zIndex: number;
  priority: "high" | "medium" | "low";
  draggable: boolean;
  resizable: boolean;
  collapsible: boolean;
  dockable: boolean;
}

export interface WidgetPosition {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  collapsed?: boolean;
  docked?: boolean;
  dockedEdge?: "top" | "bottom" | "left" | "right";
  zIndex: number;
}

class WidgetManager {
  private widgets: Map<string, Widget> = new Map();
  private positions: Map<string, WidgetPosition> = new Map();
  private dockPositions: {
    top: string[];
    bottom: string[];
    left: string[];
    right: string[];
  } = {
    top: [],
    bottom: [],
    left: [],
    right: [],
  };
  private readonly GRID_SIZE = 10; // Snap to grid
  private readonly MIN_DISTANCE = 20; // Minimum distance between widgets
  private readonly SAFE_ZONES = {
    top: 80, // Header height
    bottom: 100, // Footer/action area
    left: 320, // Sidebar width
    right: 20, // Margin
  };

  /**
   * Register a widget
   */
  registerWidget(widget: Widget): void {
    this.widgets.set(widget.id, widget);

    // Initialize position
    if (!this.positions.has(widget.id)) {
      this.positions.set(widget.id, {
        id: widget.id,
        x: widget.defaultPosition.x,
        y: widget.defaultPosition.y,
        width: widget.defaultSize?.width,
        height: widget.defaultSize?.height,
        zIndex: widget.zIndex,
        collapsed: false,
        docked: false,
      });
    }
  }

  /**
   * Get widget position
   */
  getPosition(widgetId: string): WidgetPosition | null {
    return this.positions.get(widgetId) || null;
  }

  /**
   * Update widget position with collision detection
   */
  updatePosition(
    widgetId: string,
    position: Partial<WidgetPosition>,
    avoidCollisions: boolean = true,
  ): WidgetPosition {
    const current = this.positions.get(widgetId);
    if (!current) throw new Error(`Widget ${widgetId} not found`);

    const widget = this.widgets.get(widgetId);
    if (!widget) throw new Error(`Widget ${widgetId} not registered`);

    // Snap to grid
    const snappedX =
      Math.round((position.x ?? current.x) / this.GRID_SIZE) * this.GRID_SIZE;
    const snappedY =
      Math.round((position.y ?? current.y) / this.GRID_SIZE) * this.GRID_SIZE;

    // Ensure within safe zones
    const safeX = Math.max(
      this.SAFE_ZONES.left,
      Math.min(
        snappedX,
        window.innerWidth -
          (position.width ?? current.width ?? 400) -
          this.SAFE_ZONES.right,
      ),
    );
    const safeY = Math.max(
      this.SAFE_ZONES.top,
      Math.min(
        snappedY,
        window.innerHeight -
          (position.height ?? current.height ?? 300) -
          this.SAFE_ZONES.bottom,
      ),
    );

    const newPosition: WidgetPosition = {
      ...current,
      ...position,
      x: safeX,
      y: safeY,
    };

    // Collision detection and resolution
    if (avoidCollisions) {
      const resolved = this.resolveCollisions(widgetId, newPosition);
      this.positions.set(widgetId, resolved);
      return resolved;
    }

    this.positions.set(widgetId, newPosition);
    return newPosition;
  }

  /**
   * Resolve collisions with other widgets
   */
  private resolveCollisions(
    widgetId: string,
    position: WidgetPosition,
  ): WidgetPosition {
    const widget = this.widgets.get(widgetId)!;
    const widgetRect = {
      x: position.x,
      y: position.y,
      width: position.width ?? widget.defaultSize?.width ?? 400,
      height: position.height ?? widget.defaultSize?.height ?? 300,
    };

    let resolvedX = position.x;
    let resolvedY = position.y;

    // Check collisions with all other widgets
    for (const [otherId, otherPosition] of this.positions.entries()) {
      if (
        otherId === widgetId ||
        otherPosition.docked ||
        otherPosition.collapsed
      )
        continue;

      const otherWidget = this.widgets.get(otherId)!;
      const otherRect = {
        x: otherPosition.x,
        y: otherPosition.y,
        width: otherPosition.width ?? otherWidget.defaultSize?.width ?? 400,
        height: otherPosition.height ?? otherWidget.defaultSize?.height ?? 300,
      };

      // Check if widgets overlap
      if (this.isOverlapping(widgetRect, otherRect)) {
        // Resolve collision based on priority
        if (widget.priority === "high" && otherWidget.priority !== "high") {
          // Push other widget away
          this.pushWidgetAway(otherId, widgetRect, otherRect);
        } else if (
          widget.priority === "low" &&
          otherWidget.priority !== "low"
        ) {
          // Move this widget away
          const pushDirection = this.getPushDirection(widgetRect, otherRect);
          resolvedX += pushDirection.x * this.MIN_DISTANCE;
          resolvedY += pushDirection.y * this.MIN_DISTANCE;
        } else {
          // Equal priority - push both away
          const pushDirection = this.getPushDirection(widgetRect, otherRect);
          resolvedX += pushDirection.x * (this.MIN_DISTANCE / 2);
          resolvedY += pushDirection.y * (this.MIN_DISTANCE / 2);
          this.pushWidgetAway(otherId, widgetRect, otherRect);
        }
      }
    }

    return { ...position, x: resolvedX, y: resolvedY };
  }

  /**
   * Check if two rectangles overlap
   */
  private isOverlapping(rect1: any, rect2: any): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }

  /**
   * Get direction to push widget away
   */
  private getPushDirection(rect1: any, rect2: any): { x: number; y: number } {
    const center1 = {
      x: rect1.x + rect1.width / 2,
      y: rect1.y + rect1.height / 2,
    };
    const center2 = {
      x: rect2.x + rect2.width / 2,
      y: rect2.y + rect2.height / 2,
    };

    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { x: 1, y: 0 };

    return { x: dx / distance, y: dy / distance };
  }

  /**
   * Push a widget away from collision
   */
  private pushWidgetAway(
    widgetId: string,
    fromRect: any,
    widgetRect: any,
  ): void {
    const direction = this.getPushDirection(fromRect, widgetRect);
    const current = this.positions.get(widgetId)!;

    const newX = widgetRect.x + direction.x * this.MIN_DISTANCE;
    const newY = widgetRect.y + direction.y * this.MIN_DISTANCE;

    this.updatePosition(widgetId, { x: newX, y: newY }, false);
  }

  /**
   * Find best position for new widget (smart positioning)
   */
  findBestPosition(
    width: number,
    height: number,
    priority: "high" | "medium" | "low" = "medium",
  ): { x: number; y: number } {
    // Try corners first (best UX)
    const corners = [
      {
        x: window.innerWidth - width - this.SAFE_ZONES.right,
        y: this.SAFE_ZONES.top,
      }, // Top-right
      {
        x: window.innerWidth - width - this.SAFE_ZONES.right,
        y: window.innerHeight - height - this.SAFE_ZONES.bottom,
      }, // Bottom-right
      {
        x: this.SAFE_ZONES.left,
        y: window.innerHeight - height - this.SAFE_ZONES.bottom,
      }, // Bottom-left
      { x: this.SAFE_ZONES.left, y: this.SAFE_ZONES.top }, // Top-left
    ];

    for (const corner of corners) {
      const testRect = { ...corner, width, height };
      let hasCollision = false;

      for (const [, otherPosition] of this.positions.entries()) {
        if (otherPosition.docked || otherPosition.collapsed) continue;

        const otherWidget = this.widgets.get(otherPosition.id)!;
        const otherRect = {
          x: otherPosition.x,
          y: otherPosition.y,
          width: otherPosition.width ?? otherWidget.defaultSize?.width ?? 400,
          height:
            otherPosition.height ?? otherWidget.defaultSize?.height ?? 300,
        };

        if (this.isOverlapping(testRect, otherRect)) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        return corner;
      }
    }

    // If corners are taken, find empty space
    return this.findEmptySpace(width, height);
  }

  /**
   * Find empty space for widget
   */
  private findEmptySpace(
    width: number,
    height: number,
  ): { x: number; y: number } {
    const step = 50;
    for (
      let y = this.SAFE_ZONES.top;
      y < window.innerHeight - height - this.SAFE_ZONES.bottom;
      y += step
    ) {
      for (
        let x = this.SAFE_ZONES.left;
        x < window.innerWidth - width - this.SAFE_ZONES.right;
        x += step
      ) {
        const testRect = { x, y, width, height };
        let hasCollision = false;

        for (const [, otherPosition] of this.positions.entries()) {
          if (otherPosition.docked || otherPosition.collapsed) continue;

          const otherWidget = this.widgets.get(otherPosition.id)!;
          const otherRect = {
            x: otherPosition.x,
            y: otherPosition.y,
            width: otherPosition.width ?? otherWidget.defaultSize?.width ?? 400,
            height:
              otherPosition.height ?? otherWidget.defaultSize?.height ?? 300,
          };

          if (this.isOverlapping(testRect, otherRect)) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          return { x, y };
        }
      }
    }

    // Fallback: stack vertically on right side
    return {
      x: window.innerWidth - width - this.SAFE_ZONES.right,
      y: this.SAFE_ZONES.top + this.positions.size * 50,
    };
  }

  /**
   * Dock widget to edge
   */
  dockWidget(
    widgetId: string,
    edge: "top" | "bottom" | "left" | "right",
  ): void {
    const position = this.positions.get(widgetId);
    if (!position) return;

    position.docked = true;
    position.dockedEdge = edge;

    // Remove from other docks
    Object.values(this.dockPositions).forEach((dock) => {
      const index = dock.indexOf(widgetId);
      if (index > -1) dock.splice(index, 1);
    });

    // Add to new dock
    this.dockPositions[edge].push(widgetId);

    // Position widget at edge
    const widget = this.widgets.get(widgetId)!;
    const width = position.width ?? widget.defaultSize?.width ?? 400;
    const height = position.height ?? widget.defaultSize?.height ?? 300;

    switch (edge) {
      case "top":
        position.x = this.SAFE_ZONES.left;
        position.y = this.SAFE_ZONES.top;
        position.width =
          window.innerWidth - this.SAFE_ZONES.left - this.SAFE_ZONES.right;
        break;
      case "bottom":
        position.x = this.SAFE_ZONES.left;
        position.y = window.innerHeight - height - this.SAFE_ZONES.bottom;
        position.width =
          window.innerWidth - this.SAFE_ZONES.left - this.SAFE_ZONES.right;
        break;
      case "left":
        position.x = this.SAFE_ZONES.left;
        position.y = this.SAFE_ZONES.top;
        position.height =
          window.innerHeight - this.SAFE_ZONES.top - this.SAFE_ZONES.bottom;
        break;
      case "right":
        position.x = window.innerWidth - width - this.SAFE_ZONES.right;
        position.y = this.SAFE_ZONES.top;
        position.height =
          window.innerHeight - this.SAFE_ZONES.top - this.SAFE_ZONES.bottom;
        break;
    }

    this.positions.set(widgetId, position);
  }

  /**
   * Undock widget
   */
  undockWidget(widgetId: string): void {
    const position = this.positions.get(widgetId);
    if (!position) return;

    position.docked = false;
    delete position.dockedEdge;

    // Remove from docks
    Object.values(this.dockPositions).forEach((dock) => {
      const index = dock.indexOf(widgetId);
      if (index > -1) dock.splice(index, 1);
    });

    // Restore original size
    const widget = this.widgets.get(widgetId)!;
    position.width = widget.defaultSize?.width;
    position.height = widget.defaultSize?.height;

    this.positions.set(widgetId, position);
  }

  /**
   * Collapse widget
   */
  collapseWidget(widgetId: string): void {
    const position = this.positions.get(widgetId);
    if (!position) return;
    position.collapsed = true;
    this.positions.set(widgetId, position);
  }

  /**
   * Expand widget
   */
  expandWidget(widgetId: string): void {
    const position = this.positions.get(widgetId);
    if (!position) return;
    position.collapsed = false;
    this.positions.set(widgetId, position);
  }

  /**
   * Bring widget to front
   */
  bringToFront(widgetId: string): void {
    const maxZ = Math.max(
      ...Array.from(this.positions.values()).map((p) => p.zIndex),
    );
    const position = this.positions.get(widgetId);
    if (position) {
      position.zIndex = maxZ + 1;
      this.positions.set(widgetId, position);
    }
  }

  /**
   * Get all widget positions
   */
  getAllPositions(): Map<string, WidgetPosition> {
    return new Map(this.positions);
  }

  /**
   * Save positions to localStorage
   */
  savePositions(): void {
    const data = Array.from(this.positions.entries()).map(([id, pos]) => ({
      id,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      collapsed: pos.collapsed,
      docked: pos.docked,
      dockedEdge: pos.dockedEdge,
    }));
    localStorage.setItem("widget-positions", JSON.stringify(data));
  }

  /**
   * Load positions from localStorage
   */
  loadPositions(): void {
    const saved = localStorage.getItem("widget-positions");
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      for (const item of data) {
        const position = this.positions.get(item.id);
        if (position) {
          this.positions.set(item.id, { ...position, ...item });
        }
      }
    } catch (error) {
      console.error("Failed to load widget positions:", error);
    }
  }
}

// Singleton instance
export const widgetManager = new WidgetManager();

// Load saved positions on init
if (typeof window !== "undefined") {
  widgetManager.loadPositions();

  // Save positions periodically
  setInterval(() => {
    widgetManager.savePositions();
  }, 5000);
}
