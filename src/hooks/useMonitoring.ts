/**
 * RadarPolítico - Hook de Monitoramento
 * Gerencia a execução do monitoramento de mídia
 */

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { monitorPolitician, monitorAllPoliticians, generateDailyReport, type MonitoringResult } from '@/services/monitor'
import type { Politician } from '@/integrations/supabase/types'

interface UseMonitoringReturn {
  isMonitoring: boolean
  lastResult: MonitoringResult | null
  results: MonitoringResult[]
  error: Error | null
  runMonitoring: (politician: Politician) => Promise<MonitoringResult>
  runMonitoringAll: () => Promise<MonitoringResult[]>
  generateReport: (politicianId: number) => Promise<string>
}

export function useMonitoring(): UseMonitoringReturn {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastResult, setLastResult] = useState<MonitoringResult | null>(null)
  const [results, setResults] = useState<MonitoringResult[]>([])
  const [error, setError] = useState<Error | null>(null)

  const queryClient = useQueryClient()

  const runMonitoring = useCallback(async (politician: Politician): Promise<MonitoringResult> => {
    setIsMonitoring(true)
    setError(null)

    try {
      const result = await monitorPolitician(politician)
      setLastResult(result)
      setResults(prev => [...prev, result])

      // Invalida queries para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['mention-stats'] })

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro no monitoramento')
      setError(error)
      throw error
    } finally {
      setIsMonitoring(false)
    }
  }, [queryClient])

  const runMonitoringAll = useCallback(async (): Promise<MonitoringResult[]> => {
    setIsMonitoring(true)
    setError(null)

    try {
      const results = await monitorAllPoliticians()
      setResults(results)
      if (results.length > 0) {
        setLastResult(results[results.length - 1])
      }

      // Invalida queries para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['mention-stats'] })

      return results
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro no monitoramento')
      setError(error)
      throw error
    } finally {
      setIsMonitoring(false)
    }
  }, [queryClient])

  const generateReport = useCallback(async (politicianId: number): Promise<string> => {
    return await generateDailyReport(politicianId)
  }, [])

  return {
    isMonitoring,
    lastResult,
    results,
    error,
    runMonitoring,
    runMonitoringAll,
    generateReport
  }
}
