/**
 * RadarPolítico - Insights Section
 * Seção de resumo e recomendações
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Lightbulb, FileText, CheckCircle2 } from 'lucide-react'

export interface InsightsSectionProps {
  sumario?: string | null
  recomendacoes?: string[] | null
  summary?: string | null
  recommendations?: string[] | null
  isLoading?: boolean
}

export function InsightsSection({ sumario, recomendacoes, summary, recommendations, isLoading }: InsightsSectionProps) {
  const resolvedSumario = sumario || summary || null
  const resolvedRecomendacoes = recomendacoes || recommendations || null
  const hasContent = resolvedSumario || (resolvedRecomendacoes && resolvedRecomendacoes.length > 0)

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50 animate-pulse" />
          <h3 className="font-medium text-muted-foreground mb-2">Carregando insights...</h3>
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

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Resumo */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Resumo do Dia
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
              {resolvedRecomendacoes.map((rec, index) => (
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
