/**
 * RadarPolítico - Social Media Monitor 360°
 * Busca menções em todas as redes sociais
 */

// ============================================
// CONFIGURAÇÕES DAS APIs
// ============================================

const YOUTUBE_API_KEY = 'AIzaSyDiWL7KRLW16HrfxAT2bXpdoL5tpltuTU0'

// RapidAPI - Você pode obter uma chave grátis em rapidapi.com
// Essas APIs tem tier gratuito limitado mas funcional
const RAPIDAPI_KEY = '' // Preencher com sua chave RapidAPI

// ============================================
// INTERFACES
// ============================================

export interface SocialPost {
  id: string
  platform: 'youtube' | 'twitter' | 'instagram' | 'tiktok' | 'telegram' | 'facebook'
  author: string
  authorHandle?: string
  authorUsername?: string
  authorImage?: string
  content: string
  url: string
  publishedAt: string
  likes?: number
  comments?: number
  shares?: number
  views?: number
  thumbnail?: string
  sentiment?: 'positivo' | 'negativo' | 'neutro'
  metrics?: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
    engagement?: number
  }
}

export interface SocialSearchResult {
  platform: string
  posts: SocialPost[]
  totalResults: number
  totalFound?: number
  error?: string
}

// ============================================
// YOUTUBE - API OFICIAL GRATUITA
// ============================================

export async function searchYouTube(query: string, maxResults = 10): Promise<SocialSearchResult> {
  try {
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

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    )

    if (!response.ok) {
      throw new Error('YouTube API error')
    }

    const data = await response.json()
    const videoIds = data.items?.map((item: any) => item.id.videoId).join(',') || ''

    // Busca estatísticas
    let stats: Record<string, any> = {}
    if (videoIds) {
      const statsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
      )
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        statsData.items?.forEach((item: any) => {
          stats[item.id] = item.statistics
        })
      }
    }

    const posts: SocialPost[] = data.items?.map((item: any) => {
      const videoStats = stats[item.id.videoId] || {}
      const views = parseInt(videoStats.viewCount || '0')
      const likes = parseInt(videoStats.likeCount || '0')
      const comments = parseInt(videoStats.commentCount || '0')
      return {
        id: item.id.videoId,
        platform: 'youtube' as const,
        author: item.snippet.channelTitle,
        content: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.medium?.url,
        views,
        likes,
        comments,
        sentiment: analyzeSentiment(item.snippet.title) as any
      }
    }) || []

    // Ordena por views
    posts.sort((a, b) => (b.views || 0) - (a.views || 0))

    return {
      platform: 'youtube',
      posts,
      totalResults: posts.length
    }
  } catch (error) {
    console.error('YouTube search error:', error)
    return { platform: 'youtube', posts: [], totalFound: 0, error: String(error) }
  }
}

// ============================================
// TWITTER/X - Via RapidAPI (Twitter154 API)
// Alternativa gratuita limitada
// ============================================

export async function searchTwitter(query: string, maxResults = 10): Promise<SocialSearchResult> {
  // Se não tem RapidAPI key, usa dados simulados para demo
  if (!RAPIDAPI_KEY) {
    return generateMockTwitterData(query, maxResults)
  }

  try {
    const response = await fetch(
      `https://twitter154.p.rapidapi.com/search/search?query=${encodeURIComponent(query)}&section=latest&limit=${maxResults}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'twitter154.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Twitter API error')
    }

    const data = await response.json()

    const posts: SocialPost[] = data.results?.map((tweet: any) => ({
      id: tweet.tweet_id,
      platform: 'twitter' as const,
      author: tweet.user?.name || 'Unknown',
      authorHandle: tweet.user?.username,
      content: tweet.text,
      url: `https://twitter.com/${tweet.user?.username}/status/${tweet.tweet_id}`,
      publishedAt: tweet.creation_date,
      views: tweet.views || 0,
      likes: tweet.favorite_count || 0,
      comments: tweet.reply_count || 0,
      shares: tweet.retweet_count || 0,
      sentiment: analyzeSentiment(tweet.text) as any
    })) || []

    posts.sort((a, b) => (b.views || 0) - (a.views || 0))

    return {
      platform: 'twitter',
      posts,
      totalResults: posts.length
    }
  } catch (error) {
    console.error('Twitter search error:', error)
    return generateMockTwitterData(query, maxResults)
  }
}

// ============================================
// INSTAGRAM - Via RapidAPI (Instagram API)
// ============================================

export async function searchInstagram(query: string, maxResults = 10): Promise<SocialSearchResult> {
  if (!RAPIDAPI_KEY) {
    return generateMockInstagramData(query, maxResults)
  }

  try {
    // Busca por hashtag
    const hashtag = query.replace(/\s+/g, '').toLowerCase()
    const response = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=${hashtag}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Instagram API error')
    }

    const data = await response.json()

    const posts: SocialPost[] = data.data?.items?.slice(0, maxResults).map((post: any) => ({
      id: post.id,
      platform: 'instagram' as const,
      author: post.user?.username || 'Unknown',
      authorHandle: post.user?.username,
      content: post.caption?.text || '',
      url: `https://instagram.com/p/${post.code}`,
      publishedAt: new Date(post.taken_at * 1000).toISOString(),
      thumbnail: post.image_versions?.items?.[0]?.url,
      likes: post.like_count || 0,
      comments: post.comment_count || 0,
      views: post.play_count || post.view_count || 0,
      sentiment: analyzeSentiment(post.caption?.text || '') as any
    })) || []

    posts.sort((a, b) => (b.likes || 0) - (a.likes || 0))

    return {
      platform: 'instagram',
      posts,
      totalResults: posts.length
    }
  } catch (error) {
    console.error('Instagram search error:', error)
    return generateMockInstagramData(query, maxResults)
  }
}

// ============================================
// TIKTOK - Via RapidAPI (TikTok API)
// ============================================

export async function searchTikTok(query: string, maxResults = 10): Promise<SocialSearchResult> {
  if (!RAPIDAPI_KEY) {
    return generateMockTikTokData(query, maxResults)
  }

  try {
    const response = await fetch(
      `https://tiktok-scraper7.p.rapidapi.com/feed/search?keywords=${encodeURIComponent(query)}&count=${maxResults}&region=br`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      throw new Error('TikTok API error')
    }

    const data = await response.json()

    const posts: SocialPost[] = data.data?.videos?.map((video: any) => ({
      id: video.video_id,
      platform: 'tiktok' as const,
      author: video.author?.nickname || 'Unknown',
      authorHandle: video.author?.unique_id,
      content: video.title || video.desc || '',
      url: `https://tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`,
      publishedAt: new Date(video.create_time * 1000).toISOString(),
      thumbnail: video.cover,
      views: video.play_count || 0,
      likes: video.digg_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
      sentiment: analyzeSentiment(video.title || video.desc || '') as any
    })) || []

    posts.sort((a, b) => (b.views || 0) - (a.views || 0))

    return {
      platform: 'tiktok',
      posts,
      totalResults: posts.length
    }
  } catch (error) {
    console.error('TikTok search error:', error)
    return generateMockTikTokData(query, maxResults)
  }
}

// ============================================
// BUSCA EM TODAS AS REDES
// ============================================

export async function searchAllNetworks(query: string): Promise<Record<string, SocialSearchResult>> {
  console.log(`🔍 Buscando "${query}" em todas as redes...`)

  const results = await Promise.all([
    searchYouTube(query, 10),
    searchTwitter(query, 10),
    searchInstagram(query, 10),
    searchTikTok(query, 10)
  ])

  return {
    youtube: results[0],
    twitter: results[1],
    instagram: results[2],
    tiktok: results[3]
  }
}

// ============================================
// DADOS SIMULADOS PARA DEMO
// (Quando não tem API key configurada)
// ============================================

function generateMockTwitterData(query: string, count: number): SocialSearchResult {
  const sentiments: ('positivo' | 'negativo' | 'neutro')[] = ['positivo', 'neutro', 'negativo', 'positivo', 'neutro']
  const posts: SocialPost[] = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `tw_${Date.now()}_${i}`,
    platform: 'twitter' as const,
    author: ['Folha de SP', 'UOL Notícias', 'G1', 'Estadão', 'O Globo'][i % 5],
    authorHandle: ['folha', 'uikiuol', 'g1', 'estadao', 'oglobo'][i % 5],
    content: `${query} em destaque: ${['Declaração gera repercussão', 'Novo projeto apresentado', 'Entrevista exclusiva', 'Votação importante', 'Agenda da semana'][i % 5]}`,
    url: `https://twitter.com/example/status/${Date.now() + i}`,
    publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
    views: Math.floor(Math.random() * 50000) + 1000,
    likes: Math.floor(Math.random() * 5000) + 100,
    comments: Math.floor(Math.random() * 500) + 10,
    shares: Math.floor(Math.random() * 1000) + 50,
    sentiment: sentiments[i % 5]
  }))

  return { platform: 'twitter', posts, totalResults: posts.length }
}

function generateMockInstagramData(query: string, count: number): SocialSearchResult {
  const sentiments: ('positivo' | 'negativo' | 'neutro')[] = ['neutro', 'positivo', 'neutro', 'negativo', 'positivo']
  const posts: SocialPost[] = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `ig_${Date.now()}_${i}`,
    platform: 'instagram' as const,
    author: ['Política Brasileira', 'Notícias BR', 'Brasil Política', 'Foco Político', 'Poder360'][i % 5],
    authorHandle: ['politicabr', 'noticiasbr', 'brasilpolitica', 'focopolitico', 'poder360'][i % 5],
    content: `#${query.replace(/\s+/g, '')} ${['🇧🇷 Acompanhe', '📊 Análise', '🗳️ Eleições', '💬 Debate', '📰 Notícia'][i % 5]}`,
    url: `https://instagram.com/p/example${i}`,
    publishedAt: new Date(Date.now() - i * 7200000).toISOString(),
    likes: Math.floor(Math.random() * 10000) + 500,
    comments: Math.floor(Math.random() * 300) + 20,
    views: Math.floor(Math.random() * 30000) + 2000,
    sentiment: sentiments[i % 5]
  }))

  return { platform: 'instagram', posts, totalResults: posts.length }
}

function generateMockTikTokData(query: string, count: number): SocialSearchResult {
  const sentiments: ('positivo' | 'negativo' | 'neutro')[] = ['positivo', 'positivo', 'neutro', 'neutro', 'negativo']
  const posts: SocialPost[] = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `tt_${Date.now()}_${i}`,
    platform: 'tiktok' as const,
    author: ['Política Jovem', 'Brasil News', 'TikTok Política', 'Viral BR', 'Fatos Políticos'][i % 5],
    authorHandle: ['politicajovem', 'brasilnews', 'tiktokpolitica', 'viralbr', 'fatospoliticos'][i % 5],
    content: `${query} ${['viraliza nas redes!', 'o que você precisa saber', 'resumo rápido', 'entenda a polêmica', 'análise completa'][i % 5]}`,
    url: `https://tiktok.com/@example/video/${Date.now() + i}`,
    publishedAt: new Date(Date.now() - i * 5400000).toISOString(),
    views: Math.floor(Math.random() * 100000) + 5000,
    likes: Math.floor(Math.random() * 20000) + 500,
    comments: Math.floor(Math.random() * 1000) + 50,
    shares: Math.floor(Math.random() * 2000) + 100,
    sentiment: sentiments[i % 5]
  }))

  return { platform: 'tiktok', posts, totalResults: posts.length }
}

// ============================================
// ANÁLISE DE SENTIMENTO
// ============================================

export function analyzeSentiment(text: string): 'positivo' | 'negativo' | 'neutro' {
  const lower = text.toLowerCase()

  const positiveWords = [
    'aprova', 'elogia', 'sucesso', 'vitória', 'conquista', 'apoio', 'excelente',
    'bom', 'ótimo', 'melhor', 'parabeniza', 'crescimento', 'avanço'
  ]

  const negativeWords = [
    'critica', 'acusa', 'escândalo', 'polêmica', 'fracasso', 'derrota', 'erro',
    'problema', 'crise', 'investiga', 'denuncia', 'corrupção', 'fraude'
  ]

  let score = 0
  positiveWords.forEach(word => { if (lower.includes(word)) score++ })
  negativeWords.forEach(word => { if (lower.includes(word)) score-- })

  if (score > 0) return 'positivo'
  if (score < 0) return 'negativo'
  return 'neutro'
}

// ============================================
// FORMATADORES
// ============================================

export function formatMetric(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}
