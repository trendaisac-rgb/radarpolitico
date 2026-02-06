/**
 * RadarPolítico - Gráfico de Evolução
 * Mostra a evolução do sentimento ao longo do tempo
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'

interface DataPoint {
  date: string
  score: number
  positive: number
  negative: number
  neutral: number
  total: number
}

interface EvolutionChartProps {
  data: DataPoint[]
  title?: string
}

export function EvolutionChart({ data, title = "Evolução do Sentimento" }: EvolutionChartProps) {
  // Calcula tendência
  const getTrend = () => {
    if (data.length < 2) return 'stable'
    const recent = data.slice(-3).reduce((acc, d) => acc + d.score, 0) / 3
    const older = data.slice(0, 3).reduce((acc, d) => acc + d.score, 0) / 3
    if (recent > older + 5) return 'up'
    if (recent < older - 5) return 'down'
    return 'stable'
  }

  const trend = getTrend()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Score:</span>
              <span className="font-bold">{data.score}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-green-600">Positivas:</span>
              <span>{data.positive}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-red-600">Negativas:</span>
              <span>{data.negative}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total:</span>
              <span>{data.total}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {title}
          </CardTitle>
          <Badge variant={
            trend === 'up' ? 'default' :
            trend === 'down' ? 'destructive' : 'secondary'
          }>
            {trend === 'up' ? '📈 Subindo' :
             trend === 'down' ? '📉 Caindo' : '➡️ Estável'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {data.length > 0 ? (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Dados insuficientes para gráfico</p>
              <p className="text-sm">Execute o monitoramento por alguns dias</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Gera dados de exemplo para demonstração
export function generateMockEvolutionData(days: number = 7): DataPoint[] {
  const data: DataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const positive = Math.floor(Math.random() * 20) + 5
    const negative = Math.floor(Math.random() * 10) + 2
    const neutral = Math.floor(Math.random() * 15) + 3
    const total = positive + negative + neutral
    const score = Math.round(((positive - negative) / total + 1) * 50)

    data.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      score: Math.max(0, Math.min(100, score + Math.floor(Math.random() * 20) - 10)),
      positive,
      negative,
      neutral,
      total
    })
  }

  return data
}
