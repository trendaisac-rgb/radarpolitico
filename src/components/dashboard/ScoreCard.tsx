/**
 * RadarPolítico - Score Card
 * Mostra o score de imagem do político (0-100)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react'

// Calcula o score baseado nas menções
export function calculateScore(positive: number, negative: number, total: number): number {
  if (total === 0) return 50 // Score neutro se não há dados
  const ratio = (positive - negative) / total
  // Converte ratio (-1 a 1) para score (0 a 100)
  const score = Math.round((ratio + 1) * 50)
  return Math.max(0, Math.min(100, score))
}

interface ScoreCardProps {
  score: number // 0-100
  previousScore?: number
  label?: string
}

export function ScoreCard({ score, previousScore, label = "Score de Imagem" }: ScoreCardProps) {
  const diff = previousScore !== undefined ? score - previousScore : 0
  const trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable'

  // Determina cor baseado no score
  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-green-500'
    if (s >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excelente'
    if (s >= 60) return 'Bom'
    if (s >= 40) return 'Regular'
    if (s >= 20) return 'Ruim'
    return 'Crítico'
  }

  const getProgressColor = (s: number) => {
    if (s >= 70) return 'bg-green-500'
    if (s >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 ${
        score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
      }`} />

      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-end gap-2 mb-3">
          <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-2xl text-muted-foreground mb-1">/100</span>

          {diff !== 0 && (
            <div className={`flex items-center gap-1 text-sm ml-2 mb-2 ${
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4" />}
              {trend === 'stable' && <Minus className="h-4 w-4" />}
              <span>{diff > 0 ? '+' : ''}{diff}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className={`text-sm font-medium ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
