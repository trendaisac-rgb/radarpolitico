/**
 * RadarPolítico - Network Card Profissional
 * Card de métricas por rede social com publicações clicáveis
 */

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, TrendingDown, Minus, ExternalLink,
  ChevronDown, ChevronUp, Eye, Heart, MessageCircle, Share2
} from 'lucide-react'

// Tipos
export interface SocialPost {
  id: string
  platform: string
  author?: string
  authorHandle?: string
  content: string
  url: string
  publishedAt: string
  likes?: number
  comments?: number
  shares?: number
  views?: number
  sentiment?: 'positivo' | 'negativo' | 'neutro'
  thumbnail?: string
}

export interface NetworkMetrics {
  mencoes?: number
  sentimento_positivo?: number
  sentimento_negativo?: number
  sentimento_neutro?: number
  score?: number
  engajamento?: number
  alcance?: number
  tendencia?: 'subindo' | 'descendo' | 'estavel'
  variacao_percentual?: number
  posts?: SocialPost[]
  source?: string // Fonte dos dados (Nitter, Apify, Demo, YouTube API)
}

interface NetworkCardProps {
  rede: string
  data: NetworkMetrics
  icon: string
  showPosts?: boolean
  maxPosts?: number
}

const networkLabels: Record<string, string> = {
  midia: 'Mídia e Notícias',
  youtube: 'YouTube'
}

const networkColors: Record<string, string> = {
  midia: 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20',
  youtube: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20'
}

const networkIconColors: Record<string, string> = {
  midia: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  youtube: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
}

export function NetworkCard({ rede, data, icon, showPosts = true, maxPosts = 3 }: NetworkCardProps) {
  const [expanded, setExpanded] = useState(false)

  const label = networkLabels[rede] || rede
  const colorClass = networkColors[rede] || 'border-l-4 border-l-gray-400'
  const iconColorClass = networkIconColors[rede] || 'bg-gray-100 text-gray-600'

  const mencoes = data.mencoes || 0
  const positivo = data.sentimento_positivo || 0
  const negativo = data.sentimento_negativo || 0
  const neutro = data.sentimento_neutro || 0
  const score = data.score || 50
  const tendencia = data.tendencia
  const variacao = data.variacao_percentual || 0
  const posts = data.posts || []
  const source = data.source

  // Configuração de badges de fonte
  const sourceConfig: Record<string, { label: string; color: string }> = {
    'YouTube API': { label: 'Ao vivo', color: 'bg-green-100 text-green-700 border-green-200' },
    'Google News': { label: 'Ao vivo', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'Demo': { label: 'Demo', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  }

  // Calcula porcentagens
  const total = positivo + negativo + neutro
  const posPercent = total > 0 ? Math.round((positivo / total) * 100) : 0
  const negPercent = total > 0 ? Math.round((negativo / total) * 100) : 0

  // Cor do score
  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-green-600'
    if (s >= 50) return 'text-yellow-600'
    if (s >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBg = (s: number) => {
    if (s >= 70) return 'bg-green-50 dark:bg-green-900/20'
    if (s >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20'
    if (s >= 30) return 'bg-orange-50 dark:bg-orange-900/20'
    return 'bg-red-50 dark:bg-red-900/20'
  }

  const displayPosts = expanded ? posts : posts.slice(0, maxPosts)
  const hasMorePosts = posts.length > maxPosts

  return (
    <Card className={`${colorClass} shadow-sm hover:shadow-md transition-all overflow-hidden`}>
      <CardContent className="p-5">
        {/* Header - mais clean */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${iconColorClass}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-base">{label}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {mencoes > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {mencoes} {mencoes === 1 ? 'menção' : 'menções'}
                  </span>
                )}
                {source && sourceConfig[source] && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${sourceConfig[source].color}`}
                  >
                    {sourceConfig[source].label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className={`px-3 py-2 rounded-lg text-center ${getScoreBg(score)}`}>
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</span>
          </div>
        </div>

        {/* Barra de sentimento - mais clean */}
        {total > 0 && (
          <div className="mb-4">
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              {posPercent > 0 && (
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${posPercent}%` }}
                />
              )}
              {negPercent > 0 && (
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${negPercent}%` }}
                />
              )}
              <div className="bg-gray-300 dark:bg-gray-600 flex-1" />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {positivo} positivas
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                {neutro} neutras
              </span>
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {negativo} negativas
              </span>
            </div>
          </div>
        )}

        {/* Engajamento - para YouTube */}
        {data.engajamento !== undefined && data.engajamento > 0 && (
          <div className="flex items-center justify-between text-sm mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizações totais
            </span>
            <span className="font-bold text-lg">{formatNumber(data.engajamento)}</span>
          </div>
        )}

        {/* Lista de Publicações */}
        {showPosts && posts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Destaques
            </p>

            {displayPosts.map((post, index) => (
              <PostItem key={post.id || index} post={post} />
            ))}

            {/* Botão expandir */}
            {hasMorePosts && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs mt-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Ver {posts.length - maxPosts} mais
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Estado vazio - mais amigável */}
        {mencoes === 0 && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-3">
              <span className="text-2xl opacity-50">{icon}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma menção encontrada
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Atualizar Dados" para buscar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente de item de publicação - clean
function PostItem({ post }: { post: SocialPost }) {
  const sentimentConfig = {
    positivo: { dot: 'bg-green-500', text: 'text-green-600' },
    negativo: { dot: 'bg-red-500', text: 'text-red-600' },
    neutro: { dot: 'bg-gray-400', text: 'text-gray-500' }
  }

  const sentiment = post.sentiment || 'neutro'
  const config = sentimentConfig[sentiment]

  const openPost = () => {
    if (post.url) {
      window.open(post.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className="p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-pointer group"
      onClick={openPost}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail para vídeos */}
        {post.thumbnail && (
          <img
            src={post.thumbnail}
            alt=""
            className="w-16 h-10 rounded object-cover shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Título/Conteúdo */}
          <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {post.content}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {/* Autor/Fonte */}
            {post.author && (
              <span className="truncate max-w-[120px]">{post.author}</span>
            )}

            {/* Sentimento */}
            <span className={`flex items-center gap-1 ${config.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {sentiment}
            </span>

            {/* Views (para YouTube) */}
            {post.views !== undefined && post.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatNumber(post.views)}
              </span>
            )}
          </div>
        </div>

        {/* Link externo */}
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
      </div>
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

export default NetworkCard
