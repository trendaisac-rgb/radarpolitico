/**
 * RadarPolítico - Dashboard Profissional
 * Painel de monitoramento 360° com todas as redes sociais
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3, RefreshCw, Plus, Home, LogOut, Bell,
  Newspaper, TrendingUp, TrendingDown, Minus, Loader2,
  AlertTriangle, CheckCircle2, Info, ExternalLink,
  Clock, Zap, Play, Sparkles, FileDown
} from 'lucide-react'
import { supabase, type Politician, type Mention } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// Componentes do Dashboard
import { ScoreGauge } from '@/components/dashboard/ScoreGauge'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { NetworkCard, type SocialPost } from '@/components/dashboard/NetworkCard'
import { ScoreChart } from '@/components/dashboard/ScoreChart'
import { InsightsSection } from '@/components/dashboard/InsightsSection'

// Hooks e Services
import { usePoliticians } from '@/hooks/usePoliticians'
import { useMentions, useMentionStats } from '@/hooks/useMentions'
import { useMonitoring } from '@/hooks/useMonitoring'
import { searchAllNetworks, type SocialSearchResult } from '@/services/socialMedia'
import { analyzeWithAI, type AIAnalysisResult, isAIConfigured } from '@/services/aiAnalysis'
import { printReport, shareViaWhatsApp, type ReportData } from '@/services/reportExport'
import { DailyReport } from '@/components/dashboard/DailyReport'

// Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

// Ícones das redes
const networkIcons: Record<string, string> = {
  midia: '📰',
  youtube: '▶️',
  twitter: '🐦',
  instagram: '📸',
  tiktok: '🎵',
  telegram: '✈️',
  facebook: '👤'
}

// Converte menções do banco em formato de posts
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

// Converte resultados de redes sociais em formato de posts
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

// Gera histórico de scores para o gráfico
function generateScoreHistory(mentions: Mention[], days: number = 7) {
  const history: { data: string; score: number; mencoes?: number }[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

    // Filtra menções do dia
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

    history.push({
      data: dayStr,
      score,
      mencoes: total
    })
  }

  return history
}

// Gera insights baseado nos dados
function generateAIInsights(
  mentions: Mention[],
  socialResults: Record<string, SocialSearchResult>,
  score: number
): { summary: string; recommendations: string[] } {
  const total = mentions.length
  const positive = mentions.filter(m => m.sentiment === 'positivo').length
  const negative = mentions.filter(m => m.sentiment === 'negativo').length

  // Conta menções por rede
  const ytCount = socialResults.youtube?.totalResults || 0
  const twCount = socialResults.twitter?.totalResults || 0
  const igCount = socialResults.instagram?.totalResults || 0
  const tkCount = socialResults.tiktok?.totalResults || 0

  let summary = ''
  const recommendations: string[] = []

  if (score >= 70) {
    summary = `Excelente! Sua imagem está muito positiva com score ${score}. ${total} menções foram analisadas, sendo ${positive} positivas.`
    recommendations.push('Continue monitorando para manter esse padrão positivo')
    recommendations.push('Aproveite o momento favorável para amplificar conquistas')
  } else if (score >= 50) {
    summary = `Situação estável com score ${score}. Das ${total} menções, ${positive} foram positivas e ${negative} negativas.`
    recommendations.push('Foque em aumentar menções positivas com ações proativas')
    recommendations.push('Monitore de perto os temas que geram sentimento negativo')
  } else if (score >= 30) {
    summary = `Atenção: score ${score} indica predominância de menções negativas. ${negative} de ${total} menções são negativas.`
    recommendations.push('Identifique os principais temas negativos e elabore respostas')
    recommendations.push('Considere ações de comunicação para reverter o cenário')
  } else {
    summary = `Alerta crítico! Score ${score} indica crise de imagem. ${negative} menções negativas detectadas.`
    recommendations.push('Ação imediata necessária: avalie os principais focos de crise')
    recommendations.push('Considere pronunciamento oficial sobre os temas mais sensíveis')
  }

  // Adiciona insights sobre redes sociais
  if (ytCount > 5) {
    recommendations.push(`YouTube ativo: ${ytCount} vídeos mencionando você`)
  }
  if (twCount > 10) {
    recommendations.push(`Alto volume no Twitter/X: ${twCount} publicações`)
  }

  return { summary, recommendations }
}

export default function DashboardPro() {
  const navigate = useNavigate()
  const [selectedPolitician, setSelectedPolitician] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [socialResults, setSocialResults] = useState<Record<string, SocialSearchResult>>({})
  const [loadingSocial, setLoadingSocial] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<number>(7)

  // IA Analysis
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisResult | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  // Auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }
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

  // Logout
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
  const { isMonitoring, runMonitoring, lastResult } = useMonitoring()

  // Seleciona primeiro político
  useEffect(() => {
    if (!selectedPolitician && politicians && politicians.length > 0) {
      setSelectedPolitician(politicians[0].id)
    }
  }, [politicians, selectedPolitician])

  const currentPolitician = politicians?.find(p => p.id === selectedPolitician)

  // Busca redes sociais quando político muda
  useEffect(() => {
    if (currentPolitician) {
      fetchSocialNetworks(currentPolitician)
      // Reseta análise de IA quando muda de político
      setAIAnalysis(null)
    }
  }, [currentPolitician?.id])

  const fetchSocialNetworks = async (politician: Politician) => {
    setLoadingSocial(true)
    try {
      const query = politician.nickname || politician.name
      const results = await searchAllNetworks(query)
      setSocialResults(results)
    } catch (error) {
      console.error('Erro ao buscar redes sociais:', error)
    } finally {
      setLoadingSocial(false)
    }
  }

  // Executa análise de IA quando tiver dados
  const runAIAnalysis = async () => {
    if (!currentPolitician || mentions.length === 0) return
    if (!isAIConfigured()) {
      console.log('OpenAI não configurada, usando análise local')
      return
    }

    setLoadingAI(true)
    try {
      // Função helper para criar dados de rede
      const createNetworkData = (name: string, results: typeof socialResults.youtube) => ({
        network: name,
        mentions: results?.totalResults || 0,
        positive: results?.posts?.filter(p => p.sentiment === 'positivo').length || 0,
        negative: results?.posts?.filter(p => p.sentiment === 'negativo').length || 0,
        neutral: results?.posts?.filter(p => p.sentiment === 'neutro').length || 0,
        topPosts: results?.posts?.slice(0, 5).map(p => ({
          content: p.content || '',
          author: p.author || 'Desconhecido',
          engagement: (p.likes || 0) + (p.comments || 0) + (p.views || 0),
          url: p.url || ''
        })) || []
      })

      // Prepara dados para a IA no formato correto
      const reportData = {
        politicianName: currentPolitician.name,
        party: currentPolitician.party,
        position: currentPolitician.position,
        date: new Date().toLocaleDateString('pt-BR'),
        mentions: mentions.map(m => ({
          title: m.title || '',
          content: m.content || m.summary || '',
          source: m.source_name || 'Desconhecido',
          url: m.url || '',
          platform: m.source_name?.toLowerCase().includes('youtube') ? 'youtube' : 'midia',
          publishedAt: m.published_at || m.created_at
        })),
        networks: [
          createNetworkData('YouTube', socialResults.youtube),
          createNetworkData('Twitter/X', socialResults.twitter),
          createNetworkData('Instagram', socialResults.instagram),
          createNetworkData('TikTok', socialResults.tiktok)
        ].filter(n => n.mentions > 0 || n.topPosts.length > 0)
      }

      const result = await analyzeWithAI(reportData)
      setAIAnalysis(result)
      toast.success('Análise de IA concluída!')
    } catch (error) {
      console.error('Erro na análise de IA:', error)
      toast.error('Erro na análise de IA')
    } finally {
      setLoadingAI(false)
    }
  }

  // Executa análise quando dados carregarem
  useEffect(() => {
    if (mentions.length > 0 && !loadingMentions && !loadingSocial && isAIConfigured()) {
      // Delay para não executar muitas vezes
      const timer = setTimeout(() => {
        if (!aiAnalysis && !loadingAI) {
          runAIAnalysis()
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [mentions.length, loadingMentions, loadingSocial])

  // Monitoramento
  const handleRunMonitoring = async () => {
    if (!currentPolitician) {
      toast.error('Selecione um político primeiro')
      return
    }

    toast.info(`Buscando notícias e redes sociais...`)

    try {
      const result = await runMonitoring(currentPolitician)

      // Busca redes sociais também
      await fetchSocialNetworks(currentPolitician)

      if (result.newMentions > 0) {
        toast.success(`${result.newMentions} novas menções encontradas!`)
      } else {
        toast.info('Nenhuma nova menção encontrada')
      }

      refetchMentions()
      refetchStats()
    } catch (error) {
      toast.error('Erro ao buscar dados')
    }
  }

  // Cálculos
  const score = stats?.total
    ? Math.round(50 + ((stats.positive - stats.negative) / stats.total) * 50)
    : 50

  const periodDays = {
    '7D': 7, '15D': 15, '30D': 30, '90D': 90
  }
  const scoreHistory = generateScoreHistory(mentions, periodDays[chartPeriod])

  const alertLevel = score >= 70 ? 'verde' : score >= 40 ? 'amarelo' : 'vermelho'
  const alertMessage = score >= 70
    ? 'Imagem positiva - Continue monitorando'
    : score >= 40
      ? 'Atenção redobrada recomendada'
      : 'Situação crítica - Ação necessária'

  // Usa insights da IA quando disponível, senão usa análise local
  const insights = aiAnalysis
    ? {
        summary: aiAnalysis.summary,
        recommendations: aiAnalysis.recommendations,
        alertLevel: aiAnalysis.alertLevel,
        alertReason: aiAnalysis.alertReason,
        risks: aiAnalysis.risks,
        opportunities: aiAnalysis.opportunities
      }
    : generateAIInsights(mentions, socialResults, score)

  // Prepara dados das redes
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
      posts: socialResultToPosts(socialResults.youtube)
    },
    twitter: {
      mencoes: socialResults.twitter?.totalResults || 0,
      sentimento_positivo: socialResults.twitter?.posts?.filter(p => p.sentiment === 'positivo').length || 0,
      sentimento_negativo: socialResults.twitter?.posts?.filter(p => p.sentiment === 'negativo').length || 0,
      sentimento_neutro: socialResults.twitter?.posts?.filter(p => p.sentiment === 'neutro').length || 0,
      score: 50,
      engajamento: socialResults.twitter?.posts?.reduce((s, p) => s + (p.likes || 0) + (p.comments || 0), 0) || 0,
      posts: socialResultToPosts(socialResults.twitter)
    },
    instagram: {
      mencoes: socialResults.instagram?.totalResults || 0,
      sentimento_positivo: socialResults.instagram?.posts?.filter(p => p.sentiment === 'positivo').length || 0,
      sentimento_negativo: socialResults.instagram?.posts?.filter(p => p.sentiment === 'negativo').length || 0,
      sentimento_neutro: socialResults.instagram?.posts?.filter(p => p.sentiment === 'neutro').length || 0,
      score: 50,
      engajamento: socialResults.instagram?.posts?.reduce((s, p) => s + (p.likes || 0) + (p.comments || 0), 0) || 0,
      posts: socialResultToPosts(socialResults.instagram)
    },
    tiktok: {
      mencoes: socialResults.tiktok?.totalResults || 0,
      sentimento_positivo: socialResults.tiktok?.posts?.filter(p => p.sentiment === 'positivo').length || 0,
      sentimento_negativo: socialResults.tiktok?.posts?.filter(p => p.sentiment === 'negativo').length || 0,
      sentimento_neutro: socialResults.tiktok?.posts?.filter(p => p.sentiment === 'neutro').length || 0,
      score: 50,
      engajamento: socialResults.tiktok?.posts?.reduce((s, p) => s + (p.views || 0), 0) || 0,
      posts: socialResultToPosts(socialResults.tiktok)
    }
  }

  // Calcula scores por rede
  Object.keys(networkData).forEach(key => {
    const data = networkData[key as keyof typeof networkData]
    const total = data.sentimento_positivo + data.sentimento_negativo + data.sentimento_neutro
    if (total > 0) {
      data.score = Math.round(50 + ((data.sentimento_positivo - data.sentimento_negativo) / total) * 50)
      data.score = Math.max(0, Math.min(100, data.score))
    }
  })

  // Prepara dados do relatório para exportação
  const reportData: ReportData = {
    politicianName: currentPolitician?.name || 'Político',
    party: currentPolitician?.party,
    cargo: currentPolitician?.position,
    date: new Date().toLocaleDateString('pt-BR'),
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    totalMentions: stats?.total || 0,
    sentimentScore: aiAnalysis?.sentimentScore || Math.round(score / 10),
    alertLevel: (aiAnalysis?.alertLevel || alertLevel) as 'verde' | 'amarelo' | 'vermelho',
    alertMessage: aiAnalysis?.alertReason || alertMessage,
    summary: insights.summary,
    topNews: (aiAnalysis?.topNews || mentions.slice(0, 3)).map((item: any, idx) => ({
      title: item.title || 'Sem título',
      source: item.source || item.source_name || 'Fonte desconhecida',
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
    aiRecommendation: insights.recommendations?.join('. ') || 'Continue monitorando diariamente.'
  }

  // Função para exportar PDF
  const handleExportPDF = () => {
    printReport(reportData)
    toast.success('Relatório aberto para impressão')
  }

  // Função para compartilhar via WhatsApp
  const handleShareWhatsApp = () => {
    shareViaWhatsApp(reportData)
    toast.success('WhatsApp aberto para compartilhamento')
  }

  // Loading
  if (checkingAuth || loadingPoliticians) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Sem político
  if (!politicians || politicians.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onLogout={handleLogout} onHome={() => navigate('/')} />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Nenhum político cadastrado</h2>
              <p className="text-muted-foreground mb-6">
                Cadastre um político para começar o monitoramento 360°
              </p>
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
      {/* Header */}
      <Header user={user} onLogout={handleLogout} onHome={() => navigate('/')} />

      <main className="container mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Tabs
            value={String(selectedPolitician)}
            onValueChange={(v) => setSelectedPolitician(Number(v))}
          >
            <TabsList>
              {politicians.map(p => (
                <TabsTrigger key={p.id} value={String(p.id)}>
                  {p.nickname || p.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRunMonitoring}
              disabled={isMonitoring || loadingSocial}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isMonitoring || loadingSocial ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Dados
                </>
              )}
            </Button>
            {isAIConfigured() && (
              <Button
                variant="outline"
                onClick={runAIAnalysis}
                disabled={loadingAI || mentions.length === 0}
                title="Gerar análise com IA"
              >
                {loadingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Análise IA
                  </>
                )}
              </Button>
            )}
            <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={mentions.length === 0}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Relatório
                </Button>
              </DialogTrigger>
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
                    id: String(i),
                    ...n,
                    sentiment: n.sentiment as 'positivo' | 'negativo' | 'neutro'
                  }))}
                  aiRecommendation={reportData.aiRecommendation}
                  onExportPDF={handleExportPDF}
                  onShare={handleShareWhatsApp}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => navigate('/add-politician')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>

        {/* Banner de Alerta */}
        <AlertBanner nivel={alertLevel as any} motivo={alertMessage} className="mb-6" />

        {/* Score Principal + Informações */}
        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          {/* Score Gauge */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Score Geral</h3>
                <ScoreGauge score={score} size={180} />
                <p className="text-sm text-muted-foreground mt-2">
                  Baseado em {stats?.total || 0} menções
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Evolução */}
          <div className="lg:col-span-3">
            <ScoreChart
              data={scoreHistory}
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
            />
          </div>
        </div>

        {/* Cards das Redes Sociais */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Monitoramento por Rede
          </h2>

          {loadingSocial ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <NetworkCard rede="midia" data={networkData.midia} icon={networkIcons.midia} />
              <NetworkCard rede="youtube" data={networkData.youtube} icon={networkIcons.youtube} />
              <NetworkCard rede="twitter" data={networkData.twitter} icon={networkIcons.twitter} />
              <NetworkCard rede="instagram" data={networkData.instagram} icon={networkIcons.instagram} />
              <NetworkCard rede="tiktok" data={networkData.tiktok} icon={networkIcons.tiktok} />
            </div>
          )}
        </div>

        {/* Insights da IA */}
        <InsightsSection
          summary={insights.summary}
          recommendations={insights.recommendations}
          risks={aiAnalysis?.risks}
          opportunities={aiAnalysis?.opportunities}
          isLoading={loadingMentions || loadingAI}
          isAIGenerated={!!aiAnalysis}
        />

        {/* Menções Recentes */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Últimas Menções na Mídia
          </h2>

          {loadingMentions ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : mentions.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {mentions.slice(0, 10).map(mention => (
                <MentionCard key={mention.id} mention={mention} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Nenhuma menção ainda</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Clique em "Atualizar Dados" para buscar notícias
                </p>
                <Button onClick={handleRunMonitoring} disabled={isMonitoring}>
                  <Play className="h-4 w-4 mr-2" />
                  Buscar Agora
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

// Header Component
function Header({
  user,
  onLogout,
  onHome
}: {
  user: any
  onLogout: () => void
  onHome: () => void
}) {
  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Radar Político</h1>
            <p className="text-xs text-muted-foreground">Monitoramento 360°</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user.email}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={onHome}>
            <Home className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

// Mention Card Component
function MentionCard({ mention }: { mention: Mention }) {
  const sentimentConfig = {
    positivo: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: TrendingUp },
    negativo: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: TrendingDown },
    neutro: { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: Minus }
  }
  const config = sentimentConfig[mention.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutro
  const Icon = config.icon

  return (
    <Card className="hover:shadow-md transition-all hover:border-primary/20 cursor-pointer"
      onClick={() => mention.url && window.open(mention.url, '_blank', 'noopener,noreferrer')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{mention.source_name || 'Notícia'}</Badge>
              <Badge className={`text-xs ${config.bg}`}>
                <Icon className="h-3 w-3 mr-1" />
                {mention.sentiment}
              </Badge>
            </div>
            <h4 className="font-medium text-sm line-clamp-2">{mention.title || 'Sem título'}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {mention.summary || mention.content?.substring(0, 150)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(mention.published_at || mention.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}
