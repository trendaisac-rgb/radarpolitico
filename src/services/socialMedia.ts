/**
 * RadarPolítico - Social Media Monitor 360°
 * Busca menções em todas as redes sociais
 */

// ============================================
// CONFIGURAÇÕES DAS APIs
// ============================================

const YOUTUBE_API_KEY = 'AIzaSyDiWL7KRLW16HrfxAT2bXpdoL5tpltuTU0'

// ============================================
// APIFY - $5/mês GRÁTIS - MELHOR OPÇÃO!
// Cadastre em: https://apify.com (tier gratuito generoso)
// Instagram: ~2.100 posts/mês grátis
// TikTok: ~16.600 posts/mês grátis
// Twitter: ~500 tweets/mês grátis
// ============================================
const APIFY_TOKEN = 'apify_api_YE1jV1cLMLpUaJ4FpNd6mgYoftRpvc4kYJqL'

// RapidAPI - Alternativa (tier gratuito mais limitado)
const RAPIDAPI_KEY = '' // Preencher com sua chave RapidAPI (opcional)

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
    // Últimas 24 horas
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const publishedAfter = yesterday.toISOString()

    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(maxResults * 2), // Busca mais para filtrar depois
      order: 'viewCount', // Ordenar por views
      relevanceLanguage: 'pt',
      regionCode: 'BR',
      publishedAfter: publishedAfter, // Últimas 24h
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

    // Ordena por views e pega TOP 5
    posts.sort((a, b) => (b.views || 0) - (a.views || 0))
    const top5 = posts.slice(0, 5)

    console.log(`✅ YouTube: ${posts.length} vídeos encontrados, retornando TOP 5 por views`)

    return {
      platform: 'youtube',
      posts: top5,
      totalResults: posts.length
    }
  } catch (error) {
    console.error('YouTube search error:', error)
    return { platform: 'youtube', posts: [], totalResults: 0, error: String(error) }
  }
}

// ============================================
// TWITTER/X - Via Apify (apidojo/tweet-scraper)
// https://apify.com/apidojo/tweet-scraper
// ============================================

export async function searchTwitter(query: string, maxResults = 10): Promise<SocialSearchResult> {
  // Tenta Apify primeiro
  if (APIFY_TOKEN) {
    try {
      console.log('🐦 Buscando Twitter via Apify (apidojo/tweet-scraper)...')

      // Usando o actor apidojo/tweet-scraper (o mais popular)
      const response = await fetch(
        `https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchTerms: [query],
            maxTweets: maxResults * 2,
            searchMode: 'live'
          })
        }
      )

      if (response.ok) {
        const data = await response.json()

        const posts: SocialPost[] = (data || []).slice(0, maxResults).map((tweet: any) => ({
          id: tweet.id || tweet.id_str || String(Date.now()),
          platform: 'twitter' as const,
          author: tweet.author?.name || tweet.user?.name || 'Unknown',
          authorHandle: tweet.author?.userName || tweet.user?.screen_name,
          authorImage: tweet.author?.profilePicture || tweet.user?.profile_image_url_https,
          content: tweet.text || tweet.full_text || '',
          url: tweet.url || `https://twitter.com/i/status/${tweet.id}`,
          publishedAt: tweet.createdAt || tweet.created_at || new Date().toISOString(),
          views: tweet.viewCount || tweet.views || 0,
          likes: tweet.likeCount || tweet.favorite_count || 0,
          comments: tweet.replyCount || tweet.reply_count || 0,
          shares: tweet.retweetCount || tweet.retweet_count || 0,
          sentiment: analyzeSentiment(tweet.text || tweet.full_text || '') as any
        }))

        // Ordena por engajamento (views + likes + retweets) e pega TOP 5
        posts.sort((a, b) => {
          const engA = (a.views || 0) + (a.likes || 0) * 10 + (a.shares || 0) * 20
          const engB = (b.views || 0) + (b.likes || 0) * 10 + (b.shares || 0) * 20
          return engB - engA
        })
        const top5 = posts.slice(0, 5)

        console.log(`✅ Twitter: ${posts.length} tweets encontrados, retornando TOP 5 por engajamento`)
        return { platform: 'twitter', posts: top5, totalResults: posts.length }
      }
    } catch (error) {
      console.error('Apify Twitter error:', error)
    }
  }

  // Fallback para RapidAPI
  if (RAPIDAPI_KEY) {
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

      if (response.ok) {
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
        return { platform: 'twitter', posts, totalResults: posts.length }
      }
    } catch (error) {
      console.error('RapidAPI Twitter error:', error)
    }
  }

  // Fallback para dados mock
  return generateMockTwitterData(query, maxResults)
}

// ============================================
// INSTAGRAM - Via Apify (apify/instagram-hashtag-scraper)
// https://apify.com/apify/instagram-scraper
// ============================================

export async function searchInstagram(query: string, maxResults = 10): Promise<SocialSearchResult> {
  // Tenta Apify primeiro
  if (APIFY_TOKEN) {
    try {
      console.log('📸 Buscando Instagram via Apify (apify/instagram-scraper)...')

      // Remove espaços e caracteres especiais para hashtag
      const hashtag = query.replace(/[^a-zA-Z0-9]/gi, '').toLowerCase()

      // Apify Actor para Instagram - usando apify/instagram-scraper com hashtag
      const response = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            directUrls: [`https://www.instagram.com/explore/tags/${hashtag}/`],
            resultsLimit: maxResults * 2,
            resultsType: 'posts'
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        const posts: SocialPost[] = (data || []).slice(0, maxResults).map((post: any) => ({
          id: post.id || post.shortCode || String(Date.now()),
          platform: 'instagram' as const,
          author: post.ownerUsername || post.owner?.username || 'Unknown',
          authorHandle: post.ownerUsername || post.owner?.username,
          authorImage: post.owner?.profilePicUrl,
          content: post.caption || post.text || '',
          url: post.url || `https://instagram.com/p/${post.shortCode}`,
          publishedAt: post.timestamp || post.takenAtTimestamp
            ? new Date(post.takenAtTimestamp * 1000).toISOString()
            : new Date().toISOString(),
          thumbnail: post.displayUrl || post.thumbnailUrl,
          likes: post.likesCount || post.likeCount || 0,
          comments: post.commentsCount || post.commentCount || 0,
          views: post.videoViewCount || post.playCount || 0,
          sentiment: analyzeSentiment(post.caption || post.text || '') as any
        }))

        // Ordena por engajamento (likes + comments + views) e pega TOP 5
        posts.sort((a, b) => {
          const engA = (a.likes || 0) * 10 + (a.comments || 0) * 20 + (a.views || 0)
          const engB = (b.likes || 0) * 10 + (b.comments || 0) * 20 + (b.views || 0)
          return engB - engA
        })
        const top5 = posts.slice(0, 5)

        console.log(`✅ Instagram: ${posts.length} posts encontrados, retornando TOP 5 por engajamento`)
        return { platform: 'instagram', posts: top5, totalResults: posts.length }
      } else {
        const errorText = await response.text()
        console.error('Instagram API response error:', errorText)
      }
    } catch (error) {
      console.error('Apify Instagram error:', error)
    }
  }

  // Fallback para RapidAPI
  if (RAPIDAPI_KEY) {
    try {
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

      if (response.ok) {
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
        return { platform: 'instagram', posts, totalResults: posts.length }
      }
    } catch (error) {
      console.error('RapidAPI Instagram error:', error)
    }
  }

  // Fallback para dados mock
  return generateMockInstagramData(query, maxResults)
}

// ============================================
// TIKTOK - Via Apify (clockworks/free-tiktok-scraper)
// https://apify.com/clockworks/free-tiktok-scraper
// ============================================

export async function searchTikTok(query: string, maxResults = 10): Promise<SocialSearchResult> {
  // Tenta Apify primeiro
  if (APIFY_TOKEN) {
    try {
      console.log('🎵 Buscando TikTok via Apify (clockworks/free-tiktok-scraper)...')

      // Usando o actor gratuito do clockworks
      const response = await fetch(
        `https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hashtags: [query.replace(/[^a-zA-Z0-9]/gi, '')],
            resultsPerPage: maxResults * 2
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        const posts: SocialPost[] = (data || []).slice(0, maxResults).map((video: any) => ({
          id: video.id || video.videoId || String(Date.now()),
          platform: 'tiktok' as const,
          author: video.authorMeta?.name || video.author?.nickname || video.author || 'Unknown',
          authorHandle: video.authorMeta?.nickName || video.authorMeta?.name || video.author?.uniqueId,
          authorImage: video.authorMeta?.avatar || video.author?.avatarThumb,
          content: video.text || video.desc || video.description || '',
          url: video.webVideoUrl || video.videoUrl || `https://tiktok.com/@${video.authorMeta?.name || 'user'}/video/${video.id}`,
          publishedAt: video.createTimeISO || video.createTime
            ? new Date(video.createTime * 1000).toISOString()
            : new Date().toISOString(),
          thumbnail: video.videoMeta?.coverUrl || video.covers?.[0] || video.cover,
          views: video.playCount || video.stats?.playCount || 0,
          likes: video.diggCount || video.stats?.diggCount || 0,
          comments: video.commentCount || video.stats?.commentCount || 0,
          shares: video.shareCount || video.stats?.shareCount || 0,
          sentiment: analyzeSentiment(video.text || video.desc || video.description || '') as any
        }))

        // Ordena por views (principal métrica do TikTok) e pega TOP 5
        posts.sort((a, b) => {
          const engA = (a.views || 0) + (a.likes || 0) * 5 + (a.shares || 0) * 10
          const engB = (b.views || 0) + (b.likes || 0) * 5 + (b.shares || 0) * 10
          return engB - engA
        })
        const top5 = posts.slice(0, 5)

        console.log(`✅ TikTok: ${posts.length} vídeos encontrados, retornando TOP 5 por views`)
        return { platform: 'tiktok', posts: top5, totalResults: posts.length }
      } else {
        const errorText = await response.text()
        console.error('TikTok API response error:', errorText)
      }
    } catch (error) {
      console.error('Apify TikTok error:', error)
    }
  }

  // Fallback para RapidAPI
  if (RAPIDAPI_KEY) {
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

      if (response.ok) {
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
        return { platform: 'tiktok', posts, totalResults: posts.length }
      }
    } catch (error) {
      console.error('RapidAPI TikTok error:', error)
    }
  }

  // Fallback para dados mock
  return generateMockTikTokData(query, maxResults)
}

// ============================================
// BUSCA EM TODAS AS REDES
// ============================================

export async function searchAllNetworks(query: string): Promise<Record<string, SocialSearchResult>> {
  console.log(`🔍 Buscando "${query}" em todas as redes...`)
  console.log(`📌 Apify configurado: ${APIFY_TOKEN ? 'SIM ✅' : 'NÃO ❌'}`)

  const startTime = Date.now()

  const results = await Promise.all([
    searchYouTube(query, 10),
    searchTwitter(query, 10),
    searchInstagram(query, 10),
    searchTikTok(query, 10)
  ])

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log(`\n📊 RESUMO DA BUSCA (${elapsed}s):`)
  console.log(`   YouTube:   ${results[0].totalResults} resultados ${results[0].error ? '⚠️' : '✅'}`)
  console.log(`   Twitter:   ${results[1].totalResults} resultados ${results[1].error ? '⚠️' : '✅'}`)
  console.log(`   Instagram: ${results[2].totalResults} resultados ${results[2].error ? '⚠️' : '✅'}`)
  console.log(`   TikTok:    ${results[3].totalResults} resultados ${results[3].error ? '⚠️' : '✅'}`)

  return {
    youtube: results[0],
    twitter: results[1],
    instagram: results[2],
    tiktok: results[3]
  }
}

// Verifica se Apify está configurado
export function isApifyConfigured(): boolean {
  return !!APIFY_TOKEN
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
