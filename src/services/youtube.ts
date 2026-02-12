/**
 * RadarPolítico - YouTube Monitor
 * Busca vídeos e analisa menções no YouTube
 */

const YOUTUBE_API_KEY = 'AIzaSyDiWL7KRLW16HrfxAT2bXpdoL5tpltuTU0'

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  url: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  totalResults: number
}

/**
 * Busca vídeos no YouTube para um termo específico
 * Com timeout e fallback para dados de demonstração
 */
export async function searchYouTubeVideos(
  query: string,
  maxResults = 10
): Promise<YouTubeVideo[]> {
  try {
    console.log(`🎬 Buscando YouTube: "${query}"...`)

    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(maxResults),
      order: 'date',
      relevanceLanguage: 'pt',
      regionCode: 'BR',
      key: YOUTUBE_API_KEY
    })

    // Adiciona timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json()
      console.error('YouTube API error:', error)
      throw new Error(error.error?.message || 'Erro na API do YouTube')
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      console.log('⚠️ YouTube: Nenhum vídeo encontrado')
      return []
    }

    // Mapeia os resultados
    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }))

    // Busca estatísticas dos vídeos (views, likes, comments)
    const videosWithStats = await getVideoStatistics(videos)

    console.log(`✅ YouTube: ${videosWithStats.length} vídeos encontrados`)
    return videosWithStats
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('⚠️ YouTube: Timeout na requisição')
    } else {
      console.error('Erro ao buscar YouTube:', error)
    }

    // Fallback para dados de demonstração
    console.log('⚠️ YouTube Monitor: Usando dados de demonstração')
    return generateDemoYouTubeData(query)
  }
}

/**
 * Busca estatísticas dos vídeos (views, likes, comments)
 */
async function getVideoStatistics(videos: YouTubeVideo[]): Promise<YouTubeVideo[]> {
  if (videos.length === 0) return videos

  try {
    const videoIds = videos.map(v => v.id).join(',')
    const params = new URLSearchParams({
      part: 'statistics',
      id: videoIds,
      key: YOUTUBE_API_KEY
    })

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    )

    if (!response.ok) {
      return videos // Retorna sem estatísticas se falhar
    }

    const data = await response.json()

    // Mapeia estatísticas para cada vídeo
    const statsMap = new Map<string, any>()
    data.items?.forEach((item: any) => {
      statsMap.set(item.id, item.statistics)
    })

    return videos.map(video => {
      const stats = statsMap.get(video.id)
      if (stats) {
        return {
          ...video,
          viewCount: parseInt(stats.viewCount || '0'),
          likeCount: parseInt(stats.likeCount || '0'),
          commentCount: parseInt(stats.commentCount || '0')
        }
      }
      return video
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return videos
  }
}

/**
 * Busca vídeos sobre um político específico
 */
export async function searchPoliticianYouTube(
  name: string,
  nickname?: string,
  party?: string
): Promise<YouTubeVideo[]> {
  const queries: string[] = []

  // Query principal com nome
  queries.push(`"${name}"`)

  // Se tem apelido, busca também
  if (nickname && nickname !== name) {
    queries.push(`"${nickname}"`)
  }

  // Busca combinada com partido
  if (party) {
    queries.push(`${name} ${party}`)
  }

  // Executa buscas em paralelo
  const results = await Promise.all(
    queries.map(q => searchYouTubeVideos(q, 5))
  )

  // Combina e remove duplicatas
  const allVideos = results.flat()
  const uniqueVideos = removeDuplicateVideos(allVideos)

  // Ordena por data (mais recente primeiro)
  return uniqueVideos.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

/**
 * Remove vídeos duplicados baseado no ID
 */
function removeDuplicateVideos(videos: YouTubeVideo[]): YouTubeVideo[] {
  const seen = new Set<string>()
  return videos.filter(video => {
    if (seen.has(video.id)) {
      return false
    }
    seen.add(video.id)
    return true
  })
}

/**
 * Analisa o sentimento de um vídeo do YouTube
 * Baseado em palavras-chave no título e descrição
 */
export function analyzeYouTubeVideo(video: YouTubeVideo, politicianName: string): {
  sentiment: 'positivo' | 'negativo' | 'neutro'
  sentimentScore: number
  relevanceScore: number
} {
  const text = `${video.title} ${video.description}`.toLowerCase()
  const nameLower = politicianName.toLowerCase()

  // Verifica relevância
  const isRelevant = text.includes(nameLower) ||
    nameLower.split(' ').some(part => part.length > 3 && text.includes(part))

  // Palavras positivas
  const positiveWords = [
    'aprova', 'elogia', 'conquista', 'sucesso', 'vitória', 'apoio',
    'defende', 'proposta', 'projeto', 'avanço', 'crescimento', 'popular',
    'lidera', 'melhor', 'benefício', 'resultado', 'positivo'
  ]

  // Palavras negativas
  const negativeWords = [
    'critica', 'acusa', 'investiga', 'denuncia', 'escândalo', 'polêmica',
    'repudia', 'rejeita', 'falha', 'erro', 'problema', 'crise', 'derrota',
    'corrupção', 'fraude', 'mentira', 'ataque', 'ameaça', 'expõe'
  ]

  let score = 0
  positiveWords.forEach(word => {
    if (text.includes(word)) score += 1
  })
  negativeWords.forEach(word => {
    if (text.includes(word)) score -= 1
  })

  // Normaliza score para -1 a 1
  const normalizedScore = Math.max(-1, Math.min(1, score / 3))

  // Determina sentimento
  let sentiment: 'positivo' | 'negativo' | 'neutro'
  if (normalizedScore > 0.2) sentiment = 'positivo'
  else if (normalizedScore < -0.2) sentiment = 'negativo'
  else sentiment = 'neutro'

  // Calcula relevância baseado em views e presença do nome
  const viewScore = video.viewCount ? Math.min(1, video.viewCount / 100000) : 0.5
  const relevanceScore = isRelevant ? (0.6 + viewScore * 0.4) : 0.3

  return {
    sentiment,
    sentimentScore: normalizedScore,
    relevanceScore
  }
}

/**
 * Formata número de views para exibição
 */
export function formatViewCount(count?: number): string {
  if (!count) return '0'
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return String(count)
}

/**
 * Gera dados de demonstração quando API falha
 */
function generateDemoYouTubeData(query: string): YouTubeVideo[] {
  const now = new Date()

  const channels = [
    'Jornal Nacional',
    'Jovem Pan News',
    'CNN Brasil',
    'UOL News',
    'Band Jornalismo',
    'Metrópoles'
  ]

  const templates = [
    `${query}: Entrevista exclusiva sobre os rumos do governo`,
    `URGENTE: ${query} se pronuncia sobre polêmica`,
    `Análise: O que esperar de ${query} nos próximos meses`,
    `${query} participa de debate e defende suas propostas`,
    `Repercussão: Declarações de ${query} movimentam redes sociais`
  ]

  return templates.map((title, i) => ({
    id: `demo_yt_${Date.now()}_${i}`,
    title,
    description: `Vídeo sobre ${query}. Acompanhe a cobertura completa em nosso canal.`,
    channelTitle: channels[i % channels.length],
    publishedAt: new Date(now.getTime() - i * 3600000).toISOString(),
    thumbnailUrl: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=demo${i}`,
    viewCount: Math.floor(Math.random() * 100000) + 10000,
    likeCount: Math.floor(Math.random() * 5000) + 500,
    commentCount: Math.floor(Math.random() * 1000) + 100
  }))
}
