/**
 * RadarPolítico - Serviço de Análise com IA (OpenAI GPT-4)
 * Gera relatórios diários, análise de sentimento e recomendações
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

const OPENAI_API_KEY = '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'

const OPENAI_MODEL = 'gpt-4o-mini' // Mais barato e rápido, ou use 'gpt-4o' para melhor qualidade

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
  // Resumo executivo
  summary: string

  // Sentimento geral
  overallSentiment: 'positivo' | 'negativo' | 'neutro' | 'misto'
  sentimentScore: number // 1-10

  // Alerta de crise
  alertLevel: 'verde' | 'amarelo' | 'vermelho'
  alertReason: string

  // Top 3 notícias mais relevantes
  topNews: Array<{
    title: string
    source: string
    sentiment: 'positivo' | 'negativo' | 'neutro'
    relevance: string
    url: string
  }>

  // Temas identificados
  mainTopics: string[]

  // Recomendações
  recommendations: string[]

  // Score por rede
  networkScores: Array<{
    network: string
    score: number
    trend: 'subindo' | 'descendo' | 'estavel'
    insight: string
  }>

  // Análise de risco
  risks: Array<{
    description: string
    severity: 'baixo' | 'medio' | 'alto'
    action: string
  }>

  // Oportunidades
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
// PROMPT PRINCIPAL DE ANÁLISE
// ============================================

const ANALYSIS_PROMPT = `Você é um analista político especializado em monitoramento de reputação e gestão de imagem. Sua função é analisar menções na mídia e redes sociais sobre um político e gerar um relatório executivo.

INSTRUÇÕES:
1. Analise TODAS as menções fornecidas de forma objetiva
2. Identifique o sentimento predominante (positivo, negativo, neutro ou misto)
3. Detecte possíveis crises ou situações que requerem atenção
4. Identifique os principais temas sendo discutidos
5. Gere recomendações práticas e acionáveis
6. Seja direto e objetivo - este relatório será lido por assessores ocupados

FORMATO DE RESPOSTA (JSON):
{
  "summary": "Resumo executivo em 2-3 frases sobre o dia do político na mídia",
  "overallSentiment": "positivo|negativo|neutro|misto",
  "sentimentScore": 1-10,
  "alertLevel": "verde|amarelo|vermelho",
  "alertReason": "Motivo do nível de alerta",
  "topNews": [
    {
      "title": "Título da notícia",
      "source": "Fonte",
      "sentiment": "positivo|negativo|neutro",
      "relevance": "Por que é relevante",
      "url": "URL"
    }
  ],
  "mainTopics": ["tema1", "tema2"],
  "recommendations": [
    "Recomendação 1 específica e acionável",
    "Recomendação 2"
  ],
  "networkScores": [
    {
      "network": "Nome da rede",
      "score": 1-100,
      "trend": "subindo|descendo|estavel",
      "insight": "Observação sobre esta rede"
    }
  ],
  "risks": [
    {
      "description": "Descrição do risco",
      "severity": "baixo|medio|alto",
      "action": "Ação recomendada"
    }
  ],
  "opportunities": ["Oportunidade 1", "Oportunidade 2"]
}

CRITÉRIOS DE ALERTA:
- VERDE: Dia tranquilo, maioria das menções neutras ou positivas
- AMARELO: Há menções negativas que merecem atenção, mas não é crise
- VERMELHO: Crise em andamento, muitas menções negativas, assunto viral

CRITÉRIOS DE SCORE (1-10):
- 9-10: Excelente, dia muito positivo
- 7-8: Bom, mais positivo que negativo
- 5-6: Neutro, equilibrado
- 3-4: Negativo, mais críticas que elogios
- 1-2: Crítico, crise de imagem`

// ============================================
// FUNÇÃO PRINCIPAL DE ANÁLISE
// ============================================

export async function analyzeWithAI(data: DailyReportData): Promise<AIAnalysisResult> {
  // Se não tem chave, usa análise local
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key não configurada. Usando análise local.')
    return analyzeLocally(data)
  }

  try {
    const userMessage = formatDataForAI(data)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: ANALYSIS_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3, // Mais consistente
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      throw new Error(error.error?.message || 'Erro na API OpenAI')
    }

    const result = await response.json()
    const content = result.choices[0]?.message?.content

    if (!content) {
      throw new Error('Resposta vazia da OpenAI')
    }

    const analysis = JSON.parse(content) as AIAnalysisResult
    return analysis

  } catch (error) {
    console.error('Erro na análise com IA:', error)
    // Fallback para análise local
    return analyzeLocally(data)
  }
}

// ============================================
// FORMATA DADOS PARA ENVIAR À IA
// ============================================

function formatDataForAI(data: DailyReportData): string {
  let message = `RELATÓRIO DE MONITORAMENTO - ${data.date}\n\n`
  message += `POLÍTICO: ${data.politicianName}\n`
  if (data.party) message += `PARTIDO: ${data.party}\n`
  if (data.position) message += `CARGO: ${data.position}\n`
  message += '\n'

  // Menções na mídia
  message += `=== MENÇÕES NA MÍDIA (${data.mentions.length} total) ===\n\n`

  data.mentions.slice(0, 20).forEach((mention, i) => {
    message += `${i + 1}. [${mention.platform.toUpperCase()}] ${mention.title}\n`
    message += `   Fonte: ${mention.source}\n`
    message += `   Data: ${mention.publishedAt}\n`
    if (mention.content) {
      message += `   Resumo: ${mention.content.substring(0, 200)}...\n`
    }
    message += `   URL: ${mention.url}\n\n`
  })

  // Dados das redes sociais
  message += `\n=== REDES SOCIAIS ===\n\n`

  data.networks.forEach(network => {
    message += `${network.network.toUpperCase()}:\n`
    message += `- Total de menções: ${network.mentions}\n`
    message += `- Positivas: ${network.positive}\n`
    message += `- Negativas: ${network.negative}\n`
    message += `- Neutras: ${network.neutral}\n`

    if (network.topPosts.length > 0) {
      message += `- Top posts:\n`
      network.topPosts.slice(0, 3).forEach((post, i) => {
        message += `  ${i + 1}. "${post.content.substring(0, 100)}..." - @${post.author} (${post.engagement} engajamento)\n`
      })
    }
    message += '\n'
  })

  message += `\nAnalise os dados acima e gere o relatório no formato JSON especificado.`

  return message
}

// ============================================
// ANÁLISE LOCAL (FALLBACK SEM API)
// ============================================

function analyzeLocally(data: DailyReportData): AIAnalysisResult {
  const totalMentions = data.mentions.length

  // Análise de sentimento por palavras-chave
  const positiveWords = [
    'aprova', 'conquista', 'sucesso', 'vitória', 'apoio', 'elogia', 'destaca',
    'cresce', 'avança', 'lidera', 'popular', 'favorito', 'melhora', 'benefício'
  ]

  const negativeWords = [
    'critica', 'acusa', 'investiga', 'denuncia', 'rejeita', 'crise', 'escândalo',
    'corrupção', 'fraude', 'prisão', 'derrota', 'perde', 'queda', 'protesto', 'polêmica'
  ]

  let positiveCount = 0
  let negativeCount = 0

  const analyzedMentions = data.mentions.map(mention => {
    const text = `${mention.title} ${mention.content || ''}`.toLowerCase()
    let sentiment: 'positivo' | 'negativo' | 'neutro' = 'neutro'

    const posMatches = positiveWords.filter(w => text.includes(w)).length
    const negMatches = negativeWords.filter(w => text.includes(w)).length

    if (posMatches > negMatches) {
      sentiment = 'positivo'
      positiveCount++
    } else if (negMatches > posMatches) {
      sentiment = 'negativo'
      negativeCount++
    }

    return { ...mention, sentiment }
  })

  // Calcula score (1-10)
  let sentimentScore = 5
  if (totalMentions > 0) {
    const ratio = (positiveCount - negativeCount) / totalMentions
    sentimentScore = Math.round(5 + ratio * 5)
    sentimentScore = Math.max(1, Math.min(10, sentimentScore))
  }

  // Determina sentimento geral
  let overallSentiment: 'positivo' | 'negativo' | 'neutro' | 'misto' = 'neutro'
  if (positiveCount > negativeCount * 1.5) overallSentiment = 'positivo'
  else if (negativeCount > positiveCount * 1.5) overallSentiment = 'negativo'
  else if (positiveCount > 0 && negativeCount > 0) overallSentiment = 'misto'

  // Determina alerta
  let alertLevel: 'verde' | 'amarelo' | 'vermelho' = 'verde'
  let alertReason = 'Dia tranquilo, sem situações críticas detectadas'

  if (negativeCount > totalMentions * 0.5 && negativeCount > 3) {
    alertLevel = 'vermelho'
    alertReason = `Alta concentração de menções negativas (${negativeCount} de ${totalMentions})`
  } else if (negativeCount > totalMentions * 0.3 && negativeCount > 2) {
    alertLevel = 'amarelo'
    alertReason = `Aumento de menções negativas detectado - monitorar de perto`
  }

  // Top 3 notícias
  const topNews = analyzedMentions
    .slice(0, 3)
    .map(m => ({
      title: m.title,
      source: m.source,
      sentiment: m.sentiment,
      relevance: m.sentiment === 'negativo'
        ? 'Requer atenção - conteúdo crítico'
        : m.sentiment === 'positivo'
          ? 'Oportunidade de amplificação'
          : 'Menção neutra',
      url: m.url
    }))

  // Extrai tópicos
  const topicKeywords: Record<string, string[]> = {
    'economia': ['economia', 'econômico', 'inflação', 'pib', 'emprego'],
    'saúde': ['saúde', 'hospital', 'vacina', 'sus'],
    'educação': ['educação', 'escola', 'universidade'],
    'segurança': ['segurança', 'polícia', 'crime', 'violência'],
    'eleições': ['eleição', 'votação', 'campanha', 'candidato']
  }

  const allText = data.mentions.map(m => m.title.toLowerCase()).join(' ')
  const mainTopics = Object.entries(topicKeywords)
    .filter(([_, keywords]) => keywords.some(k => allText.includes(k)))
    .map(([topic]) => topic)
    .slice(0, 3)

  // Gera recomendações
  const recommendations: string[] = []

  if (alertLevel === 'vermelho') {
    recommendations.push('Prioridade: Avaliar necessidade de nota oficial ou pronunciamento')
    recommendations.push('Monitorar evolução das menções negativas nas próximas horas')
  } else if (alertLevel === 'amarelo') {
    recommendations.push('Acompanhar de perto os temas que geraram menções negativas')
    recommendations.push('Preparar respostas caso a situação escale')
  } else {
    recommendations.push('Aproveitar momento favorável para comunicações positivas')
    recommendations.push('Considerar amplificar notícias positivas nas redes sociais')
  }

  if (positiveCount > 0) {
    recommendations.push(`Oportunidade: ${positiveCount} menções positivas podem ser amplificadas`)
  }

  // Scores por rede
  const networkScores = data.networks.map(network => {
    const total = network.positive + network.negative + network.neutral
    let score = 50
    if (total > 0) {
      score = Math.round(50 + ((network.positive - network.negative) / total) * 50)
    }

    return {
      network: network.network,
      score: Math.max(0, Math.min(100, score)),
      trend: 'estavel' as const,
      insight: total > 0
        ? `${network.mentions} menções, ${network.positive} positivas`
        : 'Sem dados suficientes'
    }
  })

  // Riscos
  const risks = negativeCount > 0 ? [{
    description: `${negativeCount} menções negativas detectadas`,
    severity: negativeCount > 5 ? 'alto' as const : negativeCount > 2 ? 'medio' as const : 'baixo' as const,
    action: 'Monitorar evolução e preparar posicionamento se necessário'
  }] : []

  // Oportunidades
  const opportunities = positiveCount > 0
    ? [`${positiveCount} menções positivas podem ser aproveitadas para reforçar imagem`]
    : []

  // Resumo
  const summary = `Hoje foram registradas ${totalMentions} menções sobre ${data.politicianName}. ` +
    `${positiveCount} positivas, ${negativeCount} negativas e ${totalMentions - positiveCount - negativeCount} neutras. ` +
    (alertLevel === 'verde'
      ? 'Dia sem grandes ocorrências.'
      : alertLevel === 'amarelo'
        ? 'Atenção recomendada para algumas menções críticas.'
        : 'Situação requer ação imediata.')

  return {
    summary,
    overallSentiment,
    sentimentScore,
    alertLevel,
    alertReason,
    topNews,
    mainTopics: mainTopics.length > 0 ? mainTopics : ['política'],
    recommendations,
    networkScores,
    risks,
    opportunities
  }
}

// ============================================
// ANÁLISE RÁPIDA DE TEXTO (para sentimento individual)
// ============================================

export async function analyzeSentimentAI(text: string): Promise<{
  sentiment: 'positivo' | 'negativo' | 'neutro'
  confidence: number
  explanation: string
}> {
  if (!OPENAI_API_KEY) {
    // Fallback local
    return analyzeSentimentLocal(text)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Analise o sentimento do texto em relação a um político. Responda em JSON: {"sentiment": "positivo|negativo|neutro", "confidence": 0-1, "explanation": "breve explicação"}'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) throw new Error('API error')

    const result = await response.json()
    return JSON.parse(result.choices[0]?.message?.content || '{}')
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

  if (posMatches > negMatches) {
    return { sentiment: 'positivo', confidence: 0.7, explanation: 'Palavras positivas detectadas' }
  } else if (negMatches > posMatches) {
    return { sentiment: 'negativo', confidence: 0.7, explanation: 'Palavras negativas detectadas' }
  }

  return { sentiment: 'neutro', confidence: 0.5, explanation: 'Conteúdo aparentemente neutro' }
}

// ============================================
// VERIFICAR SE API ESTÁ CONFIGURADA
// ============================================

export function isAIConfigured(): boolean {
  return !!OPENAI_API_KEY
}

export function getAIStatus(): { configured: boolean; model: string } {
  return {
    configured: !!OPENAI_API_KEY,
    model: OPENAI_MODEL
  }
}
