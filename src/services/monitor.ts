/**
 * RadarPolítico - Serviço de Monitoramento
 * Orquestra a busca, análise e salvamento de menções
 */

import { supabase, type Politician, type Mention, type MentionInsert, type SentimentType } from '@/integrations/supabase/client'
import { searchPoliticianNews, type NewsArticle } from './googleNews'
import { analyzeArticleSimple, type AnalyzedArticle } from './analyzer'
import { searchPoliticianYouTube, analyzeYouTubeVideo, type YouTubeVideo } from './youtube'

export interface MonitoringResult {
  politicianId: number
  politicianName: string
  totalFound: number
  newMentions: number
  positive: number
  negative: number
  neutral: number
  mentions: AnalyzedArticle[]
  // YouTube
  youtubeVideos: number
  youtubeNewVideos: number
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

  // 2. Busca vídeos no YouTube
  const youtubeVideos = await searchPoliticianYouTube(
    politician.name,
    politician.nickname || undefined,
    politician.party || undefined
  )

  console.log(`🎬 ${youtubeVideos.length} vídeos do YouTube encontrados`)

  // Processa vídeos do YouTube como menções
  const youtubeArticles = youtubeVideos.map(video => {
    const analysis = analyzeYouTubeVideo(video, politician.name)
    return {
      title: video.title,
      link: video.url,
      source: `YouTube - ${video.channelTitle}`,
      pubDate: video.publishedAt,
      description: video.description,
      summary: `${video.title} - ${video.channelTitle}`,
      sentiment: analysis.sentiment,
      sentimentScore: analysis.sentimentScore,
      relevanceScore: analysis.relevanceScore,
      topics: ['youtube', 'video'],
      contentHash: `yt_${video.id}`
    } as AnalyzedArticle
  })

  // Combina notícias + YouTube
  const allArticles = [...articles.map(article =>
    analyzeArticleSimple(article, politician.name)
  ), ...youtubeArticles]

  if (allArticles.length === 0) {
    return {
      politicianId: politician.id,
      politicianName: politician.name,
      totalFound: 0,
      newMentions: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      mentions: [],
      youtubeVideos: 0,
      youtubeNewVideos: 0
    }
  }

  // 3. Filtra duplicatas (já existentes no banco)
  const existingHashes = await getExistingHashes(politician.id)
  const newArticles = allArticles.filter(
    article => !existingHashes.has(article.contentHash)
  )

  // Separa YouTube das notícias para estatísticas
  const newYouTube = newArticles.filter(a => a.contentHash.startsWith('yt_'))
  const newNews = newArticles.filter(a => !a.contentHash.startsWith('yt_'))

  console.log(`✨ ${newNews.length} novas notícias + ${newYouTube.length} novos vídeos`)

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
    totalFound: articles.length + youtubeVideos.length,
    newMentions: newArticles.length,
    ...stats,
    mentions: newArticles,
    youtubeVideos: youtubeVideos.length,
    youtubeNewVideos: newYouTube.length
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

  const mentions = data as { content_hash: string }[]
  return new Set(mentions.map(m => m.content_hash))
}

/**
 * Salva menções no banco de dados
 */
async function saveMentions(politicianId: number, articles: AnalyzedArticle[]): Promise<void> {
  const mentions: MentionInsert[] = articles.map(article => ({
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

  const politicianList = politicians as Politician[]

  if (!politicianList || politicianList.length === 0) {
    console.log('⚠️ Nenhum político cadastrado para monitorar')
    return []
  }

  // Monitora cada político
  const results: MonitoringResult[] = []
  for (const politician of politicianList) {
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

  const mentionList = mentions as Mention[]

  const stats = {
    total: mentionList.length,
    positive: mentionList.filter(m => m.sentiment === 'positivo').length,
    negative: mentionList.filter(m => m.sentiment === 'negativo').length,
    neutral: mentionList.filter(m => m.sentiment === 'neutro').length,
  }

  // Destaques positivos
  const positiveHighlights = mentionList
    .filter(m => m.sentiment === 'positivo')
    .slice(0, 3)
    .map(m => `• ${m.title}`)
    .join('\n')

  // Alertas negativos
  const negativeAlerts = mentionList
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

/**
 * Limpa todas as menções de um político
 * Útil para remover dados antigos/falsos e começar do zero
 */
export async function clearMentions(politicianId: number): Promise<{ deleted: number; error?: string }> {
  try {
    // Primeiro conta quantas menções existem
    const { count, error: countError } = await supabase
      .from('mentions')
      .select('*', { count: 'exact', head: true })
      .eq('politician_id', politicianId)

    if (countError) {
      return { deleted: 0, error: countError.message }
    }

    // Deleta todas as menções do político
    const { error } = await supabase
      .from('mentions')
      .delete()
      .eq('politician_id', politicianId)

    if (error) {
      return { deleted: 0, error: error.message }
    }

    console.log(`🗑️ ${count || 0} menções deletadas para político ${politicianId}`)
    return { deleted: count || 0 }
  } catch (err) {
    return { deleted: 0, error: String(err) }
  }
}

/**
 * Detecta se os dados parecem ser fake/demo
 * Retorna true se detectar padrões de dados falsos
 */
export function detectFakeData(mentions: Array<{ title?: string; content?: string }>): boolean {
  const fakePatterns = [
    'se manifesta sobre medidas econômicas em entrevista exclusiva',
    'comenta decisão do STF em suas redes sociais',
    'participa de evento em Brasília e fala sobre agenda',
    'articulam votação de projeto no Congresso',
    'anuncia novos investimentos para infraestrutura',
    'mostra avaliação de',
    'recebe comitiva de prefeitos',
    'defende reforma e critica oposição'
  ]

  let fakeCount = 0
  for (const mention of mentions) {
    const text = `${mention.title || ''} ${mention.content || ''}`.toLowerCase()
    for (const pattern of fakePatterns) {
      if (text.includes(pattern.toLowerCase())) {
        fakeCount++
        break
      }
    }
  }

  // Se mais de 30% das menções parecem fake, provavelmente são
  return fakeCount > mentions.length * 0.3
}
