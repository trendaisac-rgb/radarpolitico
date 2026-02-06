/**
 * RadarPolítico - Relatório Diário Clean
 * Componente de relatório estilo card profissional
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp, TrendingDown, Minus, ExternalLink,
  FileText, Lightbulb, Clock, Download, Share2
} from 'lucide-react'

interface TopNews {
  id: string
  title: string
  source: string
  sentiment: 'positivo' | 'negativo' | 'neutro'
  url: string
}

interface DailyReportProps {
  politicianName: string
  party?: string
  cargo?: string
  date: string
  time?: string
  totalMentions: number
  sentimentScore: number // 1-10
  alertLevel: 'verde' | 'amarelo' | 'vermelho'
  alertMessage: string
  summary: string
  topNews: TopNews[]
  aiRecommendation: string
  onExportPDF?: () => void
  onShare?: () => void
}

export function DailyReport({
  politicianName,
  party,
  cargo,
  date,
  time = '08:00',
  totalMentions,
  sentimentScore,
  alertLevel,
  alertMessage,
  summary,
  topNews,
  aiRecommendation,
  onExportPDF,
  onShare
}: DailyReportProps) {
  const sentimentLabel = sentimentScore >= 7 ? 'POSITIVO' : sentimentScore >= 4 ? 'NEUTRO' : 'NEGATIVO'
  const sentimentColor = sentimentScore >= 7 ? 'text-green-600' : sentimentScore >= 4 ? 'text-yellow-600' : 'text-red-600'
  const sentimentBg = sentimentScore >= 7 ? 'bg-green-500' : sentimentScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'

  const alertConfig = {
    verde: { bg: 'bg-green-100', text: 'text-green-700', label: 'VERDE' },
    amarelo: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'AMARELO' },
    vermelho: { bg: 'bg-red-100', text: 'text-red-700', label: 'VERMELHO' }
  }

  const getSentimentIcon = (s: string) => {
    if (s === 'positivo') return <TrendingUp className="h-4 w-4 text-green-500" />
    if (s === 'negativo') return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg border-0 overflow-hidden">
      {/* Header Verde */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">RADAR POLÍTICO</h1>
              <p className="text-emerald-200 text-sm">Relatório Diário - {date}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-200">Gerado às</p>
            <p className="font-bold">{time}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Info do Político */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">Monitorando</p>
              <h2 className="text-xl font-bold">{politicianName}</h2>
              {(party || cargo) && (
                <p className="text-sm text-muted-foreground">
                  {party}{cargo && ` - ${cargo}`}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Menções hoje</p>
              <p className="text-3xl font-bold text-primary">{totalMentions}</p>
            </div>
          </div>
        </div>

        {/* Sentimento e Alerta */}
        <div className="grid grid-cols-2 border-b">
          {/* Sentimento */}
          <div className="p-4 border-r">
            <p className="text-xs text-muted-foreground mb-2">Sentimento Geral</p>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${sentimentBg}`}></span>
              <span className={`font-bold ${sentimentColor}`}>{sentimentLabel}</span>
            </div>
            {/* Barra de progresso */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${sentimentBg} transition-all`}
                  style={{ width: `${sentimentScore * 10}%` }}
                />
              </div>
              <span className="text-sm font-medium">+{sentimentScore}/10</span>
            </div>
          </div>

          {/* Alerta de Crise */}
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Alerta de Crise</p>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${alertConfig[alertLevel].bg.replace('100', '500')}`}></span>
              <span className={`font-bold ${alertConfig[alertLevel].text}`}>
                {alertConfig[alertLevel].label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{alertMessage}</p>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="p-4 border-b bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Resumo Executivo</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Top 3 Notícias */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Top 3 Notícias do Dia</h3>
          </div>
          <div className="space-y-3">
            {topNews.slice(0, 3).map((news, idx) => (
              <a
                key={news.id}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2"
              >
                <div className="mt-0.5">
                  {getSentimentIcon(news.sentiment)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {news.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{news.source}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* Recomendação da IA */}
        <div className="p-4 bg-amber-50 border-b">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Lightbulb className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-amber-800">Recomendação da IA</h3>
              <p className="text-sm text-amber-700 mt-1">
                {aiRecommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="p-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Atualizado em {date} às {time}</span>
          </div>
          <div className="flex items-center gap-2">
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="h-3 w-3 mr-1" />
                Compartilhar
              </Button>
            )}
            {onExportPDF && (
              <Button size="sm" onClick={onExportPDF}>
                <Download className="h-3 w-3 mr-1" />
                Exportar PDF
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DailyReport
