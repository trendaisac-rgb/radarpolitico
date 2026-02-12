/**
 * RadarPolítico - Dashboard Redesenhado
 * Layout limpo com hierarquia visual clara
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3, Home, LogOut, Bell, Newspaper, Loader2,
  Zap, Plus
} from 'lucide-react'
import { supabase, type Politician, type Mention } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// Dashboard Components
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { ScoreChart } from '@/components/dashboard/ScoreChart'
import { NetworkCard, type SocialPost } from '@/components/dashboard/NetworkCard'
import { MentionList } from '@/components/dashboard/MentionList'
import { DailyReport } from '@/components/dashboard/DailyReport'
import { InsightsSection, generateInsights } from '@/components/dashboard/InsightsSection'

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

// Network icons (V1: Mídia + YouTube only)
const networkIcons: Record<string, string> = {
  midia: '📰',
  youtube: '▶️'
}

// Convert DB mentions to SocialPost format
function mentionsToSocialPosts(mentions: Mention[], source: string): SocialPost[] {
  return mentions
    .filter(m => {
      if (source === 'midia') return !m.source_name?.toLowerCase().includes('youtube')
      if (source === 'youtube') return m.source_name?.toLowerCase().includes('youtube')
      return false
    })
    .slice(0, 5)
    .map(m => ({
      id: String(m.id),
      platform: source,
      author: m.source_name || 'Fonte desconhecida',
      content: m.title || m.summary || '',
      url: m.url || '#',
      publishedAt: m.published_at || m.created_at,
      sentiment: m.sentiment as any,
      views: m.relevance_score ? Math.round(m.relevance_score * 10000) : undefined
    }))
}

function socialResultToPosts(result: SocialSearchResult | undefined): SocialPost[] {
  if (!result || !result.posts) return []
  return result.posts.slice(0, 5).map(p => ({
    id: p.id,
    platform: p.platform,
    author: p.author,
    authorHandle: p.authorHandle,
    content: p.content,
    url: p.url,
    publishedAt: p.publishedAt,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    views: p.views,
    sentiment: p.sentiment,
    thumbnail: p.thumbnail
  }))
}

// Generate score history for chart
function generateScoreHistory(mentions: Mention[], days: number = 7) {
  const history: { data: string; score: number; mencoes?: number }[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

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

export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedPolitician, setSelectedPolitician] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [socialResults, setSocialResults] = useState<Record<string, SocialSearchResult>>({})
  const [loadingSocial, setLoadingSocial] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<number>(7)
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisResult | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logout realizado')
    navigate('/login')
  }

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

  // Fetch social networks when politician changes
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

  // Auto-run AI when data loads
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
  const scoreHistory = generateScoreHistory(mentions, chartPeriod)

  const alertResult = getAlertLevel(score, scoreResult.breakdown.negativeMentions, scoreResult.breakdown.totalMentions)

  // Network data (V1: Mídia + YouTube)
  const networkData = {
    midia: {
      mencoes: mentions.filter(m => !m.source_name?.toLowerCase().includes('youtube')).length,
      sentimento_positivo: mentions.filter(m => m.sentiment === 'positivo' && !m.source_name?.toLowerCase().includes('youtube')).length,
      sentimento_negativo: mentions.filter(m => m.sentiment === 'negativo' && !m.source_name?.toLowerCase().includes('youtube')).length,
      sentimento_neutro: mentions.filter(m => m.sentiment === 'neutro' && !m.source_name?.toLowerCase().includes('youtube')).length,
      score: 50,
      posts: mentionsToSocialPosts(mentions, 'midia')
    },
    youtube: {
      mencoes: (socialResults.youtube?.totalResults || 0) + mentions.filter(m => m.source_name?.toLowerCase().includes('youtube')).length,
      sentimento_positivo: socialResults.youtube?.posts?.filter(p => p.sentiment === 'positivo').length || 0,
      sentimento_negativo: socialResults.youtube?.posts?.filter(p => p.sentiment === 'negativo').length || 0,
      sentimento_neutro: socialResults.youtube?.posts?.filter(p => p.sentiment === 'neutro').length || 0,
      score: 50,
      engajamento: socialResults.youtube?.posts?.reduce((s, p) => s + (p.views || 0), 0) || 0,
      posts: socialResultToPosts(socialResults.youtube),
      source: socialResults.youtube?.source || 'YouTube API'
    }
  }

  // Calculate per-network scores
  Object.keys(networkData).forEach(key => {
    const data = networkData[key as keyof typeof networkData]
    const total = data.sentimento_positivo + data.sentimento_negativo + data.sentimento_neutro
    if (total > 0) {
      data.score = Math.round(50 + ((data.sentimento_positivo - data.sentimento_negativo) / total) * 50)
      data.score = Math.max(0, Math.min(100, data.score))
    }
  })

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
    networkMetrics: Object.entries(networkData).map(([key, data]) => ({
      network: key.charAt(0).toUpperCase() + key.slice(1),
      mentions: data.mencoes,
      positive: data.sentimento_positivo,
      negative: data.sentimento_negativo,
      score: data.score
    })),
    aiRecommendation: aiAnalysis?.recommendations?.join('. ') || 'Continue monitorando diariamente.'
  }

  // Loading
  if (checkingAuth || loadingPoliticians) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // No politicians
  if (!politicians || politicians.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={user} onLogout={handleLogout} onHome={() => navigate('/')} />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Nenhum político cadastrado</h2>
              <p className="text-muted-foreground mb-6">Cadastre um político para começar o monitoramento</p>
              <Button onClick={() => navigate('/add-politician')} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Político
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} onLogout={handleLogout} onHome={() => navigate('/')} />

      <main className="container mx-auto px-4 py-6">
        {/* Toolbar */}
        <DashboardToolbar
          politicians={politicians}
          selectedId={selectedPolitician}
          onSelectPolitician={setSelectedPolitician}
          onRefresh={handleRunMonitoring}
          onAddPolitician={() => navigate('/add-politician')}
          onOpenReport={() => setShowReportModal(true)}
          isRefreshing={isMonitoring || loadingSocial}
          hasMentions={mentions.length > 0}
        />

        {/* Alert Banner */}
        <AlertBanner nivel={alertResult.level} motivo={alertResult.reason} className="mb-6" />

        {/* Score + Stats */}
        <StatsRow
          score={score}
          scoreResult={scoreResult}
          totalMentions={stats?.total || 0}
          positiveMentions={stats?.positive || 0}
          negativeMentions={stats?.negative || 0}
          positivePercent={stats?.positivePercentage || 0}
          negativePercent={stats?.negativePercentage || 0}
        />

        {/* Evolution Chart (full width) */}
        <div className="mb-6">
          <ScoreChart
            data={scoreHistory}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
          />
        </div>

        {/* AI Insights (Relatório Executivo) */}
        <div className="mb-6">
          <InsightsSection
            sumario={aiAnalysis?.summary || (mentions.length > 0 ? generateInsights(score, stats?.total || 0, stats?.positive || 0, stats?.negative || 0, networkData).sumario : undefined)}
            recomendacoes={aiAnalysis?.recommendations || (mentions.length > 0 ? generateInsights(score, stats?.total || 0, stats?.positive || 0, stats?.negative || 0, networkData).recomendacoes : undefined)}
            risks={aiAnalysis?.risks}
            opportunities={aiAnalysis?.opportunities}
            isLoading={loadingAI}
            isAIGenerated={!!aiAnalysis}
          />
        </div>

        {/* Network Cards (side by side) */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Monitoramento por Rede
          </h2>
          {loadingSocial ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-32 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <NetworkCard rede="midia" data={networkData.midia} icon={networkIcons.midia} />
              <NetworkCard rede="youtube" data={networkData.youtube} icon={networkIcons.youtube} />
            </div>
          )}
        </div>

        {/* Mentions List (compact) */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Últimas Menções
          </h2>
          <MentionList
            mentions={mentions}
            isLoading={loadingMentions}
            isMonitoring={isMonitoring}
            onRunMonitoring={handleRunMonitoring}
          />
        </div>
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

// Header Component
function DashboardHeader({ user, onLogout, onHome }: { user: any; onLogout: () => void; onHome: () => void }) {
  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Radar Político</h1>
            <p className="text-xs text-muted-foreground">Monitoramento 360°</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user && <span className="text-xs text-muted-foreground hidden sm:block">{user.email}</span>}
          <Button variant="ghost" size="icon" onClick={onHome}><Home className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon"><Bell className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onLogout} title="Sair"><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>
  )
}
