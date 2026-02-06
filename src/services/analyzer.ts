/**
 * RadarPolítico - Analisador de Sentimento
 * Usa IA para analisar sentimento e relevância das notícias
 */

import { supabase, type SentimentType } from '@/integrations/supabase/client'
import type { NewsArticle } from './googleNews'

export interface AnalyzedArticle extends NewsArticle {
  sentiment: SentimentType
  sentimentScore: number // -1 a 1
  relevanceScore: number // 0 a 1
  summary: string
  topics: string[]
  contentHash: string
}

export interface AnalysisResult {
  sentiment: SentimentType
  sentimentScore: number
  relevanceScore: number
  summary: string
  topics: string[]
}

/**
 * Analisa uma notícia usando a Edge Function do Supabase
 * (A Edge Function usa Claude API internamente)
 */
export async function analyzeArticle(
  article: NewsArticle,
  politicianName: string
): Promise<AnalyzedArticle> {
  try {
    // Chama a Edge Function para análise
    const { data, error } = await supabase.functions.invoke('analyze-mention', {
      body: {
        title: article.title,
        description: article.description,
        source: article.source,
        politicianName
      }
    })

    if (error) {
      console.error('Erro na análise:', error)
      // Retorna análise padrão em caso de erro
      return {
        ...article,
        sentiment: 'neutro',
        sentimentScore: 0,
        relevanceScore: 0.5,
        summary: article.description.substring(0, 200),
        topics: [],
        contentHash: generateHash(article.link)
      }
    }

    return {
      ...article,
      sentiment: data.sentiment,
      sentimentScore: data.sentimentScore,
      relevanceScore: data.relevanceScore,
      summary: data.summary,
      topics: data.topics,
      contentHash: generateHash(article.link)
    }
  } catch (error) {
    console.error('Erro ao analisar artigo:', error)
    return {
      ...article,
      sentiment: 'neutro',
      sentimentScore: 0,
      relevanceScore: 0.5,
      summary: article.description.substring(0, 200),
      topics: [],
      contentHash: generateHash(article.link)
    }
  }
}

/**
 * Analisa múltiplas notícias em batch
 */
export async function analyzeArticles(
  articles: NewsArticle[],
  politicianName: string
): Promise<AnalyzedArticle[]> {
  // Processa em paralelo com limite de concorrência
  const batchSize = 5
  const results: AnalyzedArticle[] = []

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    const analyzed = await Promise.all(
      batch.map(article => analyzeArticle(article, politicianName))
    )
    results.push(...analyzed)
  }

  return results
}

/**
 * Análise simplificada sem Edge Function (para testes)
 * Usa heurísticas básicas de palavras-chave
 */
export function analyzeArticleSimple(
  article: NewsArticle,
  politicianName: string
): AnalyzedArticle {
  const text = `${article.title} ${article.description}`.toLowerCase()

  // Palavras positivas
  const positiveWords = [
    'aprova', 'conquista', 'sucesso', 'vitória', 'apoio', 'elogia',
    'destaca', 'cresce', 'avança', 'lidera', 'popular', 'favorito',
    'melhora', 'benefício', 'acordo', 'parceria'
  ]

  // Palavras negativas
  const negativeWords = [
    'critica', 'acusa', 'investiga', 'denuncia', 'rejeita', 'crise',
    'escândalo', 'corrupção', 'fraude', 'prisão', 'derrota', 'perde',
    'queda', 'protesto', 'polêmica', 'repudia', 'condena'
  ]

  let score = 0
  positiveWords.forEach(word => {
    if (text.includes(word)) score += 0.2
  })
  negativeWords.forEach(word => {
    if (text.includes(word)) score -= 0.2
  })

  // Limita entre -1 e 1
  score = Math.max(-1, Math.min(1, score))

  // Determina sentimento
  let sentiment: SentimentType = 'neutro'
  if (score > 0.2) sentiment = 'positivo'
  else if (score < -0.2) sentiment = 'negativo'

  // Calcula relevância baseado na presença do nome
  const nameLower = politicianName.toLowerCase()
  const relevance = text.includes(nameLower) ? 0.8 : 0.5

  return {
    ...article,
    sentiment,
    sentimentScore: score,
    relevanceScore: relevance,
    summary: article.description.substring(0, 200),
    topics: extractTopics(text),
    contentHash: generateHash(article.link)
  }
}

/**
 * Extrai tópicos básicos do texto
 */
function extractTopics(text: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    'economia': ['economia', 'econômico', 'inflação', 'pib', 'emprego', 'salário'],
    'saúde': ['saúde', 'hospital', 'vacina', 'sus', 'médico'],
    'educação': ['educação', 'escola', 'universidade', 'estudante', 'professor'],
    'segurança': ['segurança', 'polícia', 'crime', 'violência', 'prisão'],
    'política': ['eleição', 'votação', 'congresso', 'senado', 'câmara'],
    'meio ambiente': ['ambiente', 'clima', 'desmatamento', 'sustentável'],
    'infraestrutura': ['infraestrutura', 'obra', 'construção', 'transporte']
  }

  const topics: string[] = []
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      topics.push(topic)
    }
  })

  return topics
}

/**
 * Gera hash único para o artigo
 */
function generateHash(url: string): string {
  // Gera um hash simples baseado na URL
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}
