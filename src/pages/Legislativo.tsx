/**
 * RadarPolítico - Integração Legislativa
 * Acompanhamento de votações, proposições e impacto legislativo
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sidebar } from '@/components/Sidebar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  ArrowLeft, Loader2, Gavel, Vote, FileText, TrendingUp,
  Search, ExternalLink, Calendar, BarChart3, Check, X, Minus
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'

const THEMES: Record<ThemeKey, any> = {
  azul: { bgGradient: 'linear-gradient(135deg, hsl(215,30%,8%) 0%, hsl(220,35%,12%) 50%, hsl(210,25%,10%) 100%)', headerBg: 'hsl(215,25%,11%)', headerBorder: 'hsl(215,25%,18%)', cardBg: 'hsl(215,25%,12%)', cardBorder: 'hsl(215,25%,20%)', cardHoverBorder: 'hsl(215,25%,30%)', accentText: 'hsl(210,40%,60%)', accentMuted: 'hsl(210,40%,20%)', filterBg: 'hsl(215,25%,15%)', filterActive: 'hsl(215,25%,25%)', mutedText: 'hsl(215,15%,50%)', brightText: 'hsl(210,40%,98%)', bodyText: 'hsl(215,15%,65%)' },
  verde: { bgGradient: 'linear-gradient(135deg, hsl(155,30%,8%) 0%, hsl(160,35%,12%) 50%, hsl(150,25%,10%) 100%)', headerBg: 'hsl(155,25%,11%)', headerBorder: 'hsl(155,25%,18%)', cardBg: 'hsl(155,25%,12%)', cardBorder: 'hsl(155,25%,20%)', cardHoverBorder: 'hsl(155,25%,30%)', accentText: 'hsl(152,45%,55%)', accentMuted: 'hsl(152,40%,20%)', filterBg: 'hsl(155,25%,15%)', filterActive: 'hsl(155,25%,25%)', mutedText: 'hsl(155,15%,50%)', brightText: 'hsl(150,40%,98%)', bodyText: 'hsl(155,15%,65%)' },
  vermelho: { bgGradient: 'linear-gradient(135deg, hsl(0,30%,8%) 0%, hsl(5,35%,12%) 50%, hsl(355,25%,10%) 100%)', headerBg: 'hsl(0,25%,11%)', headerBorder: 'hsl(0,25%,18%)', cardBg: 'hsl(0,25%,12%)', cardBorder: 'hsl(0,25%,20%)', cardHoverBorder: 'hsl(0,25%,30%)', accentText: 'hsl(0,70%,55%)', accentMuted: 'hsl(0,40%,20%)', filterBg: 'hsl(0,25%,15%)', filterActive: 'hsl(0,25%,25%)', mutedText: 'hsl(0,15%,50%)', brightText: 'hsl(0,40%,98%)', bodyText: 'hsl(0,15%,65%)' },
  amarelo: { bgGradient: 'linear-gradient(135deg, hsl(45,30%,8%) 0%, hsl(50,35%,12%) 50%, hsl(40,25%,10%) 100%)', headerBg: 'hsl(45,25%,11%)', headerBorder: 'hsl(45,25%,18%)', cardBg: 'hsl(45,25%,12%)', cardBorder: 'hsl(45,25%,20%)', cardHoverBorder: 'hsl(45,25%,30%)', accentText: 'hsl(45,95%,50%)', accentMuted: 'hsl(45,40%,20%)', filterBg: 'hsl(45,25%,15%)', filterActive: 'hsl(45,25%,25%)', mutedText: 'hsl(45,15%,50%)', brightText: 'hsl(45,40%,98%)', bodyText: 'hsl(45,15%,65%)' },
  roxo: { bgGradient: 'linear-gradient(135deg, hsl(270,30%,8%) 0%, hsl(275,35%,12%) 50%, hsl(265,25%,10%) 100%)', headerBg: 'hsl(270,25%,11%)', headerBorder: 'hsl(270,25%,18%)', cardBg: 'hsl(270,25%,12%)', cardBorder: 'hsl(270,25%,20%)', cardHoverBorder: 'hsl(270,25%,30%)', accentText: 'hsl(270,60%,55%)', accentMuted: 'hsl(270,40%,20%)', filterBg: 'hsl(270,25%,15%)', filterActive: 'hsl(270,25%,25%)', mutedText: 'hsl(270,15%,50%)', brightText: 'hsl(270,40%,98%)', bodyText: 'hsl(270,15%,65%)' },
  teal: { bgGradient: 'linear-gradient(135deg, hsl(180,30%,8%) 0%, hsl(185,35%,12%) 50%, hsl(175,25%,10%) 100%)', headerBg: 'hsl(180,25%,11%)', headerBorder: 'hsl(180,25%,18%)', cardBg: 'hsl(180,25%,12%)', cardBorder: 'hsl(180,25%,20%)', cardHoverBorder: 'hsl(180,25%,30%)', accentText: 'hsl(180,50%,55%)', accentMuted: 'hsl(180,40%,20%)', filterBg: 'hsl(180,25%,15%)', filterActive: 'hsl(180,25%,25%)', mutedText: 'hsl(180,15%,50%)', brightText: 'hsl(180,40%,98%)', bodyText: 'hsl(180,15%,65%)' },
}

interface Votacao {
  id: string
  projeto: string
  descricao: string
  data: string
  resultado: 'aprovado' | 'rejeitado' | 'em_votacao'
  votoFavor: number
  votoContra: number
  abstencao: number
  impactoMidia: number
  tema: string
}

interface Proposicao {
  id: string
  numero: string
  ementa: string
  autor: string
  situacao: 'tramitando' | 'aprovada' | 'arquivada'
  dataApresentacao: string
  mencoesMidia: number
  sentimentoMidia: 'positivo' | 'negativo' | 'neutro'
}

const MOCK_VOTACOES: Votacao[] = [
  { id: '1', projeto: 'PL 1234/2025', descricao: 'Reforma Tributária - Regulamentação do IVA', data: '2026-02-28', resultado: 'aprovado', votoFavor: 312, votoContra: 145, abstencao: 23, impactoMidia: 87, tema: 'Economia' },
  { id: '2', projeto: 'PL 5678/2025', descricao: 'Piso Salarial Nacional para Enfermeiros', data: '2026-02-25', resultado: 'aprovado', votoFavor: 421, votoContra: 32, abstencao: 15, impactoMidia: 72, tema: 'Saúde' },
  { id: '3', projeto: 'PEC 45/2026', descricao: 'Autonomia do Banco Central', data: '2026-02-20', resultado: 'rejeitado', votoFavor: 198, votoContra: 267, abstencao: 42, impactoMidia: 95, tema: 'Economia' },
  { id: '4', projeto: 'PL 9012/2025', descricao: 'Marco Legal da Inteligência Artificial', data: '2026-02-18', resultado: 'em_votacao', votoFavor: 0, votoContra: 0, abstencao: 0, impactoMidia: 63, tema: 'Tecnologia' },
  { id: '5', projeto: 'PL 3456/2026', descricao: 'Programa Nacional de Segurança Escolar', data: '2026-02-15', resultado: 'aprovado', votoFavor: 389, votoContra: 67, abstencao: 11, impactoMidia: 81, tema: 'Educação' },
]

const MOCK_PROPOSICOES: Proposicao[] = [
  { id: '1', numero: 'PL 789/2026', ementa: 'Institui programa de incentivo à energia solar em residências de baixa renda', autor: 'Dep. Autor', situacao: 'tramitando', dataApresentacao: '2026-01-15', mencoesMidia: 34, sentimentoMidia: 'positivo' },
  { id: '2', numero: 'PL 456/2026', ementa: 'Regulamenta uso de câmeras corporais por agentes de segurança', autor: 'Dep. Autor', situacao: 'tramitando', dataApresentacao: '2026-01-10', mencoesMidia: 67, sentimentoMidia: 'neutro' },
  { id: '3', numero: 'PL 123/2025', ementa: 'Amplia acesso à internet em escolas públicas rurais', autor: 'Dep. Autor', situacao: 'aprovada', dataApresentacao: '2025-08-20', mencoesMidia: 89, sentimentoMidia: 'positivo' },
  { id: '4', numero: 'REQ 234/2026', ementa: 'Requerimento de audiência pública sobre saúde mental', autor: 'Dep. Autor', situacao: 'tramitando', dataApresentacao: '2026-02-01', mencoesMidia: 12, sentimentoMidia: 'neutro' },
]

export default function Legislativo() {
  const navigate = useNavigate()
  const [themeKey] = useState<ThemeKey>(() => (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul')
  const t = THEMES[themeKey]
  const [loading, setLoading] = useState(true)
  const [filterTema, setFilterTema] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setLoading(false)
    }
    check()
  }, [navigate])

  const filteredVotacoes = MOCK_VOTACOES.filter(v =>
    (filterTema === 'todos' || v.tema === filterTema) &&
    (searchTerm === '' || v.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || v.projeto.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgGradient }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: t.accentText }} />
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 md:pl-16 min-h-screen p-4" style={{ background: t.bgGradient }}>
        <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ color: t.bodyText }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: t.brightText }}>
                <Gavel className="h-8 w-8" />
                Integração Legislativa
              </h1>
              <p style={{ color: t.bodyText }} className="mt-1">
                Votações, proposições e impacto legislativo na mídia
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Votações Rastreadas', value: '147', icon: Vote, color: t.accentText },
            { label: 'Proposições Ativas', value: '23', icon: FileText, color: 'hsl(152,45%,55%)' },
            { label: 'Impacto Médio na Mídia', value: '78%', icon: TrendingUp, color: 'hsl(43,96%,56%)' },
            { label: 'Repercussão Positiva', value: '62%', icon: BarChart3, color: 'hsl(152,55%,50%)' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <CardContent className="p-5">
                  <Icon className="h-5 w-5 mb-3" style={{ color: stat.color }} />
                  <p className="text-2xl font-bold" style={{ color: t.brightText }}>{stat.value}</p>
                  <p className="text-xs mt-1" style={{ color: t.mutedText }}>{stat.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: t.mutedText }} />
            <Input
              placeholder="Buscar votação ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.bodyText }}
            />
          </div>
          <Select value={filterTema} onValueChange={setFilterTema}>
            <SelectTrigger className="w-40" style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.bodyText }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Temas</SelectItem>
              <SelectItem value="Economia">Economia</SelectItem>
              <SelectItem value="Saúde">Saúde</SelectItem>
              <SelectItem value="Educação">Educação</SelectItem>
              <SelectItem value="Tecnologia">Tecnologia</SelectItem>
              <SelectItem value="Segurança">Segurança</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Votações Recentes */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
            <Vote className="h-5 w-5" style={{ color: t.accentText }} />
            Votações Recentes
          </h2>
          <div className="space-y-3">
            {filteredVotacoes.map(v => (
              <Card key={v.id} className="transition-colors" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = t.cardHoverBorder)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = t.cardBorder)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-mono font-bold" style={{ color: t.accentText }}>{v.projeto}</span>
                        <Badge className="text-[10px]" style={{ backgroundColor: t.accentMuted, color: t.accentText }}>{v.tema}</Badge>
                        <Badge className={`text-[10px] ${
                          v.resultado === 'aprovado' ? 'bg-green-900/50 text-green-300' :
                          v.resultado === 'rejeitado' ? 'bg-red-900/50 text-red-300' :
                          'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {v.resultado === 'aprovado' ? <><Check className="h-3 w-3 mr-1 inline" />Aprovado</> :
                           v.resultado === 'rejeitado' ? <><X className="h-3 w-3 mr-1 inline" />Rejeitado</> :
                           <><Minus className="h-3 w-3 mr-1 inline" />Em Votação</>}
                        </Badge>
                      </div>
                      <p className="text-sm" style={{ color: t.bodyText }}>{v.descricao}</p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className="text-xs flex items-center gap-1" style={{ color: t.mutedText }}>
                        <Calendar className="h-3 w-3" />
                        {new Date(v.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  {v.resultado !== 'em_votacao' && (
                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-green-400">A favor: {v.votoFavor}</span>
                          <span className="text-red-400">Contra: {v.votoContra}</span>
                          <span style={{ color: t.mutedText }}>Abstenção: {v.abstencao}</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: t.cardBorder }}>
                          <div className="h-full bg-green-500" style={{ width: `${(v.votoFavor / (v.votoFavor + v.votoContra + v.abstencao)) * 100}%` }} />
                          <div className="h-full bg-red-500" style={{ width: `${(v.votoContra / (v.votoFavor + v.votoContra + v.abstencao)) * 100}%` }} />
                          <div className="h-full bg-gray-500" style={{ width: `${(v.abstencao / (v.votoFavor + v.votoContra + v.abstencao)) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs" style={{ color: t.mutedText }}>Impacto Mídia</p>
                        <p className={`text-lg font-bold ${v.impactoMidia >= 80 ? 'text-green-400' : v.impactoMidia >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {v.impactoMidia}%
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Proposições do Político */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
            <FileText className="h-5 w-5" style={{ color: t.accentText }} />
            Suas Proposições
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {MOCK_PROPOSICOES.map(p => (
              <Card key={p.id} className="transition-colors" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = t.cardHoverBorder)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = t.cardBorder)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono font-bold" style={{ color: t.accentText }}>{p.numero}</span>
                    <Badge className={`text-[10px] ${
                      p.situacao === 'aprovada' ? 'bg-green-900/50 text-green-300' :
                      p.situacao === 'arquivada' ? 'bg-red-900/50 text-red-300' :
                      'bg-blue-900/50 text-blue-300'
                    }`}>
                      {p.situacao === 'tramitando' ? 'Tramitando' : p.situacao === 'aprovada' ? 'Aprovada' : 'Arquivada'}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3" style={{ color: t.bodyText }}>{p.ementa}</p>
                  <div className="flex items-center justify-between text-xs" style={{ color: t.mutedText }}>
                    <span>{new Date(p.dataApresentacao).toLocaleDateString('pt-BR')}</span>
                    <div className="flex items-center gap-3">
                      <span>{p.mencoesMidia} menções na mídia</span>
                      <Badge className={`text-[10px] ${
                        p.sentimentoMidia === 'positivo' ? 'bg-green-900/50 text-green-300' :
                        p.sentimentoMidia === 'negativo' ? 'bg-red-900/50 text-red-300' :
                        'bg-gray-700/50 text-gray-300'
                      }`}>
                        {p.sentimentoMidia === 'positivo' ? '↑' : p.sentimentoMidia === 'negativo' ? '↓' : '→'} {p.sentimentoMidia}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
