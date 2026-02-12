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
import {
  BarChart3, Loader2, RefreshCw, Plus, FileDown, ChevronDown,
  Brain, FileText, Lightbulb, CheckCircle2, Sparkles, AlertTriangle, TrendingUp as TrendingUpIcon
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
    }
    history.push({ data: dayStr, score, mencoes: total })
  }
  return history
}

// Network config
const NETWORKS = [
  { key: 'midia', label: 'Mídia', icon: '📰' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
  { key: 'twitter', label: 'X/Twitter', icon: '🐦' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'telegram', label: 'Telegram', icon: '💬' },
]

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

  const score = scoreResult.score
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
    twitter: { mencoes: 0, sentimento_positivo: 0, sentimento_negativo: 0, sentimento_neutro: 0, score: 0, status: 'Sem dados disponíveis' },
    instagram: { mencoes: 0, sentimento_positivo: 0, sentimento_negativo: 0, sentimento_neutro: 0, score: 0, status: 'Sem dados disponíveis' },
    tiktok: { mencoes: 0, sentimento_positivo: 0, sentimento_negativo: 0, sentimento_neutro: 0, score: 0, status: 'Sem dados disponíveis' },
    telegram: { mencoes: 0, sentimento_positivo: 0, sentimento_negativo: 0, sentimento_neutro: 0, score: 0, status: 'Sem dados disponíveis' },
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

  // Insights data
  const insightsData = aiAnalysis
    ? { sumario: aiAnalysis.summary, recomendacoes: aiAnalysis.recommendations }
    : mentions.length > 0
      ? generateInsights(score, stats?.total || 0, stats?.positive || 0, stats?.negative || 0, networkData)
      : null

  const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // ============================================
  // LOADING / EMPTY STATES
  // ============================================

  if (checkingAuth || loadingPoliticians) {
    return (
      <div className="min-h-screen bg-[hsl(215,25%,9%)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(210,40%,60%)]" />
      </div>
    )
  }

  if (!politicians || politicians.length === 0) {
    return (
      <div className="min-h-screen bg-[hsl(215,25%,9%)] text-[hsl(210,40%,98%)]">
        <DashHeader
          politician={null}
          politicians={[]}
          onSelectPolitician={() => {}}
          onRefresh={() => {}}
          onAddPolitician={() => navigate('/add-politician')}
          onOpenReport={() => {}}
          isRefreshing={false}
        />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto text-center bg-[hsl(215,25%,12%)] border-[hsl(215,25%,20%)]">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-[hsl(210,40%,20%)] rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-[hsl(210,40%,60%)]" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-[hsl(210,40%,98%)]">Nenhum político cadastrado</h2>
              <p className="text-[hsl(215,15%,65%)] mb-6">Cadastre um político para começar o monitoramento</p>
              <Button onClick={() => navigate('/add-politician')} size="lg" className="bg-[hsl(210,40%,50%)] hover:bg-[hsl(210,40%,40%)] text-white">
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

  return (
    <div className="min-h-screen bg-[hsl(215,25%,9%)] text-[hsl(210,40%,98%)]">
      {/* Header */}
      <DashHeader
        politician={currentPolitician || null}
        politicians={politicians}
        onSelectPolitician={setSelectedPolitician}
        onRefresh={handleRunMonitoring}
        onAddPolitician={() => navigate('/add-politician')}
        onOpenReport={() => setShowReportModal(true)}
        isRefreshing={isMonitoring || loadingSocial}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* ============================================ */}
        {/* SCORE + EVOLUTION CHART (side by side) */}
        {/* ============================================ */}
        <Card className="bg-[hsl(215,25%,12%)] border-[hsl(215,25%,20%)]">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Score grande */}
              <div className="flex flex-col items-center justify-center lg:w-48 shrink-0">
                <div className={`text-6xl font-bold tracking-tight ${getScoreColor(score)}`}>
                  {score10}
                </div>
                <p className="text-xs uppercase tracking-widest text-[hsl(215,15%,50%)] mt-2 font-medium">
                  Score Geral
                </p>
                <p className={`text-sm mt-1 ${trend > 0 ? 'text-[hsl(152,55%,50%)]' : trend < 0 ? 'text-[hsl(0,72%,55%)]' : 'text-[hsl(215,15%,50%)]'}`}>
                  {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)} vs anterior
                </p>
              </div>

              {/* Chart */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2 text-[hsl(210,40%,85%)]">
                      📊 Evolução do Score
                    </h3>
                    <p className="text-xs text-[hsl(215,15%,50%)]">Exibindo dados de: {todayStr}</p>
                  </div>
                  <div className="flex gap-1 bg-[hsl(215,25%,15%)] rounded-lg p-1">
                    {[{ v: 7, l: '7 dias' }, { v: 30, l: '30 dias' }, { v: 90, l: '90 dias' }].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setChartPeriod(opt.v)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${
                          chartPeriod === opt.v
                            ? 'bg-[hsl(215,25%,25%)] text-[hsl(210,40%,98%)]'
                            : 'text-[hsl(215,15%,50%)] hover:text-[hsl(210,40%,85%)]'
                        }`}
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
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,25%,20%)" />
                      <XAxis dataKey="data" tick={{ fontSize: 11, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(215,25%,15%)', border: '1px solid hsl(215,25%,25%)', borderRadius: '8px', color: 'hsl(210,40%,90%)' }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'hsl(210,40%,90%)' }}
                        formatter={(value: number) => [`Score: ${value}`, '']}
                      />
                      <ReferenceLine y={50} stroke="hsl(215,25%,25%)" strokeDasharray="5 5" />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={getChartColor()}
                        strokeWidth={2}
                        fill="url(#dashScoreGrad)"
                        dot={{ r: 2, fill: getChartColor(), stroke: getChartColor() }}
                        activeDot={{ r: 5, fill: getChartColor(), stroke: 'hsl(215,25%,12%)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============================================ */}
        {/* PERFORMANCE POR REDE */}
        {/* ============================================ */}
        <div>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[hsl(210,40%,85%)]">
            📊 Performance por Rede
            <span className="text-[hsl(215,15%,50%)] font-normal">— {todayStr}</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {NETWORKS.map(net => {
              const data = networkData[net.key]
              const hasMentions = data && data.mencoes > 0
              return (
                <Card key={net.key} className="bg-[hsl(215,25%,12%)] border-[hsl(215,25%,20%)] hover:border-[hsl(215,25%,30%)] transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{net.icon}</span>
                        <span className="font-medium text-sm text-[hsl(210,40%,90%)]">{net.label}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-[hsl(215,15%,40%)]" />
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${hasMentions ? 'text-[hsl(152,55%,50%)]' : 'text-[hsl(215,15%,40%)]'}`}>
                      {data?.mencoes || 0}
                    </div>
                    <p className="text-xs text-[hsl(215,15%,50%)]">menções</p>
                    {data?.status && (
                      <p className="text-xs text-[hsl(215,15%,40%)] mt-2">{data.status}</p>
                    )}
                    {hasMentions && (
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-[hsl(152,55%,50%)]">+{data.sentimento_positivo}</span>
                        <span className="text-[hsl(0,72%,55%)]">-{data.sentimento_negativo}</span>
                        <span className="text-[hsl(215,15%,50%)]">~{data.sentimento_neutro}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* ============================================ */}
        {/* ANÁLISE & RECOMENDAÇÕES */}
        {/* ============================================ */}
        <div>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[hsl(210,40%,85%)]">
            🧠 Análise & Recomendações
          </h2>

          {loadingAI ? (
            <Card className="bg-[hsl(215,25%,12%)] border-[hsl(215,25%,20%)]">
              <CardContent className="py-12 text-center">
                <Brain className="h-10 w-10 mx-auto text-[hsl(210,40%,50%)] mb-3 animate-pulse" />
                <p className="text-sm text-[hsl(215,15%,50%)]">Analisando com IA...</p>
              </CardContent>
            </Card>
          ) : insightsData ? (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Sumário do Dia */}
              <Card className="bg-[hsl(215,25%,12%)] border-[hsl(215,25%,20%)]">
                <CardContent className="p-5">
                  <h3 className="font-medium text-sm flex items-center gap-2 mb-3 text-[hsl(210,40%,90%)]">
                    <FileText className="h-4 w-4 text-[hsl(210,40%,60%)]" />
                    Sumário do Dia
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,65%)] leading-relaxed">
                    {insightsData.sumario}
                  </p>
                </CardContent>
              </Card>

              {/* Recomendações */}
              <Card className="bg-[hsl(215,25%,12%)] border-[hsl(215,25%,20%)]">
                <CardContent className="p-5">
                  <h3 className="font-medium text-sm flex items-center gap-2 mb-3 text-[hsl(210,40%,90%)]">
                    <Lightbulb className="h-4 w-4 text-[hsl(43,96%,56%)]" />
                    Recomendações
                  </h3>
                  <ul className="space-y-2">
                    {insightsData.recomendacoes.slice(0, 4).map((rec, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[hsl(215,15%,65%)]">
                        <span className="text-[hsl(210,40%,50%)] mt-0.5">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-[hsl(215,25%,12%)] border-[hsl(215,25%,20%)]">
              <CardContent className="py-10 text-center">
                <Brain className="h-10 w-10 mx-auto text-[hsl(215,15%,30%)] mb-3 opacity-50" />
                <p className="text-sm text-[hsl(215,15%,50%)]">Clique em "Atualizar" para gerar a análise</p>
              </CardContent>
            </Card>
          )}

          {/* Riscos e Oportunidades (if AI generated) */}
          {aiAnalysis && ((aiAnalysis.risks && aiAnalysis.risks.length > 0) || (aiAnalysis.opportunities && aiAnalysis.opportunities.length > 0)) && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {aiAnalysis.risks && aiAnalysis.risks.length > 0 && (
                <Card className="bg-[hsl(215,25%,12%)] border-[hsl(0,30%,25%)]">
                  <CardContent className="p-5">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-3 text-[hsl(210,40%,90%)]">
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
                            <span className="text-sm text-[hsl(215,15%,65%)]">{risk.description}</span>
                          </div>
                          {risk.action && <p className="text-xs text-[hsl(215,15%,45%)] ml-14 italic">{risk.action}</p>}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {aiAnalysis.opportunities && aiAnalysis.opportunities.length > 0 && (
                <Card className="bg-[hsl(215,25%,12%)] border-[hsl(152,30%,20%)]">
                  <CardContent className="p-5">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-3 text-[hsl(210,40%,90%)]">
                      <TrendingUpIcon className="h-4 w-4 text-[hsl(152,55%,50%)]" />
                      Oportunidades
                    </h3>
                    <ul className="space-y-2">
                      {aiAnalysis.opportunities.slice(0, 4).map((opp, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[hsl(215,15%,65%)]">
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

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-[hsl(215,15%,40%)]">
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
  isRefreshing
}: {
  politician: Politician | null
  politicians: Politician[]
  onSelectPolitician: (id: number) => void
  onRefresh: () => void
  onAddPolitician: () => void
  onOpenReport: () => void
  isRefreshing: boolean
}) {
  const navigate = useNavigate()

  return (
    <header className="border-b border-[hsl(215,25%,18%)] bg-[hsl(215,25%,11%)] sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏛️</span>
          <div>
            <h1 className="font-bold text-base text-[hsl(210,40%,98%)]">Monitor Político 360°</h1>
            <p className="text-xs text-[hsl(215,15%,50%)]">Análise diária de reputação e presença digital</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-[hsl(215,15%,65%)] hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(215,25%,18%)]"
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenReport}
              className="text-[hsl(215,15%,65%)] hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(215,25%,18%)]"
            >
              <FileDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddPolitician}
              className="text-[hsl(215,15%,65%)] hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(215,25%,18%)]"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Politician selector */}
          {politician && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(215,25%,18%)] hover:bg-[hsl(215,25%,22%)] transition-colors">
                <span className="text-sm text-[hsl(210,40%,90%)]">{politician.nickname || politician.name.split(' ')[0]}</span>
                {politician.party && (
                  <Badge className="bg-[hsl(215,25%,25%)] text-[hsl(210,40%,80%)] border-[hsl(215,25%,30%)] text-[10px]">
                    {politician.party}
                  </Badge>
                )}
                {politicians.length > 1 && <ChevronDown className="h-3 w-3 text-[hsl(215,15%,50%)]" />}
              </button>

              {politicians.length > 1 && (
                <div className="absolute right-0 top-full mt-1 bg-[hsl(215,25%,15%)] border border-[hsl(215,25%,25%)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[180px]">
                  {politicians.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPolitician(p.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[hsl(215,25%,20%)] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        p.id === politician.id ? 'text-[hsl(210,40%,70%)] bg-[hsl(215,25%,18%)]' : 'text-[hsl(215,15%,65%)]'
                      }`}
                    >
                      {p.name} {p.party && <span className="text-[hsl(215,15%,40%)] ml-1">({p.party})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
            className="text-[hsl(215,15%,50%)] hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(215,25%,18%)]"
            title="Sair"
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}
