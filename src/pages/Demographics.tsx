/**
 * RadarPolítico - Análise Demográfica
 * Perfil dos apoiadores e segmentação do eleitorado
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Loader2, Users, BarChart3, MapPin,
  TrendingUp, Calendar, Briefcase
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { supabase } from '@/integrations/supabase/client'

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'

const THEMES: Record<ThemeKey, any> = {
  azul: { bgGradient: 'linear-gradient(135deg, hsl(215,30%,8%) 0%, hsl(220,35%,12%) 50%, hsl(210,25%,10%) 100%)', cardBg: 'hsl(215,25%,12%)', cardBorder: 'hsl(215,25%,20%)', cardHoverBorder: 'hsl(215,25%,30%)', accentText: 'hsl(210,40%,60%)', accentMuted: 'hsl(210,40%,20%)', filterBg: 'hsl(215,25%,15%)', mutedText: 'hsl(215,15%,50%)', brightText: 'hsl(210,40%,98%)', bodyText: 'hsl(215,15%,65%)', chartGrid: 'hsl(215,25%,20%)', tooltipBg: 'hsl(215,25%,15%)', tooltipBorder: 'hsl(215,25%,25%)' },
  verde: { bgGradient: 'linear-gradient(135deg, hsl(155,30%,8%) 0%, hsl(160,35%,12%) 50%, hsl(150,25%,10%) 100%)', cardBg: 'hsl(155,25%,12%)', cardBorder: 'hsl(155,25%,20%)', cardHoverBorder: 'hsl(155,25%,30%)', accentText: 'hsl(152,45%,55%)', accentMuted: 'hsl(152,40%,20%)', filterBg: 'hsl(155,25%,15%)', mutedText: 'hsl(155,15%,50%)', brightText: 'hsl(150,40%,98%)', bodyText: 'hsl(155,15%,65%)', chartGrid: 'hsl(155,25%,20%)', tooltipBg: 'hsl(155,25%,15%)', tooltipBorder: 'hsl(155,25%,25%)' },
  vermelho: { bgGradient: 'linear-gradient(135deg, hsl(0,30%,8%) 0%, hsl(5,35%,12%) 50%, hsl(355,25%,10%) 100%)', cardBg: 'hsl(0,25%,12%)', cardBorder: 'hsl(0,25%,20%)', cardHoverBorder: 'hsl(0,25%,30%)', accentText: 'hsl(0,70%,55%)', accentMuted: 'hsl(0,40%,20%)', filterBg: 'hsl(0,25%,15%)', mutedText: 'hsl(0,15%,50%)', brightText: 'hsl(0,40%,98%)', bodyText: 'hsl(0,15%,65%)', chartGrid: 'hsl(0,25%,20%)', tooltipBg: 'hsl(0,25%,15%)', tooltipBorder: 'hsl(0,25%,25%)' },
  amarelo: { bgGradient: 'linear-gradient(135deg, hsl(45,30%,8%) 0%, hsl(50,35%,12%) 50%, hsl(40,25%,10%) 100%)', cardBg: 'hsl(45,25%,12%)', cardBorder: 'hsl(45,25%,20%)', cardHoverBorder: 'hsl(45,25%,30%)', accentText: 'hsl(45,95%,50%)', accentMuted: 'hsl(45,40%,20%)', filterBg: 'hsl(45,25%,15%)', mutedText: 'hsl(45,15%,50%)', brightText: 'hsl(45,40%,98%)', bodyText: 'hsl(45,15%,65%)', chartGrid: 'hsl(45,25%,20%)', tooltipBg: 'hsl(45,25%,15%)', tooltipBorder: 'hsl(45,25%,25%)' },
  roxo: { bgGradient: 'linear-gradient(135deg, hsl(270,30%,8%) 0%, hsl(275,35%,12%) 50%, hsl(265,25%,10%) 100%)', cardBg: 'hsl(270,25%,12%)', cardBorder: 'hsl(270,25%,20%)', cardHoverBorder: 'hsl(270,25%,30%)', accentText: 'hsl(270,60%,55%)', accentMuted: 'hsl(270,40%,20%)', filterBg: 'hsl(270,25%,15%)', mutedText: 'hsl(270,15%,50%)', brightText: 'hsl(270,40%,98%)', bodyText: 'hsl(270,15%,65%)', chartGrid: 'hsl(270,25%,20%)', tooltipBg: 'hsl(270,25%,15%)', tooltipBorder: 'hsl(270,25%,25%)' },
  teal: { bgGradient: 'linear-gradient(135deg, hsl(180,30%,8%) 0%, hsl(185,35%,12%) 50%, hsl(175,25%,10%) 100%)', cardBg: 'hsl(180,25%,12%)', cardBorder: 'hsl(180,25%,20%)', cardHoverBorder: 'hsl(180,25%,30%)', accentText: 'hsl(180,50%,55%)', accentMuted: 'hsl(180,40%,20%)', filterBg: 'hsl(180,25%,15%)', mutedText: 'hsl(180,15%,50%)', brightText: 'hsl(180,40%,98%)', bodyText: 'hsl(180,15%,65%)', chartGrid: 'hsl(180,25%,20%)', tooltipBg: 'hsl(180,25%,15%)', tooltipBorder: 'hsl(180,25%,25%)' },
}

const FAIXA_ETARIA = [
  { name: '18-24', value: 18, color: '#3b82f6' },
  { name: '25-34', value: 28, color: '#22c55e' },
  { name: '35-44', value: 24, color: '#eab308' },
  { name: '45-54', value: 16, color: '#f97316' },
  { name: '55-64', value: 9, color: '#ef4444' },
  { name: '65+', value: 5, color: '#8b5cf6' },
]

const GENERO = [
  { name: 'Masculino', value: 52, color: '#3b82f6' },
  { name: 'Feminino', value: 45, color: '#ec4899' },
  { name: 'Outro', value: 3, color: '#8b5cf6' },
]

const CLASSE_SOCIAL = [
  { name: 'Classe A', value: 8, color: '#22c55e' },
  { name: 'Classe B', value: 22, color: '#3b82f6' },
  { name: 'Classe C', value: 42, color: '#eab308' },
  { name: 'Classe D', value: 20, color: '#f97316' },
  { name: 'Classe E', value: 8, color: '#ef4444' },
]

const REGIAO = [
  { name: 'Sudeste', engajamento: 4200, apoio: 68 },
  { name: 'Nordeste', engajamento: 3100, apoio: 72 },
  { name: 'Sul', engajamento: 2800, apoio: 54 },
  { name: 'Norte', engajamento: 1500, apoio: 61 },
  { name: 'C. Oeste', engajamento: 1200, apoio: 58 },
]

const INTERESSES = [
  { tema: 'Saúde Pública', pct: 78 },
  { tema: 'Educação', pct: 72 },
  { tema: 'Economia / Emprego', pct: 65 },
  { tema: 'Segurança', pct: 58 },
  { tema: 'Meio Ambiente', pct: 45 },
  { tema: 'Tecnologia', pct: 38 },
  { tema: 'Cultura', pct: 22 },
]

export default function Demographics() {
  const navigate = useNavigate()
  const [themeKey] = useState<ThemeKey>(() => (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul')
  const t = THEMES[themeKey]
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setLoading(false)
    }
    check()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgGradient }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: t.accentText }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4" style={{ background: t.bgGradient }}>
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ color: t.bodyText }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: t.brightText }}>
              <Users className="h-8 w-8" />
              Análise Demográfica
            </h1>
            <p style={{ color: t.bodyText }} className="mt-1">
              Perfil dos seus apoiadores e segmentação do eleitorado
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Engajamentos', value: '12.8K', icon: BarChart3, color: t.accentText },
            { label: 'Alcance Estimado', value: '245K', icon: TrendingUp, color: 'hsl(152,45%,55%)' },
            { label: 'Faixa Principal', value: '25-34', icon: Calendar, color: 'hsl(43,96%,56%)' },
            { label: 'Classe Predominante', value: 'C', icon: Briefcase, color: 'hsl(0,72%,55%)' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <CardContent className="p-5">
                  <Icon className="h-5 w-5 mb-2" style={{ color: stat.color }} />
                  <p className="text-2xl font-bold" style={{ color: t.brightText }}>{stat.value}</p>
                  <p className="text-xs mt-1" style={{ color: t.mutedText }}>{stat.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Faixa Etária */}
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
                <Calendar className="h-4 w-4" style={{ color: t.accentText }} />
                Distribuição por Faixa Etária
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={FAIXA_ETARIA} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.mutedText }} />
                    <YAxis tick={{ fontSize: 11, fill: t.mutedText }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '8px', color: t.brightText }}
                      formatter={(value: number) => [`${value}%`, 'Percentual']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {FAIXA_ETARIA.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gênero */}
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
                <Users className="h-4 w-4" style={{ color: t.accentText }} />
                Distribuição por Gênero
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={GENERO} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}>
                      {GENERO.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '8px', color: t.brightText }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Classe Social */}
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
                <Briefcase className="h-4 w-4" style={{ color: t.accentText }} />
                Classe Social
              </h3>
              <div className="space-y-3">
                {CLASSE_SOCIAL.map((cs, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm w-20" style={{ color: t.bodyText }}>{cs.name}</span>
                    <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: t.filterBg }}>
                      <div className="h-full rounded-full flex items-center px-2 transition-all" style={{ width: `${cs.value}%`, backgroundColor: cs.color }}>
                        <span className="text-[10px] font-bold text-white">{cs.value}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Engajamento por Região */}
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
                <MapPin className="h-4 w-4" style={{ color: t.accentText }} />
                Engajamento por Região
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REGIAO} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.mutedText }} />
                    <YAxis tick={{ fontSize: 11, fill: t.mutedText }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '8px', color: t.brightText }}
                    />
                    <Bar dataKey="engajamento" fill={t.accentText} radius={[4, 4, 0, 0]} name="Engajamentos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interesses dos Apoiadores */}
        <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
              <TrendingUp className="h-4 w-4" style={{ color: t.accentText }} />
              Temas de Interesse dos Apoiadores
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {INTERESSES.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: t.filterBg }}>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: t.brightText }}>{item.tema}</span>
                      <span className="text-sm font-bold" style={{ color: t.accentText }}>{item.pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: t.cardBorder }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${item.pct}%`,
                        backgroundColor: item.pct >= 70 ? '#22c55e' : item.pct >= 50 ? '#3b82f6' : item.pct >= 30 ? '#eab308' : '#ef4444'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Insight Box */}
            <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: t.accentMuted, borderColor: t.accentText }}>
              <p className="text-sm font-medium mb-1" style={{ color: t.accentText }}>
                Insight da IA
              </p>
              <p className="text-sm" style={{ color: t.bodyText }}>
                Seus apoiadores são predominantemente da Classe C (42%), faixa etária 25-34 anos (28%), com forte interesse em Saúde Pública (78%) e Educação (72%). Recomendamos focar comunicação nesses temas para maximizar engajamento na base eleitoral.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
