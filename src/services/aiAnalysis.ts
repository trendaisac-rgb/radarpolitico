/**
 * RadarPolítico - Serviço de Análise com IA
 * Chama edge function segura (chave nunca exposta no frontend)
 */

import { supabase } from '@/integrations/supabase/client'

// ============================================
// INTERFACES
// ============================================

export interface MentionData {
  title: string
  source: string
  content?: string
  url: string
  publishedAt: string
  platform: string
}

export interface NetworkData {
  network: string
  mentions: number
  positive: number
  negative: number
  neutral: number
  topPosts: Array<{
    content: string
    author: string
    engagement: number
    url: string
  }>
}

export interface AIAnalysisResult {
  summary: string
  overallSentiment: 'positivo' | 'negativo' | 'neutro' | 'misto'
  sentimentScore: number
  alertLevel: 'verde' | 'amarelo' | 'vermelho'
  alertReason: string
  topNews: Array<{
    title: string
    source: string
    sentiment: 'positivo' | 'negativo' | 'neutro'
    relevance: string
    url: string
  }>
  mainTopics: string[]
  recommendations: string[]
  networkScores: Array<{
    network: string
    score: number
    trend: 'subindo' | 'descendo' | 'estavel'
    insight: string
  }>
  risks: Array<{
    description: string
    severity: 'baixo' | 'medio' | 'alto'
    action: string
  }>
  opportunities: string[]
}

export interface DailyReportData {
  politicianName: string
  party?: string
  position?: string
  date: string
  mentions: MentionData[]
  networks: NetworkData[]
}

// ============================================
// PROMPT
// ============================================

const ANALYSIS_PROMPT = `Você é um analista de MONITORAMENTO DE MÍDIA político, NÃO um analista político partidário.

⚠️ REGRAS CRÍTICAS:
1. Você SOMENTE analisa dados que são FORNECIDOS. NÃO invente dados.
2. Este sistema V1 monitora APENAS: Mídia Tradicional (Google News) + YouTube.
3. NÃO mencione Twitter, Instagram, TikTok, Facebook ou Telegram.

⚠️ REGRAS DE IMPARCIALIDADE:
1. Você NÃO tem opinião política. Analisa FATOS e TOM da cobertura.
2. Avalie o IMPACTO NA IMAGEM do político, não se a pauta é "boa" ou "ruim" ideologicamente.
3. Trate políticos de TODOS os partidos com os MESMOS critérios.

CRITÉRIOS DE SCORE (0-10):
- 10 = Cobertura muito favorável
- 7.5 = Cobertura favorável
- 5 = Cobertura neutra
- 2.5 = Cobertura desfavorável
- 0 = Cobertura muito desfavorável

FORMATO DE RESPOSTA (JSON estrito):
{
  "summary": "string (sumário executivo de 8-12 frases)",
  "overallSentiment": "positivo|negativo|neutro|misto",
  "sentimentScore": number (0-10),
  "alertLevel": "verde|amarelo|vermelho",
  "alertReason": "string",
  "topNews": [{"title": "string", "source": "string", "sentiment": "positivo|negativo|neutro", "relevance": "string", "url": "string"}],
  "mainTopics": ["string"],
  "recommendations": ["string"],
  "networkScores": [{"network": "string", "score": number (0-10), "trend": "subindo|descendo|estavel", "insight": "string"}],
  "risks": [{"description": "string", "severity": "baixo|medio|alto", "action": "string"}],
  "opportunities": ["string"]
}`

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

export async function analyzeWithAI(data: DailyReportData): Promise<AIAnalysisResult> {
  try {
    const userMessage = formatDataForAI(data)

    const { data: response, error } = await supabase.functions.invoke('ai-analysis', {
      body: {
        systemPrompt: ANALYSIS_PROMPT,
        userMessage,
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 2000
      }
    })

    if (error) {
      console.error('Edge function error:', error)
      return analyzeLocally(data)
    }

    if (response?.fallback || !response?.content) {
      console.warn('AI não configurada, usando análise local')
      return analyzeLocally(data)
    }

    return JSON.parse(response.content) as AIAnalysisResult
  } catch (error) {
    console.error('Erro na análise com IA:', error)
    return analyzeLocally(data)
  }
}

// ============================================
// FORMATA DADOS PARA A IA
// ============================================

function formatDataForAI(data: DailyReportData): string {
  const midiaMencoes = data.mentions.filter(m => m.platform === 'midia' || m.platform === 'news')
  const youtubeMencoes = data.mentions.filter(m => m.platform === 'youtube')
  const youtubeData = data.networks.find(n => n.network.toLowerCase().includes('youtube'))

  let message = `Analise a cobertura do político ${data.politicianName}`
  if (data.party) message += ` (${data.party})`
  if (data.position) message += ` - ${data.position}`
  message += ` nas últimas 24 horas.\n\n`
  message += `📅 Data: ${data.date}\n\n`

  message += `📰 MÍDIA TRADICIONAL (${midiaMencoes.length} itens):\n`
  if (midiaMencoes.length > 0) {
    message += JSON.stringify(midiaMencoes.slice(0, 15).map(m => ({
      titulo: m.title, fonte: m.source, url: m.url
    })), null, 2) + '\n\n'
  } else {
    message += 'Nenhuma menção encontrada\n\n'
  }

  message += `🎬 YOUTUBE:\n`
  if (youtubeData?.topPosts?.length) {
    message += JSON.stringify(youtubeData.topPosts.slice(0, 10).map(p => ({
      titulo: p.content, canal: p.author, engajamento: p.engagement, url: p.url
    })), null, 2) + '\n\n'
  } else if (youtubeMencoes.length > 0) {
    message += JSON.stringify(youtubeMencoes.slice(0, 10).map(m => ({
      titulo: m.title, canal: m.source, url: m.url
    })), null, 2) + '\n\n'
  } else {
    message += 'Nenhum vídeo encontrado\n\n'
  }

  message += `Gere o relatório completo no formato JSON especificado.`
  return message
}

// ============================================
// ANÁLISE LOCAL (FALLBACK)
// ============================================

function analyzeLocally(data: DailyReportData): AIAnalysisResult {
  const totalMentions = data.mentions.length
  const positiveWords = ['aprova', 'conquista', 'sucesso', 'vitória', 'apoio', 'elogia', 'destaca', 'cresce', 'avança', 'lidera', 'popular', 'favorito', 'melhora', 'benefício']
  const negativeWords = ['critica', 'acusa', 'investiga', 'denuncia', 'rejeita', 'crise', 'escândalo', 'corrupção', 'fraude', 'prisão', 'derrota', 'perde', 'queda', 'protesto', 'polêmica']

  let positiveCount = 0
  let negativeCount = 0

  const analyzedMentions = data.mentions.map(mention => {
    const text = `${mention.title} ${mention.content || ''}`.toLowerCase()
    let sentiment: 'positivo' | 'negativo' | 'neutro' = 'neutro'
    const posMatches = positiveWords.filter(w => text.includes(w)).length
    const negMatches = negativeWords.filter(w => text.includes(w)).length
    if (posMatches > negMatches) { sentiment = 'positivo'; positiveCount++ }
    else if (negMatches > posMatches) { sentiment = 'negativo'; negativeCount++ }
    return { ...mention, sentiment }
  })

  let sentimentScore = 5
  if (totalMentions > 0) {
    const ratio = (positiveCount - negativeCount) / totalMentions
    sentimentScore = Math.round(5 + ratio * 5)
    sentimentScore = Math.max(1, Math.min(10, sentimentScore))
  }

  let overallSentiment: 'positivo' | 'negativo' | 'neutro' | 'misto' = 'neutro'
  if (positiveCount > negativeCount * 1.5) overallSentiment = 'positivo'
  else if (negativeCount > positiveCount * 1.5) overallSentiment = 'negativo'
  else if (positiveCount > 0 && negativeCount > 0) overallSentiment = 'misto'

  let alertLevel: 'verde' | 'amarelo' | 'vermelho' = 'verde'
  let alertReason = 'Dia tranquilo, sem situações críticas detectadas'
  if (negativeCount > totalMentions * 0.5 && negativeCount > 3) {
    alertLevel = 'vermelho'
    alertReason = `Alta concentração de menções negativas (${negativeCount} de ${totalMentions})`
  } else if (negativeCount > totalMentions * 0.3 && negativeCount > 2) {
    alertLevel = 'amarelo'
    alertReason = `Aumento de menções negativas detectado`
  }

  const topNews = analyzedMentions.slice(0, 3).map(m => ({
    title: m.title,
    source: m.source,
    sentiment: m.sentiment,
    relevance: m.sentiment === 'negativo' ? 'Requer atenção' : m.sentiment === 'positivo' ? 'Oportunidade de amplificação' : 'Menção neutra',
    url: m.url
  }))

  const recommendations: string[] = []
  if (alertLevel === 'vermelho') {
    recommendations.push('Avaliar necessidade de nota oficial')
    recommendations.push('Monitorar evolução das menções negativas')
  } else if (alertLevel === 'amarelo') {
    recommendations.push('Acompanhar temas que geraram menções negativas')
    recommendations.push('Preparar respostas caso a situação escale')
  } else {
    recommendations.push('Aproveitar momento favorável para comunicações positivas')
    recommendations.push('Amplificar notícias positivas')
  }

  const summary = `Hoje foram registradas ${totalMentions} menções sobre ${data.politicianName}. ` +
    `${positiveCount} positivas, ${negativeCount} negativas e ${totalMentions - positiveCount - negativeCount} neutras. ` +
    (alertLevel === 'verde' ? 'Dia sem grandes ocorrências.' : alertLevel === 'amarelo' ? 'Atenção recomendada.' : 'Situação requer ação imediata.')

  return {
    summary,
    overallSentiment,
    sentimentScore,
    alertLevel,
    alertReason,
    topNews,
    mainTopics: ['política'],
    recommendations,
    networkScores: data.networks.map(n => ({
      network: n.network,
      score: n.mentions > 0 ? Math.round(50 + ((n.positive - n.negative) / n.mentions) * 50) : 50,
      trend: 'estavel' as const,
      insight: n.mentions > 0 ? `${n.mentions} menções, ${n.positive} positivas` : 'Sem dados'
    })),
    risks: negativeCount > 0 ? [{
      description: `${negativeCount} menções negativas detectadas`,
      severity: negativeCount > 5 ? 'alto' as const : negativeCount > 2 ? 'medio' as const : 'baixo' as const,
      action: 'Monitorar evolução'
    }] : [],
    opportunities: positiveCount > 0 ? [`${positiveCount} menções positivas podem ser aproveitadas`] : []
  }
}

// ============================================
// ANÁLISE DE SENTIMENTO INDIVIDUAL
// ============================================

export async function analyzeSentimentAI(text: string): Promise<{
  sentiment: 'positivo' | 'negativo' | 'neutro'
  confidence: number
  explanation: string
}> {
  try {
    const { data: response } = await supabase.functions.invoke('ai-analysis', {
      body: {
        systemPrompt: 'Analise o sentimento do texto em relação a um político. Responda em JSON: {"sentiment": "positivo|negativo|neutro", "confidence": 0-1, "explanation": "breve explicação"}',
        userMessage: text,
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 150
      }
    })

    if (response?.fallback || !response?.content) {
      return analyzeSentimentLocal(text)
    }

    return JSON.parse(response.content)
  } catch {
    return analyzeSentimentLocal(text)
  }
}

function analyzeSentimentLocal(text: string): {
  sentiment: 'positivo' | 'negativo' | 'neutro'
  confidence: number
  explanation: string
} {
  const lower = text.toLowerCase()
  const positiveWords = ['aprova', 'conquista', 'sucesso', 'vitória', 'apoio', 'elogia']
  const negativeWords = ['critica', 'acusa', 'escândalo', 'crise', 'corrupção', 'fraude']
  const posMatches = positiveWords.filter(w => lower.includes(w)).length
  const negMatches = negativeWords.filter(w => lower.includes(w)).length
  if (posMatches > negMatches) return { sentiment: 'positivo', confidence: 0.7, explanation: 'Palavras positivas detectadas' }
  if (negMatches > posMatches) return { sentiment: 'negativo', confidence: 0.7, explanation: 'Palavras negativas detectadas' }
  return { sentiment: 'neutro', confidence: 0.5, explanation: 'Conteúdo aparentemente neutro' }
}

// ============================================
// STATUS
// ============================================

export function isAIConfigured(): boolean {
  // Always true now - edge function handles fallback
  return true
}

export function getAIStatus(): { configured: boolean; model: string } {
  return { configured: true, model: 'gpt-4o-mini (via edge function)' }
}
