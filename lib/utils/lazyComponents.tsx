/**
 * Lazy Loading Utilities for Heavy Components
 *
 * This module provides pre-configured dynamic imports for heavy libraries
 * to improve initial page load performance.
 */

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Loading placeholders
const ChartLoading = () => (
  <div className="h-64 bg-gray-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-400 text-sm">Loading chart...</div>
  </div>
)

const ThreeLoading = () => (
  <div className="h-64 bg-gray-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-400 text-sm">Loading 3D scene...</div>
  </div>
)

// Recharts components - lazy loaded
export const LazyLineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), {
  ssr: false,
  loading: ChartLoading,
})

export const LazyBarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), {
  ssr: false,
  loading: ChartLoading,
})

export const LazyPieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), {
  ssr: false,
  loading: ChartLoading,
})

export const LazyAreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), {
  ssr: false,
  loading: ChartLoading,
})

export const LazyRadarChart = dynamic(() => import('recharts').then(mod => mod.RadarChart), {
  ssr: false,
  loading: ChartLoading,
})

// Recharts components (non-chart)
export const LazyLine = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false })
export const LazyBar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
export const LazyArea = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false })
export const LazyPie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false })
export const LazyCell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false })
export const LazyXAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
export const LazyYAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
export const LazyCartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
export const LazyTooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
export const LazyLegend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })
export const LazyResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
export const LazyRadar = dynamic(() => import('recharts').then(mod => mod.Radar), { ssr: false })
export const LazyPolarGrid = dynamic(() => import('recharts').then(mod => mod.PolarGrid), { ssr: false })
export const LazyPolarAngleAxis = dynamic(() => import('recharts').then(mod => mod.PolarAngleAxis), { ssr: false })
export const LazyPolarRadiusAxis = dynamic(() => import('recharts').then(mod => mod.PolarRadiusAxis), { ssr: false })

export const LazyComposedChart = dynamic(() => import('recharts').then(mod => mod.ComposedChart), {
  ssr: false,
  loading: ChartLoading,
})

// Framer Motion - lazy loaded
export const LazyMotion = dynamic(() => import('framer-motion').then(mod => mod.motion), { ssr: false })
export const LazyAnimatePresence = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })),
  { ssr: false }
)

// Three.js components - lazy loaded
export const LazyCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), {
  ssr: false,
  loading: ThreeLoading,
})

// BPMN Viewer - lazy loaded
export const LazyBPMNViewer = dynamic(() => import('bpmn-js/lib/Viewer').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-800/50 rounded-lg animate-pulse" />,
})

// Chart.js - lazy loaded
export const LazyChart = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: ChartLoading,
})

// D3 - lazy loaded (only load when needed)
export const LazyD3 = dynamic(() => import('d3').then(mod => mod), { ssr: false })

// Tesseract.js - lazy loaded (OCR)
export const LazyTesseract = dynamic(() => import('tesseract.js').then(mod => mod), { ssr: false })

// React Flow - lazy loaded
export const LazyReactFlow = dynamic(() => import('reactflow').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-800/50 rounded-lg animate-pulse" />,
})

// Helper to create custom lazy components
export function createLazyComponent<T = unknown>(
  importFn: () => Promise<T>,
  options?: {
    loading?: ComponentType
    ssr?: boolean
  }
) {
  return dynamic(importFn as never, {
    ssr: options?.ssr ?? false,
    loading: options?.loading ?? (() => <div className="animate-pulse bg-gray-800/50 h-32 rounded" />),
  })
}




