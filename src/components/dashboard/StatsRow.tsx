/**
 * RadarPolítico - Stats Row
 * Score Gauge + 3 stat cards na mesma linha
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Newspaper, TrendingUp, TrendingDown } from 'lucide-react'
import { ScoreGauge } from './ScoreGauge'
import type { ScoreResult } from '@/services/scoreCalculator'

interface StatsRowProps {
  score: number
  scoreResult: ScoreResult
  totalMentions: number
  positiveMentions: number
  negativeMentions: number
  positivePercent: number
  negativePercent: number
}

export function StatsRow({
  score,
  scoreResult,
  totalMentions,
  positiveMentions,
  negativeMentions,
  positivePercent,
  negativePercent
}: StatsRowProps) {
  return (
    <div className="grid lg:grid-cols-4 gap-4 mb-6">
      {/* Score Gauge */}
      <Card className="lg:col-span-1">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <ScoreGauge score={score} size={160} />
          <div className="text-center mt-1">
            <p className="text-xs text-muted-foreground">
              {scoreResult.breakdown.totalMentions} menções
            </p>
            <Badge
              variant="outline"
              className={`mt-1 text-[10px] ${
                scoreResult.confidence === 'alta'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : scoreResult.confidence === 'media'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              Confiança {scoreResult.confidence}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="lg:col-span-3 grid grid-cols-3 gap-4">
        <StatCard
          title="Total"
          value={totalMentions}
          icon={<Newspaper className="h-4 w-4 text-blue-500" />}
        />
        <StatCard
          title="Positivas"
          value={positiveMentions}
          subtitle={totalMentions > 0 ? `${positivePercent}%` : undefined}
          icon={<TrendingUp className="h-4 w-4 text-green-500" />}
          valueColor="text-green-600"
        />
        <StatCard
          title="Negativas"
          value={negativeMentions}
          subtitle={totalMentions > 0 ? `${negativePercent}%` : undefined}
          icon={<TrendingDown className="h-4 w-4 text-red-500" />}
          valueColor="text-red-600"
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, valueColor }: {
  title: string
  value: number
  subtitle?: string
  icon: React.ReactNode
  valueColor?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          {icon}
        </div>
        <p className={`text-2xl font-bold ${valueColor || ''}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
