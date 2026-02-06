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
}

interface NetworkCardProps {
  rede: string
  data: NetworkMetrics
  icon: string
  showPosts?: boolean
  maxPosts?: number
}

const networkLabels: Record<string, string> = {
  midia: 'Mídia Online',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  facebook: 'Facebook'
}

const networkColors: Record<string, string> = {
  midia: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  youtube: 'from-red-500/20 to-red-600/5 border-red-500/30',
  twitter: 'from-sky-500/20 to-sky-600/5 border-sky-500/30',
  instagram: 'from-pink-500/20 to-purple-600/5 border-pink-500/30',
  tiktok: 'from-slate-500/20 to-slate-600/5 border-slate-500/30',
  telegram: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
  facebook: 'from-blue-600/20 to-blue-700/5 border-blue-600/30'
}

export function NetworkCard({ rede, data, icon, showPosts = true, maxPosts = 3 }: NetworkCardProps) {
  const [expanded, setExpanded] = useState(false)

  const label = networkLabels[rede] || rede
  const colorClass = networkColors[rede] || 'from-gray-500/20 to-gray-600/5 border-gray-500/30'

  const mencoes = data.mencoes || 0
  const positivo = data.sentimento_positivo || 0
  const negativo = data.sentimento_negativo || 0
  const neutro = data.sentimento_neutro || 0
  const score = data.score || 50
  const tendencia = data.tendencia
  const variacao = data.variacao_percentual || 0
  const posts = data.posts || []

  // Calcula porcentagens
  const total = positivo + negativo + neutro
  const posPercent = total > 0 ? Math.round((positivo / total) * 100) : 0
  const negPercent = total > 0 ? Math.round((negativo / total) * 100) : 0

  // Cor do score
  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-green-500'
    if (s >= 50) return 'text-yellow-500'
    if (s >= 30) return 'text-orange-500'
    return 'text-red-500'
  }

  const displayPosts = expanded ? posts : posts.slice(0, maxPosts)
  const hasMorePosts = posts.length > maxPosts

  return (
    <Card className={`bg-gradient-to-br ${colorClass} border shadow-sm hover:shadow-md transition-all`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <span className="font-semibold">{label}</span>
              {mencoes > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  {mencoes} menções
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            {tendencia && (
              <span className={`flex items-center justify-end text-xs ${
                tendencia === 'subindo' ? 'text-green-500' :
                tendencia === 'descendo' ? 'text-red-500' :
                'text-muted-foreground'
              }`}>
                {tendencia === 'subindo' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                {tendencia === 'descendo' && <TrendingDown className="h-3 w-3 mr-0.5" />}
                {tendencia === 'estavel' && <Minus className="h-3 w-3 mr-0.5" />}
                {variacao > 0 ? '+' : ''}{variacao}%
              </span>
            )}
          </div>
        </div>

        {/* Barra de sentimento */}
        {total > 0 && (
          <div className="space-y-1 mb-3">
            <div className="flex h-2 rounded-full overflow-hidden bg-muted/30">
              {posPercent > 0 && (
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${posPercent}%` }}
                />
              )}
              {negPercent > 0 && (
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${negPercent}%` }}
                />
              )}
              <div className="bg-gray-400 flex-1" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-green-600">+{positivo}</span>
              <span className="text-red-600">-{negativo}</span>
              <span className="text-gray-500">○{neutro}</span>
            </div>
          </div>
        )}

        {/* Engajamento */}
        {data.engajamento !== undefined && data.engajamento > 0 && (
          <div className="flex items-center justify-between text-sm mb-3 py-2 border-y border-border/30">
            <span className="text-muted-foreground">Engajamento total</span>
            <span className="font-semibold">{formatNumber(data.engajamento)}</span>
          </div>
        )}

        {/* Lista de Publicações */}
        {showPosts && posts.length > 0 && (
          <div className="space-y-2 mt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Principais publicações
            </p>

            {displayPosts.map((post, index) => (
              <PostItem key={post.id || index} post={post} />
            ))}

            {/* Botão expandir */}
            {hasMorePosts && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Ver mais {posts.length - maxPosts} publicações
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Estado vazio */}
        {mencoes === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhuma menção encontrada
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Componente de item de publicação
function PostItem({ post }: { post: SocialPost }) {
  const sentimentColors = {
    positivo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    negativo: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    neutro: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  const openPost = () => {
    if (post.url) {
      window.open(post.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className="p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
      onClick={openPost}
    >
      <div className="flex items-start gap-2">
        {/* Thumbnail se existir */}
        {post.thumbnail && (
          <img
            src={post.thumbnail}
            alt=""
            className="w-12 h-12 rounded object-cover shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Autor */}
          {post.author && (
            <p className="text-xs font-medium truncate">
              {post.author}
              {post.authorHandle && (
                <span className="text-muted-foreground ml-1">@{post.authorHandle}</span>
              )}
            </p>
          )}

          {/* Conteúdo */}
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {post.content}
          </p>

          {/* Métricas */}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {post.views !== undefined && (
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {formatNumber(post.views)}
              </span>
            )}
            {post.likes !== undefined && (
              <span className="flex items-center gap-0.5">
                <Heart className="h-3 w-3" />
                {formatNumber(post.likes)}
              </span>
            )}
            {post.comments !== undefined && (
              <span className="flex items-center gap-0.5">
                <MessageCircle className="h-3 w-3" />
                {formatNumber(post.comments)}
              </span>
            )}
            {post.shares !== undefined && (
              <span className="flex items-center gap-0.5">
                <Share2 className="h-3 w-3" />
                {formatNumber(post.shares)}
              </span>
            )}
          </div>
        </div>

        {/* Badge de sentimento e link */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {post.sentiment && (
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${sentimentColors[post.sentiment]}`}>
              {post.sentiment}
            </Badge>
          )}
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
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
