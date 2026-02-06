/**
 * RadarPolítico - Google News Scraper
 * Busca notícias via RSS do Google News
 */

export interface NewsArticle {
  title: string
  link: string
  source: string
  pubDate: string
  description: string
}

/**
 * Busca notícias no Google News para um termo específico
 */
export async function searchGoogleNews(query: string, maxResults = 20): Promise<NewsArticle[]> {
  // URL do RSS do Google News Brasil
  const encodedQuery = encodeURIComponent(query)
  const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=pt-BR&gl=BR&ceid=BR:pt-419`

  try {
    // Usar um proxy CORS ou fazer a chamada do backend
    // Por enquanto, vamos usar um serviço de proxy público para testes
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`

    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const xmlText = await response.text()
    return parseRSSFeed(xmlText, maxResults)
  } catch (error) {
    console.error('Erro ao buscar Google News:', error)
    return []
  }
}

/**
 * Parseia o XML do RSS e extrai os artigos
 */
function parseRSSFeed(xmlText: string, maxResults: number): NewsArticle[] {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

  const items = xmlDoc.querySelectorAll('item')
  const articles: NewsArticle[] = []

  items.forEach((item, index) => {
    if (index >= maxResults) return

    const title = item.querySelector('title')?.textContent || ''
    const link = item.querySelector('link')?.textContent || ''
    const pubDate = item.querySelector('pubDate')?.textContent || ''
    const description = item.querySelector('description')?.textContent || ''

    // Extrair fonte do título (formato: "Título - Fonte")
    const sourceMatch = title.match(/ - ([^-]+)$/)
    const source = sourceMatch ? sourceMatch[1].trim() : 'Desconhecido'
    const cleanTitle = sourceMatch ? title.replace(/ - [^-]+$/, '').trim() : title

    articles.push({
      title: cleanTitle,
      link: extractRealUrl(link),
      source,
      pubDate,
      description: cleanDescription(description)
    })
  })

  return articles
}

/**
 * Extrai a URL real do link do Google News
 * O Google News codifica a URL real em base64 no parâmetro
 */
function extractRealUrl(googleNewsUrl: string): string {
  try {
    // Links do Google News têm formato:
    // https://news.google.com/rss/articles/CBMi...
    // A parte após "articles/" é base64 que contém a URL real

    if (googleNewsUrl.includes('news.google.com')) {
      // Tenta extrair a URL do formato base64
      const match = googleNewsUrl.match(/articles\/([^?]+)/)
      if (match && match[1]) {
        // O base64 do Google tem um formato especial
        // Decodifica e extrai a URL
        const encoded = match[1]
        try {
          // Tenta decodificar base64
          const decoded = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
          // Busca por URLs no texto decodificado
          const urlMatch = decoded.match(/https?:\/\/[^\s"<>]+/)
          if (urlMatch) {
            return urlMatch[0]
          }
        } catch {
          // Se falhar a decodificação, retorna o original
        }
      }

      // Fallback: retorna URL do Google News que pelo menos funciona como redirect
      return googleNewsUrl
    }

    return googleNewsUrl
  } catch {
    return googleNewsUrl
  }
}

/**
 * Limpa a descrição removendo tags HTML
 */
function cleanDescription(description: string): string {
  // Remove tags HTML
  const temp = document.createElement('div')
  temp.innerHTML = description
  return temp.textContent || temp.innerText || ''
}

/**
 * Busca notícias para um político específico
 * Combina nome + apelido + partido para melhor cobertura
 */
export async function searchPoliticianNews(
  name: string,
  nickname?: string,
  party?: string
): Promise<NewsArticle[]> {
  const queries: string[] = []

  // Query principal com nome completo
  queries.push(`"${name}"`)

  // Se tem apelido, busca também
  if (nickname && nickname !== name) {
    queries.push(`"${nickname}"`)
  }

  // Busca combinada nome + partido
  if (party) {
    queries.push(`"${name}" ${party}`)
  }

  // Executa todas as buscas em paralelo
  const results = await Promise.all(
    queries.map(q => searchGoogleNews(q, 10))
  )

  // Combina e remove duplicatas por URL
  const allArticles = results.flat()
  const uniqueArticles = removeDuplicates(allArticles)

  // Ordena por data (mais recente primeiro)
  return uniqueArticles.sort((a, b) =>
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  )
}

/**
 * Remove artigos duplicados baseado na URL
 */
function removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>()
  return articles.filter(article => {
    if (seen.has(article.link)) {
      return false
    }
    seen.add(article.link)
    return true
  })
}
