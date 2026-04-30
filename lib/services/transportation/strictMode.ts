/**
 * Transportation Strict Mode Helpers
 *
 * Target-2 Bulletproof rule:
 * - In production, we DO NOT allow simulated/mock/placeholder behavior unless explicitly enabled.
 */

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export function allowTransportSimulationsInProd(): boolean {
  return process.env.ALLOW_TRANSPORT_SIMULATIONS_IN_PROD === "true";
}

export function assertRealInProduction(
  featureId: string,
  message: string,
): void {
  if (!isProd()) return;
  if (allowTransportSimulationsInProd()) return;
  throw new Error(
    `TRANSPORTATION_STRICT_MODE: ${featureId} is not production-real yet. ${message} ` +
      `To override (NOT recommended), set ALLOW_TRANSPORT_SIMULATIONS_IN_PROD=true.`,
  );
}
