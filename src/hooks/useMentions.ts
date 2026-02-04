/**
 * RadarPolítico - Hook para Menções
 * Gerencia menções e notícias coletadas
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Mention, SentimentType } from '@/integrations/supabase/types'

interface MentionsFilter {
  politicianId?: number
  sentiment?: SentimentType
  startDate?: string
  endDate?: string
  limit?: number
}

// Buscar menções com filtros
export function useMentions(filters: MentionsFilter = {}) {
  return useQuery({
    queryKey: ['mentions', filters],
    queryFn: async () => {
      let query = supabase
        .from('mentions')
        .select('*')
        .order('published_at', { ascending: false })

      if (filters.politicianId) {
        query = query.eq('politician_id', filters.politicianId)
      }

      if (filters.sentiment) {
        query = query.eq('sentiment', filters.sentiment)
      }

      if (filters.startDate) {
        query = query.gte('published_at', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('published_at', filters.endDate)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Mention[]
    }
  })
}

// Estatísticas de menções por político
export function useMentionStats(politicianId: number) {
  return useQuery({
    queryKey: ['mention-stats', politicianId],
    queryFn: async () => {
      // Buscar menções das últimas 24h
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data, error } = await supabase
        .from('mentions')
        .select('sentiment')
        .eq('politician_id', politicianId)
        .gte('created_at', yesterday.toISOString())

      if (error) throw error

      const stats = {
        total: data.length,
        positive: data.filter(m => m.sentiment === 'positivo').length,
        negative: data.filter(m => m.sentiment === 'negativo').length,
        neutral: data.filter(m => m.sentiment === 'neutro').length,
      }

      return {
        ...stats,
        positivePercentage: stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0,
        negativePercentage: stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0,
        neutralPercentage: stats.total > 0 ? Math.round((stats.neutral / stats.total) * 100) : 0,
      }
    },
    enabled: !!politicianId
  })
}

// Menções recentes para timeline
export function useRecentMentions(politicianId: number, limit = 10) {
  return useMentions({
    politicianId,
    limit
  })
}
