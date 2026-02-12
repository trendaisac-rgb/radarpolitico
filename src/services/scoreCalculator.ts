/**
 * RadarPolítico - Sistema de Score V2
 * Cálculo confiável e transparente do score de imagem
 */

export interface ScoreInput {
  mentions: Array<{
    sentiment: 'positivo' | 'negativo' | 'neutro'
    source?: string
    publishedAt?: string
    relevanceScore?: number
    views?: number
  }>
  youtubeVideos?: Array<{
    sentiment?: 'positivo' | 'negativo' | 'neutro'
    viewCount?: number
    likeCount?: number
  }>
}

export interface ScoreResult {
  score: number // 0-100
  confidence: 'baixa' | 'media' | 'alta' // Confiança no score
  breakdown: {
    newsScore: number
    youtubeScore: number
    totalMentions: number
    positiveMentions: number
    negativeMentions: number
    neutralMentions: number
  }
  explanation: string // Explicação legível do score
}

// Pesos para cada fonte (V1: apenas News + YouTube)
const SOURCE_WEIGHTS = {
  news: 0.60, // 60% peso para notícias
  youtube: 0.40 // 40% peso para YouTube
}

// Configurações de confiança
const CONFIDENCE_THRESHOLDS = {
  low: 3, // Menos de 3 menções = confiança baixa
  medium: 10, // 3-10 menções = confiança média
  high: 10 // Mais de 10 menções = confiança alta
}

/**
 * Calcula o score de imagem baseado nos dados disponíveis
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  const { mentions, youtubeVideos = [] } = input

  // Separa menções de mídia (news) - filtra por não ser YouTube
  const newsMentions = mentions.filter(m =>
    !m.source?.toLowerCase().includes('youtube')
  )

  // Conta sentimentos das notícias
  const newsPositive = newsMentions.filter(m => m.sentiment === 'positivo').length
  const newsNegative = newsMentions.filter(m => m.sentiment === 'negativo').length
  const newsNeutral = newsMentions.filter(m => m.sentiment === 'neutro').length
  const newsTotal = newsMentions.length

  // Calcula score das notícias (0-100)
  let newsScore = 50 // Base neutra
  if (newsTotal > 0) {
    // Fórmula: 50 + ((positivas - negativas) / total) * 50
    // Isso dá um range de 0-100 onde:
    // - 100% positivas = 100
    // - 100% negativas = 0
    // - Equilibrado = 50
    const newsRatio = (newsPositive - newsNegative) / newsTotal
    newsScore = Math.round(50 + newsRatio * 50)
    newsScore = Math.max(0, Math.min(100, newsScore))
  }

  // Calcula score do YouTube baseado em engagement e sentimento
  let youtubeScore = 50 // Base neutra
  if (youtubeVideos.length > 0) {
    // Peso por views (vídeos virais têm mais impacto)
    let totalWeight = 0
    let weightedSum = 0

    youtubeVideos.forEach(video => {
      // Peso baseado em views (logarítmico para não dominar)
      const viewWeight = video.viewCount
        ? Math.log10(Math.max(video.viewCount, 1)) + 1
        : 1

      // Score do vídeo: positivo=100, neutro=50, negativo=0
      let videoScore = 50
      if (video.sentiment === 'positivo') videoScore = 100
      else if (video.sentiment === 'negativo') videoScore = 0

      weightedSum += videoScore * viewWeight
      totalWeight += viewWeight
    })

    if (totalWeight > 0) {
      youtubeScore = Math.round(weightedSum / totalWeight)
    }
  }

  // Calcula score final ponderado
  // Se não há dados de uma fonte, usa apenas a outra
  let finalScore = 50

  if (newsTotal > 0 && youtubeVideos.length > 0) {
    // Ambas as fontes disponíveis
    finalScore = Math.round(
      newsScore * SOURCE_WEIGHTS.news +
      youtubeScore * SOURCE_WEIGHTS.youtube
    )
  } else if (newsTotal > 0) {
    // Apenas notícias
    finalScore = newsScore
  } else if (youtubeVideos.length > 0) {
    // Apenas YouTube
    finalScore = youtubeScore
  }

  // Determina confiança baseada na quantidade de dados
  const totalMentions = newsTotal + youtubeVideos.length
  let confidence: 'baixa' | 'media' | 'alta' = 'baixa'

  if (totalMentions >= CONFIDENCE_THRESHOLDS.high) {
    confidence = 'alta'
  } else if (totalMentions >= CONFIDENCE_THRESHOLDS.low) {
    confidence = 'media'
  }

  // Gera explicação
  const explanation = generateExplanation({
    score: finalScore,
    newsScore,
    youtubeScore,
    newsTotal,
    youtubeCount: youtubeVideos.length,
    newsPositive,
    newsNegative,
    confidence
  })

  return {
    score: finalScore,
    confidence,
    breakdown: {
      newsScore,
      youtubeScore,
      totalMentions,
      positiveMentions: newsPositive,
      negativeMentions: newsNegative,
      neutralMentions: newsNeutral
    },
    explanation
  }
}

/**
 * Gera uma explicação legível do score
 */
function generateExplanation(params: {
  score: number
  newsScore: number
  youtubeScore: number
  newsTotal: number
  youtubeCount: number
  newsPositive: number
  newsNegative: number
  confidence: string
}): string {
  const { score, newsScore, youtubeScore, newsTotal, youtubeCount, newsPositive, newsNegative, confidence } = params

  let explanation = ''

  // Status geral
  if (score >= 70) {
    explanation = `Score ${score} (Excelente): A cobertura está predominantemente positiva. `
  } else if (score >= 50) {
    explanation = `Score ${score} (Bom): A cobertura está equilibrada ou levemente positiva. `
  } else if (score >= 30) {
    explanation = `Score ${score} (Atenção): Há predominância de menções negativas. `
  } else {
    explanation = `Score ${score} (Crítico): A cobertura está muito negativa. `
  }

  // Detalhes das fontes
  if (newsTotal > 0) {
    explanation += `Mídia: ${newsPositive} positivas, ${newsNegative} negativas de ${newsTotal} notícias. `
  }

  if (youtubeCount > 0) {
    explanation += `YouTube: ${youtubeCount} vídeos analisados. `
  }

  // Aviso de confiança
  if (confidence === 'baixa') {
    explanation += `⚠️ Poucos dados - score pode não ser representativo.`
  }

  return explanation
}

/**
 * Calcula a tendência do score (comparação com período anterior)
 */
export function calculateTrend(
  currentScore: number,
  previousScore: number
): { direction: 'subindo' | 'descendo' | 'estavel', change: number } {
  const change = currentScore - previousScore

  if (Math.abs(change) < 3) {
    return { direction: 'estavel', change: 0 }
  }

  return {
    direction: change > 0 ? 'subindo' : 'descendo',
    change: Math.round(change)
  }
}

/**
 * Determina o nível de alerta baseado no score e tendência
 */
export function getAlertLevel(
  score: number,
  negativeMentions: number,
  totalMentions: number
): { level: 'verde' | 'amarelo' | 'vermelho', reason: string } {
  // Alerta vermelho: score muito baixo ou alta proporção de negativos
  if (score < 30) {
    return {
      level: 'vermelho',
      reason: `Score crítico de ${score}. Ação imediata recomendada.`
    }
  }

  if (totalMentions > 0 && negativeMentions / totalMentions > 0.5) {
    return {
      level: 'vermelho',
      reason: `Mais de 50% das menções são negativas (${negativeMentions}/${totalMentions}).`
    }
  }

  // Alerta amarelo: score médio-baixo ou aumento de negativos
  if (score < 50) {
    return {
      level: 'amarelo',
      reason: `Score ${score} indica atenção redobrada. Monitore a evolução.`
    }
  }

  if (totalMentions > 0 && negativeMentions / totalMentions > 0.3) {
    return {
      level: 'amarelo',
      reason: `${Math.round(negativeMentions / totalMentions * 100)}% das menções são negativas.`
    }
  }

  // Alerta verde: tudo ok
  return {
    level: 'verde',
    reason: score >= 70
      ? 'Excelente! Cobertura muito positiva.'
      : 'Situação estável. Continue monitorando.'
  }
}
