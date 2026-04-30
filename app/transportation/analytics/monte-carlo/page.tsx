/**
 * Monte Carlo Simulation Page
 *
 * Probabilistic analysis of journey time optimization
 * 10,000 iteration Monte Carlo simulation
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { MonteCarloSimulation } from "@/components/analytics";

export default function MonteCarloPage() {
  return (
    <PageTemplate
      title="Monte Carlo Simulation"
      description="Probabilistic analysis of journey time optimization with 10,000 iteration Monte Carlo simulation"
      icon="ri-bar-chart-box-line"
    >
      <MonteCarloSimulation />
    </PageTemplate>
  );
}
