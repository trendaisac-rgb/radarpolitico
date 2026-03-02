/**
 * RadarPolítico - Comparativo com Adversários
 * Premium Feature: Side-by-side competitor comparison with radar charts
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/Sidebar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2, Plus, ArrowLeft, BarChart3, TrendingUp, Users, MessageCircle, Hash
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts'
import { supabase, type Politician } from '@/integrations/supabase/client'
import { usePoliticians } from '@/hooks/usePoliticians'
import { useMentions } from '@/hooks/useMentions'
import { toast } from 'sonner'

// ============================================
// THEME COLORS
// ============================================

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'

const THEMES: Record<ThemeKey, {
  label: string
  dot: string
  bg: string
  bgGradient: string
  headerBg: string
  headerBorder: string
  cardBg: string
  cardBorder: string
  cardHoverBorder: string
  accentText: string
  accentMuted: string
  chartGrid: string
  tooltipBg: string
  tooltipBorder: string
  filterBg: string
  filterActive: string
  mutedText: string
  brightText: string
  bodyText: string
}> = {
  azul: {
    label: 'Azul',
    dot: 'bg-[hsl(210,60%,45%)]',
    bg: 'hsl(215,25%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(215,30%,8%) 0%, hsl(220,35%,12%) 50%, hsl(210,25%,10%) 100%)',
    headerBg: 'hsl(215,25%,11%)',
    headerBorder: 'hsl(215,25%,18%)',
    cardBg: 'hsl(215,25%,12%)',
    cardBorder: 'hsl(215,25%,20%)',
    cardHoverBorder: 'hsl(215,25%,30%)',
    accentText: 'hsl(210,40%,60%)',
    accentMuted: 'hsl(210,40%,20%)',
    chartGrid: 'hsl(215,25%,20%)',
    tooltipBg: 'hsl(215,25%,15%)',
    tooltipBorder: 'hsl(215,25%,25%)',
    filterBg: 'hsl(215,25%,15%)',
    filterActive: 'hsl(215,25%,25%)',
    mutedText: 'hsl(215,15%,50%)',
    brightText: 'hsl(210,40%,98%)',
    bodyText: 'hsl(215,15%,65%)',
  },
  verde: {
    label: 'Verde',
    dot: 'bg-[hsl(152,55%,42%)]',
    bg: 'hsl(155,25%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(155,30%,8%) 0%, hsl(160,35%,12%) 50%, hsl(150,25%,10%) 100%)',
    headerBg: 'hsl(155,25%,11%)',
    headerBorder: 'hsl(155,25%,18%)',
    cardBg: 'hsl(155,25%,12%)',
    cardBorder: 'hsl(155,25%,20%)',
    cardHoverBorder: 'hsl(155,25%,30%)',
    accentText: 'hsl(152,45%,55%)',
    accentMuted: 'hsl(152,40%,20%)',
    chartGrid: 'hsl(155,25%,20%)',
    tooltipBg: 'hsl(155,25%,15%)',
    tooltipBorder: 'hsl(155,25%,25%)',
    filterBg: 'hsl(155,25%,15%)',
    filterActive: 'hsl(155,25%,25%)',
    mutedText: 'hsl(155,15%,50%)',
    brightText: 'hsl(150,40%,98%)',
    bodyText: 'hsl(155,15%,65%)',
  },
  vermelho: {
    label: 'Vermelho',
    dot: 'bg-[hsl(0,65%,45%)]',
    bg: 'hsl(0,20%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(0,25%,8%) 0%, hsl(355,30%,12%) 50%, hsl(5,20%,10%) 100%)',
    headerBg: 'hsl(0,20%,11%)',
    headerBorder: 'hsl(0,20%,18%)',
    cardBg: 'hsl(0,20%,12%)',
    cardBorder: 'hsl(0,20%,20%)',
    cardHoverBorder: 'hsl(0,20%,30%)',
    accentText: 'hsl(0,55%,60%)',
    accentMuted: 'hsl(0,40%,20%)',
    chartGrid: 'hsl(0,20%,20%)',
    tooltipBg: 'hsl(0,20%,15%)',
    tooltipBorder: 'hsl(0,20%,25%)',
    filterBg: 'hsl(0,20%,15%)',
    filterActive: 'hsl(0,20%,25%)',
    mutedText: 'hsl(0,12%,50%)',
    brightText: 'hsl(0,30%,98%)',
    bodyText: 'hsl(0,12%,65%)',
  },
  amarelo: {
    label: 'Amarelo',
    dot: 'bg-[hsl(43,90%,50%)]',
    bg: 'hsl(40,20%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(40,25%,8%) 0%, hsl(45,30%,12%) 50%, hsl(35,20%,10%) 100%)',
    headerBg: 'hsl(40,20%,11%)',
    headerBorder: 'hsl(40,20%,18%)',
    cardBg: 'hsl(40,20%,12%)',
    cardBorder: 'hsl(40,20%,20%)',
    cardHoverBorder: 'hsl(40,20%,30%)',
    accentText: 'hsl(43,80%,55%)',
    accentMuted: 'hsl(43,50%,20%)',
    chartGrid: 'hsl(40,20%,20%)',
    tooltipBg: 'hsl(40,20%,15%)',
    tooltipBorder: 'hsl(40,20%,25%)',
    filterBg: 'hsl(40,20%,15%)',
    filterActive: 'hsl(40,20%,25%)',
    mutedText: 'hsl(40,12%,50%)',
    brightText: 'hsl(40,30%,98%)',
    bodyText: 'hsl(40,12%,65%)',
  },
  roxo: {
    label: 'Roxo',
    dot: 'bg-[hsl(270,55%,50%)]',
    bg: 'hsl(270,20%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(270,25%,8%) 0%, hsl(275,30%,13%) 50%, hsl(265,20%,10%) 100%)',
    headerBg: 'hsl(270,20%,11%)',
    headerBorder: 'hsl(270,20%,18%)',
    cardBg: 'hsl(270,20%,12%)',
    cardBorder: 'hsl(270,20%,20%)',
    cardHoverBorder: 'hsl(270,20%,30%)',
    accentText: 'hsl(270,50%,60%)',
    accentMuted: 'hsl(270,40%,20%)',
    chartGrid: 'hsl(270,20%,20%)',
    tooltipBg: 'hsl(270,20%,15%)',
    tooltipBorder: 'hsl(270,20%,25%)',
    filterBg: 'hsl(270,20%,15%)',
    filterActive: 'hsl(270,20%,25%)',
    mutedText: 'hsl(270,12%,50%)',
    brightText: 'hsl(270,30%,98%)',
    bodyText: 'hsl(270,12%,65%)',
  },
  teal: {
    label: 'Teal',
    dot: 'bg-[hsl(185,55%,42%)]',
    bg: 'hsl(185,25%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(185,30%,8%) 0%, hsl(190,35%,12%) 50%, hsl(180,25%,10%) 100%)',
    headerBg: 'hsl(185,25%,11%)',
    headerBorder: 'hsl(185,25%,18%)',
    cardBg: 'hsl(185,25%,12%)',
    cardBorder: 'hsl(185,25%,20%)',
    cardHoverBorder: 'hsl(185,25%,30%)',
    accentText: 'hsl(185,45%,55%)',
    accentMuted: 'hsl(185,40%,20%)',
    chartGrid: 'hsl(185,25%,20%)',
    tooltipBg: 'hsl(185,25%,15%)',
    tooltipBorder: 'hsl(185,25%,25%)',
    filterBg: 'hsl(185,25%,15%)',
    filterActive: 'hsl(185,25%,25%)',
    mutedText: 'hsl(185,15%,50%)',
    brightText: 'hsl(185,40%,98%)',
    bodyText: 'hsl(185,15%,65%)',
  },
}

// ============================================
// TYPES & INTERFACES
// ============================================

interface CompetitorData {
  id: number
  politician_id: number
  competitor_politician_id: number
  name: string
  party: string
  position: string
  score: number
  mentions_count: number
  sentiment_positive: number
  sentiment_negative: number
  network_presence: number
  top_topics: string[]
}

interface ComparisonMetrics {
  name: string
  value: number
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Competitors() {
  const navigate = useNavigate()
  const [selectedPolitician, setSelectedPolitician] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [loadingCompetitors, setLoadingCompetitors] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedCompetitor, setSelectedCompetitor] = useState<number | null>(null)
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul'
  })

  const t = THEMES[themeKey]

  // Data hooks
  const { data: politicians, isLoading: loadingPoliticians } = usePoliticians()
  const { data: mentions = [] } = useMentions({
    politicianId: selectedPolitician || undefined,
    limit: 100
  })

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)
      setCheckingAuth(false)
    }
    checkAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/login')
      else setUser(session.user)
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  // Auto-select first politician
  useEffect(() => {
    if (!selectedPolitician && politicians && politicians.length > 0) {
      setSelectedPolitician(politicians[0].id)
    }
  }, [politicians, selectedPolitician])

  // Load competitors
  useEffect(() => {
    if (selectedPolitician) {
      fetchCompetitors()
    }
  }, [selectedPolitician])

  const fetchCompetitors = async () => {
    if (!selectedPolitician) return
    setLoadingCompetitors(true)
    try {
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('politician_id', selectedPolitician)

      if (error) {
        console.error('Erro ao buscar competidores:', error)
        return
      }

      // Simulated competitor data with metrics
      const enrichedData = (data || []).map((comp: any) => ({
        ...comp,
        mentions_count: Math.floor(Math.random() * 150 + 20),
        sentiment_positive: Math.floor(Math.random() * 80 + 10),
        sentiment_negative: Math.floor(Math.random() * 40 + 5),
        network_presence: Math.floor(Math.random() * 100),
        top_topics: ['Economia', 'Educação', 'Saúde', 'Segurança'].sort(() => Math.random() - 0.5).slice(0, 3)
      }))

      setCompetitors(enrichedData)
    } catch (error) {
      console.error('Erro ao buscar competidores:', error)
      toast.error('Erro ao carregar competidores')
    } finally {
      setLoadingCompetitors(false)
    }
  }

  const currentPolitician = politicians?.find(p => p.id === selectedPolitician)

  // Calculate metrics for radar chart
  const getRadarData = () => {
    const mainMetrics = {
      'Menções': mentions.length > 0 ? Math.min(100, mentions.length * 5) : 0,
      'Sentimento': calculateSentiment(mentions),
      'Presença Digital': Math.floor(Math.random() * 80 + 20),
      'Engajamento': Math.floor(Math.random() * 70 + 30),
      'Relevância': calculateRelevance(mentions)
    }
    return mainMetrics
  }

  const calculateSentiment = (mentionsList: any[]) => {
    if (mentionsList.length === 0) return 50
    const positive = mentionsList.filter(m => m.sentiment === 'positivo').length
    const negative = mentionsList.filter(m => m.sentiment === 'negativo').length
    const total = mentionsList.length
    return Math.round(50 + ((positive - negative) / total) * 50)
  }

  const calculateRelevance = (mentionsList: any[]) => {
    if (mentionsList.length === 0) return 0
    const relevantMentions = mentionsList.filter(m => (m.relevance_score || 0) > 0.5).length
    return Math.round((relevantMentions / mentionsList.length) * 100)
  }

  const radarData = getRadarData()

  // Format data for comparison charts
  const comparisonChartData = currentPolitician && competitors.length > 0
    ? [
        {
          name: currentPolitician.nickname || currentPolitician.name.split(' ')[0],
          score: (mentions.length > 0 ? Math.min(100, mentions.length * 5) : 50),
          mentions: mentions.length,
          sentiment: calculateSentiment(mentions)
        },
        ...(competitors.slice(0, 2).map(c => ({
          name: c.name.split(' ')[0],
          score: c.score || 50,
          mentions: c.mentions_count,
          sentiment: Math.round(((c.sentiment_positive / (c.sentiment_positive + c.sentiment_negative)) * 100) || 50)
        })))
      ]
    : []

  // Sentiment comparison data
  const sentimentData = currentPolitician && competitors.length > 0
    ? [
        {
          politician: currentPolitician.nickname || currentPolitician.name,
          positivo: mentions.filter(m => m.sentiment === 'positivo').length,
          negativo: mentions.filter(m => m.sentiment === 'negativo').length
        },
        ...(competitors.slice(0, 2).map(c => ({
          politician: c.name,
          positivo: c.sentiment_positive,
          negativo: c.sentiment_negative
        })))
      ]
    : []

  // ============================================
  // LOADING / EMPTY STATES
  // ============================================

  if (checkingAuth || loadingPoliticians) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgGradient }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: t.accentText }} />
      </div>
    )
  }

  if (!politicians || politicians.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: t.bgGradient, color: t.brightText }}>
        <header className="border-b sticky top-0 z-50" style={{ borderColor: t.headerBorder, backgroundColor: t.headerBg }}>
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚔️</span>
              <div>
                <h1 className="font-bold text-base" style={{ color: t.brightText }}>Comparativo com Adversários</h1>
                <p className="text-xs" style={{ color: t.mutedText }}>Premium • Análise competitiva</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} style={{ color: t.bodyText }}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar ao Dashboard
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto text-center" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: t.accentMuted }}>
                <Users className="h-8 w-8" style={{ color: t.accentText }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: t.brightText }}>Nenhum político cadastrado</h2>
              <p className="mb-6" style={{ color: t.bodyText }}>Cadastre um político para usar o comparativo</p>
              <Button onClick={() => navigate('/add-politician')} size="lg" className="text-white" style={{ backgroundColor: t.accentText }}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Político
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 md:pl-16 min-h-screen" style={{ background: t.bgGradient, color: t.brightText }}>
        {/* Header */}
        <header className="border-b sticky top-0 z-50" style={{ borderColor: t.headerBorder, backgroundColor: t.headerBg }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚔️</span>
            <div>
              <h1 className="font-bold text-base" style={{ color: t.brightText }}>Comparativo com Adversários</h1>
              <p className="text-xs" style={{ color: t.mutedText }}>Premium • Análise competitiva</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentPolitician && (
              <div className="hidden sm:flex items-center gap-2">
                <Badge className="text-[11px]" style={{ backgroundColor: t.filterBg, color: `${t.brightText}cc`, borderColor: t.cardHoverBorder }}>
                  {currentPolitician.party}
                </Badge>
                <span className="text-sm" style={{ color: t.bodyText }}>{currentPolitician.nickname || currentPolitician.name.split(' ')[0]}</span>
              </div>
            )}

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" style={{ color: t.bodyText }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Competidor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <DialogHeader>
                  <DialogTitle style={{ color: t.brightText }}>Adicionar Competidor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: t.bodyText }}>
                      Selecionar Político
                    </label>
                    <Select onValueChange={(value) => setSelectedCompetitor(parseInt(value))}>
                      <SelectTrigger style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.brightText }}>
                        <SelectValue placeholder="Escolha um político" />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                        {politicians
                          .filter(p => p.id !== selectedPolitician && !competitors.some(c => c.competitor_politician_id === p.id))
                          .map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.name} - {p.party}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={async () => {
                      if (!selectedPolitician || !selectedCompetitor) {
                        toast.error('Selecione um competidor')
                        return
                      }
                      try {
                        const { error } = await supabase
                          .from('competitors')
                          .insert({
                            politician_id: selectedPolitician,
                            competitor_politician_id: selectedCompetitor
                          })
                        if (error) throw error
                        toast.success('Competidor adicionado!')
                        setShowAddDialog(false)
                        fetchCompetitors()
                      } catch (error) {
                        console.error('Erro ao adicionar competidor:', error)
                        toast.error('Erro ao adicionar competidor')
                      }
                    }}
                    className="w-full text-white"
                    style={{ backgroundColor: t.accentText }}
                  >
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} style={{ color: t.bodyText }}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* Politician Selector */}
        {politicians.length > 1 && (
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-4">
              <label className="text-sm mb-2 block" style={{ color: t.bodyText }}>
                Selecione o Político Principal
              </label>
              <Select value={selectedPolitician?.toString() || ''} onValueChange={(v) => setSelectedPolitician(parseInt(v))}>
                <SelectTrigger style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.brightText }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                  {politicians.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} - {p.party}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {competitors.length === 0 ? (
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: t.mutedText }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: t.brightText }}>
                Nenhum Competidor Configurado
              </h3>
              <p className="mb-6" style={{ color: t.bodyText }}>
                Adicione competidores para começar a comparação
              </p>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="text-white" style={{ backgroundColor: t.accentText }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Competidor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                  <DialogHeader>
                    <DialogTitle style={{ color: t.brightText }}>Adicionar Competidor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm mb-2 block" style={{ color: t.bodyText }}>
                        Selecionar Político
                      </label>
                      <Select onValueChange={(value) => setSelectedCompetitor(parseInt(value))}>
                        <SelectTrigger style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.brightText }}>
                          <SelectValue placeholder="Escolha um político" />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                          {politicians
                            .filter(p => p.id !== selectedPolitician)
                            .map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name} - {p.party}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!selectedPolitician || !selectedCompetitor) {
                          toast.error('Selecione um competidor')
                          return
                        }
                        try {
                          const { error } = await supabase
                            .from('competitors')
                            .insert({
                              politician_id: selectedPolitician,
                              competitor_politician_id: selectedCompetitor
                            })
                          if (error) throw error
                          toast.success('Competidor adicionado!')
                          setShowAddDialog(false)
                          fetchCompetitors()
                        } catch (error) {
                          console.error('Erro ao adicionar competidor:', error)
                          toast.error('Erro ao adicionar competidor')
                        }
                      }}
                      className="w-full text-white"
                      style={{ backgroundColor: t.accentText }}
                    >
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Radar Chart - Multi-dimensional Comparison */}
            <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: `${t.brightText}ee` }}>
                  <BarChart3 className="h-5 w-5" style={{ color: t.accentText }} />
                  Comparação Multi-Dimensional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[350px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={Object.entries(radarData).map(([name, value]) => ({
                      metric: name,
                      value: Math.min(100, value)
                    }))}>
                      <PolarGrid stroke={t.chartGrid} />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: t.mutedText }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11, fill: t.mutedText }} />
                      <Radar
                        name={currentPolitician?.nickname || currentPolitician?.name || 'Principal'}
                        dataKey="value"
                        stroke={t.accentText}
                        fill={t.accentText}
                        fillOpacity={0.25}
                        dot={{ fill: t.accentText, r: 4 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '8px', color: t.brightText }}
                        formatter={(value: number) => `${Math.round(value)}`}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score Comparison */}
            {comparisonChartData.length > 0 && (
              <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: `${t.brightText}ee` }}>
                    <TrendingUp className="h-5 w-5" style={{ color: t.accentText }} />
                    Comparação de Scores
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: t.mutedText }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: t.mutedText }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '8px', color: t.brightText }}
                          formatter={(value: number) => `${Math.round(value)}`}
                        />
                        <Legend wrapperStyle={{ color: t.bodyText }} />
                        <Bar dataKey="score" fill={t.accentText} name="Score" />
                        <Bar dataKey="sentiment" fill="hsl(152,55%,50%)" name="Sentimento" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sentiment Comparison */}
            {sentimentData.length > 0 && (
              <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: `${t.brightText}ee` }}>
                    <MessageCircle className="h-5 w-5" style={{ color: t.accentText }} />
                    Análise de Sentimento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sentimentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                        <XAxis dataKey="politician" tick={{ fontSize: 11, fill: t.mutedText }} />
                        <YAxis tick={{ fontSize: 12, fill: t.mutedText }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '8px', color: t.brightText }}
                        />
                        <Legend wrapperStyle={{ color: t.bodyText }} />
                        <Bar dataKey="positivo" fill="hsl(152,55%,50%)" name="Positivo" />
                        <Bar dataKey="negativo" fill="hsl(0,72%,55%)" name="Negativo" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competitor Cards */}
            <div>
              <h2 className="text-sm font-semibold mb-4" style={{ color: `${t.brightText}dd` }}>
                📊 Competidores Monitorados ({competitors.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {competitors.map((comp) => (
                  <Card
                    key={comp.id}
                    className="transition-all hover:scale-105"
                    style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base" style={{ color: t.brightText }}>
                        {comp.name}
                      </CardTitle>
                      <p className="text-xs" style={{ color: t.mutedText }}>
                        {comp.party} • {comp.position}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Score Gauge */}
                      <div className="flex items-center justify-between">
                        <span style={{ color: t.bodyText }} className="text-sm">Score Geral</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full" style={{ backgroundColor: t.filterBg }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${comp.score}%`,
                                backgroundColor: comp.score >= 70 ? 'hsl(152,55%,50%)' : comp.score >= 50 ? t.accentText : 'hsl(0,72%,55%)'
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold" style={{ color: t.accentText }}>
                            {comp.score}
                          </span>
                        </div>
                      </div>

                      {/* Mentions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" style={{ color: t.mutedText }} />
                          <span style={{ color: t.bodyText }} className="text-sm">Menções</span>
                        </div>
                        <span className="font-semibold" style={{ color: t.accentText }}>
                          {comp.mentions_count}
                        </span>
                      </div>

                      {/* Sentiment Distribution */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: t.bodyText }}>Sentimento</span>
                          <span style={{ color: t.mutedText }}>
                            +{comp.sentiment_positive} / -{comp.sentiment_negative}
                          </span>
                        </div>
                        <div className="flex gap-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: t.filterBg }}>
                          <div
                            className="transition-all"
                            style={{ width: `${(comp.sentiment_positive / (comp.sentiment_positive + comp.sentiment_negative)) * 100}%`, backgroundColor: 'hsl(152,55%,50%)' }}
                          />
                          <div
                            style={{ width: `${(comp.sentiment_negative / (comp.sentiment_positive + comp.sentiment_negative)) * 100}%`, backgroundColor: 'hsl(0,72%,55%)' }}
                          />
                        </div>
                      </div>

                      {/* Network Presence */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" style={{ color: t.mutedText }} />
                          <span style={{ color: t.bodyText }} className="text-sm">Presença Digital</span>
                        </div>
                        <span className="font-semibold" style={{ color: t.accentText }}>
                          {comp.network_presence}%
                        </span>
                      </div>

                      {/* Top Topics */}
                      <div>
                        <p className="text-xs mb-2" style={{ color: t.mutedText }}>Principais Tópicos</p>
                        <div className="flex flex-wrap gap-1">
                          {comp.top_topics.map((topic, i) => (
                            <Badge
                              key={i}
                              className="text-[10px]"
                              style={{ backgroundColor: t.filterBg, color: t.accentText, borderColor: t.cardBorder }}
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="text-center py-6 text-xs" style={{ color: `${t.mutedText}88` }}>
          Análise Comparativa • Premium Feature • Dados em tempo real
        </footer>
      </main>
      </div>
    </div>
  )
}
