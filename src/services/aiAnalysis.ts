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
// PROMPT PRINCIPAL DE ANÁLISE (Estilo Profissional)
// ============================================

const ANALYSIS_PROMPT = `Você é um analista de MONITORAMENTO DE MÍDIA político, NÃO um analista político partidário.

⚠️ REGRAS DE IMPARCIALIDADE OBRIGATÓRIAS:
1. Você NÃO tem opinião política. Analisa FATOS e TOM da cobertura.
2. Avalie o IMPACTO NA IMAGEM do político, não se a pauta é "boa" ou "ruim" ideologicamente.
3. Crítica ao político = NEGATIVO, independente de quem critica.
4. Elogio ao político = POSITIVO, independente de quem elogia.
5. Notícia factual sem tom = NEUTRO.
6. Trate políticos de TODOS os partidos com os MESMOS critérios.

CRITÉRIOS DE SCORE (0-10):
- 10 = Cobertura muito favorável (elogios explícitos, conquista destacada)
- 7.5 = Cobertura favorável (tom positivo, ação bem-sucedida)
- 5 = Cobertura neutra (factual, informativo)
- 2.5 = Cobertura desfavorável (críticas, problemas)
- 0 = Cobertura muito desfavorável (escândalo, denúncia grave)

FÓRMULA DO SCORE GERAL PONDERADO:
(Mídia × 0.30) + (Twitter × 0.20) + (Instagram × 0.15) + (YouTube × 0.15) + (TikTok × 0.15) + (Telegram × 0.05)

CRITÉRIOS DE ALERTA DE CRISE:
- VERDE: Nenhum conteúdo com score 0 ou 2.5, score geral >= 5
- AMARELO: 1-2 conteúdos negativos OU score entre 3.5 e 4.9
- VERMELHO: Conteúdo viral negativo OU score < 3.5

TASKS:
1. **SUMÁRIO EXECUTIVO (12-18 frases)** cobrindo:
   - Visão geral: como foi o dia? (2-3 frases)
   - Mídia tradicional: principais notícias e tom (2-3 frases)
   - Redes sociais: o que viralizou, qual rede se destacou (3-4 frases)
   - Pontos de atenção: críticas, polêmicas, riscos (2-3 frases)
   - Oportunidades: pautas positivas, momentos para capitalizar (2-3 frases)
   - Conclusão: recomendação principal (1-2 frases)

2. **ANÁLISE POR REDE** - Para cada fonte:
   - Score de 0 a 10 (média do tom das publicações)
   - Resumo de 2-3 frases
   - Top 3 destaques com métricas

3. **RECOMENDAÇÕES**: 3 ações práticas para a assessoria de imprensa

FORMATO DE RESPOSTA (JSON estrito):
{
  "summary": "string (sumário executivo de 12-18 frases em um único parágrafo)",
  "overallSentiment": "positivo|negativo|neutro|misto",
  "sentimentScore": number (0-10, usando a fórmula ponderada),
  "alertLevel": "verde|amarelo|vermelho",
  "alertReason": "string (motivo do nível de alerta)",
  "topNews": [
    {"title": "string", "source": "string", "sentiment": "positivo|negativo|neutro", "relevance": "string", "url": "string"}
  ],
  "mainTopics": ["string"],
  "recommendations": ["string (ação específica e acionável)"],
  "networkScores": [
    {"network": "string", "score": number (0-10), "trend": "subindo|descendo|estavel", "insight": "string (2-3 frases de análise)"}
  ],
  "risks": [
    {"description": "string", "severity": "baixo|medio|alto", "action": "string (ação recomendada)"}
  ],
  "opportunities": ["string"]
}`

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
// FORMATA DADOS PARA ENVIAR À IA (Formato Profissional)
// ============================================

function formatDataForAI(data: DailyReportData): string {
  // Agrupa menções por fonte
  const midiaMencoes = data.mentions.filter(m => m.platform === 'midia' || m.platform === 'news')
  const youtubeMencoes = data.mentions.filter(m => m.platform === 'youtube')

  // Calcula estatísticas por rede
  const calcStats = (network: NetworkData | undefined) => ({
    quantidade: network?.mentions || 0,
    engajamento_total: network?.topPosts?.reduce((sum, p) => sum + (p.engagement || 0), 0) || 0,
    positivas: network?.positive || 0,
    negativas: network?.negative || 0,
    neutras: network?.neutral || 0
  })

  const twitterData = data.networks.find(n => n.network.toLowerCase().includes('twitter'))
  const instagramData = data.networks.find(n => n.network.toLowerCase().includes('instagram'))
  const youtubeData = data.networks.find(n => n.network.toLowerCase().includes('youtube'))
  const tiktokData = data.networks.find(n => n.network.toLowerCase().includes('tiktok'))

  const stats = {
    midia: { quantidade: midiaMencoes.length, engajamento_total: 0 },
    twitter: calcStats(twitterData),
    instagram: calcStats(instagramData),
    youtube: calcStats(youtubeData),
    tiktok: calcStats(tiktokData)
  }

  let message = `Analise a cobertura do político ${data.politicianName}`
  if (data.party) message += ` (${data.party})`
  if (data.position) message += ` - ${data.position}`
  message += ` nas últimas 24 horas.\n\n`

  message += `📅 Data: ${data.date}\n\n`
  message += `═══════════════════════════════════════\n`
  message += `DADOS POR FONTE:\n`
  message += `═══════════════════════════════════════\n\n`

  // Mídia Tradicional
  message += `📰 MÍDIA TRADICIONAL (${stats.midia.quantidade} itens):\n`
  if (midiaMencoes.length > 0) {
    message += JSON.stringify(midiaMencoes.slice(0, 15).map(m => ({
      titulo: m.title,
      fonte: m.source,
      url: m.url,
      data: m.publishedAt
    })), null, 2) + '\n\n'
  } else {
    message += 'Nenhuma menção encontrada\n\n'
  }

  // Twitter/X
  message += `🐦 X/TWITTER (${stats.twitter.quantidade} itens, ${stats.twitter.engajamento_total} engajamento):\n`
  if (twitterData?.topPosts?.length) {
    message += JSON.stringify(twitterData.topPosts.slice(0, 10).map(p => ({
      texto: p.content?.substring(0, 200),
      autor: p.author,
      engajamento: p.engagement,
      url: p.url
    })), null, 2) + '\n\n'
  } else {
    message += 'Nenhuma menção encontrada\n\n'
  }

  // Instagram
  message += `📸 INSTAGRAM (${stats.instagram.quantidade} itens, ${stats.instagram.engajamento_total} engajamento):\n`
  if (instagramData?.topPosts?.length) {
    message += JSON.stringify(instagramData.topPosts.slice(0, 10).map(p => ({
      texto: p.content?.substring(0, 150),
      autor: p.author,
      engajamento: p.engagement,
      url: p.url
    })), null, 2) + '\n\n'
  } else {
    message += 'Nenhuma menção encontrada\n\n'
  }

  // YouTube
  message += `🎬 YOUTUBE (${stats.youtube.quantidade} itens, ${stats.youtube.engajamento_total} engajamento):\n`
  if (youtubeData?.topPosts?.length) {
    message += JSON.stringify(youtubeData.topPosts.slice(0, 10).map(p => ({
      titulo: p.content,
      canal: p.author,
      engajamento: p.engagement,
      url: p.url
    })), null, 2) + '\n\n'
  } else if (youtubeMencoes.length > 0) {
    message += JSON.stringify(youtubeMencoes.slice(0, 10).map(m => ({
      titulo: m.title,
      canal: m.source,
      url: m.url
    })), null, 2) + '\n\n'
  } else {
    message += 'Nenhuma menção encontrada\n\n'
  }

  // TikTok
  message += `📱 TIKTOK (${stats.tiktok.quantidade} itens, ${stats.tiktok.engajamento_total} engajamento):\n`
  if (tiktokData?.topPosts?.length) {
    message += JSON.stringify(tiktokData.topPosts.slice(0, 10).map(p => ({
      texto: p.content?.substring(0, 150),
      autor: p.author,
      engajamento: p.engagement,
      url: p.url
    })), null, 2) + '\n\n'
  } else {
    message += 'Nenhuma menção encontrada\n\n'
  }

  message += `═══════════════════════════════════════\n`
  message += `ESTATÍSTICAS RESUMIDAS:\n`
  message += `═══════════════════════════════════════\n`
  message += `- Mídia: ${stats.midia.quantidade} itens\n`
  message += `- Twitter: ${stats.twitter.quantidade} itens (${stats.twitter.engajamento_total} engajamento)\n`
  message += `- Instagram: ${stats.instagram.quantidade} itens (${stats.instagram.engajamento_total} engajamento)\n`
  message += `- YouTube: ${stats.youtube.quantidade} itens (${stats.youtube.engajamento_total} engajamento)\n`
  message += `- TikTok: ${stats.tiktok.quantidade} itens (${stats.tiktok.engajamento_total} engajamento)\n\n`

  message += `Gere o relatório completo no formato JSON especificado, seguindo TODAS as regras de imparcialidade.`

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
