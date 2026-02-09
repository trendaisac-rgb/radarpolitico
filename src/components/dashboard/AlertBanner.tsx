/**
 * RadarPolítico - Alert Banner
 * Banner de alerta com níveis (verde, amarelo, vermelho)
 */

import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

export interface AlertBannerProps {
  nivel: 'verde' | 'amarelo' | 'vermelho' | null
  motivo: string | null
  className?: string
}

const alertConfig = {
  verde: {
    icon: CheckCircle,
    bg: 'bg-green-500/10 border-green-500/30',
    text: 'text-green-700 dark:text-green-400',
    title: 'Tudo certo!',
    iconColor: 'text-green-500'
  },
  amarelo: {
    icon: AlertTriangle,
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    title: 'Atenção',
    iconColor: 'text-yellow-500'
  },
  vermelho: {
    icon: XCircle,
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-700 dark:text-red-400',
    title: 'Alerta Crítico',
    iconColor: 'text-red-500'
  }
}

export function AlertBanner({ nivel, motivo, className }: AlertBannerProps) {
  if (!nivel) return null

  const config = alertConfig[nivel]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${config.bg} ${className || ''}`}>
      <Icon className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
      <div className="flex-1">
        <p className={`font-medium ${config.text}`}>
          {config.title}
        </p>
        {motivo && (
          <p className={`text-sm mt-0.5 opacity-80 ${config.text}`}>
            {motivo}
          </p>
        )}
      </div>
    </div>
  )
}
