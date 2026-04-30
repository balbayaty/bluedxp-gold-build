/**
 * React Hook for Arabic NLP
 * 
 * Provides easy access to Arabic NLP analysis in React components
 * 
 * @module hooks
 */

import { useState, useCallback } from 'react'
import { arabicNLPService } from '@/lib/services/nlp/arabic-nlp'
import type { ArabicNLPAnalysis, AnalysisOptions } from '@/lib/services/nlp/arabic-nlp/types'

export interface UseArabicNLPResult {
  analysis: ArabicNLPAnalysis | null
  loading: boolean
  error: Error | null
  analyze: (text: string, options?: AnalysisOptions) => Promise<void>
  analyzeIntent: (text: string) => Promise<any>
  analyzeSentiment: (text: string) => Promise<any>
  reset: () => void
}

/**
 * Hook to analyze Arabic text
 */
export function useArabicNLP(): UseArabicNLPResult {
  const [analysis, setAnalysis] = useState<ArabicNLPAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const analyze = useCallback(async (text: string, options?: AnalysisOptions) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await arabicNLPService.analyze(text, options)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to analyze Arabic text'))
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeIntent = useCallback(async (text: string) => {
    try {
      setLoading(true)
      setError(null)
      
      return await arabicNLPService.detectIntent(text)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to detect intent'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeSentiment = useCallback(async (text: string) => {
    try {
      setLoading(true)
      setError(null)
      
      return await arabicNLPService.analyzeSentiment(text)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to analyze sentiment'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setAnalysis(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    analysis,
    loading,
    error,
    analyze,
    analyzeIntent,
    analyzeSentiment,
    reset,
  }
}

