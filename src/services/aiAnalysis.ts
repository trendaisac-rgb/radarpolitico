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
// PROMPT - ANALISTA POLÍTICO DE ALTO PADRÃO
// ============================================

const ANALYSIS_PROMPT = `Você é um ANALISTA POLÍTICO SÊNIOR de alto padrão, com experiência em comunicação política, gestão de crises e inteligência de mídia. Sua função é produzir relatórios executivos profundos e acionáveis.

## PRINCÍPIOS FUNDAMENTAIS

1. **IMPARCIALIDADE ABSOLUTA**: Você NÃO tem viés partidário. Trate TODOS os políticos — esquerda, direita, centro — com os MESMOS critérios técnicos. Sua análise é baseada exclusivamente em DADOS e PERCEPÇÃO PÚBLICA, nunca em ideologia.

2. **SENTIMENTO POPULAR**: Classifique o sentimento (positivo, negativo, neutro) baseado em como a POPULAÇÃO e a MÍDIA percebem os fatos — não se os fatos são objetivamente bons ou ruins. Uma CPI pode ser vista como "justiça" por uns e "perseguição" por outros: analise o TOM PREDOMINANTE da cobertura.

3. **ANÁLISE BASEADA EM DADOS**: Use SOMENTE os dados fornecidos. NÃO invente dados, números ou menções que não existam. Se não há dados suficientes, diga isso claramente.

4. **LIMITAÇÃO V1**: Este sistema monitora APENAS Mídia Tradicional (Google News) e YouTube. NÃO mencione Twitter, Instagram, TikTok, Facebook ou Telegram.

## ESTRUTURA DO RELATÓRIO EXECUTIVO

O "summary" deve ser um RELATÓRIO EXECUTIVO completo (12-20 frases), estruturado assim:

1. **Panorama Geral**: Contextualize a posição atual do político na mídia — volume de exposição, tom predominante, momento político.
2. **Análise de Cobertura**: Detalhe os temas mais abordados, as fontes de maior impacto e o enquadramento das notícias (favorável, crítico, factual).
3. **Dinâmica de Sentimento**: Explique a proporção entre menções positivas, negativas e neutras. Identifique se há TENDÊNCIA (melhora, piora, estabilidade).
4. **Impacto na Imagem Pública**: Avalie como a cobertura atual afeta a PERCEPÇÃO POPULAR do político — capital político, credibilidade, vulnerabilidades expostas.
5. **Cenário de Curto Prazo**: Projete os próximos dias — riscos iminentes, janelas de oportunidade, temas que podem escalar.

## CRITÉRIOS DE CLASSIFICAÇÃO DE SENTIMENTO

Classifique cada menção pelo TOM DA COBERTURA, não pelo conteúdo objetivo:
- **Positivo**: Cobertura que fortalece a imagem, destaca realizações, conquistas, apoio popular, elogios
- **Negativo**: Cobertura que enfraquece a imagem, destaca falhas, críticas, investigações, rejeição popular
- **Neutro**: Cobertura factual sem tom claro, ou cobertura que não impacta significativamente a imagem

## CRITÉRIOS DE SCORE (0-10):
- 9-10 = Cobertura amplamente favorável, capital político em alta
- 7-8 = Cobertura predominantemente positiva, boa fase
- 5-6 = Cobertura equilibrada, momento estável
- 3-4 = Cobertura predominantemente crítica, desgaste
- 1-2 = Cobertura intensamente negativa, crise
- 0 = Crise severa de imagem

## RECOMENDAÇÕES

Forneça recomendações ESTRATÉGICAS e ACIONÁVEIS, como um consultor político faria:
- Ações de comunicação específicas
- Posicionamentos recomendados
- Riscos a mitigar com urgência
- Oportunidades de pauta a explorar
- Ajustes de narrativa

## FORMATO DE RESPOSTA (JSON estrito):
{
  "summary": "string (relatório executivo de 12-20 frases, profundo e analítico)",
  "overallSentiment": "positivo|negativo|neutro|misto",
  "sentimentScore": number (0-10),
  "alertLevel": "verde|amarelo|vermelho",
  "alertReason": "string (explicação técnica do nível de alerta)",
  "topNews": [{"title": "string", "source": "string", "sentiment": "positivo|negativo|neutro", "relevance": "string (análise do impacto)", "url": "string"}],
  "mainTopics": ["string"],
  "recommendations": ["string (recomendações estratégicas detalhadas)"],
  "networkScores": [{"network": "string", "score": number (0-10), "trend": "subindo|descendo|estavel", "insight": "string"}],
  "risks": [{"description": "string (risco detalhado)", "severity": "baixo|medio|alto", "action": "string (ação recomendada)"}],
  "opportunities": ["string (oportunidades estratégicas)"]
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
        temperature: 0.4,
        maxTokens: 3500
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
  const positiveWords = ['aprova', 'conquista', 'sucesso', 'vitória', 'apoio', 'elogia', 'destaca', 'cresce', 'avança', 'lidera', 'popular', 'favorito', 'melhora', 'benefício', 'inaugura', 'entrega', 'investe', 'amplia', 'recorde', 'homenage']
  const negativeWords = ['critica', 'acusa', 'investiga', 'denuncia', 'rejeita', 'crise', 'escândalo', 'corrupção', 'fraude', 'prisão', 'derrota', 'perde', 'queda', 'protesto', 'polêmica', 'irregularidade', 'suspeita', 'indicia', 'condena', 'impeachment']

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

  const neutralCount = totalMentions - positiveCount - negativeCount

  let sentimentScore = 5
  if (totalMentions > 0) {
    const ratio = (positiveCount - negativeCount) / totalMentions
    sentimentScore = Math.round(5 + ratio * 5)
    sentimentScore = Math.max(0, Math.min(10, sentimentScore))
  }

  let overallSentiment: 'positivo' | 'negativo' | 'neutro' | 'misto' = 'neutro'
  if (positiveCount > negativeCount * 1.5) overallSentiment = 'positivo'
  else if (negativeCount > positiveCount * 1.5) overallSentiment = 'negativo'
  else if (positiveCount > 0 && negativeCount > 0) overallSentiment = 'misto'

  let alertLevel: 'verde' | 'amarelo' | 'vermelho' = 'verde'
  let alertReason = 'Cenário estável — nenhuma situação crítica detectada na cobertura atual'
  if (negativeCount > totalMentions * 0.5 && negativeCount > 3) {
    alertLevel = 'vermelho'
    alertReason = `Concentração crítica de menções negativas: ${negativeCount} de ${totalMentions} menções têm tom desfavorável, indicando possível crise de imagem`
  } else if (negativeCount > totalMentions * 0.3 && negativeCount > 2) {
    alertLevel = 'amarelo'
    alertReason = `Tendência de aumento nas menções negativas — ${negativeCount} menções com tom crítico detectadas. Recomenda-se monitoramento intensificado`
  }

  const topNews = analyzedMentions.slice(0, 5).map(m => ({
    title: m.title,
    source: m.source,
    sentiment: m.sentiment,
    relevance: m.sentiment === 'negativo'
      ? 'Cobertura com tom crítico — potencial impacto negativo na percepção pública'
      : m.sentiment === 'positivo'
      ? 'Cobertura favorável — oportunidade de amplificação e fortalecimento de narrativa'
      : 'Cobertura factual neutra — baixo impacto direto na imagem',
    url: m.url
  }))

  // Extrair tópicos principais dos títulos
  const topicKeywords: Record<string, number> = {}
  data.mentions.forEach(m => {
    const words = (m.title || '').split(/\s+/).filter(w => w.length > 4)
    words.forEach(w => {
      const lower = w.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñ]/g, '')
      if (lower.length > 4) topicKeywords[lower] = (topicKeywords[lower] || 0) + 1
    })
  })
  const mainTopics = Object.entries(topicKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))

  // Resumo executivo completo
  const posPercent = totalMentions > 0 ? Math.round((positiveCount / totalMentions) * 100) : 0
  const negPercent = totalMentions > 0 ? Math.round((negativeCount / totalMentions) * 100) : 0
  const neuPercent = totalMentions > 0 ? Math.round((neutralCount / totalMentions) * 100) : 0

  const partyInfo = data.party ? ` (${data.party})` : ''
  const positionInfo = data.position ? `, ${data.position}` : ''

  let summary = `PANORAMA GERAL: No período analisado (${data.date}), ${data.politicianName}${partyInfo}${positionInfo} registrou ${totalMentions} menções na mídia tradicional e YouTube. `

  if (totalMentions === 0) {
    summary += 'Não foram identificadas menções relevantes no período, o que pode indicar baixa exposição midiática ou ausência de pautas com repercussão significativa. '
    summary += 'Recomenda-se avaliar se a estratégia de comunicação está gerando visibilidade adequada.'
  } else {
    // Análise de cobertura
    summary += `ANÁLISE DE COBERTURA: A distribuição de sentimento das menções é: ${posPercent}% positivas (${positiveCount}), ${negPercent}% negativas (${negativeCount}) e ${neuPercent}% neutras (${neutralCount}). `

    if (overallSentiment === 'positivo') {
      summary += `O tom predominante da cobertura é favorável, com as menções positivas superando as negativas de forma significativa. Isso sugere um momento de capital político em alta e boa receptividade pública. `
    } else if (overallSentiment === 'negativo') {
      summary += `O tom predominante é crítico, com as menções negativas superando as positivas. Esse padrão indica desgaste na percepção pública e potencial vulnerabilidade da imagem. `
    } else if (overallSentiment === 'misto') {
      summary += `A cobertura apresenta polarização, com presença significativa tanto de menções favoráveis quanto críticas. Isso indica um cenário disputado na opinião pública. `
    } else {
      summary += `A cobertura é predominantemente factual e neutra, sem tendência clara positiva ou negativa. O momento é estável, sem grandes oscilações de percepção. `
    }

    // Impacto na imagem
    summary += `IMPACTO NA IMAGEM: O score de percepção pública está em ${sentimentScore}/10. `
    if (sentimentScore >= 7) {
      summary += 'A imagem pública encontra-se fortalecida, com a cobertura contribuindo para consolidar uma narrativa favorável. '
    } else if (sentimentScore >= 5) {
      summary += 'A imagem se mantém em patamar neutro-positivo, sem grandes ameaças, mas também sem ganhos expressivos de capital político. '
    } else if (sentimentScore >= 3) {
      summary += 'A imagem pública demonstra sinais de desgaste. É recomendável ação proativa para reverter a tendência antes que se consolide. '
    } else {
      summary += 'A imagem pública está comprometida. A concentração de cobertura negativa exige resposta imediata e coordenada da equipe de comunicação. '
    }

    // Cenário de curto prazo
    summary += 'CENÁRIO DE CURTO PRAZO: '
    if (alertLevel === 'vermelho') {
      summary += 'O volume de menções negativas sugere risco de escalada. Temas críticos podem ganhar tração nos próximos dias se não houver posicionamento estratégico.'
    } else if (alertLevel === 'amarelo') {
      summary += 'Há indicadores de atenção que merecem acompanhamento próximo. Uma gestão ativa da agenda pode evitar que temas negativos ganhem relevância.'
    } else {
      summary += 'O cenário de curto prazo é favorável para ações proativas de comunicação. Aproveitar o momento estável para fortalecer a agenda positiva é a estratégia recomendada.'
    }
  }

  // Recomendações estratégicas
  const recommendations: string[] = []
  if (alertLevel === 'vermelho') {
    recommendations.push('URGENTE: Avaliar necessidade de pronunciamento oficial ou nota de esclarecimento sobre os temas críticos identificados')
    recommendations.push('Ativar protocolo de gestão de crise — monitorar em tempo real a evolução das menções negativas nas próximas 24-48h')
    recommendations.push('Mapear os veículos e formadores de opinião com maior impacto negativo para abordagem estratégica')
  } else if (alertLevel === 'amarelo') {
    recommendations.push('Intensificar monitoramento dos temas que geraram cobertura negativa — preparar respostas caso haja escalada')
    recommendations.push('Considerar pautar veículos de mídia com agenda positiva para contrabalançar as menções críticas')
    recommendations.push('Reforçar presença em canais próprios com conteúdo que demonstre realizações e resultados')
  } else {
    recommendations.push('Aproveitar o momento favorável para avançar pautas estratégicas e amplificar conquistas recentes')
    recommendations.push('Fortalecer relacionamento com veículos que têm dado cobertura positiva — oferecer conteúdo exclusivo')
    recommendations.push('Investir em conteúdo de YouTube/vídeo, formato com alto potencial de engajamento e viralização')
  }

  if (positiveCount > 0) {
    recommendations.push(`Amplificar as ${positiveCount} menções positivas em canais próprios — compartilhar, comentar e expandir a narrativa favorável`)
  }
  if (totalMentions < 5) {
    recommendations.push('Volume de menções baixo — considerar ações de assessoria de imprensa para aumentar a visibilidade na mídia')
  }

  // Riscos
  const risks: Array<{ description: string; severity: 'baixo' | 'medio' | 'alto'; action: string }> = []
  if (negativeCount > 0) {
    const severity = negativeCount > 5 ? 'alto' : negativeCount > 2 ? 'medio' : 'baixo'
    risks.push({
      description: `${negativeCount} menções com tom crítico detectadas — temas negativos podem ganhar tração se não forem gerenciados`,
      severity,
      action: severity === 'alto'
        ? 'Ação imediata recomendada: preparar posicionamento e monitorar repercussão em tempo real'
        : 'Acompanhar evolução e preparar argumentos de defesa caso haja escalada'
    })
  }
  if (totalMentions > 10 && negPercent > 40) {
    risks.push({
      description: 'Proporção elevada de menções negativas pode indicar início de ciclo de crise midiática',
      severity: 'alto',
      action: 'Reunir equipe de comunicação para definir estratégia de contenção nas próximas 24h'
    })
  }

  // Oportunidades
  const opportunities: string[] = []
  if (positiveCount > 0) {
    opportunities.push(`Capitalizar as ${positiveCount} menções positivas — usar como prova social em materiais de comunicação e redes`)
  }
  if (overallSentiment === 'positivo' || sentimentScore >= 7) {
    opportunities.push('Momento favorável para lançar projetos, anúncios ou propostas — a percepção pública está receptiva')
  }
  if (neutralCount > positiveCount && neutralCount > 3) {
    opportunities.push('Grande volume de menções neutras indica espaço para moldar a narrativa — assessoria de imprensa pode converter cobertura factual em favorável')
  }

  return {
    summary,
    overallSentiment,
    sentimentScore,
    alertLevel,
    alertReason,
    topNews,
    mainTopics: mainTopics.length > 0 ? mainTopics : ['política'],
    recommendations,
    networkScores: data.networks.map(n => ({
      network: n.network,
      score: n.mentions > 0 ? Math.round(50 + ((n.positive - n.negative) / n.mentions) * 50) : 50,
      trend: 'estavel' as const,
      insight: n.mentions > 0
        ? `${n.mentions} menções monitoradas: ${n.positive} favoráveis, ${n.negative} críticas. ${n.positive > n.negative ? 'Tom predominantemente positivo.' : n.negative > n.positive ? 'Tom predominantemente crítico — atenção recomendada.' : 'Cobertura equilibrada.'}`
        : 'Sem dados suficientes para análise neste canal'
    })),
    risks,
    opportunities
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
