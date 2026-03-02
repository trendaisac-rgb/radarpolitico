/**
 * RadarPolítico - Monitor de Discurso de Ódio
 * Proteção para políticos de grupos vulneráveis
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/Sidebar'
import {
  ArrowLeft, Loader2, Shield, AlertTriangle, Eye,
  Flag, TrendingDown, Phone, ExternalLink, Heart
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'
const THEMES: Record<ThemeKey, any> = {
  azul: { bgGradient: 'linear-gradient(135deg, hsl(215,30%,8%) 0%, hsl(220,35%,12%) 50%, hsl(210,25%,10%) 100%)', cardBg: 'hsl(215,25%,12%)', cardBorder: 'hsl(215,25%,20%)', cardHoverBorder: 'hsl(215,25%,30%)', accentText: 'hsl(210,40%,60%)', accentMuted: 'hsl(210,40%,20%)', filterBg: 'hsl(215,25%,15%)', mutedText: 'hsl(215,15%,50%)', brightText: 'hsl(210,40%,98%)', bodyText: 'hsl(215,15%,65%)' },
  verde: { bgGradient: 'linear-gradient(135deg, hsl(155,30%,8%) 0%, hsl(160,35%,12%) 50%, hsl(150,25%,10%) 100%)', cardBg: 'hsl(155,25%,12%)', cardBorder: 'hsl(155,25%,20%)', cardHoverBorder: 'hsl(155,25%,30%)', accentText: 'hsl(152,45%,55%)', accentMuted: 'hsl(152,40%,20%)', filterBg: 'hsl(155,25%,15%)', mutedText: 'hsl(155,15%,50%)', brightText: 'hsl(150,40%,98%)', bodyText: 'hsl(155,15%,65%)' },
  vermelho: { bgGradient: 'linear-gradient(135deg, hsl(0,30%,8%) 0%, hsl(5,35%,12%) 50%, hsl(355,25%,10%) 100%)', cardBg: 'hsl(0,25%,12%)', cardBorder: 'hsl(0,25%,20%)', cardHoverBorder: 'hsl(0,25%,30%)', accentText: 'hsl(0,70%,55%)', accentMuted: 'hsl(0,40%,20%)', filterBg: 'hsl(0,25%,15%)', mutedText: 'hsl(0,15%,50%)', brightText: 'hsl(0,40%,98%)', bodyText: 'hsl(0,15%,65%)' },
  amarelo: { bgGradient: 'linear-gradient(135deg, hsl(45,30%,8%) 0%, hsl(50,35%,12%) 50%, hsl(40,25%,10%) 100%)', cardBg: 'hsl(45,25%,12%)', cardBorder: 'hsl(45,25%,20%)', cardHoverBorder: 'hsl(45,25%,30%)', accentText: 'hsl(45,95%,50%)', accentMuted: 'hsl(45,40%,20%)', filterBg: 'hsl(45,25%,15%)', mutedText: 'hsl(45,15%,50%)', brightText: 'hsl(45,40%,98%)', bodyText: 'hsl(45,15%,65%)' },
  roxo: { bgGradient: 'linear-gradient(135deg, hsl(270,30%,8%) 0%, hsl(275,35%,12%) 50%, hsl(265,25%,10%) 100%)', cardBg: 'hsl(270,25%,12%)', cardBorder: 'hsl(270,25%,20%)', cardHoverBorder: 'hsl(270,25%,30%)', accentText: 'hsl(270,60%,55%)', accentMuted: 'hsl(270,40%,20%)', filterBg: 'hsl(270,25%,15%)', mutedText: 'hsl(270,15%,50%)', brightText: 'hsl(270,40%,98%)', bodyText: 'hsl(270,15%,65%)' },
  teal: { bgGradient: 'linear-gradient(135deg, hsl(180,30%,8%) 0%, hsl(185,35%,12%) 50%, hsl(175,25%,10%) 100%)', cardBg: 'hsl(180,25%,12%)', cardBorder: 'hsl(180,25%,20%)', cardHoverBorder: 'hsl(180,25%,30%)', accentText: 'hsl(180,50%,55%)', accentMuted: 'hsl(180,40%,20%)', filterBg: 'hsl(180,25%,15%)', mutedText: 'hsl(180,15%,50%)', brightText: 'hsl(180,40%,98%)', bodyText: 'hsl(180,15%,65%)' },
}

interface HateIncident {
  id: string
  text: string
  source: string
  type: 'genero' | 'raca' | 'lgbtq' | 'religiao' | 'outros'
  severity: 'baixo' | 'medio' | 'alto' | 'critico'
  date: string
  reported: boolean
  url?: string
}

const MOCK_INCIDENTS: HateIncident[] = [
  { id: '1', text: 'Comentário com linguagem sexista direcionado à política', source: 'Twitter/X', type: 'genero', severity: 'alto', date: '2026-03-02T14:30:00', reported: true },
  { id: '2', text: 'Post com estereótipos raciais em grupo de discussão', source: 'Facebook', type: 'raca', severity: 'critico', date: '2026-03-02T12:15:00', reported: false },
  { id: '3', text: 'Ameaça velada em comentário de vídeo', source: 'YouTube', type: 'outros', severity: 'critico', date: '2026-03-01T22:45:00', reported: true },
  { id: '4', text: 'Linguagem homofóbica em thread política', source: 'Twitter/X', type: 'lgbtq', severity: 'medio', date: '2026-03-01T18:20:00', reported: false },
  { id: '5', text: 'Intolerância religiosa em resposta a post', source: 'Instagram', type: 'religiao', severity: 'baixo', date: '2026-03-01T10:00:00', reported: false },
  { id: '6', text: 'Comentário misógino sobre aparência em live', source: 'TikTok', type: 'genero', severity: 'alto', date: '2026-02-28T20:30:00', reported: true },
]

const TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  genero: { label: 'Gênero', emoji: 'F', color: 'hsl(330,70%,55%)' },
  raca: { label: 'Racial', emoji: 'R', color: 'hsl(30,80%,50%)' },
  lgbtq: { label: 'LGBTQ+', emoji: 'L', color: 'hsl(280,60%,55%)' },
  religiao: { label: 'Religião', emoji: 'Re', color: 'hsl(200,60%,55%)' },
  outros: { label: 'Outros', emoji: 'O', color: 'hsl(0,0%,55%)' },
}

const SEVERITY_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  baixo: { label: 'Baixo', bgColor: 'rgba(20,83,45,0.5)', textColor: '#86efac' },
  medio: { label: 'Médio', bgColor: 'rgba(113,63,18,0.5)', textColor: '#fcd34d' },
  alto: { label: 'Alto', bgColor: 'rgba(154,52,18,0.5)', textColor: '#fed7aa' },
  critico: { label: 'Crítico', bgColor: 'rgba(127,29,29,0.5)', textColor: '#fca5a5' },
}

export default function HateSpeech() {
  const navigate = useNavigate()
  const [themeKey] = useState<ThemeKey>(() => (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul')
  const t = THEMES[themeKey]
  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setLoading(false)
    }
    check()
  }, [navigate])

  const filtered = filterType === 'all' ? incidents : incidents.filter(i => i.type === filterType)
  const stats = {
    total: incidents.length,
    critico: incidents.filter(i => i.severity === 'critico').length,
    reported: incidents.filter(i => i.reported).length,
    thisWeek: incidents.filter(i => new Date(i.date) > new Date(Date.now() - 7 * 86400000)).length,
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgGradient }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: t.accentText }} /></div>

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 md:pl-16 min-h-screen p-4" style={{ background: t.bgGradient }}>
        <div className="container max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ color: t.bodyText }}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: t.brightText }}><Shield className="h-8 w-8" />Monitor de Discurso de Ódio</h1>
            <p style={{ color: t.bodyText }} className="mt-1">Proteção contra ataques discriminatórios na internet</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Detectados', value: stats.total, color: t.accentText },
            { label: 'Nível Crítico', value: stats.critico, color: 'hsl(0,72%,55%)' },
            { label: 'Denunciados', value: stats.reported, color: 'hsl(152,55%,50%)' },
            { label: 'Esta Semana', value: stats.thisWeek, color: 'hsl(43,96%,56%)' },
          ].map((s, i) => (
            <Card key={i} style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: t.mutedText }}>{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilterType('all')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: filterType === 'all' ? t.accentMuted : t.filterBg, color: filterType === 'all' ? t.accentText : t.bodyText, border: `1px solid ${filterType === 'all' ? t.accentText : t.cardBorder}` }}>
            Todos ({incidents.length})
          </button>
          {(Object.entries(TYPE_CONFIG) as Array<[string, typeof TYPE_CONFIG[string]]>).map(([key, config]) => {
            const count = incidents.filter(i => i.type === key).length
            return (
              <button key={key} onClick={() => setFilterType(key)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: filterType === key ? t.accentMuted : t.filterBg, color: filterType === key ? t.accentText : t.bodyText, border: `1px solid ${filterType === key ? t.accentText : t.cardBorder}` }}>
                {config.emoji} {config.label} ({count})
              </button>
            )
          })}
        </div>

        <div className="space-y-3 mb-8">
          {filtered.map(incident => {
            const typeConf = TYPE_CONFIG[incident.type]
            const sevConf = SEVERITY_CONFIG[incident.severity]
            return (
              <Card key={incident.id} className="transition-colors" style={{ backgroundColor: t.cardBg, borderColor: incident.severity === 'critico' ? 'hsl(0,50%,30%)' : t.cardBorder }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = t.cardHoverBorder)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = incident.severity === 'critico' ? 'hsl(0,50%,30%)' : t.cardBorder)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{typeConf.emoji}</span>
                      <Badge style={{ fontSize: '10px', backgroundColor: sevConf.bgColor, color: sevConf.textColor }}>{sevConf.label}</Badge>
                      <Badge style={{ fontSize: '10px', backgroundColor: t.accentMuted, color: typeConf.color }}>{typeConf.label}</Badge>
                      <span className="text-xs" style={{ color: t.mutedText }}>{incident.source}</span>
                    </div>
                    <span className="text-xs" style={{ color: t.mutedText }}>
                      {new Date(incident.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: t.bodyText }}>{incident.text}</p>
                  <div className="flex items-center gap-3">
                    {incident.reported ? (
                      <Badge style={{ fontSize: '10px', backgroundColor: 'rgba(20,83,45,0.5)', color: '#86efac' }}><Flag className="h-3 w-3 mr-1 inline" />Denunciado</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" style={{ borderColor: 'hsl(0,72%,55%)', color: 'hsl(0,72%,70%)' }}
                        onClick={() => { setIncidents(incidents.map(i => i.id === incident.id ? { ...i, reported: true } : i)) }}>
                        <Flag className="h-3 w-3 mr-1" /> Denunciar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs" style={{ color: t.bodyText }}>
                      <Eye className="h-3 w-3 mr-1" /> Ver Original
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card style={{ backgroundColor: t.cardBg, borderColor: 'hsl(152,30%,25%)' }}>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
              <Heart className="h-5 w-5" style={{ color: 'hsl(0,72%,55%)' }} /> Recursos de Apoio
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'SaferNet Brasil', desc: 'Denúncia de crimes cibernéticos', phone: '0800-770-0019', url: 'https://denuncie.org.br' },
                { name: 'Disque 100', desc: 'Direitos humanos - violações', phone: '100', url: 'https://www.gov.br/mdh' },
                { name: 'Central de Atendimento à Mulher', desc: 'Violência contra a mulher', phone: '180', url: 'https://www.gov.br/mdh' },
              ].map((resource, i) => (
                <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: t.filterBg }}>
                  <h4 className="font-medium text-sm mb-1" style={{ color: t.brightText }}>{resource.name}</h4>
                  <p className="text-xs mb-2" style={{ color: t.mutedText }}>{resource.desc}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1" style={{ color: t.accentText }}>
                      <Phone className="h-3 w-3" />{resource.phone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
