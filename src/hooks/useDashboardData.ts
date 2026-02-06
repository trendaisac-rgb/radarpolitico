/**
 * RadarPolítico - Hook de Dados do Dashboard
 * Gerencia todos os dados necessários para o dashboard profissional
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Politician, type Mention } from '@/integrations/supabase/client'
import { monitorPolitician, type MonitoringResult } from '@/services/monitor'
import { searchAllNetworks, type SocialSearchResult } from '@/services/socialMedia'

// Tipos para o Dashboard
export interface DailyReport {
  id: number
  politician_id: number
  data: string
  score: number
  alerta_nivel: 'verde' | 'amarelo' | 'vermelho'
  alerta_motivo: string | null
  sumario: string | null
  recomendacoes: string[] | null
  total_mencoes: number
  mencoes_positivas: number
  mencoes_negativas: number
  mencoes_neutras: number
  created_at: string
}

export interface NetworkMetric {
  id: number
  report_id: number | null
  politician_id: number
  data: string
  rede: 'midia' | 'youtube' | 'twitter' | 'instagram' | 'tiktok' | 'telegram' | 'facebook'
  mencoes: number
  sentimento_positivo: number
  sentimento_negativo: number
  score: number
  engajamento: number
  tendencia: 'subindo' | 'descendo' | 'estavel'
}

export interface ScoreHistory {
  date: string
  score: number
  mentions: number
}

export interface DashboardData {
  politician: Politician | null
  todayReport: DailyReport | null
  networkMetrics: NetworkMetric[]
  recentMentions: Mention[]
  scoreHistory: ScoreHistory[]
  socialResults: Record<string, SocialSearchResult>
  isLoading: boolean
  isRefreshing: boolean
  error: Error | null
}

// Busca o político ativo
async function fetchActivePolitician(): Promise<Politician | null> {
  const { data, error } = await supabase
    .from('politicians')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows found
    throw error
  }

  return data as Politician
}

// Busca relatório de hoje
async function fetchTodayReport(politicianId: number): Promise<DailyReport | null> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('politician_id', politicianId)
    .eq('data', today)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Erro ao buscar relatório:', error)
    return null
  }

  return data as DailyReport
}

// Busca métricas de redes
async function fetchNetworkMetrics(politicianId: number): Promise<NetworkMetric[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('network_metrics')
    .select('*')
    .eq('politician_id', politicianId)
    .eq('data', today)

  if (error) {
    console.error('Erro ao buscar métricas:', error)
    return []
  }

  return (data as NetworkMetric[]) || []
}

// Busca menções recentes
async function fetchRecentMentions(politicianId: number, limit = 20): Promise<Mention[]> {
  const { data, error } = await supabase
    .from('mentions')
    .select('*')
    .eq('politician_id', politicianId)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Erro ao buscar menções:', error)
    return []
  }

  return (data as Mention[]) || []
}

// Busca histórico de scores
async function fetchScoreHistory(politicianId: number, days = 30): Promise<ScoreHistory[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('daily_reports')
    .select('data, score, total_mencoes')
    .eq('politician_id', politicianId)
    .gte('data', startDate.toISOString().split('T')[0])
    .order('data', { ascending: true })

  if (error) {
    console.error('Erro ao buscar histórico:', error)
    return []
  }

  return (data || []).map((d: any) => ({
    date: d.data,
    score: d.score || 50,
    mentions: d.total_mencoes || 0
  }))
}

// Gera relatório diário baseado nas menções
async function generateDailyReport(politician: Politician, mentions: Mention[]): Promise<DailyReport | null> {
  const today = new Date().toISOString().split('T')[0]

  // Filtra menções de hoje
  const todayStart = new Date(today).getTime()
  const todayMentions = mentions.filter(m => {
    const mentionDate = new Date(m.published_at || m.created_at).getTime()
    return mentionDate >= todayStart
  })

  // Calcula estatísticas
  const positivas = todayMentions.filter(m => m.sentiment === 'positivo').length
  const negativas = todayMentions.filter(m => m.sentiment === 'negativo').length
  const neutras = todayMentions.filter(m => m.sentiment === 'neutro').length
  const total = todayMentions.length

  // Calcula score (0-100)
  let score = 50
  if (total > 0) {
    const sentimentRatio = (positivas - negativas) / total
    score = Math.round(50 + sentimentRatio * 50)
    score = Math.max(0, Math.min(100, score))
  }

  // Determina nível de alerta
  let alertaNivel: 'verde' | 'amarelo' | 'vermelho' = 'verde'
  let alertaMotivo: string | null = null

  if (negativas > positivas * 2 && negativas > 3) {
    alertaNivel = 'vermelho'
    alertaMotivo = `Alto volume de menções negativas (${negativas} de ${total})`
  } else if (negativas > positivas && negativas > 2) {
    alertaNivel = 'amarelo'
    alertaMotivo = `Aumento de menções negativas detectado`
  }

  // Gera sumário
  const sumario = total > 0
    ? `Hoje foram encontradas ${total} menções: ${positivas} positivas, ${negativas} negativas e ${neutras} neutras.`
    : 'Nenhuma nova menção encontrada hoje.'

  // Gera recomendações
  const recomendacoes: string[] = []
  if (negativas > positivas) {
    recomendacoes.push('Monitore de perto as menções negativas e avalie a necessidade de posicionamento')
  }
  if (positivas > 0) {
    recomendacoes.push('Aproveite as menções positivas para amplificar boas notícias')
  }
  if (total < 5) {
    recomendacoes.push('Considere aumentar a presença digital para maior visibilidade')
  }

  // Upsert no banco
  const reportData = {
    politician_id: politician.id,
    data: today,
    score,
    alerta_nivel: alertaNivel,
    alerta_motivo: alertaMotivo,
    sumario,
    recomendacoes,
    total_mencoes: total,
    mencoes_positivas: positivas,
    mencoes_negativas: negativas,
    mencoes_neutras: neutras
  }

  const { data, error } = await supabase
    .from('daily_reports')
    .upsert(reportData, { onConflict: 'politician_id,data' })
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar relatório:', error)
    return null
  }

  return data as DailyReport
}

// Salva métricas de rede
async function saveNetworkMetrics(
  politicianId: number,
  reportId: number | null,
  socialResults: Record<string, SocialSearchResult>,
  newsMentions: Mention[]
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  // Métricas de mídia (notícias)
  const newsPositive = newsMentions.filter(m => m.sentiment === 'positivo' && !m.source_name?.includes('YouTube')).length
  const newsNegative = newsMentions.filter(m => m.sentiment === 'negativo' && !m.source_name?.includes('YouTube')).length
  const newsTotal = newsMentions.filter(m => !m.source_name?.includes('YouTube')).length

  const metrics: any[] = [
    {
      politician_id: politicianId,
      report_id: reportId,
      data: today,
      rede: 'midia',
      mencoes: newsTotal,
      sentimento_positivo: newsPositive,
      sentimento_negativo: newsNegative,
      score: newsTotal > 0 ? Math.round(50 + ((newsPositive - newsNegative) / newsTotal) * 50) : 50,
      engajamento: 0,
      tendencia: 'estavel'
    }
  ]

  // Métricas de cada rede social
  const networkMapping: Record<string, string> = {
    youtube: 'youtube',
    twitter: 'twitter',
    instagram: 'instagram',
    tiktok: 'tiktok'
  }

  for (const [key, rede] of Object.entries(networkMapping)) {
    const result = socialResults[key]
    if (result) {
      const positive = result.posts.filter(p => p.sentiment === 'positivo').length
      const negative = result.posts.filter(p => p.sentiment === 'negativo').length
      const total = result.posts.length
      const engagement = result.posts.reduce((sum, p) =>
        sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0)

      metrics.push({
        politician_id: politicianId,
        report_id: reportId,
        data: today,
        rede,
        mencoes: total,
        sentimento_positivo: positive,
        sentimento_negativo: negative,
        score: total > 0 ? Math.round(50 + ((positive - negative) / total) * 50) : 50,
        engajamento: engagement,
        tendencia: 'estavel'
      })
    }
  }

  // Upsert todas as métricas
  for (const metric of metrics) {
    await supabase
      .from('network_metrics')
      .upsert(metric, { onConflict: 'politician_id,data,rede' })
  }
}

/**
 * Hook principal do Dashboard
 */
export function useDashboardData() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [socialResults, setSocialResults] = useState<Record<string, SocialSearchResult>>({})

  // Query: Político ativo
  const {
    data: politician,
    isLoading: loadingPolitician,
    error: politicianError
  } = useQuery({
    queryKey: ['active-politician'],
    queryFn: fetchActivePolitician,
    staleTime: 5 * 60 * 1000 // 5 minutos
  })

  // Query: Relatório de hoje
  const {
    data: todayReport,
    isLoading: loadingReport
  } = useQuery({
    queryKey: ['today-report', politician?.id],
    queryFn: () => politician ? fetchTodayReport(politician.id) : null,
    enabled: !!politician,
    staleTime: 2 * 60 * 1000
  })

  // Query: Métricas de redes
  const {
    data: networkMetrics = [],
    isLoading: loadingMetrics
  } = useQuery({
    queryKey: ['network-metrics', politician?.id],
    queryFn: () => politician ? fetchNetworkMetrics(politician.id) : [],
    enabled: !!politician,
    staleTime: 2 * 60 * 1000
  })

  // Query: Menções recentes
  const {
    data: recentMentions = [],
    isLoading: loadingMentions
  } = useQuery({
    queryKey: ['recent-mentions', politician?.id],
    queryFn: () => politician ? fetchRecentMentions(politician.id) : [],
    enabled: !!politician,
    staleTime: 2 * 60 * 1000
  })

  // Query: Histórico de scores
  const {
    data: scoreHistory = [],
    isLoading: loadingHistory
  } = useQuery({
    queryKey: ['score-history', politician?.id],
    queryFn: () => politician ? fetchScoreHistory(politician.id) : [],
    enabled: !!politician,
    staleTime: 5 * 60 * 1000
  })

  // Mutation: Atualizar dados
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!politician) throw new Error('Nenhum político selecionado')

      console.log('🔄 Iniciando atualização completa...')

      // 1. Monitora notícias e YouTube
      const monitorResult = await monitorPolitician(politician)
      console.log('📰 Monitoramento concluído:', monitorResult)

      // 2. Busca redes sociais
      const searchQuery = politician.nickname || politician.name
      console.log('🔍 Buscando redes sociais para:', searchQuery)
      const social = await searchAllNetworks(searchQuery)
      setSocialResults(social)
      console.log('📱 Redes sociais:', social)

      // 3. Busca menções atualizadas
      const mentions = await fetchRecentMentions(politician.id, 100)

      // 4. Gera relatório diário
      const report = await generateDailyReport(politician, mentions)
      console.log('📊 Relatório gerado:', report)

      // 5. Salva métricas de rede
      if (report) {
        await saveNetworkMetrics(politician.id, report.id, social, mentions)
      }

      return { monitorResult, social, report }
    },
    onSuccess: () => {
      // Invalida todas as queries para recarregar
      queryClient.invalidateQueries({ queryKey: ['today-report'] })
      queryClient.invalidateQueries({ queryKey: ['network-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['recent-mentions'] })
      queryClient.invalidateQueries({ queryKey: ['score-history'] })
    }
  })

  // Função de refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshMutation.mutateAsync()
    } catch (error) {
      console.error('Erro no refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshMutation])

  // Loading combinado
  const isLoading = loadingPolitician || loadingReport || loadingMetrics || loadingMentions || loadingHistory

  return {
    // Data
    politician,
    todayReport,
    networkMetrics,
    recentMentions,
    scoreHistory,
    socialResults,

    // Status
    isLoading,
    isRefreshing,
    error: politicianError as Error | null,

    // Actions
    refresh
  }
}

/**
 * Hook para buscar dados de um período específico
 */
export function useScoreHistoryByPeriod(politicianId: number | undefined, days: number) {
  return useQuery({
    queryKey: ['score-history', politicianId, days],
    queryFn: () => politicianId ? fetchScoreHistory(politicianId, days) : [],
    enabled: !!politicianId,
    staleTime: 5 * 60 * 1000
  })
}
