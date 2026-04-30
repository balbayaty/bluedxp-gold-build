/**
 * Feature Tooltips Types
 * Defines the structure for feature requirement tooltips
 * Used to show requirements on hover for each advanced feature
 */

export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FeatureRequirement {
  /** Unique identifier for the feature */
  id: string;
  /** Display name of the feature */
  name: string;
  /** Brief description of what the feature does */
  description: string;
  /** Priority level with color coding */
  priority: PriorityLevel;
  /** Estimated implementation time */
  estimatedTime: string;
  /** Module dependencies required */
  dependencies: string[];
  /** Services required from lib/services/ */
  requiredServices: string[];
  /** Integration points (Event Bus, RBAC, etc.) */
  integrationPoints: string[];
  /** Current implementation status */
  status: 'ready' | 'partial' | 'not-ready' | 'planned';
  /** Optional: Phase number for implementation */
  phase?: number;
  /** Optional: Sub-features or capabilities */
  capabilities?: string[];
  /** 4IR/5IR alignment tags */
  industrialAlignment?: ('4IR' | '5IR')[];
}

export interface TooltipPosition {
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface FeatureTooltipProps {
  feature: FeatureRequirement;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

export interface FeatureCardProps {
  feature: FeatureRequirement;
  onClick?: (feature: FeatureRequirement) => void;
  showTooltip?: boolean;
}

