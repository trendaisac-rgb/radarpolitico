/**
 * RadarPolítico - Sistema de Alertas de Crise
 * Página Premium: Alertas em Tempo Real para Políticos Monitorados
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/Sidebar'
import {
  AlertTriangle, Bell, Shield, TrendingUp, Eye, Clock, Filter, CheckCheck,
  Loader2, RefreshCw, Plus, Palette, ChevronDown, ExternalLink, X
} from 'lucide-react'
import { supabase, type Alert as AlertType, type Politician } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { usePoliticians } from '@/hooks/usePoliticians'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ============================================
// TYPES
// ============================================

interface AlertWithPolitician extends AlertType {
  politicians?: Politician | null
}

type AlertPriorityValue = 'critical' | 'high' | 'medium' | 'low'
type AlertTypeValue = 'mention' | 'trend' | 'crisis' | 'opportunity'
type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'

// ============================================
// THEME SYSTEM (matching DashboardPro)
// ============================================

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
// PRIORITY & TYPE COLORS
// ============================================

const PRIORITY_COLORS: Record<AlertPriorityValue, { bg: string; text: string; icon: string }> = {
  critical: { bg: 'hsl(0, 50%, 20%)', text: 'hsl(0, 72%, 55%)', icon: '🔴' },
  high: { bg: 'hsl(30, 50%, 20%)', text: 'hsl(30, 90%, 55%)', icon: '🟠' },
  medium: { bg: 'hsl(43, 50%, 20%)', text: 'hsl(43, 96%, 55%)', icon: '🟡' },
  low: { bg: 'hsl(152, 30%, 20%)', text: 'hsl(152, 55%, 50%)', icon: '🟢' },
}

const ALERT_TYPE_CONFIG: Record<AlertTypeValue, { label: string; icon: any; emoji: string }> = {
  mention: { label: 'Menção', icon: Bell, emoji: '📝' },
  trend: { label: 'Tendência', icon: TrendingUp, emoji: '📈' },
  crisis: { label: 'Crise', icon: AlertTriangle, emoji: '🚨' },
  opportunity: { label: 'Oportunidade', icon: TrendingUp, emoji: '✨' },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRelativeTime(date: string | null): string {
  if (!date) return 'sem data'
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
  } catch {
    return 'recentemente'
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AlertsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [alerts, setAlerts] = useState<AlertWithPolitician[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters
  const [selectedPolitician, setSelectedPolitician] = useState<number | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<AlertPriorityValue | 'all'>('all')
  const [selectedType, setSelectedType] = useState<AlertTypeValue | 'all'>('all')
  const [showUnread, setShowUnread] = useState(false)

  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')

  // Theme
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('alerts-theme') as ThemeKey) || 'azul'
  })

  const t = THEMES[themeKey]

  const handleThemeChange = (key: ThemeKey) => {
    setThemeKey(key)
    localStorage.setItem('alerts-theme', key)
  }

  // Data
  const { data: politicians = [], isLoading: loadingPoliticians } = usePoliticians()

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

  // Fetch alerts
  const fetchAlerts = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('alerts')
        .select('*, politicians(name, party, nickname)')
        .order('created_at', { ascending: false })

      if (selectedPolitician) {
        query = query.eq('politician_id', selectedPolitician)
      }

      const { data, error } = await query

      if (error) throw error
      setAlerts(data as AlertWithPolitician[])
    } catch (error) {
      console.error('Erro ao buscar alertas:', error)
      toast.error('Erro ao carregar alertas')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh alerts
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAlerts()
    toast.success('Alertas atualizados!')
    setIsRefreshing(false)
  }

  // Initial fetch and refresh
  useEffect(() => {
    if (!checkingAuth && selectedPolitician) {
      fetchAlerts()
      const interval = setInterval(fetchAlerts, 60000) // Auto-refresh every minute
      return () => clearInterval(interval)
    }
  }, [selectedPolitician, checkingAuth])

  // Mark as read
  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a))
      toast.success('Alerta marcado como lido')
    } catch (error) {
      console.error('Erro ao marcar como lido:', error)
      toast.error('Erro ao marcar como lido')
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = filteredAndSortedAlerts.filter(a => !a.is_read).map(a => a.id)
      if (unreadIds.length === 0) {
        toast.info('Todos os alertas já foram lidos')
        return
      }

      for (const id of unreadIds) {
        await supabase.from('alerts').update({ is_read: true }).eq('id', id)
      }

      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
      toast.success(`${unreadIds.length} alerta(s) marcado(s) como lido(s)`)
    } catch (error) {
      console.error('Erro ao marcar todos como lidos:', error)
      toast.error('Erro ao marcar como lidos')
    }
  }

  // Filter and sort
  const filteredAndSortedAlerts = alerts
    .filter(a => {
      if (showUnread && a.is_read) return false
      if (selectedPriority !== 'all' && (a.priority as AlertPriorityValue) !== selectedPriority) return false
      if (selectedType !== 'all' && (a.alert_type as AlertTypeValue) !== selectedType) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority as AlertPriorityValue] - priorityOrder[b.priority as AlertPriorityValue]
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })

  // Stats
  const totalToday = alerts.filter(a => {
    const today = new Date()
    const alertDate = new Date(a.created_at || '')
    return alertDate.toDateString() === today.toDateString()
  }).length

  const criticalCount = alerts.filter(a => a.priority === 'critical').length
  const unreadCount = alerts.filter(a => !a.is_read).length
  const mostActivePolitician = politicians[0]?.name || 'N/A'

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
        <AlertsHeader
          themeKey={themeKey}
          onThemeChange={handleThemeChange}
          theme={t}
          isRefreshing={false}
          onRefresh={() => {}}
          onAddPolitician={() => navigate('/add-politician')}
        />
        <main className="container mx-auto px-4 py-12">
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: t.accentMuted }}>
                <Bell className="h-8 w-8" style={{ color: t.accentText }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: t.brightText }}>Nenhum político cadastrado</h2>
              <p className="mb-6" style={{ color: t.bodyText }}>Cadastre políticos para ativar o sistema de alertas</p>
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

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 md:pl-16 min-h-screen" style={{ background: t.bgGradient, color: t.brightText }}>
        {/* Header */}
        <AlertsHeader
          themeKey={themeKey}
          onThemeChange={handleThemeChange}
          theme={t}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onAddPolitician={() => navigate('/add-politician')}
        />

        <main className="container mx-auto px-4 py-6 space-y-6">
        {/* STATS SUMMARY */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Alertas Hoje"
            value={totalToday.toString()}
            theme={t}
            color={t.accentText}
          />
          <StatCard
            label="Críticos"
            value={criticalCount.toString()}
            theme={t}
            color="hsl(0, 72%, 55%)"
          />
          <StatCard
            label="Não Lidos"
            value={unreadCount.toString()}
            theme={t}
            color="hsl(43, 96%, 55%)"
          />
          <StatCard
            label="Político Ativo"
            value={mostActivePolitician.split(' ')[0] || 'N/A'}
            theme={t}
            color="hsl(152, 55%, 50%)"
          />
        </div>

        {/* FILTERS & ACTIONS */}
        <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Row 1: Politician selector */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium mb-2 block" style={{ color: t.mutedText }}>
                    Político
                  </label>
                  <select
                    value={selectedPolitician || ''}
                    onChange={(e) => setSelectedPolitician(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      backgroundColor: t.filterBg,
                      borderColor: t.cardBorder,
                      color: t.brightText
                    }}
                  >
                    {politicians.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.party})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Priority Filter */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: t.mutedText }}>
                    Prioridade
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: t.filterBg,
                      borderColor: t.cardBorder,
                      color: t.brightText
                    }}
                  >
                    <option value="all">Todas</option>
                    <option value="critical">Crítica</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: t.mutedText }}>
                    Tipo
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: t.filterBg,
                      borderColor: t.cardBorder,
                      color: t.brightText
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="mention">Menção</option>
                    <option value="trend">Tendência</option>
                    <option value="crisis">Crise</option>
                    <option value="opportunity">Oportunidade</option>
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: t.mutedText }}>
                    Ordenar
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: t.filterBg,
                      borderColor: t.cardBorder,
                      color: t.brightText
                    }}
                  >
                    <option value="date">Mais Recentes</option>
                    <option value="priority">Por Prioridade</option>
                  </select>
                </div>

                {/* Unread Toggle */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: t.mutedText }}>
                    Status
                  </label>
                  <button
                    onClick={() => setShowUnread(!showUnread)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: showUnread ? t.filterActive : t.filterBg,
                      color: showUnread ? t.brightText : t.mutedText
                    }}
                  >
                    {showUnread ? '✓ Não Lidos' : 'Todos'}
                  </button>
                </div>
              </div>

              {/* Row 3: Actions */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  style={{ color: t.bodyText }}
                  className="gap-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Atualizar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  style={{ color: t.bodyText }}
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Marcar todas como lidas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ALERTS LIST */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                <CardContent className="p-4">
                  <Skeleton className="h-24 w-full" style={{ backgroundColor: `${t.accentMuted}44` }} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedAlerts.length > 0 ? (
          <div className="space-y-3">
            {filteredAndSortedAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                theme={t}
                onMarkAsRead={() => markAsRead(alert.id)}
              />
            ))}
          </div>
        ) : (
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: t.accentMuted }}>
                <Shield className="h-8 w-8" style={{ color: t.accentText }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: t.brightText }}>Nenhum alerta encontrado</h3>
              <p style={{ color: t.bodyText }}>
                {showUnread ? 'Todos os alertas foram lidos!' : 'Nenhum alerta para os filtros selecionados'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center py-6 text-xs" style={{ color: `${t.mutedText}88` }}>
          Sistema de Alertas em Tempo Real • Atualiza a cada minuto
        </footer>
      </main>
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface AlertsHeaderProps {
  themeKey: ThemeKey
  onThemeChange: (key: ThemeKey) => void
  theme: typeof THEMES[ThemeKey]
  isRefreshing: boolean
  onRefresh: () => void
  onAddPolitician: () => void
}

function AlertsHeader({
  themeKey,
  onThemeChange,
  theme: t,
  isRefreshing,
  onRefresh,
  onAddPolitician
}: AlertsHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="border-b sticky top-0 z-50" style={{ borderColor: t.headerBorder, backgroundColor: t.headerBg }}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🚨</span>
          <div>
            <h1 className="font-bold text-base" style={{ color: t.brightText }}>Alertas em Tempo Real</h1>
            <p className="text-xs" style={{ color: t.mutedText }}>Sistema Premium de Crise Política</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme picker */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors" style={{ color: t.bodyText }}>
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
              style={{ color: t.bodyText }}>
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onAddPolitician} style={{ color: t.bodyText }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

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

interface StatCardProps {
  label: string
  value: string
  theme: typeof THEMES[ThemeKey]
  color: string
}

function StatCard({ label, value, theme: t, color }: StatCardProps) {
  return (
    <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
      <CardContent className="p-4">
        <p className="text-xs font-medium mb-2" style={{ color: t.mutedText }}>
          {label}
        </p>
        <p className="text-2xl font-bold" style={{ color }}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

interface AlertCardProps {
  alert: AlertWithPolitician
  theme: typeof THEMES[ThemeKey]
  onMarkAsRead: () => void
}

function AlertCard({ alert, theme: t, onMarkAsRead }: AlertCardProps) {
  const priority = (alert.priority as AlertPriorityValue) || 'low'
  const alertType = (alert.alert_type as AlertTypeValue) || 'mention'
  const colors = PRIORITY_COLORS[priority]
  const typeConfig = ALERT_TYPE_CONFIG[alertType]

  return (
    <Card
      className="transition-all hover:shadow-lg"
      style={{
        backgroundColor: t.cardBg,
        borderColor: alert.is_read ? t.cardBorder : colors.text,
        borderLeftWidth: '4px'
      }}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Priority Badge */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 font-xl"
            style={{ backgroundColor: colors.bg }}
          >
            {PRIORITY_COLORS[priority].icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm" style={{ color: t.brightText }}>
                  {alert.title}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="text-[10px]" style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.text,
                    border: `1px solid ${colors.text}`
                  }}>
                    {priority.toUpperCase()}
                  </Badge>
                  <Badge className="text-[10px]" style={{
                    backgroundColor: t.accentMuted,
                    color: t.accentText
                  }}>
                    {typeConfig.emoji} {typeConfig.label}
                  </Badge>
                </div>
                {!alert.is_read && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.text }}
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm mb-3 line-clamp-2" style={{ color: t.bodyText }}>
              {alert.description}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs mb-3 flex-wrap">
              {/* Time */}
              <span className="flex items-center gap-1" style={{ color: t.mutedText }}>
                <Clock className="h-3 w-3" />
                {getRelativeTime(alert.created_at)}
              </span>

              {/* Politician */}
              {alert.politicians && (
                <span style={{ color: t.accentText }}>
                  {alert.politicians.name}
                </span>
              )}

              {/* URL link */}
              {alert.url && (
                <a
                  href={alert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: t.accentText }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver fonte
                </a>
              )}
            </div>

            {/* Actions */}
            {!alert.is_read && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAsRead}
                  className="gap-1 text-xs h-8"
                  style={{ color: t.accentText }}
                >
                  <Eye className="h-3 w-3" />
                  Marcar como lido
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
