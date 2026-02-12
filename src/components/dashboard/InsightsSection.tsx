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
  // Novos campos para análise profunda
  historiaDoDia?: string | null
  fatosRelevantes?: string[] | null
}

export function InsightsSection({
  sumario,
  recomendacoes,
  summary,
  recommendations,
  risks,
  opportunities,
  isLoading,
  isAIGenerated,
  historiaDoDia,
  fatosRelevantes
}: InsightsSectionProps) {
  const resolvedSumario = sumario || summary || null
  const resolvedRecomendacoes = recomendacoes || recommendations || null
  const hasContent = resolvedSumario || (resolvedRecomendacoes && resolvedRecomendacoes.length > 0) || historiaDoDia

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

      {/* História do Dia - Destaque Principal */}
      {historiaDoDia && (
        <Card className="shadow-lg border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                  História do Dia
                </p>
                <p className="text-lg font-semibold leading-snug">
                  {historiaDoDia}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fatos Relevantes */}
      {fatosRelevantes && fatosRelevantes.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Fatos Citados na Mídia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {fatosRelevantes.slice(0, 5).map((fato, index) => (
                <li key={index} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary font-medium">•</span>
                  <span>{fato}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resumo */}
        <Card className="shadow-lg md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Briefing Executivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resolvedSumario ? (
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {resolvedSumario}
              </div>
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
  const neutras = mencoes - positivas - negativas
  const posPercent = mencoes > 0 ? Math.round((positivas / mencoes) * 100) : 0
  const negPercent = mencoes > 0 ? Math.round((negativas / mencoes) * 100) : 0

  // Resumo executivo completo (estilo analista político sênior)
  let sumario = ''

  if (mencoes === 0) {
    sumario = `Não foram identificadas menções relevantes no período analisado. A ausência de cobertura pode indicar baixa exposição midiática — recomenda-se avaliar a estratégia de comunicação para garantir visibilidade adequada.`
    recomendacoes.push('Considerar ações de assessoria de imprensa para gerar visibilidade na mídia')
    recomendacoes.push('Avaliar oportunidades de posicionamento em temas de interesse público')
    return { sumario, recomendacoes }
  }

  // Panorama
  sumario = `PANORAMA: Foram registradas ${mencoes} menções no período — ${positivas} positivas (${posPercent}%), ${negativas} negativas (${negPercent}%) e ${neutras} neutras. `

  // Score e imagem
  if (score >= 70) {
    sumario += `O score de percepção pública está em ${score}/100, refletindo uma imagem fortalecida e cobertura predominantemente favorável. O capital político encontra-se em alta, com a narrativa midiática trabalhando a favor da imagem. `
  } else if (score >= 50) {
    sumario += `O score de percepção está em ${score}/100, indicando estabilidade na imagem pública. A cobertura é equilibrada, sem grandes ameaças, porém também sem ganhos expressivos. Há espaço para ações proativas que elevem a percepção. `
  } else if (score >= 30) {
    sumario += `O score de ${score}/100 indica desgaste na percepção pública. A predominância de cobertura crítica sinaliza vulnerabilidade que precisa ser endereçada com estratégia de comunicação direcionada. `
  } else {
    sumario += `ALERTA: O score de ${score}/100 indica situação crítica de imagem. A concentração de menções negativas representa risco significativo e demanda resposta coordenada e imediata da equipe de comunicação. `
  }

  // Análise por rede
  const youtubeData = networks['youtube']
  const midiaData = networks['midia']

  if (midiaData && midiaData.mencoes > 0) {
    sumario += `Na mídia tradicional, foram ${midiaData.mencoes} menções — acompanhar a evolução é essencial para antecipar tendências. `
  }
  if (youtubeData && youtubeData.mencoes > 0) {
    const ytTom = youtubeData.sentimento_positivo > youtubeData.sentimento_negativo ? 'favorável' : youtubeData.sentimento_negativo > youtubeData.sentimento_positivo ? 'crítico' : 'equilibrado'
    sumario += `No YouTube, ${youtubeData.mencoes} vídeos com tom predominantemente ${ytTom}. `
  }

  // Recomendações estratégicas
  if (negativas > positivas) {
    recomendacoes.push('Priorizar gestão das menções negativas — avaliar necessidade de posicionamento público ou nota de esclarecimento')
    recomendacoes.push('Mapear os veículos com cobertura mais crítica e preparar abordagem estratégica')
  }

  if (score < 50) {
    recomendacoes.push('Intensificar ações de comunicação positiva — pautar realizações, projetos e resultados concretos')
    recomendacoes.push('Fortalecer presença em canais próprios para construir narrativa favorável independente da mídia')
  }

  if (score >= 70) {
    recomendacoes.push('Capitalizar o momento favorável — lançar propostas, projetos ou posicionamentos estratégicos')
    recomendacoes.push('Amplificar as menções positivas nos canais próprios como prova social')
  }

  if (youtubeData && youtubeData.mencoes > 3) {
    if (youtubeData.sentimento_positivo > youtubeData.sentimento_negativo) {
      recomendacoes.push('YouTube com tom favorável — aproveitar para produzir e amplificar conteúdo em vídeo')
    } else if (youtubeData.sentimento_negativo > youtubeData.sentimento_positivo) {
      recomendacoes.push('Vídeos com tom crítico detectados no YouTube — avaliar se requerem resposta ou monitoramento intensificado')
    }
  }

  if (midiaData && midiaData.mencoes > 5) {
    recomendacoes.push('Cobertura midiática ativa — monitorar evolução ao longo do dia para antecipar desdobramentos')
  }

  if (recomendacoes.length === 0) {
    recomendacoes.push('Manter monitoramento diário para identificar tendências e oportunidades de posicionamento')
    recomendacoes.push('Avaliar oportunidades de pauta para os próximos dias com base nos temas em evidência')
  }

  return { sumario, recomendacoes }
}
