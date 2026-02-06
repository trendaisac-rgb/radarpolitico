/**
 * RadarPolítico - Ranking de Concorrentes
 * Compara o político com seus adversários
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Medal, TrendingUp, TrendingDown, Crown, Users } from 'lucide-react'

interface Competitor {
  id: number
  name: string
  party: string
  score: number
  mentions: number
  trend: 'up' | 'down' | 'stable'
  isMain?: boolean // É o político principal sendo monitorado
}

interface CompetitorRankingProps {
  competitors: Competitor[]
  title?: string
}

export function CompetitorRanking({ competitors, title = "Ranking na Mídia" }: CompetitorRankingProps) {
  // Ordena por score
  const sorted = [...competitors].sort((a, b) => b.score - a.score)

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Crown className="h-5 w-5 text-yellow-500" />
    if (position === 1) return <Medal className="h-5 w-5 text-gray-400" />
    if (position === 2) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-bold text-muted-foreground">{position + 1}º</span>
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const mainPolitician = sorted.find(c => c.isMain)
  const mainPosition = sorted.findIndex(c => c.isMain) + 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            {title}
          </CardTitle>
          {mainPolitician && (
            <Badge variant={mainPosition === 1 ? 'default' : 'secondary'}>
              {mainPosition === 1 ? '🥇 Líder!' : `${mainPosition}º lugar`}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {sorted.length > 0 ? (
          <div className="space-y-4">
            {sorted.map((competitor, index) => (
              <div
                key={competitor.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  competitor.isMain
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
              >
                {/* Posição */}
                <div className="w-8 flex justify-center">
                  {getMedalIcon(index)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${competitor.isMain ? 'text-primary' : ''}`}>
                      {competitor.name}
                    </span>
                    {competitor.isMain && (
                      <Badge variant="outline" className="text-xs">Você</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{competitor.party}</span>
                    <span>•</span>
                    <span>{competitor.mentions} menções</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold">{competitor.score}</span>
                    {competitor.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {competitor.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="w-20 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreColor(competitor.score)}`}
                      style={{ width: `${competitor.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum concorrente cadastrado</p>
            <p className="text-sm">Adicione adversários para comparar</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Gera dados de exemplo para demonstração
export function generateMockCompetitors(mainPolitician: { name: string; party: string }): Competitor[] {
  const opponents = [
    { name: 'Maria Santos', party: 'PT' },
    { name: 'José Oliveira', party: 'PL' },
    { name: 'Ana Rodrigues', party: 'MDB' },
  ]

  const competitors: Competitor[] = [
    {
      id: 1,
      name: mainPolitician.name,
      party: mainPolitician.party || 'PARTIDO',
      score: Math.floor(Math.random() * 30) + 60,
      mentions: Math.floor(Math.random() * 50) + 20,
      trend: 'up',
      isMain: true
    },
    ...opponents.map((opp, i) => ({
      id: i + 2,
      name: opp.name,
      party: opp.party,
      score: Math.floor(Math.random() * 40) + 40,
      mentions: Math.floor(Math.random() * 40) + 10,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      isMain: false
    }))
  ]

  return competitors
}
