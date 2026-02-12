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
  // Campos para análise profunda
  historiaDoDia: string // A manchete do dia
  fatosRelevantes: string[] // Fatos específicos citados nas notícias
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

const ANALYST_PERSONA = `Você é CARLOS MENDES, Analista Político Sênior com 25 anos em Brasília.

## QUEM VOCÊ É
- Ex-assessor de comunicação de governadores e ministros
- Consultor de campanhas desde 1998
- Especialista em gestão de crises políticas
- Seus clientes pagam R$3.000/mês pelo seu trabalho — entregue valor correspondente

## O QUE DIFERENCIA SEU TRABALHO

Você NÃO faz análise genérica de "sentimento positivo/negativo". Qualquer estagiário faz isso.

Você faz INTELIGÊNCIA POLÍTICA:
1. **CRUZA os dados** — Se 3 veículos falam sobre o mesmo tema, isso É a história do dia
2. **CITA notícias específicas** — "O Estadão reportou X, corroborado pelo G1 que detalhou Y"
3. **IDENTIFICA conexões** — Pessoas, empresas, investigações, alianças
4. **ENTREGA insight acionável** — O cliente lê seu relatório e SABE exatamente o que está acontecendo

## PRINCÍPIOS

### APARTIDÁRIO
- PT, PL, PSOL, MDB — mesmos critérios para todos
- Analisa IMPACTO NA IMAGEM, não mérito ideológico

### BASEADO EM FATOS
- CITE títulos e fontes específicas
- NÃO generalize — seja específico
- Se não há dados, diga "dados insuficientes"`

// ============================================
// PROMPT PRINCIPAL
// ============================================

const ANALYSIS_PROMPT = `${ANALYST_PERSONA}

## SUA TAREFA

Você é o assessor que se reúne todo dia com o político e passa um BRIEFING DE 5 MINUTOS sobre o que está acontecendo na mídia.

## REGRA #1 — PROIBIDO FALAR NÚMEROS DE MENÇÕES

❌ ERRADO: "A cobertura apresenta 30 menções na mídia e YouTube. Distribuição: 1 favoráveis (3%), 3 críticas (10%), 26 neutras."
❌ ERRADO: "Foram identificadas X menções positivas e Y negativas"
❌ ERRADO: "PANORAMA: A cobertura do dia apresenta N menções..."

✅ CERTO: Vá direto aos FATOS. Diga O QUE as notícias estão falando.

## COMO DEVE SER O RESUMO

Imagine que você está falando com o político:

"Presidente, nas últimas 24 horas a mídia focou em três temas principais sobre o senhor:

1. A ligação com Daniel Vorcaro do Banco Master dominou a cobertura. O Estadão publicou 'Toffoli se reuniu com empresário durante julgamento do banco', detalhando um jantar em Brasília. A Folha corroborou com 'Ministro nega irregularidade mas não explica encontro'. O tom é crítico — a narrativa é de conflito de interesses.

2. Sua declaração sobre o inquérito das fake news gerou repercussão. O G1 destacou 'Toffoli defende continuidade de investigações', enquanto canais bolsonaristas no YouTube atacam: 'A verdade sobre Toffoli e a censura' (Canal X, 180K views) é o vídeo mais viral.

3. Tema menor: sua participação na posse do novo ministro do TSE foi coberta de forma protocolar, sem impacto na imagem.

Score: 28/100 — Situação crítica. A narrativa do Banco Master está se consolidando e precisa de resposta."

## FORMATO DO RESUMO (summary)

PARÁGRAFO 1: O tema central das últimas 24h. Qual a "história do dia"? Cite a notícia principal.

PARÁGRAFO 2-3: Outros temas relevantes. O que mais está sendo falado? Cite notícias e fontes.

PARÁGRAFO 4: YouTube — quais vídeos estão viralizando? Cite títulos e canais.

PARÁGRAFO FINAL: Score e avaliação geral em UMA frase.

## FORMATO JSON

{
  "summary": "BRIEFING DIRETO (sem contar menções). Descreva os FATOS: o que as notícias dizem, quem é citado, qual a narrativa. Como você falaria para o político em 5 minutos.",

  "historiaDoDia": "O tema central. Ex: 'Ligação de Toffoli com Daniel Vorcaro do Banco Master domina cobertura' ou 'Nomeação de servidor que perdeu vaga para cadeirante gera crise para João Campos'",

  "fatosRelevantes": [
    "Estadão: Toffoli se reuniu com Daniel Vorcaro durante julgamento — detalha jantar em Brasília",
    "Folha: Ministro nega irregularidade mas não explica encontro com empresário",
    "YouTube: Vídeo 'A verdade sobre Toffoli' (Canal X) com 180K views ataca ministro"
  ],

  "narrativaDominante": "A história que a mídia está construindo. Ex: 'Conflito de interesses entre Toffoli e setor financeiro'",

  "temasCriticos": ["Temas que podem escalar — ex: 'Relação com Banco Master', 'Inquérito fake news'"],

  "tonDaCobertura": "Ex: 'Crítico — Estadão e Folha lideram com tom investigativo. YouTube amplifica com conteúdo de ataque.'",

  "overallSentiment": "positivo|negativo|neutro|misto",

  "sentimentScore": 0-100,

  "alertLevel": "verde|amarelo|vermelho",
  "alertReason": "Ex: 'Narrativa de conflito de interesses se consolidando — risco de CPI'",

  "topNews": [
    {
      "title": "Título EXATO da notícia",
      "source": "Veículo",
      "sentiment": "positivo|negativo|neutro",
      "relevance": "O que essa notícia diz? Quem é citado? Qual o impacto?",
      "url": "URL"
    }
  ],

  "mainTopics": ["Tópicos baseados nas notícias reais"],

  "recommendations": [
    "Ação específica baseada nos fatos. Ex: 'Preparar nota sobre relação com Banco Master'",
    "Ação 2 específica. Ex: 'Evitar declarações sobre inquérito até baixar repercussão'"
  ],

  "networkScores": [
    {
      "network": "Mídia",
      "score": 0-100,
      "trend": "subindo|descendo|estavel",
      "insight": "Ex: 'Estadão e Folha com tom crítico sobre Banco Master. G1 neutro.'"
    },
    {
      "network": "YouTube",
      "score": 0-100,
      "trend": "subindo|descendo|estavel",
      "insight": "Ex: 'Canais de oposição dominam com 3 vídeos críticos viralizando'"
    }
  ],

  "risks": [
    {
      "description": "Ex: 'Narrativa de conflito de interesses pode virar pedido de CPI'",
      "severity": "baixo|medio|alto",
      "action": "Ex: 'Preparar defesa técnica e acionar aliados no Senado'"
    }
  ],

  "opportunities": ["Ex: 'Cobertura da posse no TSE pode ser amplificada como contraponto institucional'"]
}

## REGRAS ABSOLUTAS

1. **ZERO ESTATÍSTICAS NO SUMMARY** — NÃO fale "X menções", "Y positivas", "Z negativas". VÁ DIRETO AOS FATOS.
2. **CITE O QUE AS NOTÍCIAS DIZEM** — "Estadão publicou que Toffoli se reuniu com Vorcaro..."
3. **NOMEIE PESSOAS** — Daniel Vorcaro, Banco Master, não "empresário do setor financeiro"
4. **FATOSRELEVANTES = CITAÇÕES** — Cada item deve ser "Fonte: O que a notícia diz"
5. **V1** — Monitora apenas Mídia e YouTube. NÃO mencione Twitter, Instagram, TikTok.
6. **SCORE REAL** — Se a cobertura é devastadora, score pode ser 15. Se é excelente, pode ser 85.`

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

  let message = `🎯 BRIEFING DE INTELIGÊNCIA POLÍTICA\n`
  message += `${'═'.repeat(60)}\n\n`

  message += `👤 MONITORADO: ${data.politicianName.toUpperCase()}\n`
  if (data.party) message += `   Partido: ${data.party}\n`
  if (data.position) message += `   Cargo: ${data.position}\n`
  message += `📅 Data: ${data.date}\n\n`

  message += `${'═'.repeat(60)}\n`
  message += `📰 NOTÍCIAS (${midiaMencoes.length} artigos) — LEIA CADA UMA\n`
  message += `${'═'.repeat(60)}\n\n`

  if (midiaMencoes.length > 0) {
    midiaMencoes.slice(0, 25).forEach((m, i) => {
      message += `┌─ NOTÍCIA ${i + 1} ────────────────────────\n`
      message += `│ TÍTULO: "${m.title}"\n`
      message += `│ FONTE: ${m.source}\n`
      if (m.content && m.content.length > 50) {
        // Envia mais conteúdo para análise mais profunda
        message += `│ CONTEÚDO: ${m.content.substring(0, 800)}${m.content.length > 800 ? '...' : ''}\n`
      }
      message += `│ URL: ${m.url}\n`
      message += `│ DATA: ${m.publishedAt}\n`
      message += `└──────────────────────────────────────\n\n`
    })

    // Identificar temas recorrentes para ajudar a IA
    const titles = midiaMencoes.map(m => m.title.toLowerCase()).join(' ')
    const commonThemes: string[] = []

    // Detecta temas comuns
    const themeKeywords: Record<string, string[]> = {
      'investigação/CPI': ['investiga', 'cpi', 'inquérito', 'pf', 'polícia', 'depoimento'],
      'economia/finanças': ['banco', 'financeiro', 'dinheiro', 'milhões', 'bilhões', 'orçamento'],
      'escândalo': ['escândalo', 'denúncia', 'corrupção', 'fraude', 'irregularidade'],
      'política': ['congresso', 'votação', 'projeto', 'lei', 'deputado', 'senador'],
      'judiciário': ['stf', 'supremo', 'ministro', 'decisão', 'julgamento', 'processo']
    }

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(kw => titles.includes(kw))) {
        commonThemes.push(theme)
      }
    })

    if (commonThemes.length > 0) {
      message += `⚠️ TEMAS DETECTADOS NOS TÍTULOS: ${commonThemes.join(', ')}\n\n`
    }
  } else {
    message += `⚪ Nenhuma notícia encontrada na mídia.\n\n`
  }

  message += `${'═'.repeat(60)}\n`
  message += `🎬 YOUTUBE (vídeos mais relevantes)\n`
  message += `${'═'.repeat(60)}\n\n`

  if (youtubeData?.topPosts?.length) {
    youtubeData.topPosts.slice(0, 10).forEach((p, i) => {
      message += `┌─ VÍDEO ${i + 1} ────────────────────────\n`
      message += `│ TÍTULO: "${p.content}"\n`
      message += `│ CANAL: ${p.author}\n`
      message += `│ VIEWS/ENGAJAMENTO: ${p.engagement.toLocaleString()}\n`
      message += `│ URL: ${p.url}\n`
      message += `└──────────────────────────────────────\n\n`
    })
  } else if (youtubeMencoes.length > 0) {
    youtubeMencoes.slice(0, 10).forEach((m, i) => {
      message += `┌─ VÍDEO ${i + 1} ────────────────────────\n`
      message += `│ TÍTULO: "${m.title}"\n`
      message += `│ CANAL: ${m.source}\n`
      message += `│ URL: ${m.url}\n`
      message += `└──────────────────────────────────────\n\n`
    })
  } else {
    message += `⚪ Nenhum vídeo encontrado no YouTube.\n\n`
  }

  message += `${'═'.repeat(60)}\n`
  message += `📋 INSTRUÇÕES CRÍTICAS\n`
  message += `${'═'.repeat(60)}\n\n`
  message += `🚫 PROIBIDO NO RESUMO:\n`
  message += `   - "X menções na mídia"\n`
  message += `   - "Y positivas, Z negativas"\n`
  message += `   - Qualquer contagem ou estatística\n\n`
  message += `✅ OBRIGATÓRIO NO RESUMO:\n`
  message += `   - Dizer O QUE as notícias falam (o conteúdo)\n`
  message += `   - Citar NOMES de pessoas, empresas, investigações\n`
  message += `   - Ex: "Estadão publicou que Toffoli se reuniu com Daniel Vorcaro..."\n\n`
  message += `📰 LEIA CADA NOTÍCIA ACIMA e extraia:\n`
  message += `   - Qual o FATO reportado?\n`
  message += `   - Quem são os ENVOLVIDOS?\n`
  message += `   - Qual a NARRATIVA sendo construída?\n\n`
  message += `🎯 Responda em JSON válido.\n`

  return message
}

// ============================================
// ANÁLISE LOCAL (FALLBACK INTELIGENTE)
// Quando não há IA disponível
// ============================================

function analyzeLocally(data: DailyReportData): AIAnalysisResult {
  const totalMentions = data.mentions.length

  // Separa menções por tipo
  const newsMentions = data.mentions.filter(m => m.platform === 'midia' || m.platform === 'news')
  const youtubeMentions = data.mentions.filter(m => m.platform === 'youtube')
  const youtubeData = data.networks.find(n => n.network.toLowerCase().includes('youtube'))

  // Vídeos do YouTube (prioritariamente de topPosts, senão de mentions)
  const youtubeVideos = youtubeData?.topPosts || youtubeMentions.map(m => ({
    content: m.title,
    author: m.source,
    engagement: 0,
    url: m.url
  }))

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

  // Summary baseado no CONTEÚDO das notícias, não em estatísticas
  let summary = ''

  // Verifica se há vídeos do YouTube disponíveis
  const hasYouTubeVideos = youtubeVideos.length > 0

  if (totalMentions === 0 && !hasYouTubeVideos) {
    summary = `⚠️ NÃO FOI POSSÍVEL BUSCAR NOTÍCIAS\n\n`
    summary += `O sistema não conseguiu acessar o Google News no momento. `
    summary += `Isso pode ser um problema temporário de conexão com os servidores de notícias.\n\n`
    summary += `RECOMENDAÇÃO: Clique em "Atualizar" para tentar novamente em alguns minutos.`
  } else if (newsMentions.length === 0 && hasYouTubeVideos) {
    // SEM NOTÍCIAS MAS COM YOUTUBE - Usa os vídeos como fonte principal
    summary = `📺 COBERTURA NO YOUTUBE\n\n`
    summary += `A busca de notícias não retornou resultados no momento, mas encontramos ${youtubeVideos.length} vídeos no YouTube sobre ${data.politicianName}:\n\n`

    youtubeVideos.slice(0, 5).forEach((video, i) => {
      const views = video.engagement > 0 ? ` (${video.engagement.toLocaleString()} views)` : ''
      summary += `${i + 1}. "${video.content}" — ${video.author}${views}\n`
    })

    summary += `\nO YouTube é um termômetro importante da opinião pública. Monitore os títulos acima para entender a narrativa que está sendo construída sobre ${data.politicianName}.`

    // Atualiza o score baseado nos vídeos (neutro por padrão sem análise profunda)
    sentimentScore = 50
    overallSentiment = 'neutro'
    alertLevel = 'amarelo'
    alertReason = 'Google News indisponível — análise baseada apenas em YouTube'
  } else if (totalMentions < 3) {
    // Com poucas notícias, citar diretamente
    const topMention = analyzedMentions[0]
    summary = `Cobertura limitada nas últimas 24 horas. `
    if (topMention) {
      summary += `A principal notícia é "${topMention.title}" (${topMention.source}). `
    }
    summary += `Aguardando mais dados para análise completa. Score provisório: ${sentimentScore}/100.`
  } else {
    // Com várias notícias, criar resumo baseado no conteúdo
    summary = `Nas últimas 24 horas, a cobertura de ${data.politicianName} focou nos seguintes temas:\n\n`

    // Agrupar notícias por tema/fonte e descrever
    const topMentions = analyzedMentions.slice(0, 5)

    topMentions.forEach((m, i) => {
      const sentimentLabel = m.sentiment === 'positivo' ? '(tom favorável)' :
                            m.sentiment === 'negativo' ? '(tom crítico)' : ''
      summary += `${i + 1}. ${m.source}: "${m.title}" ${sentimentLabel}\n`
    })

    summary += `\n`

    // Avaliação geral
    if (overallSentiment === 'positivo') {
      summary += `A narrativa geral é favorável — momento para amplificar conquistas.`
    } else if (overallSentiment === 'negativo') {
      summary += `A cobertura está predominantemente crítica — atenção aos temas sensíveis.`
    } else if (overallSentiment === 'misto') {
      summary += `Cobertura dividida entre apoio e críticas — cenário de disputa narrativa.`
    } else {
      summary += `Cobertura factual sem tendência clara — momento estável.`
    }

    summary += ` Score: ${sentimentScore}/100.`
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

  // Gera história do dia baseada nas notícias ou vídeos
  let historiaDoDia = 'Monitoramento em andamento — aguardando mais dados'

  if (newsMentions.length === 0 && hasYouTubeVideos) {
    // Sem notícias, mas com YouTube - usa os vídeos
    const topVideo = youtubeVideos[0]
    historiaDoDia = `📺 ${youtubeVideos.length} vídeos no YouTube: "${topVideo?.content?.substring(0, 60) || 'vídeos encontrados'}..."`
  } else if (totalMentions > 0 && mainTopics.length > 0) {
    if (overallSentiment === 'negativo') {
      historiaDoDia = `${data.politicianName} enfrenta cobertura crítica sobre ${mainTopics[0]}`
    } else if (overallSentiment === 'positivo') {
      historiaDoDia = `${data.politicianName} em destaque positivo — ${mainTopics[0]}`
    } else {
      historiaDoDia = `${data.politicianName} na pauta da mídia — ${mainTopics[0]}`
    }
  }

  // Extrai fatos das notícias OU vídeos
  const fatosRelevantes: string[] = []

  if (analyzedMentions.length > 0) {
    // Tem notícias - usa elas
    analyzedMentions.slice(0, 5).forEach(m => {
      fatosRelevantes.push(`${m.source}: "${m.title.substring(0, 80)}${m.title.length > 80 ? '...' : ''}"`)
    })
  } else if (hasYouTubeVideos) {
    // Sem notícias - usa vídeos do YouTube
    youtubeVideos.slice(0, 5).forEach(video => {
      const views = video.engagement > 0 ? ` (${video.engagement.toLocaleString()} views)` : ''
      fatosRelevantes.push(`YouTube - ${video.author}: "${video.content.substring(0, 60)}${video.content.length > 60 ? '...' : ''}"${views}`)
    })
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
    historiaDoDia,
    fatosRelevantes,
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
