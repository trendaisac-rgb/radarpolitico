/**
 * RadarPolítico - Simulador de Mensagem
 * Teste reação pública antes de comunicar oficialmente
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  ArrowLeft, Loader2, MessageSquare, Send, BarChart3,
  Clock, Target, Sparkles, TrendingUp, Users, ThumbsUp, ThumbsDown, Minus
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'
const THEMES: Record<ThemeKey, any> = {
  azul: { bgGradient: 'linear-gradient(135deg, hsl(215,30%,8%) 0%, hsl(220,35%,12%) 50%, hsl(210,25%,10%) 100%)', cardBg: 'hsl(215,25%,12%)', cardBorder: 'hsl(215,25%,20%)', cardHoverBorder: 'hsl(215,25%,30%)', accentText: 'hsl(210,40%,60%)', accentMuted: 'hsl(210,40%,20%)', filterBg: 'hsl(215,25%,15%)', mutedText: 'hsl(215,15%,50%)', brightText: 'hsl(210,40%,98%)', bodyText: 'hsl(215,15%,65%)', chartGrid: 'hsl(215,25%,20%)', tooltipBg: 'hsl(215,25%,15%)', tooltipBorder: 'hsl(215,25%,25%)' },
  verde: { bgGradient: 'linear-gradient(135deg, hsl(155,30%,8%) 0%, hsl(160,35%,12%) 50%, hsl(150,25%,10%) 100%)', cardBg: 'hsl(155,25%,12%)', cardBorder: 'hsl(155,25%,20%)', cardHoverBorder: 'hsl(155,25%,30%)', accentText: 'hsl(152,45%,55%)', accentMuted: 'hsl(152,40%,20%)', filterBg: 'hsl(155,25%,15%)', mutedText: 'hsl(155,15%,50%)', brightText: 'hsl(150,40%,98%)', bodyText: 'hsl(155,15%,65%)', chartGrid: 'hsl(155,25%,20%)', tooltipBg: 'hsl(155,25%,15%)', tooltipBorder: 'hsl(155,25%,25%)' },
  vermelho: { bgGradient: 'linear-gradient(135deg, hsl(0,30%,8%) 0%, hsl(5,35%,12%) 50%, hsl(355,25%,10%) 100%)', cardBg: 'hsl(0,25%,12%)', cardBorder: 'hsl(0,25%,20%)', cardHoverBorder: 'hsl(0,25%,30%)', accentText: 'hsl(0,70%,55%)', accentMuted: 'hsl(0,40%,20%)', filterBg: 'hsl(0,25%,15%)', mutedText: 'hsl(0,15%,50%)', brightText: 'hsl(0,40%,98%)', bodyText: 'hsl(0,15%,65%)', chartGrid: 'hsl(0,25%,20%)', tooltipBg: 'hsl(0,25%,15%)', tooltipBorder: 'hsl(0,25%,25%)' },
  amarelo: { bgGradient: 'linear-gradient(135deg, hsl(45,30%,8%) 0%, hsl(50,35%,12%) 50%, hsl(40,25%,10%) 100%)', cardBg: 'hsl(45,25%,12%)', cardBorder: 'hsl(45,25%,20%)', cardHoverBorder: 'hsl(45,25%,30%)', accentText: 'hsl(45,95%,50%)', accentMuted: 'hsl(45,40%,20%)', filterBg: 'hsl(45,25%,15%)', mutedText: 'hsl(45,15%,50%)', brightText: 'hsl(45,40%,98%)', bodyText: 'hsl(45,15%,65%)', chartGrid: 'hsl(45,25%,20%)', tooltipBg: 'hsl(45,25%,15%)', tooltipBorder: 'hsl(45,25%,25%)' },
  roxo: { bgGradient: 'linear-gradient(135deg, hsl(270,30%,8%) 0%, hsl(275,35%,12%) 50%, hsl(265,25%,10%) 100%)', cardBg: 'hsl(270,25%,12%)', cardBorder: 'hsl(270,25%,20%)', cardHoverBorder: 'hsl(270,25%,30%)', accentText: 'hsl(270,60%,55%)', accentMuted: 'hsl(270,40%,20%)', filterBg: 'hsl(270,25%,15%)', mutedText: 'hsl(270,15%,50%)', brightText: 'hsl(270,40%,98%)', bodyText: 'hsl(270,15%,65%)', chartGrid: 'hsl(270,25%,20%)', tooltipBg: 'hsl(270,25%,15%)', tooltipBorder: 'hsl(270,25%,25%)' },
  teal: { bgGradient: 'linear-gradient(135deg, hsl(180,30%,8%) 0%, hsl(185,35%,12%) 50%, hsl(175,25%,10%) 100%)', cardBg: 'hsl(180,25%,12%)', cardBorder: 'hsl(180,25%,20%)', cardHoverBorder: 'hsl(180,25%,30%)', accentText: 'hsl(180,50%,55%)', accentMuted: 'hsl(180,40%,20%)', filterBg: 'hsl(180,25%,15%)', mutedText: 'hsl(180,15%,50%)', brightText: 'hsl(180,40%,98%)', bodyText: 'hsl(180,15%,65%)', chartGrid: 'hsl(180,25%,20%)', tooltipBg: 'hsl(180,25%,15%)', tooltipBorder: 'hsl(180,25%,25%)' },
}

interface SimulationResult {
  sentimentoGeral: number
  positivo: number
  neutro: number
  negativo: number
  melhorHorario: string
  melhorCanal: string
  riscoPolitico: 'baixo' | 'medio' | 'alto'
  sugestoes: string[]
  segmentos: Array<{ nome: string; reacao: string; pct: number }>
}

export default function MessageTest() {
  const navigate = useNavigate()
  const [themeKey] = useState<ThemeKey>(() => (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul')
  const t = THEMES[themeKey]
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [message, setMessage] = useState('')
  const [canal, setCanal] = useState('twitter')
  const [tom, setTom] = useState('institucional')
  const [result, setResult] = useState<SimulationResult | null>(null)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setLoading(false)
    }
    check()
  }, [navigate])

  const simulate = () => {
    if (!message.trim()) { toast.error('Escreva uma mensagem para simular'); return }
    setSimulating(true)
    setTimeout(() => {
      const isPositive = message.toLowerCase().includes('saúde') || message.toLowerCase().includes('educação') || message.toLowerCase().includes('investir')
      const isNegative = message.toLowerCase().includes('cortar') || message.toLowerCase().includes('privatizar') || message.toLowerCase().includes('contra')
      const baseSentiment = isPositive ? 72 : isNegative ? 35 : 55
      const pos = isPositive ? 58 : isNegative ? 18 : 35
      const neg = isPositive ? 12 : isNegative ? 52 : 25
      setResult({
        sentimentoGeral: baseSentiment + Math.floor(Math.random() * 10 - 5),
        positivo: pos + Math.floor(Math.random() * 8),
        neutro: 100 - pos - neg + Math.floor(Math.random() * 5),
        negativo: neg + Math.floor(Math.random() * 8),
        melhorHorario: isPositive ? '08:00 - 10:00' : '18:00 - 20:00',
        melhorCanal: canal === 'twitter' ? 'Twitter/X' : canal === 'instagram' ? 'Instagram' : 'WhatsApp',
        riscoPolitico: isNegative ? 'alto' : isPositive ? 'baixo' : 'medio',
        sugestoes: isPositive
          ? ['Mensagem com boa receptividade. Recomendamos publicar no horário de pico.', 'Considere adicionar dados concretos para aumentar credibilidade.', 'Influenciadores do tema podem amplificar a mensagem.']
          : isNegative
          ? ['Alto risco de reação negativa. Considere reformular.', 'Evite tom confrontativo, prefira dados e fatos.', 'Prepare nota de esclarecimento caso haja reação adversa.']
          : ['Mensagem neutra, sem grande impacto positivo ou negativo.', 'Considere tornar mais assertiva para gerar engajamento.', 'Adicione call-to-action para aumentar interação.'],
        segmentos: [
          { nome: 'Classe A/B (25-44)', reacao: isPositive ? 'Positiva' : isNegative ? 'Negativa' : 'Indiferente', pct: isPositive ? 68 : isNegative ? 28 : 45 },
          { nome: 'Classe C (35-54)', reacao: isPositive ? 'Muito Positiva' : isNegative ? 'Muito Negativa' : 'Neutra', pct: isPositive ? 78 : isNegative ? 22 : 50 },
          { nome: 'Classe D/E (45+)', reacao: isPositive ? 'Positiva' : 'Neutra', pct: isPositive ? 65 : isNegative ? 35 : 48 },
          { nome: 'Jovens (18-24)', reacao: isPositive ? 'Neutra' : isNegative ? 'Negativa' : 'Indiferente', pct: isPositive ? 45 : isNegative ? 32 : 40 },
        ]
      })
      setSimulating(false)
      toast.success('Simulação completa!')
    }, 2500)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgGradient }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: t.accentText }} /></div>

  return (
    <div className="min-h-screen p-4" style={{ background: t.bgGradient }}>
      <div className="container max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ color: t.bodyText }}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: t.brightText }}><MessageSquare className="h-8 w-8" />Simulador de Mensagem</h1>
            <p style={{ color: t.bodyText }} className="mt-1">Teste a reação pública antes de comunicar oficialmente</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2" style={{ color: t.brightText }}>
                  <MessageSquare className="h-4 w-4" style={{ color: t.accentText }} /> Sua Mensagem
                </h3>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Escreva aqui a mensagem que pretende publicar..."
                  className="w-full h-40 rounded-lg p-4 text-sm resize-none"
                  style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.brightText, border: `1px solid ${t.cardBorder}` }} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label style={{ color: t.bodyText }} className="text-xs">Canal</Label>
                    <Select value={canal} onValueChange={setCanal}>
                      <SelectTrigger style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.bodyText }}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="imprensa">Nota à Imprensa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label style={{ color: t.bodyText }} className="text-xs">Tom</Label>
                    <Select value={tom} onValueChange={setTom}>
                      <SelectTrigger style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.bodyText }}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="institucional">Institucional</SelectItem>
                        <SelectItem value="informal">Informal</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="emocional">Emocional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={simulate} disabled={simulating || !message.trim()} className="w-full text-white" style={{ backgroundColor: t.accentText }}>
                  {simulating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Simulando...</> : <><Sparkles className="h-4 w-4 mr-2" />Simular Reação</>}
                </Button>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
              <CardContent className="p-5">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2" style={{ color: t.brightText }}>
                  <Sparkles className="h-4 w-4" style={{ color: 'hsl(43,96%,56%)' }} /> Dicas de Comunicação
                </h4>
                <ul className="space-y-2 text-xs" style={{ color: t.bodyText }}>
                  {['Use dados concretos para aumentar credibilidade', 'Evite termos polarizadores em comunicados oficiais',
                    'Publique entre 8-10h ou 18-20h para máximo alcance', 'Mensagens com menos de 280 caracteres performam melhor'].map((tip, i) => (
                    <li key={i} className="flex gap-2"><span style={{ color: t.accentText }}>•</span>{tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {result ? (
              <>
                <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
                      <BarChart3 className="h-4 w-4" style={{ color: t.accentText }} /> Resultado da Simulação
                    </h3>
                    <div className="text-center mb-6">
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: result.sentimentoGeral >= 60 ? 'hsl(152,55%,50%)' : result.sentimentoGeral >= 40 ? 'hsl(43,96%,56%)' : 'hsl(0,72%,55%)' }}>
                        {result.sentimentoGeral}%
                      </div>
                      <p className="text-sm mt-1" style={{ color: t.mutedText }}>Sentimento Geral Previsto</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <ThumbsUp className="h-4 w-4 mx-auto mb-1 text-green-400" />
                        <div className="text-lg font-bold text-green-400">{result.positivo}%</div>
                        <div className="text-[10px]" style={{ color: t.mutedText }}>Positivo</div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <Minus className="h-4 w-4 mx-auto mb-1" style={{ color: t.mutedText }} />
                        <div className="text-lg font-bold" style={{ color: t.mutedText }}>{result.neutro}%</div>
                        <div className="text-[10px]" style={{ color: t.mutedText }}>Neutro</div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <ThumbsDown className="h-4 w-4 mx-auto mb-1 text-red-400" />
                        <div className="text-lg font-bold text-red-400">{result.negativo}%</div>
                        <div className="text-[10px]" style={{ color: t.mutedText }}>Negativo</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <Clock className="h-4 w-4 mx-auto mb-1" style={{ color: t.accentText }} />
                        <div className="text-xs font-bold" style={{ color: t.brightText }}>{result.melhorHorario}</div>
                        <div className="text-[10px]" style={{ color: t.mutedText }}>Melhor Horário</div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <Target className="h-4 w-4 mx-auto mb-1" style={{ color: t.accentText }} />
                        <div className="text-xs font-bold" style={{ color: t.brightText }}>{result.melhorCanal}</div>
                        <div className="text-[10px]" style={{ color: t.mutedText }}>Melhor Canal</div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <Badge style={{ fontSize: '10px', backgroundColor: result.riscoPolitico === 'alto' ? 'rgba(127,29,29,0.5)' : result.riscoPolitico === 'medio' ? 'rgba(113,63,18,0.5)' : 'rgba(20,83,45,0.5)', color: result.riscoPolitico === 'alto' ? '#fca5a5' : result.riscoPolitico === 'medio' ? '#fcd34d' : '#86efac' }}>
                          {result.riscoPolitico === 'alto' ? 'Alto' : result.riscoPolitico === 'medio' ? 'Médio' : 'Baixo'}
                        </Badge>
                        <div className="text-[10px] mt-1" style={{ color: t.mutedText }}>Risco Político</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                  <CardContent className="p-5">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2" style={{ color: t.brightText }}>
                      <Users className="h-4 w-4" style={{ color: t.accentText }} /> Reação por Segmento
                    </h4>
                    <div className="space-y-3">
                      {result.segmentos.map((seg, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs w-32 shrink-0" style={{ color: t.bodyText }}>{seg.nome}</span>
                          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: t.filterBg }}>
                            <div className="h-full rounded-full" style={{
                              width: `${seg.pct}%`,
                              backgroundColor: seg.pct >= 60 ? '#22c55e' : seg.pct >= 40 ? '#eab308' : '#ef4444'
                            }} />
                          </div>
                          <span className="text-xs w-8 text-right font-bold" style={{ color: seg.pct >= 60 ? '#22c55e' : seg.pct >= 40 ? '#eab308' : '#ef4444' }}>{seg.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: t.cardBg, borderColor: result.riscoPolitico === 'alto' ? 'hsl(0,50%,30%)' : t.cardBorder }}>
                  <CardContent className="p-5">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2" style={{ color: t.brightText }}>
                      <Sparkles className="h-4 w-4" style={{ color: 'hsl(43,96%,56%)' }} /> Recomendações da IA
                    </h4>
                    <ul className="space-y-2">
                      {result.sugestoes.map((s, i) => (
                        <li key={i} className="text-sm flex gap-2" style={{ color: t.bodyText }}>
                          <span style={{ color: t.accentText }}>→</span> {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" style={{ color: t.mutedText }} />
                  <p className="text-lg mb-2" style={{ color: t.brightText }}>Teste sua mensagem</p>
                  <p className="text-sm" style={{ color: t.mutedText }}>Escreva uma mensagem ao lado e clique em Simular Reação para ver a previsão de sentimento público.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
