/**
 * RadarPolítico - Serviço de Monitoramento
 * Orquestra a busca, análise e salvamento de menções
 */

import { supabase } from '@/integrations/supabase/client'
import { searchPoliticianNews, type NewsArticle } from './googleNews'
import { analyzeArticleSimple, type AnalyzedArticle } from './analyzer'
import type { Politician, Mention } from '@/integrations/supabase/types'

export interface MonitoringResult {
  politicianId: number
  politicianName: string
  totalFound: number
  newMentions: number
  positive: number
  negative: number
  neutral: number
  mentions: AnalyzedArticle[]
}

/**
 * Executa o monitoramento completo para um político
 */
export async function monitorPolitician(politician: Politician): Promise<MonitoringResult> {
  console.log(`🔍 Iniciando monitoramento: ${politician.name}`)

  // 1. Busca notícias no Google News
  const articles = await searchPoliticianNews(
    politician.name,
    politician.nickname || undefined,
    politician.party || undefined
  )

  console.log(`📰 ${articles.length} notícias encontradas`)

  if (articles.length === 0) {
    return {
      politicianId: politician.id,
      politicianName: politician.name,
      totalFound: 0,
      newMentions: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      mentions: []
    }
  }

  // 2. Analisa cada artigo
  const analyzedArticles = articles.map(article =>
    analyzeArticleSimple(article, politician.name)
  )

  // 3. Filtra duplicatas (já existentes no banco)
  const existingHashes = await getExistingHashes(politician.id)
  const newArticles = analyzedArticles.filter(
    article => !existingHashes.has(article.contentHash)
  )

  console.log(`✨ ${newArticles.length} novas menções (${analyzedArticles.length - newArticles.length} duplicatas)`)

  // 4. Salva no banco de dados
  if (newArticles.length > 0) {
    await saveMentions(politician.id, newArticles)
  }

  // 5. Calcula estatísticas
  const stats = {
    positive: newArticles.filter(a => a.sentiment === 'positivo').length,
    negative: newArticles.filter(a => a.sentiment === 'negativo').length,
    neutral: newArticles.filter(a => a.sentiment === 'neutro').length,
  }

  return {
    politicianId: politician.id,
    politicianName: politician.name,
    totalFound: articles.length,
    newMentions: newArticles.length,
    ...stats,
    mentions: newArticles
  }
}

/**
 * Busca hashes de menções existentes para evitar duplicatas
 */
async function getExistingHashes(politicianId: number): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('mentions')
    .select('content_hash')
    .eq('politician_id', politicianId)

  if (error) {
    console.error('Erro ao buscar hashes existentes:', error)
    return new Set()
  }

  return new Set(data.map(m => m.content_hash))
}

/**
 * Salva menções no banco de dados
 */
async function saveMentions(politicianId: number, articles: AnalyzedArticle[]): Promise<void> {
  const mentions = articles.map(article => ({
    politician_id: politicianId,
    title: article.title,
    content: article.description,
    summary: article.summary,
    url: article.link,
    source_name: article.source,
    source_type: 'news' as const,
    sentiment: article.sentiment,
    sentiment_score: article.sentimentScore,
    relevance_score: article.relevanceScore,
    topics: article.topics,
    published_at: new Date(article.pubDate).toISOString(),
    content_hash: article.contentHash,
    is_processed: true
  }))

  const { error } = await supabase
    .from('mentions')
    .insert(mentions)

  if (error) {
    console.error('Erro ao salvar menções:', error)
    throw error
  }

  console.log(`💾 ${mentions.length} menções salvas`)
}

/**
 * Executa monitoramento para todos os políticos ativos do usuário
 */
export async function monitorAllPoliticians(): Promise<MonitoringResult[]> {
  // Busca todos os políticos ativos
  const { data: politicians, error } = await supabase
    .from('politicians')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error('Erro ao buscar políticos:', error)
    return []
  }

  if (!politicians || politicians.length === 0) {
    console.log('⚠️ Nenhum político cadastrado para monitorar')
    return []
  }

  // Monitora cada político
  const results: MonitoringResult[] = []
  for (const politician of politicians) {
    try {
      const result = await monitorPolitician(politician)
      results.push(result)

      // Pausa entre requisições para não sobrecarregar
      await sleep(2000)
    } catch (error) {
      console.error(`Erro ao monitorar ${politician.name}:`, error)
    }
  }

  return results
}

/**
 * Gera resumo diário de um político
 */
export async function generateDailyReport(politicianId: number): Promise<string> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Busca menções do dia
  const { data: mentions, error } = await supabase
    .from('mentions')
    .select('*')
    .eq('politician_id', politicianId)
    .gte('created_at', today.toISOString())
    .order('sentiment_score', { ascending: false })

  if (error || !mentions) {
    return 'Não foi possível gerar o relatório.'
  }

  const stats = {
    total: mentions.length,
    positive: mentions.filter(m => m.sentiment === 'positivo').length,
    negative: mentions.filter(m => m.sentiment === 'negativo').length,
    neutral: mentions.filter(m => m.sentiment === 'neutro').length,
  }

  // Destaques positivos
  const positiveHighlights = mentions
    .filter(m => m.sentiment === 'positivo')
    .slice(0, 3)
    .map(m => `• ${m.title}`)
    .join('\n')

  // Alertas negativos
  const negativeAlerts = mentions
    .filter(m => m.sentiment === 'negativo')
    .slice(0, 3)
    .map(m => `• ${m.title}`)
    .join('\n')

  const report = `
📊 *RADAR POLÍTICO - RESUMO DO DIA*
📅 ${today.toLocaleDateString('pt-BR')}

📈 *Estatísticas:*
• Total de menções: ${stats.total}
• Positivas: ${stats.positive} (${Math.round((stats.positive / stats.total) * 100 || 0)}%)
• Negativas: ${stats.negative} (${Math.round((stats.negative / stats.total) * 100 || 0)}%)
• Neutras: ${stats.neutral}

${positiveHighlights ? `✅ *Destaques Positivos:*\n${positiveHighlights}\n` : ''}
${negativeAlerts ? `⚠️ *Pontos de Atenção:*\n${negativeAlerts}\n` : ''}

📱 Acesse o dashboard para mais detalhes.
`.trim()

  return report
}

// Utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
