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

Produza um BRIEFING DE INTELIGÊNCIA POLÍTICA que justifique R$3.000/mês de assinatura.

## O QUE VOCÊ DEVE ENTREGAR

### 1. HISTÓRIA DO DIA (Obrigatório)
Identifique A história principal que está movendo a cobertura. Exemplos:
- "Toffoli é ligado ao caso Banco Master — conexão com Daniel Vorcaro ganha destaque"
- "Ministro enfrenta rebelião na base após veto a emenda"
- "Governador inaugura maior hospital do estado — cobertura amplamente positiva"

CRUZE os dados: se 3+ veículos falam do mesmo assunto, ESSE é o tema central.

### 2. RESUMO EXECUTIVO (Obrigatório)
NO RESUMO, você DEVE:
- **CITAR notícias específicas pelo título** — "Segundo reportagem 'Título X' do Estadão..."
- **NOMEAR pessoas e entidades envolvidas** — empresários, bancos, investigações, aliados
- **CONECTAR os fatos** — "A mesma fonte citada pelo G1 aparece na reportagem da Folha..."
- **EXPLICAR o impacto** — O que isso significa para a imagem do político

EXEMPLO DE RESUMO BOM:
"A cobertura de hoje é dominada pelo caso Banco Master. A reportagem 'Toffoli manteve contato com Vorcaro durante julgamento' (Estadão) detalha que o ministro teria se encontrado com o empresário Daniel Vorcaro em jantar reservado. O G1 corrobora com 'PF amplia investigação sobre relação entre STF e setor financeiro'. O YouTube mostra 4 vídeos críticos, sendo o de maior alcance 'A verdade sobre Toffoli e o Banco Master' (Canal X, 250K views). Score 28/100 — situação crítica que demanda posicionamento."

EXEMPLO DE RESUMO RUIM (NÃO FAÇA ISSO):
"A cobertura apresenta 15 menções, sendo 8 negativas e 7 neutras. O tom é predominantemente crítico. Recomenda-se monitoramento."

### 3. SCORE (0-100)
- 80-100: Momento de ouro — capitalize
- 60-79: Cenário favorável — mantenha
- 40-59: Equilibrado — atenção
- 20-39: Desgaste — ação necessária
- 0-19: Crise severa — resposta imediata

### 4. CLASSIFICAÇÃO DE SENTIMENTO
Para CADA notícia, classifique (APARTIDÁRIO):
- **POSITIVO**: Fortalece imagem (conquistas, elogios, apoio)
- **NEGATIVO**: Enfraquece imagem (críticas, escândalos, investigações)
- **NEUTRO**: Factual sem impacto claro

## FORMATO JSON

{
  "summary": "BRIEFING EXECUTIVO (20-30 frases). OBRIGATÓRIO: Cite títulos de notícias específicas, nomes de pessoas/empresas envolvidas, e cruze informações entre fontes. Seu cliente paga R$3000/mês — entregue inteligência, não estatísticas.",

  "historiaDoDia": "A MANCHETE que resume o que está acontecendo hoje. Ex: 'Toffoli sob pressão por ligação com Banco Master' ou 'Ministro colhe frutos de programa social bem-sucedido'",

  "fatosRelevantes": [
    "Fato 1: Nome, empresa, situação específica citada nas notícias",
    "Fato 2: Conexão identificada entre reportagens",
    "Fato 3: Dado numérico ou declaração importante"
  ],

  "narrativaDominante": "Descrição da narrativa que a mídia está construindo",

  "temasCriticos": ["Temas que podem escalar ou já são sensíveis"],

  "tonDaCobertura": "Descrição qualitativa com exemplos: 'Crítico, focado na relação com o setor bancário — Estadão e Folha lideram cobertura negativa'",

  "overallSentiment": "positivo|negativo|neutro|misto",

  "sentimentScore": 0-100,

  "alertLevel": "verde|amarelo|vermelho",
  "alertReason": "Justificativa baseada em fatos específicos",

  "topNews": [
    {
      "title": "Título EXATO da notícia",
      "source": "Veículo",
      "sentiment": "positivo|negativo|neutro",
      "relevance": "Por que essa notícia é importante? Quem é citado? Qual a conexão com outros fatos?",
      "url": "URL"
    }
  ],

  "mainTopics": ["Tópicos identificados com base nos títulos reais"],

  "recommendations": [
    "Ação 1: Específica e baseada nos fatos identificados",
    "Ação 2: Como você aconselharia um cliente pagando R$3000/mês"
  ],

  "networkScores": [
    {
      "network": "Mídia",
      "score": 0-100,
      "trend": "subindo|descendo|estavel",
      "insight": "Análise com citação de veículos específicos"
    },
    {
      "network": "YouTube",
      "score": 0-100,
      "trend": "subindo|descendo|estavel",
      "insight": "Análise com citação de canais e vídeos específicos"
    }
  ],

  "risks": [
    {
      "description": "Risco específico baseado em fatos das notícias",
      "severity": "baixo|medio|alto",
      "action": "Recomendação concreta"
    }
  ],

  "opportunities": ["Oportunidades identificadas com base na cobertura"]
}

## REGRAS ABSOLUTAS

1. **CITE TÍTULOS E FONTES** — No summary, SEMPRE mencione "segundo a reportagem 'X' do Y"
2. **NOMEIE PESSOAS E ENTIDADES** — Se a notícia menciona um empresário, banco, investigação — cite pelo nome
3. **CRUZE DADOS** — Se múltiplas fontes falam do mesmo assunto, destaque a convergência
4. **SCORE REAL** — Não comece do 50. Se a cobertura é devastadora, o score pode ser 12.
5. **V1** — Monitora apenas Mídia (Google News) e YouTube. NÃO mencione redes que não temos dados.
6. **POUCOS DADOS** — Se há <3 menções, reconheça e ajuste confiança do score.`

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
  message += `📋 SUA TAREFA\n`
  message += `${'═'.repeat(60)}\n\n`
  message += `1. IDENTIFIQUE A HISTÓRIA DO DIA — Qual o tema central? (cruze os dados)\n`
  message += `2. NO SUMMARY: CITE títulos de notícias específicas e nomes\n`
  message += `3. CRUZE informações entre fontes — se aparecem em múltiplas, destaque\n`
  message += `4. SCORE 0-100 baseado na gravidade real da cobertura\n`
  message += `5. Responda em JSON válido\n\n`
  message += `⚠️ LEMBRE: Seu cliente paga R$3000/mês. Entregue INTELIGÊNCIA, não estatísticas.\n`

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

  // Gera história do dia baseada nas notícias mais frequentes
  let historiaDoDia = 'Monitoramento em andamento — aguardando mais dados'
  if (totalMentions > 0 && mainTopics.length > 0) {
    if (overallSentiment === 'negativo') {
      historiaDoDia = `${data.politicianName} enfrenta cobertura crítica sobre ${mainTopics[0]}`
    } else if (overallSentiment === 'positivo') {
      historiaDoDia = `${data.politicianName} em destaque positivo — ${mainTopics[0]}`
    } else {
      historiaDoDia = `${data.politicianName} na pauta da mídia — ${mainTopics[0]}`
    }
  }

  // Extrai fatos das notícias
  const fatosRelevantes: string[] = []
  analyzedMentions.slice(0, 5).forEach(m => {
    fatosRelevantes.push(`${m.source}: "${m.title.substring(0, 80)}${m.title.length > 80 ? '...' : ''}"`)
  })

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
