/**
 * ICT Hardware Ecosystem Dashboard
 * Strategic positioning: Saudi Arabia's first localized digital manufacturing node
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiCpuLine,
  RiDeviceLine,
  RiBuildingLine,
  RiUserHeartLine,
} from "react-icons/ri";

interface Vision2030Metrics {
  localContent: {
    target: number;
    actual: number;
    products: number;
  };
  manufacturing: {
    totalProducts: number;
    activePipelines: number;
    completedOrders: number;
  };
  partnerships: {
    total: number;
    active: number;
    government: number;
    industrial: number;
  };
}

export default function ICTHardwareEcosystemPage() {
  const [metrics, setMetrics] = useState<Vision2030Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const response = await fetch("/api/ict-hardware-ecosystem/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ICT Hardware Ecosystem</h1>
          <p className="text-gray-400">
            Saudi Arabia's first localized digital manufacturing node linking
            injection molding to ICT hardware ecosystems
          </p>
        </div>

        {/* Vision 2030 Alignment */}
        <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-400/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <RiCpuLine className="text-green-400 text-3xl" />
            <div>
              <h2 className="text-2xl font-bold">Vision 2030 Alignment</h2>
              <p className="text-gray-300">
                Localized digital manufacturing for ICT hardware components
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">
                Local Content Target
              </div>
              <div className="text-2xl font-bold text-green-400">
                {metrics?.localContent.target || 30}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">
                Current Achievement
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {metrics?.localContent.actual || 0}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">
                Products in Catalog
              </div>
              <div className="text-2xl font-bold">
                {metrics?.localContent.products || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <a
            href="/ict-hardware-ecosystem/products"
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <RiDeviceLine className="text-cyan-400 text-2xl" />
              <h3 className="text-lg font-semibold">Products</h3>
            </div>
            <div className="text-3xl font-bold">
              {metrics?.manufacturing.totalProducts || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              ICT product catalog
            </div>
          </a>

          <a
            href="/ict-hardware-ecosystem/manufacturing"
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <RiBuildingLine className="text-green-400 text-2xl" />
              <h3 className="text-lg font-semibold">Active Pipelines</h3>
            </div>
            <div className="text-3xl font-bold">
              {metrics?.manufacturing.activePipelines || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Manufacturing in progress
            </div>
          </a>

          <a
            href="/ict-hardware-ecosystem/partnerships"
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <RiUserHeartLine className="text-purple-400 text-2xl" />
              <h3 className="text-lg font-semibold">Partnerships</h3>
            </div>
            <div className="text-3xl font-bold">
              {metrics?.partnerships.active || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Active strategic partnerships
            </div>
          </a>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RiCpuLine className="text-yellow-400 text-2xl" />
              <h3 className="text-lg font-semibold">Completed Orders</h3>
            </div>
            <div className="text-3xl font-bold">
              {metrics?.manufacturing.completedOrders || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Successfully delivered
            </div>
          </div>
        </div>

        {/* Strategic Value Proposition */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            Strategic Value Proposition
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-400">
                Government Support
              </h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>✅ Vision 2030 alignment</li>
                <li>✅ Local content incentives</li>
                <li>✅ Industrial development grants</li>
                <li>✅ Technology transfer programs</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-cyan-400">
                Market Opportunities
              </h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>✅ ICT hardware casings & enclosures</li>
                <li>✅ Protective systems</li>
                <li>✅ 30-40% of ICT hardware imports addressable</li>
                <li>✅ Low-to-mid CAPEX, fast tooling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
