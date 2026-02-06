/**
 * RadarPolítico - Score Gauge
 * Velocímetro visual para mostrar o score de imagem
 */

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ScoreGaugeProps {
  score: number
  previousScore?: number
}

export function ScoreGauge({ score, previousScore }: ScoreGaugeProps) {
  const diff = previousScore !== undefined ? score - previousScore : 0
  const trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable'

  // Calcula a rotação do ponteiro (0-100 -> -90deg a 90deg)
  const rotation = ((score / 100) * 180) - 90

  // Cores baseadas no score
  const getScoreColor = (s: number) => {
    if (s >= 70) return { color: '#22c55e', label: 'Excelente', bg: 'from-green-500/20' }
    if (s >= 50) return { color: '#eab308', label: 'Bom', bg: 'from-yellow-500/20' }
    if (s >= 30) return { color: '#f97316', label: 'Atenção', bg: 'from-orange-500/20' }
    return { color: '#ef4444', label: 'Crítico', bg: 'from-red-500/20' }
  }

  const scoreInfo = getScoreColor(score)

  return (
    <Card className={`bg-gradient-to-br ${scoreInfo.bg} to-transparent border-none shadow-lg`}>
      <CardContent className="pt-6 pb-4">
        <div className="text-center mb-4">
          <span className="text-sm font-medium text-muted-foreground">Score de Imagem</span>
        </div>

        {/* Gauge SVG */}
        <div className="relative w-full max-w-[200px] mx-auto">
          <svg viewBox="0 0 200 120" className="w-full">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              className="text-muted/20"
            />

            {/* Colored segments */}
            <path
              d="M 20 100 A 80 80 0 0 1 56 40"
              fill="none"
              stroke="#ef4444"
              strokeWidth="12"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 56 40 A 80 80 0 0 1 100 20"
              fill="none"
              stroke="#f97316"
              strokeWidth="12"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 100 20 A 80 80 0 0 1 144 40"
              fill="none"
              stroke="#eab308"
              strokeWidth="12"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 144 40 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#22c55e"
              strokeWidth="12"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Active arc based on score */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={scoreInfo.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 251.2} 251.2`}
              className="transition-all duration-1000"
            />

            {/* Pointer */}
            <g transform={`rotate(${rotation} 100 100)`} className="transition-transform duration-1000">
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="35"
                stroke={scoreInfo.color}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="8" fill={scoreInfo.color} />
              <circle cx="100" cy="100" r="4" fill="white" />
            </g>

            {/* Labels */}
            <text x="20" y="115" fontSize="10" fill="currentColor" className="text-muted-foreground">0</text>
            <text x="95" y="18" fontSize="10" fill="currentColor" className="text-muted-foreground">50</text>
            <text x="170" y="115" fontSize="10" fill="currentColor" className="text-muted-foreground">100</text>
          </svg>

          {/* Score number */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className="text-4xl font-bold" style={{ color: scoreInfo.color }}>
              {score}
            </span>
            <span className="text-sm font-medium" style={{ color: scoreInfo.color }}>
              {scoreInfo.label}
            </span>
          </div>
        </div>

        {/* Trend indicator */}
        {previousScore !== undefined && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {trend === 'up' && (
              <div className="flex items-center gap-1 text-green-500 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>+{diff} pts</span>
              </div>
            )}
            {trend === 'down' && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <TrendingDown className="h-4 w-4" />
                <span>{diff} pts</span>
              </div>
            )}
            {trend === 'stable' && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Minus className="h-4 w-4" />
                <span>Estável</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">vs ontem</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
