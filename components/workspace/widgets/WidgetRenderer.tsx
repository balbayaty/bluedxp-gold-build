/**
 * Widget Renderer - Advanced Widget Rendering System
 *
 * Fully functional widget renderer with:
 * - Real chart rendering (Recharts)
 * - Table rendering
 * - Metric cards
 * - Error boundaries
 * - Loading states
 * - Auto-refresh
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { UserWidget, WorkspaceConfig } from "@/types/workspace";

interface WidgetRendererProps {
  widget: UserWidget;
  config: WorkspaceConfig;
  onLoad: () => void;
  onError: (error: string) => void;
}

export function WidgetRenderer({
  widget,
  config,
  onLoad,
  onError,
}: WidgetRendererProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadWidgetData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/v1/workspace/widgets/${widget.widgetDefId}/data?config=${encodeURIComponent(JSON.stringify(widget.config || {}))}`,
        {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to load widget data: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data || result);
      setLastUpdate(new Date());
      setLoading(false);
      onLoad();
    } catch (err: any) {
      const errorMessage =
        err.name === "AbortError"
          ? "Request timed out"
          : err instanceof Error
            ? err.message
            : "Unknown error";

      setError(errorMessage);
      setLoading(false);
      onError(errorMessage);

      // In development, provide mock data
      if (process.env.NODE_ENV === "development") {
        setData(generateMockData(widget));
        setLoading(false);
        onLoad();
      }
    }
  }, [widget.widgetDefId, widget.config, onLoad, onError]);

  useEffect(() => {
    loadWidgetData();

    // Set up refresh interval if configured
    if (widget.refreshInterval && widget.refreshInterval > 0) {
      const interval = setInterval(loadWidgetData, widget.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.id, widget.refreshInterval, loadWidgetData]);

  const widgetDef = widget.widgetDef;
  if (!widgetDef) {
    return (
      <div className="h-full flex items-center justify-center text-[#9ca3af]">
        <p className="text-sm">Widget definition not found</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-xs text-[#9ca3af]">Loading...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <i className="ri-error-warning-line text-2xl text-red-400 mb-2"></i>
        <p className="text-sm text-red-400 text-center">{error}</p>
        <button
          onClick={loadWidgetData}
          className="mt-2 px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-white rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render based on widget type
  switch (widgetDef.type) {
    case "METRIC_CARD":
    case "KPI_CARD":
      return (
        <MetricCardWidget
          data={data}
          config={widget.config}
          widgetDef={widgetDef}
        />
      );

    case "LINE_CHART":
      return (
        <LineChartWidget
          data={data}
          config={widget.config}
          widgetDef={widgetDef}
        />
      );

    case "BAR_CHART":
      return (
        <BarChartWidget
          data={data}
          config={widget.config}
          widgetDef={widgetDef}
        />
      );

    case "PIE_CHART":
      return (
        <PieChartWidget
          data={data}
          config={widget.config}
          widgetDef={widgetDef}
        />
      );

    case "AREA_CHART":
      return (
        <AreaChartWidget
          data={data}
          config={widget.config}
          widgetDef={widgetDef}
        />
      );

    case "TABLE":
      return (
        <TableWidget data={data} config={widget.config} widgetDef={widgetDef} />
      );

    case "PROGRESS_CARD":
      return (
        <ProgressCardWidget
          data={data}
          config={widget.config}
          widgetDef={widgetDef}
        />
      );

    default:
      return (
        <GenericWidget
          data={data}
          config={widget.config}
          widgetDef={widgetDef}
        />
      );
  }
}

// Generate mock data for development
function generateMockData(widget: UserWidget): any {
  const type = widget.widgetDef?.type;

  switch (type) {
    case "METRIC_CARD":
    case "KPI_CARD":
      return { value: Math.floor(Math.random() * 10000) };

    case "LINE_CHART":
    case "BAR_CHART":
    case "AREA_CHART":
      return {
        type: type.toLowerCase().replace("_chart", ""),
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Data",
            data: Array.from({ length: 7 }, () =>
              Math.floor(Math.random() * 100),
            ),
            borderColor: "#06b6d4",
            backgroundColor: "#06b6d4",
          },
        ],
      };

    case "PIE_CHART":
      return [
        { name: "Category A", value: 30 },
        { name: "Category B", value: 25 },
        { name: "Category C", value: 20 },
        { name: "Category D", value: 25 },
      ];

    case "TABLE":
      return {
        columns: ["Name", "Value", "Status"],
        rows: Array.from({ length: 5 }, (_, i) => ({
          name: `Item ${i + 1}`,
          value: Math.floor(Math.random() * 100),
          status: ["Active", "Pending", "Completed"][
            Math.floor(Math.random() * 3)
          ],
        })),
      };

    default:
      return { value: "Mock Data" };
  }
}

// Widget Type Components
function MetricCardWidget({ data, config, widgetDef }: any) {
  const value = data?.value ?? data ?? "—";
  const title = config?.title || widgetDef?.name || "Metric";
  const trend = data?.trend;
  const trendValue = data?.trendValue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col justify-center p-4"
    >
      <div className="text-center">
        <div className="text-3xl font-bold text-white mb-1">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-sm text-[#9ca3af] mb-2">{title}</div>
        {trend && trendValue && (
          <div
            className={`flex items-center justify-center gap-1 text-xs ${
              trend === "up"
                ? "text-green-400"
                : trend === "down"
                  ? "text-red-400"
                  : "text-[#9ca3af]"
            }`}
          >
            <i className={`ri-arrow-${trend}-line`}></i>
            <span>{Math.abs(trendValue)}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LineChartWidget({ data, config, widgetDef }: any) {
  const chartData =
    data?.datasets?.[0]?.data?.map((val: number, idx: number) => ({
      name: data?.labels?.[idx] || `Point ${idx + 1}`,
      value: val,
    })) || [];

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[#9ca3af] text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#ffffff",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: "#06b6d4", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarChartWidget({ data, config, widgetDef }: any) {
  const chartData =
    data?.datasets?.[0]?.data?.map((val: number, idx: number) => ({
      name: data?.labels?.[idx] || `Item ${idx + 1}`,
      value: val,
    })) || [];

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[#9ca3af] text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#ffffff",
            }}
          />
          <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartWidget({ data, config, widgetDef }: any) {
  const chartData = Array.isArray(data) ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[#9ca3af] text-sm">
        No data
      </div>
    );
  }

  const COLORS = [
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
  ];

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#ffffff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function AreaChartWidget({ data, config, widgetDef }: any) {
  const chartData =
    data?.datasets?.[0]?.data?.map((val: number, idx: number) => ({
      name: data?.labels?.[idx] || `Point ${idx + 1}`,
      value: val,
    })) || [];

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[#9ca3af] text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#ffffff",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TableWidget({ data, config, widgetDef }: any) {
  const columns = data?.columns || [];
  const rows = data?.rows || data || [];

  if (rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[#9ca3af] text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((col: string, idx: number) => (
              <th
                key={idx}
                className="text-left p-2 text-[#9ca3af] font-semibold"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
              {columns.map((col: string, colIdx: number) => (
                <td key={colIdx} className="p-2 text-white">
                  {row[col] ?? row[colIdx] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressCardWidget({ data, config, widgetDef }: any) {
  const value = data?.value ?? data ?? 0;
  const max = data?.max ?? 100;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const label = config?.title || widgetDef?.name || "Progress";

  return (
    <div className="h-full flex flex-col justify-center p-4">
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-[#9ca3af]">{label}</span>
          <span className="text-sm font-semibold text-white">
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
          />
        </div>
      </div>
      <div className="text-center text-2xl font-bold text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
        {data?.max && (
          <span className="text-sm text-[#9ca3af]">
            {" "}
            / {data.max.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

function GenericWidget({ data, config, widgetDef }: any) {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="text-center">
        <i
          className={`${widgetDef?.icon || "ri-widget-line"} text-4xl text-cyan-400 mb-2`}
        ></i>
        <p className="text-sm text-[#9ca3af]">{widgetDef?.name || "Widget"}</p>
        {data && (
          <pre className="text-xs text-[#6b7280] mt-2 max-h-32 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
