/**
 * RadarPolítico - Dashboard Completo
 * Painel principal de monitoramento com todas as funcionalidades
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp, TrendingDown, Minus, Bell, RefreshCw,
  Newspaper, Users, BarChart3, Settings, Plus,
  ExternalLink, AlertTriangle, CheckCircle2, Loader2,
  Play, Clock, Zap, Home
} from 'lucide-react'
import { usePoliticians } from '@/hooks/usePoliticians'
import { useMentions, useMentionStats } from '@/hooks/useMentions'
import { useMonitoring } from '@/hooks/useMonitoring'
import { supabase, type Politician } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// Novos componentes do dashboard
import { ScoreCard, calculateScore } from '@/components/dashboard/ScoreCard'
import { EvolutionChart, generateMockEvolutionData } from '@/components/dashboard/EvolutionChart'
import { CompetitorRanking, generateMockCompetitors } from '@/components/dashboard/CompetitorRanking'
import { CrisisAlerts, detectCrisis, generateMockAlerts } from '@/components/dashboard/CrisisAlerts'

// Função para converter menções em dados de evolução
function generateEvolutionDataFromMentions(mentions: any[]) {
  const byDate: Record<string, { positive: number; negative: number; neutral: number }> = {}

  mentions.forEach(m => {
    const date = new Date(m.published_at || m.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    })
    if (!byDate[date]) {
      byDate[date] = { positive: 0, negative: 0, neutral: 0 }
    }
    if (m.sentiment === 'positivo') byDate[date].positive++
    else if (m.sentiment === 'negativo') byDate[date].negative++
    else byDate[date].neutral++
  })

  return Object.entries(byDate).map(([date, data]) => {
    const total = data.positive + data.negative + data.neutral
    const score = total > 0
      ? Math.round(((data.positive - data.negative) / total + 1) * 50)
      : 50
    return {
      date,
      score: Math.max(0, Math.min(100, score)),
      positive: data.positive,
      negative: data.negative,
      neutral: data.neutral,
      total
    }
  }).slice(-7) // Últimos 7 dias
}

// Componente de estatística
function StatCard({
  title, value, change, icon: Icon, trend, color
}: {
  title: string
  value: string | number
  change?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs flex items-center gap-1 mt-1 ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            {trend === 'neutral' && <Minus className="h-3 w-3" />}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Componente de menção
function MentionCard({ mention }: { mention: any }) {
  const sentimentConfig = {
    positivo: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: TrendingUp },
    negativo: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: TrendingDown },
    neutro: { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: Minus }
  }
  const config = sentimentConfig[mention.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutro
  const Icon = config.icon

  return (
    <Card className="hover:shadow-md transition-all hover:border-primary/20">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{mention.source_name || 'Notícia'}</Badge>
              <Badge className={`text-xs ${config.bg}`}>
                <Icon className="h-3 w-3 mr-1" />
                {mention.sentiment}
              </Badge>
              {mention.relevance_score > 0.7 && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Alta relevância
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-sm line-clamp-2 mb-1">{mention.title || 'Sem título'}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {mention.summary || mention.content?.substring(0, 150)}
            </p>
          </div>
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <a href={mention.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(mention.published_at || mention.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Estado vazio - Nenhum político cadastrado
function EmptyState({ onAddPolitician }: { onAddPolitician: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhum político cadastrado</h2>
          <p className="text-muted-foreground mb-6">
            Cadastre um político para começar a monitorar as notícias e menções na mídia.
          </p>
          <Button onClick={onAddPolitician} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Primeiro Político
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principal do Dashboard
export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedPolitician, setSelectedPolitician] = useState<number | null>(null)

  // Hooks de dados
  const { data: politicians, isLoading: loadingPoliticians, refetch: refetchPoliticians } = usePoliticians()
  const { data: mentions, isLoading: loadingMentions, refetch: refetchMentions } = useMentions({
    politicianId: selectedPolitician || undefined,
    limit: 15
  })
  const { data: stats, refetch: refetchStats } = useMentionStats(selectedPolitician || 0)

  // Hook de monitoramento
  const { isMonitoring, runMonitoring, lastResult } = useMonitoring()

  // Seleciona primeiro político automaticamente
  useEffect(() => {
    if (!selectedPolitician && politicians && politicians.length > 0) {
      setSelectedPolitician(politicians[0].id)
    }
  }, [politicians, selectedPolitician])

  const currentPolitician = politicians?.find(p => p.id === selectedPolitician)

  // Executar monitoramento
  const handleRunMonitoring = async () => {
    if (!currentPolitician) {
      toast.error('Selecione um político primeiro')
      return
    }

    toast.info(`Buscando notícias sobre ${currentPolitician.name}...`)

    try {
      const result = await runMonitoring(currentPolitician)

      if (result.newMentions > 0) {
        toast.success(`${result.newMentions} novas menções encontradas!`, {
          description: `${result.positive} positivas, ${result.negative} negativas`
        })
      } else {
        toast.info('Nenhuma nova menção encontrada')
      }

      // Atualiza dados
      refetchMentions()
      refetchStats()
    } catch (error) {
      toast.error('Erro ao buscar notícias')
    }
  }

  // Loading inicial
  if (loadingPoliticians) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Estado vazio
  if (!politicians || politicians.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Radar Político</h1>
              <p className="text-xs text-muted-foreground">Dashboard de Monitoramento</p>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <EmptyState onAddPolitician={() => navigate('/add-politician')} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Radar Político</h1>
              <p className="text-xs text-muted-foreground">Dashboard de Monitoramento</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Tabs de políticos */}
          <Tabs
            value={String(selectedPolitician)}
            onValueChange={(v) => setSelectedPolitician(Number(v))}
          >
            <TabsList>
              {politicians.map(politician => (
                <TabsTrigger key={politician.id} value={String(politician.id)}>
                  {politician.nickname || politician.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Botões de ação */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRunMonitoring}
              disabled={isMonitoring}
              className="bg-accent hover:bg-accent/90"
            >
              {isMonitoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Buscar Notícias
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate('/add-politician')}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Resultado do último monitoramento */}
        {lastResult && lastResult.politicianId === selectedPolitician && (
          <Card className="mb-6 border-accent/50 bg-accent/5">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Última busca: <strong>{lastResult.totalFound}</strong> notícias encontradas</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-green-600">+{lastResult.positive}</span>
                  <span className="text-red-600">-{lastResult.negative}</span>
                  <span className="text-gray-500">○{lastResult.neutral}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { refetchMentions(); refetchStats(); }}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Principal + Cards de Estatísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Score Card Grande */}
          <div className="lg:col-span-1">
            <ScoreCard
              score={calculateScore(stats?.positive || 0, stats?.negative || 0, stats?.total || 0)}
              previousScore={calculateScore(
                Math.max(0, (stats?.positive || 0) - 2),
                Math.max(0, (stats?.negative || 0) - 1),
                Math.max(1, (stats?.total || 1) - 3)
              )}
              label="Índice de Imagem"
            />
          </div>

          {/* Cards de Estatísticas */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total (24h)"
              value={stats?.total || 0}
              icon={Newspaper}
              color="text-blue-500"
            />
            <StatCard
              title="Positivas"
              value={stats?.positive || 0}
              change={stats?.total ? `${stats.positivePercentage}%` : undefined}
              icon={TrendingUp}
              trend="up"
              color="text-green-500"
            />
            <StatCard
              title="Negativas"
              value={stats?.negative || 0}
              change={stats?.total ? `${stats.negativePercentage}%` : undefined}
              icon={TrendingDown}
              trend="down"
              color="text-red-500"
            />
          </div>
        </div>

        {/* Gráfico de Evolução + Alertas */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <EvolutionChart
            data={mentions && mentions.length > 0
              ? generateEvolutionDataFromMentions(mentions)
              : generateMockEvolutionData(7)
            }
          />
          <CrisisAlerts
            alerts={mentions && mentions.length > 0
              ? detectCrisis(mentions)
              : generateMockAlerts()
            }
          />
        </div>

        {/* Ranking de Concorrentes */}
        {currentPolitician && (
          <div className="mb-6">
            <CompetitorRanking
              competitors={generateMockCompetitors({
                name: currentPolitician.name,
                party: currentPolitician.party || ''
              })}
            />
          </div>
        )}

        {/* Grid principal */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menções recentes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menções Recentes</h2>
              {mentions && mentions.length > 0 && (
                <Badge variant="secondary">{mentions.length} menções</Badge>
              )}
            </div>

            {loadingMentions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : mentions && mentions.length > 0 ? (
              <div className="space-y-3">
                {mentions.map(mention => (
                  <MentionCard key={mention.id} mention={mention} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Nenhuma menção ainda</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clique em "Buscar Notícias" para iniciar o monitoramento
                  </p>
                  <Button onClick={handleRunMonitoring} disabled={isMonitoring}>
                    <Play className="h-4 w-4 mr-2" />
                    Buscar Agora
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Card do político */}
            {currentPolitician && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Monitorando</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                      {currentPolitician.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{currentPolitician.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[currentPolitician.party, currentPolitician.state].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  </div>
                  {currentPolitician.position && (
                    <p className="text-sm mb-1">
                      <span className="text-muted-foreground">Cargo:</span> {currentPolitician.position}
                    </p>
                  )}
                  {currentPolitician.city && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Cidade:</span> {currentPolitician.city}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status de monitoramento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Google News</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Análise IA</span>
                  <Badge variant="outline">Básica</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <Badge variant="outline" className="text-muted-foreground">
                    Em breve
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleRunMonitoring}
                  disabled={isMonitoring}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
                  Atualizar Menções
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/add-politician')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Político
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
