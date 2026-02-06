/**
 * RadarPolítico - Alertas de Crise
 * Mostra alertas quando há picos de menções negativas
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle, AlertCircle, Info, Bell, BellRing,
  ExternalLink, Clock, TrendingDown, Shield, CheckCircle2
} from 'lucide-react'

type AlertLevel = 'critical' | 'warning' | 'info'

interface Alert {
  id: number
  level: AlertLevel
  title: string
  description: string
  source?: string
  url?: string
  time: string
  isNew?: boolean
}

interface CrisisAlertsProps {
  alerts: Alert[]
  onDismiss?: (id: number) => void
}

export function CrisisAlerts({ alerts, onDismiss }: CrisisAlertsProps) {
  const getAlertConfig = (level: AlertLevel) => {
    switch (level) {
      case 'critical':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50 dark:bg-red-950/50',
          borderColor: 'border-red-200 dark:border-red-800',
          iconColor: 'text-red-500',
          badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }
      case 'warning':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/50',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          iconColor: 'text-yellow-500',
          badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        }
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 dark:bg-blue-950/50',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-500',
          badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        }
    }
  }

  const criticalCount = alerts.filter(a => a.level === 'critical').length
  const warningCount = alerts.filter(a => a.level === 'warning').length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {criticalCount > 0 ? (
              <BellRing className="h-4 w-4 text-red-500 animate-pulse" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Alertas
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                {warningCount} atenção
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => {
              const config = getAlertConfig(alert.level)
              const Icon = config.icon

              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${config.iconColor} shrink-0 mt-0.5`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{alert.title}</span>
                        {alert.isNew && (
                          <Badge variant="outline" className="text-xs">Novo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.time}
                        </span>
                        {alert.source && (
                          <span>• {alert.source}</span>
                        )}
                      </div>
                    </div>

                    {alert.url && (
                      <Button variant="ghost" size="icon" className="shrink-0" asChild>
                        <a href={alert.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium text-green-600">Tudo tranquilo!</p>
            <p className="text-sm text-muted-foreground">
              Nenhum alerta de crise no momento
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Detecta possíveis crises baseado nas menções
export function detectCrisis(mentions: any[]): Alert[] {
  const alerts: Alert[] = []
  const now = new Date()

  // Conta menções negativas recentes (últimas 3 horas)
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const recentNegative = mentions.filter(
    m => m.sentiment === 'negativo' &&
    new Date(m.created_at) > threeHoursAgo
  )

  // Alerta crítico: muitas menções negativas em pouco tempo
  if (recentNegative.length >= 5) {
    alerts.push({
      id: 1,
      level: 'critical',
      title: '🚨 Pico de menções negativas!',
      description: `${recentNegative.length} menções negativas nas últimas 3 horas. Possível crise de imagem em andamento.`,
      time: 'Agora',
      isNew: true
    })
  } else if (recentNegative.length >= 3) {
    alerts.push({
      id: 2,
      level: 'warning',
      title: '⚠️ Aumento de menções negativas',
      description: `${recentNegative.length} menções negativas recentes. Acompanhe a situação.`,
      time: 'Agora',
      isNew: true
    })
  }

  // Verifica menções de veículos grandes com sentimento negativo
  const bigMediaNegative = mentions.filter(
    m => m.sentiment === 'negativo' &&
    ['G1', 'Folha', 'UOL', 'Estadão', 'Globo'].some(v =>
      m.source_name?.toLowerCase().includes(v.toLowerCase())
    )
  )

  if (bigMediaNegative.length > 0) {
    const sources = [...new Set(bigMediaNegative.map(m => m.source_name))].join(', ')
    alerts.push({
      id: 3,
      level: 'warning',
      title: '📰 Mídia grande com notícia negativa',
      description: `Veículos relevantes publicaram conteúdo negativo: ${sources}`,
      source: sources,
      url: bigMediaNegative[0]?.url,
      time: 'Recente',
      isNew: false
    })
  }

  return alerts
}

// Gera alertas de exemplo para demonstração
export function generateMockAlerts(): Alert[] {
  return [
    {
      id: 1,
      level: 'warning',
      title: '⚠️ Menção em veículo relevante',
      description: 'Seu nome foi citado em matéria sobre investigação de licitações na cidade vizinha.',
      source: 'Folha de S.Paulo',
      url: '#',
      time: 'Há 2 horas',
      isNew: true
    },
    {
      id: 2,
      level: 'info',
      title: '📊 Aumento de menções',
      description: '15% mais menções que a média dos últimos 7 dias. Tendência positiva.',
      time: 'Há 5 horas',
      isNew: false
    }
  ]
}
