/**
 * RadarPolítico - Edge Function: Análise de Menção
 * Usa Claude API para analisar sentimento e relevância
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface AnalysisRequest {
  title: string
  description: string
  source: string
  politicianName: string
}

interface AnalysisResponse {
  sentiment: 'positivo' | 'negativo' | 'neutro'
  sentimentScore: number
  relevanceScore: number
  summary: string
  topics: string[]
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title, description, source, politicianName }: AnalysisRequest = await req.json()

    if (!ANTHROPIC_API_KEY) {
      // Fallback para análise simples se não tem API key
      return new Response(
        JSON.stringify(analyzeSimple(title, description, politicianName)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Chama Claude API para análise
    const analysis = await analyzeWithClaude(title, description, source, politicianName)

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro na análise:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao analisar menção' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function analyzeWithClaude(
  title: string,
  description: string,
  source: string,
  politicianName: string
): Promise<AnalysisResponse> {
  const prompt = `Você é um analista político especializado em monitoramento de mídia no Brasil.

Analise a seguinte notícia sobre o político "${politicianName}":

TÍTULO: ${title}
FONTE: ${source}
DESCRIÇÃO: ${description}

Responda APENAS com um JSON válido no seguinte formato (sem explicações adicionais):
{
  "sentiment": "positivo" | "negativo" | "neutro",
  "sentimentScore": <número de -1.0 a 1.0>,
  "relevanceScore": <número de 0.0 a 1.0 indicando relevância para o político>,
  "summary": "<resumo de 1-2 frases do impacto para o político>",
  "topics": ["<tópico1>", "<tópico2>"]
}

Considere:
- Sentimento POSITIVO: notícia favorável à imagem do político
- Sentimento NEGATIVO: notícia desfavorável, críticas, escândalos
- Sentimento NEUTRO: notícia informativa sem viés claro
- Relevância alta: notícia diretamente sobre o político
- Relevância média: político mencionado mas não é foco principal
- Relevância baixa: menção tangencial`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Parse o JSON da resposta
  try {
    return JSON.parse(content)
  } catch {
    // Se falhar o parse, retorna análise simples
    return analyzeSimple(title, description, politicianName)
  }
}

function analyzeSimple(title: string, description: string, politicianName: string): AnalysisResponse {
  const text = `${title} ${description}`.toLowerCase()

  const positiveWords = ['aprova', 'conquista', 'sucesso', 'vitória', 'apoio', 'elogia', 'lidera', 'popular']
  const negativeWords = ['critica', 'acusa', 'investiga', 'denuncia', 'escândalo', 'corrupção', 'derrota', 'crise']

  let score = 0
  positiveWords.forEach(word => { if (text.includes(word)) score += 0.25 })
  negativeWords.forEach(word => { if (text.includes(word)) score -= 0.25 })
  score = Math.max(-1, Math.min(1, score))

  let sentiment: 'positivo' | 'negativo' | 'neutro' = 'neutro'
  if (score > 0.2) sentiment = 'positivo'
  else if (score < -0.2) sentiment = 'negativo'

  const relevance = text.includes(politicianName.toLowerCase()) ? 0.8 : 0.5

  return {
    sentiment,
    sentimentScore: score,
    relevanceScore: relevance,
    summary: description.substring(0, 150) + '...',
    topics: ['política']
  }
}
