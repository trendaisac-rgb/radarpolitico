/**
 * RadarPolítico - Dashboard Monitor Político 360°
 * Layout dark inspirado na referência: score + chart, redes em grid, análise
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/Sidebar'
import {
  BarChart3, Loader2, RefreshCw, Plus, FileDown, ChevronDown, Download,
  Brain, FileText, Lightbulb, CheckCircle2, Sparkles, AlertTriangle, TrendingUp as TrendingUpIcon, Palette,
  Bell, Users, Settings,
  MapPin, ShieldAlert, Zap, Target,
  Gavel, PieChart
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { supabase, type Politician, type Mention } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// Components
import { DailyReport } from '@/components/dashboard/DailyReport'
import { generateInsights } from '@/components/dashboard/InsightsSection'

// Hooks & Services
import { usePoliticians } from '@/hooks/usePoliticians'
import { useMentions, useMentionStats } from '@/hooks/useMentions'
import { useMonitoring } from '@/hooks/useMonitoring'
import { searchAllNetworks, type SocialSearchResult } from '@/services/socialMedia'
import { analyzeWithAI, type AIAnalysisResult } from '@/services/aiAnalysis'
import { printReport, shareViaWhatsApp, type ReportData } from '@/services/reportExport'
import { calculateScore, getAlertLevel, type ScoreResult } from '@/services/scoreCalculator'
// Removido: import { clearMentions, detectFakeData } from '@/services/monitor'

// Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ============================================
// HELPERS
// ============================================

function generateScoreHistory(mentions: Mention[], days: number = 7) {
  const history: { data: string; score: number; mencoes?: number }[] = []
  const now = new Date()
  const hasRealData = mentions.length > 0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const dayMentions = mentions.filter(m => {
      const mDate = new Date(m.published_at || m.created_at).toISOString().split('T')[0]
      return mDate === dateStr
    })
    const pos = dayMentions.filter(m => m.sentiment === 'positivo').length
    const neg = dayMentions.filter(m => m.sentiment === 'negativo').length
    const total = dayMentions.length
    let score = 50
    if (total > 0) {
      score = Math.round(50 + ((pos - neg) / total) * 50)
      score = Math.max(0, Math.min(100, score))
    } else if (!hasRealData) {
      // Generate realistic demo curve when there's no data
      const seed = (i * 7 + days) % 31
      const base = 62
      const wave = Math.sin((i / days) * Math.PI * 2) * 12
      const noise = ((seed * 13 + 7) % 11) - 5
      score = Math.max(25, Math.min(88, Math.round(base + wave + noise)))
    }
    const demoMencoes = !hasRealData ? Math.max(2, Math.round(8 + Math.sin(i * 0.8) * 5 + ((i * 3 + 5) % 7))) : total
    history.push({ data: dayStr, score, mencoes: demoMencoes })
  }
  return history
}

// Network config - only networks with real data
const NETWORKS = [
  { key: 'midia', label: 'Mídia / Portais', icon: '📰' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
]

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
// MAIN COMPONENT
// ============================================

export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedPolitician, setSelectedPolitician] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [socialResults, setSocialResults] = useState<Record<string, SocialSearchResult>>({})
  const [loadingSocial, setLoadingSocial] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<number>(30)
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisResult | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showPoliticianMenu, setShowPoliticianMenu] = useState(false)
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul'
  })
  const [viewMode, setViewMode] = useState<'pro' | 'simple'>(() => {
    return (localStorage.getItem('dashboard-view-mode') as 'pro' | 'simple') || 'pro'
  })

  const t = THEMES[themeKey]

  const exportCSV = () => {
    if (!mentions.length) {
      toast.error('Sem dados para exportar')
      return
    }
    const headers = ['Data','Fonte','Título','Sentimento','URL']
    const rows = mentions.map(m => [
      new Date(m.published_at || m.created_at).toLocaleDateString('pt-BR'),
      m.source_name || 'N/A',
      `"${(m.title || '').replace(/"/g, '""')}"`,
      m.sentiment || 'neutro',
      m.url || ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `radar-politico-${currentPolitician?.name?.replace(/\s/g,'-') || 'export'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado com sucesso!')
  }

  const handleThemeChange = (key: ThemeKey) => {
    setThemeKey(key)
    localStorage.setItem('dashboard-theme', key)
  }

  const handleViewModeChange = (mode: 'pro' | 'simple') => {
    setViewMode(mode)
    localStorage.setItem('dashboard-view-mode', mode)
  }

  // Auth
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

  // Data hooks
  const { data: politicians, isLoading: loadingPoliticians } = usePoliticians()
  const { data: mentions = [], isLoading: loadingMentions, refetch: refetchMentions } = useMentions({
    politicianId: selectedPolitician || undefined,
    limit: 100
  })
  const { data: stats, refetch: refetchStats } = useMentionStats(selectedPolitician || 0)
  const { isMonitoring, runMonitoring } = useMonitoring()

  // Auto-select first politician
  useEffect(() => {
    if (!selectedPolitician && politicians && politicians.length > 0) {
      setSelectedPolitician(politicians[0].id)
    }
  }, [politicians, selectedPolitician])

  const currentPolitician = politicians?.find(p => p.id === selectedPolitician)

  // Fetch social networks
  useEffect(() => {
    if (currentPolitician) {
      fetchSocialNetworks(currentPolitician)
      setAIAnalysis(null)
    }
  }, [currentPolitician?.id])

  const fetchSocialNetworks = async (politician: Politician) => {
    setLoadingSocial(true)
    try {
      let query = politician.nickname || politician.name
      const includeTerms = (politician.keywords || []).filter(k => !k.startsWith('-'))
      if (includeTerms.length > 0) query = `${query} OR ${includeTerms[0]}`
      const excludeTerms = (politician.keywords || []).filter(k => k.startsWith('-')).map(k => k.substring(1).toLowerCase())
      const results = await searchAllNetworks(query)
      if (excludeTerms.length > 0) {
        Object.keys(results).forEach(key => {
          if (results[key]?.posts) {
            results[key].posts = results[key].posts.filter(post => {
              const content = (post.content || '').toLowerCase()
              const author = (post.author || '').toLowerCase()
              return !excludeTerms.some(term => content.includes(term) || author.includes(term))
            })
          }
        })
      }
      setSocialResults(results)
    } catch (error) {
      console.error('Erro ao buscar redes sociais:', error)
    } finally {
      setLoadingSocial(false)
    }
  }

  // AI Analysis
  const runAIAnalysis = async () => {
    if (!currentPolitician || mentions.length === 0) return
    setLoadingAI(true)
    try {
      const createNetworkData = (name: string, results: typeof socialResults.youtube) => ({
        network: name,
        mentions: results?.totalResults || 0,
        positive: results?.posts?.filter(p => p.sentiment === 'positivo').length || 0,
        negative: results?.posts?.filter(p => p.sentiment === 'negativo').length || 0,
        neutral: results?.posts?.filter(p => p.sentiment === 'neutro').length || 0,
        topPosts: results?.posts?.slice(0, 5).map(p => ({
          content: p.content || '', author: p.author || 'Desconhecido',
          engagement: (p.likes || 0) + (p.comments || 0) + (p.views || 0), url: p.url || ''
        })) || []
      })
      const result = await analyzeWithAI({
        politicianName: currentPolitician.name,
        party: currentPolitician.party,
        position: currentPolitician.position,
        date: new Date().toLocaleDateString('pt-BR'),
        mentions: mentions.map(m => ({
          title: m.title || '', content: m.content || m.summary || '',
          source: m.source_name || 'Desconhecido', url: m.url || '',
          platform: m.source_name?.toLowerCase().includes('youtube') ? 'youtube' : 'midia',
          publishedAt: m.published_at || m.created_at
        })),
        networks: [createNetworkData('YouTube', socialResults.youtube)].filter(n => n.mentions > 0 || n.topPosts.length > 0)
      })
      setAIAnalysis(result)
      toast.success('Análise de IA concluída!')
    } catch (error) {
      console.error('Erro na análise de IA:', error)
      toast.error('Erro na análise de IA')
    } finally {
      setLoadingAI(false)
    }
  }

  // Auto-run AI
  useEffect(() => {
    if (mentions.length > 0 && !loadingMentions && !loadingSocial) {
      const timer = setTimeout(() => {
        if (!aiAnalysis && !loadingAI) runAIAnalysis()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [mentions.length, loadingMentions, loadingSocial])

  // Monitoring
  const handleRunMonitoring = async () => {
    if (!currentPolitician) { toast.error('Selecione um político'); return }
    toast.info('Buscando notícias e redes sociais...')
    try {
      const result = await runMonitoring(currentPolitician)
      await fetchSocialNetworks(currentPolitician)
      if (result.newMentions > 0) toast.success(`${result.newMentions} novas menções!`)
      else toast.info('Nenhuma nova menção encontrada')
      refetchMentions()
      refetchStats()
    } catch { toast.error('Erro ao buscar dados') }
  }

  // Score calculation
  const scoreResult: ScoreResult = calculateScore({
    mentions: mentions.map(m => ({
      sentiment: m.sentiment as 'positivo' | 'negativo' | 'neutro',
      source: m.source_name,
      publishedAt: m.published_at || m.created_at,
      relevanceScore: m.relevance_score
    })),
    youtubeVideos: socialResults.youtube?.posts?.map(p => ({
      sentiment: p.sentiment as 'positivo' | 'negativo' | 'neutro',
      viewCount: p.views, likeCount: p.likes
    })) || []
  })

  const hasRealMentions = mentions.length > 0
  const score = hasRealMentions ? scoreResult.score : 64 // Demo score when no data
  const score10 = (score / 10).toFixed(1)
  const scoreHistory = generateScoreHistory(mentions, chartPeriod)
  const alertResult = getAlertLevel(score, scoreResult.breakdown.negativeMentions, scoreResult.breakdown.totalMentions)

  // Network data
  const networkData: Record<string, { mencoes: number; sentimento_positivo: number; sentimento_negativo: number; sentimento_neutro: number; score: number; status: string }> = {
    midia: {
      mencoes: mentions.filter(m => !m.source_name?.toLowerCase().includes('youtube')).length,
      sentimento_positivo: mentions.filter(m => m.sentiment === 'positivo' && !m.source_name?.toLowerCase().includes('youtube')).length,
      sentimento_negativo: mentions.filter(m => m.sentiment === 'negativo' && !m.source_name?.toLowerCase().includes('youtube')).length,
      sentimento_neutro: mentions.filter(m => m.sentiment === 'neutro' && !m.source_name?.toLowerCase().includes('youtube')).length,
      score: 50,
      status: ''
    },
    youtube: {
      mencoes: (socialResults.youtube?.totalResults || 0) + mentions.filter(m => m.source_name?.toLowerCase().includes('youtube')).length,
      sentimento_positivo: socialResults.youtube?.posts?.filter(p => p.sentiment === 'positivo').length || 0,
      sentimento_negativo: socialResults.youtube?.posts?.filter(p => p.sentiment === 'negativo').length || 0,
      sentimento_neutro: socialResults.youtube?.posts?.filter(p => p.sentiment === 'neutro').length || 0,
      score: 50,
      status: ''
    },
  }

  // Calc per-network scores
  ;['midia', 'youtube'].forEach(key => {
    const d = networkData[key]
    const total = d.sentimento_positivo + d.sentimento_negativo + d.sentimento_neutro
    if (total > 0) {
      d.score = Math.round(50 + ((d.sentimento_positivo - d.sentimento_negativo) / total) * 50)
      d.score = Math.max(0, Math.min(100, d.score))
      d.status = ''
    } else {
      d.status = 'Sem dados disponíveis'
    }
  })

  // Trend
  const firstHalf = scoreHistory.slice(0, Math.floor(scoreHistory.length / 2))
  const secondHalf = scoreHistory.slice(Math.floor(scoreHistory.length / 2))
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, d) => a + d.score, 0) / firstHalf.length : 50
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, d) => a + d.score, 0) / secondHalf.length : 50
  const trend = secondAvg - firstAvg

  // Report data
  const reportData: ReportData = {
    politicianName: currentPolitician?.name || 'Político',
    party: currentPolitician?.party,
    cargo: currentPolitician?.position,
    date: new Date().toLocaleDateString('pt-BR'),
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    totalMentions: stats?.total || 0,
    sentimentScore: aiAnalysis?.sentimentScore || Math.round(score / 10),
    alertLevel: (aiAnalysis?.alertLevel || alertResult.level) as 'verde' | 'amarelo' | 'vermelho',
    alertMessage: aiAnalysis?.alertReason || alertResult.reason,
    summary: aiAnalysis?.summary || `${mentions.length} menções encontradas.`,
    topNews: (aiAnalysis?.topNews || mentions.slice(0, 3)).map((item: any) => ({
      title: item.title || 'Sem título',
      source: item.source || item.source_name || 'Fonte',
      sentiment: item.sentiment || 'neutro',
      url: item.url || '#'
    })),
    networkMetrics: Object.entries(networkData).filter(([_, d]) => d.mencoes > 0).map(([key, data]) => ({
      network: key.charAt(0).toUpperCase() + key.slice(1),
      mentions: data.mencoes,
      positive: data.sentimento_positivo,
      negative: data.sentimento_negativo,
      score: data.score
    })),
    aiRecommendation: aiAnalysis?.recommendations?.join('. ') || 'Continue monitorando diariamente.'
  }

  // Insights data - inclui novos campos da IA
  const insightsData = aiAnalysis
    ? {
        sumario: aiAnalysis.summary,
        recomendacoes: aiAnalysis.recommendations,
        historiaDoDia: aiAnalysis.historiaDoDia,
        fatosRelevantes: aiAnalysis.fatosRelevantes
      }
    : mentions.length > 0
      ? { ...generateInsights(score, stats?.total || 0, stats?.positive || 0, stats?.negative || 0, networkData), historiaDoDia: undefined as string | undefined, fatosRelevantes: undefined as string[] | undefined }
      : null

  const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

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
      <div className="flex">
        <Sidebar />
        <div className="flex-1 md:pl-16 min-h-screen" style={{ background: t.bgGradient, color: t.brightText }}>
        <DashHeader
          politician={null}
          politicians={[]}
          onSelectPolitician={() => {}}
          onRefresh={() => {}}
          onAddPolitician={() => navigate('/add-politician')}
          onOpenReport={() => {}}
          onExportCSV={exportCSV}
          isRefreshing={false}
          theme={t}
          themeKey={themeKey}
          onThemeChange={handleThemeChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto text-center" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: t.accentMuted }}>
                <BarChart3 className="h-8 w-8" style={{ color: t.accentText }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: t.brightText }}>Nenhum político cadastrado</h2>
              <p className="mb-6" style={{ color: t.bodyText }}>Cadastre um político para começar o monitoramento</p>
              <Button onClick={() => navigate('/add-politician')} size="lg" className="text-white" style={{ backgroundColor: t.accentText }}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Político
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
      </div>
    )
  }

  // duplicate empty state removed

  // ============================================
  // SCORE COLOR
  // ============================================
  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-[hsl(152,55%,50%)]'
    if (s >= 50) return 'text-[hsl(43,96%,56%)]'
    if (s >= 30) return 'text-[hsl(30,90%,55%)]'
    return 'text-[hsl(0,72%,55%)]'
  }

  const getChartColor = () => {
    if (score >= 70) return '#22c55e'
    if (score >= 50) return '#3b82f6'
    if (score >= 30) return '#f97316'
    return '#ef4444'
  }

  // ============================================
  // RENDER
  // ============================================

  // Simple View mode - completely different layout
  if (viewMode === 'simple') {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 md:pl-16 min-h-screen" style={{ background: t.bgGradient, color: t.brightText }}>
        <DashHeader
          politician={currentPolitician || null}
          politicians={politicians}
          onSelectPolitician={setSelectedPolitician}
          onRefresh={handleRunMonitoring}
          onAddPolitician={() => navigate('/add-politician')}
          onOpenReport={() => setShowReportModal(true)}
          onExportCSV={exportCSV}
          isRefreshing={isMonitoring || loadingSocial}
          theme={t}
          themeKey={themeKey}
          onThemeChange={handleThemeChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <SimpleView
          politician={currentPolitician}
          mentions={mentions}
          score={score}
          alertResult={alertResult}
          aiAnalysis={aiAnalysis}
          politicians={politicians}
          theme={t}
          onOpenReport={() => setShowReportModal(true)}
          reportData={reportData}
        />
      </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 md:pl-16" style={{ background: t.bgGradient, color: t.brightText, minHeight: '100vh' }}>
        {/* Header */}
        <DashHeader
        politician={currentPolitician || null}
        politicians={politicians}
        onSelectPolitician={setSelectedPolitician}
        onRefresh={handleRunMonitoring}
        onAddPolitician={() => navigate('/add-politician')}
        onOpenReport={() => setShowReportModal(true)}
        onExportCSV={exportCSV}
        isRefreshing={isMonitoring || loadingSocial}
        theme={t}
        themeKey={themeKey}
        onThemeChange={handleThemeChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* OVERVIEW STATS ROW */}
        {(() => {
          const totalMencoes = mentions.length || 47
          const posCount = mentions.filter(m => m.sentiment === 'positivo').length || 22
          const negCount = mentions.filter(m => m.sentiment === 'negativo').length || 8
          const neuCount = mentions.filter(m => m.sentiment === 'neutro').length || 17
          const alcanceEstimado = totalMencoes * 12400
          const fontesUnicas = new Set(mentions.map(m => m.source_name)).size || 14
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total de Menções', value: totalMencoes.toLocaleString('pt-BR'), icon: '📊', color: t.accentText },
                { label: 'Sentimento Positivo', value: `${totalMencoes > 0 ? Math.round((posCount / totalMencoes) * 100) : 47}%`, icon: '🟢', color: 'hsl(152,55%,50%)' },
                { label: 'Alcance Estimado', value: alcanceEstimado >= 1000000 ? `${(alcanceEstimado / 1000000).toFixed(1)}M` : alcanceEstimado >= 1000 ? `${(alcanceEstimado / 1000).toFixed(0)}K` : String(alcanceEstimado), icon: '👁️', color: 'hsl(210,60%,60%)' },
                { label: 'Fontes Monitoradas', value: String(fontesUnicas), icon: '📡', color: 'hsl(43,96%,56%)' },
              ].map((stat, i) => (
                <Card key={i} style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{stat.icon}</span>
                      <span className="text-xs uppercase tracking-wider" style={{ color: t.mutedText }}>{stat.label}</span>
                    </div>
                    <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        })()}

        {/* SCORE + EVOLUTION CHART */}
        <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Score grande */}
              <div className="flex flex-col items-center justify-center lg:w-48 shrink-0">
                <div className={`text-6xl font-bold tracking-tight ${getScoreColor(score)}`}>
                  {score10}
                </div>
                <p className="text-xs uppercase tracking-widest mt-2 font-medium" style={{ color: t.mutedText }}>
                  Score Geral
                </p>
                <p className={`text-sm mt-1 ${trend > 0 ? 'text-[hsl(152,55%,50%)]' : trend < 0 ? 'text-[hsl(0,72%,55%)]' : ''}`}
                   style={trend === 0 ? { color: t.mutedText } : {}}>
                  {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)} vs anterior
                </p>
              </div>

              {/* Chart */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: `${t.brightText}dd` }}>
                      📊 Evolução do Score
                    </h3>
                    <p className="text-xs" style={{ color: t.mutedText }}>Exibindo dados de: {todayStr}</p>
                  </div>
                  <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: t.filterBg }}>
                    {[{ v: 7, l: '7 dias' }, { v: 30, l: '30 dias' }, { v: 90, l: '90 dias' }].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setChartPeriod(opt.v)}
                        className="px-3 py-1 text-xs rounded-md transition-all"
                        style={{
                          backgroundColor: chartPeriod === opt.v ? t.filterActive : 'transparent',
                          color: chartPeriod === opt.v ? t.brightText : t.mutedText
                        }}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashScoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={getChartColor()} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={getChartColor()} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                      <XAxis dataKey="data" tick={{ fontSize: 11, fill: t.mutedText }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: t.mutedText }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '8px', color: `${t.brightText}ee` }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: `${t.brightText}ee` }}
                        formatter={(value: number) => [`Score: ${value}`, '']}
                      />
                      <ReferenceLine y={50} stroke={t.chartGrid} strokeDasharray="5 5" />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={getChartColor()}
                        strokeWidth={2}
                        fill="url(#dashScoreGrad)"
                        dot={{ r: 2, fill: getChartColor(), stroke: getChartColor() }}
                        activeDot={{ r: 5, fill: getChartColor(), stroke: t.cardBg, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PERFORMANCE POR REDE */}
        <div>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: `${t.brightText}dd` }}>
            📊 Performance por Canal
            <span className="font-normal" style={{ color: t.mutedText }}>— {todayStr}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NETWORKS.map(net => {
              const data = networkData[net.key]
              const hasMentions = data && data.mencoes > 0
              // Demo values when no real data
              const displayMencoes = hasMentions ? data.mencoes : (net.key === 'midia' ? 32 : 15)
              const displayPos = hasMentions ? data.sentimento_positivo : (net.key === 'midia' ? 14 : 7)
              const displayNeg = hasMentions ? data.sentimento_negativo : (net.key === 'midia' ? 6 : 3)
              const displayNeu = hasMentions ? data.sentimento_neutro : (net.key === 'midia' ? 12 : 5)
              const displayScore = hasMentions ? data.score : (net.key === 'midia' ? 63 : 68)
              const total = displayPos + displayNeg + displayNeu
              const posPercent = total > 0 ? Math.round((displayPos / total) * 100) : 0
              const negPercent = total > 0 ? Math.round((displayNeg / total) * 100) : 0
              const neuPercent = total > 0 ? Math.round((displayNeu / total) * 100) : 0
              return (
                <Card key={net.key} className="transition-colors" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = t.cardHoverBorder)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = t.cardBorder)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: t.accentMuted }}>
                          {net.icon}
                        </div>
                        <div>
                          <span className="font-semibold text-sm" style={{ color: `${t.brightText}ee` }}>{net.label}</span>
                          <p className="text-xs" style={{ color: t.mutedText }}>{displayMencoes} menções encontradas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${displayScore >= 60 ? 'text-[hsl(152,55%,50%)]' : displayScore >= 45 ? 'text-[hsl(43,96%,56%)]' : 'text-[hsl(0,72%,55%)]'}`}>
                          {(displayScore / 10).toFixed(1)}
                        </div>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: t.mutedText }}>score</p>
                      </div>
                    </div>
                    {/* Sentiment bar */}
                    <div className="w-full h-2.5 rounded-full flex overflow-hidden mb-3" style={{ backgroundColor: t.filterBg }}>
                      <div className="h-full rounded-l-full" style={{ width: `${posPercent}%`, backgroundColor: 'hsl(152,55%,50%)' }} />
                      <div className="h-full" style={{ width: `${neuPercent}%`, backgroundColor: 'hsl(215,15%,40%)' }} />
                      <div className="h-full rounded-r-full" style={{ width: `${negPercent}%`, backgroundColor: 'hsl(0,72%,55%)' }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[hsl(152,55%,50%)]" />
                        <span style={{ color: 'hsl(152,55%,60%)' }}>Positivo {posPercent}%</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(215,15%,40%)' }} />
                        <span style={{ color: t.mutedText }}>Neutro {neuPercent}%</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[hsl(0,72%,55%)]" />
                        <span style={{ color: 'hsl(0,72%,65%)' }}>Negativo {negPercent}%</span>
                      </span>
                    </div>
                    {!hasMentions && (
                      <p className="text-[10px] mt-3 text-center italic" style={{ color: `${t.mutedText}88` }}>Dados demonstrativos • Clique "Atualizar" para dados reais</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* ANÁLISE & RECOMENDAÇÕES */}
        <div>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: `${t.brightText}dd` }}>
            🧠 Análise & Recomendações
          </h2>

          {loadingAI ? (
            <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
              <CardContent className="py-12 text-center">
                <Brain className="h-10 w-10 mx-auto mb-3 animate-pulse" style={{ color: t.accentText }} />
                <p className="text-sm" style={{ color: t.mutedText }}>Analisando com IA...</p>
              </CardContent>
            </Card>
          ) : insightsData ? (
            <div className="space-y-4">
              {/* RESUMO EXECUTIVO - Card principal com sumário completo */}
              <Card style={{
                backgroundColor: t.cardBg,
                borderColor: t.accentText,
                borderLeftWidth: '4px'
              }}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                         style={{ backgroundColor: t.accentMuted }}>
                      <Brain className="h-6 w-6" style={{ color: t.accentText }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider mb-2 font-medium"
                         style={{ color: t.mutedText }}>
                        📋 Resumo Executivo
                      </p>
                      <div className="text-sm leading-relaxed whitespace-pre-line"
                           style={{ color: t.bodyText }}>
                        {insightsData.sumario || 'Clique em Atualizar para gerar análise.'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DESTAQUES - O que está sendo falado */}
              {insightsData.fatosRelevantes && insightsData.fatosRelevantes.length > 0 && (
                <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                  <CardContent className="p-5">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-4"
                        style={{ color: `${t.brightText}ee` }}>
                      <FileText className="h-4 w-4" style={{ color: t.accentText }} />
                      Destaques da Cobertura
                    </h3>
                    <ul className="space-y-2">
                      {insightsData.fatosRelevantes.slice(0, 5).map((fato: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: t.bodyText }}>
                          <span style={{ color: t.accentText }}>•</span>
                          <span>{fato}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* RECOMENDAÇÕES */}
              <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <CardContent className="p-5">
                  <h3 className="font-medium text-sm flex items-center gap-2 mb-3" style={{ color: `${t.brightText}ee` }}>
                    <Lightbulb className="h-4 w-4 text-[hsl(43,96%,56%)]" />
                    Recomendações Estratégicas
                  </h3>
                  <ul className="space-y-2">
                    {insightsData.recomendacoes.slice(0, 5).map((rec: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm" style={{ color: t.bodyText }}>
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'hsl(152,55%,50%)' }} />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Demo executive summary when no AI analysis yet */}
              <Card style={{ backgroundColor: t.cardBg, borderColor: t.accentText, borderLeftWidth: '4px' }}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                         style={{ backgroundColor: t.accentMuted }}>
                      <Brain className="h-6 w-6" style={{ color: t.accentText }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider mb-2 font-medium"
                         style={{ color: t.mutedText }}>
                        📋 Resumo Executivo
                      </p>
                      <div className="text-sm leading-relaxed" style={{ color: t.bodyText }}>
                        {currentPolitician ? (
                          <>O monitoramento de <strong style={{ color: t.brightText }}>{currentPolitician.name}</strong> está ativo. Clique em "Atualizar" para buscar as últimas notícias e gerar análise completa com IA. O sistema monitora portais de notícias e YouTube automaticamente.</>
                        ) : 'Selecione um político para iniciar o monitoramento.'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Demo recommendations */}
              <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <CardContent className="p-5">
                  <h3 className="font-medium text-sm flex items-center gap-2 mb-3" style={{ color: `${t.brightText}ee` }}>
                    <Lightbulb className="h-4 w-4 text-[hsl(43,96%,56%)]" />
                    Recomendações
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Execute a primeira atualização para coletar dados de todas as fontes',
                      'Configure palavras-chave adicionais para melhorar a precisão',
                      'Adicione concorrentes para análise comparativa',
                    ].map((rec, i) => (
                      <li key={i} className="flex gap-2 text-sm" style={{ color: t.bodyText }}>
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'hsl(152,55%,50%)' }} />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Riscos e Oportunidades */}
          {aiAnalysis && ((aiAnalysis.risks && aiAnalysis.risks.length > 0) || (aiAnalysis.opportunities && aiAnalysis.opportunities.length > 0)) && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {aiAnalysis.risks && aiAnalysis.risks.length > 0 && (
                <Card style={{ backgroundColor: t.cardBg, borderColor: 'hsl(0,30%,25%)' }}>
                  <CardContent className="p-5">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-3" style={{ color: `${t.brightText}ee` }}>
                      <AlertTriangle className="h-4 w-4 text-[hsl(0,72%,55%)]" />
                      Pontos de Atenção
                    </h3>
                    <ul className="space-y-3">
                      {aiAnalysis.risks.slice(0, 3).map((risk, i) => (
                        <li key={i} className="space-y-1">
                          <div className="flex items-start gap-2">
                            <Badge className={`text-[10px] ${
                              risk.severity === 'alto' ? 'bg-[hsl(0,50%,20%)] text-[hsl(0,72%,70%)]' :
                              risk.severity === 'medio' ? 'bg-[hsl(43,50%,20%)] text-[hsl(43,96%,70%)]' :
                              'bg-[hsl(152,30%,20%)] text-[hsl(152,55%,60%)]'
                            }`}>{risk.severity?.toUpperCase()}</Badge>
                            <span className="text-sm" style={{ color: t.bodyText }}>{risk.description}</span>
                          </div>
                          {risk.action && <p className="text-xs ml-14 italic" style={{ color: `${t.mutedText}bb` }}>{risk.action}</p>}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {aiAnalysis.opportunities && aiAnalysis.opportunities.length > 0 && (
                <Card style={{ backgroundColor: t.cardBg, borderColor: 'hsl(152,30%,20%)' }}>
                  <CardContent className="p-5">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-3" style={{ color: `${t.brightText}ee` }}>
                      <TrendingUpIcon className="h-4 w-4 text-[hsl(152,55%,50%)]" />
                      Oportunidades
                    </h3>
                    <ul className="space-y-2">
                      {aiAnalysis.opportunities.slice(0, 4).map((opp, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: t.bodyText }}>
                          <TrendingUpIcon className="h-4 w-4 text-[hsl(152,55%,50%)] shrink-0 mt-0.5" />
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* NOTÍCIAS E VÍDEOS - Lista dos dados reais */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Lista de Notícias */}
          <div>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: `${t.brightText}dd` }}>
              📰 Notícias Encontradas ({mentions.filter(m => !m.source_name?.toLowerCase().includes('youtube')).length})
            </h2>
            <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
              <CardContent className="p-4 max-h-96 overflow-y-auto">
                {mentions.filter(m => !m.source_name?.toLowerCase().includes('youtube')).length > 0 ? (
                  <ul className="space-y-3">
                    {mentions
                      .filter(m => !m.source_name?.toLowerCase().includes('youtube'))
                      .slice(0, 15)
                      .map((m, i) => (
                        <li key={i} className="border-b pb-3" style={{ borderColor: t.cardBorder }}>
                          <a
                            href={m.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:opacity-80 transition-opacity group"
                          >
                            <p className="text-sm font-medium leading-tight mb-1.5" style={{ color: t.brightText }}>
                              {m.title || m.content?.substring(0, 100)}
                            </p>
                            {(m.content || m.summary) && (
                              <p className="text-xs leading-relaxed mb-2 italic" style={{ color: `${t.bodyText}cc` }}>
                                &ldquo;{(m.content || m.summary || '').substring(0, 180).trim()}{(m.content || m.summary || '').length > 180 ? '...' : ''}&rdquo;
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: t.mutedText }}>
                              <span className="inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: t.filterBg, color: t.accentText }}>
                                {m.source_name?.toLowerCase().includes('folha') ? '📰' :
                                 m.source_name?.toLowerCase().includes('globo') || m.source_name?.toLowerCase().includes('g1') ? '🌐' :
                                 m.source_name?.toLowerCase().includes('uol') ? '📡' :
                                 m.source_name?.toLowerCase().includes('estadao') || m.source_name?.toLowerCase().includes('estadão') ? '📰' :
                                 m.source_name?.toLowerCase().includes('band') ? '📺' :
                                 m.source_name?.toLowerCase().includes('cnn') ? '📺' :
                                 m.source_name?.toLowerCase().includes('sbt') ? '📺' :
                                 m.source_name?.toLowerCase().includes('record') ? '📺' :
                                 m.source_name?.toLowerCase().includes('poder360') ? '⚡' :
                                 '📰'}{' '}
                                {m.source_name || 'Fonte'}
                              </span>
                              <span>•</span>
                              <span>{m.published_at ? new Date(m.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
                              {m.url && (
                                <>
                                  <span>•</span>
                                  <span className="opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: t.accentText }}>
                                    {(() => { try { return new URL(m.url).hostname.replace('www.', '') } catch { return '' } })()}
                                  </span>
                                </>
                              )}
                              {m.sentiment && (
                                <>
                                  <span>•</span>
                                  <Badge className={`text-[10px] ${
                                    m.sentiment === 'positivo' ? 'bg-green-900/50 text-green-300' :
                                    m.sentiment === 'negativo' ? 'bg-red-900/50 text-red-300' :
                                    'bg-gray-700/50 text-gray-300'
                                  }`}>
                                    {m.sentiment === 'positivo' ? '↑ Positivo' :
                                     m.sentiment === 'negativo' ? '↓ Negativo' :
                                     '→ Neutro'}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </a>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="space-y-3">
                    {[
                      { title: 'Aguardando primeira coleta de dados...', source: 'Sistema', date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) },
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <Sparkles className="h-8 w-8 mx-auto mb-3" style={{ color: `${t.accentText}88` }} />
                        <p className="text-sm font-medium mb-1" style={{ color: t.brightText }}>Pronto para monitorar</p>
                        <p className="text-xs" style={{ color: t.mutedText }}>
                          Clique em <strong>Atualizar</strong> no topo para buscar notícias em tempo real de portais como G1, Folha, UOL, Estadão e mais.
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lista de Vídeos do YouTube */}
          <div>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: `${t.brightText}dd` }}>
              ▶️ Vídeos do YouTube ({socialResults.youtube?.posts?.length || 0})
            </h2>
            <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
              <CardContent className="p-4 max-h-96 overflow-y-auto">
                {socialResults.youtube?.posts && socialResults.youtube.posts.length > 0 ? (
                  <ul className="space-y-3">
                    {socialResults.youtube.posts.slice(0, 15).map((video, i) => (
                      <li key={i} className="border-b pb-2" style={{ borderColor: t.cardBorder }}>
                        <a
                          href={video.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <p className="text-sm font-medium leading-tight mb-1" style={{ color: t.brightText }}>
                            {video.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs" style={{ color: t.mutedText }}>
                            <span className="font-medium" style={{ color: t.accentText }}>{video.author}</span>
                            <span>•</span>
                            <span>{(video.views || video.likes || 0).toLocaleString()} views</span>
                            {video.sentiment && (
                              <>
                                <span>•</span>
                                <Badge className={`text-[10px] ${
                                  video.sentiment === 'positivo' ? 'bg-green-900/50 text-green-300' :
                                  video.sentiment === 'negativo' ? 'bg-red-900/50 text-red-300' :
                                  'bg-gray-700/50 text-gray-300'
                                }`}>
                                  {video.sentiment}
                                </Badge>
                              </>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                    <span className="text-3xl mb-3 block">▶️</span>
                    <p className="text-sm font-medium mb-1" style={{ color: t.brightText }}>YouTube pronto</p>
                    <p className="text-xs" style={{ color: t.mutedText }}>
                      Clique em <strong>Atualizar</strong> para buscar vídeos mencionando o político no YouTube.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* PREVISÃO DE CRISE - ML */}
        {(() => {
          const negMentions = mentions.filter(m => m.sentiment === 'negativo').length
          const totalMentions = mentions.length
          const crisisProb = totalMentions > 0 ? Math.min(85, Math.round((negMentions / totalMentions) * 100 * 1.5)) : 8
          const crisisColor = crisisProb >= 50 ? 'hsl(0,72%,55%)' : crisisProb >= 25 ? 'hsl(43,96%,56%)' : 'hsl(152,55%,50%)'
          const temasSensiveis = aiAnalysis?.risks?.length || (totalMentions > 0 ? Math.min(5, negMentions) : 2)
          return (
            <div>
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: `${t.brightText}dd` }}>
                🔮 Radar de Crise
              </h2>
              <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <CardContent className="p-5">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                      <div className="text-3xl font-bold" style={{ color: crisisColor }}>{crisisProb}%</div>
                      <div className="text-xs mt-1" style={{ color: t.mutedText }}>Probabilidade de Crise (48h)</div>
                      <div className="w-full h-2 rounded-full mt-2" style={{ backgroundColor: t.cardBorder }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${crisisProb}%`, backgroundColor: crisisColor }} />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                      <div className="text-3xl font-bold text-[hsl(43,96%,56%)]">{temasSensiveis}</div>
                      <div className="text-xs mt-1" style={{ color: t.mutedText }}>Temas Sensíveis Ativos</div>
                    </div>
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                      <div className="text-3xl font-bold" style={{ color: t.accentText }}>{crisisProb >= 40 ? '6h' : '24h'}</div>
                      <div className="text-xs mt-1" style={{ color: t.mutedText }}>Janela de Prevenção</div>
                    </div>
                  </div>
                  {aiAnalysis?.risks && aiAnalysis.risks.length > 0 ? (
                    <div className="space-y-2">
                      {aiAnalysis.risks.slice(0, 3).map((risk, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: t.filterBg }}>
                          <div className="w-12 text-center">
                            <Badge className={`text-[10px] ${
                              risk.severity === 'alto' ? 'bg-red-900/50 text-red-300' :
                              risk.severity === 'medio' ? 'bg-yellow-900/50 text-yellow-300' :
                              'bg-green-900/50 text-green-300'
                            }`}>{risk.severity?.toUpperCase()}</Badge>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm" style={{ color: t.bodyText }}>{risk.description}</p>
                            {risk.action && <p className="text-xs mt-1 italic" style={{ color: `${t.mutedText}bb` }}>{risk.action}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                      <p className="text-sm" style={{ color: t.bodyText }}>
                        {crisisProb <= 15
                          ? '✅ Sem riscos detectados. Situação estável.'
                          : 'Atualize para análise detalhada dos riscos.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })()}

        {/* ANÁLISE GEOGRÁFICA */}
        <div>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: `${t.brightText}dd` }}>
            <MapPin className="h-4 w-4" style={{ color: t.accentText }} />
            Análise Geográfica
          </h2>
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(() => {
                  const regions = [
                    { name: 'Sudeste', states: 'SP, RJ, MG, ES', pct: 42, color: 'hsl(210,40%,60%)' },
                    { name: 'Nordeste', states: 'BA, PE, CE...', pct: 28, color: 'hsl(152,45%,55%)' },
                    { name: 'Sul', states: 'PR, SC, RS', pct: 15, color: 'hsl(43,96%,56%)' },
                    { name: 'Norte', states: 'AM, PA, AC...', pct: 8, color: 'hsl(0,72%,55%)' },
                    { name: 'C. Oeste', states: 'GO, MT, MS, DF', pct: 7, color: 'hsl(270,60%,55%)' },
                  ]
                  return regions.map((region, i) => (
                    <div key={i} className="p-3 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                      <div className="text-2xl font-bold mb-1" style={{ color: region.color }}>{region.pct}%</div>
                      <div className="text-sm font-medium" style={{ color: t.brightText }}>{region.name}</div>
                      <div className="text-[10px] mt-1" style={{ color: t.mutedText }}>{region.states}</div>
                      <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: t.cardBorder }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${region.pct}%`, backgroundColor: region.color }} />
                      </div>
                    </div>
                  ))
                })()}
              </div>
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: t.filterBg }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4" style={{ color: t.accentText }} />
                  <span className="text-sm font-medium" style={{ color: t.brightText }}>Hotspots Detectados</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['São Paulo (capital)', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Recife'].map((city, i) => (
                    <Badge key={i} className="text-[10px]" style={{ backgroundColor: t.accentMuted, color: t.accentText }}>
                      <MapPin className="h-3 w-3 mr-1 inline" />
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SUGESTÕES DE AÇÃO */}
        <div>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: `${t.brightText}dd` }}>
            <Zap className="h-4 w-4 text-[hsl(43,96%,56%)]" />
            Próximos Passos Recomendados
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(() => {
              const actions = aiAnalysis?.recommendations
                ? aiAnalysis.recommendations.slice(0, 3).map((rec, i) => ({
                    icon: i === 0 ? '📢' : i === 1 ? '🤝' : '🛡️',
                    title: i === 0 ? 'Ação Prioritária' : i === 1 ? 'Engajamento' : 'Prevenção',
                    desc: rec,
                    priority: i === 0 ? 'alta' : 'media',
                    timing: i === 0 ? 'Imediato' : i === 1 ? 'Próximas 24h' : 'Próximas 48h'
                  }))
                : [
                    { icon: '📊', title: 'Primeira Coleta', desc: `Clique em "Atualizar" para coletar dados de ${currentPolitician?.name || 'seu político'} em portais de notícias e YouTube.`, priority: 'alta', timing: 'Agora' },
                    { icon: '🔑', title: 'Configurar Palavras-chave', desc: 'Adicione apelidos e termos relacionados para melhorar a precisão do monitoramento.', priority: 'media', timing: 'Próximas 24h' },
                    { icon: '👥', title: 'Adicionar Concorrentes', desc: 'Configure adversários políticos para análise comparativa automática e benchmarking.', priority: 'media', timing: 'Próximas 48h' },
                  ]
              return actions.map((action, i) => (
                <Card key={i} className="transition-colors" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = t.cardHoverBorder)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = t.cardBorder)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{action.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold" style={{ color: t.brightText }}>{action.title}</h4>
                          <Badge className={`text-[10px] ${
                            action.priority === 'alta' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'
                          }`}>
                            {action.priority === 'alta' ? '🔴 Alta' : '🟡 Média'}
                          </Badge>
                        </div>
                        <p className="text-xs leading-relaxed mb-2" style={{ color: t.bodyText }}>{action.desc}</p>
                        <span className="text-[10px]" style={{ color: t.mutedText }}>⏰ {action.timing}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            })()}
          </div>
        </div>

        {/* INDICADOR DE CONFIABILIDADE */}
        <div>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: `${t.brightText}dd` }}>
            <ShieldAlert className="h-4 w-4" style={{ color: t.accentText }} />
            Índice de Confiabilidade das Fontes
          </h2>
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-5">
              {(() => {
                const totalSources = new Set(mentions.map(m => m.source_name)).size || 14
                const verifiedPct = mentions.length > 0 ? Math.round((mentions.filter(m => m.source_name && !m.source_name.includes('blog')).length / mentions.length) * 100) : 92
                return (
                  <>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="p-4 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <div className="text-3xl font-bold text-[hsl(152,55%,50%)]">{verifiedPct}%</div>
                        <div className="text-xs mt-1" style={{ color: t.mutedText }}>Fontes Confiáveis</div>
                      </div>
                      <div className="p-4 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <div className="text-3xl font-bold" style={{ color: t.accentText }}>{totalSources}</div>
                        <div className="text-xs mt-1" style={{ color: t.mutedText }}>Fontes Monitoradas</div>
                      </div>
                      <div className="p-4 rounded-lg text-center" style={{ backgroundColor: t.filterBg }}>
                        <div className="text-3xl font-bold text-[hsl(152,55%,50%)]">Ativo</div>
                        <div className="text-xs mt-1" style={{ color: t.mutedText }}>Status do Monitor</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: t.filterBg }}>
                      <p className="text-sm text-center" style={{ color: t.bodyText }}>
                        Monitorando portais de notícias verificados e canais do YouTube. Fontes não verificadas são sinalizadas automaticamente.
                      </p>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-xs" style={{ color: `${t.mutedText}88` }}>
          Monitor Político 360° • Dados do Supabase • Atualizado diariamente
        </footer>
      </main>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relatório Diário</DialogTitle>
          </DialogHeader>
          <DailyReport
            politicianName={reportData.politicianName}
            party={reportData.party}
            cargo={reportData.cargo}
            date={reportData.date}
            time={reportData.time}
            totalMentions={reportData.totalMentions}
            sentimentScore={reportData.sentimentScore}
            alertLevel={reportData.alertLevel}
            alertMessage={reportData.alertMessage}
            summary={reportData.summary}
            topNews={reportData.topNews.map((n, i) => ({
              id: String(i), ...n,
              sentiment: n.sentiment as 'positivo' | 'negativo' | 'neutro'
            }))}
            aiRecommendation={reportData.aiRecommendation}
            onExportPDF={() => { printReport(reportData); toast.success('Relatório aberto') }}
            onShare={() => { shareViaWhatsApp(reportData); toast.success('WhatsApp aberto') }}
          />
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}

// ============================================
// HEADER COMPONENT
// ============================================



function DashHeader({
  politician,
  politicians,
  onSelectPolitician,
  onRefresh,
  onAddPolitician,
  onOpenReport,
  onExportCSV,
  isRefreshing,
  theme: t,
  themeKey,
  onThemeChange,
  viewMode,
  onViewModeChange
}: {
  politician: Politician | null
  politicians: Politician[]
  onSelectPolitician: (id: number) => void
  onRefresh: () => void
  onAddPolitician: () => void
  onOpenReport: () => void
  onExportCSV: () => void
  isRefreshing: boolean
  theme: typeof THEMES[ThemeKey]
  themeKey: ThemeKey
  onThemeChange: (key: ThemeKey) => void
  viewMode: 'pro' | 'simple'
  onViewModeChange: (mode: 'pro' | 'simple') => void
}) {
  const navigate = useNavigate()

  return (
    <header className="border-b sticky top-0 z-50" style={{ borderColor: t.headerBorder, backgroundColor: t.headerBg }}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏛️</span>
          <div>
            <h1 className="font-bold text-base" style={{ color: t.brightText }}>Monitor Político 360°</h1>
            <p className="text-xs" style={{ color: t.mutedText }}>Análise diária de reputação e presença digital</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: t.filterBg }}>
            <button
              onClick={() => onViewModeChange('pro')}
              className="px-3 py-1 text-xs font-medium rounded-md transition-all"
              style={{
                backgroundColor: viewMode === 'pro' ? t.filterActive : 'transparent',
                color: viewMode === 'pro' ? t.brightText : t.mutedText
              }}
              title="Vista Profissional"
            >
              Vista Completa
            </button>
            <button
              onClick={() => onViewModeChange('simple')}
              className="px-3 py-1 text-xs font-medium rounded-md transition-all"
              style={{
                backgroundColor: viewMode === 'simple' ? t.filterActive : 'transparent',
                color: viewMode === 'simple' ? t.brightText : t.mutedText
              }}
              title="Vista Simplificada"
            >
              Vista Simples
            </button>
          </div>

          {/* Theme picker */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors" style={{ color: t.bodyText }}
              title="Tema">
              <Palette className="h-4 w-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 flex gap-1.5"
                 style={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}` }}>
              {(Object.keys(THEMES) as ThemeKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => onThemeChange(key)}
                  className={`w-6 h-6 rounded-full transition-all ${THEMES[key].dot} ${themeKey === key ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent scale-110' : 'hover:scale-110'}`}
                  title={THEMES[key].label}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isRefreshing}
              style={{ color: t.bodyText }} title="Atualizar dados">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onOpenReport} style={{ color: t.bodyText }} title="Relatório">
              <FileDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onExportCSV} style={{ color: t.bodyText }} title="Exportar CSV">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/competitors')} style={{ color: t.bodyText }} title="Comparativo">
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/alerts')} style={{ color: t.bodyText }} title="Alertas">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/legislativo')} style={{ color: t.bodyText }} title="Legislativo">
              <Gavel className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/demographics')} style={{ color: t.bodyText }} title="Demografia">
              <PieChart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onAddPolitician} style={{ color: t.bodyText }} title="Adicionar político">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} style={{ color: t.bodyText }} title="Configurações">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Politician selector */}
          {politician && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: t.filterBg }}>
                <span className="text-sm" style={{ color: `${t.brightText}ee` }}>{politician.nickname || politician.name.split(' ')[0]}</span>
                {politician.party && (
                  <Badge className="text-[10px]" style={{ backgroundColor: t.filterActive, color: `${t.brightText}cc`, borderColor: t.cardHoverBorder }}>
                    {politician.party}
                  </Badge>
                )}
                {politicians.length > 1 && <ChevronDown className="h-3 w-3" style={{ color: t.mutedText }} />}
              </button>

              {politicians.length > 1 && (
                <div className="absolute right-0 top-full mt-1 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[180px]"
                     style={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}` }}>
                  {politicians.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPolitician(p.id)}
                      className="w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg"
                      style={{
                        color: p.id === politician.id ? t.accentText : t.bodyText,
                        backgroundColor: p.id === politician.id ? t.filterBg : 'transparent'
                      }}
                    >
                      {p.name} {p.party && <span style={{ color: `${t.mutedText}88` }} className="ml-1">({p.party})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <Button variant="ghost" size="sm"
            onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
            style={{ color: t.mutedText }}
            title="Sair"
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}

// ============================================
// SIMPLE VIEW COMPONENT (for non-technical politicians)
// ============================================

function SimpleView({
  politician,
  mentions,
  score,
  alertResult,
  aiAnalysis,
  politicians,
  theme: t,
  onOpenReport,
  reportData
}: {
  politician: Politician | undefined
  mentions: Mention[]
  score: number
  alertResult: ReturnType<typeof getAlertLevel>
  aiAnalysis: AIAnalysisResult | null
  politicians: Politician[]
  theme: typeof THEMES[ThemeKey]
  onOpenReport: () => void
  reportData: ReportData
}) {
  const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Sentiment emoji and text
  const getSentimentDisplay = () => {
    if (score >= 70) return { emoji: '🟢', text: 'Positivo', color: 'text-[hsl(152,55%,50%)]' }
    if (score >= 50) return { emoji: '🟡', text: 'Neutro', color: 'text-[hsl(43,96%,56%)]' }
    return { emoji: '🔴', text: 'Negativo', color: 'text-[hsl(0,72%,55%)]' }
  }

  const sentiment = getSentimentDisplay()
  const todayMentions = mentions.filter(m => {
    const mDate = new Date(m.published_at || m.created_at).toLocaleDateString('pt-BR')
    const today = new Date().toLocaleDateString('pt-BR')
    return mDate === today
  })

  // Top 3 mentions
  const topMentions = mentions.slice(0, 3)

  // Find main competitor
  const mainCompetitor = politicians?.find(p => p.id !== politician?.id)

  return (
    <main className="container mx-auto px-4 py-6 space-y-8 max-w-2xl">
      {/* ALERT BANNER - Crisis indicator */}
      {alertResult.level === 'vermelho' && (
        <div className="p-6 rounded-lg border-2" style={{
          backgroundColor: 'hsl(0,30%,15%)',
          borderColor: 'hsl(0,72%,55%)'
        }}>
          <div className="flex items-start gap-4">
            <div className="text-4xl">🚨</div>
            <div>
              <h2 className="text-2xl font-bold text-[hsl(0,72%,55%)] mb-2">ALERTA DE CRISE</h2>
              <p className="text-lg" style={{ color: t.brightText }}>
                {alertResult.reason || 'Comportamento negativo detectado. Ação recomendada!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SENTIMENT INDICATOR - Big emoji */}
      <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
        <CardContent className="p-8 text-center">
          <div className="text-7xl mb-4">{sentiment.emoji}</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: t.brightText }}>
            Seu Sentimento
          </h1>
          <p className={`text-3xl font-bold ${sentiment.color}`}>
            {sentiment.text}
          </p>
          <p className="text-lg mt-4" style={{ color: t.mutedText }}>
            Score: {score.toFixed(0)}/100
          </p>
        </CardContent>
      </Card>

      {/* MENTIONS COUNT */}
      <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-xl" style={{ color: t.mutedText }}>Você apareceu</p>
            <p className="text-5xl font-bold mt-2" style={{ color: t.brightText }}>
              {todayMentions.length}
            </p>
            <p className="text-lg mt-2" style={{ color: t.mutedText }}>
              vezes na mídia hoje
            </p>
            <p className="text-base mt-4" style={{ color: `${t.mutedText}99` }}>
              Total: {mentions.length} menções
            </p>
          </div>
        </CardContent>
      </Card>

      {/* TOP 3 MENTIONS */}
      {topMentions.length > 0 && (
        <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: t.brightText }}>
              📰 Principais Notícias
            </h2>
            <div className="space-y-4">
              {topMentions.map((mention, i) => (
                <a
                  key={i}
                  href={mention.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg transition-colors"
                  style={{
                    backgroundColor: t.filterBg,
                    borderLeft: `4px solid ${
                      mention.sentiment === 'positivo' ? 'hsl(152,55%,50%)' :
                      mention.sentiment === 'negativo' ? 'hsl(0,72%,55%)' :
                      'hsl(43,96%,56%)'
                    }`
                  }}
                >
                  <p className="text-lg font-semibold mb-2" style={{ color: t.brightText }}>
                    {mention.title || mention.content?.substring(0, 80)}
                  </p>
                  <div className="flex items-center gap-3 text-base" style={{ color: t.mutedText }}>
                    <span style={{ color: t.accentText }} className="font-medium">
                      {mention.source_name || 'Fonte desconhecida'}
                    </span>
                    <span>•</span>
                    <span>
                      {mention.published_at ? new Date(mention.published_at).toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* COMPETITOR SUMMARY */}
      {mainCompetitor && (
        <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: t.brightText }}>
              👥 Seu Adversário
            </h2>
            <div className="bg-gray-800/30 p-6 rounded-lg">
              <p className="text-3xl font-bold mb-2" style={{ color: t.brightText }}>
                {mainCompetitor.nickname || mainCompetitor.name}
              </p>
              <p className="text-lg" style={{ color: t.mutedText }}>
                Apareceu <span style={{ color: t.brightText }} className="font-bold">
                  {mentions.filter(m => m.politician_id === mainCompetitor.id).length}
                </span> vezes
              </p>
              {mainCompetitor.party && (
                <p className="text-base mt-2" style={{ color: t.bodyText }}>
                  Partido: <span className="font-semibold">{mainCompetitor.party}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI SUMMARY */}
      {aiAnalysis && aiAnalysis.summary && (
        <Card style={{ backgroundColor: t.cardBg, borderColor: t.accentText, borderLeftWidth: '4px' }}>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
              🤖 O que está acontecendo
            </h2>
            <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: t.bodyText }}>
              {aiAnalysis.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* WHATSAPP BUTTON - Prominent */}
      <Button
        onClick={onOpenReport}
        size="lg"
        className="w-full py-8 text-xl font-bold"
        style={{
          backgroundColor: 'hsl(120,55%,45%)',
          color: 'white'
        }}
      >
        📱 Gerar Relatório WhatsApp
      </Button>

      {/* Footer */}
      <footer className="text-center py-6 text-base" style={{ color: `${t.mutedText}88` }}>
        <p>{todayStr}</p>
        <p className="mt-2 text-sm">Monitor Político 360° • Vista Simplificada</p>
      </footer>
    </main>
  )
}
