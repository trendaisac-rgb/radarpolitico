/**
 * RadarPolítico - Insights Section
 * Seção de resumo e recomendações com análise de IA
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Lightbulb, FileText, CheckCircle2, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react'

export interface Risk {
  level?: 'alto' | 'medio' | 'baixo'
  severity?: 'alto' | 'medio' | 'baixo'
  description: string
  recommendation?: string
  action?: string
}

export interface InsightsSectionProps {
  sumario?: string | null
  recomendacoes?: string[] | null
  summary?: string | null
  recommendations?: string[] | null
  risks?: Risk[] | null
  opportunities?: string[] | null
  isLoading?: boolean
  isAIGenerated?: boolean
}

export function InsightsSection({
  sumario,
  recomendacoes,
  summary,
  recommendations,
  risks,
  opportunities,
  isLoading,
  isAIGenerated
}: InsightsSectionProps) {
  const resolvedSumario = sumario || summary || null
  const resolvedRecomendacoes = recomendacoes || recommendations || null
  const hasContent = resolvedSumario || (resolvedRecomendacoes && resolvedRecomendacoes.length > 0)

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
          <h3 className="font-medium text-muted-foreground mb-2">
            {isAIGenerated === undefined ? 'Analisando com IA...' : 'Carregando insights...'}
          </h3>
          <p className="text-sm text-muted-foreground">
            A inteligência artificial está processando os dados
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!hasContent) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-medium text-muted-foreground mb-2">
            Análise em processamento
          </h3>
          <p className="text-sm text-muted-foreground">
            Os insights serão gerados após coletar dados suficientes.
          </p>
        </CardContent>
      </Card>
    )
  }

  const riskColors = {
    alto: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    medio: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    baixo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  }

  return (
    <div className="space-y-6">
      {/* Badge de IA */}
      {isAIGenerated && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary">
            <Sparkles className="h-3 w-3 mr-1" />
            Análise gerada por IA
          </Badge>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resumo */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resolvedSumario ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {resolvedSumario}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Resumo não disponível
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recomendações */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resolvedRecomendacoes && resolvedRecomendacoes.length > 0 ? (
              <ul className="space-y-3">
                {resolvedRecomendacoes.slice(0, 5).map((rec, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma recomendação no momento
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riscos e Oportunidades - só mostra se tiver dados da IA */}
      {(risks && risks.length > 0) || (opportunities && opportunities.length > 0) ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Riscos */}
          {risks && risks.length > 0 && (
            <Card className="shadow-lg border-red-200 dark:border-red-900/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Pontos de Atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {risks.slice(0, 3).map((risk, index) => {
                    const riskLevel = risk.level || risk.severity || 'medio'
                    const riskAction = risk.recommendation || risk.action || ''
                    return (
                      <li key={index} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Badge className={riskColors[riskLevel]} variant="secondary">
                            {riskLevel.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex-1">
                            {risk.description}
                          </span>
                        </div>
                        {riskAction && (
                          <p className="text-xs text-muted-foreground/70 ml-16 italic">
                            {riskAction}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Oportunidades */}
          {opportunities && opportunities.length > 0 && (
            <Card className="shadow-lg border-green-200 dark:border-green-900/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Oportunidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {opportunities.slice(0, 4).map((opp, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{opp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Gera insights automáticos baseado nos dados
 */
export function generateInsights(
  score: number,
  mencoes: number,
  positivas: number,
  negativas: number,
  networks: Record<string, any>
): { sumario: string; recomendacoes: string[] } {
  const recomendacoes: string[] = []
  let sumario = ''

  // Análise do score
  if (score >= 70) {
    sumario = `Excelente performance! Seu score de imagem está em ${score} pontos, indicando uma percepção muito positiva na mídia e redes sociais.`
  } else if (score >= 50) {
    sumario = `Performance estável. Seu score de ${score} pontos indica uma imagem equilibrada, com oportunidades de melhoria.`
  } else if (score >= 30) {
    sumario = `Atenção necessária. O score de ${score} pontos sugere um momento delicado que requer ação estratégica.`
  } else {
    sumario = `Situação crítica. Com score de ${score} pontos, é urgente implementar ações de recuperação de imagem.`
  }

  // Adiciona contexto de menções
  const total = positivas + negativas + (mencoes - positivas - negativas)
  if (mencoes > 0) {
    const posPercent = Math.round((positivas / mencoes) * 100)
    sumario += ` Foram registradas ${mencoes} menções, sendo ${posPercent}% positivas.`
  }

  // Recomendações baseadas na análise
  if (negativas > positivas) {
    recomendacoes.push('Priorize responder às críticas mais relevantes de forma construtiva')
    recomendacoes.push('Considere uma nota oficial esclarecendo pontos controversos')
  }

  if (score < 50) {
    recomendacoes.push('Aumente a presença em pautas positivas e realizações')
    recomendacoes.push('Fortaleça a comunicação com a base de apoiadores')
  }

  // Análise por rede
  const youtubeData = networks['youtube']
  if (youtubeData && youtubeData.mencoes > 5) {
    recomendacoes.push('YouTube está ativo - considere gravar conteúdo próprio para engajar')
  }

  const twitterData = networks['twitter']
  if (twitterData && twitterData.sentimento_negativo > twitterData.sentimento_positivo) {
    recomendacoes.push('Twitter/X tem viés negativo - monitore e responda estrategicamente')
  }

  // Recomendação padrão se não houver outras
  if (recomendacoes.length === 0) {
    recomendacoes.push('Continue monitorando diariamente para identificar tendências')
    recomendacoes.push('Mantenha presença ativa nas redes sociais')
  }

  return { sumario, recomendacoes }
}
