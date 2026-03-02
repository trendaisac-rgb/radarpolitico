/**
 * RadarPolítico - Social Media Monitor 360°
 * Busca menções em todas as redes sociais
 *
 * ESTRATÉGIA DE APIS (em ordem de prioridade):
 * 1. APIs Gratuitas (YouTube, Google News RSS)
 * 2. Nitter (Twitter sem API) - instâncias públicas
 * 3. RapidAPI (tier gratuito)
 * 4. Apify (quando configurado)
 * 5. Dados de demonstração (fallback)
 */

// ============================================
// CONFIGURAÇÕES DAS APIs
// ============================================

// YouTube - API Oficial Google (GRATUITA - 10.000 requests/dia)
const YOUTUBE_API_KEY = 'AIzaSyDiWL7KRLW16HrfxAT2bXpdoL5tpltuTU0'

// Apify - $5/mês GRÁTIS (opcional)
const APIFY_TOKEN = 'apify_api_YE1jV1cLMLpUaJ4FpNd6mgYoftRpvc4kYJqL'

// RapidAPI - Tier gratuito (opcional)
const RAPIDAPI_KEY = ''

// Nitter - Instâncias públicas para Twitter (GRATUITO)
const NITTER_INSTANCES = [
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
  'https://nitter.1d4.us',
  'https://nitter.kavin.rocks'
]

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
  source?: string // Indica qual API foi usada
}

// ============================================
// YOUTUBE - API OFICIAL GRATUITA ✅
// 10.000 requests/dia GRÁTIS
// ============================================

export async function searchYouTube(query: string, maxResults = 10): Promise<SocialSearchResult> {
  try {
    console.log('▶️ Buscando YouTube (API Oficial)...')

    // Últimas 24 horas
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const publishedAfter = yesterday.toISOString()

    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(maxResults * 2),
      order: 'viewCount',
      relevanceLanguage: 'pt',
      regionCode: 'BR',
      publishedAfter: publishedAfter,
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

    console.log(`✅ YouTube: ${posts.length} vídeos encontrados`)
    return { platform: 'youtube', posts: top5, totalResults: posts.length, source: 'YouTube API' }
  } catch (error) {
    console.error('YouTube search error:', error)
    return { platform: 'youtube', posts: [], totalResults: 0, error: String(error) }
  }
}

// ============================================
// TWITTER/X - Via Nitter (GRATUITO) ou Apify
// ============================================

export async function searchTwitter(query: string, maxResults = 10): Promise<SocialSearchResult> {
  // Tenta Nitter primeiro (GRATUITO)
  const nitterResult = await searchTwitterViaNitter(query, maxResults)
  if (nitterResult.posts.length > 0) {
    return nitterResult
  }

  // Tenta Apify como fallback
  if (APIFY_TOKEN) {
    const apifyResult = await searchTwitterViaApify(query, maxResults)
    if (apifyResult.posts.length > 0) {
      return apifyResult
    }
  }

  // Fallback para dados de demonstração
  console.log('⚠️ Twitter: Usando dados de demonstração')
  return generateDemoTwitterData(query)
}

async function searchTwitterViaNitter(query: string, maxResults: number): Promise<SocialSearchResult> {
  console.log('🐦 Buscando Twitter via Nitter (GRATUITO)...')

  // Tenta várias instâncias Nitter
  for (const instance of NITTER_INSTANCES) {
    try {
      const searchUrl = `${instance}/search?f=tweets&q=${encodeURIComponent(query)}`
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) continue

      const html = await response.text()
      const posts = parseNitterHTML(html, maxResults)

      if (posts.length > 0) {
        console.log(`✅ Twitter (Nitter): ${posts.length} tweets encontrados`)
        return { platform: 'twitter', posts, totalResults: posts.length, source: 'Nitter' }
      }
    } catch (error) {
      console.log(`Nitter ${instance} falhou, tentando próximo...`)
    }
  }

  return { platform: 'twitter', posts: [], totalResults: 0 }
}

function parseNitterHTML(html: string, maxResults: number): SocialPost[] {
  const posts: SocialPost[] = []

  // Regex simples para extrair tweets do HTML do Nitter
  const tweetRegex = /<div class="tweet-content[^"]*"[^>]*>([^<]+)<\/div>/gi
  const authorRegex = /<a class="username"[^>]*>@([^<]+)<\/a>/gi
  const statsRegex = /<span class="tweet-stat[^"]*"[^>]*>([0-9,]+)<\/span>/gi

  let match
  let i = 0

  while ((match = tweetRegex.exec(html)) !== null && i < maxResults) {
    const content = match[1].trim()
    if (content.length > 10) {
      posts.push({
        id: `nitter_${Date.now()}_${i}`,
        platform: 'twitter',
        author: 'Twitter User',
        content: content,
        url: `https://twitter.com/search?q=${encodeURIComponent(content.substring(0, 50))}`,
        publishedAt: new Date().toISOString(),
        sentiment: analyzeSentiment(content) as any
      })
      i++
    }
  }

  return posts
}

async function searchTwitterViaApify(query: string, maxResults: number): Promise<SocialSearchResult> {
  try {
    console.log('🐦 Buscando Twitter via Apify...')

    const response = await fetch(
      `https://api.apify.com/v2/acts/rBaTEHzveTxZPraGv/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          maxItems: maxResults * 2
        })
      }
    )

    if (!response.ok) {
      throw new Error('Apify Twitter error')
    }

    const data = await response.json()

    const posts: SocialPost[] = (data || []).slice(0, maxResults).map((tweet: any) => ({
      id: tweet.id || String(Date.now()),
      platform: 'twitter' as const,
      author: tweet.author?.name || tweet.user?.name || 'Twitter User',
      authorHandle: tweet.author?.userName || tweet.user?.screen_name || '',
      content: tweet.text || tweet.full_text || '',
      url: tweet.url || `https://twitter.com/i/status/${tweet.id}`,
      publishedAt: tweet.createdAt || new Date().toISOString(),
      views: tweet.viewCount || tweet.views || 0,
      likes: tweet.likeCount || tweet.favorite_count || 0,
      comments: tweet.replyCount || tweet.reply_count || 0,
      shares: tweet.retweetCount || tweet.retweet_count || 0,
      sentiment: analyzeSentiment(tweet.text || '') as any
    }))

    // Ordena por engajamento
    posts.sort((a, b) => {
      const engA = (a.views || 0) + (a.likes || 0) * 10 + (a.shares || 0) * 20
      const engB = (b.views || 0) + (b.likes || 0) * 10 + (b.shares || 0) * 20
      return engB - engA
    })

    console.log(`✅ Twitter (Apify): ${posts.length} tweets encontrados`)
    return { platform: 'twitter', posts: posts.slice(0, 5), totalResults: posts.length, source: 'Apify' }
  } catch (error) {
    console.error('Apify Twitter error:', error)
    return { platform: 'twitter', posts: [], totalResults: 0 }
  }
}

// ============================================
// INSTAGRAM - Via Apify ou Demo
// ============================================

export async function searchInstagram(query: string, maxResults = 10): Promise<SocialSearchResult> {
  // Tenta Apify primeiro
  if (APIFY_TOKEN) {
    const apifyResult = await searchInstagramViaApify(query, maxResults)
    if (apifyResult.posts.length > 0) {
      return apifyResult
    }
  }

  // Fallback para dados de demonstração
  console.log('⚠️ Instagram: Usando dados de demonstração')
  return generateDemoInstagramData(query)
}

async function searchInstagramViaApify(query: string, maxResults: number): Promise<SocialSearchResult> {
  try {
    console.log('📸 Buscando Instagram via Apify...')

    const hashtag = query.replace(/[^a-zA-Z0-9]/gi, '').toLowerCase()

    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: hashtag,
          searchType: 'hashtag',
          resultsLimit: maxResults * 2
        })
      }
    )

    if (!response.ok) {
      throw new Error('Apify Instagram error')
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return { platform: 'instagram', posts: [], totalResults: 0 }
    }

    const posts: SocialPost[] = (data || []).slice(0, maxResults).map((post: any) => ({
      id: post.id || post.shortCode || String(Date.now()),
      platform: 'instagram' as const,
      author: post.ownerUsername || post.owner?.username || 'Instagram User',
      authorHandle: post.ownerUsername || '',
      content: post.caption || post.text || '',
      url: post.url || `https://www.instagram.com/p/${post.shortCode}/`,
      publishedAt: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : new Date().toISOString(),
      thumbnail: post.displayUrl || post.thumbnailUrl || '',
      likes: post.likesCount || post.likes || 0,
      comments: post.commentsCount || post.comments || 0,
      views: post.videoViewCount || post.videoPlayCount || 0,
      sentiment: analyzeSentiment(post.caption || '') as any
    }))

    // Ordena por engajamento
    posts.sort((a, b) => {
      const engA = (a.likes || 0) * 10 + (a.comments || 0) * 20 + (a.views || 0)
      const engB = (b.likes || 0) * 10 + (b.comments || 0) * 20 + (b.views || 0)
      return engB - engA
    })

    console.log(`✅ Instagram (Apify): ${posts.length} posts encontrados`)
    return { platform: 'instagram', posts: posts.slice(0, 5), totalResults: posts.length, source: 'Apify' }
  } catch (error) {
    console.error('Apify Instagram error:', error)
    return { platform: 'instagram', posts: [], totalResults: 0 }
  }
}

// ============================================
// TIKTOK - Via Apify ou Demo
// ============================================

export async function searchTikTok(query: string, maxResults = 10): Promise<SocialSearchResult> {
  // Tenta Apify primeiro
  if (APIFY_TOKEN) {
    const apifyResult = await searchTikTokViaApify(query, maxResults)
    if (apifyResult.posts.length > 0) {
      return apifyResult
    }
  }

  // Fallback para dados de demonstração
  console.log('⚠️ TikTok: Usando dados de demonstração')
  return generateDemoTikTokData(query)
}

async function searchTikTokViaApify(query: string, maxResults: number): Promise<SocialSearchResult> {
  try {
    console.log('🎵 Buscando TikTok via Apify...')

    const response = await fetch(
      `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQueries: [query],
          resultsPerPage: maxResults * 2,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false
        })
      }
    )

    if (!response.ok) {
      throw new Error('Apify TikTok error')
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return { platform: 'tiktok', posts: [], totalResults: 0 }
    }

    const posts: SocialPost[] = (data || []).slice(0, maxResults).map((video: any) => ({
      id: video.id || video.videoId || String(Date.now()),
      platform: 'tiktok' as const,
      author: video.authorMeta?.name || video.author?.nickname || video.author || 'TikTok User',
      authorHandle: video.authorMeta?.nickName || video.authorMeta?.name || '',
      authorImage: video.authorMeta?.avatar || '',
      content: video.text || video.desc || video.description || '',
      url: video.webVideoUrl || video.videoUrl || '',
      publishedAt: video.createTimeISO || (video.createTime ? new Date(video.createTime * 1000).toISOString() : new Date().toISOString()),
      thumbnail: video.videoMeta?.coverUrl || video.covers?.[0] || video.cover,
      views: video.playCount || video.stats?.playCount || 0,
      likes: video.diggCount || video.stats?.diggCount || 0,
      comments: video.commentCount || video.stats?.commentCount || 0,
      shares: video.shareCount || video.stats?.shareCount || 0,
      sentiment: analyzeSentiment(video.text || video.desc || '') as any
    }))

    // Ordena por views
    posts.sort((a, b) => {
      const engA = (a.views || 0) + (a.likes || 0) * 5 + (a.shares || 0) * 10
      const engB = (b.views || 0) + (b.likes || 0) * 5 + (b.shares || 0) * 10
      return engB - engA
    })

    console.log(`✅ TikTok (Apify): ${posts.length} vídeos encontrados`)
    return { platform: 'tiktok', posts: posts.slice(0, 5), totalResults: posts.length, source: 'Apify' }
  } catch (error) {
    console.error('Apify TikTok error:', error)
    return { platform: 'tiktok', posts: [], totalResults: 0 }
  }
}

// ============================================
// BUSCA EM TODAS AS REDES
// ============================================

export async function searchAllNetworks(query: string): Promise<Record<string, SocialSearchResult>> {
  console.log(`\n🔍 ════════════════════════════════════════`)
  console.log(`   BUSCANDO: "${query}"`)
  console.log(`════════════════════════════════════════\n`)

  const startTime = Date.now()

  // Only search YouTube - faster and more relevant for political monitoring
  const youtubeResult = await searchYouTube(query, 10)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log(`\n📊 ════════════════════════════════════════`)
  console.log(`   RESUMO DA BUSCA (${elapsed}s)`)
  console.log(`════════════════════════════════════════`)
  console.log(`   YouTube:   ${youtubeResult.totalResults} resultados ${youtubeResult.source ? `(${youtubeResult.source})` : ''} ${youtubeResult.error ? '⚠️' : '✅'}`)
  console.log(`════════════════════════════════════════\n`)

  return {
    youtube: youtubeResult,
    twitter: { platform: 'twitter', posts: [], totalResults: 0 },
    instagram: { platform: 'instagram', posts: [], totalResults: 0 },
    tiktok: { platform: 'tiktok', posts: [], totalResults: 0 }
  }
}

// ============================================
// DADOS DE DEMONSTRAÇÃO (Realistas)
// ============================================

function generateDemoTwitterData(query: string): SocialSearchResult {
  const now = new Date()
  const posts: SocialPost[] = [
    {
      id: `tw_demo_1`,
      platform: 'twitter',
      author: 'Folha de S.Paulo',
      authorHandle: 'folha',
      content: `${query} em destaque: Declaração gera repercussão nas redes sociais e divide opiniões entre apoiadores e críticos`,
      url: `https://twitter.com/folha/status/${Date.now()}`,
      publishedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      views: 45000,
      likes: 1200,
      comments: 340,
      shares: 580,
      sentiment: 'neutro'
    },
    {
      id: `tw_demo_2`,
      platform: 'twitter',
      author: 'UOL Notícias',
      authorHandle: 'uikiuol',
      content: `URGENTE: ${query} se pronuncia sobre polêmica e defende posição em entrevista exclusiva`,
      url: `https://twitter.com/uikiuol/status/${Date.now() + 1}`,
      publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      views: 32000,
      likes: 890,
      comments: 210,
      shares: 420,
      sentiment: 'neutro'
    },
    {
      id: `tw_demo_3`,
      platform: 'twitter',
      author: 'G1',
      authorHandle: 'g1',
      content: `Entenda a repercussão: ${query} vira assunto mais comentado após declaração polêmica`,
      url: `https://twitter.com/g1/status/${Date.now() + 2}`,
      publishedAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
      views: 28000,
      likes: 650,
      comments: 180,
      shares: 290,
      sentiment: 'neutro'
    },
    {
      id: `tw_demo_4`,
      platform: 'twitter',
      author: 'Estadão',
      authorHandle: 'estadao',
      content: `Análise: O impacto das declarações de ${query} na política brasileira`,
      url: `https://twitter.com/estadao/status/${Date.now() + 3}`,
      publishedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      views: 18000,
      likes: 420,
      comments: 95,
      shares: 180,
      sentiment: 'neutro'
    },
    {
      id: `tw_demo_5`,
      platform: 'twitter',
      author: 'Poder360',
      authorHandle: 'poder360',
      content: `${query}: Veja a cronologia dos acontecimentos das últimas 24 horas`,
      url: `https://twitter.com/poder360/status/${Date.now() + 4}`,
      publishedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      views: 12000,
      likes: 280,
      comments: 65,
      shares: 120,
      sentiment: 'neutro'
    }
  ]

  return { platform: 'twitter', posts, totalResults: posts.length, source: 'Demo' }
}

function generateDemoInstagramData(query: string): SocialSearchResult {
  const now = new Date()
  const posts: SocialPost[] = [
    {
      id: `ig_demo_1`,
      platform: 'instagram',
      author: 'Brasil Político',
      authorHandle: 'brasilpolitico',
      content: `🇧🇷 #${query.replace(/\s+/g, '')} em destaque! Acompanhe as principais notícias e análises sobre o cenário político brasileiro. #Política #Brasil`,
      url: `https://instagram.com/p/demo1`,
      publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      likes: 5400,
      comments: 230,
      views: 45000,
      sentiment: 'neutro'
    },
    {
      id: `ig_demo_2`,
      platform: 'instagram',
      author: 'Foco Político',
      authorHandle: 'focopolitico',
      content: `📊 Análise completa sobre ${query}: O que esperar para os próximos dias? Confira! #AnálisePolítica`,
      url: `https://instagram.com/p/demo2`,
      publishedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      likes: 3200,
      comments: 145,
      views: 28000,
      sentiment: 'neutro'
    },
    {
      id: `ig_demo_3`,
      platform: 'instagram',
      author: 'Notícias BR',
      authorHandle: 'noticiasbr',
      content: `🗳️ ${query}: Repercussão nas redes sociais mostra divisão entre apoiadores e críticos #Eleições`,
      url: `https://instagram.com/p/demo3`,
      publishedAt: new Date(now.getTime() - 6 * 3600000).toISOString(),
      likes: 2100,
      comments: 89,
      views: 18000,
      sentiment: 'neutro'
    },
    {
      id: `ig_demo_4`,
      platform: 'instagram',
      author: 'Política Hoje',
      authorHandle: 'politicahoje',
      content: `💬 O que dizem os especialistas sobre ${query}? Confira as opiniões mais relevantes #Debate`,
      url: `https://instagram.com/p/demo4`,
      publishedAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      likes: 1800,
      comments: 67,
      views: 12000,
      sentiment: 'neutro'
    },
    {
      id: `ig_demo_5`,
      platform: 'instagram',
      author: 'Cenário Político',
      authorHandle: 'cenariopolitico',
      content: `📰 Resumo do dia: Tudo sobre ${query} nas últimas 24 horas #ResumoPolítico`,
      url: `https://instagram.com/p/demo5`,
      publishedAt: new Date(now.getTime() - 10 * 3600000).toISOString(),
      likes: 1200,
      comments: 45,
      views: 8500,
      sentiment: 'neutro'
    }
  ]

  return { platform: 'instagram', posts, totalResults: posts.length, source: 'Demo' }
}

function generateDemoTikTokData(query: string): SocialSearchResult {
  const now = new Date()
  const posts: SocialPost[] = [
    {
      id: `tt_demo_1`,
      platform: 'tiktok',
      author: 'Política Jovem',
      authorHandle: 'politicajovem',
      content: `${query} viraliza nas redes! Entenda o que está acontecendo em 60 segundos 🔥 #política #viral`,
      url: `https://tiktok.com/@politicajovem/video/demo1`,
      publishedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      views: 250000,
      likes: 45000,
      comments: 3200,
      shares: 8500,
      sentiment: 'neutro'
    },
    {
      id: `tt_demo_2`,
      platform: 'tiktok',
      author: 'Brasil News',
      authorHandle: 'brasilnews',
      content: `O que você precisa saber sobre ${query} - resumo rápido! #notícias #brasil`,
      url: `https://tiktok.com/@brasilnews/video/demo2`,
      publishedAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
      views: 180000,
      likes: 32000,
      comments: 2100,
      shares: 5600,
      sentiment: 'neutro'
    },
    {
      id: `tt_demo_3`,
      platform: 'tiktok',
      author: 'TikTok Política',
      authorHandle: 'tiktokpolitica',
      content: `Entenda a polêmica de ${query} - análise completa em 3 minutos #análise`,
      url: `https://tiktok.com/@tiktokpolitica/video/demo3`,
      publishedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      views: 120000,
      likes: 18000,
      comments: 1400,
      shares: 3200,
      sentiment: 'neutro'
    },
    {
      id: `tt_demo_4`,
      platform: 'tiktok',
      author: 'Viral BR',
      authorHandle: 'viralbr',
      content: `${query}: A reação do público nas redes sociais é surpreendente! #viral #trending`,
      url: `https://tiktok.com/@viralbr/video/demo4`,
      publishedAt: new Date(now.getTime() - 7 * 3600000).toISOString(),
      views: 85000,
      likes: 12000,
      comments: 890,
      shares: 2100,
      sentiment: 'neutro'
    },
    {
      id: `tt_demo_5`,
      platform: 'tiktok',
      author: 'Fatos Políticos',
      authorHandle: 'fatospoliticos',
      content: `POV: Você acaba de descobrir a última sobre ${query} #pov #política`,
      url: `https://tiktok.com/@fatospoliticos/video/demo5`,
      publishedAt: new Date(now.getTime() - 9 * 3600000).toISOString(),
      views: 65000,
      likes: 8500,
      comments: 620,
      shares: 1500,
      sentiment: 'neutro'
    }
  ]

  return { platform: 'tiktok', posts, totalResults: posts.length, source: 'Demo' }
}

// ============================================
// ANÁLISE DE SENTIMENTO
// ============================================

export function analyzeSentiment(text: string): 'positivo' | 'negativo' | 'neutro' {
  const lower = text.toLowerCase()

  // Comprehensive Brazilian political vocabulary
  const positiveWords = [
    // General positive
    'aprova', 'elogia', 'sucesso', 'vitória', 'conquista', 'apoio', 'excelente',
    'bom', 'ótimo', 'melhor', 'parabeniza', 'crescimento', 'avanço', 'positivo',
    'favorável', 'importante', 'destaque', 'lidera', 'popular', 'herói', 'coragem',
    // Brazilian political context - positive framing
    'acorda', 'liberdade', 'democracia', 'povo', 'luta', 'defende', 'líder',
    'ovação', 'aplausos', 'manifestação', 'histórico', 'mandou recado',
    'parou', 'levantou', 'mostrou força', 'enfrentou', 'resgatou'
  ]

  const negativeWords = [
    // General negative
    'critica', 'acusa', 'escândalo', 'polêmica', 'fracasso', 'derrota', 'erro',
    'problema', 'crise', 'investiga', 'denuncia', 'corrupção', 'fraude', 'prisão',
    'condenado', 'rejeita', 'protesto', 'negativo', 'queda',
    // Brazilian political vocabulary - negative
    'pateta', 'burro', 'idiota', 'cadeia', 'merecem cadeia', 'contra', 'abusos',
    'censura', 'mentira', 'golpe', 'vergonha', 'absurdo', 'criminoso', 'ladrão',
    'corrupto', 'ditadura', 'tirania', 'escravidão', 'perseguição'
  ]

  let score = 0

  // Check for positive words
  positiveWords.forEach(word => {
    if (lower.includes(word)) score++
  })

  // Check for negative words
  negativeWords.forEach(word => {
    if (lower.includes(word)) score--
  })

  // Special case: "manifestação" or protest-related content with specific framing
  // If it mentions a politician's name in a positive context like "parou AV Paulista" or "HISTÓRICO"
  if ((lower.includes('parou') || lower.includes('histórico') || lower.includes('mandou')) &&
      (lower.includes('manifestação') || lower.includes('avenida') || lower.includes('paulista'))) {
    // Check if there are negative indicators too
    const hasNegativeOverride = negativeWords.some(w => lower.includes(w))
    if (!hasNegativeOverride) score++
  }

  // Heavy weight for the insult "pateta"
  if (lower.includes('pateta')) {
    score -= 2
  }

  if (score > 0) return 'positivo'
  if (score < 0) return 'negativo'
  return 'neutro'
}

// ============================================
// UTILITÁRIOS
// ============================================

export function isApifyConfigured(): boolean {
  return !!APIFY_TOKEN
}

export function formatMetric(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

export function getAPIStatus(): { youtube: boolean; twitter: string; instagram: string; tiktok: string } {
  return {
    youtube: !!YOUTUBE_API_KEY,
    twitter: APIFY_TOKEN ? 'Apify' : 'Demo',
    instagram: APIFY_TOKEN ? 'Apify' : 'Demo',
    tiktok: APIFY_TOKEN ? 'Apify' : 'Demo'
  }
}
