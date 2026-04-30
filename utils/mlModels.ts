/**
 * ML Model Integration Utilities
 * 
 * Provides utilities for:
 * - Time-series forecasting
 * - Anomaly detection
 * - Classification
 * - Regression
 * - Pattern recognition
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TimeSeriesDataPoint {
  timestamp: Date | string | number
  value: number
}

export interface ForecastResult {
  predictions: Array<{ timestamp: Date; value: number; confidence: number }>
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
  seasonality?: {
    period: number
    strength: number
  }
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean
  score: number
  threshold: number
  reason?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ClassificationResult {
  category: string
  confidence: number
  probabilities: Record<string, number>
}

export interface RegressionResult {
  predictedValue: number
  confidence: number
  range: { min: number; max: number }
}

// ============================================================================
// TIME-SERIES FORECASTING
// ============================================================================

/**
 * Simple Moving Average (SMA) Forecast
 */
export function forecastSMA(
  data: TimeSeriesDataPoint[],
  periods: number = 7
): ForecastResult {
  if (data.length < 2) {
    throw new Error('Insufficient data for forecasting')
  }

  // Calculate moving average
  const windowSize = Math.min(periods, Math.floor(data.length / 2))
  const recentValues = data.slice(-windowSize).map(d => d.value)
  const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const firstAvg = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length
  const trend = secondAvg > firstAvg * 1.05 ? 'increasing' : 
                secondAvg < firstAvg * 0.95 ? 'decreasing' : 'stable'

  // Generate predictions
  const predictions = Array.from({ length: periods }, (_, i) => ({
    timestamp: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
    value: avg * (1 + (trend === 'increasing' ? 0.02 : trend === 'decreasing' ? -0.02 : 0) * (i + 1)),
    confidence: Math.max(0.5, 1 - (i * 0.1)),
  }))

  return {
    predictions,
    trend,
    confidence: 0.7,
  }
}

/**
 * Exponential Smoothing Forecast
 */
export function forecastExponentialSmoothing(
  data: TimeSeriesDataPoint[],
  alpha: number = 0.3,
  periods: number = 7
): ForecastResult {
  if (data.length < 2) {
    throw new Error('Insufficient data for forecasting')
  }

  // Calculate exponential smoothing
  let smoothed = data[0].value
  const values = data.map(d => d.value)

  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed
  }

  // Generate predictions
  const predictions = Array.from({ length: periods }, (_, i) => ({
    timestamp: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
    value: smoothed,
    confidence: Math.max(0.6, 1 - (i * 0.08)),
  }))

  // Calculate trend
  const recent = values.slice(-7)
  const trend = recent[recent.length - 1] > recent[0] ? 'increasing' :
                recent[recent.length - 1] < recent[0] ? 'decreasing' : 'stable'

  return {
    predictions,
    trend,
    confidence: 0.75,
  }
}

/**
 * Linear Regression Forecast
 */
export function forecastLinearRegression(
  data: TimeSeriesDataPoint[],
  periods: number = 7
): ForecastResult {
  if (data.length < 3) {
    throw new Error('Insufficient data for linear regression')
  }

  const n = data.length
  const timestamps = data.map((d, i) => i)
  const values = data.map(d => d.value)

  // Calculate linear regression
  const sumX = timestamps.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0)
  const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate predictions
  const predictions = Array.from({ length: periods }, (_, i) => {
    const x = n + i
    const value = slope * x + intercept
    return {
      timestamp: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      value: Math.max(0, value), // Ensure non-negative
      confidence: Math.max(0.65, 1 - (i * 0.05)),
    }
  })

  return {
    predictions,
    trend: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
    confidence: 0.8,
  }
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Z-Score Anomaly Detection
 */
export function detectAnomalyZScore(
  value: number,
  historicalData: number[],
  threshold: number = 3
): AnomalyDetectionResult {
  if (historicalData.length < 3) {
    return {
      isAnomaly: false,
      score: 0,
      threshold,
      severity: 'low',
    }
  }

  // Calculate mean and standard deviation
  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length
  const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) {
    return {
      isAnomaly: value !== mean,
      score: value !== mean ? 1 : 0,
      threshold,
      severity: value !== mean ? 'high' : 'low',
      reason: value !== mean ? 'Value differs from constant historical data' : undefined,
    }
  }

  // Calculate Z-score
  const zScore = Math.abs((value - mean) / stdDev)
  const isAnomaly = zScore > threshold

  // Determine severity
  let severity: AnomalyDetectionResult['severity'] = 'low'
  if (zScore > threshold * 2) severity = 'critical'
  else if (zScore > threshold * 1.5) severity = 'high'
  else if (zScore > threshold) severity = 'medium'

  return {
    isAnomaly,
    score: zScore,
    threshold,
    severity,
    reason: isAnomaly ? `Z-score of ${zScore.toFixed(2)} exceeds threshold of ${threshold}` : undefined,
  }
}

/**
 * Interquartile Range (IQR) Anomaly Detection
 */
export function detectAnomalyIQR(
  value: number,
  historicalData: number[]
): AnomalyDetectionResult {
  if (historicalData.length < 4) {
    return {
      isAnomaly: false,
      score: 0,
      threshold: 1.5,
      severity: 'low',
    }
  }

  // Sort data
  const sorted = [...historicalData].sort((a, b) => a - b)
  const q1Index = Math.floor(sorted.length * 0.25)
  const q3Index = Math.floor(sorted.length * 0.75)
  const q1 = sorted[q1Index]
  const q3 = sorted[q3Index]
  const iqr = q3 - q1

  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  const isAnomaly = value < lowerBound || value > upperBound

  // Calculate severity
  let severity: AnomalyDetectionResult['severity'] = 'low'
  const distance = isAnomaly 
    ? Math.min(Math.abs(value - lowerBound), Math.abs(value - upperBound))
    : 0
  
  if (distance > iqr * 2) severity = 'critical'
  else if (distance > iqr) severity = 'high'
  else if (isAnomaly) severity = 'medium'

  return {
    isAnomaly,
    score: isAnomaly ? distance / iqr : 0,
    threshold: 1.5,
    severity,
    reason: isAnomaly 
      ? `Value ${value} is outside IQR range [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`
      : undefined,
  }
}

// ============================================================================
// CLASSIFICATION
// ============================================================================

/**
 * Simple Classification based on thresholds
 */
export function classifyByThresholds(
  value: number,
  thresholds: Record<string, { min: number; max: number }>
): ClassificationResult {
  const probabilities: Record<string, number> = {}
  
  // Calculate probability for each category
  for (const [category, range] of Object.entries(thresholds)) {
    if (value >= range.min && value <= range.max) {
      probabilities[category] = 1.0
    } else {
      // Calculate distance-based probability
      const distance = Math.min(
        Math.abs(value - range.min),
        Math.abs(value - range.max)
      )
      const rangeSize = range.max - range.min
      probabilities[category] = Math.max(0, 1 - (distance / rangeSize))
    }
  }

  // Normalize probabilities
  const total = Object.values(probabilities).reduce((a, b) => a + b, 0)
  if (total > 0) {
    for (const key in probabilities) {
      probabilities[key] /= total
    }
  }

  // Find best category
  const bestCategory = Object.entries(probabilities).reduce((a, b) => 
    probabilities[a[0]] > probabilities[b[0]] ? a : b
  )[0]

  return {
    category: bestCategory,
    confidence: probabilities[bestCategory],
    probabilities,
  }
}

/**
 * ABC Classification (Pareto Analysis)
 */
export function classifyABC(
  items: Array<{ id: string; value: number }>
): Array<{ id: string; category: 'A' | 'B' | 'C'; cumulativePercentage: number }> {
  // Sort by value descending
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const totalValue = sorted.reduce((sum, item) => sum + item.value, 0)

  let cumulativeValue = 0
  return sorted.map((item) => {
    cumulativeValue += item.value
    const cumulativePercentage = (cumulativeValue / totalValue) * 100

    let category: 'A' | 'B' | 'C'
    if (cumulativePercentage <= 80) {
      category = 'A'
    } else if (cumulativePercentage <= 95) {
      category = 'B'
    } else {
      category = 'C'
    }

    return {
      id: item.id,
      category,
      cumulativePercentage,
    }
  })
}

// ============================================================================
// REGRESSION
// ============================================================================

/**
 * Simple Linear Regression
 */
export function predictLinearRegression(
  x: number,
  dataPoints: Array<{ x: number; y: number }>
): RegressionResult {
  if (dataPoints.length < 2) {
    throw new Error('Insufficient data for regression')
  }

  const n = dataPoints.length
  const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0)
  const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0)
  const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumXX = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const predictedValue = slope * x + intercept

  // Calculate confidence based on R-squared approximation
  const yMean = sumY / n
  const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0)
  const ssResidual = dataPoints.reduce((sum, p) => {
    const predicted = slope * p.x + intercept
    return sum + Math.pow(p.y - predicted, 2)
  }, 0)
  const rSquared = 1 - (ssResidual / ssTotal)
  const confidence = Math.max(0.5, Math.min(0.95, rSquared))

  // Calculate prediction interval (simplified)
  const stdError = Math.sqrt(ssResidual / (n - 2))
  const margin = stdError * 1.96 // 95% confidence interval

  return {
    predictedValue,
    confidence,
    range: {
      min: predictedValue - margin,
      max: predictedValue + margin,
    },
  }
}

// ============================================================================
// PATTERN RECOGNITION
// ============================================================================

/**
 * Detect patterns in time series data
 */
export function detectPatterns(
  data: TimeSeriesDataPoint[],
  minPatternLength: number = 3
): Array<{
  pattern: string
  startIndex: number
  endIndex: number
  strength: number
}> {
  if (data.length < minPatternLength * 2) {
    return []
  }

  const patterns: Array<{
    pattern: string
    startIndex: number
    endIndex: number
    strength: number
  }> = []

  const values = data.map(d => d.value)
  
  // Detect trends
  let trendStart = 0
  let currentTrend: 'increasing' | 'decreasing' | 'stable' | null = null

  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    let newTrend: typeof currentTrend = null

    if (diff > 0.01) newTrend = 'increasing'
    else if (diff < -0.01) newTrend = 'decreasing'
    else newTrend = 'stable'

    if (newTrend !== currentTrend && currentTrend !== null) {
      // Pattern ended
      if (i - trendStart >= minPatternLength) {
        patterns.push({
          pattern: currentTrend,
          startIndex: trendStart,
          endIndex: i - 1,
          strength: Math.abs(values[i - 1] - values[trendStart]) / values[trendStart],
        })
      }
      trendStart = i - 1
    }

    currentTrend = newTrend
  }

  // Add final pattern
  if (values.length - trendStart >= minPatternLength && currentTrend) {
    patterns.push({
      pattern: currentTrend,
      startIndex: trendStart,
      endIndex: values.length - 1,
      strength: Math.abs(values[values.length - 1] - values[trendStart]) / values[trendStart],
    })
  }

  return patterns
}

// ============================================================================
// EXPORTS
// ============================================================================

export const MLModels = {
  // Forecasting
  forecastSMA,
  forecastExponentialSmoothing,
  forecastLinearRegression,
  
  // Anomaly Detection
  detectAnomalyZScore,
  detectAnomalyIQR,
  
  // Classification
  classifyByThresholds,
  classifyABC,
  
  // Regression
  predictLinearRegression,
  
  // Pattern Recognition
  detectPatterns,
}

export default MLModels


