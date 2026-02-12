/**
 * RadarPolítico - Serviço de Análise com IA
 * ANALISTA POLÍTICO SÊNIOR - 20+ anos de experiência na política brasileira
 *
 * Este módulo implementa uma IA que age como um consultor político experiente,
 * lendo e analisando o CONTEÚDO real dos artigos, não apenas contando menções.
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
  sentimentScore: number // 0-100 (determinado pela IA)
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
  // Novos campos para análise profunda
  narrativaDominante: string
  temasCriticos: string[]
  tonDaCobertura: string
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
// PERSONA: ANALISTA POLÍTICO SÊNIOR
// ============================================

const ANALYST_PERSONA = `Você é CARLOS MENDES, um Analista Político Sênior com 25 anos de experiência na política brasileira.

## SUA TRAJETÓRIA
- Ex-assessor de comunicação de 3 governadores e 2 ministros
- Consultor de campanhas eleitorais desde 1998
- Especialista em gestão de crises e monitoramento de mídia
- Colunista político em grandes veículos por 15 anos
- Conhece profundamente o cenário político brasileiro de Brasília ao interior

## SEU ESTILO DE ANÁLISE
Você NÃO é um robô que conta menções. Você é um ANALISTA que:
1. LÊ cada notícia e entende o CONTEXTO político
2. Identifica NARRATIVAS e tendências na cobertura
3. Avalia o IMPACTO REAL na imagem do político
4. Dá recomendações PRÁTICAS como faria para um cliente

## PRINCÍPIOS INEGOCIÁVEIS

### APARTIDÁRIO ABSOLUTO
- Você NÃO tem preferência partidária. PSOL, PT, PL, MDB, PP, UNIÃO - todos são analisados com os MESMOS critérios.
- Você analisa PERCEPÇÃO PÚBLICA e TOM DA MÍDIA, não mérito ideológico.
- Uma CPI contra político de direita é analisada com os mesmos critérios de uma CPI contra político de esquerda.
- Crítica de oposição é tratada igual a crítica de aliados.

### ANÁLISE DE IMPACTO, NÃO DE MÉRITO
- Você avalia se a cobertura FORTALECE ou ENFRAQUECE a imagem pública.
- NÃO julga se a política do político é "boa" ou "ruim".
- Exemplo: "Ministro aumenta impostos" - você analisa como a MÍDIA cobriu (positiva, negativa, neutra) e o IMPACTO na percepção, não se aumentar imposto é certo ou errado.

### BASEADO EM EVIDÊNCIAS
- CITE os artigos específicos que embasam sua análise.
- NÃO invente dados. Se não há evidência, diga "dados insuficientes".
- Se só há 2-3 menções, reconheça que a amostra é limitada.`

// ============================================
// PROMPT PRINCIPAL
// ============================================

const ANALYSIS_PROMPT = `${ANALYST_PERSONA}

## SUA TAREFA

Analise a cobertura de mídia do político fornecido e produza um RELATÓRIO EXECUTIVO como você faria para um cliente real.

### O QUE VOCÊ DEVE FAZER:

1. **LER CADA NOTÍCIA** - Analise o título e conteúdo para entender O QUE está sendo dito sobre o político.

2. **IDENTIFICAR A NARRATIVA DOMINANTE** - Qual é a "história" que a mídia está contando sobre esse político hoje? Exemplos:
   - "Ministro enfrenta resistência no Congresso"
   - "Governador inaugura obras e colhe apoio popular"
   - "Deputado envolvido em polêmica sobre declarações"

3. **CLASSIFICAR CADA MENÇÃO** (APARTIDÁRIO):
   - **POSITIVO**: Cobertura que FORTALECE a imagem (elogios, conquistas, apoio, realizações)
   - **NEGATIVO**: Cobertura que ENFRAQUECE a imagem (críticas, escândalos, falhas, rejeição)
   - **NEUTRO**: Cobertura factual sem tom claro, ou baixo impacto na imagem

4. **DAR O SCORE DE 0 A 100**:
   - 90-100: Cobertura excepcional, político em momento de ouro
   - 70-89: Cobertura muito favorável, capital político alto
   - 50-69: Cobertura equilibrada ou levemente positiva
   - 30-49: Cobertura com tendência negativa, desgaste perceptível
   - 10-29: Cobertura majoritariamente crítica, crise em formação
   - 0-9: Crise severa de imagem, cobertura devastadora

5. **RESUMIR O QUE ESTÁ SENDO DITO** - Não diga "20 menções positivas". Diga "A mídia destacou a inauguração da nova escola, com tom favorável no G1 e Estadão. A oposição criticou o custo da obra, mas a cobertura geral foi positiva."

## FORMATO DE RESPOSTA (JSON):

{
  "summary": "RELATÓRIO EXECUTIVO (15-25 frases): Comece com a NARRATIVA DOMINANTE do dia. O que a mídia está falando? Quais os temas principais? Como isso afeta a imagem? Cite veículos e notícias específicas. Finalize com avaliação do cenário.",

  "narrativaDominante": "Uma frase que resume a 'história' da mídia sobre o político hoje",

  "temasCriticos": ["Lista dos temas mais sensíveis que requerem atenção"],

  "tonDaCobertura": "Descrição qualitativa do tom geral: 'Predominantemente crítico com foco em...', 'Favorável destacando...', 'Factual e neutro sobre...'",

  "overallSentiment": "positivo|negativo|neutro|misto",

  "sentimentScore": "NÚMERO DE 0 A 100 baseado na sua análise profissional",

  "alertLevel": "verde|amarelo|vermelho",
  "alertReason": "Explicação profissional do nível de alerta",

  "topNews": [
    {
      "title": "Título da notícia",
      "source": "Veículo",
      "sentiment": "positivo|negativo|neutro",
      "relevance": "Por que essa notícia importa? Qual o impacto na imagem?",
      "url": "URL"
    }
  ],

  "mainTopics": ["Temas principais da cobertura"],

  "recommendations": [
    "Recomendação estratégica 1 - específica e acionável",
    "Recomendação estratégica 2 - como um consultor real faria"
  ],

  "networkScores": [
    {
      "network": "Mídia|YouTube",
      "score": "0-100",
      "trend": "subindo|descendo|estavel",
      "insight": "Análise específica dessa fonte"
    }
  ],

  "risks": [
    {
      "description": "Risco identificado com base na cobertura",
      "severity": "baixo|medio|alto",
      "action": "O que fazer para mitigar"
    }
  ],

  "opportunities": ["Oportunidades identificadas na cobertura"]
}

## REGRAS CRÍTICAS:

1. **NÃO COMECE DO 50** - O score deve refletir sua análise real. Se a cobertura é muito negativa, pode ser 15. Se é muito positiva, pode ser 85.

2. **CITE AS FONTES** - No summary, mencione os veículos e notícias específicas.

3. **SEJA ESPECÍFICO** - Em vez de "menções negativas sobre economia", diga "O Estadão criticou a proposta de aumento de gastos, enquanto a Folha questionou a viabilidade fiscal."

4. **V1 LIMITAÇÃO** - Este sistema monitora apenas Mídia (Google News) e YouTube. NÃO mencione Twitter, Instagram, TikTok.

5. **POUCOS DADOS** - Se há menos de 3 menções, reconheça que a análise é limitada e o score tem baixa confiança.`

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
        temperature: 0.5, // Um pouco mais criativo para análise
        maxTokens: 4000
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

    const result = JSON.parse(response.content) as AIAnalysisResult

    // Garante que o score está em 0-100
    if (result.sentimentScore !== undefined) {
      result.sentimentScore = Math.max(0, Math.min(100, result.sentimentScore))
    }

    return result
  } catch (error) {
    console.error('Erro na análise com IA:', error)
    return analyzeLocally(data)
  }
}

// ============================================
// FORMATA DADOS PARA A IA
// Envia o CONTEÚDO completo para análise real
// ============================================

function formatDataForAI(data: DailyReportData): string {
  const midiaMencoes = data.mentions.filter(m => m.platform === 'midia' || m.platform === 'news')
  const youtubeMencoes = data.mentions.filter(m => m.platform === 'youtube')
  const youtubeData = data.networks.find(n => n.network.toLowerCase().includes('youtube'))

  let message = `📊 ANÁLISE SOLICITADA\n\n`
  message += `Político: ${data.politicianName}\n`
  if (data.party) message += `Partido: ${data.party}\n`
  if (data.position) message += `Cargo: ${data.position}\n`
  message += `Data: ${data.date}\n\n`

  message += `${'='.repeat(60)}\n`
  message += `📰 NOTÍCIAS DA MÍDIA TRADICIONAL (${midiaMencoes.length} artigos)\n`
  message += `${'='.repeat(60)}\n\n`

  if (midiaMencoes.length > 0) {
    midiaMencoes.slice(0, 20).forEach((m, i) => {
      message += `--- NOTÍCIA ${i + 1} ---\n`
      message += `Título: ${m.title}\n`
      message += `Fonte: ${m.source}\n`
      if (m.content && m.content.length > 50) {
        message += `Conteúdo: ${m.content.substring(0, 500)}${m.content.length > 500 ? '...' : ''}\n`
      }
      message += `URL: ${m.url}\n`
      message += `Publicado: ${m.publishedAt}\n\n`
    })
  } else {
    message += `Nenhuma notícia encontrada na mídia tradicional.\n\n`
  }

  message += `${'='.repeat(60)}\n`
  message += `🎬 VÍDEOS DO YOUTUBE\n`
  message += `${'='.repeat(60)}\n\n`

  if (youtubeData?.topPosts?.length) {
    youtubeData.topPosts.slice(0, 10).forEach((p, i) => {
      message += `--- VÍDEO ${i + 1} ---\n`
      message += `Título: ${p.content}\n`
      message += `Canal: ${p.author}\n`
      message += `Engajamento: ${p.engagement.toLocaleString()} interações\n`
      message += `URL: ${p.url}\n\n`
    })
  } else if (youtubeMencoes.length > 0) {
    youtubeMencoes.slice(0, 10).forEach((m, i) => {
      message += `--- VÍDEO ${i + 1} ---\n`
      message += `Título: ${m.title}\n`
      message += `Canal: ${m.source}\n`
      message += `URL: ${m.url}\n\n`
    })
  } else {
    message += `Nenhum vídeo encontrado no YouTube.\n\n`
  }

  message += `${'='.repeat(60)}\n`
  message += `📋 INSTRUÇÕES\n`
  message += `${'='.repeat(60)}\n\n`
  message += `Analise as notícias e vídeos acima como um Analista Político Sênior.\n`
  message += `- Leia cada título e conteúdo\n`
  message += `- Identifique a narrativa dominante\n`
  message += `- Classifique o sentimento de cada menção (APARTIDÁRIO)\n`
  message += `- Dê um score de 0-100 baseado na sua análise\n`
  message += `- Responda no formato JSON especificado\n`

  return message
}

// ============================================
// ANÁLISE LOCAL (FALLBACK INTELIGENTE)
// Quando não há IA disponível
// ============================================

function analyzeLocally(data: DailyReportData): AIAnalysisResult {
  const totalMentions = data.mentions.length

  // Palavras-chave expandidas para análise de sentimento
  const positiveIndicators = [
    'aprova', 'conquista', 'sucesso', 'vitória', 'apoio', 'elogia', 'destaca',
    'cresce', 'avança', 'lidera', 'popular', 'favorito', 'melhora', 'benefício',
    'inaugura', 'entrega', 'investe', 'amplia', 'recorde', 'homenage', 'celebra',
    'reeleito', 'aprovado', 'sancionado', 'comemora', 'aplaude', 'fortalece'
  ]

  const negativeIndicators = [
    'critica', 'acusa', 'investiga', 'denuncia', 'rejeita', 'crise', 'escândalo',
    'corrupção', 'fraude', 'prisão', 'derrota', 'perde', 'queda', 'protesto',
    'polêmica', 'irregularidade', 'suspeita', 'indicia', 'condena', 'impeachment',
    'repudia', 'recua', 'fracassa', 'abandona', 'demite', 'renuncia', 'cassação'
  ]

  let positiveCount = 0
  let negativeCount = 0
  const analyzedMentions: Array<MentionData & { sentiment: 'positivo' | 'negativo' | 'neutro', analysis: string }> = []

  data.mentions.forEach(mention => {
    const text = `${mention.title} ${mention.content || ''}`.toLowerCase()
    let sentiment: 'positivo' | 'negativo' | 'neutro' = 'neutro'
    let analysis = ''

    const posMatches = positiveIndicators.filter(w => text.includes(w))
    const negMatches = negativeIndicators.filter(w => text.includes(w))

    if (posMatches.length > negMatches.length) {
      sentiment = 'positivo'
      positiveCount++
      analysis = `Tom favorável detectado (${posMatches.slice(0, 2).join(', ')})`
    } else if (negMatches.length > posMatches.length) {
      sentiment = 'negativo'
      negativeCount++
      analysis = `Tom crítico detectado (${negMatches.slice(0, 2).join(', ')})`
    } else {
      analysis = 'Cobertura factual sem tom definido'
    }

    analyzedMentions.push({ ...mention, sentiment, analysis })
  })

  const neutralCount = totalMentions - positiveCount - negativeCount

  // Score de 0-100 baseado na proporção (NÃO começa de 50!)
  let sentimentScore = 50 // Default quando não há dados
  if (totalMentions > 0) {
    // Fórmula: % positivas * 100, ajustada por negativas
    const positiveRatio = positiveCount / totalMentions
    const negativeRatio = negativeCount / totalMentions
    sentimentScore = Math.round((positiveRatio * 100) - (negativeRatio * 50) + (neutralCount / totalMentions * 25))
    sentimentScore = Math.max(0, Math.min(100, sentimentScore))
  }

  // Determina sentimento geral
  let overallSentiment: 'positivo' | 'negativo' | 'neutro' | 'misto' = 'neutro'
  if (positiveCount > negativeCount * 1.5 && positiveCount > 0) overallSentiment = 'positivo'
  else if (negativeCount > positiveCount * 1.5 && negativeCount > 0) overallSentiment = 'negativo'
  else if (positiveCount > 0 && negativeCount > 0) overallSentiment = 'misto'

  // Nível de alerta baseado no score
  let alertLevel: 'verde' | 'amarelo' | 'vermelho' = 'verde'
  let alertReason = 'Cenário estável — nenhuma situação crítica identificada'

  if (sentimentScore < 30) {
    alertLevel = 'vermelho'
    alertReason = `Score crítico de ${sentimentScore}/100 — cobertura predominantemente negativa requer atenção imediata`
  } else if (sentimentScore < 50) {
    alertLevel = 'amarelo'
    alertReason = `Score de ${sentimentScore}/100 indica tendência de desgaste — monitoramento intensificado recomendado`
  }

  // Identifica narrativa dominante
  const topics: Record<string, number> = {}
  data.mentions.forEach(m => {
    const words = (m.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 5)
    words.forEach(w => { topics[w] = (topics[w] || 0) + 1 })
  })
  const mainTopics = Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))

  // Constrói narrativa dominante
  let narrativaDominante = 'Cobertura diversa sem narrativa única dominante'
  if (negativeCount > positiveCount && negativeCount > 2) {
    narrativaDominante = `Político enfrenta cobertura crítica focada em ${mainTopics[0] || 'questões diversas'}`
  } else if (positiveCount > negativeCount && positiveCount > 2) {
    narrativaDominante = `Cobertura favorável destaca atuação do político em ${mainTopics[0] || 'agenda positiva'}`
  } else if (totalMentions < 3) {
    narrativaDominante = 'Baixa exposição midiática no período'
  }

  // Top News com análise
  const topNews = analyzedMentions.slice(0, 5).map(m => ({
    title: m.title,
    source: m.source,
    sentiment: m.sentiment,
    relevance: m.analysis,
    url: m.url
  }))

  // Summary como um analista político escreveria
  const posPercent = totalMentions > 0 ? Math.round((positiveCount / totalMentions) * 100) : 0
  const negPercent = totalMentions > 0 ? Math.round((negativeCount / totalMentions) * 100) : 0

  let summary = `RELATÓRIO DE MONITORAMENTO — ${data.date}\n\n`
  summary += `${data.politicianName}${data.party ? ` (${data.party})` : ''}${data.position ? `, ${data.position}` : ''}\n\n`

  if (totalMentions === 0) {
    summary += `PANORAMA: Não foram identificadas menções relevantes no período analisado. `
    summary += `A ausência de cobertura pode indicar momento de baixa exposição midiática. `
    summary += `Recomenda-se avaliar oportunidades de pauta para retomar visibilidade.`
  } else if (totalMentions < 3) {
    summary += `PANORAMA: Cobertura limitada com apenas ${totalMentions} menção(ões) identificada(s). `
    summary += `Amostra insuficiente para análise conclusiva. Score provisório de ${sentimentScore}/100. `
    summary += `Recomenda-se aguardar mais dados ou intensificar ações de assessoria de imprensa.`
  } else {
    summary += `PANORAMA: A cobertura do dia apresenta ${totalMentions} menções na mídia e YouTube. `
    summary += `Distribuição: ${positiveCount} favoráveis (${posPercent}%), ${negativeCount} críticas (${negPercent}%), ${neutralCount} neutras. `

    summary += `\n\nNARRATIVA DOMINANTE: ${narrativaDominante}. `

    if (overallSentiment === 'positivo') {
      summary += `O tom geral da cobertura é favorável, com destaque para notícias que fortalecem a imagem pública. `
      summary += `Momento propício para amplificar conquistas e avançar agenda estratégica. `
    } else if (overallSentiment === 'negativo') {
      summary += `O tom predominante é crítico, com cobertura que pressiona a imagem do político. `
      summary += `Atenção especial aos temas que geraram repercussão negativa — resposta estratégica pode ser necessária. `
    } else if (overallSentiment === 'misto') {
      summary += `A cobertura está dividida entre apoiadores e críticos. `
      summary += `Cenário de disputa narrativa exige posicionamento cuidadoso. `
    } else {
      summary += `Cobertura predominantemente factual, sem tendência clara. `
      summary += `Momento estável que pode ser aproveitado para pautar temas favoráveis. `
    }

    summary += `\n\nSCORE DE IMAGEM: ${sentimentScore}/100 — `
    if (sentimentScore >= 70) summary += `capital político em alta.`
    else if (sentimentScore >= 50) summary += `posição estável.`
    else if (sentimentScore >= 30) summary += `sinais de desgaste.`
    else summary += `situação crítica que demanda ação.`
  }

  // Recomendações estratégicas
  const recommendations: string[] = []

  if (alertLevel === 'vermelho') {
    recommendations.push('PRIORITÁRIO: Avaliar necessidade de posicionamento público sobre os temas críticos identificados')
    recommendations.push('Ativar monitoramento em tempo real nas próximas 24-48h para acompanhar desdobramentos')
    recommendations.push('Preparar argumentos de defesa e mapear aliados para eventual contra-narrativa')
  } else if (alertLevel === 'amarelo') {
    recommendations.push('Acompanhar de perto os temas negativos — preparar respostas caso escale')
    recommendations.push('Intensificar comunicação positiva para contrabalançar menções críticas')
    recommendations.push('Avaliar oportunidades de pauta para redirecionar foco da cobertura')
  } else {
    recommendations.push('Momento favorável para avançar agenda estratégica e amplificar conquistas')
    recommendations.push('Fortalecer relacionamento com veículos que deram cobertura positiva')
    recommendations.push('Investir em produção de conteúdo próprio para manter momentum')
  }

  // Riscos identificados
  const risks: Array<{ description: string; severity: 'baixo' | 'medio' | 'alto'; action: string }> = []

  if (negativeCount > 0) {
    const severity = negativeCount > 5 ? 'alto' : negativeCount > 2 ? 'medio' : 'baixo'
    risks.push({
      description: `${negativeCount} menções com tom crítico podem ganhar tração se não gerenciadas`,
      severity,
      action: severity === 'alto'
        ? 'Resposta imediata recomendada'
        : 'Monitorar evolução e preparar posicionamento'
    })
  }

  // Oportunidades
  const opportunities: string[] = []
  if (positiveCount > 0) {
    opportunities.push(`${positiveCount} menções positivas podem ser amplificadas nos canais próprios`)
  }
  if (neutralCount > positiveCount) {
    opportunities.push('Volume de cobertura neutra indica espaço para moldar narrativa favoravelmente')
  }

  return {
    summary,
    overallSentiment,
    sentimentScore,
    alertLevel,
    alertReason,
    topNews,
    mainTopics: mainTopics.length > 0 ? mainTopics : ['Política'],
    recommendations,
    networkScores: [
      {
        network: 'Mídia',
        score: sentimentScore,
        trend: 'estavel' as const,
        insight: `${data.mentions.filter(m => m.platform === 'midia').length} notícias analisadas`
      },
      {
        network: 'YouTube',
        score: data.networks.find(n => n.network === 'YouTube')?.mentions || 0 > 0 ? sentimentScore : 0,
        trend: 'estavel' as const,
        insight: `${data.networks.find(n => n.network === 'YouTube')?.mentions || 0} vídeos monitorados`
      }
    ],
    risks,
    opportunities,
    narrativaDominante,
    temasCriticos: negativeCount > 0 ? mainTopics.slice(0, 3) : [],
    tonDaCobertura: overallSentiment === 'positivo'
      ? 'Predominantemente favorável'
      : overallSentiment === 'negativo'
        ? 'Predominantemente crítico'
        : overallSentiment === 'misto'
          ? 'Dividido entre apoio e críticas'
          : 'Factual e equilibrado'
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
        systemPrompt: `Você é um analista político APARTIDÁRIO. Classifique o sentimento do texto em relação ao político mencionado.

REGRAS:
- POSITIVO: Fortalece a imagem (elogios, conquistas, apoio)
- NEGATIVO: Enfraquece a imagem (críticas, escândalos, rejeição)
- NEUTRO: Factual, sem impacto claro na imagem

Responda em JSON: {"sentiment": "positivo|negativo|neutro", "confidence": 0-1, "explanation": "breve explicação"}`,
        userMessage: text,
        model: 'gpt-4o-mini',
        temperature: 0.2,
        maxTokens: 200
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
  const positiveWords = ['aprova', 'conquista', 'sucesso', 'vitória', 'apoio', 'elogia', 'destaca']
  const negativeWords = ['critica', 'acusa', 'escândalo', 'crise', 'corrupção', 'fraude', 'investiga']

  const posMatches = positiveWords.filter(w => lower.includes(w)).length
  const negMatches = negativeWords.filter(w => lower.includes(w)).length

  if (posMatches > negMatches) {
    return { sentiment: 'positivo', confidence: 0.7, explanation: 'Indicadores de cobertura favorável' }
  }
  if (negMatches > posMatches) {
    return { sentiment: 'negativo', confidence: 0.7, explanation: 'Indicadores de cobertura crítica' }
  }
  return { sentiment: 'neutro', confidence: 0.5, explanation: 'Cobertura aparentemente factual' }
}

// ============================================
// STATUS
// ============================================

export function isAIConfigured(): boolean {
  return true // Edge function handles fallback
}

export function getAIStatus(): { configured: boolean; model: string } {
  return { configured: true, model: 'gpt-4o-mini (Analista Político Sênior)' }
}
