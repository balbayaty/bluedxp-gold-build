export type CapabilityMaturity = 'real' | 'simulated' | 'placeholder' | 'config_required'

export type CapabilityAutoCondition =
  | { kind: 'env_set'; key: string }
  | { kind: 'env_true'; key: string }
  | { kind: 'env_json_array_nonempty'; key: string }

/**
 * Automatic maturity upgrade rules.
 *
 * Safety rule:
 * - We only allow upgrades from CONFIG_REQUIRED -> REAL automatically.
 * - SIMULATED/PLACEHOLDER must be fixed in code (cannot “auto become real”).
 */
export interface CapabilityAutoUpgrade {
  upgradeTo: 'real'
  /**
   * OR-of-AND groups:
   * - anyOfAll = [ [A,B], [C] ] means (A AND B) OR (C)
   */
  anyOfAll: CapabilityAutoCondition[][]
  /** Optional note shown in tooltips */
  note?: string
}

export interface CapabilityStatus {
  /** Stable identifier for the capability/page/feature */
  id: string
  /** Human-friendly name shown to non-technical users */
  label: string
  /** How “real” it is right now */
  maturity: CapabilityMaturity
  /** Short explanation shown in tooltip */
  reason: string
  /** Optional: how to make it real */
  howToFix?: string
  /**
   * Optional: auto-upgrade CONFIG_REQUIRED -> REAL when server-verified conditions are met.
   * The UI will show the resolved maturity once it fetches the server status.
   */
  autoUpgrade?: CapabilityAutoUpgrade
}


