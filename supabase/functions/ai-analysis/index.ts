/**
 * RadarPolítico - Edge Function: Análise com IA
 * Proxy seguro para chamadas OpenAI (chave nunca exposta no frontend)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured', fallback: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { systemPrompt, userMessage, model, temperature, maxTokens } = await req.json()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: temperature ?? 0.3,
        max_tokens: maxTokens || 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      return new Response(
        JSON.stringify({ error: error.error?.message || 'OpenAI API error', fallback: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    const content = result.choices[0]?.message?.content

    return new Response(
      JSON.stringify({ content, fallback: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', fallback: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
