/**
 * AI-Powered Orchestration Utilities
 * 
 * Integrates ML models and AI processing into intelligent orchestration modules
 */

import { callAI, isAIAvailable } from './aiClient'
import { MLModels, ForecastResult, AnomalyDetectionResult, ClassificationResult } from './mlModels'
import { ProcessPrediction, PredictiveInsight } from '@/types/intelligentOrchestration'

/**
 * Enhanced prediction using ML models + AI
 */
export async function enhancedPredict(
  caseId: string,
  predictionType: ProcessPrediction['predictionType'],
  historicalData: Array<{ timestamp: Date; value: number }>
): Promise<ProcessPrediction> {
  // Use ML model for forecasting
  let forecast: ForecastResult
  try {
    if (historicalData.length >= 7) {
      forecast = MLModels.forecastLinearRegression(historicalData, 7)
    } else if (historicalData.length >= 3) {
      forecast = MLModels.forecastExponentialSmoothing(historicalData, 0.3, 7)
    } else {
      forecast = MLModels.forecastSMA(historicalData, 7)
    }
  } catch (error) {
    // Fallback to simple average
    const avg = historicalData.reduce((sum, d) => sum + d.value, 0) / historicalData.length
    forecast = {
      predictions: [{ timestamp: new Date(), value: avg, confidence: 0.5 }],
      trend: 'stable',
      confidence: 0.5,
    }
  }

  // Use AI for context-aware insights (with timeout to avoid hanging)
  let aiInsight = ''
  if (isAIAvailable()) {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI call timeout')), 5000)
      )
      
      const aiCallPromise = callAI([
        {
          role: 'system',
          content: `You are an expert in warehouse management and process optimization. Analyze the following prediction data and provide insights.`,
        },
        {
          role: 'user',
          content: `Case ID: ${caseId}\nPrediction Type: ${predictionType}\nTrend: ${forecast.trend}\nConfidence: ${forecast.confidence}\nHistorical Data Points: ${historicalData.length}\n\nProvide a brief insight about what this prediction means and any recommendations.`,
        },
      ], {
        maxTokens: 200,
        temperature: 0.7,
      })

      const aiResponse = await Promise.race([aiCallPromise, timeoutPromise]) as any
      aiInsight = aiResponse.content
    } catch (error: any) {
      console.warn('AI insight generation failed (non-blocking):', error.message || error)
      // Don't throw - just continue without AI insight
    }
  }

  const predictedValue = forecast.predictions[0]?.value || 0
  const confidence = forecast.confidence

  return {
    id: `prediction-${caseId}-${predictionType}`,
    caseId,
    predictionType,
    predictedValue,
    confidence: confidence * 100, // Convert to percentage
    predictionHorizon: 3600,
    model: 'ml-enhanced-forecast',
    features: {
      trend: forecast.trend,
      historicalPoints: historicalData.length,
      aiInsight,
    },
    predictedAt: new Date().toISOString(),
  }
}

/**
 * Enhanced anomaly detection using ML + AI
 */
export async function enhancedAnomalyDetection(
  value: number,
  historicalData: number[],
  context?: string
): Promise<AnomalyDetectionResult & { aiExplanation?: string }> {
  // Use ML model for anomaly detection
  let detection: AnomalyDetectionResult
  try {
    if (historicalData.length >= 4) {
      detection = MLModels.detectAnomalyIQR(value, historicalData)
    } else {
      detection = MLModels.detectAnomalyZScore(value, historicalData, 3)
    }
  } catch (error) {
    detection = {
      isAnomaly: false,
      score: 0,
      threshold: 3,
      severity: 'low',
    }
  }

  // Use AI for explanation if anomaly detected
  let aiExplanation: string | undefined
  if (detection.isAnomaly && isAIAvailable()) {
    try {
      const aiResponse = await callAI([
        {
          role: 'system',
          content: `You are an expert in warehouse operations and anomaly detection. Explain why this value might be anomalous and suggest actions.`,
        },
        {
          role: 'user',
          content: `Value: ${value}\nSeverity: ${detection.severity}\nScore: ${detection.score.toFixed(2)}\nContext: ${context || 'General warehouse operation'}\n\nExplain why this is anomalous and what actions should be taken.`,
        },
      ], {
        maxTokens: 150,
        temperature: 0.7,
      })

      aiExplanation = aiResponse.content
    } catch (error) {
      console.warn('AI explanation generation failed:', error)
    }
  }

  return {
    ...detection,
    aiExplanation,
  }
}

/**
 * Generate AI-powered insights
 */
export async function generateAIInsights(
  data: Array<{ metric: string; value: number; timestamp: Date }>,
  timeRange: { start: Date; end: Date }
): Promise<PredictiveInsight[]> {
  // Skip AI if not available to avoid hanging
  if (!isAIAvailable()) {
    console.log('AI not available, generating insights without AI')
    // Generate insights using ML patterns only
    const insights: PredictiveInsight[] = []
    const patterns = MLModels.detectPatterns(
      data.map(d => ({ timestamp: d.timestamp, value: d.value }))
    )
    
    for (const pattern of patterns.slice(0, 5)) {
      insights.push({
        id: `insight-${pattern.startIndex}-${pattern.endIndex}`,
        type: pattern.pattern === 'increasing' ? 'OPPORTUNITY' : pattern.pattern === 'decreasing' ? 'RISK' : 'TREND',
        title: `${pattern.pattern.charAt(0).toUpperCase() + pattern.pattern.slice(1)} Trend Detected`,
        description: `Detected ${pattern.pattern} pattern with strength ${pattern.strength.toFixed(2)}`,
        confidence: Math.min(95, pattern.strength * 100),
        impact: pattern.strength > 0.1 ? 'HIGH' : pattern.strength > 0.05 ? 'MEDIUM' : 'LOW',
        recommendations: pattern.pattern === 'increasing' 
          ? ['Monitor growth', 'Scale resources']
          : pattern.pattern === 'decreasing'
          ? ['Investigate cause', 'Take corrective action']
          : ['Maintain current state'],
        detectedAt: new Date().toISOString(),
      })
    }
    return insights
  }
  
  const insights: PredictiveInsight[] = []

  // Use ML models to detect patterns
  const patterns = MLModels.detectPatterns(
    data.map(d => ({ timestamp: d.timestamp, value: d.value }))
  )

  // Generate insights from patterns
  for (const pattern of patterns.slice(0, 5)) {
    const patternData = data.slice(pattern.startIndex, pattern.endIndex + 1)
    const avgValue = patternData.reduce((sum, d) => sum + d.value, 0) / patternData.length

    let aiDescription = ''
    if (isAIAvailable()) {
      try {
        const aiResponse = await callAI([
          {
            role: 'system',
            content: `You are an expert in warehouse analytics. Generate insights from process patterns.`,
          },
          {
            role: 'user',
            content: `Pattern: ${pattern.pattern}\nStrength: ${pattern.strength.toFixed(2)}\nAverage Value: ${avgValue.toFixed(2)}\nTime Range: ${pattern.startIndex} to ${pattern.endIndex}\n\nGenerate a brief insight about this pattern.`,
          },
        ], {
          maxTokens: 100,
          temperature: 0.7,
        })

        aiDescription = aiResponse.content
      } catch (error) {
        aiDescription = `Detected ${pattern.pattern} pattern with strength ${pattern.strength.toFixed(2)}`
      }
    } else {
      aiDescription = `Detected ${pattern.pattern} pattern with strength ${pattern.strength.toFixed(2)}`
    }

    insights.push({
      id: `insight-${pattern.startIndex}-${pattern.endIndex}`,
      type: pattern.pattern === 'increasing' ? 'OPPORTUNITY' : pattern.pattern === 'decreasing' ? 'RISK' : 'TREND',
      title: `${pattern.pattern.charAt(0).toUpperCase() + pattern.pattern.slice(1)} Trend Detected`,
      description: aiDescription,
      confidence: Math.min(95, pattern.strength * 100),
      impact: pattern.strength > 0.1 ? 'HIGH' : pattern.strength > 0.05 ? 'MEDIUM' : 'LOW',
      recommendedActions: pattern.pattern === 'increasing' 
        ? ['Monitor growth', 'Scale resources']
        : pattern.pattern === 'decreasing'
        ? ['Investigate cause', 'Take corrective action']
        : ['Maintain current state'],
      detectedAt: new Date().toISOString(),
    })
  }

  return insights
}

/**
 * AI-powered root cause analysis
 */
export async function aiRootCauseAnalysis(
  problem: string,
  symptoms: string[],
  context: Record<string, any>
): Promise<{
  rootCauses: Array<{ cause: string; confidence: number; explanation: string }>
  recommendations: string[]
}> {
  if (!isAIAvailable()) {
    return {
      rootCauses: [
        {
          cause: 'Insufficient data',
          confidence: 50,
          explanation: 'AI analysis unavailable. Please configure API keys.',
        },
      ],
      recommendations: ['Configure AI API keys for enhanced analysis'],
    }
  }

  try {
    const aiResponse = await callAI([
      {
        role: 'system',
        content: `You are an expert in warehouse operations and root cause analysis. Analyze problems systematically and provide root causes with confidence levels.`,
      },
      {
        role: 'user',
        content: `Problem: ${problem}\nSymptoms: ${symptoms.join(', ')}\nContext: ${JSON.stringify(context, null, 2)}\n\nPerform root cause analysis. List 3-5 potential root causes with confidence levels (0-100) and explanations. Then provide 3-5 actionable recommendations. Format as JSON:
{
  "rootCauses": [
    {"cause": "...", "confidence": 85, "explanation": "..."}
  ],
  "recommendations": ["...", "..."]
}`,
      },
    ], {
      maxTokens: 1000,
      temperature: 0.7,
    })

    // Try to parse JSON response
    try {
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed
      }
    } catch (e) {
      // Fallback to text parsing
    }

    // Fallback response
    return {
      rootCauses: [
        {
          cause: 'Analysis in progress',
          confidence: 75,
          explanation: aiResponse.content.substring(0, 200),
        },
      ],
      recommendations: ['Review AI analysis', 'Take corrective action', 'Monitor results'],
    }
  } catch (error) {
    console.error('AI root cause analysis failed:', error)
    return {
      rootCauses: [
        {
          cause: 'Analysis failed',
          confidence: 0,
          explanation: 'Unable to perform AI analysis. Please check API configuration.',
        },
      ],
      recommendations: ['Check AI API configuration', 'Retry analysis'],
    }
  }
}

export default {
  enhancedPredict,
  enhancedAnomalyDetection,
  generateAIInsights,
  aiRootCauseAnalysis,
}

