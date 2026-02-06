/**
 * RadarPolítico - Score Chart
 * Gráfico de evolução do score com seletor de período
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ChartDataPoint {
  data: string
  score: number
  mencoes?: number
}

interface ScoreChartProps {
  data: ChartDataPoint[]
  period: number
  onPeriodChange: (period: number) => void
  onDateClick?: (date: string) => void
  selectedDate?: string
}

const periodOptions = [
  { value: 7, label: '7D' },
  { value: 15, label: '15D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' }
]

export function ScoreChart({
  data,
  period,
  onPeriodChange,
  onDateClick,
  selectedDate
}: ScoreChartProps) {
  // Calcula média
  const avgScore = data.length > 0
    ? Math.round(data.reduce((acc, d) => acc + d.score, 0) / data.length)
    : 50

  // Calcula tendência
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const firstAvg = firstHalf.length > 0
    ? firstHalf.reduce((acc, d) => acc + d.score, 0) / firstHalf.length
    : 50
  const secondAvg = secondHalf.length > 0
    ? secondHalf.reduce((acc, d) => acc + d.score, 0) / secondHalf.length
    : 50
  const trend = secondAvg - firstAvg

  // Cor baseada na média
  const getGradientColor = () => {
    if (avgScore >= 70) return { start: '#22c55e', end: '#16a34a' }
    if (avgScore >= 50) return { start: '#eab308', end: '#ca8a04' }
    if (avgScore >= 30) return { start: '#f97316', end: '#ea580c' }
    return { start: '#ef4444', end: '#dc2626' }
  }

  const gradientColor = getGradientColor()

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Evolução do Score
          </CardTitle>
          <div className="flex gap-1">
            {periodOptions.map(opt => (
              <Button
                key={opt.value}
                variant={period === opt.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onPeriodChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats resumo */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Média:</span>
            <span className="font-medium">{avgScore}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Tendência:</span>
            <span className={`font-medium ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[200px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              onClick={(e) => {
                if (e?.activePayload?.[0]?.payload?.data && onDateClick) {
                  onDateClick(e.activePayload[0].payload.data)
                }
              }}
            >
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientColor.start} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={gradientColor.end} stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />

              <XAxis
                dataKey="data"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                stroke="currentColor"
                opacity={0.5}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                stroke="currentColor"
                opacity={0.5}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value: number) => [`Score: ${value}`, '']}
              />

              <ReferenceLine y={50} stroke="currentColor" strokeDasharray="5 5" opacity={0.3} />

              <Area
                type="monotone"
                dataKey="score"
                stroke={gradientColor.start}
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={(props) => {
                  const { cx, cy, payload } = props
                  const isSelected = payload.data === selectedDate
                  return (
                    <circle
                      key={payload.data}
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6 : 3}
                      fill={isSelected ? gradientColor.start : 'white'}
                      stroke={gradientColor.start}
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                    />
                  )
                }}
                activeDot={{
                  r: 6,
                  fill: gradientColor.start,
                  stroke: 'white',
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
