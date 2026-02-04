/**
 * RadarPolítico - Dashboard
 * Painel principal de monitoramento
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp, TrendingDown, Minus, Bell,
  Newspaper, Users, BarChart3, Settings,
  ExternalLink, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { usePoliticians } from '@/hooks/usePoliticians'
import { useMentions, useMentionStats } from '@/hooks/useMentions'
import { isSupabaseConfigured } from '@/integrations/supabase/client'

// Componente de estatística
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend
}: {
  title: string
  value: string | number
  change?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs flex items-center gap-1 ${
            trend === 'up' ? 'text-green-600' :
            trend === 'down' ? 'text-red-600' :
            'text-muted-foreground'
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
  const sentimentColors = {
    positivo: 'bg-green-100 text-green-800',
    negativo: 'bg-red-100 text-red-800',
    neutro: 'bg-gray-100 text-gray-800'
  }

  const sentimentIcons = {
    positivo: <TrendingUp className="h-3 w-3" />,
    negativo: <TrendingDown className="h-3 w-3" />,
    neutro: <Minus className="h-3 w-3" />
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {mention.source_name || 'Fonte'}
              </Badge>
              <Badge className={`text-xs ${sentimentColors[mention.sentiment as keyof typeof sentimentColors]}`}>
                {sentimentIcons[mention.sentiment as keyof typeof sentimentIcons]}
                <span className="ml-1 capitalize">{mention.sentiment}</span>
              </Badge>
            </div>
            <h4 className="font-medium text-sm line-clamp-2 mb-1">
              {mention.title || 'Sem título'}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {mention.summary || mention.content?.substring(0, 150)}
            </p>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <a href={mention.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{new Date(mention.published_at || mention.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente principal do Dashboard
export default function Dashboard() {
  const [selectedPolitician, setSelectedPolitician] = useState<number | null>(null)

  // Verificar se Supabase está configurado
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Configuração Necessária
            </CardTitle>
            <CardDescription>
              O Supabase ainda não foi configurado neste projeto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para usar o dashboard, configure as variáveis de ambiente:
            </p>
            <div className="bg-muted p-3 rounded-md font-mono text-xs">
              <p>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</p>
              <p>VITE_SUPABASE_ANON_KEY=sua-chave-anon</p>
            </div>
            <Button asChild className="w-full">
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                Acessar Supabase Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: politicians, isLoading: loadingPoliticians } = usePoliticians()
  const { data: mentions, isLoading: loadingMentions } = useMentions({
    politicianId: selectedPolitician || undefined,
    limit: 20
  })
  const { data: stats } = useMentionStats(selectedPolitician || 0)

  // Se não tem político selecionado, pega o primeiro
  if (!selectedPolitician && politicians && politicians.length > 0) {
    setSelectedPolitician(politicians[0].id)
  }

  const currentPolitician = politicians?.find(p => p.id === selectedPolitician)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Seletor de político */}
        {politicians && politicians.length > 0 && (
          <div className="mb-6">
            <Tabs
              value={String(selectedPolitician)}
              onValueChange={(v) => setSelectedPolitician(Number(v))}
            >
              <TabsList>
                {politicians.map(politician => (
                  <TabsTrigger key={politician.id} value={String(politician.id)}>
                    {politician.nickname || politician.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total de Menções (24h)"
            value={stats?.total || 0}
            change="+12% vs ontem"
            icon={Newspaper}
            trend="up"
          />
          <StatCard
            title="Menções Positivas"
            value={`${stats?.positivePercentage || 0}%`}
            change={`${stats?.positive || 0} menções`}
            icon={CheckCircle2}
            trend="up"
          />
          <StatCard
            title="Menções Negativas"
            value={`${stats?.negativePercentage || 0}%`}
            change={`${stats?.negative || 0} menções`}
            icon={AlertTriangle}
            trend="down"
          />
          <StatCard
            title="Score de Sentimento"
            value={stats ? `+${Math.round((stats.positive - stats.negative) / (stats.total || 1) * 10)}` : '0'}
            change="Escala -10 a +10"
            icon={TrendingUp}
            trend="neutral"
          />
        </div>

        {/* Grid principal */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menções recentes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menções Recentes</h2>
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </div>

            {loadingMentions ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando menções...
              </div>
            ) : mentions && mentions.length > 0 ? (
              <div className="space-y-3">
                {mentions.map(mention => (
                  <MentionCard key={mention.id} mention={mention} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma menção encontrada ainda.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    O monitoramento começará a coletar dados em breve.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Info do político */}
            {currentPolitician && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Político Monitorado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{currentPolitician.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentPolitician.party} • {currentPolitician.state}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    {currentPolitician.position && (
                      <p><span className="text-muted-foreground">Cargo:</span> {currentPolitician.position}</p>
                    )}
                    {currentPolitician.city && (
                      <p><span className="text-muted-foreground">Cidade:</span> {currentPolitician.city}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alertas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  Nenhum alerta no momento
                </div>
              </CardContent>
            </Card>

            {/* Ações rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Newspaper className="h-4 w-4 mr-2" />
                  Gerar relatório
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Adicionar político
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
