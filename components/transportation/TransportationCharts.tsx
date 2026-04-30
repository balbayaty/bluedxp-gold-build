"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ModeDistributionDatum {
  mode: string;
  count: number;
  percentage: number;
}

export interface CarrierPerformanceDatum {
  carrier: string;
  shipments: number;
  onTimeRate: number;
}

export interface TransportationChartsProps {
  modeDistribution: ModeDistributionDatum[];
  carrierPerformance: CarrierPerformanceDatum[];
  colors: string[];
}

export default function TransportationCharts({
  modeDistribution,
  carrierPerformance,
  colors,
}: TransportationChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Mode Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          Transport Mode Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={modeDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              // Recharts' label callback typing is loose; keep it safe without `any`.
              label={(payload: unknown) => {
                const p = payload as { mode?: unknown; percentage?: unknown };
                const mode =
                  typeof p.mode === "string" ? p.mode : String(p.mode ?? "");
                const percentageRaw =
                  typeof p.percentage === "number"
                    ? p.percentage
                    : Number(p.percentage ?? 0);
                const percentage = Number.isFinite(percentageRaw)
                  ? percentageRaw
                  : 0;
                return `${mode}: ${percentage}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {modeDistribution.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Carrier Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Carrier Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={carrierPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="carrier" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="onTimeRate" fill="#3b82f6" name="On-Time Rate %" />
            <Bar dataKey="shipments" fill="#10b981" name="Shipments" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
